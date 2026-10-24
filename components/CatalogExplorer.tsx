"use client";

import React, { useState, useMemo } from "react";
import Link from "next/link";
import type { CatalogItem } from "@/lib/catalog";

export function CatalogExplorer({ items }: { items: CatalogItem[] }) {
  const [filterTab, setFilterTab] = useState<"all" | "sdk" | "mcp" | "recent" | "high_risk">("all");
  const [registryFilter, setRegistryFilter] = useState<"all" | "npm" | "pypi">("all");
  const [search, setSearch] = useState<string>("");

  const filtered = useMemo(() => {
    let list = [...items];
    if (filterTab === "sdk") {
      list = list.filter((i) => i.kind === "sdk");
    } else if (filterTab === "mcp") {
      list = list.filter((i) => i.kind === "mcp");
    } else if (filterTab === "high_risk") {
      list = list.filter((i) => i.schemaDriftRisk === "high");
    } else if (filterTab === "recent") {
      list.sort(
        (a, b) => new Date(b.latestPublishedAt).getTime() - new Date(a.latestPublishedAt).getTime()
      );
    }

    if (registryFilter !== "all") {
      list = list.filter((i) => i.registry === registryFilter);
    }

    if (search.trim()) {
      const q = search.trim().toLowerCase();
      list = list.filter(
        (i) =>
          i.packageName.toLowerCase().includes(q) ||
          i.displayName.toLowerCase().includes(q) ||
          i.vendor.toLowerCase().includes(q) ||
          i.subcategory.toLowerCase().includes(q) ||
          i.breakingSummary.toLowerCase().includes(q)
      );
    }

    return list;
  }, [items, filterTab, registryFilter, search]);

  const sdkCount = items.filter((i) => i.kind === "sdk").length;
  const mcpCount = items.filter((i) => i.kind === "mcp").length;
  const highRiskCount = items.filter((i) => i.schemaDriftRisk === "high").length;

  return (
    <section id="directory" className="mt-14 scroll-mt-20">
      <div className="flex flex-col justify-between gap-4 border-b border-zinc-800 pb-5 md:flex-row md:items-end">
        <div>
          <h2 className="font-mono text-xl font-bold text-white sm:text-2xl">
            Live Agent SDK & MCP Stability Index
          </h2>
          <p className="mt-1 text-sm text-zinc-400">
            Real-time versions, 90-day release velocity, `tools/list` schema drift risk, and copy-paste migration snippets.
          </p>
        </div>

        {/* Search Input */}
        <div className="w-full md:w-80">
          <input
            type="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search package, vendor, or tool..."
            className="w-full rounded-lg border border-zinc-700 bg-zinc-900 px-3.5 py-2 font-mono text-xs text-white placeholder-zinc-500 focus:border-emerald-500 focus:outline-none"
          />
        </div>
      </div>

      {/* Filter Bar */}
      <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-1.5">
          {[
            { id: "all", label: `All (${items.length})` },
            { id: "sdk", label: `Agent SDKs (${sdkCount})` },
            { id: "mcp", label: `MCP Servers (${mcpCount})` },
            { id: "recent", label: "Recent Releases" },
            { id: "high_risk", label: `High Drift Risk (${highRiskCount})` }
          ].map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setFilterTab(tab.id as any)}
              className={`rounded-md px-3 py-1.5 font-mono text-xs font-medium transition ${
                filterTab === tab.id
                  ? "bg-emerald-500 text-zinc-950 font-semibold"
                  : "border border-zinc-800 bg-zinc-900/70 text-zinc-300 hover:border-zinc-700 hover:text-white"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-1.5 font-mono text-xs">
          <span className="text-zinc-500">Registry:</span>
          {(["all", "npm", "pypi"] as const).map((reg) => (
            <button
              key={reg}
              type="button"
              onClick={() => setRegistryFilter(reg)}
              className={`rounded px-2.5 py-1 uppercase transition ${
                registryFilter === reg
                  ? "border border-emerald-500/40 bg-emerald-500/15 text-emerald-300"
                  : "border border-zinc-800 bg-zinc-900 text-zinc-400 hover:text-white"
              }`}
            >
              {reg}
            </button>
          ))}
        </div>
      </div>

      {/* Package Cards Grid */}
      <div className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
        {filtered.map((item) => {
          const riskBadge =
            item.schemaDriftRisk === "high"
              ? "border-rose-500/30 bg-rose-500/10 text-rose-300"
              : item.schemaDriftRisk === "medium"
              ? "border-amber-500/30 bg-amber-500/10 text-amber-300"
              : "border-emerald-500/30 bg-emerald-500/10 text-emerald-300";

          return (
            <Link
              key={item.slug}
              href={`/p/${item.slug}`}
              className="group flex flex-col justify-between rounded-xl border border-zinc-800/90 bg-zinc-900/40 p-5 hover:border-emerald-500/50 hover:bg-zinc-900/80 transition"
            >
              <div>
                <div className="flex items-center justify-between gap-2">
                  <span className="rounded border border-zinc-700 bg-zinc-950 px-2 py-0.5 font-mono text-[10px] uppercase tracking-wider text-zinc-300">
                    {item.kind === "sdk" ? "AGENT SDK" : "MCP SERVER"} • {item.registry.toUpperCase()}
                  </span>
                  <span className={`rounded border px-2 py-0.5 font-mono text-[10px] font-semibold uppercase ${riskBadge}`}>
                    {item.schemaDriftRisk} drift
                  </span>
                </div>

                <div className="mt-3">
                  <h3 className="font-mono text-base font-bold text-white group-hover:text-emerald-400 transition">
                    {item.packageName}
                  </h3>
                  <p className="text-xs text-zinc-400">
                    {item.displayName} • <span className="text-zinc-500">{item.vendor}</span>
                  </p>
                </div>

                <p className="mt-3 line-clamp-3 text-xs leading-relaxed text-zinc-300">
                  {item.breakingSummary}
                </p>
              </div>

              <div className="mt-4 border-t border-zinc-800/80 pt-3">
                <div className="flex items-center justify-between font-mono text-xs">
                  <div>
                    <span className="text-zinc-500">Live: </span>
                    <span className="font-semibold text-emerald-400">v{item.latestVersion}</span>
                  </div>
                  <div className="text-zinc-400" title="Latest Registry Publish Date">
                    {item.latestPublishedAt.slice(0, 10)}
                  </div>
                  <div>
                    <span className="text-zinc-500">Stability: </span>
                    <span className="font-bold text-white">{item.stabilityGrade}</span>{" "}
                    <span className="text-[11px] text-zinc-500">({item.stabilityScore})</span>
                  </div>
                </div>
              </div>
            </Link>
          );
        })}
      </div>
    </section>
  );
}
