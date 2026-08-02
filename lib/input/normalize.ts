import type { NormalizedInput } from "@/types";
import {
  fetchTelegramPostText,
  parseTelegramPostUrl,
} from "@/lib/input/telegramPost";

export class NormalizeError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "NormalizeError";
  }
}

function cleanText(value: string): string {
  return value
    .replace(/\u200b/g, "")
    .replace(/\r\n/g, "\n")
    .replace(/[ \t]+/g, " ")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

/**
 * Нормализует ввод пользователя в единую структуру { sourceType, rawInput, text }.
 */
export async function normalizeInput(rawInput: string): Promise<NormalizedInput> {
  const raw = cleanText(rawInput);
  if (!raw) {
    throw new NormalizeError("Пустое сообщение. Пришлите текст или ссылку на пост.");
  }

  const postRef = parseTelegramPostUrl(raw);
  if (postRef) {
    try {
      const text = cleanText(await fetchTelegramPostText(postRef));
      if (!text) {
        throw new NormalizeError("В указанном посте нет текста.");
      }
      return {
        sourceType: "telegram_post",
        rawInput: raw,
        text,
      };
    } catch (error) {
      if (error instanceof NormalizeError) {
        throw error;
      }
      const message =
        error instanceof Error ? error.message : "Ошибка чтения Telegram-поста.";
      throw new NormalizeError(message);
    }
  }

  // Одна строка-URL, но не Telegram-пост
  if (/^https?:\/\/\S+$/i.test(raw) && !parseTelegramPostUrl(raw)) {
    throw new NormalizeError(
      "Пока поддерживаются только ссылки на публичные Telegram-посты вида https://t.me/channel/123",
    );
  }

  if (raw.length < 12) {
    throw new NormalizeError(
      "Текст слишком короткий для поиска источника. Добавьте больше деталей.",
    );
  }

  return {
    sourceType: "text",
    rawInput: raw,
    text: raw,
  };
}
