import { AiChatError, chatCompletion, extractJsonText } from "@/lib/ai/chat";
import type { ExtractedFacts } from "@/types";

export class AiExtractError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "AiExtractError";
  }
}

function asStringArray(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value
    .filter((item): item is string => typeof item === "string")
    .map((item) => item.trim())
    .filter(Boolean);
}

/** Разбирает JSON-ответ модели в ExtractedFacts. */
export function parseFactsJson(content: string): ExtractedFacts | null {
  try {
    const parsed = JSON.parse(extractJsonText(content)) as Record<
      string,
      unknown
    >;
    return {
      claims: asStringArray(parsed.claims),
      dates: asStringArray(parsed.dates),
      numbers: asStringArray(parsed.numbers),
      names: asStringArray(parsed.names),
      links: asStringArray(parsed.links),
    };
  } catch {
    return null;
  }
}

/**
 * Извлекает факты через OpenAI-совместимый Chat Completions API
 * (OpenRouter: модель openai/gpt-4o-mini по умолчанию).
 */
export async function extractFactsByAi(text: string): Promise<ExtractedFacts> {
  let content: string;
  try {
    content = await chatCompletion({
      json: true,
      messages: [
        {
          role: "system",
          content: [
            "Ты извлекаешь факты из текста для дальнейшего поиска первоисточника.",
            "Верни строго JSON-объект с полями:",
            "claims (string[]) — ключевые утверждения",
            "dates (string[]) — даты",
            "numbers (string[]) — числа и величины",
            "names (string[]) — имена людей/организаций",
            "links (string[]) — URL",
            "Не добавляй пояснений вне JSON.",
          ].join("\n"),
        },
        {
          role: "user",
          content: text.slice(0, 6000),
        },
      ],
    });
  } catch (error) {
    if (error instanceof AiChatError) {
      throw new AiExtractError(error.message);
    }
    throw error;
  }

  const facts = parseFactsJson(content);
  if (!facts) {
    throw new AiExtractError(
      "Не удалось разобрать ответ AI как JSON с фактами.",
    );
  }

  return facts;
}
