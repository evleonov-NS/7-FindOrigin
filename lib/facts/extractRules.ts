import type { ExtractedFacts } from "@/types";

const URL_RE = /https?:\/\/[^\s<>"')]+/gi;
const DATE_RE =
  /\b(?:\d{1,2}[./]\d{1,2}[./]\d{2,4}|\d{4}[-./]\d{1,2}[-./]\d{1,2}|(?:январ[ья]|феврал[ья]|март[а]?|апрел[ья]|ма[йя]|июн[ья]|июл[ья]|август[а]?|сентябр[ья]|октябр[ья]|ноябр[ья]|декабр[ья])\s+\d{4}|\d{1,2}\s+(?:января|февраля|марта|апреля|мая|июня|июля|августа|сентября|октября|ноября|декабря)(?:\s+\d{4})?)\b/gi;
const NUMBER_RE =
  /\b\d+(?:[.,]\d+)?(?:\s?(?:%|млн|млрд|тыс\.?|\$|€|₽|руб\.?))?\b/gi;
// Не используем \b: в JS границы слова не учитывают кириллицу.
const NAME_RE =
  /(?<![\p{L}\p{N}_])(?:[A-ZА-ЯЁ][a-zа-яё]+(?:-[A-ZА-ЯЁ]?[a-zа-яё]+)?(?:\s+[A-ZА-ЯЁ][a-zа-яё]+(?:-[A-ZА-ЯЁ]?[a-zа-яё]+)?){1,2})(?![\p{L}\p{N}_])/gu;

function unique(items: string[]): string[] {
  const seen = new Set<string>();
  const result: string[] = [];
  for (const item of items) {
    const key = item.trim();
    if (!key) continue;
    const normalized = key.toLowerCase();
    if (seen.has(normalized)) continue;
    seen.add(normalized);
    result.push(key);
  }
  return result;
}

function extractClaims(text: string): string[] {
  const parts = text
    .split(/(?<=[.!?…])\s+|\n+/)
    .map((part) => part.trim())
    .filter((part) => part.length >= 20);

  if (parts.length === 0) {
    return text.length >= 20 ? [text.slice(0, 280)] : [];
  }

  return parts.slice(0, 5).map((part) =>
    part.length > 280 ? `${part.slice(0, 277)}...` : part,
  );
}

function isLikelyName(value: string): boolean {
  const lower = value.toLowerCase();
  const stop = [
    "сегодня",
    "завтра",
    "вчера",
    "согласно",
    "однако",
    "кроме",
    "после",
    "перед",
    "также",
    "этот",
    "эта",
    "эти",
    "того",
    "этом",
  ];
  if (stop.includes(lower)) return false;
  if (DATE_RE.test(value)) return false;
  DATE_RE.lastIndex = 0;
  return true;
}

export function extractFactsByRules(text: string): ExtractedFacts {
  const links = unique(text.match(URL_RE) ?? []);
  const dates = unique(text.match(DATE_RE) ?? []);
  const numbers = unique(
    (text.match(NUMBER_RE) ?? []).filter((n) => {
      // отсекаем куски, уже попавшие в даты
      return !dates.some((d) => d.includes(n));
    }),
  );
  const names = unique((text.match(NAME_RE) ?? []).filter(isLikelyName)).slice(
    0,
    10,
  );

  return {
    claims: extractClaims(text),
    dates,
    numbers: numbers.slice(0, 15),
    names,
    links,
  };
}
