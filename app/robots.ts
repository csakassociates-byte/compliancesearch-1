import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: ["/", "/check", "/check/advanced", "/about", "/contact"],
        disallow: ["/admin/", "/api/", "/report", "/results"],
      },
    ],
    sitemap: "https://compliancesearch.in/sitemap.xml",
    host: "https://compliancesearch.in",
  };
}
