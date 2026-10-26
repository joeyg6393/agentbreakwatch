#!/usr/bin/env node
import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
  CallToolRequestSchema,
  ListPromptsRequestSchema,
  ListResourcesRequestSchema,
  ListToolsRequestSchema
} from "@modelcontextprotocol/sdk/types.js";

const ENDPOINT = process.env.AGENTBREAKWATCH_MCP_URL || "https://agentbreakwatch.com/api/mcp";

const MCP_TOOLS = [
  {
    name: "check_stack_drift",
    description:
      "Read-only audit of a package.json, requirements.txt, or .mcp.json configuration string against 256 live AI Agent SDKs and MCP servers. Flags breaking major version deltas, unpinned @latest MCP servers, and outdated dependencies with exact pin commands. Requires no authentication and returns a structured JSON report.",
    annotations: {
      title: "Audit Stack Configuration for Breaking Drift",
      readOnlyHint: true,
      destructiveHint: false,
      idempotentHint: true,
      openWorldHint: false
    },
    inputSchema: {
      type: "object",
      required: ["manifest"],
      properties: {
        manifest: {
          type: "string",
          description: "Raw contents of .mcp.json, package.json, requirements.txt, or a newline-separated list of packages"
        }
      },
      additionalProperties: false
    }
  },
  {
    name: "get_package_stability",
    description:
      "Read-only lookup of live npm or PyPI version, publish timestamp, 90-day release velocity, stability score (0-100), MCP tools/list schema drift risk, and before/after migration code for a single AI Agent SDK or MCP server. Prefer this over check_stack_drift when inspecting one specific package by name or slug.",
    annotations: {
      title: "Get Single Package Stability and Migration Diff",
      readOnlyHint: true,
      destructiveHint: false,
      idempotentHint: true,
      openWorldHint: false
    },
    inputSchema: {
      type: "object",
      required: ["package"],
      properties: {
        package: {
          type: "string",
          description: "Package name or slug (e.g. 'openai', '@modelcontextprotocol/sdk', '@playwright/mcp', 'fastmcp', 'mcp-clickhouse')"
        }
      },
      additionalProperties: false
    }
  },
  {
    name: "list_volatile_packages",
    description:
      "Read-only query that lists the fastest-changing or highest schema-drift-risk AI Agent SDKs and MCP servers from the live AgentBreakWatch telemetry index, sorted descending by 90-day release velocity. Supports filtering by kind ('sdk', 'mcp', 'all'), category hub slug, and result limit (1-50).",
    annotations: {
      title: "List Most Volatile AI Agent SDKs and MCP Servers",
      readOnlyHint: true,
      destructiveHint: false,
      idempotentHint: true,
      openWorldHint: false
    },
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
      },
      additionalProperties: false
    }
  },
  {
    name: "get_archived_mcp_replacements",
    description:
      "Read-only lookup returning the complete migration matrix for archived or frozen @modelcontextprotocol/server-* reference packages and their official 2026 vendor-maintained replacements. Takes no parameters and requires no authentication.",
    annotations: {
      title: "Get Archived Reference MCP Replacement Matrix",
      readOnlyHint: true,
      destructiveHint: false,
      idempotentHint: true,
      openWorldHint: false
    },
    inputSchema: {
      type: "object",
      properties: {},
      additionalProperties: false
    }
  }
];

const ARCHIVED_REPLACEMENTS = [
  {
    legacyPackage: "@modelcontextprotocol/server-github",
    status: "Archived at v2025.4.8",
    replacement: "Remote https://api.githubcopilot.com/mcp/ or github-mcp-server",
    detailsUrl: "https://agentbreakwatch.com/p/mcp-server-github"
  },
  {
    legacyPackage: "@modelcontextprotocol/server-postgres",
    status: "Frozen at v0.6.2",
    replacement: "@supabase/mcp-server-supabase or @neondatabase/mcp-server-neon",
    detailsUrl: "https://agentbreakwatch.com/p/mcp-server-postgres"
  },
  {
    legacyPackage: "@modelcontextprotocol/server-puppeteer",
    status: "Archived at v2025.5.12",
    replacement: "@playwright/mcp or chrome-devtools-mcp",
    detailsUrl: "https://agentbreakwatch.com/p/mcp-server-puppeteer"
  },
  {
    legacyPackage: "@modelcontextprotocol/server-brave-search",
    status: "Frozen at v0.6.2",
    replacement: "@brave/brave-search-mcp-server",
    detailsUrl: "https://agentbreakwatch.com/p/mcp-server-brave-search"
  },
  {
    legacyPackage: "@modelcontextprotocol/server-redis",
    status: "Archived at v2025.4.25",
    replacement: "redis-mcp-server (PyPI) or @upstash/mcp-server (npm)",
    detailsUrl: "https://agentbreakwatch.com/p/mcp-server-redis"
  }
];

const server = new Server(
  {
    name: "agentbreakwatch-mcp",
    version: "1.2.0"
  },
  {
    capabilities: {
      tools: { listChanged: false },
      resources: {},
      prompts: {}
    },
    instructions:
      "AgentBreakWatch MCP Server audits AI Agent SDKs and MCP servers for breaking changes, release velocity, unpinned @latest configs, and schema drift across 256 npm and PyPI packages. Use check_stack_drift for manifest files, get_package_stability for one package, list_volatile_packages for leaderboards, and get_archived_mcp_replacements for deprecated reference servers."
  }
);

server.setRequestHandler(ListToolsRequestSchema, async () => ({
  tools: MCP_TOOLS
}));

server.setRequestHandler(ListResourcesRequestSchema, async () => ({
  resources: []
}));

server.setRequestHandler(ListPromptsRequestSchema, async () => ({
  prompts: []
}));

server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args = {} } = request.params;

  if (name === "get_archived_mcp_replacements") {
    return {
      content: [
        {
          type: "text",
          text: JSON.stringify(
            {
              reportUrl: "https://agentbreakwatch.com/drift-report",
              replacements: ARCHIVED_REPLACEMENTS
            },
            null,
            2
          )
        }
      ]
    };
  }

  try {
    const res = await fetch(ENDPOINT, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        jsonrpc: "2.0",
        id: 1,
        method: "tools/call",
        params: { name, arguments: args }
      })
    });
    if (res.ok) {
      const data = await res.json();
      if (data?.result) {
        return data.result;
      }
    }
  } catch {
    // Offline fallback below
  }

  return {
    content: [
      {
        type: "text",
        text: JSON.stringify(
          {
            source: "https://agentbreakwatch.com",
            tool: name,
            arguments: args,
            note: "Live telemetry query requires network access to https://agentbreakwatch.com/api/mcp",
            archivedReplacements: ARCHIVED_REPLACEMENTS
          },
          null,
          2
        )
      }
    ],
    isError: false
  };
});

const transport = new StdioServerTransport();
await server.connect(transport);
