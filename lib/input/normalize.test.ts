import { describe, expect, it } from "vitest";
import { NormalizeError, normalizeInput } from "@/lib/input/normalize";

describe("normalizeInput", () => {
  it("нормализует обычный текст", async () => {
    const result = await normalizeInput(
      "  Президент объявил новую программу поддержки науки в 2024 году.  ",
    );

    expect(result.sourceType).toBe("text");
    expect(result.text).toContain("Президент объявил");
    expect(result.rawInput).toContain("Президент объявил");
  });

  it("отклоняет слишком короткий текст", async () => {
    await expect(normalizeInput("коротко")).rejects.toBeInstanceOf(
      NormalizeError,
    );
  });

  it("отклоняет неподдерживаемые URL", async () => {
    await expect(
      normalizeInput("https://example.com/article/1"),
    ).rejects.toBeInstanceOf(NormalizeError);
  });
});
