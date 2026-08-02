const TELEGRAM_POST_RE =
  /^(?:https?:\/\/)?(?:www\.)?(?:t\.me|telegram\.me)\/(?:s\/)?([A-Za-z0-9_]{4,})\/(\d+)\/?(?:\?.*)?$/i;

export interface TelegramPostRef {
  username: string;
  messageId: string;
  url: string;
}

export function parseTelegramPostUrl(input: string): TelegramPostRef | null {
  const trimmed = input.trim();
  const match = trimmed.match(TELEGRAM_POST_RE);
  if (!match) {
    return null;
  }

  const username = match[1];
  const messageId = match[2];

  // Служебные пути, не посты канала
  if (["c", "addstickers", "share", "proxy", "socks", "iv"].includes(username.toLowerCase())) {
    return null;
  }

  return {
    username,
    messageId,
    url: `https://t.me/${username}/${messageId}`,
  };
}

function decodeHtmlEntities(value: string): string {
  return value
    .replace(/&nbsp;/gi, " ")
    .replace(/&amp;/gi, "&")
    .replace(/&quot;/gi, '"')
    .replace(/&#39;/gi, "'")
    .replace(/&lt;/gi, "<")
    .replace(/&gt;/gi, ">")
    .replace(/&#(\d+);/g, (_, code: string) =>
      String.fromCharCode(Number(code)),
    );
}

function stripTags(html: string): string {
  return decodeHtmlEntities(
    html
      .replace(/<br\s*\/?>/gi, "\n")
      .replace(/<\/p>/gi, "\n")
      .replace(/<[^>]+>/g, ""),
  )
    .replace(/[ \t]+\n/g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

/**
 * Извлекает текст публичного Telegram-поста через embed-страницу t.me.
 * Приватные/недоступные посты вернут ошибку.
 */
export async function fetchTelegramPostText(
  ref: TelegramPostRef,
): Promise<string> {
  const embedUrl = `https://t.me/${ref.username}/${ref.messageId}?embed=1&mode=tme`;
  const response = await fetch(embedUrl, {
    headers: {
      "User-Agent": "FindOriginBot/0.1 (+https://vercel.com)",
      Accept: "text/html",
    },
    cache: "no-store",
  });

  if (!response.ok) {
    throw new Error(
      `Не удалось открыть пост (HTTP ${response.status}). Проверьте, что пост публичный.`,
    );
  }

  const html = await response.text();

  if (
    html.includes("tgme_widget_message_error") ||
    html.includes("Post not found") ||
    html.includes("Channel is private")
  ) {
    throw new Error(
      "Пост недоступен: возможно, канал приватный или сообщение удалено.",
    );
  }

  const match = html.match(
    /<div[^>]*class="[^"]*tgme_widget_message_text[^"]*"[^>]*>([\s\S]*?)<\/div>/i,
  );

  if (!match?.[1]) {
    throw new Error(
      "Не удалось извлечь текст поста. Убедитесь, что это публичный текстовый пост.",
    );
  }

  const text = stripTags(match[1]);
  if (!text) {
    throw new Error("В посте нет текста для анализа.");
  }

  return text;
}
