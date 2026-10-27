"use client";

import React, { useState, useMemo } from "react";
import Link from "next/link";
import { auditStackInput, type StackAuditFinding } from "@/lib/catalog";

const SAMPLE_MCP_JSON = `{
  "mcpServers": {
    "filesystem": {
      "command": "npx",
      "args": ["-y", "@modelcontextprotocol/server-filesystem@1.0.2", "/workspace"]
    },
    "github": {
      "command": "npx",
      "args": ["-y", "@modelcontextprotocol/server-github@2025.4.8"]
    },
    "supabase": {
      "command": "npx",
      "args": ["-y", "@supabase/mcp-server-supabase@0.9.0", "--read-only"]
    },
    "playwright": {
      "command": "npx",
      "args": ["-y", "@playwright/mcp@latest"]
    },
    "firecrawl": {
      "command": "npx",
      "args": ["-y", "firecrawl-mcp@2.1.0"]
    }
  }
}`;

const SAMPLE_PACKAGE_JSON = `{
  "name": "production-agent-worker",
  "dependencies": {
    "openai": "^6.12.0",
    "@anthropic-ai/sdk": "^0.78.0",
    "@modelcontextprotocol/sdk": "^1.18.0",
    "ai": "^6.0.42",
    "@ai-sdk/openai": "^3.0.10",
    "@langchain/langgraph": "^0.4.5",
    "@browserbasehq/stagehand": "^3.1.0",
    "@mastra/core": "^1.79.0"
  }
}`;

const SAMPLE_REQUIREMENTS_TXT = `# Python Production Agent Stack
openai==2.14.0
anthropic==1.9.0
mcp==1.12.0
fastmcp==3.2.0
pydantic-ai==1.40.0
langgraph==0.6.8
crewai==1.15.30
litellm==1.90.0`;

const SAMPLE_PYPROJECT_TOML = `[project]
name = "agent-service"
version = "0.1.0"
dependencies = [
  "openai==2.14.0",
  "anthropic==1.9.0",
  "mcp==1.12.0",
  "fastmcp==3.2.0",
  "pydantic-ai==1.40.0",
  "langgraph==0.6.8"
]`;

