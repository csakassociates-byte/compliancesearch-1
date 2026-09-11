import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import * as dotenv from "dotenv";
dotenv.config({ path: ".env.local" });

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! });
const prisma = new PrismaClient({ adapter } as any);

const AUTHOR = {
  authorName:  "ComplianceSearch Editorial Team",
  authorEmail: "csakassociates@gmail.com",
  authorPhone: "9999999999",
};

const posts = [

// ─────────────────────────────────────────────────────────────────────────────
// 1. How to Appoint a Director
// ─────────────────────────────────────────────────────────────────────────────
{
  title:    "How to Appoint a Director in a Private Limited Company — Complete Guide (2025-26)",
  slug:     "how-to-appoint-director-private-limited-company-india-2025",
  category: "mca_roc",
  tags:     "director appointment, DIR-12, DIR-2, DIR-8, Companies Act 2013, Section 161",
  excerpt:  "Step-by-step guide to appointing an Additional Director, Independent Director, or Regular Director in a private limited company — board notice, DIR-2, DIR-8, DIR-12, and AGM regularisation explained.",
  content: `Appointing a director is one of the most common corporate actions for a private limited company. Whether it is adding an Additional Director, an Independent Director, or a Director appointed at a General Meeting — each type has a specific procedure under the Companies Act 2013. This guide covers the complete process for FY 2025-26.

WHO CAN BE APPOINTED AS DIRECTOR?

Any individual (not a body corporate) who holds a valid Director Identification Number (DIN) can be appointed as a director of a company. The person must not be disqualified under Section 164 of the Companies Act 2013. DIN can be applied via Form DIR-3 on the MCA portal.

TYPES OF DIRECTOR APPOINTMENT

Understanding which type of director you are appointing is important — because the section of law, the tenure, and the ROC filing requirements differ.

Additional Director (Section 161(1)): Appointed by the Board for a period up to the next AGM. Must be regularised at AGM by an Ordinary Resolution. Most common for mid-year appointments.

Alternate Director (Section 161(2)): Appointed by the Board in place of a director who is absent from India for at least 3 months. Vacates office automatically when the original director returns.

Nominee Director (Section 161(3)): Appointed by the Board on the nomination of an institutional investor, lender, or as per the Articles of Association.

Managing Director or Whole-time Director (Section 196): Appointed for executive roles. Requires shareholder approval within 3 months and MR-1 filing within 60 days.

Director at General Meeting (Section 152): Appointed by shareholders at the AGM or EGM by Ordinary Resolution. Liable to retire by rotation.

THE 5 DOCUMENTS YOU NEED

STEP #1 — Board Meeting Notice (SS-1 Compliant)

Under Secretarial Standard 1 (SS-1), the notice of Board Meeting must be sent to all directors at least 7 days before the meeting. The notice must include the agenda for director appointment. The notice must mention the name of the proposed director, their DIN, and the designation being offered.

What to do: Generate the Board Notice using the Director Appointment tool on ComplianceSearch.in — it auto-fills SS-1 compliant language and calculates the notice date automatically.

STEP #2 — DIR-2: Consent to Act as Director

Before the appointment can be made, obtain a written consent from the proposed director in Form DIR-2. This is mandatory under Rule 8 of the Companies (Appointment and Qualification of Directors) Rules 2014. DIR-2 must be signed by the proposed director before the Board meeting. Keep it in company records — it is an attachment for DIR-12 filing.

STEP #3 — DIR-8: Declaration of Non-Disqualification

The proposed director must provide a declaration in Form DIR-8 confirming that they are not disqualified from being a director under Section 164 of the Companies Act 2013. This declaration must be renewed by all directors at the first Board meeting of every financial year (Section 164(2)).

STEP #4 — Board Resolution (Extract of Minutes)

The Board meeting must be held, the appointment approved by a majority of directors, and the minutes recorded. The board resolution must be in CTC (Certified True Copy) format for ROC filing. It must mention the section of law, the full name and DIN of the appointed director, the designation, and the effective date.

STEP #5 — DIR-12: ROC Filing

Form DIR-12 must be filed with the Registrar of Companies (ROC) on the MCA V3 portal within 30 days of the date of appointment. Delay attracts additional fees of Rs. 100 per day (uncapped) under Section 403.

Attachments for DIR-12:

- Board Resolution (Extract of Minutes) — CTC format
- DIR-2 — Consent to Act as Director
- DIR-8 — Declaration of non-disqualification
- DIN allotment letter (proof of DIN)

ROC FILING DEADLINES — SUMMARY

DIR-12 for Additional, Alternate, Nominee, and Independent Directors: within 30 days of Board meeting date.

DIR-12 for Director at General Meeting (Section 152): within 30 days of AGM or EGM date.

MR-1 for Managing Director and Whole-time Director: within 60 days of Board meeting date (in addition to DIR-12).

What to do: Use the MCA Penalty Calculator on ComplianceSearch.in to calculate the exact late fee if the deadline has passed.

REGULARISATION AT THE AGM

If you have appointed an Additional Director under Section 161(1), they hold office only until the next AGM. To regularise, the shareholders must pass an Ordinary Resolution at the AGM. File a fresh DIR-12 for the regularisation within 30 days of the AGM. If the director is not regularised, they automatically vacate office at the AGM.

ADDITIONAL COMPLIANCE AFTER APPOINTMENT

- Update the Register of Directors and KMP (MBP-1) under Section 170 within 7 days
- Issue a formal appointment letter to the new director
- Update the company website (if applicable) with new director details
- For listed companies, intimate the stock exchange within 24 hours under LODR Regulation 30

THE BOTTOM LINE

Director appointment in a private limited company is a 5-step process: Board Notice, DIR-2, DIR-8, Board Resolution, and DIR-12 filing within 30 days. Missing the DIR-12 deadline attracts heavy penalties. Use the free Director Appointment Kit on ComplianceSearch.in to generate all 5 documents in one step — SS-1 compliant notice, board resolution CTC, DIR-2, DIR-8, and a step-by-step ROC filing guide.`,
},

// ─────────────────────────────────────────────────────────────────────────────
// 2. Board Meeting Minutes Format — SS-1 Guide
// ─────────────────────────────────────────────────────────────────────────────
{
  title:    "Board Meeting Minutes Format Under Companies Act 2013 — SS-1 Complete Guide",
  slug:     "board-meeting-minutes-format-companies-act-2013-ss1-guide",
  category: "mca_roc",
  tags:     "board meeting minutes, SS-1, secretarial standard, board meeting format, companies act 2013, CTC resolution",
  excerpt:  "Complete guide to drafting SS-1 compliant board meeting minutes — notice period, agenda, quorum, attendance register, resolution format, signing deadline, and Certified True Copy (CTC) requirements.",
  content: `Board meeting minutes are the official record of all decisions taken by the Board of Directors. Under Section 118 of the Companies Act 2013 read with Secretarial Standard 1 (SS-1), maintaining proper board meeting minutes is a mandatory legal requirement. Non-compliance is a punishable offence. This guide covers everything you need to know about the format and procedure.

WHAT IS SS-1?

SS-1 is the Secretarial Standard for Board Meetings issued by the Institute of Company Secretaries of India (ICSI) and notified by the Ministry of Corporate Affairs. It became mandatory for all companies from 1 July 2015 under Section 118(10) of the Companies Act 2013.

SS-1 NOTICE REQUIREMENTS

The notice of Board Meeting must be sent to every director at their address registered with the company. The minimum notice period is 7 days. The notice must include the date, time, and venue of the meeting; the agenda with all items to be discussed; notes on agenda; and draft resolutions.

What to do: Send the notice via registered post, speed post, courier, hand delivery, or email (with prior written consent of the director). Keep proof of delivery for each director.

QUORUM REQUIREMENTS

The quorum for a Board meeting under Section 174 of the Companies Act 2013 is the higher of one-third of the total strength of the Board or 2 directors.

For a company with 3 directors, quorum is 2. For a company with 10 directors, quorum is 4. Important: The quorum must be present throughout the meeting, not just at the commencement.

SS-1 FORMAT FOR BOARD MEETING MINUTES

The minutes must contain: the serial number and type of meeting, date and time and venue, names of directors present and absent, the fact that quorum was present, discussions and resolutions for each agenda item, and the date of signing.

RESOLUTION FORMAT

Every resolution must clearly state: "RESOLVED THAT pursuant to the provisions of Section [relevant section] of the Companies Act, 2013 read with [relevant rules], [operative text of the resolution]."

Followed by: "RESOLVED FURTHER THAT [any authority delegation clause]."

SIGNING DEADLINE — CRITICAL

Under Section 118(1) and SS-1, the minutes must be entered in the Minutes Book and signed by the Chairman of the meeting (or the Chairman of the next meeting) within 30 days of the conclusion of the meeting.

Real example: If a Board meeting is held on 15 August 2025, the minutes must be signed by 14 September 2025. Missing this deadline is an offence under Section 118(11) — penalty of Rs. 25,000 for the company and Rs. 5,000 for every officer in default.

CERTIFIED TRUE COPY (CTC) OF RESOLUTIONS

A Certified True Copy is an extract of the resolution from the minutes, certified as a true copy by a Director or Company Secretary. CTCs are needed for bank submissions, ROC filings, and property transactions. The CTC must include the company letterhead, meeting details, full resolution text, and the certification statement.

COMMON SS-1 MISTAKES TO AVOID

MISTAKE #1 — Sending notice less than 7 days before the meeting. This invalidates the meeting unless all directors consent in writing to shorter notice.

MISTAKE #2 — Recording minutes only for resolutions. SS-1 requires minutes to record all discussions, not just resolutions.

MISTAKE #3 — Signing minutes after 30 days. This is a punishable offence under Section 118(11).

MISTAKE #4 — Not mentioning the quorum fact. SS-1 specifically requires the minutes to state that quorum was present throughout.

MISTAKE #5 — Using wrong resolution language. Resolutions must begin with "RESOLVED THAT" and cite the correct section of the Companies Act.

THE BOTTOM LINE

SS-1 compliant board meeting minutes are a legal requirement, not optional. Key rules: 7-day notice, quorum throughout the meeting, minutes signed within 30 days, all resolutions in "RESOLVED THAT" format. Use the free Board Meeting Minutes Generator on ComplianceSearch.in to generate SS-1 compliant notices, minutes, attendance register, and resolution CTCs — all in one step, in the correct legal format.`,
},

// ─────────────────────────────────────────────────────────────────────────────
// 3. AOC-4 Filing Guide FY 2025-26
// ─────────────────────────────────────────────────────────────────────────────
{
  title:    "AOC-4 Filing — Complete Guide for FY 2025-26: Documents, Due Date, and Late Fees",
  slug:     "aoc-4-filing-guide-fy-2025-26-documents-due-date-late-fees",
  category: "mca_roc",
  tags:     "AOC-4, annual filing, MGT-7, directors report, companies act 2013, ROC filing, MCA",
  excerpt:  "Complete guide to AOC-4 filing for FY 2025-26 — what is AOC-4, due date, all required attachments including Directors Report, Audit Report, CARO 2020, AOC-1, AOC-2, Cash Flow, and late filing fee calculation.",
  content: `Every company incorporated in India must file its financial statements with the Registrar of Companies (ROC) every year in Form AOC-4 under Section 137 of the Companies Act 2013. For FY 2025-26, understanding the due date, required documents, and late fee structure is essential to avoid penalties.

WHAT IS AOC-4?

AOC-4 is an e-form filed on the MCA portal (mca.gov.in) containing the company's financial statements for the financial year. It must include the Balance Sheet, Profit and Loss Statement, Directors' Report, Auditor's Report, and various annexures. AOC-4 is filed by all companies — private limited, public limited, One Person Companies, and Section 8 companies.

AOC-4 DUE DATE FOR FY 2025-26

AOC-4 must be filed within 30 days from the date of the Annual General Meeting (AGM) under Section 137(1).

For FY 2025-26 (April 2025 to March 2026): AGM must be held by 30 September 2026. If AGM is held on 30 September 2026, AOC-4 is due by 30 October 2026.

For OPCs: AOC-4 must be filed within 180 days from the close of the financial year — by 27 September 2026 for FY 2025-26.

COMPLETE LIST OF AOC-4 ATTACHMENTS

All companies must attach:

- Balance Sheet as on 31 March 2026
- Statement of Profit and Loss for FY 2025-26
- Directors' Report (Section 134) with all mandatory annexures
- Auditor's Report (Standalone)
- Notes to Accounts and Significant Accounting Policies

Conditional attachments:

- Cash Flow Statement: Mandatory for all companies except OPCs, small companies, and dormant companies
- CARO 2020 Report: Required for companies to which the Companies Auditor's Report Order 2020 applies
- Consolidated Financial Statements: Required if company has subsidiaries or associates
- AOC-1: Statement of subsidiaries, associates, and joint ventures (if applicable)
- AOC-2: Related party disclosure under Section 188 (attached to Directors' Report)
- Secretarial Audit Report MR-3: Required for listed companies and certain unlisted public companies

DIRECTORS' REPORT — MANDATORY CONTENTS (SECTION 134)

The Directors' Report is a mandatory attachment to AOC-4. It must include the state of company's affairs, material changes after year-end, conservation of energy and technology absorption details, risk management policy, statement on Internal Financial Controls, related party disclosure via AOC-2, number of Board meetings held, the Directors' Responsibility Statement under Section 134(3)(c), and CSR activities and amount spent if applicable.

WHAT IS CARO 2020 AND WHO MUST COMPLY?

CARO 2020 (Companies Auditor's Report Order 2020) requires the statutory auditor to report on specific matters. It does NOT apply to: banking companies, insurance companies, Section 8 companies, One Person Companies, small companies, and private limited companies where all three conditions are satisfied simultaneously: paid-up capital not exceeding Rs. 1 crore AND borrowings from banks or FIs not exceeding Rs. 1 crore AND turnover not exceeding Rs. 10 crore.

AOC-4 LATE FILING FEES (FY 2025-26)

Under Section 403, filing AOC-4 after the due date attracts additional fees of Rs. 100 per day — there is no cap.

Real example: AOC-4 due date is 30 October 2026. You file on 30 November 2026, a delay of 31 days. Late fee = 31 x Rs. 100 = Rs. 3,100 in addition to the normal filing fee.

What to do: Use the MCA Penalty Calculator on ComplianceSearch.in to calculate the exact late fee for any form by entering your filing date and due date.

STEP-BY-STEP AOC-4 FILING PROCESS

STEP #1 — Hold the AGM on or before 30 September 2026. Pass the resolution for adoption of financial statements.

STEP #2 — Get financial statements audited and obtain the signed Auditor's Report.

STEP #3 — Prepare the Directors' Report with all mandatory annexures and get it Board-approved.

STEP #4 — Generate all AOC-4 attachment documents using the Annual Filing tool on ComplianceSearch.in — Directors' Report, CARO 2020, AOC-1, AOC-2, Cash Flow Statement.

STEP #5 — Log in to MCA V3 portal, navigate to e-Filing and Company Forms Submission and AOC-4, upload all attachments, affix DSC, and file.

THE BOTTOM LINE

AOC-4 for FY 2025-26 is due by 30 October 2026 if AGM is held on 30 September 2026. The attachments include Directors' Report, Audit Report, CARO 2020, Cash Flow Statement, and subsidiary disclosures. Use the free Annual Filing Attachments Generator on ComplianceSearch.in to generate all documents in minutes — no manual drafting required.`,
},

// ─────────────────────────────────────────────────────────────────────────────
// 4. MCA Late Filing Fee Guide
// ─────────────────────────────────────────────────────────────────────────────
{
  title:    "MCA Late Filing Fees — AOC-4, MGT-7, DIR-3 KYC, ADT-1 Penalty Guide (2025-26)",
  slug:     "mca-late-filing-fees-aoc4-mgt7-dir3-kyc-penalty-2025-26",
  category: "mca_roc",
  tags:     "MCA late fee, ROC penalty, AOC-4 late fee, MGT-7 additional fee, DIR-3 KYC penalty, Section 403",
  excerpt:  "Complete guide to MCA late filing fees for FY 2025-26 — AOC-4, MGT-7, MGT-7A, DIR-3 KYC, ADT-1, DIR-12 additional fees under Section 403 with real examples and the penalty calculator.",
  content: `Filing MCA forms late is expensive. Under Section 403 of the Companies Act 2013, every delayed ROC filing attracts additional fees of Rs. 100 per day — with no cap. Missing AOC-4 or MGT-7 deadlines for even a month can cost thousands of rupees. This guide covers all major MCA forms, their due dates, and the late fee structure for FY 2025-26.

HOW ARE MCA LATE FEES CALCULATED?

Under Section 403, the additional fee for late filing of any form is Rs. 100 per day of delay — from the day after the due date until the date of actual filing. The normal filing fee (based on authorised share capital) is charged separately.

Real example: AOC-4 due date is 30 October 2026. Filed on 15 December 2026, a delay of 46 days. Additional fee = 46 x Rs. 100 = Rs. 4,600 in addition to the normal filing fee.

AOC-4 — ANNUAL FINANCIAL STATEMENTS

Due date: Within 30 days from the date of Annual General Meeting.

For FY 2025-26 (if AGM held on 30 September 2026): Due by 30 October 2026.

For OPCs: Within 180 days from close of financial year — by 27 September 2026 for FY 2025-26.

Late fee: Rs. 100 per day from 31 October 2026 onwards.

MGT-7 AND MGT-7A — ANNUAL RETURN

MGT-7 for companies other than OPCs and small companies: Within 60 days from the date of AGM. If AGM is 30 September 2026, MGT-7 is due by 29 November 2026.

MGT-7A for OPCs and small companies: Within 60 days from the end of financial year — due by 29 May 2026 for FY 2025-26.

Late fee: Rs. 100 per day from the day after due date.

DIR-3 KYC — DIRECTOR KYC

Every director who has been allotted a DIN must file DIR-3 KYC annually.

Due date: 30 September of each year for all directors who had DIN as on 31 March.

For FY 2025-26: DIR-3 KYC due by 30 September 2026.

Late fee: A flat penalty of Rs. 5,000 (not per-day). The DIN is marked as "Deactivated" until KYC is completed and Rs. 5,000 is paid. A deactivated DIN director cannot sign any MCA form.

ADT-1 — AUDITOR APPOINTMENT

Due date: Within 15 days from the conclusion of the AGM for auditor appointed at AGM under Section 139(1). For first auditors appointed by Board under Section 139(6): within 30 days of Board meeting.

Late fee: Rs. 100 per day.

DIR-12 — DIRECTOR APPOINTMENT OR CESSATION

Due date: Within 30 days of the date of appointment or cessation of director.

Late fee: Rs. 100 per day.

MGT-14 — FILING OF SPECIAL RESOLUTIONS

Due date: Within 30 days of passing the special resolution at EGM or AGM.

Applicable for: MOA or AOA amendment, share capital increase, company name change, and other special resolutions.

Late fee: Rs. 100 per day.

DPT-3 — DEPOSIT OR LOAN RETURN

Due date: 30 June of every year for loans and deposits received as of 31 March.

For FY 2025-26: DPT-3 due by 30 June 2026.

Late fee: Rs. 100 per day from 1 July 2026.

STRIKE OFF RISK — WHEN IS IT TRIGGERED?

Under Section 248, if a company fails to file AOC-4 or MGT-7 for 2 consecutive financial years, the ROC can strike off the company. The directors may also be disqualified under Section 164(2) if the company defaults on annual filings for 3 consecutive years.

What to do: Never let annual filings lapse for 2 or more years. File even with late fees — it is always cheaper than strike off and reinstatement proceedings.

HOW TO CALCULATE YOUR EXACT LATE FEE

STEP #1 — Identify the specific MCA form and its due date.

STEP #2 — Note the actual date of filing or today's date for an estimate.

STEP #3 — Calculate the number of days of delay from the day after due date to filing date.

STEP #4 — Multiply days by Rs. 100.

STEP #5 — Add the normal filing fee based on authorised share capital.

What to do: Use the MCA Penalty Calculator on ComplianceSearch.in — enter the form, company type, and dates to get the exact additional fee with a slab-wise breakdown instantly.

THE BOTTOM LINE

MCA late fees are Rs. 100 per day with no upper cap. A 6-month delay on AOC-4 costs Rs. 18,000 in additional fees alone. The most critical deadlines: AOC-4 within 30 days of AGM, MGT-7 within 60 days of AGM, DIR-3 KYC by 30 September every year, ADT-1 within 15 days of AGM. Use the free MCA Penalty Calculator on ComplianceSearch.in to compute your exact late fee for any form instantly.`,
},

// ─────────────────────────────────────────────────────────────────────────────
// 5. GST Registration Guide
// ─────────────────────────────────────────────────────────────────────────────
{
  title:    "GST Registration — When Is It Mandatory? Complete Eligibility Guide for 2025-26",
  slug:     "gst-registration-mandatory-eligibility-threshold-india-2025-26",
  category: "gst",
  tags:     "GST registration, GST threshold, GST eligibility, GSTIN, GST mandatory India, aggregate turnover",
  excerpt:  "Complete guide to GST registration eligibility for 2025-26 — turnover thresholds for goods and services, mandatory registration regardless of turnover, special category states, Composition Scheme, and penalty for non-registration.",
  content: `GST registration is not optional for most businesses in India — crossing the turnover threshold makes it compulsory, and certain categories of businesses must register regardless of turnover. This guide explains exactly when GST registration is mandatory, the threshold limits for FY 2025-26, and the consequences of not registering.

WHAT IS GST REGISTRATION?

GST registration is the process of enrolling your business under the Goods and Services Tax Act 2017. Upon registration, you receive a 15-digit GSTIN (Goods and Services Tax Identification Number). Once registered, you must collect GST from customers on taxable supplies, file monthly or quarterly returns (GSTR-1 and GSTR-3B), and pay GST to the government by the due dates.

TURNOVER THRESHOLDS FOR 2025-26

Regular States — Goods Suppliers: Turnover exceeding Rs. 40 lakh in a financial year makes GST registration mandatory. This applies to Maharashtra, Delhi, Karnataka, Tamil Nadu, Gujarat, Rajasthan, Uttar Pradesh, and most other states.

Regular States — Service Suppliers: Turnover exceeding Rs. 20 lakh in a financial year makes GST registration mandatory.

Special Category States: For states in the Northeast (Manipur, Mizoram, Nagaland, Tripura) and hilly states (Uttarakhand, Himachal Pradesh), the threshold is Rs. 20 lakh for goods and Rs. 10 lakh for services.

Note: Aggregate turnover includes all taxable, exempt, and nil-rated supplies under the same PAN across India.

MANDATORY REGISTRATION REGARDLESS OF TURNOVER

Certain businesses must register for GST even if their turnover is below the threshold:

- Inter-state supply of taxable goods or services (any amount)
- E-commerce operators and sellers on platforms like Amazon and Flipkart
- Non-resident taxable persons making taxable supplies in India
- Persons required to pay tax under reverse charge mechanism
- Persons who deduct TDS under Section 51 of the CGST Act

Real example: A freelancer based in Mumbai earns Rs. 15 lakh from clients in Delhi and Bengaluru. Since they provide services inter-state, GST registration is mandatory regardless of the Rs. 20 lakh threshold.

COMPOSITION SCHEME — SMALL BUSINESS ALTERNATIVE

Businesses with aggregate turnover up to Rs. 1.5 crore (Rs. 75 lakh for special category states) can opt for the Composition Scheme under Section 10. Under Composition Scheme, you pay GST at a flat rate (1% for manufacturers, 5% for restaurants, 6% for other service providers), file quarterly return CMP-08 and annual return GSTR-4, but cannot charge GST on invoices, cannot make inter-state supplies, and cannot claim Input Tax Credit.

What to do: If your turnover is between Rs. 20 lakh and Rs. 1.5 crore for services, evaluate whether Composition Scheme reduces compliance burden for your business situation.

GST REGISTRATION PROCEDURE

STEP #1 — Visit gst.gov.in, click Registration, then New Registration.

STEP #2 — Fill Part A: Mobile number, email ID, state, and PAN. Verify with OTP. Note the TRN (Temporary Reference Number) generated.

STEP #3 — Fill Part B within 15 days of generating TRN: Business details, place of business address, bank account details, and authorised signatory information.

STEP #4 — Documents required: PAN card of business or proprietor, Aadhaar card, business registration proof such as certificate of incorporation for companies, address proof of principal place of business such as rent agreement or electricity bill, bank statement or cancelled cheque, and photograph of the authorised signatory.

STEP #5 — Submit with DSC for companies and LLPs or e-Signature for others. GSTIN is typically allotted within 3 to 7 working days after successful verification.

PENALTY FOR NOT REGISTERING

Under Section 122 of the CGST Act 2017, a person who supplies goods or services without GST registration (when required) is liable to a penalty of Rs. 10,000 or the amount of tax evaded, whichever is higher. The GST officer can also assess full tax liability for the period of non-registration plus 18% interest per annum plus penalty.

GST RETURN FILING AFTER REGISTRATION

GSTR-1 (Outward supplies): Monthly if turnover exceeds Rs. 5 crore, due 11th of next month. Quarterly under QRMP scheme, due 13th of month after quarter.

GSTR-3B (Summary return with tax payment): Monthly or quarterly, due 20th of next month.

GSTR-9 (Annual return): Due by 31 December of next financial year.

What to do: Use the GST Due Dates calendar on ComplianceSearch.in to see all GSTR-1 and GSTR-3B deadlines for FY 2025-26 in one place.

THE BOTTOM LINE

GST registration is mandatory if your turnover exceeds Rs. 40 lakh (goods) or Rs. 20 lakh (services) in regular states, or if you make inter-state supplies regardless of turnover. Register within 30 days of crossing the threshold to avoid penalties. Use the free Compliance Checker on ComplianceSearch.in — it checks GST registration requirement and 76 other compliance rules based on your business profile and gives you a personalised compliance list in 2 minutes.`,
},

];

async function main() {
  console.log(`Inserting ${posts.length} blog posts...`);

  for (const p of posts) {
    const existing = await prisma.blogPost.findUnique({ where: { slug: p.slug } });
    if (existing) {
      console.log(`  SKIP (exists): ${p.slug}`);
      continue;
    }
    await prisma.blogPost.create({
      data: { ...p, ...AUTHOR, status: "approved", publishedAt: new Date() },
    });
    console.log(`  OK: ${p.title.slice(0, 65)}...`);
  }

  console.log("Done.");
}

main()
  .catch(e => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
