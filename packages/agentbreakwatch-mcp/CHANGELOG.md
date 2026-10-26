# Changelog

## [1.2.0] - 2026-10-25

### Changed
- Migrated local stdio server (`index.mjs`) to `@modelcontextprotocol/sdk` (`Server` and `StdioServerTransport`) so `initialize`, `tools/list`, `resources/list`, and `prompts/list` resolve locally in-memory without network dependencies.
- Added MCP tool behavior annotations (`readOnlyHint`, `destructiveHint`, `idempotentHint`, `openWorldHint`, `title`) to all 4 tools.
- Updated `Dockerfile` with `npm ci --omit=dev`, `USER node`, and `io.modelcontextprotocol.server.name` label.
- Added `SECURITY.md` and `CHANGELOG.md`.

## [1.1.0] - 2026-10-25

### Changed
- Updated canonical endpoints and metadata to `https://agentbreakwatch.com` and `https://agentbreakwatch.com/api/mcp`.

## [1.0.0] - 2026-10-24

### Added
- Initial release of `agentbreakwatch-mcp` with `check_stack_drift`, `get_package_stability`, `list_volatile_packages`, and `get_archived_mcp_replacements`.
