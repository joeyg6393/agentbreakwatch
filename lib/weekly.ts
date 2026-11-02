import historyData from "@/data/release-history.json";
import { catalog, type CatalogItem, type VersionEntry } from "@/lib/catalog";

// Weekly "What Broke This Week" reports, computed at build time from
// data/catalog.json and data/release-history.json (both written by
// scripts/fetch-live-data.mjs during the daily refresh).

interface HistoryEntry {
  versions: VersionEntry[];
  deprecated?: string;
}

const history = historyData as unknown as {
  generatedAt: string;
  windowDays: number;
  items: Record<string, HistoryEntry>;
};

// First week with a published report. Older weeks are not generated.
const FIRST_WEEK = { year: 2026, week: 40 };

// Big SDKs shown first in the notable releases section.
const PRIORITY_SDK_SLUGS = [
  "openai-node",
  "openai-python",
  "anthropic-sdk-ts",
  "anthropic-python",
  "vercel-ai-sdk",
  "mcp-sdk-ts",
  "mcp-python",
  "fastmcp-python",
  "langgraph-js",
  "langgraph-python",
  "mastra-core",
  "openai-agents-js",
  "openai-agents-python",
  "anthropic-claude-agent-sdk",
  "google-genai-js",
  "pydantic-ai",
  "crewai-python",
  "langchain-core-js"
];

export interface WeekRef {
  id: string; // e.g. 2026-w45
  year: number;
  week: number;
  start: Date; // Monday 00:00 UTC
  end: Date; // next Monday 00:00 UTC (exclusive)
}

export interface Release {
  item: CatalogItem;
  version: string; // highest version reached by this kind of bump in the week
  previous?: string; // highest version before the first bump
  publishedAt: string; // first bump of this kind in the week
  bumps: number; // number of releases of this kind in the week
}

export interface PackageWeek {
  item: CatalogItem;
  releases: Release[]; // oldest first
  from?: string; // last version before the week
  to: string; // last version released in the week
}

export interface WeeklyReport {
  ref: WeekRef;
  inProgress: boolean;
  dataThrough: string;
  totalReleases: number;
  packagesReleased: number;
  sdkPackagesReleased: number;
  mcpPackagesReleased: number;
  majorJumps: Release[];
  zeroMinorBumps: Release[];
  highDriftReleased: PackageWeek[];
  notableSdk: PackageWeek[];
  mostActive: PackageWeek[];
  deprecatedReleased: Array<{ item: CatalogItem; note: string; releasedThisWeek: boolean }>;
  allPackages: PackageWeek[];
}

function isoWeekOf(d: Date): { year: number; week: number } {
  const t = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()));
  const day = t.getUTCDay() || 7;
  t.setUTCDate(t.getUTCDate() + 4 - day);
  const yearStart = new Date(Date.UTC(t.getUTCFullYear(), 0, 1));
  const week = Math.ceil(((t.getTime() - yearStart.getTime()) / 86400000 + 1) / 7);
  return { year: t.getUTCFullYear(), week };
}

function weekStart(year: number, week: number): Date {
  const jan4 = new Date(Date.UTC(year, 0, 4));
  const day = jan4.getUTCDay() || 7;
  const mondayW1 = new Date(jan4.getTime() - (day - 1) * 86400000);
  return new Date(mondayW1.getTime() + (week - 1) * 7 * 86400000);
}

function makeRef(year: number, week: number): WeekRef {
  const start = weekStart(year, week);
  return {
    id: `${year}-w${String(week).padStart(2, "0")}`,
    year,
    week,
    start,
    end: new Date(start.getTime() + 7 * 86400000)
  };
}

export function parseWeekId(id: string): WeekRef | undefined {
  const m = id.toLowerCase().match(/^(\d{4})-w(\d{1,2})$/);
  if (!m) return undefined;
  const ref = makeRef(parseInt(m[1], 10), parseInt(m[2], 10));
  return getAllWeeks().find((w) => w.id === ref.id);
}

function dataThroughDate(): Date {
  return new Date(catalog.generatedAt);
}

export function getAllWeeks(): WeekRef[] {
  const last = isoWeekOf(dataThroughDate());
  const weeks: WeekRef[] = [];
  let ref = makeRef(FIRST_WEEK.year, FIRST_WEEK.week);
  const lastRef = makeRef(last.year, last.week);
  while (ref.start.getTime() <= lastRef.start.getTime()) {
    weeks.push(ref);
    const next = new Date(ref.start.getTime() + 7 * 86400000);
    const w = isoWeekOf(next);
    ref = makeRef(w.year, w.week);
  }
  return weeks.reverse(); // newest first
}

function versionParts(v: string): number[] {
  return (v.match(/\d+/g) || []).slice(0, 4).map((n) => parseInt(n, 10));
}

function compareVersions(a: string, b: string): number {
  const pa = versionParts(a);
  const pb = versionParts(b);
  for (let i = 0; i < Math.max(pa.length, pb.length); i++) {
    const d = (pa[i] || 0) - (pb[i] || 0);
    if (d !== 0) return d;
  }
  return 0;
}

const isCalver = (v: string) => (versionParts(v)[0] || 0) >= 2000;

// Plain release versions only: 1.2.3 on npm, 1.2.3 or 1.2.3.post1 on PyPI.
// Prereleases, dev builds, platform builds, and snapshot tags are skipped.
function isPlainRelease(v: string, registry: CatalogItem["registry"]): boolean {
  return registry === "npm" ? /^\d+\.\d+\.\d+$/.test(v) : /^\d+(\.\d+){0,3}(\.post\d+)?$/.test(v);
}

