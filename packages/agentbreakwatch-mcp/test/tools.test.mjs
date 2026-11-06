import { test, before, after } from "node:test";
import assert from "node:assert/strict";
import http from "node:http";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StdioClientTransport } from "@modelcontextprotocol/sdk/client/stdio.js";

const here = path.dirname(fileURLToPath(import.meta.url));
const serverEntry = path.resolve(here, "..", "index.mjs");

const FIXTURE_RESULTS = {
  check_stack_drift: (args) => ({
    manifestBytes: String(args.manifest ?? "").length,
    totalChecked: 1,
    findings: [
      {
        package: "openai",
        pinned: "^3.0.0",
        latest: "5.0.0",
        severity: "breaking",
        pinCommand: "npm install openai@5.0.0"
      }
    ]
  }),
  get_package_stability: (args) => ({
    package: args.package,
    ecosystem: "npm",
    latestVersion: "5.0.0",
    stabilityScore: 72,
    releaseVelocity90d: 9,
    schemaDriftRisk: "low"
  }),
  list_volatile_packages: (args) => ({
    kind: args.kind ?? "all",
    limit: args.limit ?? 15,
    packages: [
      { package: "@playwright/mcp", kind: "mcp", releaseVelocity90d: 20 },
      { package: "openai", kind: "sdk", releaseVelocity90d: 9 }
    ].slice(0, args.limit ?? 15)
  })
};

let fixture;
let baseUrl;
let client;
const seen = [];

function readBody(req) {
  return new Promise((resolve, reject) => {
    let data = "";
    req.on("data", (chunk) => (data += chunk));
    req.on("end", () => resolve(data));
    req.on("error", reject);
  });
}

before(async () => {
  fixture = http.createServer(async (req, res) => {
    if (req.method === "GET" && req.url === "/api/catalog.json") {
      res.writeHead(200, { "Content-Type": "application/json" });
      res.end(JSON.stringify({ totalTracked: 258, sdks: 32, mcpServers: 226 }));
      return;
    }
    if (req.method === "POST" && req.url === "/api/mcp") {
      const body = JSON.parse(await readBody(req));
      const { name, arguments: args = {} } = body.params ?? {};
      seen.push(name);
      const handler = body.method === "tools/call" ? FIXTURE_RESULTS[name] : undefined;
      res.writeHead(200, { "Content-Type": "application/json" });
      if (!handler) {
        res.end(
          JSON.stringify({
            jsonrpc: "2.0",
            id: body.id,
            error: { code: -32601, message: `Unknown tool: ${name}` }
          })
        );
        return;
      }
      res.end(
        JSON.stringify({
          jsonrpc: "2.0",
          id: body.id,
          result: { content: [{ type: "text", text: JSON.stringify(handler(args)) }] }
        })
      );
      return;
    }
    res.writeHead(404);
    res.end();
  });
  await new Promise((resolve) => fixture.listen(0, "127.0.0.1", resolve));
  baseUrl = `http://127.0.0.1:${fixture.address().port}`;

  const transport = new StdioClientTransport({
    command: process.execPath,
    args: [serverEntry],
    env: {
      ...process.env,
      AGENTBREAKWATCH_CATALOG_URL: `${baseUrl}/api/catalog.json`,
      AGENTBREAKWATCH_MCP_URL: `${baseUrl}/api/mcp`
    },
    stderr: "inherit"
  });
  client = new Client({ name: "agentbreakwatch-test", version: "0.0.0" });
  await client.connect(transport, { timeout: 5000 });
});

after(async () => {
  if (client) await client.close();
  if (fixture) {
    fixture.closeAllConnections?.();
    await new Promise((resolve) => fixture.close(resolve));
  }
});

function parseText(result) {
  assert.ok(Array.isArray(result.content), "content should be an array");
  const first = result.content[0];
  assert.equal(first.type, "text");
  return JSON.parse(first.text);
}

const opts = { timeout: 5000 };

test("listTools exposes all 4 tools", async () => {
  const { tools } = await client.listTools(undefined, opts);
  const names = tools.map((t) => t.name).sort();
  assert.deepEqual(names, [
    "check_stack_drift",
    "get_archived_mcp_replacements",
    "get_package_stability",
    "list_volatile_packages"
  ]);
  for (const tool of tools) {
    assert.equal(tool.annotations?.readOnlyHint, true, `${tool.name} should be read-only`);
  }
});

test("check_stack_drift proxies to the MCP endpoint", async () => {
  const manifest = JSON.stringify({ name: "demo", dependencies: { openai: "^3.0.0" } });
  const result = await client.callTool(
    { name: "check_stack_drift", arguments: { manifest } },
    undefined,
    opts
  );
  const data = parseText(result);
  assert.equal(data.manifestBytes, manifest.length);
  assert.ok(Array.isArray(data.findings));
  assert.equal(data.findings[0].package, "openai");
  assert.ok(seen.includes("check_stack_drift"));
});

test("get_package_stability returns stability for openai", async () => {
  const result = await client.callTool(
    { name: "get_package_stability", arguments: { package: "openai" } },
    undefined,
    opts
  );
  const data = parseText(result);
  assert.equal(data.package, "openai");
  assert.equal(typeof data.stabilityScore, "number");
  assert.ok("latestVersion" in data);
});

test("list_volatile_packages honors kind and limit", async () => {
  const result = await client.callTool(
    { name: "list_volatile_packages", arguments: { kind: "all", limit: 5 } },
    undefined,
    opts
  );
  const data = parseText(result);
  assert.equal(data.kind, "all");
  assert.equal(data.limit, 5);
  assert.ok(Array.isArray(data.packages));
  assert.ok(data.packages.length <= 5);
});

test("get_archived_mcp_replacements is served locally", async () => {
  const before = seen.length;
  const result = await client.callTool(
    { name: "get_archived_mcp_replacements", arguments: {} },
    undefined,
    opts
  );
  const data = parseText(result);
  assert.ok(Array.isArray(data.replacements));
  assert.ok(data.replacements.length > 0);
  for (const entry of data.replacements) {
    assert.equal(typeof entry.legacyPackage, "string");
    assert.equal(typeof entry.replacement, "string");
  }
  assert.ok(
    data.replacements.some((r) => r.legacyPackage === "@modelcontextprotocol/server-github")
  );
  assert.equal(seen.length, before, "archived lookup must not hit the network");
});
