import Link from "next/link";
import type { Metadata } from "next";
import { catalog, SITE_URL } from "@/lib/catalog";
import { getAllWeeks, getWeeklyReport, weekRangeLabel, weekSummary } from "@/lib/weekly";
import { SubscribeBox } from "@/components/SubscribeBox";

const title = "What Broke This Week: Weekly AI Agent SDK and MCP Server Release Reports";
const description = `Weekly reports on major version jumps, deprecations, and notable releases across ${catalog.sdkCount} AI agent SDKs and ${catalog.mcpCount} MCP servers, built from npm and PyPI publish data.`;

export const metadata: Metadata = {
  title,
  description,
  alternates: { canonical: `${SITE_URL}/weekly` },
  openGraph: { title, description, url: `${SITE_URL}/weekly`, type: "website", siteName: "AgentBreakWatch" },
  twitter: { card: "summary_large_image", title, description }
};

export default function WeeklyIndexPage() {
  const weeks = getAllWeeks().map((ref) => ({ ref, report: getWeeklyReport(ref) }));

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    name: "What Broke This Week",
    description,
    url: `${SITE_URL}/weekly`,
    mainEntity: {
      "@type": "ItemList",
      itemListElement: weeks.map(({ ref }, i) => ({
        "@type": "ListItem",
        position: i + 1,
        url: `${SITE_URL}/weekly/${ref.id}`,
        name: `What Broke This Week: ${weekRangeLabel(ref)}`
      }))
    }
  };

  return (
    <div className="mx-auto max-w-5xl px-4 py-10 sm:px-6 lg:px-8">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <h1 className="font-mono text-2xl font-extrabold text-white sm:text-3xl">What Broke This Week</h1>
      <p className="mt-3 max-w-3xl text-sm leading-relaxed text-zinc-300">
        A weekly record of what changed across the {catalog.totalTracked} agent SDKs and MCP servers we track: major
        version jumps, 0.x minor bumps, deprecated packages, and releases in the big SDKs. Each week is built from
        npm and PyPI publish data and links to the package pages.
      </p>

      <ul className="mt-8 space-y-3">
        {weeks.map(({ ref, report }) => (
          <li key={ref.id}>
            <Link
              href={`/weekly/${ref.id}`}
              className="block rounded-lg border border-zinc-800 bg-zinc-900/50 p-4 transition hover:border-emerald-500/50"
            >
              <div className="flex flex-wrap items-baseline justify-between gap-2">
                <span className="font-mono text-base font-bold text-white">{weekRangeLabel(ref)}</span>
                <span className="font-mono text-xs text-zinc-500">
                  {ref.id}
                  {report.inProgress && " · in progress"}
                </span>
              </div>
              <p className="mt-1 text-xs text-zinc-400">{weekSummary(report)}</p>
              {report.majorJumps.length > 0 && (
                <p className="mt-1 font-mono text-[11px] text-amber-300">
                  Major: {report.majorJumps.slice(0, 4).map((m) => `${m.item.packageName} ${m.version}`).join(", ")}
                  {report.majorJumps.length > 4 && ` and ${report.majorJumps.length - 4} more`}
                </p>
              )}
            </Link>
          </li>
        ))}
      </ul>

      <div className="mt-10">
        <SubscribeBox
          source="weekly-index"
          badgeText="WEEKLY DIGEST (FREE)"
          heading="Get the weekly report by email"
          subtext="One email a week with major jumps, deprecations, and the SDK releases that matter."
          buttonText="Get the weekly email"
          showWebhook={false}
        />
      </div>
    </div>
  );
}
