import { ImageResponse } from "next/og";
import { getItemBySlug } from "@/lib/catalog";

export const alt = "Package Breaking Changes & MCP Schema Drift | AgentBreakWatch";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default async function PackageOpenGraphImage({
  params
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const item = getItemBySlug(slug);

  if (!item) {
    return new ImageResponse(
      (
        <div
          style={{
            width: "100%",
            height: "100%",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            backgroundColor: "#090a0f",
            color: "#ffffff",
            fontSize: "42px",
            fontFamily: "monospace"
          }}
        >
          AgentBreakWatch | Package Not Found
        </div>
      ),
      size
    );
  }

  const riskColor =
    item.schemaDriftRisk === "high"
      ? "#fb7185"
      : item.schemaDriftRisk === "medium"
      ? "#fbbf24"
      : "#34d399";

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          backgroundColor: "#090a0f",
          color: "#f4f4f5",
          padding: "56px 64px",
          fontFamily: "monospace"
        }}
      >
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "14px" }}>
            <div
              style={{
                width: "42px",
                height: "42px",
                borderRadius: "8px",
                backgroundColor: "rgba(16, 185, 129, 0.15)",
                border: "2px solid #10b981",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: "24px",
                fontWeight: 800,
                color: "#34d399"
              }}
            >
              Δ
            </div>
            <div style={{ display: "flex", fontSize: "24px", fontWeight: 700, color: "#e4e4e7" }}>
              {`AgentBreakWatch • ${item.subcategory.toUpperCase()}`}
            </div>
          </div>

          <div
            style={{
              display: "flex",
              padding: "8px 18px",
              borderRadius: "8px",
              backgroundColor: "#18181b",
              border: `2px solid ${riskColor}`,
              color: riskColor,
              fontSize: "18px",
              fontWeight: 800
            }}
          >
            {`${item.schemaDriftRisk.toUpperCase()} SCHEMA DRIFT RISK`}
          </div>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
          <div style={{ display: "flex", fontSize: "52px", fontWeight: 900, color: "#ffffff" }}>
            {item.packageName}
          </div>
          <div style={{ display: "flex", fontSize: "24px", color: "#34d399", fontWeight: 700 }}>
            {`${item.displayName} by ${item.vendor} (${item.registry.toUpperCase()})`}
          </div>
          <div
            style={{
              display: "flex",
              fontSize: "22px",
              color: "#d4d4d8",
              lineHeight: 1.4,
              maxWidth: "1050px"
            }}
          >
            {item.breakingSummary.slice(0, 170)}
          </div>
        </div>

        <div style={{ display: "flex", gap: "20px" }}>
          <div
            style={{
              flex: 1,
              display: "flex",
              flexDirection: "column",
              backgroundColor: "#12141d",
              border: "1px solid #27272a",
              borderRadius: "12px",
              padding: "18px 22px"
            }}
          >
            <div style={{ display: "flex", fontSize: "14px", color: "#71717a" }}>LIVE VERSION</div>
            <div style={{ display: "flex", fontSize: "32px", fontWeight: 800, color: "#34d399" }}>
              {`v${item.latestVersion}`}
            </div>
          </div>

          <div
            style={{
              flex: 1,
              display: "flex",
              flexDirection: "column",
              backgroundColor: "#12141d",
              border: "1px solid #27272a",
              borderRadius: "12px",
              padding: "18px 22px"
            }}
          >
            <div style={{ display: "flex", fontSize: "14px", color: "#71717a" }}>STABILITY SCORE</div>
            <div style={{ display: "flex", fontSize: "32px", fontWeight: 800, color: "#ffffff" }}>
              {`${item.stabilityGrade} (${item.stabilityScore}/100)`}
            </div>
          </div>

          <div
            style={{
              flex: 1,
              display: "flex",
              flexDirection: "column",
              backgroundColor: "#12141d",
              border: "1px solid #27272a",
              borderRadius: "12px",
              padding: "18px 22px"
            }}
          >
            <div style={{ display: "flex", fontSize: "14px", color: "#71717a" }}>90-DAY RELEASES</div>
            <div style={{ display: "flex", fontSize: "32px", fontWeight: 800, color: "#fbbf24" }}>
              {`${item.releasesLast90d} releases`}
            </div>
          </div>
        </div>
      </div>
    ),
    size
  );
}
