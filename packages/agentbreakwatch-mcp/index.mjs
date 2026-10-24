#!/usr/bin/env node
import readline from "node:readline";

const ENDPOINT = process.env.AGENTBREAKWATCH_MCP_URL || "https://agentbreakwatch.vercel.app/api/mcp";

const rl = readline.createInterface({
  input: process.stdin,
  terminal: false
});

rl.on("line", async (line) => {
  const trimmed = line.trim();
  if (!trimmed) return;

  let msg;
  try {
    msg = JSON.parse(trimmed);
  } catch {
    return;
  }

  if (msg.method === "notifications/initialized") {
    return;
  }

  try {
    const res = await fetch(ENDPOINT, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(msg)
    });
    if (res.status === 204) return;
    const data = await res.json();
    process.stdout.write(JSON.stringify(data) + "\n");
  } catch (err) {
    if (msg.id !== undefined) {
      process.stdout.write(
        JSON.stringify({
          jsonrpc: "2.0",
          id: msg.id,
          error: {
            code: -32603,
            message: `AgentBreakWatch MCP proxy error: ${err?.message || "network error"}`
          }
        }) + "\n"
      );
    }
  }
});
