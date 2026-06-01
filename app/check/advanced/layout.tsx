import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Advanced Compliance Analysis — CSR, FEMA, SEBI, DPDP & More",
  description:
    "Get a 360° advanced compliance analysis for your business — CSR Section 135, FEMA/FDI, Transfer Pricing, SEBI LODR, DPDP Act, RERA, FCRA, ECB reporting and more. India's most comprehensive compliance checker.",
  keywords: [
    "CSR compliance applicability india", "FEMA compliance india",
    "transfer pricing applicability", "SEBI LODR compliance",
    "DPDP act compliance india", "advanced compliance check india",
    "CSR section 135 applicability", "FDI compliance india",
    "RERA compliance india", "360 compliance checker india",
  ],
  openGraph: {
    title: "Advanced Compliance Analysis — CSR, FEMA, SEBI, DPDP | ComplianceSearch.in",
    description: "Complete 360° compliance check covering CSR, FEMA/FDI, Transfer Pricing, SEBI, DPDP Act and 30+ advanced rules.",
    url: "https://compliancesearch.in/check/advanced",
  },
  alternates: { canonical: "https://compliancesearch.in/check/advanced" },
};

export default function AdvancedLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
