export type RestaurantInfo = {
  isRestaurant: boolean;
  name: string | null;
  priceLevelLabel: string | null;
  priceRangeText: string | null;
  primaryType: string | null;
};

type Money = { currencyCode?: string; units?: string };

type PlacesResponse = {
  displayName?: { text?: string };
  types?: string[];
  primaryType?: string;
  priceLevel?: string;
  priceRange?: {
    startPrice?: Money;
    endPrice?: Money;
  };
};

const RESTAURANT_TYPES = new Set([
  "restaurant",
  "cafe",
  "bar",
  "bakery",
  "meal_takeaway",
  "meal_delivery",
  "food",
  "japanese_restaurant",
  "ramen_restaurant",
  "sushi_restaurant",
]);

const PRICE_LEVEL_LABELS: Record<string, string> = {
  PRICE_LEVEL_FREE: "무료",
  PRICE_LEVEL_INEXPENSIVE: "저렴 ($)",
  PRICE_LEVEL_MODERATE: "보통 ($$)",
  PRICE_LEVEL_EXPENSIVE: "비쌈 ($$$)",
  PRICE_LEVEL_VERY_EXPENSIVE: "고급 ($$$$)",
};

function formatMoney(m?: Money): string | null {
  if (!m?.units) return null;
  const amount = Number(m.units);
  if (!Number.isFinite(amount)) return null;
  const code = m.currencyCode ?? "JPY";
  if (code === "JPY") return `¥${amount.toLocaleString("ja-JP")}`;
  return `${code} ${amount.toLocaleString()}`;
}

function formatPriceRange(range?: PlacesResponse["priceRange"]): string | null {
  if (!range) return null;
  const start = formatMoney(range.startPrice);
  const end = formatMoney(range.endPrice);
  if (start && end) return `${start} ~ ${end}`;
  return start ?? end;
}

function isRestaurantType(types: string[] | undefined, primaryType?: string): boolean {
  if (primaryType && RESTAURANT_TYPES.has(primaryType)) return true;
  return (types ?? []).some((t) => RESTAURANT_TYPES.has(t));
}

export type NearbyRestaurant = {
  name: string;
  rating: number | null;
  reviewCount: number | null;
  address: string | null;
};

type NearbyPlace = {
  displayName?: { text?: string };
  rating?: number;
  userRatingCount?: number;
  formattedAddress?: string;
};

export async function fetchNearbyRestaurants(
  latitude: number,
  longitude: number,
  radiusMeters = 1000
): Promise<NearbyRestaurant[]> {
  const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY ?? "";
  if (!apiKey.startsWith("AIza")) return [];

  const response = await fetch(
    "https://places.googleapis.com/v1/places:searchNearby",
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Goog-Api-Key": apiKey,
        "X-Goog-FieldMask":
          "places.displayName,places.rating,places.userRatingCount,places.formattedAddress",
      },
      body: JSON.stringify({
        includedTypes: ["restaurant"],
        maxResultCount: 20,
        rankPreference: "POPULARITY",
        locationRestriction: {
          circle: {
            center: { latitude, longitude },
            radius: radiusMeters,
          },
        },
      }),
    }
  );

  if (!response.ok) return [];

  const data = (await response.json()) as { places?: NearbyPlace[] };
  const ranked = (data.places ?? [])
    .map((p) => ({
      name: p.displayName?.text ?? "이름 없음",
      rating: p.rating ?? null,
      reviewCount: p.userRatingCount ?? null,
      address: p.formattedAddress ?? null,
    }))
    .filter((p) => p.rating != null)
    .sort((a, b) => (b.rating ?? 0) - (a.rating ?? 0));

  return ranked.slice(0, 3);
}

export async function fetchRestaurantInfo(
  googlePlaceId: string | null
): Promise<RestaurantInfo | null> {
  if (!googlePlaceId) return null;

  const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY ?? "";
  if (!apiKey.startsWith("AIza")) return null;

  const response = await fetch(
    `https://places.googleapis.com/v1/places/${googlePlaceId}`,
    {
      headers: {
        "X-Goog-Api-Key": apiKey,
        "X-Goog-FieldMask":
          "displayName,types,primaryType,priceLevel,priceRange",
      },
    }
  );

  if (!response.ok) return null;

  const data = (await response.json()) as PlacesResponse;
  const types = data.types ?? [];
  const isRestaurant = isRestaurantType(types, data.primaryType);

  if (!isRestaurant) return null;

  return {
    isRestaurant: true,
    name: data.displayName?.text ?? null,
    priceLevelLabel: data.priceLevel
      ? (PRICE_LEVEL_LABELS[data.priceLevel] ?? data.priceLevel)
      : null,
    priceRangeText: formatPriceRange(data.priceRange),
    primaryType: data.primaryType ?? null,
  };
}