function versionsFor(item: CatalogItem): VersionEntry[] {
  const merged = new Map<string, VersionEntry>();
  for (const v of history.items[item.slug]?.versions || []) merged.set(v.version, v);
  for (const v of item.recentVersions || []) merged.set(v.version, v);
  for (const k of [...merged.keys()]) if (!isPlainRelease(k, item.registry)) merged.delete(k);
  return [...merged.values()].sort(
    (a, b) => new Date(a.publishedAt).getTime() - new Date(b.publishedAt).getTime()
  );
}

export function getDeprecationNote(item: CatalogItem): string | undefined {
  return history.items[item.slug]?.deprecated;
}

const cache = new Map<string, WeeklyReport>();

export function getWeeklyReport(ref: WeekRef): WeeklyReport {
  const hit = cache.get(ref.id);
  if (hit) return hit;

  const majorJumps: Release[] = [];
  const zeroMinorBumps: Release[] = [];
  const allPackages: PackageWeek[] = [];
  let totalReleases = 0;

  for (const item of catalog.items) {
    const versions = versionsFor(item);
    const releases: Release[] = [];
    let maxPrior: string | undefined;
    let from: string | undefined;
    let major: Release | undefined;
    let zeroMinor: Release | undefined;

    for (const v of versions) {
      const t = new Date(v.publishedAt).getTime();
      if (t >= ref.end.getTime()) break;
      if (t >= ref.start.getTime()) {
        if (releases.length === 0) from = maxPrior;
        releases.push({ item, version: v.version, previous: maxPrior, publishedAt: v.publishedAt, bumps: 1 });
        if (maxPrior && !isCalver(v.version) && !isCalver(maxPrior)) {
          const [nMaj = 0, nMin = 0] = versionParts(v.version);
          const [pMaj = 0, pMin = 0] = versionParts(maxPrior);
          if (nMaj > pMaj) {
            if (major) { major.version = v.version; major.bumps += 1; }
            else major = { item, version: v.version, previous: maxPrior, publishedAt: v.publishedAt, bumps: 1 };
          } else if (nMaj === 0 && pMaj === 0 && nMin > pMin) {
            if (zeroMinor) { zeroMinor.version = v.version; zeroMinor.bumps += 1; }
            else zeroMinor = { item, version: v.version, previous: maxPrior, publishedAt: v.publishedAt, bumps: 1 };
          }
        }
      }
      if (!maxPrior || compareVersions(v.version, maxPrior) > 0) maxPrior = v.version;
    }

    if (major) majorJumps.push(major);
    if (zeroMinor) zeroMinorBumps.push(zeroMinor);
    if (releases.length > 0) {
      totalReleases += releases.length;
      // "to" is the highest version reached, so maintenance releases on older lines do not show as downgrades.
      allPackages.push({ item, releases, from, to: maxPrior || releases[releases.length - 1].version });
    }
  }

  const byActivity = (a: PackageWeek, b: PackageWeek) =>
    b.releases.length - a.releases.length || a.item.displayName.localeCompare(b.item.displayName);

  const sdkWeeks = allPackages.filter((p) => p.item.kind === "sdk");
  const notableSdk = [...sdkWeeks].sort((a, b) => {
    const ia = PRIORITY_SDK_SLUGS.indexOf(a.item.slug);
    const ib = PRIORITY_SDK_SLUGS.indexOf(b.item.slug);
    return (ia === -1 ? 999 : ia) - (ib === -1 ? 999 : ib) || byActivity(a, b);
  });

  const releasedSlugs = new Set(allPackages.map((p) => p.item.slug));
  const deprecatedReleased = catalog.items
    .map((item) => ({ item, note: getDeprecationNote(item) }))
    .filter((d): d is { item: CatalogItem; note: string } => Boolean(d.note))
    .map((d) => ({ ...d, releasedThisWeek: releasedSlugs.has(d.item.slug) }));

  const now = dataThroughDate();
  const report: WeeklyReport = {
    ref,
    inProgress: now.getTime() < ref.end.getTime(),
    dataThrough: catalog.generatedAt,
    totalReleases,
    packagesReleased: allPackages.length,
    sdkPackagesReleased: sdkWeeks.length,
    mcpPackagesReleased: allPackages.length - sdkWeeks.length,
    majorJumps: majorJumps.sort((a, b) => a.publishedAt.localeCompare(b.publishedAt)),
    zeroMinorBumps: zeroMinorBumps.sort((a, b) => a.publishedAt.localeCompare(b.publishedAt)),
    highDriftReleased: allPackages.filter((p) => p.item.schemaDriftRisk === "high").sort(byActivity),
    notableSdk,
    mostActive: [...allPackages].sort(byActivity).slice(0, 10),
    deprecatedReleased,
    allPackages: [...allPackages].sort((a, b) => a.item.displayName.localeCompare(b.item.displayName))
  };
  cache.set(ref.id, report);
  return report;
}

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

export function fmtDay(d: Date): string {
  return `${MONTHS[d.getUTCMonth()]} ${d.getUTCDate()}`;
}

export function weekRangeLabel(ref: WeekRef): string {
  const last = new Date(ref.end.getTime() - 86400000);
  return `${fmtDay(ref.start)} to ${fmtDay(last)}, ${last.getUTCFullYear()}`;
}

export function weekTitle(ref: WeekRef): string {
  return `What Broke This Week: ${weekRangeLabel(ref)}`;
}

export function weekSummary(r: WeeklyReport): string {
  const majors = r.majorJumps.length;
  const majorText =
    majors === 0
      ? "no major version jumps"
      : `${majors} major version jump${majors === 1 ? "" : "s"}`;
  return `${r.totalReleases} releases across ${r.packagesReleased} of ${catalog.totalTracked} tracked Agent SDKs and MCP servers, with ${majorText}${r.inProgress ? " so far" : ""}.`;
}
