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
