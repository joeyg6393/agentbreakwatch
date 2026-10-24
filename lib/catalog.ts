import catalogData from "@/data/catalog.json";

export interface VersionEntry {
  version: string;
  publishedAt: string;
}

export interface CatalogItem {
  slug: string;
  packageName: string;
  registry: "npm" | "pypi";
  kind: "sdk" | "mcp";
  subcategory: string;
  displayName: string;
  vendor: string;
  githubRepo: string;
  description: string;
  breakingSummary: string;
  schemaDriftRisk: "high" | "medium" | "low";
  affectedSymbols: string[];
  migrationBefore: string;
  migrationAfter: string;
  latestVersion: string;
  latestPublishedAt: string;
  recentVersions: VersionEntry[];
  releasesLast90d: number;
  dependenciesCount: number;
  license: string;
  registryUrl: string;
  githubUrl: string;
  installCommand: string;
  stabilityScore: number;
  stabilityGrade: string;
}

export interface CatalogPayload {
  generatedAt: string;
  totalTracked: number;
  sdkCount: number;
  mcpCount: number;
  items: CatalogItem[];
}

export const catalog: CatalogPayload = catalogData as CatalogPayload;

export function getAllItems(): CatalogItem[] {
  return catalog.items;
}

export function getItemBySlug(slug: string): CatalogItem | undefined {
  return catalog.items.find((i) => i.slug === slug);
}

export function findItemByPackageName(pkgName: string, preferredRegistry?: "npm" | "pypi"): CatalogItem | undefined {
  const normalized = pkgName.trim().toLowerCase();
  const matches = catalog.items.filter((i) => i.packageName.toLowerCase() === normalized);
  if (matches.length === 0) return undefined;
  if (preferredRegistry) {
    const exact = matches.find((m) => m.registry === preferredRegistry);
    if (exact) return exact;
  }
  return matches[0];
}

export interface StackAuditFinding {
  inputName: string;
  specifiedVersion: string;
  latestVersion: string;
  status: "breaking_major" | "outdated_minor" | "up_to_date" | "unpinned_latest" | "untracked";
  severity: "critical" | "warning" | "ok" | "info";
  matchedItem?: CatalogItem;
  upgradeCommand?: string;
  note: string;
}

