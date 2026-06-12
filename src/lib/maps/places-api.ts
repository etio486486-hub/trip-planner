import { toKoreanReading } from "@/lib/japanese-reading";

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

/** places/ChIJ... → ChIJ... */
export function normalizePlaceId(placeId: string): string {
  return placeId.startsWith("places/") ? placeId.slice("places/".length) : placeId;
}

function placeDetailsUrl(placeId: string): string {
  const id = encodeURIComponent(normalizePlaceId(placeId));
  return `https://places.googleapis.com/v1/places/${id}`;
}

export function buildGoogleMapsPlaceUrl(
  placeId: string,
  name?: string
): string {
  const id = normalizePlaceId(placeId);
  const query = name ? encodeURIComponent(name) : "";
  return `https://www.google.com/maps/search/?api=1&query=${query}&query_place_id=${encodeURIComponent(id)}`;
}

const DETAILS_FIELD_MASK_BASIC =
  "id,displayName,formattedAddress,googleMapsUri,primaryType,types";

const DETAILS_FIELD_MASK_FULL =
  "id,displayName,formattedAddress,googleMapsUri,primaryType,types,rating,userRatingCount,nationalPhoneNumber,websiteUri,regularOpeningHours.weekdayDescriptions,currentOpeningHours.openNow,priceLevel,priceRange";

function mapPlaceDetails(
  data: PlaceDetailsResponse,
  placeId: string
): RestaurantPlaceDetails {
  const name = data.displayName?.text ?? "이름 없음";
  const hours = data.regularOpeningHours?.weekdayDescriptions;

  return {
    placeId: data.id ?? placeId,
    name,
    nameReadingKo: toKoreanReading(name),
    rating: data.rating ?? null,
    reviewCount: data.userRatingCount ?? null,
    address: data.formattedAddress ?? null,
    phone: data.nationalPhoneNumber ?? null,
    googleMapsUri:
      data.googleMapsUri ?? buildGoogleMapsPlaceUrl(placeId, name),
    websiteUri: data.websiteUri ?? null,
    openingHours: hours?.length ? hours.join("\n") : null,
    priceLevelLabel: data.priceLevel
      ? (PRICE_LEVEL_LABELS[data.priceLevel] ?? data.priceLevel)
      : null,
    priceRangeText: formatPriceRange(data.priceRange),
    primaryType: data.primaryType ?? null,
    isOpenNow: data.currentOpeningHours?.openNow ?? null,
  };
}

async function requestPlaceDetails(
  placeId: string,
  fieldMask: string
): Promise<PlaceDetailsResponse | null> {
  const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY ?? "";
  if (!apiKey.startsWith("AIza")) return null;

  const response = await fetch(placeDetailsUrl(placeId), {
    headers: {
      "X-Goog-Api-Key": apiKey,
      "X-Goog-FieldMask": fieldMask,
    },
  });

  if (!response.ok) return null;
  return (await response.json()) as PlaceDetailsResponse;
}

export type NearbyRestaurant = {
  placeId: string;
  name: string;
  nameReadingKo: string | null;
  rating: number | null;
  reviewCount: number | null;
  address: string | null;
};

export type RestaurantPlaceDetails = {
  placeId: string;
  name: string;
  nameReadingKo: string | null;
  rating: number | null;
  reviewCount: number | null;
  address: string | null;
  phone: string | null;
  googleMapsUri: string | null;
  websiteUri: string | null;
  openingHours: string | null;
  priceLevelLabel: string | null;
  priceRangeText: string | null;
  primaryType: string | null;
  isOpenNow: boolean | null;
};

type NearbyPlace = {
  id?: string;
  displayName?: { text?: string };
  rating?: number;
  userRatingCount?: number;
  formattedAddress?: string;
};

type PlaceDetailsResponse = PlacesResponse & {
  id?: string;
  rating?: number;
  userRatingCount?: number;
  formattedAddress?: string;
  nationalPhoneNumber?: string;
  googleMapsUri?: string;
  websiteUri?: string;
  regularOpeningHours?: { weekdayDescriptions?: string[] };
  currentOpeningHours?: { openNow?: boolean };
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
          "places.id,places.displayName,places.rating,places.userRatingCount,places.formattedAddress",
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
    .map((p) => {
      const name = p.displayName?.text ?? "이름 없음";
      return {
        placeId: p.id ?? "",
        name,
        nameReadingKo: toKoreanReading(name),
        rating: p.rating ?? null,
        reviewCount: p.userRatingCount ?? null,
        address: p.formattedAddress ?? null,
      };
    })
    .filter((p) => p.placeId)
    .filter((p) => p.rating != null)
    .sort((a, b) => (b.rating ?? 0) - (a.rating ?? 0));

  return ranked.slice(0, 3);
}

export async function fetchRestaurantPlaceDetails(
  placeId: string,
  preview?: Pick<
    NearbyRestaurant,
    "name" | "rating" | "reviewCount" | "address" | "nameReadingKo"
  >
): Promise<RestaurantPlaceDetails | null> {
  if (!placeId) return null;

  const data =
    (await requestPlaceDetails(placeId, DETAILS_FIELD_MASK_FULL)) ??
    (await requestPlaceDetails(placeId, DETAILS_FIELD_MASK_BASIC));

  if (!data) {
    if (!preview) return null;
    return {
      placeId,
      name: preview.name,
      nameReadingKo: preview.nameReadingKo,
      rating: preview.rating,
      reviewCount: preview.reviewCount,
      address: preview.address,
      phone: null,
      googleMapsUri: buildGoogleMapsPlaceUrl(placeId, preview.name),
      websiteUri: null,
      openingHours: null,
      priceLevelLabel: null,
      priceRangeText: null,
      primaryType: null,
      isOpenNow: null,
    };
  }

  const details = mapPlaceDetails(data, placeId);

  return {
    ...details,
    rating: details.rating ?? preview?.rating ?? null,
    reviewCount: details.reviewCount ?? preview?.reviewCount ?? null,
    address: details.address ?? preview?.address ?? null,
    nameReadingKo: details.nameReadingKo ?? preview?.nameReadingKo ?? null,
  };
}

export async function fetchRestaurantInfo(
  googlePlaceId: string | null
): Promise<RestaurantInfo | null> {
  if (!googlePlaceId) return null;

  const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY ?? "";
  if (!apiKey.startsWith("AIza")) return null;

  const response = await fetch(placeDetailsUrl(googlePlaceId), {
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
