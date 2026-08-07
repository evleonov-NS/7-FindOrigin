import { processMessage } from "@/lib/pipeline/processMessage";
import type { TelegramUpdate } from "@/types";

export const runtime = "nodejs";
export const maxDuration = 60;

function isAuthorized(request: Request): boolean {
  const secret = process.env.TELEGRAM_WEBHOOK_SECRET;
  if (!secret) {
    return true;
  }
  return request.headers.get("x-telegram-bot-api-secret-token") === secret;
}

export async function POST(request: Request): Promise<Response> {
  if (!isAuthorized(request)) {
    return new Response("Unauthorized", { status: 401 });
  }

  if (!process.env.TELEGRAM_BOT_TOKEN) {
    console.error("TELEGRAM_BOT_TOKEN не задан на сервере");
    return new Response("OK", { status: 200 });
  }

  let update: TelegramUpdate;
  try {
    update = (await request.json()) as TelegramUpdate;
  } catch {
    // Telegram ожидает быстрый 200; невалидный JSON игнорируем
    return new Response("OK", { status: 200 });
  }

  const message = update.message;
  if (message) {
    try {
      // await надёжнее на Vercel, чем after(): ответ бота успевает уйти
      await processMessage(message);
    } catch (error) {
      console.error("Telegram update processing failed:", error);
    }
  }

  return new Response("OK", { status: 200 });
}

export async function GET(): Promise<Response> {
  return Response.json({
    ok: true,
    service: "FindOrigin Telegram webhook",
    path: "/api/telegram",
    tokenConfigured: Boolean(process.env.TELEGRAM_BOT_TOKEN?.trim()),
    secretConfigured: Boolean(process.env.TELEGRAM_WEBHOOK_SECRET?.trim()),
  });
}
