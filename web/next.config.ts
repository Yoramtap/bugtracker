import type { NextConfig } from "next";

const isProd = process.env.NODE_ENV === "production";
const useStaticExport = process.env.STATIC_EXPORT === "1";
const basePath = isProd && useStaticExport ? "/codex-loop" : "";

const nextConfig: NextConfig = {
  output: useStaticExport ? "export" : undefined,
  trailingSlash: true,
  basePath,
  assetPrefix: basePath,
  images: {
    unoptimized: true,
  },
  env: {
    NEXT_PUBLIC_BASE_PATH: basePath,
  },
};

export default nextConfig;
