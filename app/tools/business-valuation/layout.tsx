import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Free Business Valuation Calculator India — DCF, NAV & Earnings Method",
  description:
    "Calculate fair value of your Indian company using DCF (Discounted Cash Flow), Net Asset Value (NAV), and Earnings Capitalisation methods. Free business valuation tool for share transfer, FEMA, and M&A purposes.",
  keywords: [
    "business valuation calculator India free",
    "DCF valuation India",
    "net asset value NAV method India",
    "company valuation online India",
    "fair value shares India",
    "business valuation for share transfer India",
    "FEMA valuation India",
    "company valuation private limited India",
    "discounted cash flow calculator India",
    "earnings capitalisation method India",
    "startup valuation India free",
    "valuation for FDI India",
    "share valuation for transfer tax",
    "business valuation for M&A India",
    "free company valuation tool CA",
    "Rule 11UA valuation India",
    "unlisted company valuation India",
    "EBITDA multiple valuation India",
    "BSE industry multiples valuation",
    "startup valuation DCF India",
  ],
  alternates: {
    canonical: "https://compliancesearch.in/tools/business-valuation",
  },
  openGraph: {
    title: "Free Business Valuation Calculator India — DCF, NAV & Earnings Method",
    description:
      "Calculate your company's fair value using DCF, NAV, and Earnings methods. Free for CAs, investors, and businesses.",
    url: "https://compliancesearch.in/tools/business-valuation",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Free Business Valuation Calculator India",
    description: "DCF, NAV, and Earnings methods. Free business valuation tool.",
  },
};

export default function BusinessValuationLayout({ children }: { children: React.ReactNode }) {
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
                "name": "Business Valuation Calculator",
                "applicationCategory": "FinanceApplication",
                "operatingSystem": "Web Browser",
                "url": "https://compliancesearch.in/tools/business-valuation",
                "description":
                  "Free business valuation tool for Indian companies using DCF, EBITDA multiples, Revenue multiples, P/E, NAV and Berkus methods. India-specific BSE industry multiples, WACC and Risk-Free Rate. Get instant valuation report.",
                "offers": { "@type": "Offer", "price": "0", "priceCurrency": "INR" },
                "featureList": [
                  "DCF (Discounted Cash Flow) method",
                  "Net Asset Value (NAV/Book Value) method",
                  "EBITDA multiple valuation",
                  "Revenue multiple valuation",
                  "P/E ratio method",
                  "Berkus method (startups)",
                  "Rule 11UA compliant",
                  "BSE industry multiples",
                  "India-specific WACC calculator",
                  "Valuation summary report",
                ],
                "creator": { "@type": "Organization", "name": "ComplianceSearch.in", "url": "https://compliancesearch.in" },
              },
              {
                "@type": "FAQPage",
                "mainEntity": [
                  {
                    "@type": "Question",
                    "name": "Which valuation method is used for share transfer in India?",
                    "acceptedAnswer": {
                      "@type": "Answer",
                      "text": "For income tax purposes (Section 56(2)(x)), the fair market value of shares is determined using the Net Asset Value (NAV/book value) method as per Rule 11UA. For FEMA compliance on FDI, a SEBI-registered merchant banker or CA uses the DCF method. This tool provides both methods.",
                    },
                  },
                  {
                    "@type": "Question",
                    "name": "What is the DCF (Discounted Cash Flow) method?",
                    "acceptedAnswer": {
                      "@type": "Answer",
                      "text": "DCF values a business by discounting its projected future cash flows to present value using an appropriate discount rate (WACC). It is the preferred method for FEMA valuations and FDI transactions in India. Input your projected FCFs, terminal growth rate, and WACC to get the intrinsic value.",
                    },
                  },
                  {
                    "@type": "Question",
                    "name": "What is Rule 11UA valuation in India?",
                    "acceptedAnswer": {
                      "@type": "Answer",
                      "text": "Rule 11UA of Income Tax Rules prescribes the method for valuation of unquoted equity shares. The fair market value is calculated as: (A + B + C + D - L) × PV / PE, where A is book value of assets, L is liabilities, PV is paid-up value of shares being valued, and PE is total paid-up equity share capital. ComplianceSearch.in automates this calculation.",
                    },
                  },
                  {
                    "@type": "Question",
                    "name": "When is business valuation required?",
                    "acceptedAnswer": {
                      "@type": "Answer",
                      "text": "Business valuation is required for: transfer of shares between residents (Section 56 income tax), FDI under FEMA pricing guidelines, M&A transactions, ESOPs, buyback of shares, court-ordered settlements, and fundraising/investment rounds.",
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
