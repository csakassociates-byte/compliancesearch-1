import type { Metadata } from "next";
import ToolLockGuard from "@/components/ToolLockGuard";

export const metadata: Metadata = {
  title: "Director Appointment Kit — DIR-2, DIR-8, DIR-12, Board Resolution | ComplianceSearch.in",
  description:
    "Generate the complete Director Appointment package for a private limited company — SS-1 Board Notice, Board Resolution (Section 161), DIR-2 Consent, DIR-8 Declaration, and DIR-12 ROC filing guide. Free, Companies Act 2013 compliant.",
  keywords: [
    // ── Primary ──
    "director appointment documents india free",
    "how to appoint director private limited company india",
    "director appointment companies act 2013",
    "section 161 director appointment procedure",
    "director appointment package CS tool free",

    // ── Specific forms ──
    "DIR-2 consent to act as director format",
    "DIR-8 declaration not disqualified",
    "DIR-12 ROC filing director appointment",
    "DIR-12 due date 30 days appointment",
    "board resolution director appointment format india",

    // ── Meeting ──
    "SS-1 board notice director appointment",
    "board meeting notice 7 days format india",
    "board meeting agenda director appointment",

    // ── Long-tail ──
    "additional director appointment board resolution",
    "independent director appointment documents india",
    "nominee director appointment format india",
    "whole time director appointment companies act",
    "director appointment ROC filing procedure india",
    "director appointment resolution certified true copy",
    "first director appointment private limited india",
    "additional director section 161(1) companies act",
    "dir 12 filing after director appointment",
  ],
  alternates: { canonical: "https://compliancesearch.in/tools/corporate-action-kit/director-appointment" },
  openGraph: {
    title: "Director Appointment Kit — DIR-2, DIR-8, DIR-12 & Board Resolution | ComplianceSearch.in",
    description:
      "Complete Director Appointment document package: SS-1 Board Notice, Board Resolution, DIR-2 Consent, DIR-8 Declaration, DIR-12 ROC filing guide. Free, Section 161 compliant.",
    url: "https://compliancesearch.in/tools/corporate-action-kit/director-appointment",
    type: "website",
    siteName: "ComplianceSearch.in",
  },
  twitter: {
    card: "summary_large_image",
    title: "Director Appointment Kit — DIR-2, DIR-8, DIR-12 | ComplianceSearch.in",
    description: "Generate all Director Appointment documents — Board Notice, Resolution, DIR-2, DIR-8, DIR-12 guide. Free.",
  },
};

export default async function DirectorAppointmentLayout({ children }: { children: React.ReactNode }) {
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
                "name": "Director Appointment Kit",
                "applicationCategory": "BusinessApplication",
                "operatingSystem": "Web Browser",
                "url": "https://compliancesearch.in/tools/corporate-action-kit/director-appointment",
                "description":
                  "Free director appointment document generator for Indian private limited companies. Generates SS-1 compliant board notice, board resolution under Section 161, DIR-2 consent to act as director, DIR-8 not-disqualified declaration, and DIR-12 ROC filing guide.",
                "offers": { "@type": "Offer", "price": "0", "priceCurrency": "INR" },
                "featureList": [
                  "SS-1 compliant board meeting notice (7-day notice period)",
                  "Board resolution — Section 161 Companies Act 2013",
                  "DIR-2 — Consent to Act as Director",
                  "DIR-8 — Declaration of non-disqualification",
                  "DIR-12 ROC filing guide (30-day deadline)",
                ],
                "creator": { "@type": "Organization", "name": "ComplianceSearch.in", "url": "https://compliancesearch.in" },
              },
              {
                "@type": "BreadcrumbList",
                "itemListElement": [
                  { "@type": "ListItem", "position": 1, "name": "Home", "item": "https://compliancesearch.in" },
                  { "@type": "ListItem", "position": 2, "name": "Corporate Action Kit", "item": "https://compliancesearch.in/tools/corporate-action-kit" },
                  { "@type": "ListItem", "position": 3, "name": "Director Appointment", "item": "https://compliancesearch.in/tools/corporate-action-kit/director-appointment" },
                ],
              },
              {
                "@type": "FAQPage",
                "mainEntity": [
                  {
                    "@type": "Question",
                    "name": "What documents are needed to appoint a director in a private limited company?",
                    "acceptedAnswer": {
                      "@type": "Answer",
                      "text": "To appoint a director under Section 161 of the Companies Act 2013, you need: (1) Board Meeting Notice (SS-1 compliant, minimum 7 days before meeting), (2) Board Resolution approving the appointment, (3) DIR-2 — Written Consent to Act as Director (to be filed with the company), (4) DIR-8 — Declaration that the person is not disqualified, and (5) DIR-12 — Form to be filed with ROC within 30 days of appointment.",
                    },
                  },
                  {
                    "@type": "Question",
                    "name": "What is DIR-12 and when must it be filed?",
                    "acceptedAnswer": {
                      "@type": "Answer",
                      "text": "DIR-12 is the e-form used to notify the Registrar of Companies (ROC/MCA) about the appointment of a new director. It must be filed within 30 days of the date of appointment. Delay attracts late filing fees of ₹100 per day (uncapped). The company must attach the Board Resolution, DIR-2 consent, and digital signature of the authorised signatory.",
                    },
                  },
                  {
                    "@type": "Question",
                    "name": "What is the difference between Additional Director and Regular Director?",
                    "acceptedAnswer": {
                      "@type": "Answer",
                      "text": "An Additional Director is appointed by the Board under Section 161(1) and holds office only until the next AGM. At the AGM, shareholders must pass an ordinary resolution to regularise the appointment as a regular director. If not regularised, the Additional Director vacates office at the AGM. All the same documents — DIR-2, DIR-8, DIR-12 — apply for both.",
                    },
                  },
                  {
                    "@type": "Question",
                    "name": "What is DIR-2 consent to act as director?",
                    "acceptedAnswer": {
                      "@type": "Answer",
                      "text": "DIR-2 is a written consent given by the proposed director to the company, confirming their willingness to act as a director. It must be obtained before the appointment is made. The company must keep DIR-2 in its records. It is a statutory requirement under Rule 8 of the Companies (Appointment and Qualification of Directors) Rules 2014.",
                    },
                  },
                ],
              },
            ],
          }),
        }}
      />
      <ToolLockGuard toolName="Director Appointment Kit">{children}</ToolLockGuard>
    </>
  );
}
