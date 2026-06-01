import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Your Business Compliance Results — ComplianceSearch.in",
  description:
    "Your personalized statutory compliance report — all applicable licenses, registrations, tax filings, and due dates for your business in India. Download PDF report.",
  keywords: [
    "business compliance report india", "compliance results india",
    "statutory compliance report", "compliance pdf download india",
    "applicable compliance list india",
  ],
  openGraph: {
    title: "Your Compliance Results — ComplianceSearch.in",
    description: "Your personalized compliance report with all applicable rules, due dates, penalties and document checklist.",
    url: "https://compliancesearch.in/results",
  },
  robots: { index: false, follow: false },
};

export default function ResultsLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
