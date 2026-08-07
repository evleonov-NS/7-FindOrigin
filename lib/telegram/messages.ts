import type { AnalysisResult, ExtractedFacts, SourceCandidate } from "@/types";

export const START_MESSAGE = [
  "FindOrigin — бот для поиска первоисточника информации.",
  "",
  "Отправьте:",
  "• текст сообщения или утверждения",
  "• ссылку на публичный Telegram-пост",
  "",
  "Я найду возможные источники и оценю уверенность по смыслу.",
  "Команда /help — краткая справка.",
].join("\n");

export const HELP_MESSAGE = [
  "Как пользоваться FindOrigin:",
  "",
  "1. Пришлите текст или ссылку вида https://t.me/channel/123",
  "2. Дождитесь статусов анализа и поиска",
  "3. Получите 1–3 источника с релевантностью и уверенностью",
  "",
  "Ограничения:",
  "• приватные Telegram-посты недоступны",
  "• слишком короткий или пустой текст обработать нельзя",
].join("\n");

export const UNSUPPORTED_MESSAGE =
  "Пока я понимаю только текстовые сообщения или ссылки на публичные Telegram-посты. Пришлите текст или ссылку.";

export const STATUS_ANALYZE = "🔍 Анализирую запрос...";
export const STATUS_EXTRACT = "🔎 Извлекаю ключевые элементы...";
export const STATUS_SEARCH =
  "🤖 Ищу и анализирую источники с помощью AI...";

export function formatNormalizeError(reason: string): string {
  return `Не удалось подготовить текст для анализа.\n\n${reason}`;
}

export function formatAiError(reason: string): string {
  return `Не удалось выделить факты через AI.\n\n${reason}`;
}

export function formatSearchError(reason: string): string {
  return `Не удалось найти источники.\n\n${reason}`;
}

function escapeHtml(value: string): string {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

function shortUrl(url: string): string {
  try {
    const parsed = new URL(url);
    const path = parsed.pathname === "/" ? "" : parsed.pathname;
    const display = `${parsed.hostname}${path}`;
    return display.length > 48 ? `${display.slice(0, 45)}...` : display;
  } catch {
    return url.length > 48 ? `${url.slice(0, 45)}...` : url;
  }
}

/** Финальный ответ в HTML (parse_mode: HTML), как на референсе. */
export function formatAnalysisReply(result: AnalysisResult): string {
  if (result.sources.length === 0) {
    return [
      "✅ <b>Результаты анализа источников</b>",
      "",
      `<b>Исходный текст:</b> ${escapeHtml(result.originalText)}`,
      "",
      "<b>Найдено источников:</b> 0",
      "",
      `<b>Резюме:</b> ${escapeHtml(result.summary || "Возможные источники не найдены.")}`,
    ].join("\n");
  }

  const blocks = result.sources.slice(0, 3).map((source, index) => {
    const relevance =
      typeof source.relevance === "number"
        ? `${Math.round(source.relevance)}%`
        : "—";
    const confidence =
      typeof source.confidence === "number"
        ? `${Math.round(source.confidence)}%`
        : "—";
    const note = source.reason
      ? `\n<i>${escapeHtml(source.reason)}</i>`
      : "";

    return [
      `<b>Источник ${index + 1}:</b> ${escapeHtml(source.title)}`,
      `<a href="${escapeHtml(source.url)}">${escapeHtml(shortUrl(source.url))}</a>`,
      escapeHtml(source.snippet || "Без сниппета"),
      `Релевантность: ${relevance} | Уверенность: ${confidence}${note}`,
    ].join("\n");
  });

  return [
    "✅ <b>Результаты анализа источников</b>",
    "",
    `<b>Исходный текст:</b> ${escapeHtml(result.originalText)}`,
    "",
    `<b>Найдено источников:</b> ${result.sources.slice(0, 3).length}`,
    "",
    `<b>Резюме:</b> ${escapeHtml(result.summary)}`,
    "",
    ...blocks.flatMap((block, i) => (i === 0 ? [block] : ["", block])),
  ].join("\n");
}

/** @deprecated оставлен для совместимости тестов/отладки */
export function formatFactsReply(
  facts: ExtractedFacts,
  sourceType: string,
): string {
  const section = (title: string, items: string[]) =>
    items.length > 0
      ? `${title}:\n${items.map((item) => `• ${item}`).join("\n")}`
      : `${title}:\n• не найдено`;

  return [
    "Факты для поиска (AI):",
    `Тип ввода: ${sourceType === "telegram_post" ? "Telegram-пост" : "текст"}`,
    "",
    section("Ключевые утверждения", facts.claims),
    "",
    section("Даты", facts.dates),
    "",
    section("Числа", facts.numbers),
    "",
    section("Имена", facts.names),
    "",
    section("Ссылки", facts.links),
  ].join("\n");
}

export function formatSourcesReply(sources: SourceCandidate[]): string {
  if (sources.length === 0) {
    return "Возможные источники не найдены.";
  }

  const lines = sources.slice(0, 3).map((source, index) => {
    const confidence =
      typeof source.confidence === "number"
        ? ` (уверенность: ${Math.round(source.confidence)}%)`
        : "";
    const reason = source.reason ? `\n   ${source.reason}` : "";
    return `${index + 1}. ${source.title}${confidence}\n   ${source.url}${reason}`;
  });

  return ["Возможные источники:", "", ...lines].join("\n");
}
