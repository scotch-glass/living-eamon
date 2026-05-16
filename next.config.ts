import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  devIndicators: false,
  // .venv contains a symlink to homebrew python OUTSIDE the project
  // root (.venv/bin/python3.14 -> /opt/homebrew/...). Turbopack
  // rejects out-of-root symlinks during its module-graph scan and
  // crashes the production build. Exclude .venv from file tracing so
  // Turbopack never traverses it. The runtime path is constructed in
  // lib/imageProcessing.ts via env var + dynamic resolve, so this
  // exclusion does not affect dev-mode rembg execution.
  outputFileTracingExcludes: {
    "*": [".venv/**"],
  },
};

export default nextConfig;
