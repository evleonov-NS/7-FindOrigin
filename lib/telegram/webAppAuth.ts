import { createHmac, timingSafeEqual } from "node:crypto";

export class WebAppAuthError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "WebAppAuthError";
  }
}

export interface WebAppUser {
  id: number;
  first_name?: string;
  last_name?: string;
  username?: string;
  language_code?: string;
}

export interface ValidatedWebAppData {
  user: WebAppUser;
  authDate: number;
  queryId?: string;
}

function parseInitData(initData: string): Map<string, string> {
  const params = new URLSearchParams(initData);
  const map = new Map<string, string>();
  for (const [key, value] of params.entries()) {
    map.set(key, value);
  }
  return map;
}

/**
 * Проверяет Telegram WebApp initData по документации Bot API.
 * https://core.telegram.org/bots/webapps#validating-data-received-via-the-mini-app
 */
export function validateWebAppInitData(
  initData: string,
  botToken: string,
  options?: { maxAgeSec?: number },
): ValidatedWebAppData {
  if (!initData.trim()) {
    throw new WebAppAuthError("Отсутствует initData Mini App.");
  }
  if (!botToken.trim()) {
    throw new WebAppAuthError("TELEGRAM_BOT_TOKEN не задан.");
  }

  const params = parseInitData(initData);
  const hash = params.get("hash");
  if (!hash) {
    throw new WebAppAuthError("В initData нет hash.");
  }
  params.delete("hash");

  const dataCheckString = [...params.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([key, value]) => `${key}=${value}`)
    .join("\n");

  const secretKey = createHmac("sha256", "WebAppData")
    .update(botToken)
    .digest();
  const calculated = createHmac("sha256", secretKey)
    .update(dataCheckString)
    .digest("hex");

  const hashBuf = Buffer.from(hash, "hex");
  const calcBuf = Buffer.from(calculated, "hex");
  if (
    hashBuf.length !== calcBuf.length ||
    !timingSafeEqual(hashBuf, calcBuf)
  ) {
    throw new WebAppAuthError("Подпись initData недействительна.");
  }

  const authDateRaw = params.get("auth_date");
  const authDate = authDateRaw ? Number(authDateRaw) : NaN;
  if (!Number.isFinite(authDate)) {
    throw new WebAppAuthError("Некорректный auth_date.");
  }

  const maxAgeSec = options?.maxAgeSec ?? 60 * 60 * 24;
  const nowSec = Math.floor(Date.now() / 1000);
  if (nowSec - authDate > maxAgeSec) {
    throw new WebAppAuthError("Сессия Mini App устарела. Откройте приложение снова.");
  }

  const userRaw = params.get("user");
  if (!userRaw) {
    throw new WebAppAuthError("В initData нет user.");
  }

  let user: WebAppUser;
  try {
    user = JSON.parse(userRaw) as WebAppUser;
  } catch {
    throw new WebAppAuthError("Не удалось разобрать user из initData.");
  }

  if (!user?.id) {
    throw new WebAppAuthError("В initData нет user.id.");
  }

  return {
    user,
    authDate,
    queryId: params.get("query_id") ?? undefined,
  };
}
