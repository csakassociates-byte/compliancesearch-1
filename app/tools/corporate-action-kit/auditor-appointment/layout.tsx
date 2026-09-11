import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Auditor Appointment Kit — ADT-1, Board Resolution, Consent Letter | ComplianceSearch.in",
  description:
    "Generate the complete Auditor Appointment package — SS-1 Board Notice, Board Resolution (Section 139), Auditor Consent and Eligibility Certificate, and ADT-1 ROC filing guide. Free, Companies Act 2013 compliant.",
  keywords: [
    // ── Primary ──
    "auditor appointment documents india free",
    "how to appoint auditor private limited company india",
    "auditor appointment companies act 2013 section 139",
    "auditor appointment procedure india",
    "auditor appointment package CS tool free",

    // ── Specific forms ──
    "ADT-1 form auditor appointment ROC filing",
    "ADT-1 due date 15 days AGM",
    "auditor consent letter format companies act",
    "auditor eligibility certificate format india",
    "board resolution auditor appointment section 139",

    // ── Meeting ──
    "SS-1 board notice auditor appointment",
    "AGM resolution auditor appointment india",
    "first auditor appointment board resolution section 139(6)",

    // ── Long-tail ──
    "reappointment of auditor companies act",
    "statutory auditor appointment private limited india",
    "auditor appointment within 30 days incorporation",
    "casual vacancy auditor appointment companies act",
    "auditor rotation rules companies act 2013",
    "ADT-1 filing penalty late fee",
    "auditor appointment ROC compliance india",
    "section 141 auditor eligibility india",
  ],
  alternates: { canonical: "https://compliancesearch.in/tools/corporate-action-kit/auditor-appointment" },
  openGraph: {
    title: "Auditor Appointment Kit — ADT-1, Board Resolution & Consent Letter | ComplianceSearch.in",
    description:
      "Complete Auditor Appointment document package: SS-1 Board Notice, Board Resolution (Section 139), Auditor Consent, Eligibility Certificate, ADT-1 filing guide. Free.",
    url: "https://compliancesearch.in/tools/corporate-action-kit/auditor-appointment",
    type: "website",
    siteName: "ComplianceSearch.in",
  },
  twitter: {
    card: "summary_large_image",
    title: "Auditor Appointment Kit — ADT-1, Section 139 | ComplianceSearch.in",
    description: "Board Notice, Resolution, Auditor Consent, Eligibility Certificate, ADT-1 guide. All documents, free.",
  },
};

export default function AuditorAppointmentLayout({ children }: { children: React.ReactNode }) {
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
                "name": "Auditor Appointment Kit",
                "applicationCategory": "BusinessApplication",
                "operatingSystem": "Web Browser",
                "url": "https://compliancesearch.in/tools/corporate-action-kit/auditor-appointment",
                "description":
                  "Free auditor appointment document generator for Indian private limited companies. Generates SS-1 compliant board notice, board resolution under Section 139, auditor consent letter, eligibility certificate, and ADT-1 ROC filing guide.",
                "offers": { "@type": "Offer", "price": "0", "priceCurrency": "INR" },
                "featureList": [
                  "SS-1 compliant board/AGM meeting notice",
                  "Board Resolution — Section 139 Companies Act 2013",
                  "Auditor Written Consent Letter",
                  "Auditor Eligibility Certificate (Section 141)",
                  "ADT-1 ROC filing guide (15 days from AGM / 30 days from Board appointment)",
                ],
                "creator": { "@type": "Organization", "name": "ComplianceSearch.in", "url": "https://compliancesearch.in" },
              },
              {
                "@type": "BreadcrumbList",
                "itemListElement": [
                  { "@type": "ListItem", "position": 1, "name": "Home", "item": "https://compliancesearch.in" },
                  { "@type": "ListItem", "position": 2, "name": "Corporate Action Kit", "item": "https://compliancesearch.in/tools/corporate-action-kit" },
                  { "@type": "ListItem", "position": 3, "name": "Auditor Appointment", "item": "https://compliancesearch.in/tools/corporate-action-kit/auditor-appointment" },
                ],
              },
              {
                "@type": "FAQPage",
                "mainEntity": [
                  {
                    "@type": "Question",
                    "name": "What documents are required for auditor appointment in a private limited company?",
                    "acceptedAnswer": {
                      "@type": "Answer",
                      "text": "For appointing an auditor under Section 139 of the Companies Act 2013, you need: (1) Board/AGM Meeting Notice, (2) Board Resolution or Shareholders' Resolution approving the appointment, (3) Written Consent from the auditor confirming acceptance, (4) Eligibility Certificate from the auditor confirming they are not disqualified under Section 141, and (5) ADT-1 form filed with ROC within 15 days of AGM (or 30 days if appointed by the Board in the first year).",
                    },
                  },
                  {
                    "@type": "Question",
                    "name": "When must ADT-1 be filed with ROC?",
                    "acceptedAnswer": {
                      "@type": "Answer",
                      "text": "ADT-1 must be filed within 15 days from the conclusion of the AGM in which the auditor was appointed or reappointed. For first auditors appointed by the Board under Section 139(6), ADT-1 must be filed within 30 days of the Board meeting. Delay attracts late filing fees of ₹100 per day.",
                    },
                  },
                  {
                    "@type": "Question",
                    "name": "How long can an auditor serve a private limited company?",
                    "acceptedAnswer": {
                      "@type": "Answer",
                      "text": "An individual auditor can serve a maximum of one 5-year term (not eligible for reappointment for 5 years thereafter). An audit firm can serve two consecutive 5-year terms (10 years total). These rotation rules under Section 139(2) apply to companies other than OPCs and small companies. OPCs and small companies may appoint an auditor for up to 5 consecutive years without mandatory rotation.",
                    },
                  },
                  {
                    "@type": "Question",
                    "name": "What is the eligibility certificate for auditor appointment?",
                    "acceptedAnswer": {
                      "@type": "Answer",
                      "text": "Under Section 141 of the Companies Act 2013, the proposed auditor must provide a written certificate confirming: (1) they are not disqualified under any provision of Section 141, (2) the appointment is within the limits prescribed under Section 141(3)(g) — not holding audit of more than 20 companies, and (3) they comply with peer review and independence requirements. ComplianceSearch.in generates this certificate automatically.",
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
