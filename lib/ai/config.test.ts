import { afterEach, describe, expect, it, vi } from "vitest";
import { AiConfigError, getAiConfig } from "@/lib/ai/config";

describe("getAiConfig", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("предчитает OpenRouter и модель openai/gpt-4o-mini", () => {
    vi.stubEnv("OPENROUTER_API_KEY", "sk-or-test");
    vi.stubEnv("OPENAI_API_KEY", "");
    vi.stubEnv("OPENAI_BASE_URL", "");
    vi.stubEnv("OPENAI_MODEL", "");

    const config = getAiConfig();

    expect(config.apiKey).toBe("sk-or-test");
    expect(config.baseUrl).toBe("https://openrouter.ai/api/v1");
    expect(config.model).toBe("openai/gpt-4o-mini");
  });

  it("использует OPENAI_API_KEY без OpenRouter", () => {
    vi.stubEnv("OPENROUTER_API_KEY", "");
    vi.stubEnv("OPENAI_API_KEY", "sk-openai");
    vi.stubEnv("OPENAI_BASE_URL", "");
    vi.stubEnv("OPENAI_MODEL", "");

    const config = getAiConfig();

    expect(config.apiKey).toBe("sk-openai");
    expect(config.baseUrl).toBe("https://api.openai.com/v1");
    expect(config.model).toBe("gpt-4o-mini");
  });

  it("бросает ошибку без ключей", () => {
    vi.stubEnv("OPENROUTER_API_KEY", "");
    vi.stubEnv("OPENAI_API_KEY", "");

    expect(() => getAiConfig()).toThrow(AiConfigError);
  });
});
