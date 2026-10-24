import type { Metadata } from "next";
import { SubscribeBox } from "@/components/SubscribeBox";
import { catalog } from "@/lib/catalog";

export const metadata: Metadata = {
  title: "Sponsor AgentBreakWatch",
  description:
    "Put your AI SDK, MCP server, gateway, or observability tool in front of engineers actively maintaining production AI agents."
};

export default function SponsorPage() {
  return (
    <div className="mx-auto max-w-5xl px-4 py-12 sm:px-6 lg:px-8">
      <div className="max-w-3xl">
        <span className="rounded border border-amber-500/30 bg-amber-500/10 px-3 py-1 font-mono text-xs font-semibold text-amber-300">
          SPONSORSHIP &amp; FEATURED SLOTS
        </span>
        <h1 className="mt-4 font-mono text-3xl font-extrabold text-white sm:text-5xl">
          Reach Engineers Building Production AI Agents &amp; MCP Stacks
        </h1>
        <p className="mt-4 text-sm leading-relaxed text-zinc-300">
          Every visitor on AgentBreakWatch is actively auditing a `.mcp.json`, `package.json`, or `requirements.txt` for an AI agent in production. We offer one exclusive sponsor slot at the top of the directory and in our weekly Agent Stack Changelog digest.
        </p>
      </div>

      <div className="mt-10 grid grid-cols-1 gap-6 md:grid-cols-2">
        <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-6">
          <div className="font-mono text-xs uppercase text-amber-400">Weekly Slot</div>
          <div className="mt-2 font-mono text-3xl font-bold text-white">$150 / week</div>
          <ul className="mt-4 space-y-2 text-xs text-zinc-300">
            <li>+ Top banner badge across all {catalog.totalTracked + 5} pages on AgentBreakWatch</li>
            <li>+ Featured placement in the Weekly Agent Stack Changelog email digest</li>
            <li>+ Highlighted "Verified Partner" badge on your MCP server or SDK listing page</li>
            <li>+ Direct link with UTM tracking to your docs or signup page</li>
          </ul>
        </div>

        <div className="rounded-xl border border-emerald-500/40 bg-zinc-900/70 p-6">
          <div className="font-mono text-xs uppercase text-emerald-400">Monthly Exclusive Partner</div>
          <div className="mt-2 font-mono text-3xl font-bold text-white">$450 / month</div>
          <ul className="mt-4 space-y-2 text-xs text-zinc-300">
            <li>+ 4 consecutive weeks of sitewide header banner &amp; digest placement</li>
            <li>+ Recommended fallback callout inside the interactive Stack Checker</li>
            <li>+ Inclusion in `/llms.txt` partner section for AI coding assistant discovery</li>
            <li>+ Dedicated changelog alert coverage for every release you ship</li>
          </ul>
        </div>
      </div>

      <div className="mt-10">
        <SubscribeBox
          defaultPlan="sponsor"
          heading="Reserve a Sponsor Slot"
          subtext="Drop your work email and company URL below to lock in the next available weekly ($150) or monthly ($450) sponsor slot."
        />
      </div>
    </div>
  );
}
