import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

// Live prices on Stripe account acct_1Q4lEdL1baJc3okB.
const STRIPE_CATALOG = {
  indie: {
    name: "AgentBreakWatch Indie Pro ($9/mo)",
    priceId: "price_1UUGVUL1baJc3okBbyTWCF8N",
    amountUsd: 9,
    interval: "month",
    envLinkKey: "STRIPE_LINK_INDIE_MONTHLY",
    defaultPaymentLink: "https://buy.stripe.com/4gMcN60vLfty3eq2376J202"
  },
  indie_annual: {
    name: "AgentBreakWatch Indie Pro Annual ($90/yr)",
    priceId: "price_1UUGVUL1baJc3okBUs7T7VjC",
    amountUsd: 90,
    interval: "year",
    envLinkKey: "STRIPE_LINK_INDIE_ANNUAL",
    defaultPaymentLink: "https://buy.stripe.com/dRm8wQemBdlq6qC5fj6J203"
  },
  team: {
    name: "AgentBreakWatch Team ($29/mo)",
    priceId: "price_1UUGVVL1baJc3okBbWMiQWQm",
    amountUsd: 29,
    interval: "month",
    envLinkKey: "STRIPE_LINK_TEAM_MONTHLY",
    defaultPaymentLink: "https://buy.stripe.com/3cIeVefqFepu7uG7nr6J204"
  },
  team_annual: {
    name: "AgentBreakWatch Team Annual ($290/yr)",
    priceId: "price_1UUGVVL1baJc3okBPEW5QC30",
    amountUsd: 290,
    interval: "year",
    envLinkKey: "STRIPE_LINK_TEAM_ANNUAL",
    defaultPaymentLink: "https://buy.stripe.com/8x228s92h1CI6qCcHL6J205"
  },
  sponsor: {
    name: "AgentBreakWatch Weekly Digest & Directory Sponsor ($149)",
    priceId: "price_1UUGVVL1baJc3okBBF64kU8C",
    amountUsd: 149,
    interval: "one_time",
    envLinkKey: "STRIPE_LINK_SPONSOR",
    defaultPaymentLink: "https://buy.stripe.com/bJeaEYfqF95a16i9vz6J206"
  }
} as const;

type PlanKey = keyof typeof STRIPE_CATALOG;

const TRIAL_DAYS = 7;

function isPlanKey(value: string | null): value is PlanKey {
  return value !== null && Object.prototype.hasOwnProperty.call(STRIPE_CATALOG, value);
}

export async function GET(req: Request) {
  const url = new URL(req.url);
  const requested = url.searchParams.get("plan");
  const planKey: PlanKey = isPlanKey(requested) ? requested : "indie";
  const plan = STRIPE_CATALOG[planKey];
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://agentbreakwatch.com";

  // 1. With a Stripe secret key, create a Checkout Session for the live price.
  const stripeKey = process.env.STRIPE_SECRET_KEY;
  if (stripeKey) {
    try {
      const isSubscription = plan.interval !== "one_time";
      const params = new URLSearchParams();
      params.append("mode", isSubscription ? "subscription" : "payment");
      params.append("line_items[0][price]", plan.priceId);
      params.append("line_items[0][quantity]", "1");
      if (isSubscription) {
        params.append("subscription_data[trial_period_days]", String(TRIAL_DAYS));
        params.append("subscription_data[metadata][plan]", planKey);
      }
      params.append("metadata[plan]", planKey);
      params.append("allow_promotion_codes", "true");
      params.append("adaptive_pricing[enabled]", "false");
      params.append("success_url", `${baseUrl}/pricing?checkout=success&plan=${planKey}`);
      params.append("cancel_url", `${baseUrl}/pricing`);

      const res = await fetch("https://api.stripe.com/v1/checkout/sessions", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${stripeKey}`,
          "Content-Type": "application/x-www-form-urlencoded"
        },
        body: params.toString(),
        cache: "no-store"
      });
      const session = await res.json();
      if (session?.url) {
        return NextResponse.redirect(session.url, { status: 303 });
      }
      console.error(
        `[checkout] Stripe session creation failed for plan ${planKey} (HTTP ${res.status}): ${
          session?.error?.message || "no url in response"
        }`
      );
    } catch (err) {
      console.error(
        `[checkout] Stripe request error for plan ${planKey}: ${err instanceof Error ? err.message : String(err)}`
      );
    }
  }

  // 2. Fall back to the Stripe Payment Link for this plan.
  const paymentLink = process.env[plan.envLinkKey] || plan.defaultPaymentLink;
  return NextResponse.redirect(paymentLink, { status: 303 });
}
