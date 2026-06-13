export type DailyWeather = {
  date: string;
  weatherLabel: string;
  precipMm: number;
  tempMaxC: number;
  isRainy: boolean;
};

const WMO_LABELS: Record<number, string> = {
  0: "맑음",
  1: "대체로 맑음",
  2: "구름 조금",
  3: "흐림",
  45: "안개",
  48: "안개",
  51: "이슬비",
  53: "이슬비",
  55: "이슬비",
  61: "비",
  63: "비",
  65: "폭우",
  71: "눈",
  73: "눈",
  75: "폭설",
  80: "소나기",
  81: "소나기",
  82: "강한 소나기",
  95: "뇌우",
};

function wmoLabel(code: number): string {
  return WMO_LABELS[code] ?? "변덕스러운 날씨";
}

/** Open-Meteo — API 키 불필요 */
export async function fetchTripWeather(
  latitude: number,
  longitude: number,
  forecastDays = 7
): Promise<DailyWeather[]> {
  const url = new URL("https://api.open-meteo.com/v1/forecast");
  url.searchParams.set("latitude", String(latitude));
  url.searchParams.set("longitude", String(longitude));
  url.searchParams.set(
    "daily",
    "weathercode,precipitation_sum,temperature_2m_max"
  );
  url.searchParams.set("timezone", "auto");
  url.searchParams.set("forecast_days", String(forecastDays));

  const res = await fetch(url.toString(), { next: { revalidate: 3600 } });
  if (!res.ok) throw new Error("날씨 정보를 불러오지 못했습니다.");

  const data = (await res.json()) as {
    daily?: {
      time?: string[];
      weathercode?: number[];
      precipitation_sum?: number[];
      temperature_2m_max?: number[];
    };
  };

  const d = data.daily;
  if (!d?.time?.length) return [];

  return d.time.map((date, i) => {
    const code = d.weathercode?.[i] ?? 0;
    const precip = d.precipitation_sum?.[i] ?? 0;
    const temp = d.temperature_2m_max?.[i] ?? 0;
    const isRainy = precip >= 3 || [61, 63, 65, 80, 81, 82, 95].includes(code);

    return {
      date,
      weatherLabel: wmoLabel(code),
      precipMm: precip,
      tempMaxC: temp,
      isRainy,
    };
  });
}
