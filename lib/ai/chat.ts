import { getAiConfig } from "@/lib/ai/config";

export class AiChatError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "AiChatError";
  }
}

export interface ChatMessage {
  role: "system" | "user" | "assistant";
  content: string;
}

interface OpenAiChatResponse {
  choices?: Array<{
    message?: {
      content?: string | null;
    };
  }>;
}

/**
 * Вызов OpenAI-совместимого Chat Completions API (OpenRouter / OpenAI).
 */
export async function chatCompletion(options: {
  messages: ChatMessage[];
  temperature?: number;
  json?: boolean;
}): Promise<string> {
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
      temperature: options.temperature ?? 0,
      ...(options.json ? { response_format: { type: "json_object" } } : {}),
      messages: options.messages,
    }),
  });

  if (!response.ok) {
    const body = await response.text();
    console.error("AI chat failed:", response.status, body);
    throw new AiChatError(
      `AI API вернул ошибку ${response.status}. Проверьте ключ, модель и баланс.`,
    );
  }

  const data = (await response.json()) as OpenAiChatResponse;
  const content = data.choices?.[0]?.message?.content;
  if (!content) {
    throw new AiChatError("AI вернул пустой ответ.");
  }

  return content;
}

/** Достаёт JSON из ответа модели (чистый или в markdown-fence). */
export function extractJsonText(content: string): string {
  const trimmed = content.trim();
  const fenced = trimmed.match(/```(?:json)?\s*([\s\S]*?)```/i);
  return fenced?.[1]?.trim() ?? trimmed;
}
