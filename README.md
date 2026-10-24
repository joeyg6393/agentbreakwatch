# AgentBreakWatch

Automated breaking-change alerts, MCP `tools/list` schema drift tracking, and copy-paste migration snippets across 25 core AI Agent SDKs and 44 official and community Model Context Protocol (MCP) servers.

## Features
- **Live Registry Metadata**: Seeded and refreshed via `scripts/fetch-live-data.mjs` from live npm (`registry.npmjs.org`) and PyPI (`pypi.org/pypi/<pkg>/json`) endpoints.
- **Interactive Stack Auditor**: Paste `.mcp.json`, `package.json`, or `requirements.txt` on `/` or `/check` to flag breaking major deltas, archived reference servers, and unpinned `@latest` dependencies.
- **Programmatic SEO Pages**: 69 dedicated package pages at `/p/[slug]` with live version history, stability score, affected symbols, and before/after migration code diffs.
- **Machine & Chatbot Feeds**: `/llms.txt`, `/llms-full.txt`, `/api/catalog.json`, `/sitemap.xml`, and `/robots.txt`.
