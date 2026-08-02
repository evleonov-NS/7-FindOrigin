import { extractFacts } from "@/lib/facts/extract";
import { NormalizeError, normalizeInput } from "@/lib/input/normalize";
import { sendMessage } from "@/lib/telegram/client";
import {
  HELP_MESSAGE,
  SEARCHING_MESSAGE,
  START_MESSAGE,
  UNSUPPORTED_MESSAGE,
  formatFactsReply,
  formatNormalizeError,
} from "@/lib/telegram/messages";
import type { TelegramMessage } from "@/types";

function getCommand(text: string): string | null {
  const match = text.trim().match(/^\/([a-zA-Z_]+)(?:@\w+)?(?:\s|$)/);
  return match ? match[1].toLowerCase() : null;
}

/**
 * Полный цикл обработки сообщения до этапа поиска источников.
 */
export async function processMessage(message: TelegramMessage): Promise<void> {
  const chatId = message.chat.id;
  const text = message.text?.trim() ?? message.caption?.trim() ?? "";

  if (!text) {
    await sendMessage(chatId, UNSUPPORTED_MESSAGE);
    return;
  }

  const command = getCommand(text);
  if (command === "start") {
    await sendMessage(chatId, START_MESSAGE);
    return;
  }
  if (command === "help") {
    await sendMessage(chatId, HELP_MESSAGE);
    return;
  }
  if (command) {
    await sendMessage(
      chatId,
      "Неизвестная команда. Используйте /start или /help.",
    );
    return;
  }

  await sendMessage(chatId, SEARCHING_MESSAGE);

  try {
    const normalized = await normalizeInput(text);
    const facts = await extractFacts(normalized.text);
    await sendMessage(
      chatId,
      formatFactsReply(facts, normalized.sourceType),
    );
  } catch (error) {
    if (error instanceof NormalizeError) {
      await sendMessage(chatId, formatNormalizeError(error.message));
      return;
    }

    console.error("processMessage failed:", error);
    await sendMessage(
      chatId,
      "Произошла ошибка при обработке. Попробуйте ещё раз чуть позже.",
    );
  }
}
