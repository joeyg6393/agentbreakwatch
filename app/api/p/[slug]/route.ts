import { NextResponse } from "next/server";
import { catalog, getItemBySlug, getPrimaryCategoryHubForItem } from "@/lib/catalog";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params;
  const item = getItemBySlug(slug);
  if (!item) {
    return NextResponse.json({ error: "Package not found" }, { status: 404 });
  }

  const hub = getPrimaryCategoryHubForItem(item);

  return NextResponse.json(
    {
      generatedAt: catalog.generatedAt,
      canonicalUrl: `https://agentbreakwatch.vercel.app/p/${item.slug}`,
      llmsTxtUrl: `https://agentbreakwatch.vercel.app/p/${item.slug}/llms.txt`,
      categoryHub: {
        slug: hub.slug,
        title: hub.title,
        url: `https://agentbreakwatch.vercel.app/c/${hub.slug}`
      },
      tldrVerdict: `${item.displayName} (${item.packageName}) is currently at v${item.latestVersion} on ${item.registry.toUpperCase()} (published ${item.latestPublishedAt.slice(0, 10)}), with a 90-day Stability Score of ${item.stabilityScore}/100 (${item.stabilityGrade}) and ${item.schemaDriftRisk.toUpperCase()} schema drift risk. ${item.breakingSummary}`,
      package: item
    },
    {
      headers: {
        "Cache-Control": "public, s-maxage=1800, stale-while-revalidate=3600",
        "Access-Control-Allow-Origin": "*"
      }
    }
  );
}
