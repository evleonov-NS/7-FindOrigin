import { describe, expect, it } from "vitest";
import { parseTelegramPostUrl } from "@/lib/input/telegramPost";

describe("parseTelegramPostUrl", () => {
  it("распознаёт обычную ссылку на пост", () => {
    expect(parseTelegramPostUrl("https://t.me/durov/123")).toEqual({
      username: "durov",
      messageId: "123",
      url: "https://t.me/durov/123",
    });
  });

  it("распознаёт ссылку без схемы и с /s/", () => {
    expect(parseTelegramPostUrl("t.me/s/bbcnews/456")).toEqual({
      username: "bbcnews",
      messageId: "456",
      url: "https://t.me/bbcnews/456",
    });
  });

  it("отклоняет служебные и нерелевантные URL", () => {
    expect(parseTelegramPostUrl("https://t.me/c/1234567890/1")).toBeNull();
    expect(parseTelegramPostUrl("https://example.com/post/1")).toBeNull();
    expect(parseTelegramPostUrl("просто текст")).toBeNull();
  });
});
