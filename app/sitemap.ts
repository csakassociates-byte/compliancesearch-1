import type { MetadataRoute } from "next";

export default function sitemap(): MetadataRoute.Sitemap {
  const base = "https://compliancesearch.in";
  const now = new Date();

  return [
    { url: base,                              lastModified: now, changeFrequency: "weekly",  priority: 1.0 },
    { url: `${base}/check`,                   lastModified: now, changeFrequency: "weekly",  priority: 0.9 },
    { url: `${base}/check/advanced`,          lastModified: now, changeFrequency: "monthly", priority: 0.8 },
    { url: `${base}/calendar`,                lastModified: now, changeFrequency: "weekly",  priority: 0.8 },
    { url: `${base}/gst-due-dates`,            lastModified: now, changeFrequency: "monthly", priority: 0.9 },
    { url: `${base}/income-tax-due-dates`,     lastModified: now, changeFrequency: "monthly", priority: 0.9 },
    { url: `${base}/roc-filing-due-dates`,     lastModified: now, changeFrequency: "monthly", priority: 0.9 },
    { url: `${base}/companies-act-compliance`, lastModified: now, changeFrequency: "monthly", priority: 0.8 },
    { url: `${base}/tools/penalty-calculator`,   lastModified: now, changeFrequency: "monthly", priority: 0.8 },
    { url: `${base}/tools/business-valuation`,   lastModified: now, changeFrequency: "monthly", priority: 0.9 },
    { url: `${base}/notice`,                   lastModified: now, changeFrequency: "daily",   priority: 0.9 },
    { url: `${base}/blog`,                    lastModified: now, changeFrequency: "daily",   priority: 0.8 },
    { url: `${base}/blog/submit`,             lastModified: now, changeFrequency: "monthly", priority: 0.5 },
    { url: `${base}/about`,                   lastModified: now, changeFrequency: "monthly", priority: 0.7 },
    { url: `${base}/contact`,                 lastModified: now, changeFrequency: "monthly", priority: 0.5 },
  ];
}
