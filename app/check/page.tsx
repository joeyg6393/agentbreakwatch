import type { Metadata } from "next";
import { StackChecker } from "@/components/StackChecker";
import { SubscribeBox } from "@/components/SubscribeBox";
import { catalog } from "@/lib/catalog";

export const metadata: Metadata = {
  alternates: {
    canonical: "https://agentbreakwatch.com/check"
  },
  title: "Audit Your .mcp.json, package.json, or requirements.txt",
  description: `Drop your agent dependency manifest or .mcp.json config to detect breaking version deltas, unpinned @latest MCP servers, and tool schema drift across ${catalog.totalTracked} live packages.`
};

export default function CheckPage() {
  return (
    <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
      <div className="max-w-3xl">
        <span className="rounded border border-emerald-500/30 bg-emerald-500/10 px-2.5 py-1 font-mono text-xs font-semibold text-emerald-300">
          ZERO-SIGNUP CONFIG AUDITOR
        </span>
        <h1 className="mt-3 font-mono text-3xl font-extrabold text-white sm:text-4xl">
          Paste Your Agent Stack to Detect Breaking Releases &amp; Drift
        </h1>
        <p className="mt-3 text-sm leading-relaxed text-zinc-300">
          Compare your `.mcp.json`, `package.json`, or `requirements.txt` against our live index of{" "}
          {catalog.sdkCount} Agent SDKs and {catalog.mcpCount} MCP servers. We flag major version jumps, archived official MCP servers, and unpinned `@latest` servers that can silently break tool calls.
        </p>
      </div>

      <div className="mt-8">
        <StackChecker defaultSample="mcp" />
      </div>

      <div className="mt-12 grid grid-cols-1 gap-6 md:grid-cols-3">
        <div className="rounded-xl border border-zinc-800 bg-zinc-900/40 p-5">
          <div className="font-mono text-xs font-bold uppercase text-emerald-400">
            1. Pin Unpinned MCP Servers
          </div>
          <p className="mt-2 text-xs leading-relaxed text-zinc-300">
            Running `npx -y @org/mcp-server@latest` in production pulls new `tools/list` input schemas on every container restart. Always pin exact versions.
          </p>
        </div>
        <div className="rounded-xl border border-zinc-800 bg-zinc-900/40 p-5">
          <div className="font-mono text-xs font-bold uppercase text-amber-400">
            2. Replace Archived Reference Servers
          </div>
          <p className="mt-2 text-xs leading-relaxed text-zinc-300">
            Several early `@modelcontextprotocol/server-*` packages (`server-github`, `server-postgres`, `server-puppeteer`) are archived and superseded by vendor-maintained servers.
          </p>
        </div>
        <div className="rounded-xl border border-zinc-800 bg-zinc-900/40 p-5">
          <div className="font-mono text-xs font-bold uppercase text-rose-400">
            3. Automate Schema Drift Alerts
          </div>
          <p className="mt-2 text-xs leading-relaxed text-zinc-300">
            Save your stack once to get instant email or Slack/webhook alerts with tested before-and-after code snippets whenever a dependency ships a breaking change.
          </p>
        </div>
      </div>

      <div className="mt-12">
        <SubscribeBox />
      </div>
    </div>
  );
}
