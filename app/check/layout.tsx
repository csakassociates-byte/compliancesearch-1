import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Free Business Compliance Checker India — Statutory Requirements for Your Company",
  description:
    "Find all applicable statutory compliance requirements for your business. Answer 5 questions — get GST, PF, ESIC, FSSAI, Factories Act, MCA, and 77+ rules covering 11 categories. 100% India-specific. Free and instant.",
  keywords: [
    "business compliance check India free",
    "statutory compliance checklist India 2025",
    "compliance requirements for private limited company",
    "GST compliance requirements India",
    "PF ESIC compliance check",
    "FSSAI compliance food business India",
    "Factories Act compliance check",
    "MCA annual compliance checklist",
    "labour law compliance India",
    "company compliance requirements India",
    "annual compliance private limited company",
    "startup compliance requirements India",
    "mandatory compliance new business India",
    "compliance calendar India 2025-26",
    "statutory obligations Indian company",
    "income tax compliance business India",
    "MSME compliance checklist India",
    "shop and establishment compliance India",
    "environmental compliance India business",
    "HR labour compliance India",
  ],
  alternates: {
    canonical: "https://compliancesearch.in/check",
  },
  openGraph: {
    title: "Free Business Compliance Checker India — Get Your Full Statutory Checklist",
    description:
      "Answer 5 questions, get all applicable compliance requirements. GST, PF, ESIC, FSSAI, Factories Act, MCA and more. Free, instant, 100% India-specific.",
    url: "https://compliancesearch.in/check",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Free Business Compliance Checker India",
    description: "77+ rules, 11 categories. Get your full compliance list in 2 minutes. Free.",
  },
};

export default function CheckLayout({ children }: { children: React.ReactNode }) {
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
                "name": "Business Compliance Checker",
                "applicationCategory": "BusinessApplication",
                "operatingSystem": "Web Browser",
                "url": "https://compliancesearch.in/check",
                "description":
                  "Free business compliance checker for Indian companies. Answer 5 questions about your business and get a comprehensive list of all applicable statutory compliance requirements — covering GST, Income Tax, MCA/ROC, PF, ESIC, FSSAI, Factories Act, labour laws and more.",
                "offers": { "@type": "Offer", "price": "0", "priceCurrency": "INR" },
                "featureList": [
                  "77+ statutory compliance rules",
                  "11 compliance categories",
                  "GST registration and filing requirements",
                  "Income Tax compliance",
                  "MCA/ROC annual filing requirements",
                  "PF and ESIC applicability",
                  "FSSAI food licence requirements",
                  "Factories Act applicability",
                  "Shop and Establishment Act compliance",
                  "Labour law compliance",
                  "MSME registration benefits",
                  "Environmental compliance",
                  "Instant personalised results",
                  "India-specific compliance rules",
                ],
                "creator": { "@type": "Organization", "name": "ComplianceSearch.in", "url": "https://compliancesearch.in" },
              },
              {
                "@type": "FAQPage",
                "mainEntity": [
                  {
                    "@type": "Question",
                    "name": "What statutory compliance is required for a private limited company in India?",
                    "acceptedAnswer": {
                      "@type": "Answer",
                      "text": "A private limited company must comply with: MCA annual filings (AOC-4, MGT-7), board and AGM meetings per Companies Act 2013, GST filing if turnover exceeds threshold, Income Tax returns, TDS deductions and returns, Director KYC (DIR-3), PF/ESIC if headcount exceeds threshold, and Shops & Establishment Act registration. ComplianceSearch.in checks all of these based on your company profile.",
                    },
                  },
                  {
                    "@type": "Question",
                    "name": "Is GST registration mandatory for all businesses?",
                    "acceptedAnswer": {
                      "@type": "Answer",
                      "text": "GST registration is mandatory if your aggregate annual turnover exceeds ₹40 lakhs (goods) or ₹20 lakhs (services) in most states. It is also mandatory for inter-state supply regardless of turnover, e-commerce operators, and certain notified categories. This tool checks your turnover and business type to confirm applicability.",
                    },
                  },
                  {
                    "@type": "Question",
                    "name": "When does PF registration become mandatory?",
                    "acceptedAnswer": {
                      "@type": "Answer",
                      "text": "Under the Employees' Provident Funds and Miscellaneous Provisions Act 1952, PF registration is mandatory for establishments with 20 or more employees. Once registered, coverage continues even if headcount drops below 20. Contribution is 12% of basic salary from both employee and employer.",
                    },
                  },
                  {
                    "@type": "Question",
                    "name": "How is this compliance checker different from general guides?",
                    "acceptedAnswer": {
                      "@type": "Answer",
                      "text": "Unlike general articles, ComplianceSearch.in personalises results based on your company type (Pvt Ltd, OPC, LLP, proprietorship), industry, employee count, turnover, and business activities. You get only the compliance that actually applies to you — not a generic 50-item checklist.",
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
