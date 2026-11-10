"use client";

import React from "react";
import { track } from "@vercel/analytics";

type CheckoutPlan = "indie" | "indie_annual" | "team" | "team_annual" | "sponsor";

// Plain anchor to /api/checkout so it works without JS. Click tracking is a bonus.
export function CheckoutLink({
  plan,
  location,
  className,
  children
}: {
  plan: CheckoutPlan;
  location: string;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <a
      href={`/api/checkout?plan=${plan}`}
      className={className}
      onClick={() => track("checkout_click", { plan, location })}
    >
      {children}
    </a>
  );
}
