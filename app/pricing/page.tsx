import type { Metadata } from "next";
import Link from "next/link";
import { SubscribeBox } from "@/components/SubscribeBox";
import { catalog } from "@/lib/catalog";

export const metadata: Metadata = {
  alternates: {
    canonical: "https://agentbreakwatch.com/pricing"
  },
  title: "Pricing & Alert Plans",
  description:
    "Start free with 3 watched SDKs or MCP servers, or upgrade to Indie Pro ($9/mo or $90/yr) and Team ($29/mo or $290/yr) for full .mcp.json and package.json monitoring, instant breaking-change alerts, and Slack/Discord webhooks."
};

export default function PricingPage() {
  const tiers = [
    {
      name: "Free",
      price: "$0",
      period: "forever",
      planCode: "free",
      badge: "PUBLIC DIRECTORY",
      stripeProductId: null,
      stripePriceMonthly: null,
      stripePriceAnnual: null,
      description: "For solo builders exploring MCP servers and checking configs manually.",
      features: [
        `Full access to all ${catalog.totalTracked} SDK & MCP changelog pages`,
        "Unlimited interactive `.mcp.json` & `package.json` checks",
        "Watch up to 3 packages with weekly digest email",
        "Public `/llms.txt`, `/api/mcp`, and `/api/catalog.json` access"
      ],
      ctaMonthly: "Start Watching Free",
      ctaMonthlyHref: "#activate-indie",
      ctaAnnual: null,
      ctaAnnualHref: null,
      highlighted: false
    },
    {
      name: "Indie Pro",
      price: "$9",
      period: "/ month ($90/yr)",
      planCode: "indie",
      badge: "MOST POPULAR",
      stripeProductId: "prod_VV4bSiULE6mE4k",
      stripePriceMonthly: "price_1UU4UcASeFIJpe4wBRpvOghT",
      stripePriceAnnual: "price_1UU4UfASeFIJpe4w2LWX258n",
      description: "For indie developers running production AI agents that cannot afford silent tool failures.",
      features: [
        "Watch up to 25 Agent SDKs & MCP servers across your stack",
        "Instant email alerts within 30 minutes of a breaking release",
        "MCP `tools/list` JSON Schema parameter diff alerts",
        "Copy-paste before/after migration code snippets",
        "1 custom HTTP / Slack / Discord webhook endpoint"
      ],
      ctaMonthly: "Checkout Indie Pro ($9/mo)",
      ctaMonthlyHref: "/api/checkout?plan=indie",
      ctaAnnual: "Or $90/yr (Save 2 Months)",
      ctaAnnualHref: "/api/checkout?plan=indie_annual",
      highlighted: true
    },
    {
      name: "Team",
      price: "$29",
      period: "/ month ($290/yr)",
      planCode: "team",
      badge: "ENGINEERING TEAMS",
      stripeProductId: "prod_VV4cVz3CiefdUA",
      stripePriceMonthly: "price_1UU4UgASeFIJpe4wAf6EkBcY",
      stripePriceAnnual: "price_1UU4V0ASeFIJpe4wdT9ARyYe",
      description: "For engineering teams managing multiple agent repositories and production MCP gateways.",
      features: [
        "Unlimited watched SDKs & MCP servers across up to 10 repos",
        "Instant email, Slack, Discord, and PagerDuty webhook alerts",
        "Priority MCP security advisory & command-injection alerts",
        "Team member email routing per repository",
        "Early access to automated GitHub PR migration bot"
      ],
      ctaMonthly: "Checkout Team Plan ($29/mo)",
      ctaMonthlyHref: "/api/checkout?plan=team",
      ctaAnnual: "Or $290/yr (Save 2 Months)",
      ctaAnnualHref: "/api/checkout?plan=team_annual",
      highlighted: false
    }
  ];

  return (
    <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
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
              <Link
                href={t.ctaMonthlyHref}
                className={`block w-full rounded-md py-2.5 text-center font-mono text-xs font-semibold transition ${
                  t.highlighted
                    ? "bg-emerald-500 text-zinc-950 hover:bg-emerald-400"
                    : "border border-zinc-700 bg-zinc-950 text-white hover:border-emerald-500/50"
                }`}
              >
                {t.ctaMonthly}
              </Link>

              {t.ctaAnnual && t.ctaAnnualHref && (
                <Link
                  href={t.ctaAnnualHref}
                  className="block w-full rounded-md border border-zinc-800 bg-zinc-950/70 py-2 text-center font-mono text-[11px] text-emerald-300 hover:border-emerald-500/40 transition"
                >
                  {t.ctaAnnual}
                </Link>
              )}

              {t.stripeProductId && (
                <div className="pt-1 text-center font-mono text-[10px] text-zinc-500">
                  Stripe ID: {t.stripeProductId}
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Instant Activation / Early Access Waitlist Box */}
      <div id="activate-indie" className="mt-12">
        <SubscribeBox
          defaultPlan="indie"
          heading="Activate Your Stack Watch & Stripe Checkout"
          subtext="Enter your email and optional Slack/Discord webhook URL below to bind your watched .mcp.json / package.json stack to your Indie Pro or Team plan."
        />
      </div>
    </div>
  );
}
