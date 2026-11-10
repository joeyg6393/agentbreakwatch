import type { Metadata } from "next";
import Link from "next/link";
import { SubscribeBox } from "@/components/SubscribeBox";
import { CheckoutLink } from "@/components/CheckoutLink";
import { catalog } from "@/lib/catalog";

export const metadata: Metadata = {
  alternates: {
    canonical: "https://agentbreakwatch.com/pricing"
  },
  title: "Pricing & Alert Plans",
  description:
    "Start free with 3 watched SDKs or MCP servers, or upgrade to Indie Pro ($9/mo or $90/yr) and Team ($29/mo or $290/yr) for full .mcp.json and package.json monitoring, instant breaking-change alerts, and Slack/Discord webhooks. Paid plans start with a 7 day free trial."
};

type PaidPlan = "indie" | "indie_annual" | "team" | "team_annual";

type Tier = {
  name: string;
  price: string;
  period: string;
  planCode: string;
  badge: string;
  description: string;
  features: string[];
  ctaMonthly: string;
  ctaMonthlyHref: string;
  checkoutMonthly: PaidPlan | null;
  checkoutAnnual: PaidPlan | null;
  trialMonthly: string | null;
  trialAnnual: string | null;
  ctaAnnual: string | null;
  highlighted: boolean;
};

