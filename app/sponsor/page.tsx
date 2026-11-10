import type { Metadata } from "next";
import { catalog } from "@/lib/catalog";
import { CheckoutLink } from "@/components/CheckoutLink";

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
            <div className="font-mono text-xs uppercase text-emerald-400">Weekly Featured Slot</div>
            <div className="mt-2 font-mono text-3xl font-bold text-white">$149 / week</div>
            <ul className="mt-4 space-y-2 text-xs text-zinc-300">
              <li>+ Top banner badge across all {catalog.totalTracked + 18} pages on AgentBreakWatch</li>
              <li>+ Featured placement in the Weekly Agent Stack Changelog email digest</li>
              <li>+ Highlighted "Verified Partner" badge on your MCP server or SDK listing page</li>
              <li>+ Direct link with UTM tracking to your docs or signup page</li>
            </ul>
          </div>

          <div className="mt-6">
            <CheckoutLink
              plan="sponsor"
              location="sponsor"
              className="block w-full rounded-md bg-emerald-500 py-2.5 text-center font-mono text-xs font-semibold text-zinc-950 hover:bg-emerald-400 transition"
            >
              Checkout Weekly Sponsor Slot ($149)
            </CheckoutLink>
            <p className="mt-2 text-center text-[11px] text-zinc-500">One time payment of $149. No trial.</p>
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
              href="mailto:vikingtradingholding@gmail.com?subject=Monthly%20Partner%20Slot%20Inquiry"
              className="block w-full rounded-md border border-zinc-700 bg-zinc-950 py-2.5 text-center font-mono text-xs font-semibold text-white hover:border-emerald-500/50 transition"
            >
              Ask about a monthly partner slot
            </a>
            <p className="mt-2 text-center text-[11px] text-zinc-500">
              Opens an email to vikingtradingholding@gmail.com. No payment is taken here.
            </p>
          </div>
        </div>
      </div>

      <div id="activate-sponsor" className="mt-10 rounded-xl border border-zinc-800 bg-zinc-900/50 p-6">
        <div className="font-mono text-xs uppercase text-emerald-400">After you pay</div>
        <h2 className="mt-2 font-mono text-xl font-bold text-white">How to send us your sponsor details</h2>
        <ol className="mt-4 list-decimal space-y-2 pl-5 text-sm leading-relaxed text-zinc-300">
          <li>Pay for the weekly sponsor slot ($149) with the Stripe checkout button above.</li>
          <li>
            Reply to your Stripe receipt email, or email{" "}
            <a href="mailto:vikingtradingholding@gmail.com" className="text-emerald-300 underline hover:text-emerald-200">
              vikingtradingholding@gmail.com
            </a>
            , with your company URL and a 1-sentence banner copy.
          </li>
          <li>We will reply to confirm the week your placement goes live.</li>
        </ol>
      </div>
    </div>
  );
}
