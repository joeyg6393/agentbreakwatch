import catalogData from "@/data/catalog.json";

export const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://agentbreakwatch.com";

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

export interface CategoryHub {
  slug: string;
  title: string;
  shortTitle: string;
  description: string;
  verdictSummary: string;
  matchSubcategories?: string[];
  filterFn: (item: CatalogItem) => boolean;
}

export const CATEGORY_HUBS: CategoryHub[] = [
  {
    slug: "agent-sdks",
    title: "AI Agent SDKs & Frameworks Breaking-Change Index",
    shortTitle: "Agent SDKs",
    description:
      "Live npm and PyPI release tracker for core AI Agent SDKs, model provider clients, and multi-agent frameworks including OpenAI, Anthropic, Vercel AI SDK, LangGraph, Mastra, CrewAI, FastMCP, and PydanticAI.",
    verdictSummary:
      "Core AI Agent SDKs ship frequent minor and major updates that alter tool-calling signatures, streaming events, and structured output schemas. Always pin exact minor versions and verify migration diffs before upgrading.",
    filterFn: (i) => i.kind === "sdk"
  },
  {
    slug: "official-reference",
    title: "Official Reference MCP Servers Stability & Migration Index",
    shortTitle: "Official Reference MCPs",
    description:
      "Track breaking changes, v2.0.0 roots protocol updates, and archived-server replacements across official @modelcontextprotocol/server-* packages and Python reference MCP servers.",
    verdictSummary:
      "Several early @modelcontextprotocol/server-* packages (github, postgres, puppeteer, slack) are archived on npm and superseded by vendor-maintained MCP servers, while active servers (filesystem, memory, sequential-thinking) shipped major v2.0.0 schema updates.",
    filterFn: (i) => i.subcategory === "Official Reference MCP"
  },
  {
    slug: "aws-labs",
    title: "AWS Labs Official MCP Servers (awslabs.*) Stability Index",
    shortTitle: "AWS Labs MCPs",
    description:
      "Live PyPI release history, FastMCP tool signatures, and IAM profile configuration changes for all official AWS Labs Model Context Protocol servers (EKS, Terraform, CDK, Lambda, DynamoDB, RDS, CloudWatch, Cost Analysis, Bedrock KB).",
    verdictSummary:
      "AWS Labs maintains a fast-moving suite of Python MCP servers distributed via uvx on PyPI. Pin exact package versions in .mcp.json and set FASTMCP_LOG_LEVEL=ERROR to prevent stdio JSON-RPC framing corruption.",
    filterFn: (i) => i.vendor === "AWS Labs" || i.packageName.startsWith("awslabs.")
  },
  {
    slug: "database-backend",
    title: "Database, SQL & Vector DB MCP Servers Stability Index",
    shortTitle: "Database & Backend",
    description:
      "Schema drift risk and release tracking for PostgreSQL, MySQL, Supabase, Neon, ClickHouse, Snowflake, MotherDuck, Redis, Upstash, Qdrant, Chroma, and Elasticsearch MCP servers.",
    verdictSummary:
      "Database MCP servers frequently split read-only vs write DDL/DML tools (such as execute_sql vs apply_migration) to prevent accidental destructive queries. Always pass --read-only flags in production agents.",
    filterFn: (i) =>
      i.subcategory === "Database & Backend MCP" || i.subcategory === "Vector DB MCP"
  },
  {
    slug: "cloud-infra",
    title: "Cloud, Kubernetes & Infrastructure MCP Servers Stability Index",
    shortTitle: "Cloud & Infra",
    description:
      "Monitor tool schema updates across Cloudflare, Azure, Google Cloud (gcloud & GCS), Kubernetes, ArgoCD, Heroku, Netlify, Hostinger, Dokploy, Coolify, Runpod, and E2B sandbox MCP servers.",
    verdictSummary:
      "Cloud and Kubernetes MCP servers consolidate resource verbs into unified tools (like kubectl_get and kubectl_apply) and increasingly transition from local stdio wrappers to remote OAuth Streamable HTTP endpoints.",
    filterFn: (i) =>
      i.subcategory === "Cloud & Infra MCP" || i.subcategory === "Code Sandbox MCP"
  },
  {
    slug: "browser-automation",
    title: "Browser Automation, Playwright & DevTools MCP Servers",
    shortTitle: "Browser Automation",
    description:
      "Track breaking CLI flags, accessibility snapshot ref changes, and vision capabilities across Playwright MCP, Chrome DevTools MCP, Browserbase Stagehand, BrowserStack, WebdriverIO, and Appium MCP servers.",
    verdictSummary:
      "Browser MCP servers have high schema drift risk due to frequent snapshot element reference and capability flag updates (such as @playwright/mcp --caps=vision,pdf). Pin exact versions in CI and production agents.",
    filterFn: (i) =>
      i.subcategory === "Browser Automation MCP" || i.subcategory === "Browser Agent SDK"
  },
  {
    slug: "search-data",
    title: "Search, Web Scraping & RAG Research MCP Servers",
    shortTitle: "Search & Data",
    description:
      "Live version tracking and tool parameter diffs for Firecrawl, Exa, Tavily, Brave Search, Perplexity, Apify Actors, Bright Data, DuckDuckGo, SearXNG, DataForSEO, arXiv, and PubMed MCP servers.",
    verdictSummary:
      "Web search and scraping MCP servers frequently rename tool identifiers (e.g., web_search_exa, firecrawl_scrape) and tighten enum validation on search depth and output formats.",
    filterFn: (i) =>
      i.subcategory === "Search & Research MCP" || i.subcategory === "Web Scraping & Data MCP"
  },
  {
    slug: "observability",
    title: "Observability, Sentry, Datadog & Metrics MCP Servers",
    shortTitle: "Observability",
    description:
      "Monitor release velocity and tool input schema changes across Sentry, PostHog, Datadog, Grafana, Prometheus, Google Cloud Observability, Microsoft Clarity, Raygun, and OpenLLMetry MCP packages.",
    verdictSummary:
      "Observability MCP servers require explicit organization or project slug parameters on multi-tenant API tokens and regularly expand incident and trace query schemas.",
    filterFn: (i) => i.subcategory === "Observability MCP"
  },
  {
    slug: "productivity-docs",
    title: "Productivity, Notion, Slack, Jira & Docs MCP Servers",
    shortTitle: "Productivity & Docs",
    description:
      "Breaking-change alerts and auth header migrations for Notion, Slack, Atlassian Jira & Confluence, Linear, ClickUp, Todoist, Google Calendar, Microsoft 365, Salesforce, Contentful, and Context7 MCP servers.",
    verdictSummary:
      "Workspace and documentation MCP servers frequently update environment variable names (such as NOTION_TOKEN vs NOTION_API_TOKEN) and paginate large search responses to fit context windows.",
    filterFn: (i) =>
      i.subcategory === "Productivity & Docs MCP" || i.subcategory === "Developer Docs MCP"
  },
  {
    slug: "design-ui",
    title: "Design, Figma, Storybook & UI Component MCP Servers",
    shortTitle: "Design & UI",
    description:
      "Track tool schema changes across Figma Developer MCP, Figma Console MCP, Storybook MCP, shadcn/ui, Draw.io, Mantine, PandaCSS, PrimeNG, React Aria, SAP Fiori, and Adobe Photoshop MCP servers.",
    verdictSummary:
      "Design-to-code MCP servers evolve rapidly alongside component library major releases; version mismatches between your UI framework and its MCP server cause invalid component prop generation.",
    filterFn: (i) => i.subcategory === "Design & UI MCP"
  },
  {
    slug: "payments",
    title: "Payments, Stripe, FinTech & Crypto Wallet MCP Servers",
    shortTitle: "Payments & FinTech",
    description:
      "Monitor permission scoping flags and tool schema updates across Stripe Official MCP, Xero, Freee, Coinbase Design System, Phantom Wallet, and Rate-API MCP servers.",
    verdictSummary:
      "Financial MCP servers enforce granular tool permission flags (such as --tools=all or read-only resource scopes) and require strict API key environment isolation.",
    filterFn: (i) => i.subcategory === "Payments & FinTech MCP"
  },
  {
    slug: "mcp-bridges-devtools",
    title: "MCP Bridges, Transports, Inspectors & Developer Tools",
    shortTitle: "Bridges & DevTools",
    description:
      "Track protocol transport updates (Streamable HTTP vs SSE), OAuth proxy bridges, OpenAPI-to-MCP generators, and developer tools including mcp-remote, supergateway, mcp-handler, MCP Inspector, Claude Code, and OpenAI Codex.",
    verdictSummary:
      "MCP transport bridges and inspectors are critical infrastructure: updates to Streamable HTTP session handling or proxy authentication tokens (like MCP_PROXY_AUTH_TOKEN) directly affect connectivity.",
    filterFn: (i) =>
      i.subcategory === "MCP Bridge & Transport" ||
      i.subcategory === "MCP DevTool / Inspector" ||
      i.subcategory === "Agent CLI & MCP Host" ||
      i.subcategory === "Developer Tools MCP"
  }
];

