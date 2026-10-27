"use client";

import React, { useState } from "react";
import Link from "next/link";

export function SubscribeBox({
  packageName,
  packages,
  defaultPlan = "free",
  source = "subscribe-box",
  badgeText = "WEEKLY BREAKING-CHANGE & MCP DRIFT DIGEST (FREE)",
  heading = "Get the Weekly Breaking-Change & MCP Drift Digest (Free)",
  subtext = "Receive a concise weekly summary and before/after fix snippets whenever tracked AI Agent SDKs or MCP servers ship breaking releases or tools/list schema changes.",
  buttonText,
  showWebhook = true,
  compact = false
}: {
  packageName?: string;
  packages?: string[];
  defaultPlan?: string;
  source?: string;
  badgeText?: string;
  heading?: string;
  subtext?: string;
  buttonText?: string;
  showWebhook?: boolean;
  compact?: boolean;
}) {
  const [email, setEmail] = useState("");
  const [webhookUrl, setWebhookUrl] = useState("");
  const [status, setStatus] = useState<{
    loading: boolean;
    msg: string;
    err: string;
    subscribedEmail: string;
    watchedList: string[];
  }>({
    loading: false,
    msg: "",
    err: "",
    subscribedEmail: "",
    watchedList: []
  });

  const resolvedPackages =
    packages && packages.length > 0
      ? packages
      : packageName
      ? [packageName]
      : ["openai", "@modelcontextprotocol/sdk", "ai", "@playwright/mcp", "fastmcp"];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;
    setStatus({ loading: true, msg: "", err: "", subscribedEmail: "", watchedList: [] });
    try {
      const res = await fetch("/api/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email,
          plan: defaultPlan,
          source,
          packages: resolvedPackages,
          webhookUrl
        })
      });
      const data = await res.json();
      if (!res.ok || !data.ok) {
        setStatus({
          loading: false,
          msg: "",
          err: data.error || "Subscription failed",
          subscribedEmail: "",
          watchedList: []
        });
      } else {
        setStatus({
          loading: false,
          msg: data.message,
          err: "",
          subscribedEmail: email,
          watchedList: data.subscription?.packages || resolvedPackages
        });
        try {
          window.localStorage.setItem("abw_subscribed", "1");
        } catch {
          // ignore storage errors
        }
        setEmail("");
        setWebhookUrl("");
      }
    } catch (err: any) {
      setStatus({
        loading: false,
        msg: "",
        err: err?.message || "Network error",
        subscribedEmail: "",
        watchedList: []
      });
    }
  };

  return (
    <div
      className={`rounded-xl border border-emerald-500/35 bg-zinc-900/80 shadow-lg ${
        compact ? "p-4 sm:p-5" : "p-6"
      }`}
    >
      <div className="flex flex-col justify-between gap-5 lg:flex-row lg:items-center">
        <div className="max-w-2xl">
          <div className="inline-flex items-center gap-2 rounded border border-emerald-500/30 bg-emerald-500/10 px-2.5 py-0.5 font-mono text-[10px] font-semibold uppercase text-emerald-300">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
            <span>{badgeText}</span>
          </div>
          <h3 className={`mt-2 font-mono font-bold text-white ${compact ? "text-base sm:text-lg" : "text-lg sm:text-xl"}`}>
            {heading}
          </h3>
          <p className="mt-1 text-xs leading-relaxed text-zinc-300">{subtext}</p>
        </div>

        <div className="w-full max-w-md">
          {status.msg ? (
            <div className="rounded-lg border border-emerald-500/40 bg-emerald-950/30 p-3.5 font-mono text-xs">
              <div className="flex items-center gap-2 font-bold text-emerald-300">
                <span className="inline-flex h-4 w-4 items-center justify-center rounded-full bg-emerald-500 text-[10px] text-zinc-950">
                  &#10003;
                </span>
                <span>SUBSCRIPTION CONFIRMED</span>
              </div>
              <p className="mt-1.5 text-[11px] leading-relaxed text-zinc-200">{status.msg}</p>
              <div className="mt-2.5 flex flex-wrap items-center justify-between gap-2 border-t border-emerald-500/20 pt-2 text-[11px]">
                <span className="text-zinc-400">
                  Need real-time 30-min Slack/webhook alerts?
                </span>
                <Link
                  href="/api/checkout?plan=indie"
                  className="font-semibold text-emerald-400 underline underline-offset-2 hover:text-emerald-300"
                >
                  Upgrade to Indie ($9/mo) -&gt;
                </Link>
              </div>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="flex flex-col gap-2">
              <div className="flex flex-col gap-2 sm:flex-row">
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="developer@company.com"
                  aria-label="Developer email address"
                  className="flex-1 rounded-md border border-zinc-700 bg-zinc-950 px-3 py-2 font-mono text-xs text-white placeholder-zinc-500 focus:border-emerald-500 focus:outline-none"
                />
                <button
                  type="submit"
                  disabled={status.loading}
                  className="whitespace-nowrap rounded-md bg-emerald-500 px-4 py-2 font-mono text-xs font-bold text-zinc-950 hover:bg-emerald-400 disabled:opacity-50 transition"
                >
                  {status.loading
                    ? "Subscribing..."
                    : buttonText
                    ? buttonText
                    : packageName
                    ? `Watch ${packageName}`
                    : "Get Weekly Digest (Free)"}
                </button>
              </div>
              {showWebhook && (
                <input
                  type="url"
                  value={webhookUrl}
                  onChange={(e) => setWebhookUrl(e.target.value)}
                  placeholder="Optional Slack / Discord / HTTP webhook URL"
                  className="rounded-md border border-zinc-800 bg-zinc-950/70 px-3 py-1.5 font-mono text-[11px] text-zinc-300 placeholder-zinc-600 focus:border-emerald-500 focus:outline-none"
                />
              )}
              {status.err && <p className="font-mono text-xs text-rose-400">{status.err}</p>}
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
