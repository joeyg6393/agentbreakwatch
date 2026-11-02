import Link from "next/link";
import type { PackageWeek, Release } from "@/lib/weekly";

const riskClass = (risk: string) =>
  risk === "high"
    ? "border-rose-500/40 bg-rose-500/10 text-rose-300"
    : risk === "medium"
    ? "border-amber-500/40 bg-amber-500/10 text-amber-300"
    : "border-emerald-500/40 bg-emerald-500/10 text-emerald-300";

export function RiskBadge({ risk }: { risk: string }) {
  return (
    <span className={`rounded border px-1.5 py-0.5 font-mono text-[10px] uppercase ${riskClass(risk)}`}>
      {risk}
    </span>
  );
}

export function ReleaseTable({ rows }: { rows: Release[] }) {
  return (
    <div className="overflow-x-auto rounded-lg border border-zinc-800">
      <table className="w-full text-left text-xs">
        <thead className="bg-zinc-900 font-mono text-[11px] uppercase text-zinc-400">
          <tr>
            <th className="px-3 py-2">Package</th>
            <th className="px-3 py-2">Previous</th>
            <th className="px-3 py-2">New</th>
            <th className="px-3 py-2">Date (UTC)</th>
            <th className="px-3 py-2">Drift risk</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-zinc-800">
          {rows.map((r) => (
            <tr key={`${r.item.slug}-${r.version}`} className="bg-zinc-950/40">
              <td className="px-3 py-2">
                <Link href={`/p/${r.item.slug}`} className="font-medium text-emerald-300 hover:underline">
                  {r.item.displayName}
                </Link>
                <div className="font-mono text-[11px] text-zinc-500">
                  {r.item.packageName} ({r.item.registry})
                </div>
              </td>
              <td className="px-3 py-2 font-mono text-zinc-400">{r.previous || "first release"}</td>
              <td className="px-3 py-2 font-mono font-semibold text-white">
                {r.version}
                {r.bumps > 1 && <span className="ml-1 font-normal text-zinc-500">({r.bumps} bumps)</span>}
              </td>
              <td className="px-3 py-2 font-mono text-zinc-400">{r.publishedAt.slice(0, 10)}</td>
              <td className="px-3 py-2">
                <RiskBadge risk={r.item.schemaDriftRisk} />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export function PackageWeekTable({ rows, showSummary = false }: { rows: PackageWeek[]; showSummary?: boolean }) {
  return (
    <div className="overflow-x-auto rounded-lg border border-zinc-800">
      <table className="w-full text-left text-xs">
        <thead className="bg-zinc-900 font-mono text-[11px] uppercase text-zinc-400">
          <tr>
            <th className="px-3 py-2">Package</th>
            <th className="px-3 py-2">Before</th>
            <th className="px-3 py-2">Latest</th>
            <th className="px-3 py-2">Releases</th>
            <th className="px-3 py-2">Drift risk</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-zinc-800">
          {rows.map((p) => (
            <tr key={p.item.slug} className="bg-zinc-950/40 align-top">
              <td className="px-3 py-2">
                <Link href={`/p/${p.item.slug}`} className="font-medium text-emerald-300 hover:underline">
                  {p.item.displayName}
                </Link>
                <div className="font-mono text-[11px] text-zinc-500">
                  {p.item.packageName} ({p.item.registry})
                </div>
                {showSummary && (
                  <p className="mt-1 max-w-xl text-[11px] leading-relaxed text-zinc-400">{p.item.breakingSummary}</p>
                )}
              </td>
              <td className="px-3 py-2 font-mono text-zinc-400">{p.from || "new"}</td>
              <td className="px-3 py-2 font-mono font-semibold text-white">{p.to}</td>
              <td className="px-3 py-2 font-mono text-zinc-300">{p.releases.length}</td>
              <td className="px-3 py-2">
                <RiskBadge risk={p.item.schemaDriftRisk} />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
