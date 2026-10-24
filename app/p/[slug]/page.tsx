import { notFound } from "next/navigation";
import Link from "next/link";
import type { Metadata } from "next";
import { catalog, getItemBySlug } from "@/lib/catalog";
import { SubscribeBox } from "@/components/SubscribeBox";

export async function generateStaticParams() {
  return catalog.items.map((item) => ({ slug: item.slug }));
}

export async function generateMetadata({
  params
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const item = getItemBySlug(slug);
  if (!item) {
    return { title: "Package Not Found" };
  }
  return {
    title: `${item.packageName} (v${item.latestVersion}) Breaking Changes & Schema History`,
    description: `${item.displayName} live ${item.registry.toUpperCase()} version v${item.latestVersion} (published ${item.latestPublishedAt.slice(0, 10)}). Stability score ${item.stabilityScore}/100. ${item.breakingSummary}`
  };
}

export default async function PackageDetailPage({
  params
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const item = getItemBySlug(slug);
  if (!item) {
    notFound();
  }

  const related = catalog.items
    .filter((i) => i.slug !== item.slug && (i.subcategory === item.subcategory || i.kind === item.kind))
    .slice(0, 6);

  const riskBadge =
    item.schemaDriftRisk === "high"
      ? "border-rose-500/40 bg-rose-500/15 text-rose-300"
      : item.schemaDriftRisk === "medium"
      ? "border-amber-500/40 bg-amber-500/15 text-amber-300"
      : "border-emerald-500/40 bg-emerald-500/15 text-emerald-300";

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "SoftwareSourceCode",
    name: item.packageName,
    version: item.latestVersion,
    dateModified: item.latestPublishedAt,
    codeRepository: item.githubUrl,
    programmingLanguage: item.registry === "npm" ? "TypeScript / JavaScript" : "Python",
    description: item.breakingSummary
  };

  return (
    <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6 lg:px-8">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      {/* Breadcrumb */}
      <div className="flex flex-wrap items-center gap-2 font-mono text-xs text-zinc-400">
        <Link href="/" className="hover:text-white">
          Directory
        </Link>
        <span>/</span>
        <span className="uppercase">{item.kind === "sdk" ? "Agent SDKs" : "MCP Servers"}</span>
        <span>/</span>
        <span className="text-emerald-400">{item.packageName}</span>
      </div>

      {/* Header Card */}
      <div className="mt-4 rounded-xl border border-zinc-800 bg-zinc-900/50 p-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <span className="rounded border border-zinc-700 bg-zinc-950 px-2.5 py-0.5 font-mono text-xs uppercase text-zinc-300">
                {item.subcategory}
              </span>
              <span className="rounded border border-zinc-700 bg-zinc-950 px-2.5 py-0.5 font-mono text-xs uppercase text-zinc-300">
                {item.registry}
              </span>
              <span className={`rounded border px-2.5 py-0.5 font-mono text-xs font-semibold uppercase ${riskBadge}`}>
                {item.schemaDriftRisk} schema drift risk
              </span>
            </div>

            <h1 className="mt-3 font-mono text-2xl font-extrabold text-white sm:text-4xl">
              {item.packageName}
            </h1>
            <p className="mt-1 text-sm text-zinc-300">
              {item.displayName} by <span className="font-semibold text-white">{item.vendor}</span>
            </p>
            <p className="mt-2 max-w-3xl text-xs leading-relaxed text-zinc-400">
              {item.description}
            </p>
          </div>

          <div className="flex flex-col items-start sm:items-end rounded-lg border border-zinc-800 bg-zinc-950 px-5 py-4 font-mono">
            <span className="text-[10px] uppercase tracking-wider text-zinc-500">Live Version</span>
            <span className="text-2xl font-bold text-emerald-400">v{item.latestVersion}</span>
            <span className="mt-1 text-xs text-zinc-400">
              Published {item.latestPublishedAt.slice(0, 10)}
            </span>
          </div>
        </div>

        {/* Key Metrics Strip */}
        <div className="mt-6 grid grid-cols-2 gap-3 border-t border-zinc-800 pt-5 sm:grid-cols-4 font-mono">
          <div className="rounded-lg border border-zinc-800/80 bg-zinc-950/60 p-3">
            <div className="text-[11px] uppercase text-zinc-500">Stability Grade</div>
            <div className="mt-1 text-lg font-bold text-white">
              {item.stabilityGrade}{" "}
              <span className="text-xs font-normal text-zinc-400">({item.stabilityScore}/100)</span>
            </div>
          </div>
          <div className="rounded-lg border border-zinc-800/80 bg-zinc-950/60 p-3">
            <div className="text-[11px] uppercase text-zinc-500">90-Day Releases</div>
            <div className="mt-1 text-lg font-bold text-white">{item.releasesLast90d} releases</div>
          </div>
          <div className="rounded-lg border border-zinc-800/80 bg-zinc-950/60 p-3">
            <div className="text-[11px] uppercase text-zinc-500">Dependencies</div>
            <div className="mt-1 text-lg font-bold text-white">{item.dependenciesCount} direct</div>
          </div>
          <div className="rounded-lg border border-zinc-800/80 bg-zinc-950/60 p-3">
            <div className="text-[11px] uppercase text-zinc-500">License</div>
            <div className="mt-1 truncate text-lg font-bold text-white">{item.license}</div>
          </div>
        </div>

        {/* Exact Version Pin Command */}
        <div className="mt-5 flex flex-wrap items-center justify-between gap-3 rounded-lg border border-zinc-800 bg-[#07080c] px-4 py-3 font-mono text-xs">
          <div>
            <span className="text-zinc-500">Recommended Exact Pin: </span>
            <code className="text-emerald-300">{item.installCommand}</code>
          </div>
          <div className="flex items-center gap-4 text-xs">
            <a
              href={item.registryUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-zinc-400 hover:text-white underline underline-offset-2"
            >
              {item.registry.toUpperCase()} Registry -&gt;
            </a>
            <a
              href={item.githubUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-zinc-400 hover:text-white underline underline-offset-2"
            >
              GitHub Repo -&gt;
            </a>
          </div>
        </div>
      </div>

      {/* Breaking Changes & Migration Diffs */}
      <div className="mt-8 grid grid-cols-1 gap-6 lg:grid-cols-12">
        <div className="lg:col-span-8 space-y-6">
          <section className="rounded-xl border border-zinc-800 bg-zinc-900/40 p-6">
            <h2 className="font-mono text-lg font-bold text-white">
              Breaking Changes &amp; Tool Schema Drift Analysis
            </h2>
            <p className="mt-2 text-sm leading-relaxed text-zinc-200">{item.breakingSummary}</p>

            <div className="mt-4">
              <div className="font-mono text-xs uppercase text-zinc-400">
                Watched Exports / MCP Tool Signatures:
              </div>
              <div className="mt-2 flex flex-wrap gap-2">
                {item.affectedSymbols.map((sym) => (
                  <code
                    key={sym}
                    className="rounded border border-zinc-700 bg-zinc-950 px-2.5 py-1 font-mono text-xs text-emerald-300"
                  >
                    {sym}
                  </code>
                ))}
              </div>
            </div>

            {/* Before / After Diff Blocks */}
            <div className="mt-6 space-y-4">
              <div>
                <div className="mb-1.5 flex items-center justify-between font-mono text-xs">
                  <span className="font-semibold uppercase text-rose-400">
                    Before (Deprecated / Breaking Pattern)
                  </span>
                </div>
                <pre className="overflow-x-auto rounded-lg border border-rose-500/30 bg-rose-950/15 p-4 font-mono text-xs leading-relaxed text-rose-200">
                  <code>{item.migrationBefore}</code>
                </pre>
              </div>

              <div>
                <div className="mb-1.5 flex items-center justify-between font-mono text-xs">
                  <span className="font-semibold uppercase text-emerald-400">
                    After (Verified v{item.latestVersion} Pattern)
                  </span>
                </div>
                <pre className="overflow-x-auto rounded-lg border border-emerald-500/30 bg-emerald-950/15 p-4 font-mono text-xs leading-relaxed text-emerald-200">
                  <code>{item.migrationAfter}</code>
                </pre>
              </div>
            </div>
          </section>

          {/* Subscribe for this specific package */}
          <SubscribeBox
            packageName={item.packageName}
            heading={`Get Instant Breaking-Change Alerts for ${item.packageName}`}
            subtext={`We poll ${item.registry.toUpperCase()} and ${item.githubRepo} every 30 minutes. Get an email with the exact diff when ${item.packageName} ships a breaking release beyond v${item.latestVersion}.`}
          />
        </div>

        {/* Right Column: Live Version History & Related */}
        <div className="lg:col-span-4 space-y-6">
          <section className="rounded-xl border border-zinc-800 bg-zinc-900/40 p-5">
            <h2 className="font-mono text-sm font-bold uppercase tracking-wider text-zinc-200">
              Recent {item.registry.toUpperCase()} Releases
            </h2>
            <p className="mt-1 text-xs text-zinc-400">
              Verified release timestamps from live registry metadata.
            </p>

            <div className="mt-4 divide-y divide-zinc-800/80 font-mono text-xs">
              {item.recentVersions.map((ver, idx) => (
                <div key={ver.version} className="flex items-center justify-between py-2.5">
                  <div className="flex items-center gap-2">
                    <span className={idx === 0 ? "font-bold text-emerald-400" : "text-zinc-200"}>
                      v{ver.version}
                    </span>
                    {idx === 0 && (
                      <span className="rounded bg-emerald-500/15 px-1.5 py-0.5 text-[10px] text-emerald-300">
                        LATEST
                      </span>
                    )}
                  </div>
                  <span className="text-zinc-400">{ver.publishedAt.slice(0, 10)}</span>
                </div>
              ))}
            </div>
          </section>

          <section className="rounded-xl border border-zinc-800 bg-zinc-900/40 p-5">
            <h2 className="font-mono text-sm font-bold uppercase tracking-wider text-zinc-200">
              Related {item.kind === "sdk" ? "Agent SDKs" : "MCP Servers"}
            </h2>
            <div className="mt-3 space-y-2.5">
              {related.map((rel) => (
                <Link
                  key={rel.slug}
                  href={`/p/${rel.slug}`}
                  className="block rounded-lg border border-zinc-800/80 bg-zinc-950/60 p-3 hover:border-emerald-500/40 transition"
                >
                  <div className="flex items-center justify-between font-mono text-xs">
                    <span className="font-semibold text-white">{rel.packageName}</span>
                    <span className="text-emerald-400">v{rel.latestVersion}</span>
                  </div>
                  <p className="mt-1 truncate text-[11px] text-zinc-400">{rel.displayName}</p>
                </Link>
              ))}
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
