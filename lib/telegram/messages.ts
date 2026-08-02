import type { ExtractedFacts, SourceCandidate } from "@/types";

export const START_MESSAGE = [
  "FindOrigin — бот для поиска первоисточника информации.",
  "",
  "Отправьте:",
  "• текст сообщения или утверждения",
  "• ссылку на публичный Telegram-пост",
  "",
  "Я выделю ключевые факты и поищу возможные источники.",
  "Команда /help — краткая справка.",
].join("\n");

export const HELP_MESSAGE = [
  "Как пользоваться FindOrigin:",
  "",
  "1. Пришлите текст или ссылку вида https://t.me/channel/123",
  "2. Дождитесь статуса «Ищу источник…»",
  "3. Получите выделенные факты и (позже) список источников",
  "",
  "Ограничения:",
  "• приватные Telegram-посты недоступны",
  "• слишком короткий или пустой текст обработать нельзя",
].join("\n");

export const UNSUPPORTED_MESSAGE =
  "Пока я понимаю только текстовые сообщения или ссылки на публичные Telegram-посты. Пришлите текст или ссылку.";

export const SEARCHING_MESSAGE = "Ищу источник…";

export function formatNormalizeError(reason: string): string {
  return `Не удалось подготовить текст для анализа.\n\n${reason}`;
}

export function formatFactsReply(
  facts: ExtractedFacts,
  sourceType: string,
): string {
  const section = (title: string, items: string[]) =>
    items.length > 0
      ? `${title}:\n${items.map((item) => `• ${item}`).join("\n")}`
      : `${title}:\n• не найдено`;

  return [
    "Факты для поиска (этап до поиска источников):",
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
    "",
    "Поиск источников будет добавлен на следующем этапе.",
  ].join("\n");
}

/** Заготовка ответа под этапы 5–6. */
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
