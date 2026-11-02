import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { catalog, SITE_URL } from "@/lib/catalog";
import { getAllWeeks, getWeeklyReport, parseWeekId, weekRangeLabel, weekSummary, weekTitle } from "@/lib/weekly";
import { SubscribeBox } from "@/components/SubscribeBox";
import { PackageWeekTable, ReleaseTable } from "@/components/WeeklyTables";

export const dynamicParams = false;

export function generateStaticParams() {
  return getAllWeeks().map((w) => ({ week: w.id }));
}

export async function generateMetadata({ params }: { params: Promise<{ week: string }> }): Promise<Metadata> {
  const { week } = await params;
  const ref = parseWeekId(week);
  if (!ref) return { title: "Week Not Found" };
  const report = getWeeklyReport(ref);
  const title = weekTitle(ref);
  const description = `${weekSummary(report)} Major jumps, 0.x minor bumps, notable SDK releases, and deprecated MCP servers for ${weekRangeLabel(ref)}.`;
  const url = `${SITE_URL}/weekly/${ref.id}`;
  return {
    title,
    description,
    alternates: { canonical: url },
    openGraph: {
      title,
      description,
      url,
      type: "article",
      siteName: "AgentBreakWatch",
      publishedTime: ref.start.toISOString(),
      modifiedTime: report.dataThrough
    },
    twitter: { card: "summary_large_image", title, description }
  };
}

function Section({ id, title, count, children }: { id: string; title: string; count?: number; children: React.ReactNode }) {
  return (
    <section id={id} className="mt-10">
      <h2 className="font-mono text-lg font-bold text-white sm:text-xl">
        {title}
        {typeof count === "number" && <span className="ml-2 text-sm font-normal text-zinc-500">({count})</span>}
      </h2>
      <div className="mt-3">{children}</div>
    </section>
  );
}

