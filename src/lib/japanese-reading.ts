/** 일본어 구문 → 한국어 발음 안내 (간단 규칙) */
const PHRASE_READINGS: [RegExp, string][] = [
  [/までお願いします/g, "마데 오네가이시마스"],
  [/までお願いします。/g, "마데 오네가이시마스"],
  [/お願いします/g, "오네가이시마스"],
  [/駅/g, "에키"],
  [/空港/g, "쿠우코우"],
  [/地下鉄/g, "치카테츠"],
  [/地下街/g, "치카가이"],
];

/** 일본어가 포함된 문자열에 한국어 읽기 안내 추가 */
export function toKoreanReading(text: string): string | null {
  const trimmed = text.replace(/[「」]/g, "").trim();
  if (!trimmed) return null;

  const hasJapanese = /[\u3040-\u309F\u30A0-\u30FF\u4E00-\u9FFF]/.test(trimmed);
  if (!hasJapanese) return null;

  let reading = trimmed;
  for (const [pattern, replacement] of PHRASE_READINGS) {
    reading = reading.replace(pattern, ` ${replacement}`);
  }

  reading = reading.replace(/\s+/g, " ").trim();
  return reading !== trimmed ? reading : `${trimmed} (일본어 그대로 읽기)`;
}

export function buildTaxiPhraseWithReading(destinationName: string): {
  phraseJa: string;
  phraseReadingKo: string;
  phraseKo: string;
} {
  const name = destinationName.trim() || "目的地";
  const phraseJa = `「${name}までお願いします」`;
  const phraseReadingKo = `「${name}」 마데 오네가이시마스`;
  const phraseKo = `택시 기사님께 보여주세요: ${phraseJa}\n(읽기: ${phraseReadingKo})`;

  return { phraseJa, phraseReadingKo, phraseKo };
}
