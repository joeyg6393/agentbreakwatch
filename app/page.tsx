import Link from "next/link";
import { catalog, CATEGORY_HUBS, getItemsForCategoryHub } from "@/lib/catalog";
import { StackChecker } from "@/components/StackChecker";
import { CatalogExplorer } from "@/components/CatalogExplorer";
import { SubscribeBox } from "@/components/SubscribeBox";

export default function HomePage() {
  const highRiskItems = catalog.items.filter((i) => i.schemaDriftRisk === "high");
  const recentItems = [...catalog.items]
    .sort((a, b) => new Date(b.latestPublishedAt).getTime() - new Date(a.latestPublishedAt).getTime())
    .slice(0, 9);

  const jsonLd = [
    {
      "@context": "https://schema.org",
      "@type": "SoftwareApplication",
      name: "AgentBreakWatch",
      applicationCategory: "DeveloperApplication",
      operatingSystem: "Web",
      url: "https://agentbreakwatch.vercel.app",
      description: `Breaking-change tracker and MCP tool schema drift monitor across ${catalog.sdkCount} core AI Agent SDKs and ${catalog.mcpCount} Model Context Protocol servers.`,
      offers: {
        "@type": "Offer",
        price: "0",
        priceCurrency: "USD"
      }
    },
    {
      "@context": "https://schema.org",
      "@type": "FAQPage",
      mainEntity: [
        {
          "@type": "Question",
          name: "What does AgentBreakWatch monitor?",
          acceptedAnswer: {
            "@type": "Answer",
            text: `AgentBreakWatch polls live npm and PyPI registries for ${catalog.sdkCount} core AI Agent SDKs (OpenAI, Anthropic, Vercel AI SDK, LangGraph, Mastra, CrewAI, FastMCP, PydanticAI) and ${catalog.mcpCount} MCP servers, tracking breaking releases, tools/list JSON Schema parameter drift, and copy-paste migration snippets.`
          }
        },
        {
          "@type": "Question",
          name: "Why do unpinned MCP servers break production AI agents?",
          acceptedAnswer: {
            "@type": "Answer",
            text: "Running npx -y @org/mcp-server@latest or uvx pkg@latest pulls the newest release on every container restart. When an MCP server renames a tool or adds a required JSON Schema parameter, agent tool calls silently fail unless exact versions are pinned in .mcp.json."
          }
        }
      ]
    }
  ];

  return (
    <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      {/* Hero Section */}
      <div className="mx-auto max-w-4xl text-center">
        <div className="inline-flex flex-wrap items-center justify-center gap-2 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-3.5 py-1 font-mono text-xs text-emerald-300">
          <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
          <span>LIVE REGISTRY TELEMETRY</span>
          <span>•</span>
          <span>{catalog.sdkCount} AGENT SDKS</span>
          <span>•</span>
          <span>{catalog.mcpCount} MCP SERVERS</span>
        </div>

        <h1 className="mt-5 font-mono text-3xl font-extrabold tracking-tight text-white sm:text-5xl">
          Catch Breaking SDK Releases &amp; MCP Schema Drift Before Your Agents Fail
        </h1>

        <p className="mx-auto mt-4 max-w-2xl text-base leading-relaxed text-zinc-300">
          Production agents silently break when an MCP server renames a `tools/list` parameter or an SDK ships a breaking release. Paste your `.mcp.json`, `package.json`, or `requirements.txt` below for an instant live audit and copy-paste migration snippets.
        </p>

        {/* Quick Metric Bar */}
        <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
          <div className="rounded-lg border border-zinc-800 bg-zinc-900/60 p-3">
            <div className="font-mono text-2xl font-bold text-white">{catalog.totalTracked}</div>
            <div className="font-mono text-[11px] uppercase text-zinc-400">Tracked Packages</div>
          </div>
          <div className="rounded-lg border border-zinc-800 bg-zinc-900/60 p-3">
            <div className="font-mono text-2xl font-bold text-emerald-400">{catalog.sdkCount}</div>
            <div className="font-mono text-[11px] uppercase text-zinc-400">Core Agent SDKs</div>
          </div>
          <div className="rounded-lg border border-zinc-800 bg-zinc-900/60 p-3">
            <div className="font-mono text-2xl font-bold text-amber-400">{catalog.mcpCount}</div>
            <div className="font-mono text-[11px] uppercase text-zinc-400">MCP Servers</div>
          </div>
          <div className="rounded-lg border border-zinc-800 bg-zinc-900/60 p-3">
            <div className="font-mono text-2xl font-bold text-rose-400">{highRiskItems.length}</div>
            <div className="font-mono text-[11px] uppercase text-zinc-400">High Drift Risk</div>
          </div>
        </div>
      </div>

      {/* Hero Interactive Tool */}
      <div className="mt-8">
        <StackChecker defaultSample="mcp" />
      </div>

      {/* Live Breaking-Change & Release Feed Timeline */}
      <section className="mt-12 rounded-xl border border-zinc-800 bg-zinc-900/30 p-5 sm:p-6">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-zinc-800/80 pb-4">
          <div className="flex items-center gap-2.5">
            <span className="h-2.5 w-2.5 rounded-full bg-emerald-400" />
            <h2 className="font-mono text-sm font-bold uppercase tracking-wider text-white">
              Live Registry Release &amp; Drift Feed (npm &amp; PyPI)
            </h2>
          </div>
          <div className="flex items-center gap-4 font-mono text-xs">
            <Link href="/drift-report" className="text-amber-400 hover:underline">
              Oct 2026 Volatility Report -&gt;
            </Link>
            <Link href="/api/catalog.json" className="text-emerald-400 hover:underline">
              JSON API -&gt;
            </Link>
          </div>
        </div>

        <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {recentItems.map((item) => {
            const prevVer = item.recentVersions?.[1]?.version;
            const riskColor =
              item.schemaDriftRisk === "high"
                ? "border-rose-500/30 bg-rose-500/10 text-rose-300"
                : item.schemaDriftRisk === "medium"
                ? "border-amber-500/30 bg-amber-500/10 text-amber-300"
                : "border-emerald-500/30 bg-emerald-500/10 text-emerald-300";

            return (
              <Link
                key={item.slug}
                href={`/p/${item.slug}`}
                className="flex flex-col justify-between rounded-lg border border-zinc-800/90 bg-zinc-950/70 p-3.5 hover:border-emerald-500/50 transition"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <div className="truncate font-mono text-xs font-bold text-white">
                      {item.packageName}
                    </div>
                    <div className="mt-0.5 truncate text-[11px] text-zinc-400">
                      {item.displayName} • {item.registry.toUpperCase()}
                    </div>
                  </div>
                  <span className={`shrink-0 rounded border px-1.5 py-0.5 font-mono text-[10px] uppercase ${riskColor}`}>
                    {item.schemaDriftRisk}
                  </span>
                </div>

                <div className="mt-3 flex items-center justify-between border-t border-zinc-800/70 pt-2.5 font-mono text-[11px]">
                  <div className="text-emerald-400 font-semibold">
                    {prevVer ? `v${prevVer} -> v${item.latestVersion}` : `v${item.latestVersion}`}
                  </div>
                  <div className="text-zinc-500">
                    {item.latestPublishedAt.slice(0, 10)} • {item.stabilityGrade} ({item.stabilityScore})
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      </section>

      {/* Programmatic Category Hubs Grid */}
      <section className="mt-12">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <h2 className="font-mono text-lg font-bold text-white sm:text-xl">
              Browse by Agent Stack Category Hub
            </h2>
            <p className="mt-1 text-xs text-zinc-400">
              Dedicated stability leaderboards, version pin matrices, and schema drift reports by ecosystem category.
            </p>
          </div>
          <Link
            href="/drift-report"
            className="rounded-md border border-amber-500/40 bg-amber-500/10 px-3 py-1.5 font-mono text-xs font-semibold text-amber-300 hover:bg-amber-500/20 transition"
          >
            View Full Drift &amp; Volatility Report -&gt;
          </Link>
        </div>

        <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
          {CATEGORY_HUBS.map((hub) => {
            const hubItems = getItemsForCategoryHub(hub);
            const avgScore = hubItems.length
              ? Math.round(hubItems.reduce((acc, i) => acc + i.stabilityScore, 0) / hubItems.length)
              : 85;
            const highRisk = hubItems.filter((i) => i.schemaDriftRisk === "high").length;

            return (
              <Link
                key={hub.slug}
                href={`/c/${hub.slug}`}
                className="group flex flex-col justify-between rounded-xl border border-zinc-800/90 bg-zinc-900/40 p-4 hover:border-emerald-500/50 hover:bg-zinc-900/80 transition"
              >
                <div>
                  <div className="flex items-center justify-between font-mono text-xs">
                    <span className="font-bold text-white group-hover:text-emerald-400 transition">
                      {hub.shortTitle}
                    </span>
                    <span className="rounded bg-zinc-950 px-2 py-0.5 text-[10px] text-emerald-400 border border-zinc-800">
                      {hubItems.length} pkgs
                    </span>
                  </div>
                  <p className="mt-2 line-clamp-2 text-[11px] leading-relaxed text-zinc-400">
                    {hub.description}
                  </p>
                </div>

                <div className="mt-3 border-t border-zinc-800/70 pt-2.5 font-mono text-[10px] text-zinc-400 flex items-center justify-between">
                  <span>Avg Stability: {avgScore}/100</span>
                  <span className="text-rose-400">{highRisk} high risk</span>
                </div>
              </Link>
            );
          })}
        </div>
      </section>

      {/* Full Filterable Directory */}
      <CatalogExplorer items={catalog.items} />

      {/* Bottom Email Signup */}
      <div className="mt-14">
        <SubscribeBox />
      </div>
    </div>
  );
}
