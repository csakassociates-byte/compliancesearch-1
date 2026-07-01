import type { NextConfig } from "next";

const nextConfig: NextConfig & {
  outputFileTracingIncludes?: Record<string, string[]>;
} = {
  serverExternalPackages: ["@sparticuz/chromium", "puppeteer-core", "html-to-docx"],
  outputFileTracingIncludes: {
    "/api/generate-pdf": ["./node_modules/@sparticuz/chromium/**/*"],
  },
};

export default nextConfig;
