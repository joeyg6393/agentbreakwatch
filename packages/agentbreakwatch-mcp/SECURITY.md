# Security Policy

## Supported Versions

| Version | Supported |
| ------- | --------- |
| 1.2.x   | Yes       |
| < 1.2.0 | No        |

## Security Model

`agentbreakwatch-mcp` is a read-only Model Context Protocol (MCP) server that audits `.mcp.json`, `package.json`, and `requirements.txt` manifests against the live AgentBreakWatch telemetry index (`https://agentbreakwatch.com`).

- All tools (`check_stack_drift`, `get_package_stability`, `list_volatile_packages`, `get_archived_mcp_replacements`) are strictly read-only (`readOnlyHint: true`, `destructiveHint: false`).
- No credentials, API keys, or local filesystem writes are required or performed.

## Reporting a Vulnerability

To report a security issue, open an issue at https://github.com/joeyg6393/agentbreakwatch-mcp/issues or visit https://agentbreakwatch.com.
