import path from "node:path";
import { fileURLToPath } from "node:url";
import type { NextConfig } from "next";

// Pin the workspace root to this project — a parent package-lock.json exists in the
// home directory, which would otherwise make Next infer the wrong root.
const root = path.dirname(fileURLToPath(import.meta.url));

const nextConfig: NextConfig = {
  reactStrictMode: true,
  turbopack: { root },
};

export default nextConfig;
