import type { MetadataRoute } from "next";

export default function sitemap(): MetadataRoute.Sitemap {
  const base = "https://compliancesearch.in";
  const now = new Date();

  return [
    // Core pages
    { url: base,                              lastModified: now, changeFrequency: "weekly",  priority: 1.0 },
    { url: `${base}/check`,                   lastModified: now, changeFrequency: "weekly",  priority: 0.9 },
    { url: `${base}/check/advanced`,          lastModified: now, changeFrequency: "monthly", priority: 0.8 },
    { url: `${base}/calendar`,                lastModified: now, changeFrequency: "weekly",  priority: 0.8 },

    // Due date pages
    { url: `${base}/gst-due-dates`,           lastModified: now, changeFrequency: "monthly", priority: 0.9 },
    { url: `${base}/income-tax-due-dates`,    lastModified: now, changeFrequency: "monthly", priority: 0.9 },
    { url: `${base}/roc-filing-due-dates`,    lastModified: now, changeFrequency: "monthly", priority: 0.9 },
    { url: `${base}/companies-act-compliance`, lastModified: now, changeFrequency: "monthly", priority: 0.8 },

    // SEO landing pages — highest priority for ranking
    { url: `${base}/aoc-4-mgt-7-annual-filing-attachments`, lastModified: now, changeFrequency: "weekly",  priority: 1.0 },
    { url: `${base}/board-resolution-generator`,            lastModified: now, changeFrequency: "monthly", priority: 0.9 },
    { url: `${base}/business-valuation-india`,             lastModified: now, changeFrequency: "monthly", priority: 0.9 },
    { url: `${base}/compliance-checker-india`,             lastModified: now, changeFrequency: "monthly", priority: 0.9 },

    // Tools hub
    { url: `${base}/tools`,                                lastModified: now, changeFrequency: "monthly", priority: 0.9 },

    // Individual tool pages
    { url: `${base}/tools/documents/annual-filing`,        lastModified: now, changeFrequency: "weekly",  priority: 0.9 },
    { url: `${base}/tools/documents/board-resolution`,     lastModified: now, changeFrequency: "monthly", priority: 0.8 },
    { url: `${base}/tools/documents/bank-resolution`,      lastModified: now, changeFrequency: "monthly", priority: 0.8 },
    { url: `${base}/tools/documents/share-certificate`,    lastModified: now, changeFrequency: "monthly", priority: 0.8 },
    { url: `${base}/tools/documents/share-transfer`,       lastModified: now, changeFrequency: "monthly", priority: 0.8 },
    { url: `${base}/tools/documents/minutes`,              lastModified: now, changeFrequency: "monthly", priority: 0.8 },
    { url: `${base}/tools/documents/minutes/agm`,          lastModified: now, changeFrequency: "monthly", priority: 0.9 },
    { url: `${base}/tools/documents/minutes/board`,        lastModified: now, changeFrequency: "monthly", priority: 0.9 },
    { url: `${base}/tools/penalty-calculator`,             lastModified: now, changeFrequency: "monthly", priority: 0.8 },
    { url: `${base}/tools/business-valuation`,             lastModified: now, changeFrequency: "monthly", priority: 0.9 },

    // Info pages
    { url: `${base}/notice`,                  lastModified: now, changeFrequency: "daily",   priority: 0.9 },
    { url: `${base}/blog`,                    lastModified: now, changeFrequency: "daily",   priority: 0.8 },
    { url: `${base}/blog/submit`,             lastModified: now, changeFrequency: "monthly", priority: 0.5 },
    { url: `${base}/about`,                   lastModified: now, changeFrequency: "monthly", priority: 0.7 },
    { url: `${base}/contact`,                 lastModified: now, changeFrequency: "monthly", priority: 0.5 },
  ];
}
