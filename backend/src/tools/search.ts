import { env } from "../env.js";

type BraveResult = { title: string; url: string; description: string };

export const searchTool = {
  schema: {
    type: "function" as const,
    function: {
      name: "web_search",
      description: "Search the web for up-to-date information. Returns top results with title, URL, and snippet.",
      parameters: {
        type: "object",
        properties: {
          query: { type: "string", description: "Search query" },
          count: { type: "number", description: "Number of results (1-10)", default: 5 },
        },
        required: ["query"],
      },
    },
  },
  async execute(args: { query: string; count?: number }): Promise<string> {
    if (!env.BRAVE_API_KEY) {
      return JSON.stringify({ error: "BRAVE_API_KEY not configured on server" });
    }
    const count = Math.min(Math.max(args.count ?? 5, 1), 10);
    const url = `https://api.search.brave.com/res/v1/web/search?q=${encodeURIComponent(args.query)}&count=${count}`;
    const res = await fetch(url, {
      headers: {
        Accept: "application/json",
        "X-Subscription-Token": env.BRAVE_API_KEY,
      },
    });
    if (!res.ok) {
      return JSON.stringify({ error: `search failed: ${res.status}` });
    }
    const data = (await res.json()) as { web?: { results?: BraveResult[] } };
    const results = (data.web?.results ?? []).slice(0, count).map((r) => ({
      title: r.title,
      url: r.url,
      snippet: r.description,
    }));
    return JSON.stringify({ results });
  },
};
