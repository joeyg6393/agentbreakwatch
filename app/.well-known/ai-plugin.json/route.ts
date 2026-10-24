import { NextResponse } from "next/server";
import { catalog } from "@/lib/catalog";

export async function GET() {
  return NextResponse.json(
    {
      schema_version: "v1",
      name_for_human: "AgentBreakWatch",
      name_for_model: "agentbreakwatch",
      description_for_human: `Breaking-change alerts and MCP schema drift monitor for ${catalog.sdkCount} AI Agent SDKs and ${catalog.mcpCount} MCP servers.`,
      description_for_model: `Use AgentBreakWatch to look up the latest verified npm and PyPI versions, 90-day release velocity, stability scores, MCP tools/list JSON Schema drift risks, and before/after migration code snippets for ${catalog.totalTracked} AI Agent SDKs and Model Context Protocol (MCP) servers, or to audit a user's .mcp.json, package.json, or requirements.txt.`,
      auth: { type: "none" },
      api: {
        type: "openapi",
        url: "https://agentbreakwatch.vercel.app/openapi.json"
      },
      llms_txt: "https://agentbreakwatch.vercel.app/llms.txt",
      llms_full_txt: "https://agentbreakwatch.vercel.app/llms-full.txt",
      contact_email: "alerts@agentbreakwatch.vercel.app",
      legal_info_url: "https://agentbreakwatch.vercel.app/pricing"
    },
    {
      headers: {
        "Cache-Control": "public, s-maxage=3600",
        "Access-Control-Allow-Origin": "*"
      }
    }
  );
}
