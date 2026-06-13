/** 히라가나(가타카나) → 한국어 발음 표기 */

const SYLLABLES: Record<string, string> = {
  あ: "아",
  い: "이",
  う: "우",
  え: "에",
  お: "오",
  か: "카",
  き: "키",
  く: "쿠",
  け: "케",
  こ: "코",
  が: "가",
  ぎ: "기",
  ぐ: "구",
  げ: "게",
  ご: "고",
  さ: "사",
  し: "시",
  す: "스",
  せ: "세",
  そ: "소",
  ざ: "자",
  じ: "지",
  ず: "즈",
  ぜ: "제",
  ぞ: "조",
  た: "타",
  ち: "치",
  つ: "츠",
  て: "테",
  と: "토",
  だ: "다",
  ぢ: "지",
  づ: "즈",
  で: "데",
  ど: "도",
  な: "나",
  に: "니",
  ぬ: "누",
  ね: "네",
  の: "노",
  は: "하",
  ひ: "히",
  ふ: "후",
  へ: "헤",
  ほ: "호",
  ば: "바",
  び: "비",
  ぶ: "부",
  べ: "베",
  ぼ: "보",
  ぱ: "파",
  ぴ: "피",
  ぷ: "푸",
  ぺ: "페",
  ぽ: "포",
  ま: "마",
  み: "미",
  む: "무",
  め: "메",
  も: "모",
  や: "야",
  ゆ: "유",
  よ: "요",
  ら: "라",
  り: "리",
  る: "루",
  れ: "레",
  ろ: "로",
  わ: "와",
  を: "오",
  ん: "응",
  ゎ: "와",
  ぁ: "아",
  ぃ: "이",
  ぅ: "우",
  ぇ: "에",
  ぉ: "오",
};

const YOON: Record<string, string> = {
  きゃ: "캬",
  きゅ: "큐",
  きょ: "쿄",
  ぎゃ: "갸",
  ぎゅ: "규",
  ぎょ: "교",
  しゃ: "샤",
  しゅ: "슈",
  しょ: "쇼",
  じゃ: "자",
  じゅ: "주",
  じょ: "조",
  ちゃ: "챠",
  ちゅ: "츄",
  ちょ: "쵸",
  にゃ: "냐",
  にゅ: "뉴",
  にょ: "뇨",
  ひゃ: "햐",
  ひゅ: "휴",
  ひょ: "효",
  びゃ: "뱌",
  びゅ: "뷰",
  びょ: "뵤",
  ぴゃ: "퍄",
  ぴゅ: "퓨",
  ぴょ: "표",
  みゃ: "먀",
  みゅ: "뮤",
  みょ: "묘",
  りゃ: "랴",
  りゅ: "류",
  りょ: "료",
};

function toHiragana(char: string): string {
  const code = char.charCodeAt(0);
  if (code >= 0x30a1 && code <= 0x30f6) {
    return String.fromCharCode(code - 0x60);
  }
  return char;
}

function vowelFromHangul(syl: string): string | null {
  const m = syl.match(/[아이우에오]$/);
  return m ? m[0] : null;
}

/** 히라가나·가타카나 문자열 → 한글 발음 */
export function hiraganaToKorean(text: string): string {
  const normalized = [...text.normalize("NFKC")]
    .map(toHiragana)
    .join("");

  let result = "";
  let i = 0;

  while (i < normalized.length) {
    const rest = normalized.slice(i);

    if (rest.startsWith("っ")) {
      const last = result.match(/[가-힣]+$/)?.[0];
      if (last && last.length >= 1) {
        result = result.slice(0, -last.length) + last[0] + last;
      }
      i += 1;
      continue;
    }

    const yoonKey = Object.keys(YOON).find((k) => rest.startsWith(k));
    if (yoonKey) {
      result += YOON[yoonKey];
      i += yoonKey.length;
      continue;
    }

    const char = normalized[i];

    if (char === "ー") {
      const last = result.match(/[가-힣]+$/)?.[0] ?? "";
      const v = vowelFromHangul(last);
      if (v) result += v;
      i += 1;
      continue;
    }

    const syl = SYLLABLES[char];
    if (syl) {
      result += syl;
      i += 1;
      continue;
    }

    if (/\s/.test(char)) {
      result += " ";
      i += 1;
      continue;
    }

    result += char;
    i += 1;
  }

  return result.replace(/\s+/g, " ").trim();
}

export function isMostlyKana(text: string): boolean {
  const trimmed = text.replace(/\s/g, "");
  if (!trimmed) return false;
  const kana = trimmed.replace(/[^\u3040-\u309F\u30A0-\u30FF]/g, "").length;
  return kana / trimmed.length >= 0.85;
}

export function hasKanji(text: string): boolean {
  return /[\u4E00-\u9FFF]/.test(text);
}