export default async function WeeklyReportPage({ params }: { params: Promise<{ week: string }> }) {
  const { week } = await params;
  const ref = parseWeekId(week);
  if (!ref) notFound();
  const r = getWeeklyReport(ref);

  const weeks = getAllWeeks();
  const idx = weeks.findIndex((w) => w.id === ref.id);
  const newer = idx > 0 ? weeks[idx - 1] : undefined;
  const older = idx < weeks.length - 1 ? weeks[idx + 1] : undefined;
  const url = `${SITE_URL}/weekly/${ref.id}`;
  const highDriftShown = r.highDriftReleased.slice(0, 25);

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: weekTitle(ref),
    description: weekSummary(r),
    url,
    mainEntityOfPage: url,
    datePublished: ref.start.toISOString(),
    dateModified: r.dataThrough,
    author: { "@type": "Organization", name: "AgentBreakWatch", url: SITE_URL },
    publisher: { "@type": "Organization", name: "AgentBreakWatch", url: SITE_URL },
    about: ["AI agent SDK releases", "MCP server releases", "Breaking changes"],
    isPartOf: { "@type": "CollectionPage", name: "What Broke This Week", url: `${SITE_URL}/weekly` }
  };

  const stats = [
    { label: "Releases", value: r.totalReleases },
    { label: "Packages shipped", value: r.packagesReleased },
    { label: "SDKs shipped", value: r.sdkPackagesReleased },
    { label: "MCP servers shipped", value: r.mcpPackagesReleased },
    { label: "Major jumps", value: r.majorJumps.length },
    { label: "0.x minor bumps", value: r.zeroMinorBumps.length }
  ];

  return (
    <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6 lg:px-8">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />

      <nav className="font-mono text-xs text-zinc-500">
        <Link href="/weekly" className="hover:text-white">What Broke This Week</Link>
        <span className="mx-1.5">/</span>
        <span className="text-zinc-300">{ref.id}</span>
      </nav>

      <header className="mt-4 rounded-xl border border-zinc-800 bg-zinc-900/50 p-6 sm:p-8">
        <div className="inline-flex items-center gap-2 rounded border border-amber-500/30 bg-amber-500/10 px-2.5 py-1 font-mono text-xs font-semibold uppercase text-amber-300">
          Week {ref.week}, {ref.year}
          {r.inProgress && <span className="text-zinc-300">· in progress, updated daily</span>}
        </div>
        <h1 className="mt-4 font-mono text-2xl font-extrabold text-white sm:text-3xl">{weekTitle(ref)}</h1>
        <p className="mt-3 max-w-3xl text-sm leading-relaxed text-zinc-300">{weekSummary(r)}</p>
        <p className="mt-2 font-mono text-[11px] text-zinc-500">
          Week runs Monday to Sunday, UTC. Registry data through {r.dataThrough.slice(0, 16).replace("T", " ")} UTC.
        </p>

        <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
          {stats.map((s) => (
            <div key={s.label} className="rounded-lg border border-zinc-800 bg-zinc-950/60 p-3">
              <div className="font-mono text-xl font-bold text-white">{s.value}</div>
              <div className="mt-0.5 text-[11px] text-zinc-400">{s.label}</div>
            </div>
          ))}
        </div>
      </header>

      <Section id="major-jumps" title="Major version jumps" count={r.majorJumps.length}>
        {r.majorJumps.length === 0 ? (
          <p className="text-sm text-zinc-300">
            No tracked package moved to a new major version {r.inProgress ? "so far this week" : "this week"}. The notable
            SDK releases below are the ones most likely to matter.
          </p>
        ) : (
          <>
            <p className="mb-3 text-sm text-zinc-400">
              A new major version is the clearest sign of a breaking change. Read the package page before upgrading.
            </p>
            <ReleaseTable rows={r.majorJumps} />
          </>
        )}
      </Section>

      {r.zeroMinorBumps.length > 0 && (
        <Section id="zero-minor" title="0.x minor bumps" count={r.zeroMinorBumps.length}>
          <p className="mb-3 text-sm text-zinc-400">
            Under semver, a minor bump on a 0.x package is allowed to break the API. These are worth pinning.
          </p>
          <ReleaseTable rows={r.zeroMinorBumps} />
        </Section>
      )}

      <Section id="notable-sdks" title="Notable SDK releases" count={r.notableSdk.length}>
        {r.notableSdk.length === 0 ? (
          <p className="text-sm text-zinc-300">None of the {catalog.sdkCount} tracked SDKs shipped a stable release this week.</p>
        ) : (
          <PackageWeekTable rows={r.notableSdk} />
        )}
      </Section>

      <Section id="high-drift" title="High schema drift risk packages that shipped" count={r.highDriftReleased.length}>
        <p className="mb-3 text-sm text-zinc-400">
          Packages we rate high risk for tool schema or API drift. A release here is more likely to rename tools, change
          parameters, or alter output shape. Open the package page for the known breaking changes and a migration
          snippet.
        </p>
        {r.highDriftReleased.length === 0 ? (
          <p className="text-sm text-zinc-300">No high risk packages released this week.</p>
        ) : (
          <>
            <PackageWeekTable rows={highDriftShown} />
            {r.highDriftReleased.length > highDriftShown.length && (
              <p className="mt-2 font-mono text-xs text-zinc-500">
                Plus {r.highDriftReleased.length - highDriftShown.length} more in the full list below.
              </p>
            )}
          </>
        )}
      </Section>

      <Section id="deprecated" title="Deprecated, yanked, or unsupported" count={r.deprecatedReleased.length}>
        <p className="mb-3 text-sm text-zinc-400">
          Packages whose latest release is marked deprecated on npm or yanked on PyPI, as of the last registry sync. If you
          still run one of these, move to the replacement.
        </p>
        <ul className="space-y-2">
          {r.deprecatedReleased.map((d) => (
            <li key={d.item.slug} className="rounded-lg border border-zinc-800 bg-zinc-950/40 p-3 text-xs">
              <Link href={`/p/${d.item.slug}`} className="font-medium text-emerald-300 hover:underline">
                {d.item.displayName}
              </Link>{" "}
              <span className="font-mono text-zinc-500">
                {d.item.packageName}@{d.item.latestVersion} ({d.item.registry})
              </span>
              {d.releasedThisWeek && (
                <span className="ml-2 rounded border border-amber-500/40 bg-amber-500/10 px-1.5 py-0.5 font-mono text-[10px] text-amber-300">
                  released this week
                </span>
              )}
              <p className="mt-1 text-zinc-400">Registry note: {d.note}</p>
            </li>
          ))}
        </ul>
      </Section>

      <Section id="most-active" title="Most releases this week">
        <PackageWeekTable rows={r.mostActive} />
      </Section>

      <div className="mt-12">
        <SubscribeBox
          source={`weekly-${ref.id}`}
          badgeText="WEEKLY DIGEST (FREE)"
          heading="Get this report by email every Monday"
          subtext="One email a week with major jumps, deprecations, and the SDK releases that matter. Unsubscribe any time."
          buttonText="Get the weekly email"
          showWebhook={false}
        />
      </div>

      <Section id="all" title="Every package that shipped" count={r.allPackages.length}>
        <details className="rounded-lg border border-zinc-800 bg-zinc-950/40 p-3">
          <summary className="cursor-pointer font-mono text-xs text-zinc-300">Show all {r.allPackages.length} packages</summary>
          <div className="mt-3">
            <PackageWeekTable rows={r.allPackages} />
          </div>
        </details>
      </Section>

      <section className="mt-10 rounded-lg border border-zinc-800 bg-zinc-900/40 p-4 text-xs leading-relaxed text-zinc-400">
        <h2 className="font-mono text-sm font-semibold text-zinc-200">How this is computed</h2>
        <p className="mt-2">
          Built from the npm and PyPI publish history of the {catalog.totalTracked} packages we track. Only stable
          releases count; prereleases are ignored. A major jump means a release whose major version is higher than every
          earlier release of that package. Calendar versioned packages (like 2025.4.8) are not counted as major jumps.
        </p>
      </section>

      <nav className="mt-8 flex flex-wrap items-center justify-between gap-3 font-mono text-xs">
        {older ? (
          <Link href={`/weekly/${older.id}`} className="text-emerald-400 hover:underline">
            Previous week: {weekRangeLabel(older)}
          </Link>
        ) : (
          <span />
        )}
        <Link href="/weekly" className="text-zinc-400 hover:text-white">All weeks</Link>
        {newer ? (
          <Link href={`/weekly/${newer.id}`} className="text-emerald-400 hover:underline">
            Next week: {weekRangeLabel(newer)}
          </Link>
        ) : (
          <span />
        )}
      </nav>
    </div>
  );
}