export default async function PricingPage({
  searchParams
}: {
  searchParams: Promise<{ checkout?: string | string[]; plan?: string | string[] }>;
}) {
  const params = await searchParams;
  const checkoutSuccess = params.checkout === "success";
  const successPlan = typeof params.plan === "string" ? params.plan : "";

  const tiers: Tier[] = [
    {
      name: "Free",
      price: "$0",
      period: "forever",
      planCode: "free",
      badge: "PUBLIC DIRECTORY",
      description: "For solo builders exploring MCP servers and checking configs manually.",
      features: [
        `Full access to all ${catalog.totalTracked} SDK & MCP changelog pages`,
        "Unlimited interactive `.mcp.json` & `package.json` checks",
        "Watch up to 3 packages with weekly digest email",
        "Public `/llms.txt`, `/api/mcp`, and `/api/catalog.json` access"
      ],
      ctaMonthly: "Start Watching Free",
      ctaMonthlyHref: "#activate-indie",
      checkoutMonthly: null,
      checkoutAnnual: null,
      trialMonthly: null,
      trialAnnual: null,
      ctaAnnual: null,
      highlighted: false
    },
    {
      name: "Indie Pro",
      price: "$9",
      period: "/ month ($90/yr)",
      planCode: "indie",
      badge: "MOST POPULAR",
      description: "For indie developers running production AI agents that cannot afford silent tool failures.",
      features: [
        "Watch up to 25 Agent SDKs & MCP servers across your stack",
        "Instant email alerts within 30 minutes of a breaking release",
        "MCP `tools/list` JSON Schema parameter diff alerts",
        "Copy-paste before/after migration code snippets",
        "1 custom HTTP / Slack / Discord webhook endpoint"
      ],
      ctaMonthly: "Start 7 day free trial",
      ctaMonthlyHref: "/api/checkout?plan=indie",
      checkoutMonthly: "indie",
      checkoutAnnual: "indie_annual",
      trialMonthly: "Free for 7 days, then $9/mo. Cancel anytime.",
      trialAnnual: "Free for 7 days, then $90/yr. Cancel anytime.",
      ctaAnnual: "Start 7 day free trial, billed yearly ($90/yr)",
      highlighted: true
    },
    {
      name: "Team",
      price: "$29",
      period: "/ month ($290/yr)",
      planCode: "team",
      badge: "ENGINEERING TEAMS",
      description: "For engineering teams managing multiple agent repositories and production MCP gateways.",
      features: [
        "Unlimited watched SDKs & MCP servers across up to 10 repos",
        "Instant email, Slack, Discord, and PagerDuty webhook alerts",
        "Priority MCP security advisory & command-injection alerts",
        "Team member email routing per repository",
        "Early access to automated GitHub PR migration bot"
      ],
      ctaMonthly: "Start 7 day free trial",
      ctaMonthlyHref: "/api/checkout?plan=team",
      checkoutMonthly: "team",
      checkoutAnnual: "team_annual",
      trialMonthly: "Free for 7 days, then $29/mo. Cancel anytime.",
      trialAnnual: "Free for 7 days, then $290/yr. Cancel anytime.",
      ctaAnnual: "Start 7 day free trial, billed yearly ($290/yr)",
      highlighted: false
    }
  ];

  return (
    <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
      {checkoutSuccess && (
        <div
          role="status"
          className="mb-10 rounded-xl border border-emerald-500/50 bg-emerald-500/10 p-5 text-sm leading-relaxed text-emerald-100"
        >
          {successPlan === "sponsor" ? (
            <>
              <p className="font-mono font-bold text-emerald-300">Thanks. Your sponsor payment went through.</p>
              <p className="mt-1">
                Please email{" "}
                <a href="mailto:vikingtradingholding@gmail.com" className="text-emerald-300 underline hover:text-emerald-200">
                  vikingtradingholding@gmail.com
                </a>{" "}
                with your company URL and one sentence of banner text. We will reply to confirm your week.
              </p>
            </>
          ) : (
            <>
              <p className="font-mono font-bold text-emerald-300">You&apos;re in. Your 7 day free trial has started.</p>
              <p className="mt-1">Check your email for the receipt. You will not be charged until day 8.</p>
            </>
          )}
        </div>
      )}

      <div className="mx-auto max-w-3xl text-center">
        <span className="rounded border border-emerald-500/30 bg-emerald-500/10 px-3 py-1 font-mono text-xs font-semibold text-emerald-300">
          SIMPLE DEVELOPER PRICING • STRIPE VERIFIED
        </span>
        <h1 className="mt-4 font-mono text-3xl font-extrabold text-white sm:text-5xl">
          One Prevented Agent Outage Pays for a Year of Alerts
        </h1>
        <p className="mt-4 text-sm leading-relaxed text-zinc-300">
          Enterprise API drift platforms charge $59 to $179 per month. AgentBreakWatch is built specifically for the AI agent stack starting at $0 for hobbyists and $9/month for production builders.
        </p>
      </div>

      <p className="mx-auto mt-8 max-w-2xl rounded-lg border border-zinc-800 bg-zinc-900/50 px-4 py-3 text-center text-xs leading-relaxed text-zinc-300">
        Indie Pro and Team start with a 7 day free trial. The trial needs a card, but you are not charged until day 8. Cancel before then and you pay nothing.
      </p>

      {/* Pricing Cards */}
      <div className="mt-10 grid grid-cols-1 gap-6 lg:grid-cols-3">
        {tiers.map((t) => (
          <div
            key={t.name}
            className={`flex flex-col justify-between rounded-xl border p-6 ${
              t.highlighted
                ? "border-emerald-500 bg-zinc-900/90 shadow-xl shadow-emerald-950/30"
                : "border-zinc-800 bg-zinc-900/40"
            }`}
          >
            <div>
              <div className="flex items-center justify-between">
                <h2 className="font-mono text-xl font-bold text-white">{t.name}</h2>
                <span
                  className={`rounded px-2 py-0.5 font-mono text-[10px] font-bold uppercase ${
                    t.highlighted
                      ? "bg-emerald-500 text-zinc-950"
                      : "border border-zinc-700 bg-zinc-950 text-zinc-400"
                  }`}
                >
                  {t.badge}
                </span>
              </div>

              <div className="mt-4 flex items-baseline gap-1 font-mono">
                <span className="text-4xl font-extrabold text-white">{t.price}</span>
                <span className="text-xs text-zinc-400">{t.period}</span>
              </div>
              {t.trialMonthly && (
                <p className="mt-2 font-mono text-[11px] text-emerald-300">{t.trialMonthly}</p>
              )}

              <p className="mt-3 text-xs leading-relaxed text-zinc-300">{t.description}</p>

              <ul className="mt-6 space-y-2.5 border-t border-zinc-800 pt-5 text-xs text-zinc-200">
                {t.features.map((feat) => (
                  <li key={feat} className="flex items-start gap-2">
                    <span className="font-mono font-bold text-emerald-400">+</span>
                    <span>{feat}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="mt-8 space-y-2">
              {t.checkoutMonthly ? (
                <CheckoutLink
                  plan={t.checkoutMonthly}
                  location="pricing"
                  className={`block w-full rounded-md py-2.5 text-center font-mono text-xs font-semibold transition ${
                    t.highlighted
                      ? "bg-emerald-500 text-zinc-950 hover:bg-emerald-400"
                      : "border border-zinc-700 bg-zinc-950 text-white hover:border-emerald-500/50"
                  }`}
                >
                  {t.ctaMonthly}
                </CheckoutLink>
              ) : (
                <Link
                  href={t.ctaMonthlyHref}
                  className="block w-full rounded-md border border-zinc-700 bg-zinc-950 py-2.5 text-center font-mono text-xs font-semibold text-white transition hover:border-emerald-500/50"
                >
                  {t.ctaMonthly}
                </Link>
              )}

              {t.checkoutAnnual && t.ctaAnnual && (
                <>
                  <CheckoutLink
                    plan={t.checkoutAnnual}
                    location="pricing"
                    className="block w-full rounded-md border border-zinc-800 bg-zinc-950/70 py-2 text-center font-mono text-[11px] text-emerald-300 hover:border-emerald-500/40 transition"
                  >
                    {t.ctaAnnual}
                  </CheckoutLink>
                  {t.trialAnnual && (
                    <p className="text-center font-mono text-[10px] text-zinc-400">{t.trialAnnual}</p>
                  )}
                </>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Free weekly digest signup (separate from paid Stripe checkout) */}
      <div id="activate-indie" className="mt-12">
        <SubscribeBox
          defaultPlan="free"
          badgeText="FREE WEEKLY DIGEST"
          heading="Get the free weekly digest"
          subtext="Free email signup for the weekly breaking-change digest. Add an optional Slack or Discord webhook if you want it there too. This is separate from the paid Indie Pro and Team plans, which start with a 7 day free trial from the buttons above."
          buttonText="Get Weekly Digest (Free)"
        />
      </div>
    </div>
  );
}
