import type { ExtractedFacts } from "@/types";
import { extractFactsByAi } from "@/lib/facts/extractAi";
import { extractFactsByRules } from "@/lib/facts/extractRules";

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

function mergeFacts(
  primary: ExtractedFacts,
  fallback: ExtractedFacts,
): ExtractedFacts {
  return {
    claims: unique([...primary.claims, ...fallback.claims]).slice(0, 5),
    dates: unique([...primary.dates, ...fallback.dates]),
    numbers: unique([...primary.numbers, ...fallback.numbers]).slice(0, 15),
    names: unique([...primary.names, ...fallback.names]).slice(0, 10),
    links: unique([...primary.links, ...fallback.links]),
  };
}

function isEmpty(facts: ExtractedFacts): boolean {
  return (
    facts.claims.length === 0 &&
    facts.dates.length === 0 &&
    facts.numbers.length === 0 &&
    facts.names.length === 0 &&
    facts.links.length === 0
  );
}

/**
 * Извлекает факты: AI (если доступен) + правила как дополнение/fallback.
 */
export async function extractFacts(text: string): Promise<ExtractedFacts> {
  const rules = extractFactsByRules(text);

  try {
    const ai = await extractFactsByAi(text);
    if (ai && !isEmpty(ai)) {
      return mergeFacts(ai, rules);
    }
  } catch (error) {
    console.error("AI fact extraction error:", error);
  }

  return rules;
}
