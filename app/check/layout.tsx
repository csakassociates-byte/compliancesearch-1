import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Start Your Business Compliance Check — Free & Instant",
  description:
    "Answer 5 quick questions and get a complete list of all applicable statutory compliance requirements for your business in India — GST, PF, ESIC, FSSAI, Factories Act, MCA and more. Free, instant results.",
  keywords: [
    "business compliance check india", "statutory compliance checklist india",
    "compliance requirements checker", "GST compliance check", "labour law compliance checker",
    "FSSAI compliance check", "company compliance check india", "free compliance checker india",
    "annual compliance checklist pvt ltd", "compliance for new business india",
  ],
  openGraph: {
    title: "Check Your Business Compliance — Free & Instant | ComplianceSearch.in",
    description: "Get your complete compliance list in 2 minutes — 77+ rules, 11 categories, 100% India-specific.",
    url: "https://compliancesearch.in/check",
  },
  alternates: { canonical: "https://compliancesearch.in/check" },
};

export default function CheckLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
