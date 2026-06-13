import { getLocalKoreanReading } from "@/lib/foreign-reading";
import { hasKanji, hiraganaToKorean } from "@/lib/hiragana-to-korean";
import type { TranslateLang } from "@/lib/translate-client";

type KuroshiroInstance = {
  convert: (
    text: string,
    options: { to: string; mode?: string }
  ) => Promise<string>;
};

let kuroshiroPromise: Promise<KuroshiroInstance> | null = null;

async function getKuroshiro(): Promise<KuroshiroInstance> {
  if (!kuroshiroPromise) {
    kuroshiroPromise = (async () => {
      const Kuroshiro = (await import("kuroshiro")).default;
      const KuromojiAnalyzer = (await import("kuroshiro-analyzer-kuromoji"))
        .default;
      const instance = new Kuroshiro();
      await instance.init(new KuromojiAnalyzer());
      return instance;
    })();
  }
  return kuroshiroPromise;
}

export async function fetchKoreanReadingFromText(
  text: string,
  lang: TranslateLang
): Promise<string | null> {
  const trimmed = text.trim();
  if (!trimmed || lang === "ko") return null;

  const local = getLocalKoreanReading(trimmed, lang);
  if (local) return local;

  if (lang !== "ja" || !hasKanji(trimmed)) return null;

  try {
    const kuroshiro = await getKuroshiro();
    const hiragana = await kuroshiro.convert(trimmed, {
      to: "hiragana",
      mode: "normal",
    });
    const reading = hiraganaToKorean(hiragana);
    return reading || null;
  } catch {
    return null;
  }
}