function cleanSemver(raw: string): { clean: string; isLatestOrWildcard: boolean } {
  const trimmed = raw.trim().replace(/^["']|["']$/g, "");
  if (!trimmed || trimmed === "latest" || trimmed === "*") {
    return { clean: "latest", isLatestOrWildcard: true };
  }
  const cleaned = trimmed.replace(/^[\^~>=<v]+/, "").trim();
  return { clean: cleaned || "latest", isLatestOrWildcard: cleaned === "latest" || cleaned === "*" };
}

function parseMajorMinor(ver: string): { major: number; minor: number } | null {
  const m = ver.match(/^(\d+)\.(\d+)/);
  if (!m) return null;
  return { major: parseInt(m[1], 10), minor: parseInt(m[2], 10) };
}

export function auditStackInput(rawText: string): {
  detectedFormat: string;
  findings: StackAuditFinding[];
  breakingCount: number;
  outdatedCount: number;
  upToDateCount: number;
} {
  const text = rawText.trim();
  if (!text) {
    return { detectedFormat: "empty", findings: [], breakingCount: 0, outdatedCount: 0, upToDateCount: 0 };
  }

  const extracted: Array<{ name: string; version: string; registry?: "npm" | "pypi" }> = [];
  let detectedFormat = "Plain Package List";

  // Try parsing JSON (.mcp.json or package.json)
  if (text.startsWith("{")) {
    try {
      const parsed = JSON.parse(text);
      if (parsed.mcpServers || parsed.servers) {
        detectedFormat = ".mcp.json (MCP Server Config)";
        const serversObj = parsed.mcpServers || parsed.servers || {};
        for (const [, cfg] of Object.entries<any>(serversObj)) {
          const args: string[] = Array.isArray(cfg?.args) ? cfg.args.map(String) : [];
          const cmd = String(cfg?.command || "");
          const allTokens = [cmd, ...args];
          for (const tok of allTokens) {
            if (tok.startsWith("-") || tok === "npx" || tok === "uvx" || tok === "node" || tok === "python" || tok === "run" || tok === "start") continue;
            // Check if token looks like package@version or package
            const atIdx = tok.lastIndexOf("@");
            if (atIdx > 0) {
              const pkgPart = tok.slice(0, atIdx);
              const verPart = tok.slice(atIdx + 1);
              if (findItemByPackageName(pkgPart)) {
                extracted.push({ name: pkgPart, version: verPart });
                continue;
              }
            }
            if (findItemByPackageName(tok)) {
              extracted.push({ name: tok, version: "latest" });
            }
          }
        }
      } else if (parsed.dependencies || parsed.devDependencies) {
        detectedFormat = "package.json (Node/TypeScript)";
        const deps = { ...(parsed.dependencies || {}), ...(parsed.devDependencies || {}) };
        for (const [k, v] of Object.entries(deps)) {
          extracted.push({ name: k, version: String(v), registry: "npm" });
        }
      }
    } catch {
      // fall through to line parser
    }
  }

  if (extracted.length === 0) {
    // Parse requirements.txt / pyproject.toml / plain lines
    if (text.includes("==") || text.includes(">=")) {
      detectedFormat = "requirements.txt / pyproject.toml (Python)";
    }
    const lines = text.split(/\r?\n/);
    for (const rawLine of lines) {
      const line = rawLine.split("#")[0].trim();
      if (!line) continue;
      // Match requirements.txt style: pkg==1.2.3 or pkg>=1.2.3
      const pyMatch = line.match(/^([a-zA-Z0-9._-]+)\s*(?:==|>=|~=|<=|>|<)\s*([a-zA-Z0-9._-]+)/);
      if (pyMatch) {
        extracted.push({ name: pyMatch[1], version: pyMatch[2], registry: "pypi" });
        continue;
      }
      // Match JSON-like line: "@pkg/name": "^1.2.3"
      const jsonLineMatch = line.match(/"([^"]+)"\s*:\s*"([^"]+)"/);
      if (jsonLineMatch && !["command", "url", "transport", "type", "name", "version", "private"].includes(jsonLineMatch[1])) {
        extracted.push({ name: jsonLineMatch[1], version: jsonLineMatch[2], registry: "npm" });
        continue;
      }
      // Match npx/uvx/pip/npm command or bare package@version
      const tokens = line.split(/\s+/);
      for (const tok of tokens) {
        const cleanTok = tok.replace(/[,;"']/g, "");
        const atIdx = cleanTok.lastIndexOf("@");
        if (atIdx > 0) {
          const pkgPart = cleanTok.slice(0, atIdx);
          const verPart = cleanTok.slice(atIdx + 1);
          if (findItemByPackageName(pkgPart)) {
            extracted.push({ name: pkgPart, version: verPart });
          }
        } else if (findItemByPackageName(cleanTok)) {
          extracted.push({ name: cleanTok, version: "latest" });
        }
      }
    }
  }

  const findings: StackAuditFinding[] = [];
  for (const entry of extracted) {
    const item = findItemByPackageName(entry.name, entry.registry);
    const { clean, isLatestOrWildcard } = cleanSemver(entry.version);
    if (!item) {
      findings.push({
        inputName: entry.name,
        specifiedVersion: entry.version,
        latestVersion: "untracked",
        status: "untracked",
        severity: "info",
        note: "Package is not in the core 69 AI agent index yet. Submit below to add it to our 30-minute poller."
      });
      continue;
    }

    if (isLatestOrWildcard) {
      findings.push({
        inputName: item.packageName,
        specifiedVersion: entry.version,
        latestVersion: item.latestVersion,
        status: "unpinned_latest",
        severity: item.schemaDriftRisk === "high" ? "critical" : "warning",
        matchedItem: item,
        upgradeCommand: item.installCommand,
        note: `Unpinned (@latest) dependency with ${item.schemaDriftRisk.toUpperCase()} schema drift risk. Silent tool schema or export shifts will hit production immediately. Pin to v${item.latestVersion}.`
      });
      continue;
    }

    if (clean === item.latestVersion) {
      findings.push({
        inputName: item.packageName,
        specifiedVersion: entry.version,
        latestVersion: item.latestVersion,
        status: "up_to_date",
        severity: "ok",
        matchedItem: item,
        upgradeCommand: item.installCommand,
        note: `Matches live ${item.registry.toUpperCase()} version v${item.latestVersion} (published ${item.latestPublishedAt.slice(0, 10)}).`
      });
      continue;
    }

    const specMM = parseMajorMinor(clean);
    const latestMM = parseMajorMinor(item.latestVersion);
    const isMajorBreak =
      specMM && latestMM
        ? latestMM.major > specMM.major || (latestMM.major === 0 && latestMM.minor > specMM.minor)
        : true;

    if (isMajorBreak) {
      findings.push({
        inputName: item.packageName,
        specifiedVersion: entry.version,
        latestVersion: item.latestVersion,
        status: "breaking_major",
        severity: "critical",
        matchedItem: item,
        upgradeCommand: item.installCommand,
        note: `Major or breaking version delta (${clean} -> ${item.latestVersion}). ${item.breakingSummary}`
      });
    } else {
      findings.push({
        inputName: item.packageName,
        specifiedVersion: entry.version,
        latestVersion: item.latestVersion,
        status: "outdated_minor",
        severity: "warning",
        matchedItem: item,
        upgradeCommand: item.installCommand,
        note: `Behind live ${item.registry.toUpperCase()} release (${clean} -> ${item.latestVersion}). ${item.breakingSummary}`
      });
    }
  }

  const breakingCount = findings.filter((f) => f.severity === "critical").length;
  const outdatedCount = findings.filter((f) => f.severity === "warning").length;
  const upToDateCount = findings.filter((f) => f.severity === "ok").length;

  return {
    detectedFormat,
    findings,
    breakingCount,
    outdatedCount,
    upToDateCount
  };
}
