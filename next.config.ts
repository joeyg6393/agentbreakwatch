import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  async redirects() {
    return [
      { source: "/packages/:slug", destination: "/p/:slug", permanent: true },
      { source: "/package/:slug", destination: "/p/:slug", permanent: true },
      { source: "/category/:slug", destination: "/c/:slug", permanent: true },
    ];
  },
};

export default nextConfig;
