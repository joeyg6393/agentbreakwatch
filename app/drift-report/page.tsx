import Link from "next/link";
import type { Metadata } from "next";
import { catalog, CATEGORY_HUBS, getItemsForCategoryHub } from "@/lib/catalog";
import { SubscribeBox } from "@/components/SubscribeBox";

export const metadata: Metadata = {
  title: "October 2026 AI Agent Stack Volatility & MCP Schema Drift Report",
  description: `Empirical analysis of release velocity, breaking changes, and MCP tools/list schema drift across ${catalog.sdkCount} core AI Agent SDKs and ${catalog.mcpCount} Model Context Protocol servers on npm and PyPI.`,
  alternates: {
    canonical: "https://agentbreakwatch.vercel.app/drift-report"
  }
};

export default function DriftReportPage() {
  const highVelocity = [...catalog.items]
    .sort((a, b) => b.releasesLast90d - a.releasesLast90d)
    .slice(0, 25);

  const highRiskItems = catalog.items.filter((i) => i.schemaDriftRisk === "high");
  const totalReleases90d = catalog.items.reduce((acc, i) => acc + i.releasesLast90d, 0);

  const archivedReplacements = [
    {
      legacyPkg: "@modelcontextprotocol/server-github",
      legacySlug: "mcp-server-github",
      status: "Archived at v2025.4.8",
      replacement: "Remote https://api.githubcopilot.com/mcp/ or github-mcp-server",
      reason: "Moved to GitHub official remote Streamable HTTP / Docker server with updated tool pagination."
    },
    {
      legacyPkg: "@modelcontextprotocol/server-postgres",
      legacySlug: "mcp-server-postgres",
      status: "Frozen at v0.6.2",
      replacement: "@supabase/mcp-server-supabase or @neondatabase/mcp-server-neon",
      reason: "Reference server lacks parameterized query guards and MCP 2025+ Streamable HTTP."
    },
    {
      legacyPkg: "@modelcontextprotocol/server-puppeteer",
      legacySlug: "mcp-server-puppeteer",
      status: "Archived at v2025.5.12",
      replacement: "@playwright/mcp or chrome-devtools-mcp",
      reason: "Playwright MCP and Chrome DevTools MCP use deterministic accessibility tree snapshots instead of fragile selectors."
    },
    {
      legacyPkg: "@modelcontextprotocol/server-brave-search",
      legacySlug: "mcp-server-brave-search",
      status: "Frozen at v0.6.2",
      replacement: "@brave/brave-search-mcp-server",
      reason: "Brave maintains an official 2.x MCP server with news, video, image, and AI summary tools."
    },
    {
      legacyPkg: "@modelcontextprotocol/server-redis",
      legacySlug: "mcp-server-redis",
      status: "Archived at v2025.4.25",
      replacement: "redis-mcp-server (PyPI) or @upstash/mcp-server (npm)",
      reason: "Vendor-maintained servers add Redis Streams, JSON, and vector index search tools."
    }
  ];

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Report",
    name: "October 2026 AI Agent Stack Volatility & MCP Schema Drift Report",
    datePublished: catalog.generatedAt,
    dateModified: catalog.generatedAt,
    url: "https://agentbreakwatch.vercel.app/drift-report",
    author: {
      "@type": "Organization",
      name: "AgentBreakWatch"
    },
    description: `Live telemetry report tracking ${totalReleases90d} releases over the past 90 days across ${catalog.totalTracked} AI Agent SDKs and MCP servers.`
  };

  return (
    <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      {/* Header */}
      <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-6 sm:p-8">
        <div className="inline-flex items-center gap-2 rounded border border-amber-500/30 bg-amber-500/10 px-2.5 py-1 font-mono text-xs font-semibold text-amber-300">
          LIVE TELEMETRY BENCHMARK • UPDATED {catalog.generatedAt.slice(0, 10)}
        </div>
        <h1 className="mt-4 font-mono text-2xl font-extrabold text-white sm:text-4xl">
          October 2026 AI Agent Stack Volatility &amp; MCP Schema Drift Report
        </h1>
        <p className="mt-3 max-w-3xl text-sm leading-relaxed text-zinc-300">
          We analyzed release timestamps, dependency graphs, and `tools/list` JSON Schema changes across{" "}
          <strong>{catalog.totalTracked} production AI packages</strong> ({catalog.sdkCount} core Agent SDKs and{" "}
          {catalog.mcpCount} Model Context Protocol servers on npm and PyPI). Here is what is breaking production agents right now.
        </p>

        {/* Cite-Ready Key Findings Box */}
        <div className="mt-6 rounded-lg border border-emerald-500/30 bg-emerald-950/15 p-5">
          <div className="font-mono text-xs font-bold uppercase text-emerald-400">
            Executive Summary &amp; Citation Key Findings
          </div>
          <ul className="mt-2.5 space-y-1.5 text-xs sm:text-sm text-zinc-200 list-disc pl-5">
            <li>
              <strong>{totalReleases90d.toLocaleString()} total releases</strong> shipped across the{" "}
              {catalog.totalTracked} tracked Agent SDKs and MCP servers in the last 90 days (an average of{" "}
              {(totalReleases90d / catalog.totalTracked).toFixed(1)} releases per package).
            </li>
            <li>
              <strong>{highRiskItems.length} packages ({Math.round((highRiskItems.length / catalog.totalTracked) * 100)}%)</strong>{" "}
              carry a <strong>HIGH schema drift risk</strong> due to 0.x rapid iteration, major transport migrations (SSE to Streamable HTTP), or archived reference status.
            </li>
            <li>
              Unpinned <code>npx -y @org/mcp-server@latest</code> commands in <code>.mcp.json</code> are the #1 cause of silent production tool-call failures in 2026.
            </li>
          </ul>
        </div>
      </div>

      {/* Top 25 Highest-Velocity Packages */}
      <section className="mt-10 rounded-xl border border-zinc-800 bg-zinc-900/40 overflow-hidden">
        <div className="border-b border-zinc-800 px-6 py-4">
          <h2 className="font-mono text-lg font-bold text-white">
            1. Top 25 Fastest-Moving Agent SDKs &amp; MCP Servers (90-Day Release Velocity)
          </h2>
          <p className="mt-1 text-xs text-zinc-400">
            Packages shipping the highest number of registry releases over the last 90 days require strict version pinning and automated CI drift checks.
          </p>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left font-mono text-xs">
            <thead className="border-b border-zinc-800 bg-zinc-950/80 text-[11px] uppercase text-zinc-400">
              <tr>
                <th className="px-4 py-3">Rank</th>
                <th className="px-4 py-3">Package</th>
                <th className="px-4 py-3">Kind</th>
                <th className="px-4 py-3">90d Releases</th>
                <th className="px-4 py-3">Live Version</th>
                <th className="px-4 py-3">Last Published</th>
                <th className="px-4 py-3">Drift Risk</th>
                <th className="px-4 py-3">Stability</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-800/70">
              {highVelocity.map((item, idx) => (
                <tr key={item.slug} className="hover:bg-zinc-900/80 transition">
                  <td className="px-4 py-3 text-zinc-500">#{idx + 1}</td>
                  <td className="px-4 py-3">
                    <Link
                      href={`/p/${item.slug}`}
                      className="font-bold text-white hover:text-emerald-400 underline-offset-2 hover:underline"
                    >
                      {item.packageName}
                    </Link>
                    <div className="text-[11px] font-sans text-zinc-400">{item.vendor}</div>
                  </td>
                  <td className="px-4 py-3 uppercase text-zinc-300">
                    {item.kind} ({item.registry})
                  </td>
                  <td className="px-4 py-3 font-bold text-amber-400">{item.releasesLast90d} releases</td>
                  <td className="px-4 py-3 text-emerald-400">v{item.latestVersion}</td>
                  <td className="px-4 py-3 text-zinc-400">{item.latestPublishedAt.slice(0, 10)}</td>
                  <td className="px-4 py-3 uppercase">
                    <span
                      className={
                        item.schemaDriftRisk === "high"
                          ? "text-rose-400 font-semibold"
                          : item.schemaDriftRisk === "medium"
                          ? "text-amber-400"
                          : "text-emerald-400"
                      }
                    >
                      {item.schemaDriftRisk}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-white">
                    {item.stabilityGrade} ({item.stabilityScore}/100)
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* Archived Reference MCP Replacement Matrix */}
      <section className="mt-10 rounded-xl border border-zinc-800 bg-zinc-900/40 overflow-hidden">
        <div className="border-b border-zinc-800 px-6 py-4">
          <h2 className="font-mono text-lg font-bold text-white">
            2. Archived Official @modelcontextprotocol/server-* Migration Matrix
          </h2>
          <p className="mt-1 text-xs text-zinc-400">
            Several early reference MCP servers remain in thousands of copy-pasted `.mcp.json` files despite being archived in favor of official vendor servers.
          </p>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left font-mono text-xs">
            <thead className="border-b border-zinc-800 bg-zinc-950/80 text-[11px] uppercase text-zinc-400">
              <tr>
                <th className="px-4 py-3">Legacy Package</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Recommended 2026 Replacement</th>
                <th className="px-4 py-3">Migration Rationale</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-800/70">
              {archivedReplacements.map((row) => (
                <tr key={row.legacyPkg} className="hover:bg-zinc-900/80">
                  <td className="px-4 py-3">
                    <Link
                      href={`/p/${row.legacySlug}`}
                      className="font-bold text-rose-300 hover:underline"
                    >
                      {row.legacyPkg}
                    </Link>
                  </td>
                  <td className="px-4 py-3 text-amber-400">{row.status}</td>
                  <td className="px-4 py-3 text-emerald-300">{row.replacement}</td>
                  <td className="px-4 py-3 font-sans text-zinc-300">{row.reason}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* Category Breakdown */}
      <section className="mt-10 rounded-xl border border-zinc-800 bg-zinc-900/40 overflow-hidden">
        <div className="border-b border-zinc-800 px-6 py-4">
          <h2 className="font-mono text-lg font-bold text-white">
            3. Stability &amp; Drift Risk Breakdown by Ecosystem Category
          </h2>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left font-mono text-xs">
            <thead className="border-b border-zinc-800 bg-zinc-950/80 text-[11px] uppercase text-zinc-400">
              <tr>
                <th className="px-4 py-3">Category Hub</th>
                <th className="px-4 py-3">Tracked Packages</th>
                <th className="px-4 py-3">High Drift Risk</th>
                <th className="px-4 py-3">Avg Stability Score</th>
                <th className="px-4 py-3">90d Releases</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-800/70">
              {CATEGORY_HUBS.map((hub) => {
                const hubItems = getItemsForCategoryHub(hub);
                const avg = hubItems.length
                  ? Math.round(hubItems.reduce((a, b) => a + b.stabilityScore, 0) / hubItems.length)
                  : 85;
                const highRisk = hubItems.filter((i) => i.schemaDriftRisk === "high").length;
                const rel90 = hubItems.reduce((a, b) => a + b.releasesLast90d, 0);

                return (
                  <tr key={hub.slug} className="hover:bg-zinc-900/80">
                    <td className="px-4 py-3">
                      <Link
                        href={`/c/${hub.slug}`}
                        className="font-bold text-emerald-400 hover:underline"
                      >
                        {hub.title}
                      </Link>
                    </td>
                    <td className="px-4 py-3 text-white">{hubItems.length}</td>
                    <td className="px-4 py-3 text-rose-400">{highRisk}</td>
                    <td className="px-4 py-3 text-emerald-300">{avg}/100</td>
                    <td className="px-4 py-3 text-zinc-300">{rel90}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </section>

      <div className="mt-12">
        <SubscribeBox />
      </div>
    </div>
  );
}