export function getCategoryHubBySlug(slug: string): CategoryHub | undefined {
  return CATEGORY_HUBS.find((c) => c.slug === slug);
}

export function getItemsForCategoryHub(hub: CategoryHub): CatalogItem[] {
  return catalog.items.filter(hub.filterFn);
}

export function getPrimaryCategoryHubForItem(item: CatalogItem): CategoryHub {
  if (item.kind === "sdk") return CATEGORY_HUBS[0];
  if (item.vendor === "AWS Labs" || item.packageName.startsWith("awslabs.")) {
    return CATEGORY_HUBS.find((c) => c.slug === "aws-labs") || CATEGORY_HUBS[1];
  }
  const matched = CATEGORY_HUBS.slice(1).find((c) => c.filterFn(item));
  return matched || CATEGORY_HUBS[CATEGORY_HUBS.length - 1];
}

export function getAllItems(): CatalogItem[] {
  return catalog.items;
}

export function getItemBySlug(slug: string): CatalogItem | undefined {
  const norm = slug.trim().toLowerCase();
  return (
    catalog.items.find((i) => i.slug.toLowerCase() === norm) ||
    catalog.items.find((i) => i.packageName.toLowerCase() === norm) ||
    catalog.items.find(
      (i) => i.packageName.replace(/^@/, "").replace(/[\/.]/g, "-").toLowerCase() === norm
    )
  );
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
    if (text.includes("==") || text.includes(">=")) {
      detectedFormat = "requirements.txt / pyproject.toml (Python)";
    }
    const lines = text.split(/\r?\n/);
    for (const rawLine of lines) {
      const line = rawLine.split("#")[0].trim();
      if (!line) continue;
      const pyMatch = line.match(/^([a-zA-Z0-9._-]+)\s*(?:==|>=|~=|<=|>|<)\s*([a-zA-Z0-9._-]+)/);
      if (pyMatch) {
        extracted.push({ name: pyMatch[1], version: pyMatch[2], registry: "pypi" });
        continue;
      }
      const jsonLineMatch = line.match(/"([^"]+)"\s*:\s*"([^"]+)"/);
      if (jsonLineMatch && !["command", "url", "transport", "type", "name", "version", "private"].includes(jsonLineMatch[1])) {
        extracted.push({ name: jsonLineMatch[1], version: jsonLineMatch[2], registry: "npm" });
        continue;
      }
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
        note: `Package is not in the core ${catalog.totalTracked} AI agent index yet. Submit below to add it to our 30-minute poller.`
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
