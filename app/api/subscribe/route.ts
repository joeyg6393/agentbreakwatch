import { NextResponse } from "next/server";
import fs from "node:fs/promises";
import path from "node:path";
import { catalog, findItemByPackageName, getItemBySlug } from "@/lib/catalog";

const DEFAULT_AUDIENCE_ID =
  process.env.RESEND_AUDIENCE_ID || "7c35e901-057c-43ce-8028-3d2c64bc85d6";

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function buildWelcomeEmail(params: {
  email: string;
  plan: string;
  packages: string[];
  source: string;
  webhookUrl: string | null;
}) {
  const { email, plan, packages, webhookUrl } = params;

  const resolvedPackages = packages.map((pkgName) => {
    const matched = findItemByPackageName(pkgName) || getItemBySlug(pkgName);
    return {
      inputName: pkgName,
      matched
    };
  });

  const packageRowsHtml = resolvedPackages
    .slice(0, 15)
    .map(({ inputName, matched }) => {
      if (!matched) {
        return `<li style="margin-bottom:8px;color:#e4e4e7;font-family:monospace;font-size:13px;">
          <strong>${escapeHtml(inputName)}</strong> (queued for custom registry polling)
        </li>`;
      }
      const riskColor =
        matched.schemaDriftRisk === "high"
          ? "#fb7185"
          : matched.schemaDriftRisk === "medium"
          ? "#fbbf24"
          : "#34d399";
      return `<li style="margin-bottom:10px;color:#e4e4e7;font-family:monospace;font-size:13px;line-height:1.5;">
        <a href="https://agentbreakwatch.com/p/${encodeURIComponent(matched.slug)}" style="color:#34d399;text-decoration:underline;font-weight:bold;">${escapeHtml(matched.packageName)}</a>
        <span style="color:#a1a1aa;"> v${escapeHtml(matched.latestVersion)} (${escapeHtml(matched.registry.toUpperCase())})</span>
        <span style="color:${riskColor};font-weight:bold;"> [${escapeHtml(matched.schemaDriftRisk.toUpperCase())} DRIFT RISK]</span>
        <span style="color:#d4d4d8;"> | Stability ${escapeHtml(matched.stabilityGrade)} (${matched.stabilityScore}/100)</span>
        <br />
        <span style="color:#a1a1aa;font-size:12px;">Recommended pin: <code style="color:#6ee7b7;background:#18181b;padding:2px 5px;border-radius:4px;">${escapeHtml(matched.installCommand)}</code></span>
      </li>`;
    })
    .join("");

  const extraCount = resolvedPackages.length > 15 ? resolvedPackages.length - 15 : 0;

  const subject = `Active: AgentBreakWatch Alerts & Weekly Drift Digest (${packages.length} watched packages)`;

  const html = `<!DOCTYPE html>
<html>
  <body style="margin:0;padding:24px;background-color:#090a0f;color:#f4f4f5;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;">
    <div style="max-width:640px;margin:0 auto;background-color:#12131a;border:1px solid #27272a;border-radius:12px;padding:28px;">
      <div style="font-family:monospace;font-size:12px;color:#34d399;text-transform:uppercase;letter-spacing:0.08em;font-weight:bold;">
        AgentBreakWatch Telemetry &bull; Alert Subscription Confirmed
      </div>
      <h1 style="margin:12px 0 8px 0;font-size:22px;line-height:1.3;color:#ffffff;font-family:monospace;">
        Your AI Agent Stack Watch is Active
      </h1>
      <p style="margin:0 0 18px 0;font-size:14px;line-height:1.6;color:#d4d4d8;">
        We registered <strong>${escapeHtml(email)}</strong> on the <strong>${escapeHtml(plan.toUpperCase())}</strong> alert tier. You will receive the Weekly AI Agent SDK &amp; MCP Breaking-Change Digest plus migration diffs whenever your watched packages ship breaking updates or <code style="color:#34d399;">tools/list</code> schema changes across our live index of ${catalog.totalTracked} packages (${catalog.sdkCount} Agent SDKs and ${catalog.mcpCount} MCP servers).
      </p>

      <div style="background-color:#090a0f;border:1px solid #27272a;border-radius:8px;padding:16px;margin-bottom:20px;">
        <div style="font-family:monospace;font-size:12px;font-weight:bold;color:#ffffff;text-transform:uppercase;margin-bottom:10px;">
          Watched Stack Summary (${packages.length} ${packages.length === 1 ? "package" : "packages"})
        </div>
        <ul style="margin:0;padding-left:18px;">
          ${packageRowsHtml}
        </ul>
        ${
          extraCount > 0
            ? `<p style="margin:8px 0 0 0;font-family:monospace;font-size:12px;color:#a1a1aa;">+ ${extraCount} additional packages monitored on your stack.</p>`
            : ""
        }
        ${
          webhookUrl
            ? `<p style="margin:10px 0 0 0;font-family:monospace;font-size:12px;color:#34d399;">Webhook endpoint registered: ${escapeHtml(webhookUrl)}</p>`
            : ""
        }
      </div>

      <div style="background-color:#090a0f;border:1px solid #27272a;border-radius:8px;padding:16px;margin-bottom:20px;">
        <div style="font-family:monospace;font-size:12px;font-weight:bold;color:#fbbf24;text-transform:uppercase;margin-bottom:8px;">
          Run AgentBreakWatch Inside Cursor, Claude Code, or Windsurf (MCP)
        </div>
        <p style="margin:0 0 10px 0;font-size:13px;line-height:1.5;color:#d4d4d8;">
          Audit any <code style="color:#34d399;">.mcp.json</code>, <code style="color:#34d399;">package.json</code>, or <code style="color:#34d399;">requirements.txt</code> directly from your IDE agent via <code style="color:#34d399;">npx</code> or our zero-install Streamable HTTP MCP server:
        </p>
        <pre style="margin:0 0 8px 0;padding:10px;background:#18181b;border-radius:6px;color:#6ee7b7;font-family:monospace;font-size:12px;overflow-x:auto;">npx -y github:joeyg6393/agentbreakwatch-mcp</pre>
        
      </div>

      <div style="margin-bottom:22px;">
        <div style="font-family:monospace;font-size:12px;font-weight:bold;color:#ffffff;text-transform:uppercase;margin-bottom:10px;">
          Quick Links &amp; Live Benchmarks
        </div>
        <p style="margin:0 0 6px 0;font-size:13px;">
          &rarr; <a href="https://agentbreakwatch.com/check" style="color:#34d399;text-decoration:underline;font-weight:bold;">Interactive Stack &amp; .mcp.json Config Auditor</a>
        </p>
        <p style="margin:0 0 6px 0;font-size:13px;">
          &rarr; <a href="https://agentbreakwatch.com/drift-report" style="color:#fbbf24;text-decoration:underline;font-weight:bold;">October 2026 AI Agent Stack Volatility &amp; MCP Schema Drift Report</a>
        </p>
        <p style="margin:0;font-size:13px;">
          &rarr; <a href="https://agentbreakwatch.com/llms.txt" style="color:#a1a1aa;text-decoration:underline;">/llms.txt Machine-Readable Telemetry Index</a>
        </p>
      </div>

      <div style="background-color:#064e3b33;border:1px solid #10b98166;border-radius:8px;padding:16px;">
        <div style="font-family:monospace;font-size:12px;font-weight:bold;color:#34d399;text-transform:uppercase;margin-bottom:6px;">
          Need Real-Time 30-Minute Alerts &amp; Slack/Discord Webhooks?
        </div>
        <p style="margin:0 0 12px 0;font-size:13px;line-height:1.5;color:#d4d4d8;">
          Upgrade to <strong>Indie Pro ($9/mo)</strong> to monitor up to 25 packages with real-time 30-minute registry polling, instant <code style="color:#34d399;">tools/list</code> schema diff alerts, and Slack/Discord/HTTP webhook delivery.
        </p>
        <a href="https://agentbreakwatch.com/api/checkout?plan=indie" style="display:inline-block;background-color:#10b981;color:#090a0f;font-family:monospace;font-size:12px;font-weight:bold;text-decoration:none;padding:9px 16px;border-radius:6px;">
          Upgrade to Indie Pro ($9/mo) &rarr;
        </a>
      </div>

      <p style="margin:22px 0 0 0;font-size:11px;color:#71717a;font-family:monospace;">
        Sent by AgentBreakWatch (https://agentbreakwatch.com) &bull; Reply to this email anytime with questions or packages to add.
      </p>
    </div>
  </body>
</html>`;

  const textLines = [
    "AgentBreakWatch Alert Subscription Confirmed",
    "============================================",
    "",
    `Subscriber: ${email}`,
    `Plan: ${plan.toUpperCase()}`,
    `Watched Packages (${packages.length}):`,
    ...resolvedPackages.slice(0, 15).map(({ inputName, matched }) =>
      matched
        ? `- ${matched.packageName} v${matched.latestVersion} (${matched.registry.toUpperCase()}) | Drift Risk: ${matched.schemaDriftRisk.toUpperCase()} | Stability: ${matched.stabilityGrade} (${matched.stabilityScore}/100) | Pin: ${matched.installCommand}`
        : `- ${inputName} (queued for registry polling)`
    ),
    "",
    "Run AgentBreakWatch MCP Server:",
    "  npx -y github:joeyg6393/agentbreakwatch-mcp",
    "  Remote HTTP MCP: https://agentbreakwatch.com/api/mcp",
    "",
    "Quick Links:",
    "- Audit your .mcp.json / package.json: https://agentbreakwatch.com/check",
    "- October 2026 MCP Schema Drift Report: https://agentbreakwatch.com/drift-report",
    "- Upgrade to Indie Pro ($9/mo) for real-time webhook/Slack alerts: https://agentbreakwatch.com/api/checkout?plan=indie"
  ];

  return {
    subject,
    html,
    text: textLines.join("\n")
  };
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const email = typeof body?.email === "string" ? body.email.trim().toLowerCase() : "";
    const plan = typeof body?.plan === "string" ? body.plan.trim() : "free";
    const source = typeof body?.source === "string" ? body.source.trim() : "web";
    const rawPackages = Array.isArray(body?.packages)
      ? body.packages.map((p: unknown) => String(p).trim()).filter(Boolean)
      : typeof body?.packages === "string"
      ? body.packages
          .split(",")
          .map((p: string) => p.trim())
          .filter(Boolean)
      : [];
    const webhookUrl = typeof body?.webhookUrl === "string" ? body.webhookUrl.trim() : "";

    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return NextResponse.json(
        { ok: false, error: "Please enter a valid developer email address." },
        { status: 400 }
      );
    }

    const watchedPackages =
      rawPackages.length > 0
        ? Array.from(new Set<string>(rawPackages))
        : ["openai", "@modelcontextprotocol/sdk", "ai", "@playwright/mcp", "fastmcp"];

    const record = {
      id: `sub_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
      email,
      plan,
      source,
      packages: watchedPackages,
      webhookUrl: webhookUrl || null,
      createdAt: new Date().toISOString()
    };

    let resendSynced = false;
    let welcomeEmailSent = false;
    const resendKey = process.env.RESEND_API_KEY;
    const audienceId = DEFAULT_AUDIENCE_ID;

    if (resendKey) {
      const firstNameMeta = `${plan}:${source}`.slice(0, 60);
      const lastNameMeta = watchedPackages.slice(0, 5).join(",").slice(0, 120);

      // 1a) Add contact to the Resend Audience / Segment
      try {
        const audienceRes = await fetch(
          `https://api.resend.com/audiences/${audienceId}/contacts`,
          {
            method: "POST",
            headers: {
              Authorization: `Bearer ${resendKey}`,
              "Content-Type": "application/json"
            },
            body: JSON.stringify({
              email,
              unsubscribed: false,
              first_name: firstNameMeta,
              last_name: lastNameMeta
            })
          }
        );
        if (audienceRes.ok) {
          resendSynced = true;
        } else {
          // Fallback to /contacts endpoint with segments array
          const fallbackRes = await fetch("https://api.resend.com/contacts", {
            method: "POST",
            headers: {
              Authorization: `Bearer ${resendKey}`,
              "Content-Type": "application/json"
            },
            body: JSON.stringify({
              email,
              unsubscribed: false,
              first_name: firstNameMeta,
              last_name: lastNameMeta,
              segments: [{ id: audienceId }]
            })
          });
          resendSynced = fallbackRes.ok;
        }
      } catch {
        resendSynced = false;
      }

      // 1b) Send immediate welcome & verification email from alerts@agentbreakwatch.com
      try {
        const welcome = buildWelcomeEmail({
          email,
          plan,
          packages: watchedPackages,
          source,
          webhookUrl: record.webhookUrl
        });
        const emailRes = await fetch("https://api.resend.com/emails", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${resendKey}`,
            "Content-Type": "application/json"
          },
          body: JSON.stringify({
            from: "AgentBreakWatch Alerts <alerts@agentbreakwatch.com>",
            to: [email],
            reply_to: "alerts@agentbreakwatch.com",
            subject: welcome.subject,
            html: welcome.html,
            text: welcome.text
          })
        });
        welcomeEmailSent = emailRes.ok;
      } catch {
        welcomeEmailSent = false;
      }
    }

    // Also persist to /tmp/agentbreakwatch-subscriptions.json as serverless fallback
    try {
      const tmpFile = path.join("/tmp", "agentbreakwatch-subscriptions.json");
      let existing: any[] = [];
      try {
        const raw = await fs.readFile(tmpFile, "utf8");
        existing = JSON.parse(raw);
      } catch {
        existing = [];
      }
      existing.push(record);
      await fs.writeFile(tmpFile, JSON.stringify(existing, null, 2), "utf8");
    } catch {
      // ignore read-only fs errors
    }

    return NextResponse.json({
      ok: true,
      subscription: record,
      audienceId,
      resendSynced,
      welcomeEmailSent,
      message:
        plan === "free"
          ? `Alert watch active for ${email}. Monitoring ${record.packages.length} package(s) with the Weekly Breaking-Change & MCP Drift Digest. Confirmation sent from alerts@agentbreakwatch.com.`
          : `Stack watch active for ${email} on the ${plan.toUpperCase()} tier (${record.packages.length} packages). Confirmation & audit summary sent from alerts@agentbreakwatch.com.`
    });
  } catch (err: any) {
    return NextResponse.json(
      { ok: false, error: err?.message || "Subscription request failed" },
      { status: 500 }
    );
  }
}
