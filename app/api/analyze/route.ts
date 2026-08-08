import { AiConfigError } from "@/lib/ai/config";
import { AiExtractError } from "@/lib/facts/extractAi";
import { NormalizeError } from "@/lib/input/normalize";
import { analyzeText } from "@/lib/pipeline/analyze";
import { SearchError } from "@/lib/search/serper";
import { RankAiError } from "@/lib/sources/rankAi";
import {
  WebAppAuthError,
  validateWebAppInitData,
} from "@/lib/telegram/webAppAuth";

export const runtime = "nodejs";
export const maxDuration = 60;

interface AnalyzeBody {
  text?: string;
  initData?: string;
}

function errorPayload(error: unknown): { status: number; error: string } {
  const name = error instanceof Error ? error.name : "";
  const message = error instanceof Error ? error.message : String(error);

  if (error instanceof WebAppAuthError || name === "WebAppAuthError") {
    return { status: 401, error: message };
  }
  if (error instanceof NormalizeError || name === "NormalizeError") {
    return { status: 400, error: message };
  }
  if (
    error instanceof AiConfigError ||
    error instanceof AiExtractError ||
    error instanceof SearchError ||
    error instanceof RankAiError ||
    name === "AiConfigError" ||
    name === "AiExtractError" ||
    name === "SearchError" ||
    name === "RankAiError"
  ) {
    return { status: 502, error: message };
  }

  console.error("analyze API failed:", error);
  return { status: 500, error: "Внутренняя ошибка анализа." };
}

export async function POST(request: Request): Promise<Response> {
  let body: AnalyzeBody;
  try {
    body = (await request.json()) as AnalyzeBody;
  } catch {
    return Response.json({ error: "Некорректный JSON." }, { status: 400 });
  }

  const text = body.text?.trim() ?? "";
  const initData = body.initData?.trim() ?? "";

  if (!text) {
    return Response.json(
      { error: "Передайте текст или ссылку в поле text." },
      { status: 400 },
    );
  }

  const botToken = process.env.TELEGRAM_BOT_TOKEN?.trim() ?? "";
  const allowDevBypass =
    process.env.NODE_ENV === "development" &&
    process.env.MINIAPP_DEV_BYPASS === "1";

  try {
    if (initData) {
      validateWebAppInitData(initData, botToken);
    } else if (!allowDevBypass) {
      throw new WebAppAuthError(
        "Откройте Mini App из Telegram — нужна авторизация initData.",
      );
    }

    const result = await analyzeText(text);
    return Response.json({ ok: true, result });
  } catch (error) {
    const { status, error: message } = errorPayload(error);
    return Response.json({ error: message }, { status });
  }
}
