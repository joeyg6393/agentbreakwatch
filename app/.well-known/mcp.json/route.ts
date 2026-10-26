import { NextResponse } from "next/server";
import { catalog } from "@/lib/catalog";

const CARD = {
  $schema: "https://static.modelcontextprotocol.io/schemas/2025-12-11/server.schema.json",
  name: "io.github.joeyg6393/agentbreakwatch-mcp",
  title: "AgentBreakWatch",
  description: "Audit AI Agent SDKs and MCP servers for breaking changes, schema drift, and migration fixes.",
  version: "1.2.0",
  websiteUrl: "https://agentbreakwatch.com",
  repository: {
    url: "https://github.com/joeyg6393/agentbreakwatch-mcp",
    source: "github"
  },
  remotes: [
    {
      type: "streamable-http",
      url: "https://agentbreakwatch.com/api/mcp"
    }
  ],
  serverInfo: {
    name: "agentbreakwatch-mcp",
    version: "1.2.0",
    homepage: "https://agentbreakwatch.com",
    description: `Official AgentBreakWatch MCP server tracking ${catalog.sdkCount} AI Agent SDKs and ${catalog.mcpCount} MCP servers.`
  },
  tools: [
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
  ]
};

export async function GET() {
  return NextResponse.json(CARD, {
    headers: {
      "Cache-Control": "public, s-maxage=3600",
      "Access-Control-Allow-Origin": "*"
    }
  });
}
