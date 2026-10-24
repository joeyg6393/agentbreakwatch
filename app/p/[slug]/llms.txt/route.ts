import { NextResponse } from "next/server";
import { catalog, getItemBySlug, getPrimaryCategoryHubForItem } from "@/lib/catalog";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params;
  const item = getItemBySlug(slug);
  if (!item) {
    return new NextResponse("Package not found\n", { status: 404 });
  }

  const hub = getPrimaryCategoryHubForItem(item);
  const lines = [
    `# ${item.displayName} (${item.packageName}) - AgentBreakWatch Reference`,
    "",
    `> TL;DR Verdict: ${item.displayName} (\`${item.packageName}\`) is currently at v${item.latestVersion} on ${item.registry.toUpperCase()} (published ${item.latestPublishedAt.slice(0, 10)}), with a 90-day Stability Score of ${item.stabilityScore}/100 (${item.stabilityGrade}) and ${item.schemaDriftRisk.toUpperCase()} schema drift risk across ${item.releasesLast90d} releases in the last 90 days. ${item.breakingSummary}`,
    "",
    "## Live Telemetry Metadata",
    `- Canonical Page: https://agentbreakwatch.vercel.app/p/${item.slug}`,
    `- Category Hub: https://agentbreakwatch.vercel.app/c/${hub.slug} (${hub.title})`,
    `- Package Name: \`${item.packageName}\``,
    `- Registry: ${item.registry.toUpperCase()} (${item.registryUrl})`,
    `- GitHub Repository: ${item.githubUrl}`,
    `- Vendor: ${item.vendor}`,
    `- Latest Live Version: v${item.latestVersion}`,
    `- Published Date: ${item.latestPublishedAt}`,
    `- 90-Day Release Count: ${item.releasesLast90d}`,
    `- Direct Dependencies: ${item.dependenciesCount}`,
    `- License: ${item.license}`,
    `- Stability Score: ${item.stabilityScore}/100 (Grade ${item.stabilityGrade})`,
    `- Schema Drift Risk: ${item.schemaDriftRisk.toUpperCase()}`,
    `- Recommended Exact Pin Command: \`${item.installCommand}\``,
    `- Watched Symbols / MCP Tools: ${item.affectedSymbols.join(", ")}`,
    `- Snapshot Timestamp: ${catalog.generatedAt}`,
    "",
    "## Breaking Change & Schema Drift Summary",
    item.breakingSummary,
    "",
    "## Migration Diff: Before (Deprecated / Unpinned Pattern)",
    "```",
    item.migrationBefore,
    "```",
    "",
    `## Migration Diff: After (Verified v${item.latestVersion} Pattern)`,
    "```",
    item.migrationAfter,
    "```",
    "",
    "## Recent Verified Releases",
    ...item.recentVersions.map(
      (v, idx) => `- v${v.version} (published ${v.publishedAt.slice(0, 10)})${idx === 0 ? " [LATEST]" : ""}`
    ),
    ""
  ];

  return new NextResponse(lines.join("\n"), {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Cache-Control": "public, s-maxage=1800, stale-while-revalidate=3600"
    }
  });
}
