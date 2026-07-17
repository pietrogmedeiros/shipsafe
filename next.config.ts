import type { NextConfig } from "next";
import path from "node:path";
import { fileURLToPath } from "node:url";

const projectRoot = path.dirname(fileURLToPath(import.meta.url));

const nextConfig: NextConfig = {
  // Standalone output → small self-contained server bundle for the Docker
  // image we deploy to EasyPanel/Contabo.
  output: "standalone",
  // Pin the tracing/turbopack root to THIS project so a stray lockfile in a
  // parent directory doesn't get picked as the workspace root.
  outputFileTracingRoot: projectRoot,
  turbopack: { root: projectRoot },
};

export default nextConfig;
