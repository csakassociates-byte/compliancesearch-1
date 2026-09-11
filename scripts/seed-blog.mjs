import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

const AUTHOR = {
  authorName:  "ComplianceSearch Editorial Team",
  authorEmail: "csakassociates@gmail.com",
  authorPhone: "9999999999",
};

const posts = [

// ─────────────────────────────────────────────────────────
// 1. How to Appoint a Director
// ─────────────────────────────────────────────────────────
{
  title:    "How to Appoint a Director in a Private Limited Company — Complete Guide (2025-26)",
  slug:     "how-to-appoint-director-private-limited-company-india-2025",
  category: "mca_roc",
  tags:     "director appointment, DIR-12, DIR-2, DIR-8, Companies Act 2013, Section 161",
  excerpt:  "Step-by-step guide to appointing an Additional Director, Independent Director, or Regular Director in a private limited company — board notice, DIR-2, DIR-8, DIR-12, and AGM regularisation explained.",
  content: `Appointing a director is one of the most common corporate actions for a private limited company. Whether it's adding an Additional Director, an Independent Director, or a Director appointed at a General Meeting — each type has a specific procedure under the Companies Act 2013. This guide covers the complete process for FY 2025-26.

WHO CAN BE APPOINTED AS DIRECTOR?

Any individual (not a body corporate) who holds a valid Director Identification Number (DIN) can be appointed as a director of a company. The person must not be disqualified under Section 164 of the Companies Act 2013. DIN can be applied via Form DIR-3 on the MCA portal.

TYPES OF DIRECTOR APPOINTMENT

Understanding which type of director you are appointing is important — because the section of law, the tenure, and the ROC filing requirements differ.

Additional Director (Section 161(1)): Appointed by the Board for a period up to the next AGM. Must be regularised at AGM by an Ordinary Resolution. Most common for mid-year appointments.

Alternate Director (Section 161(2)): Appointed by the Board in place of a director who is absent from India for at least 3 months. Vacates office automatically when the original director returns.

Nominee Director (Section 161(3)): Appointed by the Board on the nomination of an institutional investor, lender, or as per the Articles of Association.

Managing Director / Whole-time Director (Section 196): Appointed for executive roles. Requires shareholder approval within 3 months and MR-1 filing within 60 days.

Director at General Meeting (Section 152): Appointed by shareholders at the AGM or EGM by Ordinary Resolution. Liable to retire by rotation.

THE 5 DOCUMENTS YOU NEED

STEP #1 — Board Meeting Notice (SS-1 Compliant)

Under Secretarial Standard 1 (SS-1), the notice of Board Meeting must be sent to all directors at least 7 days before the meeting. The notice must include the agenda for director appointment. Use registered post, speed post, courier, hand delivery, or email (if written consent received). For email, attach the agenda as a PDF. The notice must mention the name of the proposed director, their DIN, and the designation being offered.

What to do: Generate the Board Notice using ComplianceSearch.in Corporate Action Kit — Director Appointment tool. It auto-fills SS-1 compliant language and calculates the notice date.

STEP #2 — DIR-2: Consent to Act as Director

Before the appointment can be made, obtain a written consent from the proposed director in Form DIR-2. This is mandatory under Rule 8 of the Companies (Appointment and Qualification of Directors) Rules 2014. DIR-2 must be signed by the proposed director before the Board meeting. Keep it in company records — it is an attachment for DIR-12 filing.

STEP #3 — DIR-8: Declaration of Non-Disqualification

The proposed director must provide a declaration in Form DIR-8 confirming that they are not disqualified from being a director under Section 164 of the Companies Act 2013. The declaration covers disqualification due to insolvency, criminal convictions, company default in annual filings for 3 consecutive years, and more. This declaration must be renewed by all directors at the first Board meeting of every financial year (Section 164(2)).

STEP #4 — Board Resolution (Extract of Minutes)

The Board meeting must be held, the appointment approved by a majority of directors, and the minutes recorded. The board resolution must be in CTC (Certified True Copy) format for ROC filing. It must mention: the section of law (e.g., Section 161(1)), the full name and DIN of the appointed director, the designation, and the effective date.

STEP #5 — DIR-12: ROC Filing

Form DIR-12 must be filed with the Registrar of Companies (ROC) on the MCA V3 portal within 30 days of the date of appointment. Delay attracts additional fees of ₹100 per day (uncapped) under Section 403. The form requires: CIN of the company, DIN of the new director, date of appointment, designation, and the attachments.

Attachments for DIR-12:

- Board Resolution (Extract of Minutes) — CTC format
- DIR-2 — Consent to Act as Director
- DIR-8 — Declaration of non-disqualification
- DIN allotment letter (proof of DIN)

ROC FILING DEADLINES — SUMMARY

DIR-12 — Additional, Alternate, Nominee, Independent Director: within 30 days of Board meeting date.

DIR-12 — Director at General Meeting (Section 152): within 30 days of AGM/EGM date.

MR-1 — Managing Director / Whole-time Director: within 60 days of Board meeting date (in addition to DIR-12).

What to do: Use the MCA Penalty Calculator on ComplianceSearch.in to calculate the exact late fee if the deadline has passed.

REGULARISATION AT THE AGM

If you have appointed an Additional Director under Section 161(1), they hold office only until the next AGM. To regularise, the shareholders must pass an Ordinary Resolution at the AGM approving the appointment. File a fresh DIR-12 for the regularisation within 30 days of the AGM. If the director is not regularised, they automatically vacate office at the AGM.

ADDITIONAL COMPLIANCE AFTER APPOINTMENT

- Update the Register of Directors and KMP (MBP-1) under Section 170 within 7 days.
- Issue a formal appointment letter to the new director with a copy of the board resolution.
- Update the company website (if applicable) with new director details.
- For listed companies, intimate the stock exchange within 24 hours under LODR Regulation 30.

THE BOTTOM LINE

Director appointment in a private limited company is a 5-step process: Board Notice → DIR-2 → DIR-8 → Board Resolution → DIR-12 filing within 30 days. Missing the DIR-12 deadline attracts heavy penalties. Use the free Director Appointment Kit on ComplianceSearch.in to generate all 5 documents in one step — SS-1 compliant notice, board resolution CTC, DIR-2, DIR-8, and a step-by-step ROC filing guide.`,
},

// ─────────────────────────────────────────────────────────
// 2. Board Meeting Minutes Format — SS-1 Guide
// ─────────────────────────────────────────────────────────
{
  title:    "Board Meeting Minutes Format Under Companies Act 2013 — SS-1 Complete Guide",
  slug:     "board-meeting-minutes-format-companies-act-2013-ss1-guide",
  category: "mca_roc",
  tags:     "board meeting minutes, SS-1, secretarial standard, board meeting format, companies act 2013, CTC resolution",
  excerpt:  "Complete guide to drafting SS-1 compliant board meeting minutes — notice period, agenda, quorum, attendance register, resolution format, signing deadline, and Certified True Copy (CTC) requirements.",
  content: `Board meeting minutes are not just a formality — they are the official record of all decisions taken by the company's Board of Directors. Under Section 118 of the Companies Act 2013 read with Secretarial Standard 1 (SS-1), maintaining proper board meeting minutes is a mandatory legal requirement. Non-compliance is a punishable offence. This guide covers everything you need to know about the format and procedure.

WHAT IS SS-1?

SS-1 is the Secretarial Standard for Board Meetings issued by the Institute of Company Secretaries of India (ICSI) and notified by the Ministry of Corporate Affairs. It became mandatory for all companies (except OPCs and small companies for certain provisions) from 1 July 2015 under Section 118(10) of the Companies Act 2013. SS-1 prescribes the exact procedure for convening, conducting, and recording Board meetings.

SS-1 NOTICE REQUIREMENTS

The notice of Board Meeting must be sent to every director at their address registered with the company. The minimum notice period is 7 days. For meetings to be called at shorter notice, all directors or a majority must consent in writing. The notice must include:

- Date, time, and venue of the meeting
- Agenda with all items to be discussed
- Notes on agenda (details of each item)
- Draft resolution(s) to be passed

For email notice, the director must have given written consent to receive notices by email. The notice must be sent from the registered email ID of the company.

What to do: Send the notice via registered post, speed post, courier, hand delivery, or email. Keep proof of delivery for each director.

QUORUM REQUIREMENTS

The quorum for a Board meeting under Section 174 of the Companies Act 2013 is the higher of:

- One-third of the total strength of the Board
- 2 directors

For a company with 3 directors, quorum is 2. For a company with 6 directors, quorum is 2 (one-third rounds to 2). For a company with 10 directors, quorum is 4 (one-third rounds to 4).

Important: The quorum must be present throughout the meeting, not just at the commencement. If quorum is not maintained at any point, the meeting must be adjourned.

SS-1 FORMAT FOR BOARD MEETING MINUTES

The minutes must contain:

The serial number and type of meeting (e.g., "54th Meeting of the Board of Directors").

Date, time, and venue of the meeting.

Names of directors present, absent (with or without leave), and the Company Secretary if present.

The fact that quorum was present.

For each agenda item: the discussion, resolution text (if any), and vote count.

Date of signing of minutes.

Name and signature of the Chairman.

RESOLUTION FORMAT

Every resolution must clearly state:

"RESOLVED THAT pursuant to the provisions of Section [relevant section] of the Companies Act, 2013 read with [relevant rules], [operative text of the resolution]."

"RESOLVED FURTHER THAT [any authority delegation clause]."

Each resolution is a separate agenda item and must be numbered. Resolutions must be worded in the past tense as they are recorded after the meeting.

SIGNING DEADLINE — CRITICAL

Under Section 118(1) of the Companies Act 2013 and SS-1, the minutes must be entered in the Minutes Book and signed by the Chairman of the meeting (or the Chairman of the next meeting) within 30 days of the conclusion of the meeting.

Real example: If a Board meeting is held on 15 August 2025, the minutes must be signed by 14 September 2025 at the latest. Missing this deadline is an offence under Section 118(11) — penalty of ₹25,000 for the company and ₹5,000 for every officer in default.

ATTENDANCE REGISTER

Every Board meeting must have an attendance register under Section 170. The register must contain:

- Serial number
- Date of meeting
- Names of directors present
- Signature of each director
- Name of the person who signed for an absent director (if proxy — not allowed for Board meetings)

CERTIFIED TRUE COPY (CTC) OF RESOLUTIONS

A Certified True Copy is an extract of the resolution from the minutes, certified as a true copy by a Director or Company Secretary. CTCs are needed for bank submissions, ROC filings (DIR-12, ADT-1, etc.), property transactions, and other third-party requirements. The CTC must include:

- Company letterhead
- Title: "EXTRACT OF RESOLUTION PASSED AT THE [Nth] BOARD MEETING"
- Meeting details (date, time, venue)
- Full resolution text
- Certification statement: "Certified to Be True — For and on behalf of [Company Name]"
- Signature of Director/CS with date

COMMON SS-1 MISTAKES TO AVOID

MISTAKE #1 — Sending notice less than 7 days before the meeting. This invalidates the meeting unless all directors consent in writing to shorter notice.

MISTAKE #2 — Recording minutes only for resolutions. SS-1 requires minutes to record all discussions, not just resolutions.

MISTAKE #3 — Signing minutes after 30 days. This is a punishable offence under Section 118(11).

MISTAKE #4 — Not mentioning the quorum fact. SS-1 specifically requires the minutes to state that quorum was present.

MISTAKE #5 — Using wrong resolution language. Resolutions must begin with "RESOLVED THAT" and cite the correct section of the Companies Act.

THE BOTTOM LINE

SS-1 compliant board meeting minutes are a legal requirement, not optional. The key rules to remember: 7-day notice, quorum throughout the meeting, minutes signed within 30 days, all resolutions in "RESOLVED THAT" format. Use the free Board Meeting Minutes Generator on ComplianceSearch.in to generate SS-1 compliant notices, minutes, attendance register, and resolution CTCs — all in one step, in the correct legal format.`,
},

// ─────────────────────────────────────────────────────────
// 3. AOC-4 Filing Guide FY 2025-26
// ─────────────────────────────────────────────────────────
{
  title:    "AOC-4 Filing — Complete Guide for FY 2025-26: Documents, Due Date, and Late Fees",
  slug:     "aoc-4-filing-guide-fy-2025-26-documents-due-date-late-fees",
  category: "mca_roc",
  tags:     "AOC-4, annual filing, MGT-7, directors report, companies act 2013, ROC filing, MCA",
  excerpt:  "Complete guide to AOC-4 filing for FY 2025-26 — what is AOC-4, due date, all required attachments (Directors' Report, Audit Report, CARO 2020, AOC-1, AOC-2, Cash Flow), and late filing fee calculation.",
  content: `Every company incorporated in India must file its financial statements with the Registrar of Companies (ROC) every year in Form AOC-4 under Section 137 of the Companies Act 2013. For FY 2025-26, understanding the due date, required documents, and late fee structure is essential to avoid penalties. This is a complete guide.

WHAT IS AOC-4?

AOC-4 is an e-form filed on the MCA portal (mca.gov.in) containing the company's financial statements for the financial year. It must include the Balance Sheet, Profit & Loss Statement, Directors' Report, Auditor's Report, and various annexures. AOC-4 is filed by all companies — private limited, public limited, One Person Companies (OPCs), and Section 8 companies.

Exception: OPCs and small companies file the simplified form AOC-4 (XBRL not required). Listed companies must file AOC-4 XBRL.

AOC-4 DUE DATE FOR FY 2025-26

AOC-4 must be filed within 30 days from the date of the Annual General Meeting (AGM) under Section 137(1).

For FY 2025-26 (April 2025 to March 2026):

- AGM must be held by 30 September 2026 (within 6 months of financial year end)
- If AGM is held on 30 September 2026 → AOC-4 is due by 30 October 2026

For OPCs: AOC-4 must be filed within 180 days from the close of the financial year (i.e., by 27 September 2026 for FY 2025-26), as OPCs are not required to hold an AGM.

COMPLETE LIST OF AOC-4 ATTACHMENTS

ALL COMPANIES MUST ATTACH:

- Balance Sheet as on 31 March 2026
- Statement of Profit & Loss for FY 2025-26
- Directors' Report (Section 134) with all mandatory annexures
- Auditor's Report (Standalone)
- Notes to Accounts / Significant Accounting Policies

CONDITIONAL ATTACHMENTS:

- Cash Flow Statement: Mandatory for all companies except OPCs, small companies, and dormant companies.
- CARO 2020 Report: Required for companies to which the Companies Auditor's Report Order 2020 applies (see below).
- Consolidated Financial Statements: Required if company has subsidiaries or associates.
- AOC-1: Statement of subsidiaries, associates, joint ventures (if applicable).
- AOC-2: Related party disclosure under Section 188 (attached to Directors' Report).
- Secretarial Audit Report (MR-3): Required for listed companies and certain unlisted public companies.
- CSR Report: Required if CSR provisions apply (Section 135).

DIRECTORS' REPORT — MANDATORY CONTENTS (SECTION 134)

The Directors' Report is a mandatory attachment to AOC-4. Under Section 134 of the Companies Act 2013 read with Companies (Accounts) Rules 2014, it must include:

- State of company's affairs (overview of business)
- Transfer to reserves
- Amount recommended as dividend (if any)
- Material changes affecting the company's financial position after the financial year
- Conservation of energy, technology absorption, foreign exchange earnings (Form A and B)
- Risk management policy statement
- Statement on Internal Financial Controls
- Related party transaction disclosure (AOC-2)
- Number of Board meetings held during the year
- Directors' Responsibility Statement (Section 134(3)(c))
- Corporate Governance Report (listed companies)
- CSR activities and amount spent (if applicable)
- Extract of Annual Return (earlier MGT-9, now web link to annual return)

WHAT IS CARO 2020 AND WHO MUST COMPLY?

CARO 2020 (Companies Auditor's Report Order 2020) requires the statutory auditor to report on specific matters in a separate report attached to the Audit Report. It applies to all companies EXCEPT:

- Banking companies
- Insurance companies
- Section 8 (not-for-profit) companies
- One Person Companies (OPCs)
- Small companies
- Private limited companies where ALL three conditions are met: paid-up capital ≤ ₹1 crore AND borrowings from banks/FIs ≤ ₹1 crore AND turnover ≤ ₹10 crore

If your private limited company has borrowings from a bank exceeding ₹1 crore, or turnover exceeding ₹10 crore, CARO 2020 applies.

AOC-4 LATE FILING FEES (FY 2025-26)

Under Section 403 of the Companies Act 2013, filing AOC-4 after the due date attracts additional fees of ₹100 per day — there is no cap. The fee accrues from the day after the due date until the date of actual filing.

Real example: If AOC-4 due date is 30 October 2026 and you file on 30 November 2026, the delay is 31 days. Late fee = 31 × ₹100 = ₹3,100 (in addition to the normal filing fee).

What to do: Use the MCA Penalty Calculator on ComplianceSearch.in to calculate the exact late fee for any MCA form by entering your filing date and due date.

STEP-BY-STEP AOC-4 FILING PROCESS

STEP #1 — Hold the AGM on or before 30 September 2026. Pass the resolution for adoption of financial statements.

STEP #2 — Prepare all financial statements and get them audited by the statutory auditor. Obtain the signed Auditor's Report.

STEP #3 — Prepare the Directors' Report with all mandatory annexures. Get it approved by the Board.

STEP #4 — Generate all AOC-4 attachment documents using ComplianceSearch.in Annual Filing tool — Directors' Report, Board's Report, Audit Report format, CARO 2020, AOC-1, AOC-2, Cash Flow Statement.

STEP #5 — Log in to MCA V3 portal. Navigate to: e-Filing → Company Forms Submission → AOC-4.

STEP #6 — Enter CIN, financial year details, and upload all attachments in PDF format. Affix DSC of Director and file. Note the SRN for records.

THE BOTTOM LINE

AOC-4 for FY 2025-26 is due within 30 days of AGM — typically by 30 October 2026 if AGM is held on 30 September 2026. The attachments include the Directors' Report, Audit Report, CARO 2020 (if applicable), Cash Flow Statement, and subsidiary disclosures. Use the free Annual Filing Attachments Generator on ComplianceSearch.in to generate all documents in minutes — no manual drafting required.`,
},

// ─────────────────────────────────────────────────────────
// 4. MCA Late Filing Fee Guide
// ─────────────────────────────────────────────────────────
{
  title:    "MCA Late Filing Fees — AOC-4, MGT-7, DIR-3 KYC, ADT-1 Penalty Guide (2025-26)",
  slug:     "mca-late-filing-fees-aoc4-mgt7-dir3-kyc-penalty-2025-26",
  category: "mca_roc",
  tags:     "MCA late fee, ROC penalty, AOC-4 late fee, MGT-7 additional fee, DIR-3 KYC penalty, Section 403",
  excerpt:  "Complete guide to MCA/ROC late filing fees for FY 2025-26 — AOC-4, MGT-7, MGT-7A, DIR-3 KYC, ADT-1, DIR-12 additional fees under Section 403 with examples and how to calculate using the penalty calculator.",
  content: `Filing MCA forms late is expensive. Under Section 403 of the Companies Act 2013, every delayed ROC filing attracts additional fees that accrue day by day — with no cap. Missing AOC-4 or MGT-7 deadlines for even a month can cost thousands of rupees in additional fees. This guide covers all major MCA forms, their due dates, and the late fee structure for FY 2025-26.

HOW ARE MCA LATE FEES CALCULATED?

Under Section 403 of the Companies Act 2013, the additional fee for late filing of any form is ₹100 per day of delay. This applies from the day after the due date until the date of actual filing.

Normal filing fee (prescribed fee for the form based on authorised share capital) is charged separately. The additional fee is charged over and above the normal fee.

Real example: AOC-4 due date is 30 October 2026. Filed on 15 December 2026 (46 days late). Additional fee = 46 × ₹100 = ₹4,600 (plus normal filing fee).

AOC-4 — ANNUAL FINANCIAL STATEMENTS

Due date: Within 30 days from the date of Annual General Meeting (AGM).

For FY 2025-26 (if AGM held on 30 September 2026): Due by 30 October 2026.

Late fee: ₹100 per day from 31 October 2026 onwards.

For OPCs: Within 180 days from close of financial year (by 27 September 2026 for FY 2025-26).

MGT-7 AND MGT-7A — ANNUAL RETURN

MGT-7 (companies other than OPCs and small companies): Within 60 days from the date of AGM. If AGM is 30 September 2026 → MGT-7 due by 29 November 2026.

MGT-7A (OPCs and small companies): Within 60 days from the end of financial year. For FY 2025-26 → due by 29 May 2026.

Late fee: ₹100 per day from the day after due date.

DIR-3 KYC — DIRECTOR KYC

Every director who has been allotted a DIN must file DIR-3 KYC annually.

Due date for DIN holders: 30 September of each year (for directors who had DIN as on 31 March).

For FY 2025-26: DIR-3 KYC due by 30 September 2026.

Late fee: If filed after 30 September — a flat penalty of ₹5,000 is levied (not per-day). The DIN is marked as "Deactivated" until KYC is completed and ₹5,000 is paid. A deactivated DIN director cannot sign any MCA form.

ADT-1 — AUDITOR APPOINTMENT

Due date: Within 15 days from the conclusion of the AGM (for auditor appointed at AGM under Section 139(1)).

For first auditors appointed by Board within 30 days of incorporation (Section 139(6)): ADT-1 must be filed within 30 days of the Board meeting.

Late fee: ₹100 per day. Additionally, non-filing of ADT-1 within the prescribed time is compoundable under Section 440.

DIR-12 — DIRECTOR APPOINTMENT / CESSATION

Due date: Within 30 days of the date of appointment or cessation of director.

Late fee: ₹100 per day. Delay can lead to DIR-12 rejection by ROC or additional scrutiny.

MGT-14 — FILING OF SPECIAL RESOLUTIONS

Due date: Within 30 days of passing the special resolution at EGM or AGM.

Applicable for: Special resolutions (MOA/AOA amendment, share capital increase, company name change, etc.).

Late fee: ₹100 per day.

DPT-3 — DEPOSIT / LOAN RETURN

Due date: 30 June of every year (for loans/deposits received as of 31 March).

For FY 2025-26: DPT-3 due by 30 June 2026.

Late fee: ₹100 per day from 1 July 2026.

STRIKE OFF RISK — WHEN IS IT TRIGGERED?

Under Section 248 of the Companies Act 2013, if a company fails to file AOC-4 or MGT-7 for 2 consecutive financial years, it can be struck off from the register of companies by the ROC. The company's DIN holders may also be disqualified under Section 164(2) if the company defaults on annual filings for 3 consecutive years.

What to do: Never let annual filings lapse for 2+ years. File even with late fees — it is always cheaper than strike off and reinstatement.

HOW TO CALCULATE YOUR EXACT LATE FEE

STEP #1 — Identify the specific MCA form and its due date.

STEP #2 — Note the actual date of filing (or today's date for an estimate).

STEP #3 — Calculate the number of days of delay (from the day after due date to filing date).

STEP #4 — Multiply days × ₹100.

STEP #5 — Add the normal filing fee (based on authorised share capital from MCA fee schedule).

What to do: Use the MCA Penalty Calculator on ComplianceSearch.in — enter the form, company type, and date, and get the exact additional fee calculated instantly, along with a slab-wise breakdown.

THE BOTTOM LINE

MCA late fees are ₹100 per day with no upper cap — a 6-month delay on AOC-4 costs ₹18,000 in additional fees alone. The most important deadlines: AOC-4 within 30 days of AGM, MGT-7 within 60 days of AGM, DIR-3 KYC by 30 September every year, ADT-1 within 15 days of AGM. Use the free MCA Penalty Calculator on ComplianceSearch.in to compute your exact late fee for any form instantly.`,
},

// ─────────────────────────────────────────────────────────
// 5. GST Registration Guide
// ─────────────────────────────────────────────────────────
{
  title:    "GST Registration — When Is It Mandatory? Complete Eligibility Guide for 2025-26",
  slug:     "gst-registration-mandatory-eligibility-threshold-india-2025-26",
  category: "gst",
  tags:     "GST registration, GST threshold, GST eligibility, GSTIN, GST mandatory India, aggregate turnover",
  excerpt:  "Complete guide to GST registration eligibility for 2025-26 — turnover thresholds for goods and services, mandatory registration regardless of turnover, special category states, Composition Scheme, and penalty for non-registration.",
  content: `GST registration is not optional for most businesses in India — crossing the turnover threshold makes it compulsory, and certain categories of businesses must register regardless of turnover. This guide explains exactly when GST registration is mandatory, the threshold limits for FY 2025-26, and the consequences of not registering.

WHAT IS GST REGISTRATION?

GST registration is the process of enrolling your business under the Goods and Services Tax Act 2017. Upon registration, you receive a 15-digit GSTIN (Goods and Services Tax Identification Number). Once registered, you must:

- Collect GST from customers on taxable supplies
- File monthly/quarterly GST returns (GSTR-1, GSTR-3B)
- Pay GST to the government by the due dates
- Maintain GST-compliant invoices and records

TURNOVER THRESHOLDS FOR 2025-26

The turnover threshold for mandatory GST registration depends on whether your business supplies goods or services, and which state you operate in.

REGULAR STATES — GOODS SUPPLIERS:

Turnover exceeding ₹40 lakh in a financial year → mandatory registration. This applies to most states including Maharashtra, Delhi, Karnataka, Tamil Nadu, Gujarat, Rajasthan, Uttar Pradesh, etc.

REGULAR STATES — SERVICE SUPPLIERS:

Turnover exceeding ₹20 lakh in a financial year → mandatory registration.

SPECIAL CATEGORY STATES:

For states in the Northeast (Manipur, Mizoram, Nagaland, Tripura) and hilly states (Uttarakhand, Himachal Pradesh), the threshold is lower:

- Goods: ₹20 lakh
- Services: ₹10 lakh

Note: Aggregate turnover includes all taxable, exempt, and nil-rated supplies under the same PAN across India, but excludes supplies on which GST is paid under reverse charge.

MANDATORY REGISTRATION REGARDLESS OF TURNOVER

Certain businesses must register for GST even if their turnover is below the threshold:

- Inter-state supply of taxable goods or services (any amount)
- E-commerce operators (Amazon, Flipkart sellers who sell through the platform must register in every state of supply)
- Non-resident taxable persons making taxable supplies
- Persons required to pay tax under reverse charge mechanism (RCM)
- Input Service Distributors (ISDs)
- Persons who supply goods through an e-commerce operator
- Casual taxable persons (those making occasional supplies in states where they don't have a fixed place of business)
- Persons who deduct TDS under Section 51

Real example: A freelancer based in Mumbai earns ₹15 lakh from clients in Delhi and Bengaluru. Since they provide services inter-state, GST registration is mandatory regardless of the ₹20 lakh threshold.

COMPOSITION SCHEME — SMALL BUSINESS ALTERNATIVE

Businesses with aggregate turnover up to ₹1.5 crore (₹75 lakh for special category states) can opt for the Composition Scheme under Section 10 of CGST Act. Under Composition Scheme:

- Pay GST at a flat rate (1% for manufacturers, 5% for restaurants, 6% for other service providers)
- File quarterly return (CMP-08) and annual return (GSTR-4)
- Cannot charge GST on invoices to customers
- Cannot claim Input Tax Credit (ITC)
- Cannot make inter-state supplies

What to do: If your turnover is between ₹20-₹1.5 crore for services, evaluate whether Composition Scheme is beneficial — it reduces compliance burden but restricts ITC claims.

GST REGISTRATION PROCEDURE

STEP #1 — Visit the GST portal: www.gst.gov.in → Registration → New Registration.

STEP #2 — Fill Part A: Mobile number, email ID, state, PAN. An OTP will be sent for verification. Note the TRN (Temporary Reference Number).

STEP #3 — Fill Part B within 15 days of generating TRN: Business details, principal place of business address, bank account details, authorised signatory details, and upload documents.

STEP #4 — Documents required: PAN card of business/proprietor, Aadhaar card, business registration proof (certificate of incorporation for companies, partnership deed for firms), address proof of principal place of business (rent agreement / electricity bill), bank statement / cancelled cheque, and passport-size photograph of the authorised signatory.

STEP #5 — Submit with DSC (for companies and LLPs) or e-Signature / OTP. GSTIN is typically allotted within 3-7 working days after verification.

PENALTY FOR NOT REGISTERING

Under Section 122 of the CGST Act 2017, a person who supplies goods or services without GST registration (when required) is liable to a penalty of:

- ₹10,000 or
- The amount of tax evaded (whichever is higher)

Additionally, the GST officer can assess tax liability for the period of non-registration and demand the full GST amount plus 18% interest per annum plus penalty.

GST RETURN FILING AFTER REGISTRATION

Once registered, the main returns to file are:

GSTR-1: Outward supply details — filed monthly (if turnover > ₹5 crore) or quarterly (QRMP scheme). Due: 11th of next month (monthly) / 13th of month after quarter (quarterly).

GSTR-3B: Summary return with tax payment — filed monthly or quarterly. Due: 20th of next month.

GSTR-9: Annual return — due by 31 December of next financial year.

Use the GST Due Dates calendar on ComplianceSearch.in to see all GSTR-1 and GSTR-3B deadlines for FY 2025-26 in one place.

THE BOTTOM LINE

GST registration is mandatory if your turnover exceeds ₹40 lakh (goods) or ₹20 lakh (services) in regular states, or if you make inter-state supplies regardless of turnover. Register within 30 days of crossing the threshold to avoid penalties. Use the free Compliance Checker on ComplianceSearch.in — it checks GST registration requirement (and 76 other compliance rules) based on your business profile and gives you a personalised compliance list in 2 minutes.`,
},

]; // end of posts array

async function main() {
  console.log(`Inserting ${posts.length} blog posts...`);

  for (const p of posts) {
    // Check if slug already exists
    const existing = await prisma.blogPost.findUnique({ where: { slug: p.slug } });
    if (existing) {
      console.log(`  SKIP (already exists): ${p.slug}`);
      continue;
    }

    await prisma.blogPost.create({
      data: {
        ...p,
        ...AUTHOR,
        status:      "approved",
        publishedAt: new Date(),
      },
    });
    console.log(`  ✓ Inserted: ${p.title.slice(0, 60)}…`);
  }

  console.log("Done.");
}

main()
  .catch(e => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
