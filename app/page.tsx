import Link from "next/link";
import { catalog } from "@/lib/catalog";
import { StackChecker } from "@/components/StackChecker";
import { CatalogExplorer } from "@/components/CatalogExplorer";
import { SubscribeBox } from "@/components/SubscribeBox";

export default function HomePage() {
  const highRiskItems = catalog.items.filter((i) => i.schemaDriftRisk === "high");
  const recentItems = [...catalog.items]
    .sort((a, b) => new Date(b.latestPublishedAt).getTime() - new Date(a.latestPublishedAt).getTime())
    .slice(0, 6);

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    name: "AgentBreakWatch",
    applicationCategory: "DeveloperApplication",
    operatingSystem: "Web",
    description:
      "Breaking-change tracker and MCP tool schema drift monitor for AI agent SDKs and Model Context Protocol servers.",
    offers: {
      "@type": "Offer",
      price: "0",
      priceCurrency: "USD"
    }
  };

  return (
    <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      {/* Hero Section */}
      <div className="mx-auto max-w-4xl text-center">
        <div className="inline-flex items-center gap-2 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-3.5 py-1 font-mono text-xs text-emerald-300">
          <span>LIVE REGISTRY FEED</span>
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

      {/* Recent Live Registry Releases Strip */}
      <section className="mt-12">
        <div className="flex items-center justify-between">
          <h2 className="font-mono text-sm font-semibold uppercase tracking-wider text-zinc-300">
            Latest Live Registry Releases (npm &amp; PyPI)
          </h2>
          <Link href="/api/catalog.json" className="font-mono text-xs text-emerald-400 hover:underline">
            JSON API Feed -&gt;
          </Link>
        </div>

        <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {recentItems.map((item) => (
            <Link
              key={item.slug}
              href={`/p/${item.slug}`}
              className="flex items-center justify-between rounded-lg border border-zinc-800/80 bg-zinc-900/40 px-4 py-3 hover:border-emerald-500/40 transition"
            >
              <div className="min-w-0 pr-3">
                <div className="truncate font-mono text-xs font-bold text-white">
                  {item.packageName}
                </div>
                <div className="truncate text-[11px] text-zinc-400">
                  {item.vendor} • {item.registry.toUpperCase()}
                </div>
              </div>
              <div className="text-right font-mono">
                <div className="text-xs font-semibold text-emerald-400">v{item.latestVersion}</div>
                <div className="text-[10px] text-zinc-500">{item.latestPublishedAt.slice(0, 10)}</div>
              </div>
            </Link>
          ))}
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
