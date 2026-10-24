import type { MetadataRoute } from "next";
import { catalog, CATEGORY_HUBS } from "@/lib/catalog";

export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://agentbreakwatch.vercel.app";
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

  return [...staticRoutes, ...categoryRoutes, ...packageRoutes];
}
