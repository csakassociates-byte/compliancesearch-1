import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Free Share Certificate Generator India — Companies Act 2013 Form SH-1",
  description:
    "Generate share certificates in Form SH-1 format for Indian private limited companies. Compliant with Companies Act 2013 Section 56. Free, instant, print-ready with folio number, distinctive numbers, and consideration paid.",
  keywords: [
    "share certificate generator India free",
    "Form SH-1 share certificate",
    "share certificate private limited company",
    "Companies Act 2013 share certificate format",
    "share certificate format India",
    "generate share certificate online",
    "SH-1 format generator",
    "share certificate with stamp duty",
    "distinctive number share certificate",
    "folio number share certificate",
    "share certificate for new company",
    "share certificate after incorporation",
    "equity share certificate format",
    "share certificate template India",
    "Companies Act Section 56 share certificate",
  ],
  alternates: {
    canonical: "https://compliancesearch.in/tools/documents/share-certificate",
  },
  openGraph: {
    title: "Free Share Certificate Generator — Form SH-1 India",
    description:
      "Generate Form SH-1 share certificates for Indian private limited companies. Compliant with Companies Act 2013. Free and instant.",
    url: "https://compliancesearch.in/tools/documents/share-certificate",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Free Share Certificate Generator India",
    description: "Form SH-1 compliant share certificates. Free, instant, print-ready.",
  },
};

export default function ShareCertificateLayout({ children }: { children: React.ReactNode }) {
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
                "name": "Share Certificate Generator",
                "applicationCategory": "BusinessApplication",
                "operatingSystem": "Web Browser",
                "url": "https://compliancesearch.in/tools/documents/share-certificate",
                "description":
                  "Free online share certificate generator for Indian companies. Creates Form SH-1 compliant certificates with distinctive share numbers, folio numbers, and consideration details as required under Companies Act 2013.",
                "offers": { "@type": "Offer", "price": "0", "priceCurrency": "INR" },
                "creator": { "@type": "Organization", "name": "ComplianceSearch.in", "url": "https://compliancesearch.in" },
              },
              {
                "@type": "FAQPage",
                "mainEntity": [
                  {
                    "@type": "Question",
                    "name": "What is Form SH-1 for share certificates?",
                    "acceptedAnswer": {
                      "@type": "Answer",
                      "text": "Form SH-1 is the prescribed format for share certificates under Rule 5(2) of Companies (Share Capital and Debentures) Rules, 2014 read with Section 46 of Companies Act 2013. Every company must issue share certificates in this format to its shareholders.",
                    },
                  },
                  {
                    "@type": "Question",
                    "name": "Within how many days must a share certificate be issued?",
                    "acceptedAnswer": {
                      "@type": "Answer",
                      "text": "Under Section 56(4) of Companies Act 2013, share certificates must be issued within 2 months of incorporation (for subscribers) or within 2 months of allotment of shares. For transfer of shares, it must be issued within 1 month of receiving the transfer instrument.",
                    },
                  },
                  {
                    "@type": "Question",
                    "name": "What details are required to generate a share certificate?",
                    "acceptedAnswer": {
                      "@type": "Answer",
                      "text": "You need: company name and CIN, shareholder name and address, folio number, number of shares, distinctive share numbers (from - to), face value, consideration paid (amount or 'NIL' for bonus shares), date of issue, and authorised signatory details.",
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
