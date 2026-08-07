import { describe, expect, it } from "vitest";
import { formatAnalysisReply } from "@/lib/telegram/messages";

describe("formatAnalysisReply", () => {
  it("формирует HTML с источниками и процентами", () => {
    const html = formatAnalysisReply({
      originalText: "Coinbase уволил программистов без ИИ",
      summary: "Два источника подтверждают новость.",
      sources: [
        {
          url: "https://fortune.com/2025/08/25/coinbase-ai",
          title: "Coinbase CEO urged engineers to use AI",
          snippet: "Armstrong is serious about AI",
          relevance: 90,
          confidence: 85,
          reason: "Подтверждает увольнения.",
        },
      ],
    });

    expect(html).toContain("Результаты анализа источников");
    expect(html).toContain("<b>Найдено источников:</b> 1");
    expect(html).toContain("Релевантность: 90%");
    expect(html).toContain("Уверенность: 85%");
    expect(html).toContain('href="https://fortune.com/2025/08/25/coinbase-ai"');
    expect(html).toContain("Подтверждает увольнения.");
  });

  it("экранирует HTML в тексте", () => {
    const html = formatAnalysisReply({
      originalText: "A <b>B</b> & C",
      summary: "ok",
      sources: [],
    });
    expect(html).toContain("A &lt;b&gt;B&lt;/b&gt; &amp; C");
    expect(html).toContain("<b>Найдено источников:</b> 0");
  });
});
