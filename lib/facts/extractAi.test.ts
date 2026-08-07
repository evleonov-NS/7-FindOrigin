import { afterEach, describe, expect, it, vi } from "vitest";
import { AiConfigError } from "@/lib/ai/config";
import {
  AiExtractError,
  extractFactsByAi,
  parseFactsJson,
} from "@/lib/facts/extractAi";

describe("parseFactsJson", () => {
  it("парсит чистый JSON", () => {
    const facts = parseFactsJson(
      JSON.stringify({
        claims: ["Tesla продала 500 тыс. авто"],
        dates: ["15 марта 2024"],
        numbers: ["500 тыс."],
        names: ["Илон Маск"],
        links: ["https://example.com"],
      }),
    );

    expect(facts).toEqual({
      claims: ["Tesla продала 500 тыс. авто"],
      dates: ["15 марта 2024"],
      numbers: ["500 тыс."],
      names: ["Илон Маск"],
      links: ["https://example.com"],
    });
  });

  it("парсит JSON в markdown-fence", () => {
    const facts = parseFactsJson(
      '```json\n{"claims":["a"],"dates":[],"numbers":[],"names":[],"links":[]}\n```',
    );
    expect(facts?.claims).toEqual(["a"]);
  });

  it("возвращает null для невалидного JSON", () => {
    expect(parseFactsJson("не json")).toBeNull();
  });
});

describe("extractFactsByAi", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  it("бросает AiConfigError без ключа", async () => {
    vi.stubEnv("OPENROUTER_API_KEY", "");
    vi.stubEnv("OPENAI_API_KEY", "");

    await expect(extractFactsByAi("текст")).rejects.toBeInstanceOf(
      AiConfigError,
    );
  });

  it("вызывает OpenRouter с моделью openai/gpt-4o-mini", async () => {
    vi.stubEnv("OPENROUTER_API_KEY", "sk-test");
    vi.stubEnv("OPENAI_BASE_URL", "https://openrouter.ai/api/v1");
    vi.stubEnv("OPENAI_MODEL", "openai/gpt-4o-mini");

    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        choices: [
          {
            message: {
              content: JSON.stringify({
                claims: ["утверждение"],
                dates: [],
                numbers: [],
                names: [],
                links: [],
              }),
            },
          },
        ],
      }),
    });
    vi.stubGlobal("fetch", fetchMock);

    const facts = await extractFactsByAi("длинный текст для проверки");

    expect(facts.claims).toEqual(["утверждение"]);
    expect(fetchMock).toHaveBeenCalledOnce();

    const [url, init] = fetchMock.mock.calls[0] as [string, RequestInit];
    expect(url).toBe("https://openrouter.ai/api/v1/chat/completions");

    const headers = init.headers as Record<string, string>;
    expect(headers.Authorization).toBe("Bearer sk-test");
    expect(headers["X-Title"]).toBe("FindOrigin");

    const body = JSON.parse(String(init.body)) as { model: string };
    expect(body.model).toBe("openai/gpt-4o-mini");
  });

  it("бросает AiExtractError при ответе API с ошибкой", async () => {
    vi.stubEnv("OPENROUTER_API_KEY", "sk-test");
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: false,
        status: 401,
        text: async () => "unauthorized",
      }),
    );

    await expect(extractFactsByAi("текст")).rejects.toBeInstanceOf(
      AiExtractError,
    );
  });
});
