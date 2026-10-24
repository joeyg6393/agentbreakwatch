import { notFound } from "next/navigation";
import Link from "next/link";
import type { Metadata } from "next";
import {
  catalog,
  CATEGORY_HUBS,
  getCategoryHubBySlug,
  getItemsForCategoryHub
} from "@/lib/catalog";
import { SubscribeBox } from "@/components/SubscribeBox";

export async function generateStaticParams() {
  return CATEGORY_HUBS.map((hub) => ({ category: hub.slug }));
}

export async function generateMetadata({
  params
}: {
  params: Promise<{ category: string }>;
}): Promise<Metadata> {
  const { category } = await params;
  const hub = getCategoryHubBySlug(category);
  if (!hub) {
    return { title: "Category Not Found" };
  }
  const items = getItemsForCategoryHub(hub);
  return {
    title: `${hub.title} (${items.length} Live Packages)`,
    description: `${hub.description} Compare live npm and PyPI versions, 90-day release velocity, and schema drift scores across ${items.length} ${hub.shortTitle} packages.`,
    alternates: {
      canonical: `https://agentbreakwatch.vercel.app/c/${hub.slug}`
    }
  };
}

export default async function CategoryHubPage({
  params
}: {
  params: Promise<{ category: string }>;
}) {
  const { category } = await params;
  const hub = getCategoryHubBySlug(category);
  if (!hub) {
    notFound();
  }

  const items = getItemsForCategoryHub(hub);
  const avgStability = items.length
    ? Math.round(items.reduce((acc, i) => acc + i.stabilityScore, 0) / items.length)
    : 85;
  const highRiskItems = items.filter((i) => i.schemaDriftRisk === "high");
  const topVelocity = [...items].sort((a, b) => b.releasesLast90d - a.releasesLast90d)[0];
  const mostRecent = [...items].sort(
    (a, b) => new Date(b.latestPublishedAt).getTime() - new Date(a.latestPublishedAt).getTime()
  )[0];

  const faqs = [
    {
      question: `Which ${hub.shortTitle} packages have the highest schema drift risk?`,
      answer:
        highRiskItems.length > 0
          ? `Among the ${items.length} tracked ${hub.shortTitle} packages, ${highRiskItems.length} carry a HIGH schema drift risk rating, led by ${highRiskItems
              .slice(0, 5)
              .map((i) => `${i.packageName} (v${i.latestVersion})`)
              .join(", ")}. Always pin exact versions in production.`
          : `All ${items.length} tracked ${hub.shortTitle} packages currently maintain low-to-medium drift risk with an average stability score of ${avgStability}/100.`
    },
    {
      question: `What is the fastest-moving package in ${hub.shortTitle}?`,
      answer: topVelocity
        ? `${topVelocity.packageName} (${topVelocity.displayName}) has shipped ${topVelocity.releasesLast90d} releases in the last 90 days, with latest version v${topVelocity.latestVersion} published on ${topVelocity.latestPublishedAt.slice(0, 10)}.`
        : `Packages in ${hub.shortTitle} are polled every 30 minutes against live npm and PyPI registries.`
    },
    {
      question: `How should engineering teams pin ${hub.shortTitle} dependencies?`,
      answer: hub.verdictSummary
    }
  ];

  const jsonLd = [
    {
      "@context": "https://schema.org",
      "@type": "CollectionPage",
      name: hub.title,
      description: hub.description,
      url: `https://agentbreakwatch.vercel.app/c/${hub.slug}`,
      mainEntity: {
        "@type": "ItemList",
        numberOfItems: items.length,
        itemListElement: items.slice(0, 30).map((item, idx) => ({
          "@type": "ListItem",
          position: idx + 1,
          name: `${item.packageName} v${item.latestVersion}`,
          url: `https://agentbreakwatch.vercel.app/p/${item.slug}`
        }))
      }
    },
    {
      "@context": "https://schema.org",
      "@type": "BreadcrumbList",
      itemListElement: [
        {
          "@type": "ListItem",
          position: 1,
          name: "AgentBreakWatch Directory",
          item: "https://agentbreakwatch.vercel.app/"
        },
        {
          "@type": "ListItem",
          position: 2,
          name: hub.shortTitle,
          item: `https://agentbreakwatch.vercel.app/c/${hub.slug}`
        }
      ]
    },
    {
      "@context": "https://schema.org",
      "@type": "FAQPage",
      mainEntity: faqs.map((f) => ({
        "@type": "Question",
        name: f.question,
        acceptedAnswer: {
          "@type": "Answer",
          text: f.answer
        }
      }))
    }
  ];

  return (
    <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      {/* Breadcrumb & Category Switcher */}
      <div className="flex flex-wrap items-center justify-between gap-3 font-mono text-xs text-zinc-400">
        <div className="flex items-center gap-2">
          <Link href="/" className="hover:text-white">
            Directory
          </Link>
          <span>/</span>
          <span className="text-emerald-400">{hub.shortTitle}</span>
        </div>

        <div className="flex flex-wrap gap-1.5">
          {CATEGORY_HUBS.map((h) => (
            <Link
              key={h.slug}
              href={`/c/${h.slug}`}
              className={`rounded px-2 py-0.5 text-[11px] transition ${
                h.slug === hub.slug
                  ? "bg-emerald-500 font-semibold text-zinc-950"
                  : "border border-zinc-800 bg-zinc-900 text-zinc-400 hover:text-white"
              }`}
            >
              {h.shortTitle}
            </Link>
          ))}
        </div>
      </div>

      {/* Category Hero */}
      <div className="mt-5 rounded-xl border border-zinc-800 bg-zinc-900/50 p-6">
        <div className="inline-flex items-center gap-2 rounded border border-emerald-500/30 bg-emerald-500/10 px-2.5 py-0.5 font-mono text-xs text-emerald-300">
          CATEGORY STABILITY HUB • {items.length} LIVE PACKAGES
        </div>
        <h1 className="mt-3 font-mono text-2xl font-extrabold text-white sm:text-4xl">
          {hub.title}
        </h1>
        <p className="mt-2 max-w-3xl text-sm leading-relaxed text-zinc-300">
          {hub.description}
        </p>

        {/* Verdict Box */}
        <div className="mt-4 rounded-lg border border-emerald-500/30 bg-emerald-950/15 p-4">
          <div className="font-mono text-xs font-bold uppercase text-emerald-400">
            TL;DR Category Verdict ({catalog.generatedAt.slice(0, 10)})
          </div>
          <p className="mt-1 text-xs sm:text-sm leading-relaxed text-zinc-200">
            {hub.verdictSummary} Across {items.length} tracked packages in{" "}
            <strong>{hub.shortTitle}</strong>, the average 90-day stability score is{" "}
            <strong>{avgStability}/100</strong> with{" "}
            <strong>{highRiskItems.length} high-drift packages</strong>.
            {mostRecent && (
              <>
                {" "}
                Most recent release: <code>{mostRecent.packageName}</code>{" "}
                <strong>v{mostRecent.latestVersion}</strong> ({mostRecent.latestPublishedAt.slice(0, 10)}).
              </>
            )}
          </p>
        </div>

        {/* Metrics Strip */}
        <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-4 font-mono">
          <div className="rounded-lg border border-zinc-800 bg-zinc-950/70 p-3">
            <div className="text-[11px] uppercase text-zinc-500">Tracked in Hub</div>
            <div className="mt-1 text-xl font-bold text-white">{items.length} packages</div>
          </div>
          <div className="rounded-lg border border-zinc-800 bg-zinc-950/70 p-3">
            <div className="text-[11px] uppercase text-zinc-500">Avg Stability Score</div>
            <div className="mt-1 text-xl font-bold text-emerald-400">{avgStability}/100</div>
          </div>
          <div className="rounded-lg border border-zinc-800 bg-zinc-950/70 p-3">
            <div className="text-[11px] uppercase text-zinc-500">High Drift Risk</div>
            <div className="mt-1 text-xl font-bold text-rose-400">{highRiskItems.length} packages</div>
          </div>
          <div className="rounded-lg border border-zinc-800 bg-zinc-950/70 p-3">
            <div className="text-[11px] uppercase text-zinc-500">Fastest 90d Cadence</div>
            <div className="mt-1 truncate text-sm font-bold text-amber-400">
              {topVelocity ? `${topVelocity.packageName} (${topVelocity.releasesLast90d})` : "N/A"}
            </div>
          </div>
        </div>
      </div>

      {/* Comparison Matrix Table */}
      <section className="mt-8 rounded-xl border border-zinc-800 bg-zinc-900/40 overflow-hidden">
        <div className="border-b border-zinc-800 px-6 py-4">
          <h2 className="font-mono text-base font-bold text-white">
            Complete {hub.shortTitle} Comparison &amp; Version Pin Matrix
          </h2>
          <p className="mt-0.5 text-xs text-zinc-400">
            Click any package to view `tools/list` schema diffs, watched symbols, and before/after migration code.
          </p>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left font-mono text-xs">
            <thead className="border-b border-zinc-800 bg-zinc-950/80 text-[11px] uppercase text-zinc-400">
              <tr>
                <th className="px-4 py-3">Package</th>
                <th className="px-4 py-3">Registry</th>
                <th className="px-4 py-3">Live Version</th>
                <th className="px-4 py-3">Published</th>
                <th className="px-4 py-3">90d Releases</th>
                <th className="px-4 py-3">Drift Risk</th>
                <th className="px-4 py-3">Stability</th>
                <th className="px-4 py-3">Recommended Exact Pin</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-800/70">
              {items.map((item) => {
                const riskColor =
                  item.schemaDriftRisk === "high"
                    ? "text-rose-400"
                    : item.schemaDriftRisk === "medium"
                    ? "text-amber-400"
                    : "text-emerald-400";

                return (
                  <tr key={item.slug} className="hover:bg-zinc-900/80 transition">
                    <td className="px-4 py-3">
                      <Link
                        href={`/p/${item.slug}`}
                        className="font-bold text-white hover:text-emerald-400 underline-offset-2 hover:underline"
                      >
                        {item.packageName}
                      </Link>
                      <div className="text-[11px] font-sans text-zinc-400">{item.displayName}</div>
                    </td>
                    <td className="px-4 py-3 uppercase text-zinc-300">{item.registry}</td>
                    <td className="px-4 py-3 font-semibold text-emerald-400">v{item.latestVersion}</td>
                    <td className="px-4 py-3 text-zinc-400">{item.latestPublishedAt.slice(0, 10)}</td>
                    <td className="px-4 py-3 text-zinc-300">{item.releasesLast90d}</td>
                    <td className={`px-4 py-3 font-semibold uppercase ${riskColor}`}>
                      {item.schemaDriftRisk}
                    </td>
                    <td className="px-4 py-3 text-white">
                      {item.stabilityGrade} <span className="text-zinc-500">({item.stabilityScore})</span>
                    </td>
                    <td className="px-4 py-3">
                      <code className="rounded bg-zinc-950 px-2 py-1 text-[11px] text-emerald-300 border border-zinc-800">
                        {item.installCommand}
                      </code>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </section>

      {/* Category FAQs */}
      <section className="mt-8 rounded-xl border border-zinc-800 bg-zinc-900/40 p-6">
        <h2 className="font-mono text-lg font-bold text-white">
          Frequently Asked Questions: {hub.shortTitle}
        </h2>
        <div className="mt-4 space-y-4 divide-y divide-zinc-800/80">
          {faqs.map((f) => (
            <div key={f.question} className="pt-4 first:pt-0">
              <h3 className="font-mono text-sm font-bold text-emerald-300">{f.question}</h3>
              <p className="mt-1.5 text-xs sm:text-sm leading-relaxed text-zinc-300">{f.answer}</p>
            </div>
          ))}
        </div>
      </section>

      <div className="mt-10">
        <SubscribeBox
          heading={`Get Breaking-Change Alerts for ${hub.shortTitle}`}
          subtext={`Monitor all ${items.length} ${hub.shortTitle} packages and receive instant migration snippets when tool schemas or exports shift.`}
        />
      </div>
    </div>
  );
}
