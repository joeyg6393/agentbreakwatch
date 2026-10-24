import Link from "next/link";
import { catalog } from "@/lib/catalog";

export function Navbar() {
  return (
    <header className="sticky top-0 z-40 border-b border-zinc-800/80 bg-[#090a0f]/90 backdrop-blur">
      {/* Sponsor Banner Strip */}
      <div className="border-b border-zinc-800/60 bg-zinc-950 px-4 py-1.5 text-center text-xs text-zinc-400">
        <span className="mr-2 inline-block rounded bg-amber-500/10 px-1.5 py-0.5 font-mono text-[10px] font-semibold uppercase tracking-wider text-amber-400 border border-amber-500/20">
          Sponsor Slot Open
        </span>
        <span>
          Reach builders tracking {catalog.sdkCount} Agent SDKs and {catalog.mcpCount} MCP servers.
        </span>{" "}
        <Link href="/sponsor" className="font-medium text-emerald-400 underline underline-offset-2 hover:text-emerald-300">
          Book featured placement ($150/wk)
        </Link>
      </div>

      <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3.5 sm:px-6 lg:px-8">
        <div className="flex items-center gap-6">
          <Link href="/" className="flex items-center gap-2.5 group">
            <div className="flex h-8 w-8 items-center justify-center rounded-md border border-emerald-500/40 bg-emerald-500/10 font-mono text-sm font-bold text-emerald-400 group-hover:border-emerald-400">
              Δ
            </div>
            <div>
              <span className="font-mono text-base font-bold tracking-tight text-white">
                AgentBreakWatch
              </span>
              <span className="ml-2 hidden rounded border border-zinc-700 bg-zinc-900 px-1.5 py-0.5 font-mono text-[10px] text-zinc-400 sm:inline-block">
                LIVE INDEX: {catalog.totalTracked}
              </span>
            </div>
          </Link>

          <nav className="hidden md:flex items-center gap-5 text-sm text-zinc-400">
            <Link href="/#directory" className="hover:text-white transition">
              Directory ({catalog.totalTracked})
            </Link>
            <Link href="/c/agent-sdks" className="hover:text-white transition">
              Categories
            </Link>
            <Link href="/drift-report" className="text-amber-300 hover:text-amber-200 transition">
              Drift Report
            </Link>
            <Link href="/check" className="hover:text-white transition">
              Stack Checker
            </Link>
            <Link href="/pricing" className="hover:text-white transition">
              Pricing
            </Link>
            <Link href="/llms.txt" className="font-mono text-xs text-zinc-500 hover:text-emerald-400 transition">
              /llms.txt
            </Link>
          </nav>
        </div>

        <div className="flex items-center gap-3">
          <Link
            href="/check"
            className="rounded-md border border-zinc-700 bg-zinc-900 px-3 py-1.5 font-mono text-xs font-medium text-zinc-200 hover:border-zinc-500 hover:bg-zinc-800 transition"
          >
            Audit .mcp.json
          </Link>
          <Link
            href="/pricing"
            className="rounded-md bg-emerald-500 px-3.5 py-1.5 font-mono text-xs font-semibold text-zinc-950 hover:bg-emerald-400 transition"
          >
            Get Alerts
          </Link>
        </div>
      </div>
    </header>
  );
}
