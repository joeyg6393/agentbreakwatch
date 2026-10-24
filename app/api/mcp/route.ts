import { NextResponse } from "next/server";
import {
  catalog,
  getItemBySlug,
  findItemByPackageName,
  auditStackInput,
  CATEGORY_HUBS,
  getItemsForCategoryHub
} from "@/lib/catalog";

const SERVER_INFO = {
  name: "agentbreakwatch-mcp",
  version: "1.1.0",
  homepage: "https://agentbreakwatch.vercel.app",
  description: `Official AgentBreakWatch MCP server. Query live npm and PyPI versions, 90-day release velocity, MCP tools/list schema drift risk, and copy-paste migration diffs across ${catalog.sdkCount} core AI Agent SDKs and ${catalog.mcpCount} MCP servers (${catalog.totalTracked} total packages).`
};

const MCP_TOOLS = [
  {
    name: "check_stack_drift",
    description:
      "Audit a package.json, requirements.txt, or .mcp.json configuration string against 256 live AI Agent SDKs and MCP servers. Flags breaking major version deltas, unpinned @latest MCP servers, and outdated dependencies with exact pin commands.",
    inputSchema: {
      type: "object",
      required: ["manifest"],
      properties: {
        manifest: {
          type: "string",
          description: "Raw contents of .mcp.json, package.json, requirements.txt, or a newline-separated list of packages"
        }
      }
    }
  },
  {
    name: "get_package_stability",
    description:
      "Look up live npm or PyPI version, publish timestamp, 90-day release velocity, stability score (0-100), MCP tools/list schema drift risk, and before/after migration code for a specific AI Agent SDK or MCP server.",
    inputSchema: {
      type: "object",
      required: ["package"],
      properties: {
        package: {
          type: "string",
          description: "Package name or slug (e.g. 'openai', '@modelcontextprotocol/sdk', '@playwright/mcp', 'fastmcp', 'mcp-clickhouse')"
        }
      }
    }
  },
  {
    name: "list_volatile_packages",
    description:
      "List the fastest-changing or highest schema-drift-risk AI Agent SDKs and MCP servers from the live AgentBreakWatch telemetry index.",
    inputSchema: {
      type: "object",
      properties: {
        kind: {
          type: "string",
          enum: ["all", "sdk", "mcp"],
          description: "Filter by Agent SDK ('sdk'), MCP server ('mcp'), or 'all'"
        },
        category: {
          type: "string",
          description: "Optional category hub slug (e.g. 'agent-sdks', 'aws-labs', 'database-backend', 'browser-automation', 'cloud-infra')"
        },
        limit: {
          type: "number",
          description: "Maximum number of packages to return (default 15, max 50)"
        }
      }
    }
  },
  {
    name: "get_archived_mcp_replacements",
    description:
      "Get the migration matrix for archived or frozen @modelcontextprotocol/server-* reference packages and their official 2026 vendor-maintained replacements.",
    inputSchema: {
      type: "object",
      properties: {}
    }
  }
];

const ARCHIVED_REPLACEMENTS = [
  {
    legacyPackage: "@modelcontextprotocol/server-github",
    status: "Archived at v2025.4.8",
    replacement: "Remote https://api.githubcopilot.com/mcp/ or github-mcp-server",
    detailsUrl: "https://agentbreakwatch.vercel.app/p/mcp-server-github"
  },
  {
    legacyPackage: "@modelcontextprotocol/server-postgres",
    status: "Frozen at v0.6.2",
    replacement: "@supabase/mcp-server-supabase or @neondatabase/mcp-server-neon",
    detailsUrl: "https://agentbreakwatch.vercel.app/p/mcp-server-postgres"
  },
  {
    legacyPackage: "@modelcontextprotocol/server-puppeteer",
    status: "Archived at v2025.5.12",
    replacement: "@playwright/mcp or chrome-devtools-mcp",
    detailsUrl: "https://agentbreakwatch.vercel.app/p/mcp-server-puppeteer"
  },
  {
    legacyPackage: "@modelcontextprotocol/server-brave-search",
    status: "Frozen at v0.6.2",
    replacement: "@brave/brave-search-mcp-server",
    detailsUrl: "https://agentbreakwatch.vercel.app/p/mcp-server-brave-search"
  },
  {
    legacyPackage: "@modelcontextprotocol/server-redis",
    status: "Archived at v2025.4.25",
    replacement: "redis-mcp-server (PyPI) or @upstash/mcp-server (npm)",
    detailsUrl: "https://agentbreakwatch.vercel.app/p/mcp-server-redis"
  }
];

