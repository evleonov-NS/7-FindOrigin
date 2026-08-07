import { describe, expect, it } from "vitest";
import { buildSearchQueries } from "@/lib/search/buildQueries";
import type { ExtractedFacts } from "@/types";

const emptyFacts: ExtractedFacts = {
  claims: [],
  dates: [],
  numbers: [],
  names: [],
  links: [],
};

describe("buildSearchQueries", () => {
  it("строит запросы из утверждений и имён", () => {
    const facts: ExtractedFacts = {
      ...emptyFacts,
      claims: ["Tesla продала 500 тысяч машин в 2024 году"],
      names: ["Илон Маск", "Tesla"],
      dates: ["2024"],
    };

    const queries = buildSearchQueries(
      "Илон Маск заявил, что Tesla продала 500 тысяч машин в 2024 году",
      facts,
    );

    expect(queries.length).toBeGreaterThan(0);
    expect(queries.length).toBeLessThanOrEqual(3);
    expect(queries.some((q) => /Tesla/i.test(q))).toBe(true);
  });

  it("fallback на исходный текст без фактов", () => {
    const text =
      "Генеральный директор Coinbase уволил программистов, не использующих ИИ";
    const queries = buildSearchQueries(text, emptyFacts);
    expect(queries).toEqual([text]);
  });
});
