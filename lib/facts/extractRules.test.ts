import { describe, expect, it } from "vitest";
import { extractFactsByRules } from "@/lib/facts/extractRules";

describe("extractFactsByRules", () => {
  it("извлекает утверждения, даты, числа, имена и ссылки", () => {
    const text = [
      "Илон Маск заявил 15 марта 2024 года, что компания Tesla продала 500 тыс. автомобилей.",
      "Подробности: https://example.com/news/tesla",
    ].join(" ");

    const facts = extractFactsByRules(text);

    expect(facts.claims.length).toBeGreaterThan(0);
    expect(facts.dates.some((d) => /2024|марта/i.test(d))).toBe(true);
    expect(facts.numbers.some((n) => /500/.test(n))).toBe(true);
    expect(facts.names.some((n) => /Илон\s+Маск/i.test(n))).toBe(true);
    expect(facts.links).toContain("https://example.com/news/tesla");
  });

  it("возвращает пустые списки для текста без сущностей", () => {
    const facts = extractFactsByRules("коротко");
    expect(facts.claims).toEqual([]);
    expect(facts.dates).toEqual([]);
    expect(facts.links).toEqual([]);
  });

  it("не дублирует одинаковые ссылки", () => {
    const text =
      "Смотрите https://example.com/a и снова https://example.com/a для деталей отчёта.";
    const facts = extractFactsByRules(text);
    expect(facts.links).toEqual(["https://example.com/a"]);
  });
});
