import type { SourceCandidate } from "@/types";

export class SearchError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "SearchError";
  }
}

interface SerperOrganicItem {
  title?: string;
  link?: string;
  snippet?: string;
}

interface SerperResponse {
  organic?: SerperOrganicItem[];
  message?: string;
}

function getSerperApiKey(): string {
  const apiKey = process.env.SERPER_API_KEY?.trim() ?? "";
  if (!apiKey) {
    throw new SearchError(
      "Не задан SERPER_API_KEY. Получите ключ на https://serper.dev",
    );
  }
  return apiKey;
}

function normalizeUrl(url: string): string {
  try {
    const parsed = new URL(url);
    parsed.hash = "";
    return parsed.toString();
  } catch {
    return url.trim();
  }
}

/**
 * Ищет кандидатов через Serper (Google SERP API).
 * POST https://google.serper.dev/search
 */
export async function searchWithSerper(
  queries: string[],
): Promise<SourceCandidate[]> {
  const apiKey = getSerperApiKey();
  const results: SourceCandidate[] = [];
  const seen = new Set<string>();

  for (const query of queries.slice(0, 3)) {
    const response = await fetch("https://google.serper.dev/search", {
      method: "POST",
      headers: {
        "X-API-KEY": apiKey,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        q: query,
        num: 8,
        hl: "ru",
        gl: "ru",
      }),
    });

    if (!response.ok) {
      const body = await response.text();
      console.error("Serper search failed:", response.status, body);
      throw new SearchError(
        `Serper API вернул ошибку ${response.status}. Проверьте SERPER_API_KEY и баланс кредитов.`,
      );
    }

    const data = (await response.json()) as SerperResponse;

    for (const item of data.organic ?? []) {
      const link = item.link?.trim();
      const title = item.title?.trim();
      if (!link || !title) continue;

      const key = normalizeUrl(link).toLowerCase();
      if (seen.has(key)) continue;
      seen.add(key);

      results.push({
        url: link,
        title,
        snippet: item.snippet?.trim() ?? "",
      });

      if (results.length >= 6) {
        return results;
      }
    }
  }

  return results;
}
