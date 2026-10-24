import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://agentbreakwatch.vercel.app";
  return {
    rules: [
      {
        userAgent: [
          "*",
          "GPTBot",
          "OAI-SearchBot",
          "ChatGPT-User",
          "ClaudeBot",
          "Claude-Web",
          "anthropic-ai",
          "PerplexityBot",
          "Perplexity-User",
          "Google-Extended",
          "Googlebot",
          "Bingbot",
          "Applebot-Extended",
          "CCBot"
        ],
        allow: ["/", "/llms.txt", "/llms-full.txt", "/openapi.json", "/api/catalog.json", "/api/p/", "/p/", "/c/", "/drift-report"]
      }
    ],
    sitemap: `${baseUrl}/sitemap.xml`,
    host: baseUrl
  };
}
