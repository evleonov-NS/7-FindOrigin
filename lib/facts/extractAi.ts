import { getAiConfig } from "@/lib/ai/config";
import type { ExtractedFacts } from "@/types";

interface OpenAiChatResponse {
  choices?: Array<{
    message?: {
      content?: string | null;
    };
  }>;
}

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
  const trimmed = content.trim();
  const fenced = trimmed.match(/```(?:json)?\s*([\s\S]*?)```/i);
  const jsonText = fenced?.[1]?.trim() ?? trimmed;

  try {
    const parsed = JSON.parse(jsonText) as Record<string, unknown>;
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
  const { apiKey, baseUrl, model, siteUrl, appName } = getAiConfig();

  const headers: Record<string, string> = {
    Authorization: `Bearer ${apiKey}`,
    "Content-Type": "application/json",
  };

  if (baseUrl.includes("openrouter.ai")) {
    headers["X-Title"] = appName;
    if (siteUrl) {
      headers["HTTP-Referer"] = siteUrl;
    }
  }

  const response = await fetch(`${baseUrl}/chat/completions`, {
    method: "POST",
    headers,
    body: JSON.stringify({
      model,
      temperature: 0,
      response_format: { type: "json_object" },
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
    }),
  });

  if (!response.ok) {
    const body = await response.text();
    console.error("AI extract failed:", response.status, body);
    throw new AiExtractError(
      `AI API вернул ошибку ${response.status}. Проверьте ключ, модель и баланс.`,
    );
  }

  const data = (await response.json()) as OpenAiChatResponse;
  const content = data.choices?.[0]?.message?.content;
  if (!content) {
    throw new AiExtractError("AI вернул пустой ответ.");
  }

  const facts = parseFactsJson(content);
  if (!facts) {
    throw new AiExtractError("Не удалось разобрать ответ AI как JSON с фактами.");
  }

  return facts;
}
