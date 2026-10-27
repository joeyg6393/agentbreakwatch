import type { Metadata } from "next";
import "./globals.css";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { StickyDigestBar } from "@/components/StickyDigestBar";
import { catalog } from "@/lib/catalog";

export const metadata: Metadata = {
  metadataBase: new URL("https://agentbreakwatch.com"),
  alternates: {
    canonical: "https://agentbreakwatch.com"
  },
  title: {
    default: "AgentBreakWatch | AI Agent SDK & MCP Breaking-Change Alerts",
    template: "%s | AgentBreakWatch"
  },
  description: `Real-time breaking-change alerts, MCP tools/list schema drift monitoring, and copy-paste migration snippets across ${catalog.sdkCount} core AI Agent SDKs and ${catalog.mcpCount} MCP servers.`,
  openGraph: {
    title: "AgentBreakWatch | AI Agent SDK & MCP Breaking-Change Alerts",
    description: `Audit your .mcp.json, package.json, or requirements.txt against ${catalog.totalTracked} live AI Agent SDKs and MCP servers.`,
    type: "website",
    url: "https://agentbreakwatch.com"
  },
  twitter: {
    card: "summary_large_image",
    title: "AgentBreakWatch | AI Agent SDK & MCP Breaking-Change Alerts",
    description: `Live breaking-change and MCP schema drift index across ${catalog.totalTracked} AI Agent SDKs and MCP servers.`
  }
};

export default function RootLayout({
  children
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark">
      <body className="min-h-screen flex flex-col bg-[#090a0f] text-zinc-100 antialiased">
        <Navbar />
        <main className="flex-1">{children}</main>
        <StickyDigestBar />
        <Footer />
      </body>
    </html>
  );
}
