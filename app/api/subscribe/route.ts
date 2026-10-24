import { NextResponse } from "next/server";
import fs from "node:fs/promises";
import path from "node:path";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const email = typeof body?.email === "string" ? body.email.trim().toLowerCase() : "";
    const plan = typeof body?.plan === "string" ? body.plan.trim() : "free";
    const packages = Array.isArray(body?.packages)
      ? body.packages.map((p: unknown) => String(p).trim()).filter(Boolean)
      : [];
    const webhookUrl = typeof body?.webhookUrl === "string" ? body.webhookUrl.trim() : "";

    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return NextResponse.json(
        { ok: false, error: "Please enter a valid developer email address." },
        { status: 400 }
      );
    }

    const record = {
      id: `sub_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
      email,
      plan,
      packages: packages.length > 0 ? packages : ["openai", "@modelcontextprotocol/sdk", "ai"],
      webhookUrl: webhookUrl || null,
      createdAt: new Date().toISOString()
    };

    // Optional Resend API integration when RESEND_API_KEY is configured
    let resendSynced = false;
    const resendKey = process.env.RESEND_API_KEY;
    if (resendKey) {
      try {
        const res = await fetch("https://api.resend.com/contacts", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${resendKey}`,
            "Content-Type": "application/json"
          },
          body: JSON.stringify({
            email,
            unsubscribed: false,
            first_name: plan,
            last_name: record.packages.slice(0, 3).join(",")
          })
        });
        resendSynced = res.ok;
      } catch {
        resendSynced = false;
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
      resendSynced,
      message:
        plan === "free"
          ? `Alert watch active for ${email}. Watching ${record.packages.length} package(s) with weekly digest and breaking-change notifications.`
          : `Early-access spot reserved for ${email} on the ${plan.toUpperCase()} tier. Your watched stack (${record.packages.length} items) is active now.`
    });
  } catch (err: any) {
    return NextResponse.json(
      { ok: false, error: err?.message || "Subscription request failed" },
      { status: 500 }
    );
  }
}
