"use client";

import React, { useState } from "react";
import Link from "next/link";

export function DigestBanner({
  source = "digest-banner",
  badge = "FREE WEEKLY DIGEST",
  title = "Get the Weekly AI Agent SDK & MCP Breaking-Change Digest",
  subtitle = "Zero noise. Every Monday: breaking releases, MCP tools/list schema drift diffs, and exact version pins.",
  buttonLabel = "Get Weekly Digest (Free)",
  packages
}: {
  source?: string;
  badge?: string;
  title?: string;
  subtitle?: string;
  buttonLabel?: string;
  packages?: string[];
}) {
  const [email, setEmail] = useState("");
  const [state, setState] = useState<{
    loading: boolean;
    confirmed: boolean;
    message: string;
    error: string;
  }>({
    loading: false,
    confirmed: false,
    message: "",
    error: ""
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;
    setState({ loading: true, confirmed: false, message: "", error: "" });
    try {
      const res = await fetch("/api/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email,
          plan: "free",
          source,
          packages:
            packages && packages.length > 0
              ? packages
              : ["openai", "@modelcontextprotocol/sdk", "ai", "@playwright/mcp", "fastmcp"]
        })
      });
      const data = await res.json();
      if (!res.ok || !data.ok) {
        setState({
          loading: false,
          confirmed: false,
          message: "",
          error: data.error || "Could not subscribe."
        });
      } else {
        setState({
          loading: false,
          confirmed: true,
          message: data.message,
          error: ""
        });
        try {
          window.localStorage.setItem("abw_subscribed", "1");
        } catch {
          // ignore
        }
        setEmail("");
      }
    } catch (err: any) {
      setState({
        loading: false,
        confirmed: false,
        message: "",
        error: err?.message || "Network error"
      });
    }
  };

  return (
    <div className="rounded-xl border border-emerald-500/35 bg-gradient-to-r from-emerald-950/30 via-zinc-900/90 to-zinc-900/90 p-4 sm:px-5 sm:py-4 shadow-lg">
      {state.confirmed ? (
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between font-mono text-xs">
          <div className="flex items-center gap-2 text-emerald-300">
            <span className="inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-emerald-500 text-zinc-950 font-bold">
              &#10003;
            </span>
            <span>{state.message}</span>
          </div>
          <Link
            href="/api/checkout?plan=indie"
            className="shrink-0 rounded bg-emerald-500/20 border border-emerald-500/40 px-3 py-1 text-emerald-300 hover:bg-emerald-500/30 transition"
          >
            Want real-time Slack/webhook alerts? Indie ($9/mo) -&gt;
          </Link>
        </div>
      ) : (
        <form
          onSubmit={handleSubmit}
          className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between"
        >
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <span className="rounded border border-emerald-500/40 bg-emerald-500/15 px-2 py-0.5 font-mono text-[10px] font-bold uppercase text-emerald-300">
                {badge}
              </span>
              <span className="font-mono text-xs sm:text-sm font-bold text-white">{title}</span>
            </div>
            <p className="mt-1 text-xs text-zinc-300">{subtitle}</p>
            {state.error && (
              <p className="mt-1 font-mono text-xs text-rose-400">{state.error}</p>
            )}
          </div>

          <div className="flex w-full shrink-0 flex-col gap-2 sm:w-auto sm:flex-row sm:items-center">
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="developer@company.com"
              aria-label="Developer email address"
              className="w-full sm:w-60 rounded-md border border-zinc-700 bg-zinc-950 px-3 py-2 font-mono text-xs text-white placeholder-zinc-500 focus:border-emerald-500 focus:outline-none"
            />
            <button
              type="submit"
              disabled={state.loading}
              className="whitespace-nowrap rounded-md bg-emerald-500 px-4 py-2 font-mono text-xs font-bold text-zinc-950 hover:bg-emerald-400 disabled:opacity-50 transition"
            >
              {state.loading ? "Activating..." : buttonLabel}
            </button>
          </div>
        </form>
      )}
    </div>
  );
}