function executeToolCall(name: string, args: Record<string, any> = {}) {
  if (name === "check_stack_drift") {
    const manifest = String(args.manifest || "");
    const report = auditStackInput(manifest);
    return {
      content: [
        {
          type: "text",
          text: JSON.stringify(
            {
              source: "https://agentbreakwatch.vercel.app/check",
              snapshotAt: catalog.generatedAt,
              ...report
            },
            null,
            2
          )
        }
      ]
    };
  }

  if (name === "get_package_stability") {
    const q = String(args.package || "").trim();
    const item = getItemBySlug(q) || findItemByPackageName(q);
    if (!item) {
      return {
        isError: true,
        content: [
          {
            type: "text",
            text: `Package '${q}' was not found in the ${catalog.totalTracked}-package AgentBreakWatch index. Browse all packages at https://agentbreakwatch.vercel.app`
          }
        ]
      };
    }
    return {
      content: [
        {
          type: "text",
          text: JSON.stringify(
            {
              canonicalUrl: `https://agentbreakwatch.vercel.app/p/${item.slug}`,
              llmsTxtUrl: `https://agentbreakwatch.vercel.app/p/${item.slug}/llms.txt`,
              tldrVerdict: `${item.displayName} (${item.packageName}) is at v${item.latestVersion} on ${item.registry.toUpperCase()} (published ${item.latestPublishedAt.slice(0, 10)}), stability ${item.stabilityScore}/100 (${item.stabilityGrade}), drift risk ${item.schemaDriftRisk.toUpperCase()}. ${item.breakingSummary}`,
              package: item
            },
            null,
            2
          )
        }
      ]
    };
  }

  if (name === "list_volatile_packages") {
    const kind = args.kind || "all";
    const category = args.category ? String(args.category).trim().toLowerCase() : "";
    const limit = Math.min(50, Math.max(1, Number(args.limit) || 15));

    let list = [...catalog.items];
    if (kind === "sdk" || kind === "mcp") {
      list = list.filter((i) => i.kind === kind);
    }
    if (category) {
      const hub = CATEGORY_HUBS.find((h) => h.slug === category);
      if (hub) {
        list = getItemsForCategoryHub(hub);
      } else {
        list = list.filter((i) => i.subcategory.toLowerCase().includes(category));
      }
    }

    list.sort((a, b) => b.releasesLast90d - a.releasesLast90d);
    const slice = list.slice(0, limit).map((i) => ({
      packageName: i.packageName,
      slug: i.slug,
      registry: i.registry,
      kind: i.kind,
      latestVersion: i.latestVersion,
      latestPublishedAt: i.latestPublishedAt.slice(0, 10),
      releasesLast90d: i.releasesLast90d,
      schemaDriftRisk: i.schemaDriftRisk,
      stabilityScore: i.stabilityScore,
      stabilityGrade: i.stabilityGrade,
      installCommand: i.installCommand,
      url: `https://agentbreakwatch.vercel.app/p/${i.slug}`
    }));

    return {
      content: [
        {
          type: "text",
          text: JSON.stringify(
            {
              reportUrl: "https://agentbreakwatch.vercel.app/drift-report",
              count: slice.length,
              packages: slice
            },
            null,
            2
          )
        }
      ]
    };
  }

  if (name === "get_archived_mcp_replacements") {
    return {
      content: [
        {
          type: "text",
          text: JSON.stringify(
            {
              reportUrl: "https://agentbreakwatch.vercel.app/drift-report",
              replacements: ARCHIVED_REPLACEMENTS
            },
            null,
            2
          )
        }
      ]
    };
  }

  return {
    isError: true,
    content: [{ type: "text", text: `Unknown tool: ${name}` }]
  };
}

export async function GET() {
  return NextResponse.json(
    {
      protocol: "mcp",
      protocolVersion: "2025-06-18",
      transport: "streamable-http",
      endpoint: "https://agentbreakwatch.vercel.app/api/mcp",
      serverInfo: SERVER_INFO,
      tools: MCP_TOOLS,
      installConfig: {
        mcpServers: {
          agentbreakwatch: {
            url: "https://agentbreakwatch.vercel.app/api/mcp"
          }
        }
      }
    },
    {
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Cache-Control": "public, s-maxage=300"
      }
    }
  );
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { id, method, params } = body || {};

    if (method === "initialize") {
      return NextResponse.json(
        {
          jsonrpc: "2.0",
          id: id ?? 1,
          result: {
            protocolVersion: params?.protocolVersion || "2025-06-18",
            capabilities: {
              tools: { listChanged: false }
            },
            serverInfo: SERVER_INFO
          }
        },
        { headers: { "Access-Control-Allow-Origin": "*" } }
      );
    }

    if (method === "notifications/initialized") {
      return new NextResponse(null, { status: 204 });
    }

    if (method === "ping") {
      return NextResponse.json({ jsonrpc: "2.0", id: id ?? 1, result: {} });
    }

    if (method === "tools/list") {
      return NextResponse.json(
        {
          jsonrpc: "2.0",
          id: id ?? 1,
          result: {
            tools: MCP_TOOLS
          }
        },
        { headers: { "Access-Control-Allow-Origin": "*" } }
      );
    }

    if (method === "tools/call") {
      const toolName = params?.name;
      const toolArgs = params?.arguments || {};
      const result = executeToolCall(toolName, toolArgs);
      return NextResponse.json(
        {
          jsonrpc: "2.0",
          id: id ?? 1,
          result
        },
        { headers: { "Access-Control-Allow-Origin": "*" } }
      );
    }

    return NextResponse.json(
      {
        jsonrpc: "2.0",
        id: id ?? null,
        error: { code: -32601, message: `Method not found: ${method}` }
      },
      { status: 400, headers: { "Access-Control-Allow-Origin": "*" } }
    );
  } catch (err: any) {
    return NextResponse.json(
      {
        jsonrpc: "2.0",
        id: null,
        error: { code: -32700, message: err?.message || "Invalid JSON-RPC payload" }
      },
      { status: 400, headers: { "Access-Control-Allow-Origin": "*" } }
    );
  }
}
