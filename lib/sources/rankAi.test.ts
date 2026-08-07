import { describe, expect, it } from "vitest";
import { parseRankJson } from "@/lib/sources/rankAi";
import type { SourceCandidate } from "@/types";

const candidates: SourceCandidate[] = [
  {
    url: "https://fortune.com/example",
    title: "Coinbase CEO urged engineers to use AI",
    snippet: "Brian Armstrong is serious about AI",
  },
  {
    url: "https://news.ycombinator.com/item?id=1",
    title: "Coinbase CEO explains why he fired engineers",
    snippet: "Hard to find programmers not using AI",
  },
];

describe("parseRankJson", () => {
  it("парсит summary и источники с оценками", () => {
    const content = JSON.stringify({
      summary: "Два источника подтверждают информацию.",
      sources: [
        {
          url: "https://fortune.com/example",
          title: "Coinbase CEO urged engineers to use AI",
          snippet: "Brian Armstrong is serious about AI",
          relevance: 90,
          confidence: 85,
          reason: "Статья подтверждает увольнения.",
        },
      ],
    });

    const result = parseRankJson(content, "исходный текст", candidates);

    expect(result).not.toBeNull();
    expect(result?.summary).toContain("подтверждают");
    expect(result?.sources).toHaveLength(1);
    expect(result?.sources[0]?.relevance).toBe(90);
    expect(result?.sources[0]?.confidence).toBe(85);
    expect(result?.sources[0]?.reason).toContain("увольнения");
  });

  it("возвращает null для невалидного JSON", () => {
    expect(parseRankJson("не json", "текст", candidates)).toBeNull();
  });
});
