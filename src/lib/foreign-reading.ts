import {
  hasKanji,
  hiraganaToKorean,
  isMostlyKana,
} from "@/lib/hiragana-to-korean";
import type { TranslateLang } from "@/lib/translate-client";

const EN_WORD_READINGS: Record<string, string> = {
  hello: "헬로",
  hi: "하이",
  please: "플리즈",
  thank: "땡큐",
  thanks: "땡스",
  yes: "예스",
  no: "노",
  water: "워터",
  coffee: "커피",
  tea: "티",
  bathroom: "바스룸",
  toilet: "토일렛",
  ticket: "티켓",
  help: "헬프",
  sorry: "쏘리",
  excuse: "익스큐즈",
  me: "미",
  this: "디스",
  that: "댓",
  here: "히어",
  there: "데어",
  where: "웨어",
  how: "하우",
  much: "머치",
  check: "체크",
  bill: "빌",
};

function englishToKoreanReading(text: string): string | null {
  const trimmed = text.trim();
  if (!trimmed || !/[a-zA-Z]/.test(trimmed)) return null;

  const words = trimmed.toLowerCase().split(/[^a-z']+/).filter(Boolean);
  if (words.length === 0) return null;

  const parts = words.map((word) => EN_WORD_READINGS[word] ?? latinWordToKorean(word));
  return parts.join(" ");
}

function latinWordToKorean(word: string): string {
  let w = word.toLowerCase();
  let out = "";

  const patterns: [RegExp, string][] = [
    [/^th/, "ㅌ"],
    [/^ch/, "ㅊ"],
    [/^sh/, "ㅅ"],
    [/^ph/, "ㅍ"],
    [/^wh/, "ㅎ"],
    [/tion$/, "션"],
    [/ough/, "오"],
    [/ee/, "이"],
    [/oo/, "우"],
    [/ea/, "이"],
    [/ai/, "에이"],
    [/ay/, "에이"],
    [/ou/, "아우"],
    [/ow/, "오"],
    [/ck/, "크"],
  ];

  for (const [re, rep] of patterns) {
    if (re.test(w)) {
      w = w.replace(re, rep);
      break;
    }
  }

  const charMap: Record<string, string> = {
    a: "아",
    b: "브",
    c: "크",
    d: "드",
    e: "에",
    f: "프",
    g: "그",
    h: "흐",
    i: "이",
    j: "즈",
    k: "크",
    l: "ㄹ",
    m: "므",
    n: "느",
    o: "오",
    p: "프",
    q: "크",
    r: "르",
    s: "스",
    t: "트",
    u: "우",
    v: "브",
    w: "우",
    x: "克斯",
    y: "이",
    z: "즈",
    "'": "",
  };

  for (const ch of w) {
    if (charMap[ch] !== undefined) out += charMap[ch];
    else if (/[가-힣]/.test(ch)) out += ch;
  }

  return out || word;
}

/** 클라이언트에서 즉시 표시 가능한 발음 (가나·영어) */
export function getLocalKoreanReading(
  text: string,
  lang: TranslateLang
): string | null {
  const trimmed = text.trim();
  if (!trimmed || lang === "ko") return null;

  if (lang === "ja") {
    if (hasKanji(trimmed)) return null;
    if (!isMostlyKana(trimmed) && !/[\u3040-\u309F\u30A0-\u30FF]/.test(trimmed)) {
      return null;
    }
    const reading = hiraganaToKorean(trimmed);
    return reading || null;
  }

  if (lang === "en") {
    return englishToKoreanReading(trimmed);
  }

  return null;
}

export { hiraganaToKorean, hasKanji, isMostlyKana };
