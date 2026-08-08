import { createHmac } from "node:crypto";
import { describe, expect, it } from "vitest";
import {
  WebAppAuthError,
  validateWebAppInitData,
} from "@/lib/telegram/webAppAuth";

function signInitData(
  fields: Record<string, string>,
  botToken: string,
): string {
  const params = new URLSearchParams(fields);
  const dataCheckString = [...params.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([key, value]) => `${key}=${value}`)
    .join("\n");

  const secretKey = createHmac("sha256", "WebAppData")
    .update(botToken)
    .digest();
  const hash = createHmac("sha256", secretKey)
    .update(dataCheckString)
    .digest("hex");

  params.set("hash", hash);
  return params.toString();
}

describe("validateWebAppInitData", () => {
  const token = "123456:ABC-DEF";

  it("принимает корректную подпись", () => {
    const authDate = String(Math.floor(Date.now() / 1000));
    const initData = signInitData(
      {
        auth_date: authDate,
        user: JSON.stringify({ id: 42, first_name: "Test" }),
      },
      token,
    );

    const result = validateWebAppInitData(initData, token);
    expect(result.user.id).toBe(42);
    expect(result.authDate).toBe(Number(authDate));
  });

  it("отклоняет подделку hash", () => {
    const authDate = String(Math.floor(Date.now() / 1000));
    const initData = signInitData(
      {
        auth_date: authDate,
        user: JSON.stringify({ id: 1, first_name: "A" }),
      },
      token,
    );
    const tampered = initData.replace(
      /hash=[0-9a-f]+/i,
      "hash=0000000000000000000000000000000000000000000000000000000000000000",
    );

    expect(() => validateWebAppInitData(tampered, token)).toThrow(
      WebAppAuthError,
    );
  });
});
