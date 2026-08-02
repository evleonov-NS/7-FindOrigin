import type { ExtractedFacts } from "@/types";

interface OpenAiChatResponse {
  choices?: Array<{
    message?: {
      content?: string | null;
    };
  }>;
}

function asStringArray(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value
    .filter((item): item is string => typeof item === "string")
    .map((item) => item.trim())
    .filter(Boolean);
}

function parseFactsJson(content: string): ExtractedFacts | null {
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
 * Извлекает факты через OpenAI-совместимый Chat Completions API.
 * Возвращает null, если ключ не задан или ответ разобрать не удалось.
 */
export async function extractFactsByAi(
  text: string,
): Promise<ExtractedFacts | null> {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    return null;
  }

  const baseUrl = (
    process.env.OPENAI_BASE_URL ?? "https://api.openai.com/v1"
  ).replace(/\/$/, "");
  const model = process.env.OPENAI_MODEL ?? "gpt-4o-mini";

  const response = await fetch(`${baseUrl}/chat/completions`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
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
            'claims (string[]) — ключевые утверждения',
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
    console.error("OpenAI extract failed:", response.status, body);
    return null;
  }

  const data = (await response.json()) as OpenAiChatResponse;
  const content = data.choices?.[0]?.message?.content;
  if (!content) {
    return null;
  }

  return parseFactsJson(content);
}
