# AgentBreakWatch MCP Server (`agentbreakwatch-mcp`)

Official Model Context Protocol (MCP) server for **[AgentBreakWatch](https://agentbreakwatch.vercel.app)** ([agentbreakwatch.com](https://agentbreakwatch.com)), the live breaking-change and `tools/list` JSON Schema drift telemetry index across **30 core AI Agent SDKs** and **226 MCP servers** (**256 total tracked packages**) on npm and PyPI.

- **Live Web App & Stack Auditor:** [https://agentbreakwatch.vercel.app](https://agentbreakwatch.vercel.app)
- **Interactive `.mcp.json` & `package.json` Checker:** [https://agentbreakwatch.vercel.app/check](https://agentbreakwatch.vercel.app/check)
- **October 2026 Volatility & Drift Report:** [https://agentbreakwatch.vercel.app/drift-report](https://agentbreakwatch.vercel.app/drift-report)
- **Remote Streamable HTTP MCP Endpoint:** `https://agentbreakwatch.vercel.app/api/mcp`
- **LLM Context Index (`/llms.txt`):** [https://agentbreakwatch.vercel.app/llms.txt](https://agentbreakwatch.vercel.app/llms.txt)
- **Full LLM Dump (`/llms-full.txt`):** [https://agentbreakwatch.vercel.app/llms-full.txt](https://agentbreakwatch.vercel.app/llms-full.txt)
- **OpenAPI 3.1 Spec (`/openapi.json`):** [https://agentbreakwatch.vercel.app/openapi.json](https://agentbreakwatch.vercel.app/openapi.json)

## Quick Connect (Zero-Install Remote MCP)

Add the hosted Streamable HTTP endpoint directly to your `.mcp.json`, Cursor, Claude Code, or Claude Desktop config with zero local dependencies:

```json
{
  "mcpServers": {
    "agentbreakwatch": {
      "url": "https://agentbreakwatch.vercel.app/api/mcp"
    }
  }
}
```

Or run locally via `npx` (stdio transport):

```json
{
  "mcpServers": {
    "agentbreakwatch": {
      "command": "npx",
      "args": ["-y", "agentbreakwatch-mcp"]
    }
  }
}
```

## Available MCP Tools

1. **`check_stack_drift`**: Pass the raw contents of a `.mcp.json`, `package.json`, or `requirements.txt` file to detect breaking major version jumps, unpinned `@latest` MCP servers, and archived packages, with exact version pin commands.
2. **`get_package_stability`**: Retrieve live npm/PyPI version, publish date, 90-day release velocity, 0-100 stability score, `tools/list` schema drift risk, and copy-paste before/after migration code for any of the 256 tracked packages.
3. **`list_volatile_packages`**: Query the fastest-changing Agent SDKs and MCP servers over the last 90 days, optionally filtered by `kind` (`sdk` or `mcp`) or ecosystem category.
4. **`get_archived_mcp_replacements`**: Retrieve the migration matrix for archived `@modelcontextprotocol/server-*` packages (`server-github`, `server-postgres`, `server-puppeteer`, `server-brave-search`, `server-redis`) and their official 2026 vendor-maintained replacements.

## Browse Ecosystem Stability Hubs

- [AI Agent SDKs & Frameworks](https://agentbreakwatch.vercel.app/c/agent-sdks)
- [Official Reference MCP Servers](https://agentbreakwatch.vercel.app/c/official-reference)
- [AWS Labs Official MCP Servers (`awslabs.*`)](https://agentbreakwatch.vercel.app/c/aws-labs)
- [Database, SQL & Vector DB MCP Servers](https://agentbreakwatch.vercel.app/c/database-backend)
- [Cloud, Kubernetes & Infrastructure MCP Servers](https://agentbreakwatch.vercel.app/c/cloud-infra)
- [Browser Automation, Playwright & DevTools MCP Servers](https://agentbreakwatch.vercel.app/c/browser-automation)
- [Search, Web Scraping & RAG Research MCP Servers](https://agentbreakwatch.vercel.app/c/search-data)
- [Observability, Sentry, Datadog & Metrics MCP Servers](https://agentbreakwatch.vercel.app/c/observability)
- [Productivity, Notion, Slack, Jira & Docs MCP Servers](https://agentbreakwatch.vercel.app/c/productivity-docs)
- [Design, Figma, Storybook & UI Component MCP Servers](https://agentbreakwatch.vercel.app/c/design-ui)
- [Payments, Stripe & FinTech MCP Servers](https://agentbreakwatch.vercel.app/c/payments)
- [MCP Bridges, Transports, Inspectors & Developer Tools](https://agentbreakwatch.vercel.app/c/mcp-bridges-devtools)

## License

MIT - [AgentBreakWatch](https://agentbreakwatch.vercel.app)
