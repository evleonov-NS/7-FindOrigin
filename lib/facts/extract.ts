import type { ExtractedFacts } from "@/types";
import { AiExtractError, extractFactsByAi } from "@/lib/facts/extractAi";

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
 * Извлекает факты только через AI (без rule-based предварительного анализа).
 */
export async function extractFacts(text: string): Promise<ExtractedFacts> {
  const facts = await extractFactsByAi(text);

  if (isEmpty(facts)) {
    throw new AiExtractError(
      "AI не нашёл в тексте утверждений, дат, чисел, имён или ссылок.",
    );
  }

  return facts;
}
