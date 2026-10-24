import Link from "next/link";
import { catalog, CATEGORY_HUBS } from "@/lib/catalog";

export function Footer() {
  return (
    <footer className="border-t border-zinc-800/80 bg-zinc-950 py-12 text-sm text-zinc-400">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 gap-8 md:grid-cols-5">
          <div className="md:col-span-2">
            <div className="flex items-center gap-2 font-mono text-base font-bold text-white">
              <span className="text-emerald-400">Δ</span> AgentBreakWatch
            </div>
            <p className="mt-2 max-w-md text-xs leading-relaxed text-zinc-400">
              Automated breaking-change and MCP tool schema drift tracker for AI agent builders.
              Polls live npm and PyPI registries for {catalog.sdkCount} core Agent SDKs and{" "}
              {catalog.mcpCount} MCP servers, with copy-paste migration snippets.
            </p>
            <p className="mt-3 font-mono text-[11px] text-zinc-500">
              Last live registry sync: {catalog.generatedAt.slice(0, 16).replace("T", " ")} UTC
            </p>
          </div>

          <div>
            <h3 className="font-mono text-xs font-semibold uppercase tracking-wider text-zinc-200">
              Product &amp; Reports
            </h3>
            <ul className="mt-3 space-y-2 text-xs">
              <li>
                <Link href="/check" className="hover:text-white">
                  Paste-Your-Stack Config Checker
                </Link>
              </li>
              <li>
                <Link href="/drift-report" className="text-amber-300 hover:text-white">
                  Oct 2026 Volatility &amp; Drift Report
                </Link>
              </li>
              <li>
                <Link href="/#directory" className="hover:text-white">
                  SDK &amp; MCP Stability Directory
                </Link>
              </li>
              <li>
                <Link href="/pricing" className="hover:text-white">
                  Alert Plans (Free / $9 Indie / $29 Team)
                </Link>
              </li>
              <li>
                <Link href="/sponsor" className="hover:text-white">
                  Sponsor the Weekly Digest
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h3 className="font-mono text-xs font-semibold uppercase tracking-wider text-zinc-200">
              Category Hubs
            </h3>
            <ul className="mt-3 space-y-1.5 text-xs">
              {CATEGORY_HUBS.slice(0, 7).map((hub) => (
                <li key={hub.slug}>
                  <Link href={`/c/${hub.slug}`} className="hover:text-white">
                    {hub.shortTitle}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h3 className="font-mono text-xs font-semibold uppercase tracking-wider text-zinc-200">
              Machine &amp; LLM Feeds
            </h3>
            <ul className="mt-3 space-y-2 font-mono text-xs">
              <li>
                <Link href="/llms.txt" className="text-emerald-400 hover:underline">
                  /llms.txt
                </Link>
              </li>
              <li>
                <Link href="/llms-full.txt" className="text-emerald-400 hover:underline">
                  /llms-full.txt
                </Link>
              </li>
              <li>
                <Link href="/openapi.json" className="text-emerald-400 hover:underline">
                  /openapi.json
                </Link>
              </li>
              <li>
                <Link href="/api/catalog.json" className="text-emerald-400 hover:underline">
                  /api/catalog.json
                </Link>
              </li>
              <li>
                <Link href="/sitemap.xml" className="text-zinc-400 hover:underline">
                  /sitemap.xml
                </Link>
              </li>
            </ul>
          </div>
        </div>
      </div>
    </footer>
  );
}
