import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Free MCA Penalty Calculator India — Companies Act 2013 Late Filing Fees",
  description:
    "Calculate MCA late filing penalties and additional fees for AOC-4, MGT-7, DIR-3 KYC, ADT-1 and other ROC filings. Instant calculation as per Companies Act 2013 rules. Free tool for CAs and companies.",
  keywords: [
    "MCA penalty calculator India",
    "ROC late filing fee calculator",
    "AOC-4 penalty calculation",
    "MGT-7 late fee calculator",
    "Companies Act 2013 penalty",
    "additional fee calculator MCA",
    "DIR-3 KYC penalty",
    "ADT-1 late filing fee",
    "MCA filing penalty 2025-26",
    "ROC penalty for delay",
    "Section 12 Companies Act penalty",
    "annual filing penalty private limited",
    "MGT-7A late fee",
    "late fee MCA V3 portal",
    "MCA additional fee calculation",
    "ROC compliance penalty India",
    "company annual filing penalty",
  ],
  alternates: {
    canonical: "https://compliancesearch.in/tools/penalty-calculator",
  },
  openGraph: {
    title: "Free MCA Penalty Calculator — Companies Act 2013 Late Filing Fees",
    description:
      "Calculate ROC late filing penalties for AOC-4, MGT-7, DIR-3 KYC and more. Instant, accurate, free.",
    url: "https://compliancesearch.in/tools/penalty-calculator",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Free MCA Penalty Calculator India",
    description: "Calculate ROC late filing fees for all MCA forms. Free tool.",
  },
};

export default function PenaltyCalculatorLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@graph": [
              {
                "@type": "SoftwareApplication",
                "name": "MCA Penalty Calculator",
                "applicationCategory": "BusinessApplication",
                "operatingSystem": "Web Browser",
                "url": "https://compliancesearch.in/tools/penalty-calculator",
                "description":
                  "Free MCA additional fee and penalty calculator for late filing of annual returns and forms under Companies Act 2013. Covers AOC-4, MGT-7/7A, DIR-3 KYC, ADT-1, and more.",
                "offers": { "@type": "Offer", "price": "0", "priceCurrency": "INR" },
                "creator": { "@type": "Organization", "name": "ComplianceSearch.in", "url": "https://compliancesearch.in" },
              },
              {
                "@type": "FAQPage",
                "mainEntity": [
                  {
                    "@type": "Question",
                    "name": "How is MCA late filing fee calculated?",
                    "acceptedAnswer": {
                      "@type": "Answer",
                      "text": "MCA additional fee is calculated on a per-day basis after the due date. The fee structure under the Companies (Registration Offices and Fees) Rules 2014 is: up to 30 days = 2x normal fee; 30-60 days = 4x; 60-90 days = 6x; 90-180 days = 10x; beyond 180 days = 12x normal fee. This calculator applies the correct slab automatically.",
                    },
                  },
                  {
                    "@type": "Question",
                    "name": "What is the penalty for late filing of AOC-4?",
                    "acceptedAnswer": {
                      "@type": "Answer",
                      "text": "AOC-4 normal filing fee depends on the authorised share capital. The additional fee for late filing is calculated as a multiple of the normal fee based on delay period. Beyond 270 days, Section 454 compounding proceedings may apply. The penalty can range from ₹1,200 to over ₹1 lakh for large delays.",
                    },
                  },
                  {
                    "@type": "Question",
                    "name": "What is the penalty for not filing DIR-3 KYC?",
                    "acceptedAnswer": {
                      "@type": "Answer",
                      "text": "Directors who fail to file DIR-3 KYC by the due date (31 August each year) face deactivation of DIN and a late fee of ₹5,000 to reactivate. This is a flat late fee, not a multiplied additional fee.",
                    },
                  },
                ],
              },
            ],
          }),
        }}
      />
      {children}
    </>
  );
}
