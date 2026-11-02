import type { MetadataRoute } from "next";
import { catalog, CATEGORY_HUBS } from "@/lib/catalog";
import { getAllWeeks } from "@/lib/weekly";

export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://agentbreakwatch.com";
  const staticRoutes: MetadataRoute.Sitemap = [
    { url: `${baseUrl}/`, lastModified: new Date(), changeFrequency: "hourly", priority: 1.0 },
    { url: `${baseUrl}/drift-report`, lastModified: new Date(), changeFrequency: "daily", priority: 0.95 },
    { url: `${baseUrl}/check`, lastModified: new Date(), changeFrequency: "daily", priority: 0.9 },
    { url: `${baseUrl}/pricing`, lastModified: new Date(), changeFrequency: "weekly", priority: 0.8 },
    { url: `${baseUrl}/sponsor`, lastModified: new Date(), changeFrequency: "weekly", priority: 0.7 },
    { url: `${baseUrl}/llms.txt`, lastModified: new Date(), changeFrequency: "daily", priority: 0.9 },
    { url: `${baseUrl}/llms-full.txt`, lastModified: new Date(), changeFrequency: "daily", priority: 0.9 },
    { url: `${baseUrl}/openapi.json`, lastModified: new Date(), changeFrequency: "weekly", priority: 0.8 }
  ];

  const categoryRoutes: MetadataRoute.Sitemap = CATEGORY_HUBS.map((hub) => ({
    url: `${baseUrl}/c/${hub.slug}`,
    lastModified: new Date(),
    changeFrequency: "daily",
    priority: 0.9
  }));

  const packageRoutes: MetadataRoute.Sitemap = catalog.items.map((item) => ({
    url: `${baseUrl}/p/${item.slug}`,
    lastModified: new Date(item.latestPublishedAt),
    changeFrequency: "daily",
    priority: 0.85
  }));

  const weeks = getAllWeeks();
  const weeklyRoutes: MetadataRoute.Sitemap = [
    { url: `${baseUrl}/weekly`, lastModified: new Date(catalog.generatedAt), changeFrequency: "daily", priority: 0.9 },
    ...weeks.map((w, i) => ({
      url: `${baseUrl}/weekly/${w.id}`,
      lastModified: i === 0 ? new Date(catalog.generatedAt) : w.end,
      changeFrequency: (i === 0 ? "daily" : "monthly") as "daily" | "monthly",
      priority: i === 0 ? 0.9 : 0.7
    }))
  ];

  return [...staticRoutes, ...weeklyRoutes, ...categoryRoutes, ...packageRoutes];
}
