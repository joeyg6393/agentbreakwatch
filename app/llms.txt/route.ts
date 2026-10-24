import { NextResponse } from "next/server";
import { catalog } from "@/lib/catalog";

export async function GET() {
  const sdks = catalog.items.filter((i) => i.kind === "sdk");
  const mcps = catalog.items.filter((i) => i.kind === "mcp");

  const lines: string[] = [
    "# AgentBreakWatch",
    "",
    "> AgentBreakWatch tracks breaking changes, tool schema drift (`tools/list`), and release velocity across 25 core AI Agent SDKs and 44 official and community Model Context Protocol (MCP) servers from live npm and PyPI registries.",
    "",
    `Last Registry Snapshot: ${catalog.generatedAt}`,
    `Total Indexed Packages: ${catalog.totalTracked} (${catalog.sdkCount} Agent SDKs, ${catalog.mcpCount} MCP Servers)`,
    "",
    "## Core Endpoints & Tools",
    "- `/` : Interactive config checker (`package.json`, `requirements.txt`, `.mcp.json`) and filterable stability index.",
    "- `/check` : Dedicated dependency and `.mcp.json` breaking-change auditor with copy-paste migration diffs.",
    "- `/api/catalog.json` : Machine-readable JSON feed of all tracked Agent SDKs and MCP servers.",
    "- `/llms-full.txt` : Full text dump including before/after migration code snippets for every tracked package.",
    "- `/pricing` : Free (3 watched packages), Indie ($9/mo), and Team ($29/mo) alert plans.",
    "- `/sponsor` : Sponsorship slots for AI developer tool companies.",
    "",
    "## Tracked AI Agent SDKs (Live Versions)",
    ...sdks.map(
      (s) =>
        `- [${s.displayName} (\`${s.packageName}\`)](/p/${s.slug}): v${s.latestVersion} (${s.registry.toUpperCase()}, published ${s.latestPublishedAt.slice(0, 10)}, stability ${s.stabilityGrade}/${s.stabilityScore}, drift risk: ${s.schemaDriftRisk}) - ${s.breakingSummary}`
    ),
    "",
    "## Tracked MCP Servers (Live Versions)",
    ...mcps.map(
      (m) =>
        `- [${m.displayName} (\`${m.packageName}\`)](/p/${m.slug}): v${m.latestVersion} (${m.registry.toUpperCase()}, published ${m.latestPublishedAt.slice(0, 10)}, stability ${m.stabilityGrade}/${m.stabilityScore}, drift risk: ${m.schemaDriftRisk}) - ${m.breakingSummary}`
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
