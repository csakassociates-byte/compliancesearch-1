import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Corporate Action Kit — Board Minutes, Director & Auditor Documents | ComplianceSearch.in",
  description:
    "Generate the complete document package for any corporate action — Director Appointment, Auditor Appointment, Board Minutes, AGM, EGM, Share Transfer, Bank Resolution, Annual Filing. Free. Companies Act 2013 compliant.",
  keywords: [
    // ── Corporate Action Kit — primary ──
    "corporate action kit india free",
    "corporate action documents generator india",
    "company secretarial documents india free",
    "CS tools india free online",
    "companies act 2013 document generator",
    "corporate compliance documents india",

    // ── Director ──
    "director appointment documents india free",
    "DIR-2 consent to act as director",
    "DIR-8 declaration director",
    "DIR-12 ROC filing guide",
    "board resolution director appointment",
    "director appointment package companies act",
    "section 161 director appointment resolution",
    "SS-1 board notice director appointment",

    // ── Auditor ──
    "auditor appointment documents india free",
    "ADT-1 filing guide",
    "section 139 auditor appointment",
    "board resolution auditor appointment",
    "auditor consent letter format india",
    "auditor appointment notice companies act",

    // ── Board Meeting Minutes ──
    "board meeting minutes generator free india",
    "SS-1 compliant board minutes india",
    "board meeting minutes format companies act 2013",
    "board resolution generator free india",
    "certified true copy board resolution",
    "board minutes private limited company",

    // ── AGM / EGM Minutes ──
    "AGM minutes generator free india",
    "annual general meeting minutes format india",
    "EGM minutes generator free india",
    "extraordinary general meeting minutes india",
    "SS-2 AGM minutes companies act 2013",
    "AGM resolutions format india",

    // ── Share Documents ──
    "share transfer deed SH-4 india free",
    "SH-4 form share transfer deed",
    "share certificate SH-1 format india free",
    "share certificate generator india",
    "board resolution share transfer approval",

    // ── Bank Resolution ──
    "bank account opening board resolution india",
    "bank resolution generator free india",
    "board resolution bank account signatory change",
    "board resolution CC OD limit india",
    "section 179 board resolution banking",

    // ── Annual Filing ──
    "annual filing attachments generator india",
    "AOC-4 attachment generator",
    "MGT-7 annual return attachments",
    "directors report format FY 2025-26",
    "audit report format companies act",

    // ── Long-tail ──
    "how to appoint director in private limited company india",
    "auditor appointment procedure companies act 2013",
    "board meeting procedure india companies act",
    "AGM procedure private limited company india",
    "company documents generator free india CA CS",
    "free company secretarial tools india",
  ],
  alternates: { canonical: "https://compliancesearch.in/tools/corporate-action-kit" },
  openGraph: {
    title: "Corporate Action Kit — Board Minutes, Director & Auditor Documents | ComplianceSearch.in",
    description:
      "One kit. Every document a CS needs — Director Appointment, Auditor Appointment, Board/AGM/EGM Minutes, Share Transfer, Bank Resolution, Annual Filing. Free, instant, Companies Act 2013 compliant.",
    url: "https://compliancesearch.in/tools/corporate-action-kit",
    type: "website",
    siteName: "ComplianceSearch.in",
  },
  twitter: {
    card: "summary_large_image",
    title: "Corporate Action Kit — 10 Live Tools | ComplianceSearch.in",
    description:
      "Director Appointment, Auditor, Board Minutes, AGM, EGM, Share Transfer, Bank Resolution — complete document packages, free.",
  },
};

