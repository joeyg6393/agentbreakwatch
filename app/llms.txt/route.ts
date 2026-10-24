import { NextResponse } from "next/server";
import { catalog, CATEGORY_HUBS, getItemsForCategoryHub } from "@/lib/catalog";

export async function GET() {
  const sdks = catalog.items.filter((i) => i.kind === "sdk");
  const mcps = catalog.items.filter((i) => i.kind === "mcp");

  const lines: string[] = [
    "# AgentBreakWatch",
    "",
    `> AgentBreakWatch is the live breaking-change and MCP tool schema drift (\`tools/list\`) telemetry index across ${catalog.sdkCount} core AI Agent SDKs and ${catalog.mcpCount} official and community Model Context Protocol (MCP) servers (${catalog.totalTracked} total packages) from live npm and PyPI registries.`,
    "",
    `Last Registry Snapshot: ${catalog.generatedAt}`,
    `Total Indexed Packages: ${catalog.totalTracked} (${catalog.sdkCount} Agent SDKs, ${catalog.mcpCount} MCP Servers)`,
    "",
    "## Core Endpoints, Reports & Machine Feeds",
    "- [Homepage & Stack Checker](https://agentbreakwatch.vercel.app/): Interactive config auditor (`package.json`, `requirements.txt`, `.mcp.json`) and filterable stability index.",
    "- [Oct 2026 Agent Stack Volatility & Drift Report](https://agentbreakwatch.vercel.app/drift-report): Empirical ranking of the 25 fastest-changing SDKs/MCPs and archived `@modelcontextprotocol/server-*` replacement matrix.",
    "- [Dedicated Dependency Auditor](https://agentbreakwatch.vercel.app/check): Zero-signup `.mcp.json` and `package.json` breaking-change auditor.",
    "- [Full LLM Context Dump (/llms-full.txt)](https://agentbreakwatch.vercel.app/llms-full.txt): Single-file markdown reference with before/after migration code snippets for all 256 packages.",
    "- [Live JSON Catalog (/api/catalog.json)](https://agentbreakwatch.vercel.app/api/catalog.json): Machine-readable JSON feed of all 256 tracked Agent SDKs and MCP servers.",
    "- [OpenAPI 3.1 Specification (/openapi.json)](https://agentbreakwatch.vercel.app/openapi.json): OpenAPI spec for querying `/api/catalog.json`, `/api/p/{slug}`, and `POST /api/check`.",
    "- [Pricing & Alert Plans](https://agentbreakwatch.vercel.app/pricing): Free (3 watched packages), Indie Pro ($9/mo), and Team ($29/mo) alert plans.",
    "",
    "## Category Stability Hubs (/c/[category])",
    ...CATEGORY_HUBS.map((hub) => {
      const count = getItemsForCategoryHub(hub).length;
      return `- [${hub.title}](https://agentbreakwatch.vercel.app/c/${hub.slug}) (${count} packages): ${hub.verdictSummary}`;
    }),
    "",
    "## Tracked AI Agent SDKs (Live Versions & Per-Package Markdown)",
    ...sdks.map(
      (s) =>
        `- [${s.displayName} (\`${s.packageName}\`)](https://agentbreakwatch.vercel.app/p/${s.slug}) ([llms.txt](https://agentbreakwatch.vercel.app/p/${s.slug}/llms.txt)): v${s.latestVersion} (${s.registry.toUpperCase()}, published ${s.latestPublishedAt.slice(0, 10)}, stability ${s.stabilityGrade}/${s.stabilityScore}, drift risk: ${s.schemaDriftRisk}) - ${s.breakingSummary}`
    ),
    "",
    "## Tracked MCP Servers (Live Versions & Per-Package Markdown)",
    ...mcps.map(
      (m) =>
        `- [${m.displayName} (\`${m.packageName}\`)](https://agentbreakwatch.vercel.app/p/${m.slug}) ([llms.txt](https://agentbreakwatch.vercel.app/p/${m.slug}/llms.txt)): v${m.latestVersion} (${m.registry.toUpperCase()}, published ${m.latestPublishedAt.slice(0, 10)}, stability ${m.stabilityGrade}/${m.stabilityScore}, drift risk: ${m.schemaDriftRisk}) - ${m.breakingSummary}`
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