export function StackChecker({
  defaultSample = "mcp"
}: {
  defaultSample?: "mcp" | "npm" | "pypi" | "pyproject";
}) {
  const initialText =
    defaultSample === "npm"
      ? SAMPLE_PACKAGE_JSON
      : defaultSample === "pypi"
      ? SAMPLE_REQUIREMENTS_TXT
      : defaultSample === "pyproject"
      ? SAMPLE_PYPROJECT_TOML
      : SAMPLE_MCP_JSON;

  const [input, setInput] = useState<string>(initialText);
  const [email, setEmail] = useState<string>("");
  const [subStatus, setSubStatus] = useState<{
    loading: boolean;
    confirmed: boolean;
    message: string;
    error: string;
    watchedPackages: string[];
  }>({
    loading: false,
    confirmed: false,
    message: "",
    error: "",
    watchedPackages: []
  });
  const [copiedCmd, setCopiedCmd] = useState<string>("");

  const audit = useMemo(() => auditStackInput(input), [input]);
  const detectedPackages = useMemo(
    () => Array.from(new Set(audit.findings.map((f) => f.inputName))),
    [audit.findings]
  );

  const handleWatchStack = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;
    setSubStatus({
      loading: true,
      confirmed: false,
      message: "",
      error: "",
      watchedPackages: []
    });
    try {
      const pkgs =
        detectedPackages.length > 0
          ? detectedPackages
          : ["openai", "@modelcontextprotocol/sdk", "ai", "@playwright/mcp", "fastmcp"];
      const res = await fetch("/api/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email,
          plan: "free",
          source: "check-audit-inline",
          packages: pkgs
        })
      });
      const data = await res.json();
      if (!res.ok || !data.ok) {
        setSubStatus({
          loading: false,
          confirmed: false,
          message: "",
          error: data.error || "Could not subscribe.",
          watchedPackages: []
        });
      } else {
        setSubStatus({
          loading: false,
          confirmed: true,
          message: data.message,
          error: "",
          watchedPackages: pkgs
        });
        try {
          window.localStorage.setItem("abw_subscribed", "1");
        } catch {
          // ignore
        }
        setEmail("");
      }
    } catch (err: any) {
      setSubStatus({
        loading: false,
        confirmed: false,
        message: "",
        error: err?.message || "Network error",
        watchedPackages: []
      });
    }
  };

  const copyText = (text: string) => {
    navigator.clipboard?.writeText(text);
    setCopiedCmd(text);
    setTimeout(() => setCopiedCmd(""), 2000);
  };

  return (
    <div className="rounded-xl border border-zinc-800 bg-zinc-900/60 shadow-2xl overflow-hidden">
      {/* Top Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-zinc-800 bg-zinc-950/90 px-4 py-3">
        <div className="flex items-center gap-2">
          <span className="h-2.5 w-2.5 rounded-full bg-emerald-400 animate-pulse" />
          <span className="font-mono text-xs font-semibold uppercase tracking-wider text-zinc-200">
            Interactive Stack &amp; Schema Drift Auditor
          </span>
          <span className="hidden rounded border border-zinc-800 bg-zinc-900 px-2 py-0.5 font-mono text-[11px] text-zinc-400 sm:inline-block">
            Detected: {audit.detectedFormat}
          </span>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs text-zinc-500">Load sample:</span>
          <button
            type="button"
            onClick={() => setInput(SAMPLE_MCP_JSON)}
            className="rounded border border-zinc-700 bg-zinc-900 px-2.5 py-1 font-mono text-xs text-zinc-200 hover:border-emerald-500/50 hover:text-emerald-300 transition"
          >
            .mcp.json
          </button>
          <button
            type="button"
            onClick={() => setInput(SAMPLE_PACKAGE_JSON)}
            className="rounded border border-zinc-700 bg-zinc-900 px-2.5 py-1 font-mono text-xs text-zinc-200 hover:border-emerald-500/50 hover:text-emerald-300 transition"
          >
            package.json
          </button>
          <button
            type="button"
            onClick={() => setInput(SAMPLE_REQUIREMENTS_TXT)}
            className="rounded border border-zinc-700 bg-zinc-900 px-2.5 py-1 font-mono text-xs text-zinc-200 hover:border-emerald-500/50 hover:text-emerald-300 transition"
          >
            requirements.txt
          </button>
          <button
            type="button"
            onClick={() => setInput(SAMPLE_PYPROJECT_TOML)}
            className="rounded border border-zinc-700 bg-zinc-900 px-2.5 py-1 font-mono text-xs text-zinc-200 hover:border-emerald-500/50 hover:text-emerald-300 transition"
          >
            pyproject.toml
          </button>
        </div>
      </div>

      {/* Main Split Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12">
        {/* Left: Config Input */}
        <div className="border-b border-zinc-800 p-4 lg:col-span-5 lg:border-b-0 lg:border-r">
          <div className="mb-2 flex items-center justify-between text-xs text-zinc-400">
            <span>Paste `.mcp.json`, `package.json`, `requirements.txt`, or `pyproject.toml`:</span>
            <button
              type="button"
              onClick={() => setInput("")}
              className="font-mono text-[11px] text-zinc-500 hover:text-zinc-300"
            >
              Clear
            </button>
          </div>
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            rows={15}
            spellCheck={false}
            placeholder="Paste your .mcp.json, package.json, requirements.txt, or pyproject.toml here..."
            className="w-full rounded-lg border border-zinc-800 bg-[#07080c] p-3 font-mono text-xs leading-relaxed text-emerald-300 placeholder-zinc-600 focus:border-emerald-500 focus:outline-none"
          />

          {/* Summary Pills */}
          <div className="mt-3 grid grid-cols-3 gap-2 text-center font-mono text-xs">
            <div className="rounded border border-rose-500/30 bg-rose-500/10 py-2 text-rose-300">
              <div className="text-base font-bold">{audit.breakingCount}</div>
              <div className="text-[10px] uppercase">Breaking / High Risk</div>
            </div>
            <div className="rounded border border-amber-500/30 bg-amber-500/10 py-2 text-amber-300">
              <div className="text-base font-bold">{audit.outdatedCount}</div>
              <div className="text-[10px] uppercase">Outdated / Drift</div>
            </div>
            <div className="rounded border border-emerald-500/30 bg-emerald-500/10 py-2 text-emerald-300">
              <div className="text-base font-bold">{audit.upToDateCount}</div>
              <div className="text-[10px] uppercase">Pinned &amp; Current</div>
            </div>
          </div>
        </div>

        {/* Right: Live Audit Report */}
        <div className="flex flex-col justify-between p-4 lg:col-span-7">
          <div>
            <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
              <span className="font-mono text-xs font-semibold uppercase tracking-wider text-zinc-300">
                Audit Findings Against Live npm &amp; PyPI Index ({audit.findings.length})
              </span>
              {audit.breakingCount > 0 && (
                <span className="rounded border border-rose-500/40 bg-rose-500/15 px-2 py-0.5 font-mono text-[10px] font-bold text-rose-300">
                  {audit.breakingCount} ACTION REQUIRED
                </span>
              )}
            </div>

            {/* High-Conversion Inline Capture Bar Right Above Flagged Packages */}
            <div className="mb-3.5 rounded-lg border border-emerald-500/40 bg-gradient-to-r from-emerald-950/40 via-zinc-900 to-zinc-950 p-3.5 shadow-md">
              {subStatus.confirmed ? (
                <div className="space-y-2 font-mono text-xs">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="flex items-center gap-2 font-bold text-emerald-300">
                      <span className="inline-flex h-4 w-4 items-center justify-center rounded-full bg-emerald-500 text-[10px] text-zinc-950">
                        &#10003;
                      </span>
                      <span>
                        MONITORING {subStatus.watchedPackages.length} PACKAGES FOR BREAKING RELEASES
                      </span>
                    </div>
                    <Link
                      href="/api/checkout?plan=indie"
                      className="rounded bg-emerald-500 px-2.5 py-1 text-[11px] font-bold text-zinc-950 hover:bg-emerald-400"
                    >
                      Add Slack/Webhook Alerts ($9/mo) -&gt;
                    </Link>
                  </div>
                  <p className="text-[11px] text-zinc-200">{subStatus.message}</p>
                </div>
              ) : (
                <form onSubmit={handleWatchStack} className="space-y-2.5">
                  <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                      <div className="font-mono text-xs font-bold text-white">
                        Monitor these {detectedPackages.length || 5} packages for breaking releases &amp; MCP schema drift
                      </div>
                      <p className="mt-0.5 text-[11px] text-zinc-300">
                        One-click watch sends your stack audit summary + weekly breaking-change &amp; `tools/list` diff alerts.
                      </p>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <input
                        type="email"
                        required
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="you@company.com"
                        aria-label="Email address to monitor detected stack packages"
                        className="w-full sm:w-48 rounded border border-zinc-700 bg-zinc-950 px-2.5 py-1.5 font-mono text-xs text-white placeholder-zinc-500 focus:border-emerald-500 focus:outline-none"
                      />
                      <button
                        type="submit"
                        disabled={subStatus.loading}
                        className="whitespace-nowrap rounded bg-emerald-500 px-3.5 py-1.5 font-mono text-xs font-bold text-zinc-950 hover:bg-emerald-400 disabled:opacity-50 transition"
                      >
                        {subStatus.loading
                          ? "Activating..."
                          : `Monitor ${detectedPackages.length || 5} Packages`}
                      </button>
                    </div>
                  </div>

                  {detectedPackages.length > 0 && (
                    <div className="flex flex-wrap items-center gap-1.5 pt-0.5">
                      <span className="font-mono text-[10px] uppercase text-zinc-400">
                        Pre-loaded stack:
                      </span>
                      {detectedPackages.slice(0, 6).map((pkg) => (
                        <span
                          key={pkg}
                          className="rounded border border-emerald-500/25 bg-emerald-950/40 px-1.5 py-0.5 font-mono text-[10px] text-emerald-300"
                        >
                          {pkg}
                        </span>
                      ))}
                      {detectedPackages.length > 6 && (
                        <span className="font-mono text-[10px] text-zinc-400">
                          +{detectedPackages.length - 6} more
                        </span>
                      )}
                    </div>
                  )}

                  {subStatus.error && (
                    <p className="font-mono text-xs text-rose-400">{subStatus.error}</p>
                  )}
                </form>
              )}
            </div>

            {audit.findings.length === 0 ? (
              <div className="rounded-lg border border-zinc-800 bg-zinc-950/60 p-8 text-center text-xs text-zinc-500">
                Paste a manifest or click one of the sample buttons above to run an instant breaking-change check.
              </div>
            ) : (
              <div className="max-h-[340px] space-y-2.5 overflow-y-auto pr-1">
                {audit.findings.map((f: StackAuditFinding, idx: number) => {
                  const badgeStyle =
                    f.severity === "critical"
                      ? "border-rose-500/40 bg-rose-500/15 text-rose-300"
                      : f.severity === "warning"
                      ? "border-amber-500/40 bg-amber-500/15 text-amber-300"
                      : f.severity === "ok"
                      ? "border-emerald-500/40 bg-emerald-500/15 text-emerald-300"
                      : "border-zinc-700 bg-zinc-800 text-zinc-300";

                  const badgeLabel =
                    f.status === "breaking_major"
                      ? "BREAKING DELTA"
                      : f.status === "unpinned_latest"
                      ? "UNPINNED @LATEST"
                      : f.status === "outdated_minor"
                      ? "OUTDATED"
                      : f.status === "up_to_date"
                      ? "CURRENT"
                      : "UNTRACKED";

                  return (
                    <div
                      key={`${f.inputName}-${idx}`}
                      className="rounded-lg border border-zinc-800/90 bg-zinc-950/80 p-3 text-xs"
                    >
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <div className="flex items-center gap-2">
                          <span className={`rounded border px-1.5 py-0.5 font-mono text-[10px] font-bold ${badgeStyle}`}>
                            {badgeLabel}
                          </span>
                          {f.matchedItem ? (
                            <Link
                              href={`/p/${f.matchedItem.slug}`}
                              className="font-mono font-semibold text-white hover:text-emerald-400 underline underline-offset-2"
                            >
                              {f.inputName}
                            </Link>
                          ) : (
                            <span className="font-mono font-semibold text-zinc-300">{f.inputName}</span>
                          )}
                        </div>

                        <div className="font-mono text-[11px] text-zinc-400">
                          Your spec: <span className="text-zinc-200">{f.specifiedVersion}</span>{" "}
                          <span className="text-zinc-600">-&gt;</span> Live:{" "}
                          <span className="font-semibold text-emerald-400">v{f.latestVersion}</span>
                        </div>
                      </div>

                      <p className="mt-1.5 text-zinc-300 leading-relaxed">{f.note}</p>

                      {f.upgradeCommand && (
                        <div className="mt-2 flex flex-wrap items-center justify-between gap-2 rounded border border-zinc-800 bg-zinc-900/80 px-2.5 py-1.5 font-mono text-[11px] text-zinc-300">
                          <code className="truncate">{f.upgradeCommand}</code>
                          <div className="flex items-center gap-2">
                            <button
                              type="button"
                              onClick={() => copyText(f.upgradeCommand!)}
                              className="rounded bg-zinc-800 px-2 py-0.5 text-[10px] text-emerald-400 hover:bg-zinc-700"
                            >
                              {copiedCmd === f.upgradeCommand ? "Copied!" : "Copy Pin"}
                            </button>
                            {f.matchedItem && (
                              <Link
                                href={`/p/${f.matchedItem.slug}`}
                                className="text-[10px] text-zinc-400 hover:text-white"
                              >
                                View Diff -&gt;
                              </Link>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Bottom CLI / MCP Quick Hint */}
          <div className="mt-4 flex flex-wrap items-center justify-between gap-2 rounded-lg border border-zinc-800 bg-zinc-950/90 px-3 py-2 font-mono text-[11px] text-zinc-400">
            <span>
              Run in terminal or IDE MCP:{" "}
              <code className="text-emerald-300">npx -y github:joeyg6393/agentbreakwatch-mcp</code>
            </span>
            <button
              type="button"
              onClick={() => copyText("npx -y github:joeyg6393/agentbreakwatch-mcp")}
              className="rounded border border-zinc-700 bg-zinc-900 px-2 py-0.5 text-[10px] text-emerald-400 hover:bg-zinc-800"
            >
              {copiedCmd === "npx -y github:joeyg6393/agentbreakwatch-mcp" ? "Copied!" : "Copy npx"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
