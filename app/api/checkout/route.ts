import { NextResponse } from "next/server";

const STRIPE_CATALOG = {
  indie: {
    name: "AgentBreakWatch Indie Pro ($9/mo)",
    productId: "prod_VV4bSiULE6mE4k",
    priceId: "price_1UU4UcASeFIJpe4wBRpvOghT",
    lookupKey: "agentbreakwatch_indie_9",
    amountUsd: 9,
    interval: "month",
    envLinkKey: "STRIPE_LINK_INDIE_MONTHLY",
    defaultPaymentLink: "https://buy.stripe.com/4gMcN60vLfty3eq2376J202"
  },
  indie_annual: {
    name: "AgentBreakWatch Indie Pro Annual ($90/yr)",
    productId: "prod_VV4bSiULE6mE4k",
    priceId: "price_1UU4UfASeFIJpe4w2LWX258n",
    lookupKey: "agentbreakwatch_indie_90_annual",
    amountUsd: 90,
    interval: "year",
    envLinkKey: "STRIPE_LINK_INDIE_ANNUAL",
    defaultPaymentLink: "https://buy.stripe.com/dRm8wQemBdlq6qC5fj6J203"
  },
  team: {
    name: "AgentBreakWatch Team ($29/mo)",
    productId: "prod_VV4cVz3CiefdUA",
    priceId: "price_1UU4UgASeFIJpe4wAf6EkBcY",
    lookupKey: "agentbreakwatch_team_29",
    amountUsd: 29,
    interval: "month",
    envLinkKey: "STRIPE_LINK_TEAM_MONTHLY",
    defaultPaymentLink: "https://buy.stripe.com/3cIeVefqFepu7uG7nr6J204"
  },
  team_annual: {
    name: "AgentBreakWatch Team Annual ($290/yr)",
    productId: "prod_VV4cVz3CiefdUA",
    priceId: "price_1UU4V0ASeFIJpe4wdT9ARyYe",
    lookupKey: "agentbreakwatch_team_290_annual",
    amountUsd: 290,
    interval: "year",
    envLinkKey: "STRIPE_LINK_TEAM_ANNUAL",
    defaultPaymentLink: "https://buy.stripe.com/8x228s92h1CI6qCcHL6J205"
  },
  sponsor: {
    name: "AgentBreakWatch Weekly Digest & Directory Sponsor ($149)",
    productId: "prod_VV4cg2xIW2rcpL",
    priceId: "price_1UU4T9ASeFIJpe4wDmMj13TE",
    lookupKey: "agentbreakwatch_sponsor_weekly",
    amountUsd: 149,
    interval: "one_time",
    envLinkKey: "STRIPE_LINK_SPONSOR",
    defaultPaymentLink: "https://buy.stripe.com/bJeaEYfqF95a16i9vz6J206"
  }
} as const;

export async function GET(req: Request) {
  const url = new URL(req.url);
  const planKey = (url.searchParams.get("plan") || "indie") as keyof typeof STRIPE_CATALOG;
  const plan = STRIPE_CATALOG[planKey] || STRIPE_CATALOG.indie;
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://agentbreakwatch.com";

  // 1. If STRIPE_SECRET_KEY is configured with a live/test key, create a Stripe Checkout Session
  const stripeKey = process.env.STRIPE_SECRET_KEY;
  if (stripeKey && stripeKey.startsWith("sk_")) {
    try {
      const mode = plan.interval === "one_time" ? "payment" : "subscription";
      const params = new URLSearchParams();
      params.append("mode", mode);
      params.append("line_items[0][price]", plan.priceId);
      params.append("line_items[0][quantity]", "1");
      params.append("allow_promotion_codes", "true");
      params.append("success_url", `${baseUrl}/pricing?checkout=success&plan=${planKey}`);
      params.append("cancel_url", `${baseUrl}/pricing?checkout=cancelled&plan=${planKey}`);

      const res = await fetch("https://api.stripe.com/v1/checkout/sessions", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${stripeKey}`,
          "Content-Type": "application/x-www-form-urlencoded"
        },
        body: params.toString()
      });
      const session = await res.json();
      if (session?.url) {
        return NextResponse.redirect(session.url, { status: 303 });
      }

      // Fallback to inline price_data if the key belongs to another connected Stripe account
      const inlineParams = new URLSearchParams();
      inlineParams.append("mode", mode);
      inlineParams.append("line_items[0][price_data][currency]", "usd");
      inlineParams.append("line_items[0][price_data][unit_amount]", String(plan.amountUsd * 100));
      inlineParams.append("line_items[0][price_data][product_data][name]", plan.name);
      if (plan.interval !== "one_time") {
        inlineParams.append("line_items[0][price_data][recurring][interval]", plan.interval);
      }
      inlineParams.append("line_items[0][quantity]", "1");
      inlineParams.append("allow_promotion_codes", "true");
      inlineParams.append("success_url", `${baseUrl}/pricing?checkout=success&plan=${planKey}`);
      inlineParams.append("cancel_url", `${baseUrl}/pricing?checkout=cancelled&plan=${planKey}`);

      const inlineRes = await fetch("https://api.stripe.com/v1/checkout/sessions", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${stripeKey}`,
          "Content-Type": "application/x-www-form-urlencoded"
        },
        body: inlineParams.toString()
      });
      const inlineSession = await inlineRes.json();
      if (inlineSession?.url) {
        return NextResponse.redirect(inlineSession.url, { status: 303 });
      }
    } catch {
      // Fall through to pre-generated Stripe Payment Link
    }
  }

  // 2. Redirect to the live Stripe Payment Link for this plan
  const directPaymentLink = process.env[plan.envLinkKey] || plan.defaultPaymentLink;
  if (directPaymentLink && directPaymentLink.startsWith("https://")) {
    return NextResponse.redirect(directPaymentLink, { status: 303 });
  }

  const dest =
    planKey === "sponsor"
      ? `${baseUrl}/sponsor?plan=${planKey}&priceId=${plan.priceId}#activate-sponsor`
      : `${baseUrl}/pricing?plan=${planKey}&priceId=${plan.priceId}#activate-indie`;
  return NextResponse.redirect(dest, { status: 303 });
}
