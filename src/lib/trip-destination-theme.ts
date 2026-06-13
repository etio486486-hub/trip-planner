export type DestinationTheme = {
  emoji: string;
  label: string;
  gradient: string;
  mesh: string;
};

const DESTINATIONS: Array<{
  match: RegExp;
  theme: DestinationTheme;
}> = [
  {
    match: /후쿠오카|fukuoka|福岡/i,
    theme: {
      emoji: "🌊",
      label: "Fukuoka",
      gradient: "from-sky-500 via-blue-600 to-indigo-600",
      mesh: "bg-sky-400/20",
    },
  },
  {
    match: /도쿄|tokyo|東京/i,
    theme: {
      emoji: "🗼",
      label: "Tokyo",
      gradient: "from-rose-500 via-pink-600 to-violet-600",
      mesh: "bg-rose-400/15",
    },
  },
  {
    match: /오사카|osaka|大阪/i,
    theme: {
      emoji: "🏯",
      label: "Osaka",
      gradient: "from-orange-500 via-amber-600 to-red-600",
      mesh: "bg-orange-400/15",
    },
  },
  {
    match: /교토|kyoto|京都/i,
    theme: {
      emoji: "⛩️",
      label: "Kyoto",
      gradient: "from-emerald-500 via-teal-600 to-cyan-600",
      mesh: "bg-emerald-400/15",
    },
  },
  {
    match: /삿포로|sapporo|札幌|홋카이도|hokkaido/i,
    theme: {
      emoji: "🏔️",
      label: "Hokkaido",
      gradient: "from-slate-500 via-blue-600 to-indigo-700",
      mesh: "bg-slate-400/15",
    },
  },
  {
    match: /오키나와|okinawa|沖縄/i,
    theme: {
      emoji: "🏝️",
      label: "Okinawa",
      gradient: "from-cyan-400 via-teal-500 to-emerald-600",
      mesh: "bg-cyan-400/15",
    },
  },
  {
    match: /부산|busan/i,
    theme: {
      emoji: "🌉",
      label: "Busan",
      gradient: "from-blue-500 via-indigo-600 to-violet-600",
      mesh: "bg-blue-400/15",
    },
  },
  {
    match: /제주|jeju/i,
    theme: {
      emoji: "🍊",
      label: "Jeju",
      gradient: "from-orange-400 via-amber-500 to-yellow-500",
      mesh: "bg-amber-400/15",
    },
  },
];

const DEFAULT_THEME: DestinationTheme = {
  emoji: "✈️",
  label: "Trip",
  gradient: "from-blue-600 via-indigo-600 to-violet-600",
  mesh: "bg-indigo-400/15",
};

export function getDestinationTheme(title?: string | null): DestinationTheme {
  if (!title?.trim()) return DEFAULT_THEME;
  for (const { match, theme } of DESTINATIONS) {
    if (match.test(title)) return theme;
  }
  return DEFAULT_THEME;
}

export function formatTripDateRange(start: string, end: string): string {
  try {
    const s = new Date(start + "T12:00:00");
    const e = new Date(end + "T12:00:00");
    const fmt = (d: Date) =>
      d.toLocaleDateString("ko-KR", {
        year: "numeric",
        month: "short",
        day: "numeric",
      });
    return `${fmt(s)} – ${fmt(e)}`;
  } catch {
    return `${start} ~ ${end}`;
  }
}

export function countTripDays(start: string, end: string): number {
  try {
    const s = new Date(start + "T12:00:00");
    const e = new Date(end + "T12:00:00");
    return Math.max(1, Math.round((e.getTime() - s.getTime()) / 86400000) + 1);
  } catch {
    return 1;
  }
}
