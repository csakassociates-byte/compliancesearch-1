import type { Metadata } from "next";
import "./globals.css";
import SessionProviderWrapper from "@/components/SessionProviderWrapper";

const BASE_URL = "https://compliancesearch.in";

export const metadata: Metadata = {
  metadataBase: new URL(BASE_URL),
  title: {
    default: "Business Compliance Checker India — ComplianceSearch.in",
    template: "%s | ComplianceSearch.in",
  },
  description:
    "Find out which compliances apply to your business in India — GST, Income Tax, Labour Laws, FEMA, CSR, FSSAI and 70+ more. Free, instant, India-specific statutory compliance checker.",
  keywords: [
    // Primary
    "business compliance checker india",
    "compliance requirements for business in india",
    "know your compliance india",
    "company compliance list india",
    "business license requirements india",
    // Statutory / Generic
    "statutory compliance india",
    "statutory compliance checklist",
    "compliance checklist india",
    "annual compliance checklist",
    "compliance calendar 2024-25 india",
    "compliance for pvt ltd company",
    "compliance for startup india",
    "compliance requirements india",
    "what is statutory compliance",
    "compliance tracker india",
    "business registration compliance india",
    "company annual compliance india",
    "tax compliance india",
    "compliance",
    "compliance india",
    // Category-specific
    "GST compliance requirements india",
    "pvt ltd company compliance checklist",
    "startup compliance requirements india",
    "labour law applicability checker india",
    "FSSAI license requirement checker",
    "MCA ROC annual filing compliance",
    "CSR applicability check india",
    "FEMA compliance india",
    "DPDP act compliance india",
    "transfer pricing india",
    // Long-tail
    "what compliance does my business need india",
    "compliance checklist for new business in india",
    "which labour laws apply to my company",
    "free business compliance checker india",
    "compliance tool for CA firms india",
    "how to check company compliance requirements india",
  ],
  authors: [{ name: "ComplianceSearch.in", url: BASE_URL }],
  creator: "Gee Bharat — geebharat.com",
  publisher: "ComplianceSearch.in",
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-snippet": -1,
      "max-image-preview": "large",
      "max-video-preview": -1,
    },
  },
  openGraph: {
    type: "website",
    locale: "en_IN",
    url: BASE_URL,
    siteName: "ComplianceSearch.in",
    title: "Business Compliance Checker India — ComplianceSearch.in",
    description:
      "Find out which compliances apply to your business in India — GST, Income Tax, Labour Laws, FEMA, CSR, FSSAI and 70+ more. Free, instant results in 2 minutes.",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "ComplianceSearch.in — Business Compliance Checker India",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Business Compliance Checker India — ComplianceSearch.in",
    description:
      "Know which compliances apply to your business — GST, Labour Laws, FEMA, CSR, FSSAI and 70+ more. Free & instant.",
    images: ["/og-image.png"],
    creator: "@geebharat",
  },
  alternates: {
    canonical: BASE_URL,
  },
  category: "business",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="h-full">
      <head>
        <link rel="icon" href="/favicon.ico" sizes="any" />
        <link rel="apple-touch-icon" href="/apple-touch-icon.png" />
        <meta name="theme-color" content="#1d4ed8" />
        <meta name="geo.region" content="IN" />
        <meta name="geo.placename" content="India" />
        <meta name="language" content="English" />
        <meta name="revisit-after" content="7 days" />
        <meta name="rating" content="general" />
        <meta name="contact" content="csakassociates@gmail.com" />
      </head>
      <body className="min-h-full bg-white font-sans">
        {/* JSON-LD Structured Data — Google Rich Results */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@graph": [
                {
                  "@type": "WebSite",
                  "@id": "https://compliancesearch.in/#website",
                  "url": "https://compliancesearch.in",
                  "name": "ComplianceSearch.in",
                  "description": "India's free statutory business compliance checker — know which compliances apply to your business instantly.",
                  "publisher": { "@id": "https://compliancesearch.in/#organization" },
                  "potentialAction": {
                    "@type": "SearchAction",
                    "target": { "@type": "EntryPoint", "urlTemplate": "https://compliancesearch.in/check" },
                    "query-input": "Check compliance for my business",
                  },
                  "inLanguage": "en-IN",
                },
                {
                  "@type": "Organization",
                  "@id": "https://compliancesearch.in/#organization",
                  "name": "ComplianceSearch.in",
                  "url": "https://compliancesearch.in",
                  "logo": {
                    "@type": "ImageObject",
                    "url": "https://compliancesearch.in/og-image.png",
                    "width": 1200,
                    "height": 630,
                  },
                  "contactPoint": {
                    "@type": "ContactPoint",
                    "email": "csakassociates@gmail.com",
                    "contactType": "customer support",
                    "availableLanguage": ["English", "Hindi"],
                  },
                  "sameAs": ["https://geebharat.com"],
                  "description": "ComplianceSearch.in is powered by Gee Bharat — India's office management platform.",
                },
                {
                  "@type": "SoftwareApplication",
                  "name": "ComplianceSearch.in",
                  "applicationCategory": "BusinessApplication",
                  "operatingSystem": "Web Browser",
                  "url": "https://compliancesearch.in",
                  "description": "Free statutory compliance applicability checker for Indian businesses — covers 77+ rules across GST, Labour Laws, FEMA, CSR, MCA, FSSAI and more.",
                  "offers": { "@type": "Offer", "price": "0", "priceCurrency": "INR" },
                  "aggregateRating": {
                    "@type": "AggregateRating",
                    "ratingValue": "5",
                    "ratingCount": "1",
                    "bestRating": "5",
                  },
                  "featureList": [
                    "77+ compliance rules",
                    "11 categories",
                    "GST compliance check",
                    "Labour law applicability",
                    "FEMA compliance",
                    "CSR applicability",
                    "Free PDF report download",
                    "India-specific",
                  ],
                },
                {
                  "@type": "FAQPage",
                  "mainEntity": [
                    {
                      "@type": "Question",
                      "name": "Which compliances apply to my business in India?",
                      "acceptedAnswer": {
                        "@type": "Answer",
                        "text": "It depends on your business type, turnover, sector, and employee count. ComplianceSearch.in checks 77+ rules — including GST, Income Tax, PF/ESIC, FSSAI, Factories Act, FEMA, CSR and more — and tells you exactly which ones apply.",
                      },
                    },
                    {
                      "@type": "Question",
                      "name": "Is ComplianceSearch.in free to use?",
                      "acceptedAnswer": {
                        "@type": "Answer",
                        "text": "Yes, ComplianceSearch.in is completely free. Answer a few questions about your business and get an instant, categorized compliance report with PDF download.",
                      },
                    },
                    {
                      "@type": "Question",
                      "name": "What is statutory compliance in India?",
                      "acceptedAnswer": {
                        "@type": "Answer",
                        "text": "Statutory compliance refers to the legal obligations a business must fulfill under various Indian laws — such as GST registration, TDS filing, PF/ESIC registration, annual ROC filings, labour law registrations, and industry-specific licenses like FSSAI, Drug License, or Factory License.",
                      },
                    },
                    {
                      "@type": "Question",
                      "name": "What compliances does a Private Limited Company need in India?",
                      "acceptedAnswer": {
                        "@type": "Answer",
                        "text": "A Pvt Ltd company typically needs: GST registration, Income Tax (ITR-6), TDS, PF/ESIC, Annual ROC filings (AOC-4, MGT-7), DPT-3, Board meetings, Auditor appointment, and more depending on turnover and sector.",
                      },
                    },
                  ],
                },
              ],
            }),
          }}
        />
        <SessionProviderWrapper>{children}</SessionProviderWrapper>
      </body>
    </html>
  );
}
