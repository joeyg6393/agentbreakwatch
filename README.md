# AgentBreakWatch (https://agentbreakwatch.com)

Automated breaking-change alerts, MCP `tools/list` schema drift tracking, and copy-paste migration snippets across **32 core AI Agent SDKs** and **226 official and community Model Context Protocol (MCP) servers** (**258 total tracked packages**).

- **Live Web App:** [https://agentbreakwatch.com](https://agentbreakwatch.com)
- **Interactive Stack Checker:** [https://agentbreakwatch.com/check](https://agentbreakwatch.com/check)
- **October 2026 Volatility & Drift Report:** [https://agentbreakwatch.com/drift-report](https://agentbreakwatch.com/drift-report)
- **Remote Streamable HTTP MCP Server:** `https://agentbreakwatch.com/api/mcp`
- **Standalone MCP Package Repo:** [https://github.com/joeyg6393/agentbreakwatch-mcp](https://github.com/joeyg6393/agentbreakwatch-mcp)

## Features
- **Live Registry Metadata**: Seeded and refreshed via `scripts/fetch-live-data.mjs` from live npm (`registry.npmjs.org`) and PyPI (`pypi.org/pypi/<pkg>/json`) endpoints.
- **Interactive Stack Auditor**: Paste `.mcp.json`, `package.json`, or `requirements.txt` on `/` or `/check` to flag breaking major deltas, archived reference servers, and unpinned `@latest` dependencies.
- **Programmatic SEO Pages**: 258 dedicated package pages at `/p/[slug]` and 12 ecosystem category hubs at `/c/[category]` with live version history, stability score, affected symbols, and before/after migration code diffs.
- **Machine & Chatbot Feeds**: `/llms.txt`, `/llms-full.txt`, `/openapi.json`, `/.well-known/ai-plugin.json`, `/api/mcp`, `/api/catalog.json`, `/sitemap.xml`, and `/robots.txt`.