export default function CorporateActionKitLayout({ children }: { children: React.ReactNode }) {
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
                "name": "Corporate Action Kit",
                "applicationCategory": "BusinessApplication",
                "operatingSystem": "Web Browser",
                "url": "https://compliancesearch.in/tools/corporate-action-kit",
                "description":
                  "Free corporate action document generator for Indian companies — covers Director Appointment, Auditor Appointment, Board Meeting Minutes (SS-1), AGM/EGM Minutes (SS-2), Share Transfer (SH-4), Share Certificate (SH-1), Bank Resolution, and Annual Filing attachments (AOC-4/MGT-7). All documents are Companies Act 2013 compliant.",
                "offers": { "@type": "Offer", "price": "0", "priceCurrency": "INR" },
                "featureList": [
                  "Director Appointment — Notice, Resolution, DIR-2, DIR-8, DIR-12 guide",
                  "Auditor Appointment — Notice, Resolution, ADT-1 guide, Consent",
                  "Board Meeting Minutes — SS-1 compliant",
                  "AGM Minutes — SS-2 compliant",
                  "EGM Minutes — SS-2 compliant",
                  "Committee Meeting Minutes",
                  "Share Transfer — SH-4 deed + Board Resolution",
                  "Share Certificate — SH-1 format",
                  "Bank Resolution — account opening, signatory, OD/CC",
                  "Annual Filing — AOC-4 / MGT-7 attachments",
                ],
                "creator": { "@type": "Organization", "name": "ComplianceSearch.in", "url": "https://compliancesearch.in" },
              },
              {
                "@type": "BreadcrumbList",
                "itemListElement": [
                  { "@type": "ListItem", "position": 1, "name": "Home", "item": "https://compliancesearch.in" },
                  { "@type": "ListItem", "position": 2, "name": "Corporate Action Kit", "item": "https://compliancesearch.in/tools/corporate-action-kit" },
                ],
              },
              {
                "@type": "FAQPage",
                "mainEntity": [
                  {
                    "@type": "Question",
                    "name": "What documents are needed for director appointment in a private limited company?",
                    "acceptedAnswer": {
                      "@type": "Answer",
                      "text": "For appointing a director under Section 161 of the Companies Act 2013, you need: (1) Board meeting notice (SS-1 compliant), (2) Board resolution approving appointment, (3) DIR-2 — Consent to Act as Director, (4) DIR-8 — Director's declaration (not disqualified), and (5) DIR-12 ROC filing within 30 days. ComplianceSearch.in generates all 5 documents in one step.",
                    },
                  },
                  {
                    "@type": "Question",
                    "name": "What documents are required for auditor appointment?",
                    "acceptedAnswer": {
                      "@type": "Answer",
                      "text": "For appointing an auditor under Section 139 of the Companies Act 2013, you need: (1) Board meeting notice, (2) Board resolution for appointment, (3) Auditor's written consent and eligibility certificate, and (4) ADT-1 ROC filing within 15 days of AGM (or 30 days if appointed by the Board). The Corporate Action Kit generates all documents with the correct timelines.",
                    },
                  },
                  {
                    "@type": "Question",
                    "name": "What is SS-1 compliance for board meetings?",
                    "acceptedAnswer": {
                      "@type": "Answer",
                      "text": "SS-1 is the Secretarial Standard for Board Meetings issued by the ICSI. It prescribes requirements for: notice (minimum 7 days before meeting), agenda, quorum, conducting the meeting, and maintaining minutes. Board Meeting Minutes generated by ComplianceSearch.in are fully SS-1 compliant.",
                    },
                  },
                  {
                    "@type": "Question",
                    "name": "What is the difference between AGM and EGM?",
                    "acceptedAnswer": {
                      "@type": "Answer",
                      "text": "AGM (Annual General Meeting) is held once a year within 6 months of financial year end (Section 96, Companies Act 2013). It covers statutory business: accounts adoption, dividend, director retirement/appointment, auditor appointment. EGM (Extraordinary General Meeting) can be called at any time for urgent or special business not covered in AGM, such as special resolutions, share capital changes, or major policy changes.",
                    },
                  },
                  {
                    "@type": "Question",
                    "name": "Is the Corporate Action Kit free to use?",
                    "acceptedAnswer": {
                      "@type": "Answer",
                      "text": "Yes, the Corporate Action Kit on ComplianceSearch.in is completely free. All 10 live tools — Director Appointment, Auditor Appointment, Board Minutes, AGM Minutes, EGM Minutes, Committee Meeting, Share Transfer, Share Certificate, Bank Resolution, and Annual Filing — can be used without login or payment.",
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
