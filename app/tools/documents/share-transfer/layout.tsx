import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Free Share Transfer Deed Generator India — Form SH-4 Companies Act 2013",
  description:
    "Generate share transfer deeds in Form SH-4 format for Indian private limited companies. Compliant with Section 56 of Companies Act 2013. Free, instant, with stamp duty guidance.",
  keywords: [
    "share transfer deed generator India",
    "Form SH-4 share transfer deed",
    "share transfer private limited company India",
    "Companies Act 2013 share transfer",
    "SH-4 format generator free",
    "transfer of shares Pvt Ltd",
    "share transfer agreement India",
    "stamp duty on share transfer India",
    "share transfer instrument format",
    "how to transfer shares private limited",
    "share transfer deed template India",
    "transferor transferee share deed",
    "share transfer form Companies Act",
    "offline share transfer procedure India",
    "Section 56 share transfer",
  ],
  alternates: {
    canonical: "https://compliancesearch.in/tools/documents/share-transfer",
  },
  openGraph: {
    title: "Free Share Transfer Deed Generator — Form SH-4 India",
    description:
      "Generate Form SH-4 share transfer deeds instantly. Compliant with Companies Act 2013 Section 56. Free tool for CAs & CSs.",
    url: "https://compliancesearch.in/tools/documents/share-transfer",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Free Share Transfer Deed Generator India",
    description: "Form SH-4 compliant share transfer deeds. Free, instant.",
  },
};

export default function ShareTransferLayout({ children }: { children: React.ReactNode }) {
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
                "name": "Share Transfer Deed Generator",
                "applicationCategory": "BusinessApplication",
                "operatingSystem": "Web Browser",
                "url": "https://compliancesearch.in/tools/documents/share-transfer",
                "description":
                  "Free online share transfer deed generator for Indian private limited companies. Creates Form SH-4 compliant instruments as required under Section 56 of Companies Act 2013.",
                "offers": { "@type": "Offer", "price": "0", "priceCurrency": "INR" },
                "creator": { "@type": "Organization", "name": "ComplianceSearch.in", "url": "https://compliancesearch.in" },
              },
              {
                "@type": "FAQPage",
                "mainEntity": [
                  {
                    "@type": "Question",
                    "name": "What is Form SH-4 for share transfer?",
                    "acceptedAnswer": {
                      "@type": "Answer",
                      "text": "Form SH-4 is the Securities Transfer Form prescribed under Rule 11(1) of Companies (Share Capital and Debentures) Rules, 2014. It is the instrument for transferring shares of a private limited company from one person to another. It must be duly stamped and signed by both transferor and transferee.",
                    },
                  },
                  {
                    "@type": "Question",
                    "name": "What is the stamp duty on share transfer in India?",
                    "acceptedAnswer": {
                      "@type": "Answer",
                      "text": "As per the Indian Stamp Act (amended 2020), stamp duty on share transfer is 0.015% of the consideration value or market value of shares, whichever is higher. The stamp must be affixed on Form SH-4 before execution. State-specific rates may apply for physical certificate transfer.",
                    },
                  },
                  {
                    "@type": "Question",
                    "name": "What documents are needed for share transfer in a private limited company?",
                    "acceptedAnswer": {
                      "@type": "Answer",
                      "text": "You need: Form SH-4 (duly stamped and signed), original share certificate(s), copy of PAN of transferee, board resolution approving the transfer (if Articles require it), and SH-7 form if the transfer results in change in shareholding pattern that needs ROC filing.",
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
