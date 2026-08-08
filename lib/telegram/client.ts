const TELEGRAM_API = "https://api.telegram.org";

function getBotToken(): string {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  if (!token) {
    throw new Error("TELEGRAM_BOT_TOKEN не задан");
  }
  return token;
}

export type TelegramReplyMarkup = Record<string, unknown>;

export async function sendMessage(
  chatId: number,
  text: string,
  options?: {
    parseMode?: "HTML" | "Markdown" | "MarkdownV2";
    replyMarkup?: TelegramReplyMarkup;
  },
): Promise<void> {
  const token = getBotToken();
  const response = await fetch(`${TELEGRAM_API}/bot${token}/sendMessage`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      chat_id: chatId,
      text,
      disable_web_page_preview: true,
      ...(options?.parseMode ? { parse_mode: options.parseMode } : {}),
      ...(options?.replyMarkup ? { reply_markup: options.replyMarkup } : {}),
    }),
  });

  if (!response.ok) {
    const body = await response.text();
    throw new Error(`Telegram sendMessage failed: ${response.status} ${body}`);
  }
}
