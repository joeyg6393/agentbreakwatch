import { ImageResponse } from "next/og";
import { catalog } from "@/lib/catalog";

export const alt = "AgentBreakWatch | AI Agent SDK & MCP Breaking-Change Alerts";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function OpenGraphImage() {
  const highRiskCount = catalog.items.filter((i) => i.schemaDriftRisk === "high").length;

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
          fontFamily: "monospace",
          border: "2px solid #27272a"
        }}
      >
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
            <div
              style={{
                width: "48px",
                height: "48px",
                borderRadius: "10px",
                backgroundColor: "rgba(16, 185, 129, 0.15)",
                border: "2px solid #10b981",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: "28px",
                fontWeight: 800,
                color: "#34d399"
              }}
            >
              Δ
            </div>
            <div style={{ display: "flex", fontSize: "28px", fontWeight: 800, color: "#ffffff" }}>
              AgentBreakWatch
            </div>
          </div>

          <div
            style={{
              display: "flex",
              padding: "8px 18px",
              borderRadius: "9999px",
              backgroundColor: "rgba(16, 185, 129, 0.12)",
              border: "1px solid rgba(16, 185, 129, 0.4)",
              color: "#6ee7b7",
              fontSize: "18px",
              fontWeight: 700
            }}
          >
            LIVE NPM & PyPI REGISTRY TELEMETRY
          </div>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: "18px", maxWidth: "1000px" }}>
          <div
            style={{
              display: "flex",
              fontSize: "52px",
              fontWeight: 900,
              lineHeight: 1.15,
              color: "#ffffff"
            }}
          >
            Catch Breaking SDK Releases & MCP Schema Drift Before Your Agents Fail
          </div>
          <div style={{ display: "flex", fontSize: "24px", color: "#a1a1aa", lineHeight: 1.4 }}>
            Audit .mcp.json, package.json, and requirements.txt with copy-paste migration diffs.
          </div>
        </div>

        <div style={{ display: "flex", gap: "24px" }}>
          <div
            style={{
              flex: 1,
              display: "flex",
              flexDirection: "column",
              backgroundColor: "#12141d",
              border: "1px solid #27272a",
              borderRadius: "14px",
              padding: "20px 24px"
            }}
          >
            <div style={{ display: "flex", fontSize: "38px", fontWeight: 800, color: "#ffffff" }}>
              {`${catalog.totalTracked}`}
            </div>
            <div style={{ display: "flex", fontSize: "15px", color: "#a1a1aa" }}>TRACKED AI PACKAGES</div>
          </div>

          <div
            style={{
              flex: 1,
              display: "flex",
              flexDirection: "column",
              backgroundColor: "#12141d",
              border: "1px solid #27272a",
              borderRadius: "14px",
              padding: "20px 24px"
            }}
          >
            <div style={{ display: "flex", fontSize: "38px", fontWeight: 800, color: "#34d399" }}>
              {`${catalog.sdkCount}`}
            </div>
            <div style={{ display: "flex", fontSize: "15px", color: "#a1a1aa" }}>CORE AGENT SDKS</div>
          </div>

          <div
            style={{
              flex: 1,
              display: "flex",
              flexDirection: "column",
              backgroundColor: "#12141d",
              border: "1px solid #27272a",
              borderRadius: "14px",
              padding: "20px 24px"
            }}
          >
            <div style={{ display: "flex", fontSize: "38px", fontWeight: 800, color: "#fbbf24" }}>
              {`${catalog.mcpCount}`}
            </div>
            <div style={{ display: "flex", fontSize: "15px", color: "#a1a1aa" }}>MCP SERVERS</div>
          </div>

          <div
            style={{
              flex: 1,
              display: "flex",
              flexDirection: "column",
              backgroundColor: "#12141d",
              border: "1px solid #27272a",
              borderRadius: "14px",
              padding: "20px 24px"
            }}
          >
            <div style={{ display: "flex", fontSize: "38px", fontWeight: 800, color: "#fb7185" }}>
              {`${highRiskCount}`}
            </div>
            <div style={{ display: "flex", fontSize: "15px", color: "#a1a1aa" }}>HIGH DRIFT RISK</div>
          </div>
        </div>
      </div>
    ),
    size
  );
}
