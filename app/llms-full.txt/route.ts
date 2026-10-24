import { NextResponse } from "next/server";
import { catalog } from "@/lib/catalog";

export async function GET() {
  const sections: string[] = [
    "# AgentBreakWatch - Full AI Agent SDK & MCP Breaking-Change Reference",
    "",
    `Generated: ${catalog.generatedAt}`,
    `Coverage: ${catalog.sdkCount} Core Agent SDKs + ${catalog.mcpCount} MCP Servers (${catalog.totalTracked} total)`,
    ""
  ];

  for (const item of catalog.items) {
    sections.push(`## ${item.displayName} (${item.packageName})`);
    sections.push(`- Page: /p/${item.slug}`);
    sections.push(`- Category: ${item.kind.toUpperCase()} / ${item.subcategory}`);
    sections.push(`- Registry: ${item.registry.toUpperCase()} (${item.registryUrl})`);
    sections.push(`- Latest Version: v${item.latestVersion} (Published ${item.latestPublishedAt.slice(0, 10)})`);
    sections.push(`- Stability Score: ${item.stabilityScore}/100 (${item.stabilityGrade}) | Schema Drift Risk: ${item.schemaDriftRisk.toUpperCase()}`);
    sections.push(`- Releases (Last 90d): ${item.releasesLast90d}`);
    sections.push(`- Install / Pin Command: \`${item.installCommand}\``);
    sections.push(`- Affected Symbols / Tools: ${item.affectedSymbols.join(", ")}`);
    sections.push(`- Breaking Change Summary: ${item.breakingSummary}`);
    sections.push(`- Recent Versions: ${item.recentVersions.map((v) => `${v.version} (${v.publishedAt.slice(0, 10)})`).join(", ")}`);
    sections.push("");
    sections.push("### Before (Legacy / Breaking Pattern)");
    sections.push("```");
    sections.push(item.migrationBefore);
    sections.push("```");
    sections.push("### After (Recommended Fix)");
    sections.push("```");
    sections.push(item.migrationAfter);
    sections.push("```");
    sections.push("");
  }

  return new NextResponse(sections.join("\n"), {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Cache-Control": "public, s-maxage=1800, stale-while-revalidate=3600"
    }
  });
}
