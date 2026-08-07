import { AiChatError, chatCompletion, extractJsonText } from "@/lib/ai/chat";
import type { AnalysisResult, ExtractedFacts, SourceCandidate } from "@/types";

export class RankAiError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "RankAiError";
  }
}

function asNumber(value: unknown): number | undefined {
  if (typeof value === "number" && Number.isFinite(value)) {
    return Math.max(0, Math.min(100, Math.round(value)));
  }
  if (typeof value === "string" && value.trim()) {
    const n = Number(value);
    if (Number.isFinite(n)) {
      return Math.max(0, Math.min(100, Math.round(n)));
    }
  }
  return undefined;
}

function asString(value: unknown): string {
  return typeof value === "string" ? value.trim() : "";
}

/** Разбирает JSON-ответ модели в AnalysisResult. */
export function parseRankJson(
  content: string,
  originalText: string,
  candidates: SourceCandidate[],
): AnalysisResult | null {
  try {
    const parsed = JSON.parse(extractJsonText(content)) as Record<
      string,
      unknown
    >;
    const summary = asString(parsed.summary);
    const rawSources = Array.isArray(parsed.sources) ? parsed.sources : [];
    const byUrl = new Map(
      candidates.map((c) => [c.url.toLowerCase(), c] as const),
    );

    const sources: SourceCandidate[] = [];
    for (const item of rawSources) {
      if (!item || typeof item !== "object") continue;
      const row = item as Record<string, unknown>;
      const url = asString(row.url);
      if (!url) continue;

      const base = byUrl.get(url.toLowerCase());
      sources.push({
        url: base?.url ?? url,
        title: asString(row.title) || base?.title || url,
        snippet: asString(row.snippet) || base?.snippet || "",
        relevance: asNumber(row.relevance),
        confidence: asNumber(row.confidence),
        reason: asString(row.reason) || undefined,
      });

      if (sources.length >= 3) break;
    }

    return {
      originalText,
      summary:
        summary ||
        (sources.length > 0
          ? `Найдено ${sources.length} возможных источника(ов).`
          : "Подходящие источники не найдены."),
      sources,
    };
  } catch {
    return null;
  }
}

/**
 * Сравнивает смысл исходного текста с кандидатами и выбирает 1–3 лучших.
 */
export async function rankSourcesWithAi(
  originalText: string,
  facts: ExtractedFacts,
  candidates: SourceCandidate[],
): Promise<AnalysisResult> {
  if (candidates.length === 0) {
    return {
      originalText,
      summary: "Поисковая выдача не вернула кандидатов для сравнения.",
      sources: [],
    };
  }

  let content: string;
  try {
    content = await chatCompletion({
      json: true,
      messages: [
        {
          role: "system",
          content: [
            "Ты сравниваешь исходный текст с кандидатами-источниками по смыслу.",
            "Верни строго JSON-объект:",
            "summary (string) — краткое резюме на русском (1–3 предложения)",
            "sources (array, максимум 3) — лучшие источники с полями:",
            "url, title, snippet, relevance (0-100), confidence (0-100), reason (string)",
            "Бери url только из списка кандидатов. Нерелевантные отбрасывай.",
            "Не добавляй пояснений вне JSON.",
          ].join("\n"),
        },
        {
          role: "user",
          content: JSON.stringify({
            originalText: originalText.slice(0, 4000),
            facts,
            candidates: candidates.map((c) => ({
              url: c.url,
              title: c.title,
              snippet: c.snippet,
            })),
          }),
        },
      ],
    });
  } catch (error) {
    if (error instanceof AiChatError) {
      throw new RankAiError(error.message);
    }
    throw error;
  }

  const ranked = parseRankJson(content, originalText, candidates);
  if (!ranked) {
    throw new RankAiError(
      "Не удалось разобрать ответ AI при оценке источников.",
    );
  }

  return ranked;
}
