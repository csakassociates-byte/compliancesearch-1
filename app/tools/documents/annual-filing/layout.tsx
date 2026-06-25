import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Free AOC-4 & MGT-7 Annual Filing Attachments Generator — FY 2025-26",
  description:
    "Generate all AOC-4 and MGT-7/MGT-7A annual filing attachments for FY 2025-26 in minutes. Board Report, Audit Report, Notes on Accounts, Director List — 9+ documents auto-generated. Free for CAs, CSs and companies.",
  keywords: [
    "AOC-4 attachment generator free",
    "MGT-7 attachments FY 2025-26",
    "MGT-7A abridged annual return",
    "annual filing attachments India",
    "board report generator FY 2025-26",
    "director report 2025-26 format",
    "annual filing tool for CA",
    "AOC-4 filing documents list",
    "notes on accounts generator",
    "audit report format private limited",
    "annual return attachments private limited",
    "Section 8 company board report",
    "OPC annual return generator",
    "free annual filing tool India",
    "ROC filing attachments free",
    "companies act annual return 2025-26",
    "MGT-7A small company annual return",
    "AOC-2 related party disclosure",
    "AOC-1 subsidiary disclosure",
    "cash flow statement format companies act",
  ],
  alternates: {
    canonical: "https://compliancesearch.in/tools/documents/annual-filing",
  },
  openGraph: {
    title: "Free AOC-4 & MGT-7 Annual Filing Attachments Generator — FY 2025-26",
    description:
      "Generate all annual filing attachments in minutes — Board Report, Audit Report, Notes on Accounts and 9+ more. Free tool for CAs & CSs.",
    url: "https://compliancesearch.in/tools/documents/annual-filing",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Free AOC-4 & MGT-7 Attachments Generator — FY 2025-26",
    description:
      "Generate all annual filing attachments in minutes. Free for CAs, CSs and companies.",
  },
};

export default function AnnualFilingLayout({ children }: { children: React.ReactNode }) {
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
                "name": "AOC-4 & MGT-7 Annual Filing Attachments Generator",
                "applicationCategory": "BusinessApplication",
                "operatingSystem": "Web Browser",
                "url": "https://compliancesearch.in/tools/documents/annual-filing",
                "description":
                  "Free tool to generate all AOC-4 and MGT-7/MGT-7A annual filing attachments for FY 2025-26. Covers Board Report, Audit Report, Notes on Accounts, Director List, Cash Flow Statement and 9+ more documents.",
                "offers": { "@type": "Offer", "price": "0", "priceCurrency": "INR" },
                "featureList": [
                  "AOC-4 attachment generation",
                  "MGT-7 and MGT-7A annual return",
                  "Board Report (full and abridged)",
                  "Audit Report with CARO compliance",
                  "Notes on Accounts",
                  "Cash Flow Statement",
                  "Director List with DIN",
                  "AOC-1 subsidiary disclosure",
                  "AOC-2 related party disclosure",
                  "FY 2025-26 ready",
                  "Save draft per company",
                  "Director signatures and company seal",
                ],
                "creator": {
                  "@type": "Organization",
                  "name": "ComplianceSearch.in",
                  "url": "https://compliancesearch.in",
                },
              },
              {
                "@type": "FAQPage",
                "mainEntity": [
                  {
                    "@type": "Question",
                    "name": "What documents are required as AOC-4 attachments?",
                    "acceptedAnswer": {
                      "@type": "Answer",
                      "text": "AOC-4 attachments include: Board Report (MGT-7A for small companies or full report), Auditor's Report, Annual Accounts (Balance Sheet, P&L, Notes on Accounts), Cash Flow Statement (for Section 8 and FPC companies), AOC-1 (subsidiary statement if applicable), and AOC-2 (related party disclosure if applicable). ComplianceSearch.in generates all these automatically.",
                    },
                  },
                  {
                    "@type": "Question",
                    "name": "What is the difference between MGT-7 and MGT-7A?",
                    "acceptedAnswer": {
                      "@type": "Answer",
                      "text": "MGT-7A is an abridged Annual Return for Small Companies and One Person Companies (OPCs). MGT-7 is the full Annual Return for other private limited companies. For FY 2025-26, companies with paid-up capital up to ₹2 crore and turnover up to ₹20 crore can file MGT-7A. This tool auto-detects your company type and generates the correct form.",
                    },
                  },
                  {
                    "@type": "Question",
                    "name": "What is the due date for AOC-4 filing for FY 2025-26?",
                    "acceptedAnswer": {
                      "@type": "Answer",
                      "text": "AOC-4 must be filed within 30 days of the Annual General Meeting (AGM). For FY 2025-26, AGM must be held by 30 September 2026, so AOC-4 due date is typically by 29 October 2026. MGT-7/7A must be filed within 60 days of AGM — by 29 November 2026.",
                    },
                  },
                  {
                    "@type": "Question",
                    "name": "How long does it take to generate annual filing attachments?",
                    "acceptedAnswer": {
                      "@type": "Answer",
                      "text": "With ComplianceSearch.in, it takes approximately 2 minutes per company. You fill in company details, financials, director information, and auditor details once — and all 9+ attachments are generated simultaneously. Manual preparation typically takes 1–2 hours.",
                    },
                  },
                  {
                    "@type": "Question",
                    "name": "Is this tool free for CAs and Company Secretaries?",
                    "acceptedAnswer": {
                      "@type": "Answer",
                      "text": "Yes, ComplianceSearch.in Annual Filing Attachments Generator is completely free. No subscription, no hidden charges. CAs and CSs can use it for unlimited companies. Save drafts and resume anytime.",
                    },
                  },
                  {
                    "@type": "Question",
                    "name": "Which company types are supported?",
                    "acceptedAnswer": {
                      "@type": "Answer",
                      "text": "The tool supports Private Limited Companies (Pvt Ltd), One Person Companies (OPC), Small Companies, Section 8 Companies (NGOs/NPOs), and Foreign Private Companies (FPC). It auto-routes to the correct form — MGT-7A for OPC and Small Companies, MGT-7 for others.",
                    },
                  },
                ],
              },
              {
                "@type": "BreadcrumbList",
                "itemListElement": [
                  { "@type": "ListItem", "position": 1, "name": "Home", "item": "https://compliancesearch.in" },
                  { "@type": "ListItem", "position": 2, "name": "Tools", "item": "https://compliancesearch.in/tools" },
                  { "@type": "ListItem", "position": 3, "name": "Annual Filing Generator", "item": "https://compliancesearch.in/tools/documents/annual-filing" },
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
