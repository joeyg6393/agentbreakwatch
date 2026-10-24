"use client";

import React, { useState } from "react";

export function SubscribeBox({
  packageName,
  defaultPlan = "free",
  heading = "Get Instant Breaking-Change Alerts",
  subtext = "Receive an email with before/after fix snippets the moment a tracked SDK or MCP server ships a breaking release."
}: {
  packageName?: string;
  defaultPlan?: string;
  heading?: string;
  subtext?: string;
}) {
  const [email, setEmail] = useState("");
  const [webhookUrl, setWebhookUrl] = useState("");
  const [status, setStatus] = useState<{ loading: boolean; msg: string; err: string }>({
    loading: false,
    msg: "",
    err: ""
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;
    setStatus({ loading: true, msg: "", err: "" });
    try {
      const res = await fetch("/api/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email,
          plan: defaultPlan,
          packages: packageName ? [packageName] : [],
          webhookUrl
        })
      });
      const data = await res.json();
      if (!res.ok || !data.ok) {
        setStatus({ loading: false, msg: "", err: data.error || "Subscription failed" });
      } else {
        setStatus({ loading: false, msg: data.message, err: "" });
        setEmail("");
        setWebhookUrl("");
      }
    } catch (err: any) {
      setStatus({ loading: false, msg: "", err: err?.message || "Network error" });
    }
  };

  return (
    <div className="rounded-xl border border-emerald-500/30 bg-zinc-900/70 p-6">
      <div className="flex flex-col justify-between gap-4 md:flex-row md:items-center">
        <div className="max-w-xl">
          <div className="inline-flex items-center gap-2 rounded border border-emerald-500/30 bg-emerald-500/10 px-2 py-0.5 font-mono text-[10px] font-semibold uppercase text-emerald-300">
            30-Min Registry & Schema Poller
          </div>
          <h3 className="mt-2 font-mono text-lg font-bold text-white">{heading}</h3>
          <p className="mt-1 text-xs leading-relaxed text-zinc-300">{subtext}</p>
        </div>

        <form onSubmit={handleSubmit} className="flex w-full max-w-md flex-col gap-2">
          <div className="flex flex-col gap-2 sm:flex-row">
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="developer@company.com"
              className="flex-1 rounded-md border border-zinc-700 bg-zinc-950 px-3 py-2 font-mono text-xs text-white placeholder-zinc-500 focus:border-emerald-500 focus:outline-none"
            />
            <button
              type="submit"
              disabled={status.loading}
              className="rounded-md bg-emerald-500 px-4 py-2 font-mono text-xs font-semibold text-zinc-950 hover:bg-emerald-400 disabled:opacity-50"
            >
              {status.loading ? "Subscribing..." : packageName ? `Watch ${packageName}` : "Subscribe Free"}
            </button>
          </div>
          <input
            type="url"
            value={webhookUrl}
            onChange={(e) => setWebhookUrl(e.target.value)}
            placeholder="Optional Slack / Discord / HTTP webhook URL"
            className="rounded-md border border-zinc-800 bg-zinc-950/70 px-3 py-1.5 font-mono text-[11px] text-zinc-300 placeholder-zinc-600 focus:border-emerald-500 focus:outline-none"
          />
          {status.msg && <p className="font-mono text-xs text-emerald-400">{status.msg}</p>}
          {status.err && <p className="font-mono text-xs text-rose-400">{status.err}</p>}
        </form>
      </div>
    </div>
  );
}
