"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";

export function StickyDigestBar() {
  const [dismissed, setDismissed] = useState(false);
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

  useEffect(() => {
    try {
      if (window.localStorage.getItem("abw_sticky_dismissed") === "1") {
        setDismissed(true);
      }
    } catch {
      // ignore
    }
  }, []);

  if (dismissed) return null;

  const handleDismiss = () => {
    setDismissed(true);
    try {
      window.localStorage.setItem("abw_sticky_dismissed", "1");
    } catch {
      // ignore
    }
  };

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
          source: "sticky-footer-bar",
          packages: ["openai", "@modelcontextprotocol/sdk", "ai", "@playwright/mcp", "fastmcp"]
        })
      });
      const data = await res.json();
      if (!res.ok || !data.ok) {
        setState({
          loading: false,
          confirmed: false,
          message: "",
          error: data.error || "Subscription failed"
        });
      } else {
        setState({
          loading: false,
          confirmed: true,
          message: data.message,
          error: ""
        });
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
    <div className="sticky bottom-0 z-40 border-t border-emerald-500/30 bg-[#090a0f]/95 backdrop-blur px-4 py-2.5 shadow-2xl">
      <div className="mx-auto flex max-w-7xl flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        {state.confirmed ? (
          <div className="flex flex-wrap items-center justify-between gap-3 w-full font-mono text-xs">
            <span className="text-emerald-300 font-semibold">
              &#10003; {state.message}
            </span>
            <div className="flex items-center gap-3">
              <Link
                href="/api/checkout?plan=indie"
                className="text-amber-300 underline underline-offset-2 hover:text-amber-200"
              >
                Upgrade to Indie ($9/mo) for Slack/Webhook Alerts -&gt;
              </Link>
              <button
                type="button"
                onClick={handleDismiss}
                className="text-zinc-500 hover:text-zinc-300"
              >
                Close
              </button>
            </div>
          </div>
        ) : (
          <>
            <div className="flex flex-wrap items-center gap-2 text-xs">
              <span className="rounded bg-emerald-500/15 border border-emerald-500/30 px-2 py-0.5 font-mono text-[10px] font-bold uppercase text-emerald-300">
                Weekly Breaking-Change &amp; MCP Drift Digest (Free)
              </span>
              <span className="text-zinc-200 font-medium">
                Get weekly SDK breaking-change diffs &amp; MCP schema drift alerts in your inbox.
              </span>
              {state.error && (
                <span className="font-mono text-rose-400">{state.error}</span>
              )}
            </div>

            <div className="flex items-center gap-2">
              <form onSubmit={handleSubmit} className="flex items-center gap-2 w-full sm:w-auto">
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="developer@company.com"
                  aria-label="Developer email for weekly digest"
                  className="w-full sm:w-52 rounded border border-zinc-700 bg-zinc-950 px-2.5 py-1 font-mono text-xs text-white placeholder-zinc-500 focus:border-emerald-500 focus:outline-none"
                />
                <button
                  type="submit"
                  disabled={state.loading}
                  className="whitespace-nowrap rounded bg-emerald-500 px-3 py-1 font-mono text-xs font-bold text-zinc-950 hover:bg-emerald-400 disabled:opacity-50"
                >
                  {state.loading ? "Joining..." : "Subscribe Free"}
                </button>
              </form>
              <button
                type="button"
                onClick={handleDismiss}
                aria-label="Dismiss digest bar"
                className="px-1.5 font-mono text-xs text-zinc-500 hover:text-zinc-300"
              >
                &#10005;
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
