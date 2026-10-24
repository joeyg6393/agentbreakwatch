import { NextResponse } from "next/server";
import { auditStackInput } from "@/lib/catalog";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const configText = typeof body?.configText === "string" ? body.configText : "";
    const result = auditStackInput(configText);
    return NextResponse.json({ ok: true, ...result });
  } catch (err: any) {
    return NextResponse.json(
      { ok: false, error: err?.message || "Invalid request payload" },
      { status: 400 }
    );
  }
}
