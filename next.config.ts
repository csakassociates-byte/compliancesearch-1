import type { NextConfig } from "next";

const nextConfig: NextConfig & {
  outputFileTracingIncludes?: Record<string, string[]>;
} = {
  serverExternalPackages: ["@sparticuz/chromium", "puppeteer-core", "html-to-docx", "pdf-parse", "pdfjs-dist"],
  outputFileTracingIncludes: {
    "/api/generate-pdf": ["./node_modules/@sparticuz/chromium/**/*"],
  },
};

export default nextConfig;
