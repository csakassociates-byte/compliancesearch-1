import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Free Meeting Minutes Generator — AGM & Board Meeting Minutes India",
  description:
    "Generate AGM and Board Meeting minutes for Indian companies. Compliant with Companies Act 2013 and Secretarial Standards SS-1 and SS-2. Free for CAs, CSs, and Company Secretaries.",
  keywords: [
    "AGM minutes generator free India",
    "board meeting minutes format Companies Act",
    "annual general meeting minutes template",
    "board minutes secretarial standards SS-1",
    "SS-2 AGM minutes format",
    "meeting minutes private limited company",
    "AGM minutes generator online",
    "board meeting minutes generator India",
    "company meeting minutes format",
    "secretarial standards minutes of meeting",
    "AGM minutes 2025-26 format",
    "board meeting CTC certified true copy",
    "minutes of meeting Companies Act 2013",
    "free minutes generator for CA CS",
    "meeting minutes with chairman signature",
  ],
  alternates: {
    canonical: "https://compliancesearch.in/tools/documents/minutes",
  },
  openGraph: {
    title: "Free AGM & Board Meeting Minutes Generator — Companies Act 2013",
    description:
      "Generate SS-1 and SS-2 compliant meeting minutes. AGM and Board Meeting formats. Free for CAs & CSs.",
    url: "https://compliancesearch.in/tools/documents/minutes",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Free Meeting Minutes Generator India",
    description: "AGM & Board Meeting minutes compliant with Secretarial Standards. Free.",
  },
};

export default function MinutesLayout({ children }: { children: React.ReactNode }) {
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
                "name": "Meeting Minutes Generator",
                "applicationCategory": "BusinessApplication",
                "operatingSystem": "Web Browser",
                "url": "https://compliancesearch.in/tools/documents/minutes",
                "description":
                  "Free online meeting minutes generator for Indian companies. Generates AGM and Board Meeting minutes compliant with Companies Act 2013 and Secretarial Standards SS-1 (Board) and SS-2 (General Meetings).",
                "offers": { "@type": "Offer", "price": "0", "priceCurrency": "INR" },
                "featureList": [
                  "AGM minutes (SS-2 compliant)",
                  "Board meeting minutes (SS-1 compliant)",
                  "Attendance roll with DIN",
                  "Agenda item tracking",
                  "Certified True Copy generation",
                  "Save and resume drafts",
                  "Director signature blocks",
                ],
                "creator": { "@type": "Organization", "name": "ComplianceSearch.in", "url": "https://compliancesearch.in" },
              },
              {
                "@type": "FAQPage",
                "mainEntity": [
                  {
                    "@type": "Question",
                    "name": "What are Secretarial Standards SS-1 and SS-2?",
                    "acceptedAnswer": {
                      "@type": "Answer",
                      "text": "SS-1 (Secretarial Standard on Meetings of the Board of Directors) and SS-2 (Secretarial Standard on General Meetings) are mandatory standards issued by ICSI under Section 118(10) of the Companies Act 2013. All companies must prepare minutes in compliance with these standards.",
                    },
                  },
                  {
                    "@type": "Question",
                    "name": "Within how many days must meeting minutes be prepared?",
                    "acceptedAnswer": {
                      "@type": "Answer",
                      "text": "Under Section 118 of Companies Act 2013 and SS-1/SS-2: Board meeting minutes must be entered within 30 days of the meeting. AGM minutes must be prepared within 30 days of the meeting. Minutes must be signed by the Chairman of that meeting or the Chairman of the next meeting.",
                    },
                  },
                  {
                    "@type": "Question",
                    "name": "What must be included in board meeting minutes?",
                    "acceptedAnswer": {
                      "@type": "Answer",
                      "text": "Board meeting minutes must include: date, time, and place of meeting; names of directors present; presence of quorum; leave of absence if any; resolutions passed (with voting details for listed companies); dissenting views; and Chairman's signature with date.",
                    },
                  },
                  {
                    "@type": "Question",
                    "name": "Can I generate Certified True Copies (CTC) of minutes?",
                    "acceptedAnswer": {
                      "@type": "Answer",
                      "text": "Yes. ComplianceSearch.in generates minutes with the CTC certification block — the statement certifying that the minutes are a true record of proceedings, signed by the Company Secretary or authorised director. Banks, ROC, and regulatory authorities accept this format.",
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
