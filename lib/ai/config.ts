export interface AiConfig {
  apiKey: string;
  baseUrl: string;
  model: string;
  siteUrl?: string;
  appName: string;
}

export class AiConfigError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "AiConfigError";
  }
}

/**
 * Конфиг OpenAI-совместимого API (OpenRouter / OpenAI).
 * Предпочтение: OPENROUTER_API_KEY, иначе OPENAI_API_KEY.
 */
function cleanEnv(value: string | undefined): string {
  const trimmed = value?.trim() ?? "";
  if (
    (trimmed.startsWith('"') && trimmed.endsWith('"')) ||
    (trimmed.startsWith("'") && trimmed.endsWith("'"))
  ) {
    return trimmed.slice(1, -1).trim();
  }
  return trimmed;
}

export function getAiConfig(): AiConfig {
  const apiKey =
    cleanEnv(process.env.OPENROUTER_API_KEY) ||
    cleanEnv(process.env.OPENAI_API_KEY) ||
    "";

  if (!apiKey) {
    throw new AiConfigError(
      "Не задан ключ AI. Укажите OPENROUTER_API_KEY или OPENAI_API_KEY.",
    );
  }

  const usingOpenRouter = Boolean(cleanEnv(process.env.OPENROUTER_API_KEY));
  const defaultBase = usingOpenRouter
    ? "https://openrouter.ai/api/v1"
    : "https://api.openai.com/v1";
  const defaultModel = usingOpenRouter
    ? "openai/gpt-4o-mini"
    : "gpt-4o-mini";

  const baseUrl = (
    cleanEnv(process.env.OPENAI_BASE_URL) || defaultBase
  ).replace(/\/$/, "");
  const model = cleanEnv(process.env.OPENAI_MODEL) || defaultModel;

  return {
    apiKey,
    baseUrl,
    model,
    siteUrl: cleanEnv(process.env.OPENROUTER_SITE_URL) || undefined,
    appName: cleanEnv(process.env.OPENROUTER_APP_NAME) || "FindOrigin",
  };
}
