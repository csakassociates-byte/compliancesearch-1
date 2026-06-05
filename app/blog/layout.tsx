import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Compliance Blog India — GST, Labour Law, Tax Insights",
  description:
    "Expert articles on Indian business compliance — GST updates, labour law changes, tax tips, MCA filings, FEMA, and more. Written by CAs, CSs, and compliance professionals.",
  keywords: [
    "compliance blog india",
    "gst updates india",
    "labour law india",
    "tax compliance articles",
    "ca cs blog india",
    "business compliance tips",
    "statutory compliance guide india",
  ],
  alternates: { canonical: "https://compliancesearch.in/blog" },
  openGraph: {
    title: "Compliance Blog India — Expert Insights on GST, Labour Law & More",
    description: "Stay updated with compliance changes in India. Written by professionals.",
    url: "https://compliancesearch.in/blog",
  },
};

export default function BlogLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
