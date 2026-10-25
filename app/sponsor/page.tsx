import type { Metadata } from "next";
import Link from "next/link";
import { SubscribeBox } from "@/components/SubscribeBox";
import { catalog } from "@/lib/catalog";

export const metadata: Metadata = {
  alternates: {
    canonical: "https://agentbreakwatch.com/sponsor"
  },
  title: "Sponsor AgentBreakWatch",
  description:
    "Put your AI SDK, MCP server, gateway, or observability tool in front of engineers actively maintaining production AI agents."
};

export default function SponsorPage() {
  return (
    <div className="mx-auto max-w-5xl px-4 py-12 sm:px-6 lg:px-8">
      <div className="max-w-3xl">
        <span className="rounded border border-amber-500/30 bg-amber-500/10 px-3 py-1 font-mono text-xs font-semibold text-amber-300">
          SPONSORSHIP &amp; FEATURED SLOTS • STRIPE VERIFIED
        </span>
        <h1 className="mt-4 font-mono text-3xl font-extrabold text-white sm:text-5xl">
          Reach Engineers Building Production AI Agents &amp; MCP Stacks
        </h1>
        <p className="mt-4 text-sm leading-relaxed text-zinc-300">
          Every visitor on AgentBreakWatch is actively auditing a `.mcp.json`, `package.json`, or `requirements.txt` for an AI agent in production. We offer one exclusive sponsor slot at the top of the directory and in our weekly Agent Stack Changelog digest.
        </p>
      </div>

      <div className="mt-10 grid grid-cols-1 gap-6 md:grid-cols-2">
        <div className="flex flex-col justify-between rounded-xl border border-emerald-500/40 bg-zinc-900/70 p-6">
          <div>
            <div className="flex items-center justify-between">
              <div className="font-mono text-xs uppercase text-emerald-400">Weekly Featured Slot</div>
              <span className="rounded bg-emerald-500/15 px-2 py-0.5 font-mono text-[10px] text-emerald-300">
                prod_VV4cg2xIW2rcpL
              </span>
            </div>
            <div className="mt-2 font-mono text-3xl font-bold text-white">$149 / week</div>
            <ul className="mt-4 space-y-2 text-xs text-zinc-300">
              <li>+ Top banner badge across all {catalog.totalTracked + 18} pages on AgentBreakWatch</li>
              <li>+ Featured placement in the Weekly Agent Stack Changelog email digest</li>
              <li>+ Highlighted "Verified Partner" badge on your MCP server or SDK listing page</li>
              <li>+ Direct link with UTM tracking to your docs or signup page</li>
            </ul>
          </div>

          <div className="mt-6">
            <Link
              href="/api/checkout?plan=sponsor"
              className="block w-full rounded-md bg-emerald-500 py-2.5 text-center font-mono text-xs font-semibold text-zinc-950 hover:bg-emerald-400 transition"
            >
              Checkout Weekly Sponsor Slot ($149)
            </Link>
          </div>
        </div>

        <div className="flex flex-col justify-between rounded-xl border border-zinc-800 bg-zinc-900/50 p-6">
          <div>
            <div className="font-mono text-xs uppercase text-amber-400">Monthly Exclusive Partner</div>
            <div className="mt-2 font-mono text-3xl font-bold text-white">$450 / month</div>
            <ul className="mt-4 space-y-2 text-xs text-zinc-300">
              <li>+ 4 consecutive weeks of sitewide header banner &amp; digest placement</li>
              <li>+ Recommended fallback callout inside the interactive Stack Checker</li>
              <li>+ Inclusion in `/llms.txt` partner section for AI coding assistant discovery</li>
              <li>+ Dedicated changelog alert coverage for every release you ship</li>
            </ul>
          </div>

          <div className="mt-6">
            <a
              href="#activate-sponsor"
              className="block w-full rounded-md border border-zinc-700 bg-zinc-950 py-2.5 text-center font-mono text-xs font-semibold text-white hover:border-emerald-500/50 transition"
            >
              Reserve Monthly Partner Slot ($450/mo)
            </a>
          </div>
        </div>
      </div>

      <div id="activate-sponsor" className="mt-10">
        <SubscribeBox
          defaultPlan="sponsor"
          heading="Complete Sponsor Booking Details"
          subtext="Drop your work email, company URL, and 1-sentence banner copy below so we can schedule your featured slot."
        />
      </div>
    </div>
  );
}
