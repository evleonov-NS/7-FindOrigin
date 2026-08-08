import { extractFacts } from "@/lib/facts/extract";
import { normalizeInput } from "@/lib/input/normalize";
import { buildSearchQueries } from "@/lib/search/buildQueries";
import { searchWithSerper } from "@/lib/search/serper";
import { rankSourcesWithAi } from "@/lib/sources/rankAi";
import type { AnalysisResult } from "@/types";

export type AnalyzeStep = "normalize" | "extract" | "search";

/**
 * Общий пайплайн анализа для бота и Telegram Mini App.
 */
export async function analyzeText(
  rawInput: string,
  options?: {
    onProgress?: (step: AnalyzeStep) => void | Promise<void>;
  },
): Promise<AnalysisResult> {
  await options?.onProgress?.("normalize");
  const normalized = await normalizeInput(rawInput);

  await options?.onProgress?.("extract");
  const facts = await extractFacts(normalized.text);

  await options?.onProgress?.("search");
  const queries = buildSearchQueries(normalized.text, facts);
  const candidates = await searchWithSerper(queries);

  return rankSourcesWithAi(normalized.text, facts, candidates);
}
