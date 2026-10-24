import { NextResponse } from "next/server";
import { catalog } from "@/lib/catalog";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const kind = searchParams.get("kind");
  const risk = searchParams.get("risk");
  const q = searchParams.get("q")?.toLowerCase().trim();

  let items = catalog.items;
  if (kind === "sdk" || kind === "mcp") {
    items = items.filter((i) => i.kind === kind);
  }
  if (risk === "high" || risk === "medium" || risk === "low") {
    items = items.filter((i) => i.schemaDriftRisk === risk);
  }
  if (q) {
    items = items.filter(
      (i) =>
        i.packageName.toLowerCase().includes(q) ||
        i.displayName.toLowerCase().includes(q) ||
        i.vendor.toLowerCase().includes(q)
    );
  }

  return NextResponse.json(
    {
      service: "AgentBreakWatch",
      generatedAt: catalog.generatedAt,
      totalTracked: catalog.totalTracked,
      filteredCount: items.length,
      sdkCount: catalog.sdkCount,
      mcpCount: catalog.mcpCount,
      items
    },
    {
      headers: {
        "Cache-Control": "public, s-maxage=1800, stale-while-revalidate=3600"
      }
    }
  );
}
