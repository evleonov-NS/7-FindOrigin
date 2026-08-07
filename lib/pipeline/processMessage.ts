import { AiConfigError } from "@/lib/ai/config";
import { extractFacts } from "@/lib/facts/extract";
import { AiExtractError } from "@/lib/facts/extractAi";
import { NormalizeError, normalizeInput } from "@/lib/input/normalize";
import { buildSearchQueries } from "@/lib/search/buildQueries";
import { SearchError, searchWithSerper } from "@/lib/search/serper";
import { RankAiError, rankSourcesWithAi } from "@/lib/sources/rankAi";
import { sendMessage } from "@/lib/telegram/client";
import {
  HELP_MESSAGE,
  START_MESSAGE,
  STATUS_ANALYZE,
  STATUS_EXTRACT,
  STATUS_SEARCH,
  UNSUPPORTED_MESSAGE,
  formatAiError,
  formatAnalysisReply,
  formatNormalizeError,
  formatSearchError,
} from "@/lib/telegram/messages";
import type { TelegramMessage } from "@/types";

function getCommand(text: string): string | null {
  const match = text.trim().match(/^\/([a-zA-Z_]+)(?:@\w+)?(?:\s|$)/);
  return match ? match[1].toLowerCase() : null;
}

function errorName(error: unknown): string {
  return error instanceof Error ? error.name : "";
}

function errorMessage(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}

/**
 * Полный цикл: нормализация → факты → Serper → AI-оценка → ответ.
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

  try {
    await sendMessage(chatId, STATUS_ANALYZE);
    const normalized = await normalizeInput(text);

    await sendMessage(chatId, STATUS_EXTRACT);
    const facts = await extractFacts(normalized.text);

    await sendMessage(chatId, STATUS_SEARCH);
    const queries = buildSearchQueries(normalized.text, facts);
    const candidates = await searchWithSerper(queries);
    const analysis = await rankSourcesWithAi(
      normalized.text,
      facts,
      candidates,
    );

    await sendMessage(chatId, formatAnalysisReply(analysis), {
      parseMode: "HTML",
    });
  } catch (error) {
    const name = errorName(error);
    const messageText = errorMessage(error);

    if (error instanceof NormalizeError || name === "NormalizeError") {
      await sendMessage(chatId, formatNormalizeError(messageText));
      return;
    }

    if (
      error instanceof AiConfigError ||
      error instanceof AiExtractError ||
      name === "AiConfigError" ||
      name === "AiExtractError"
    ) {
      await sendMessage(chatId, formatAiError(messageText));
      return;
    }

    if (
      error instanceof SearchError ||
      error instanceof RankAiError ||
      name === "SearchError" ||
      name === "RankAiError"
    ) {
      await sendMessage(chatId, formatSearchError(messageText));
      return;
    }

    console.error("processMessage failed:", error);
    await sendMessage(
      chatId,
      `Произошла ошибка при обработке.\n\n${messageText}`,
    );
  }
}
