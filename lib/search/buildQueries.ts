import type { ExtractedFacts } from "@/types";

/**
 * Собирает 1–3 поисковых запроса из фактов и исходного текста.
 */
export function buildSearchQueries(
  text: string,
  facts: ExtractedFacts,
): string[] {
  const queries: string[] = [];
  const seen = new Set<string>();

  const push = (value: string) => {
    const q = value.replace(/\s+/g, " ").trim();
    if (q.length < 8) return;
    const key = q.toLowerCase();
    if (seen.has(key)) return;
    seen.add(key);
    queries.push(q.slice(0, 180));
  };

  for (const claim of facts.claims.slice(0, 2)) {
    push(claim);
  }

  const namePart = facts.names.slice(0, 2).join(" ");
  const datePart = facts.dates[0] ?? "";
  if (namePart) {
    push([namePart, datePart, facts.claims[0] ?? text.slice(0, 80)]
      .filter(Boolean)
      .join(" "));
  }

  if (queries.length === 0) {
    push(text);
  }

  return queries.slice(0, 3);
}
