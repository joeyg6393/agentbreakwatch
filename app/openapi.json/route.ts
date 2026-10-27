import { NextResponse } from "next/server";
import { catalog } from "@/lib/catalog";

export async function GET() {
  const spec = {
    openapi: "3.1.0",
    info: {
      title: "AgentBreakWatch Live SDK & MCP Stability API",
      version: "1.1.0",
      description: `Query real-time npm and PyPI versions, 90-day release velocity, MCP tools/list schema drift risk, and copy-paste migration snippets across ${catalog.sdkCount} core AI Agent SDKs and ${catalog.mcpCount} Model Context Protocol servers (${catalog.totalTracked} total packages).`
    },
    servers: [
      {
        url: "https://agentbreakwatch.com",
        description: "Production AgentBreakWatch Server"
      }
    ],
    paths: {
      "/api/catalog.json": {
        get: {
          operationId: "getCatalog",
          summary: `Get the complete live index of ${catalog.totalTracked} AI Agent SDKs and MCP servers`,
          responses: {
            "200": {
              description: "Full JSON catalog of tracked SDKs and MCP servers"
            }
          }
        }
      },
      "/api/p/{slug}": {
        get: {
          operationId: "getPackageBySlug",
          summary: "Get live version, stability score, and migration diff for a single SDK or MCP server",
          parameters: [
            {
              name: "slug",
              in: "path",
              required: true,
              description: "Package slug (e.g., openai-node, mcp-sdk-ts, playwright-mcp) or package name",
              schema: { type: "string" }
            }
          ],
          responses: {
            "200": {
              description: "Detailed package telemetry and TL;DR verdict"
            },
            "404": {
              description: "Package not found"
            }
          }
        }
      },
      "/api/check": {
        post: {
          operationId: "auditAgentStack",
          summary: "Audit a package.json, requirements.txt, or .mcp.json manifest for breaking changes and unpinned MCP servers",
          requestBody: {
            required: true,
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  required: ["content"],
                  properties: {
                    content: {
                      type: "string",
                      description: "Raw text of .mcp.json, package.json, or requirements.txt"
                    }
                  }
                }
              }
            }
          },
          responses: {
            "200": {
              description: "Audit report listing breaking deltas, outdated packages, and exact pin commands"
            }
          }
        }
      }
    }
  };

  return NextResponse.json(spec, {
    headers: {
      "Cache-Control": "public, s-maxage=3600",
      "Access-Control-Allow-Origin": "*"
    }
  });
}
