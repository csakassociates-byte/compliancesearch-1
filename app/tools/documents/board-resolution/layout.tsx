import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Free Board Resolution Generator India — Companies Act 2013",
  description:
    "Generate board meeting resolutions for bank account opening, director appointment, share allotment, loan approval and more. Free, instant, professionally formatted as per Companies Act 2013.",
  keywords: [
    "board resolution generator India free",
    "board meeting resolution format",
    "resolution for bank account opening company",
    "director appointment resolution format",
    "share allotment board resolution",
    "loan approval board resolution",
    "auditor appointment resolution",
    "companies act board resolution 2013",
    "board resolution private limited company",
    "certified true copy board resolution",
    "resolution for authorised signatory",
    "board resolution for GST registration",
    "board resolution for PAN application",
    "online board resolution generator",
    "board resolution template India",
  ],
  alternates: {
    canonical: "https://compliancesearch.in/tools/documents/board-resolution",
  },
  openGraph: {
    title: "Free Board Resolution Generator — Companies Act 2013",
    description:
      "Instant board resolutions for bank account, director appointment, loan, and more. Free for CAs & CSs.",
    url: "https://compliancesearch.in/tools/documents/board-resolution",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Free Board Resolution Generator India",
    description: "Generate professionally formatted board resolutions instantly. Free tool.",
  },
};

export default function BoardResolutionLayout({ children }: { children: React.ReactNode }) {
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
                "name": "Board Resolution Generator",
                "applicationCategory": "BusinessApplication",
                "operatingSystem": "Web Browser",
                "url": "https://compliancesearch.in/tools/documents/board-resolution",
                "description":
                  "Free online tool to generate board meeting resolutions for Indian companies. Covers bank account opening, director appointment, share allotment, loan approval and more.",
                "offers": { "@type": "Offer", "price": "0", "priceCurrency": "INR" },
                "creator": { "@type": "Organization", "name": "ComplianceSearch.in", "url": "https://compliancesearch.in" },
              },
              {
                "@type": "FAQPage",
                "mainEntity": [
                  {
                    "@type": "Question",
                    "name": "What is a board resolution?",
                    "acceptedAnswer": {
                      "@type": "Answer",
                      "text": "A board resolution is a formal written document that records decisions made by the Board of Directors of a company. Under Companies Act 2013, certain actions such as bank account opening, director appointments, and loan approvals require a valid board resolution.",
                    },
                  },
                  {
                    "@type": "Question",
                    "name": "What resolutions can I generate with this tool?",
                    "acceptedAnswer": {
                      "@type": "Answer",
                      "text": "This tool generates board resolutions for: bank account opening (with authorised signatories), director appointment or resignation, auditor appointment, share allotment, loan/borrowing approval, authorised signatory designation, GST/PAN/trade licence applications, and registered office change.",
                    },
                  },
                  {
                    "@type": "Question",
                    "name": "Is a board resolution required for opening a company bank account?",
                    "acceptedAnswer": {
                      "@type": "Answer",
                      "text": "Yes. All banks in India require a certified copy of the Board Resolution authorising specific directors or officers to operate the account. This tool generates a bank-compliant resolution with authorised signatory details ready for submission.",
                    },
                  },
                  {
                    "@type": "Question",
                    "name": "How do I certify a board resolution as a true copy?",
                    "acceptedAnswer": {
                      "@type": "Answer",
                      "text": "A Certified True Copy (CTC) is signed by a director or Company Secretary with the statement 'Certified to be a True Copy of the Resolution passed at the Meeting of Board of Directors held on [date]'. The tool generates the full text including the CTC certification block.",
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
