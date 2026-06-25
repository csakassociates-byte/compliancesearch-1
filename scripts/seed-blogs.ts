import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import * as dotenv from "dotenv";
import * as path from "path";

dotenv.config({ path: path.join(__dirname, "../.env.local") });

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! });
const prisma = new PrismaClient({ adapter } as any);

function toSlug(title: string): string {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .slice(0, 80);
}

const AUTHOR = "Okey Bhaskar";
const EMAIL  = "csakassociates@gmail.com";
const PHONE  = "9999999999";

const posts = [
  // ─────────── MCA / ROC ───────────
  {
    title: "AOC-4 Attachments: Complete Checklist for FY 2025-26",
    category: "mca_roc",
    tags: "AOC-4,annual filing,attachments,FY 2025-26,ROC",
    excerpt: "Planning to file AOC-4 for FY 2025-26? Here is the complete list of mandatory and conditional attachments required — Board Report, Audit Report, Notes on Accounts and more.",
    content: `AOC-4 is the form filed with the Registrar of Companies (ROC) for submitting a company's financial statements. It must be filed within 30 days of the Annual General Meeting (AGM). For FY 2025-26, the AGM deadline is 30 September 2026, making the AOC-4 due date 29 October 2026.

But filing AOC-4 is not just uploading a balance sheet. It requires a set of attachments — and missing any one of them can lead to the form being rejected or returned by the ROC.

## Mandatory AOC-4 Attachments

The following documents are mandatory for all companies (except OPCs in certain cases):

• Board Report (Director's Report) — prepared under Section 134 of Companies Act 2013
• Auditor's Report — prepared by the statutory auditor; includes CARO 2020 reporting for eligible companies
• Balance Sheet — as at 31 March 2026
• Statement of Profit and Loss — for the year ended 31 March 2026
• Notes to Accounts — detailed notes forming part of financial statements
• Statement of Changes in Equity (for companies following Ind AS)

## Conditional AOC-4 Attachments

These are required only if the condition applies to your company:

• Cash Flow Statement — mandatory for Section 8 companies, companies with paid-up capital ≥ ₹50 crore, or turnover ≥ ₹250 crore; and all companies following Ind AS
• AOC-1 (Statement of Subsidiary Companies) — required if the company has any subsidiary, associate company, or joint venture under Section 129(3)
• AOC-2 (Related Party Disclosure) — required if the company has entered into contracts or arrangements with related parties that are not at arm's length, under Section 134(3)(h) read with Section 188

## About the Board Report

The Board Report (Director's Report) under Section 134 is one of the most important attachments. For FY 2025-26, it must include:

• Extract of Annual Return (or web link to MGT-7 once filed)
• Number of board meetings held during the year
• Directors' Responsibility Statement — confirming applicable accounting standards, internal controls, and going concern basis
• Explanations on auditor's qualifications (if any)
• Details of related party transactions (with reference to AOC-2)
• Risk management policy
• CSR report (if CSR is applicable under Section 135)
• Details of loans, guarantees, investments under Section 186
• Energy conservation, technology absorption, foreign exchange (Rule 8 of Companies (Accounts) Rules)
• Statement on ESOP/ESPS if applicable
• Secretarial Audit Report (MR-3) — mandatory for listed companies and certain unlisted companies

## CARO 2020 in the Audit Report

The Companies (Auditor's Report) Order 2020 (CARO 2020) applies to most companies except private limited companies meeting all three conditions: (a) paid-up capital + reserves ≤ ₹1 crore, (b) total borrowings from banks/FIs ≤ ₹1 crore, (c) total revenue ≤ ₹10 crore. If CARO applies, the auditor must include a separate paragraph in the audit report addressing 21 specific reporting areas.

## Late Filing Penalty

Failing to file AOC-4 on time attracts additional fees:

• Up to 30 days late: 2× normal filing fee
• 30–60 days: 4× normal fee
• 60–90 days: 6× normal fee
• 90–180 days: 10× normal fee
• Beyond 180 days: 12× normal fee

Beyond 270 days, Section 454 compounding proceedings may apply. The additional fees can quickly add up to ₹50,000–₹1,00,000 for delays of 6+ months.

---

What to do: Use ComplianceSearch.in's free Annual Filing Attachments Generator to generate all AOC-4 attachments — Board Report, Audit Report, Notes on Accounts, and more — in under 2 minutes per company.`,
    daysAgo: 2,
  },

  {
    title: "MGT-7 vs MGT-7A: Which Annual Return Should Your Company File?",
    category: "mca_roc",
    tags: "MGT-7,MGT-7A,annual return,small company,OPC,FY 2025-26",
    excerpt: "MGT-7 or MGT-7A — many companies and their CAs get confused about which annual return to file. Here is a clear guide on eligibility, differences, and due dates for FY 2025-26.",
    content: `The Annual Return is a statutory filing under Section 92 of Companies Act 2013. For private limited companies, there are two forms: MGT-7 (full annual return) and MGT-7A (abridged annual return). Choosing the wrong form is a common error — and it can lead to rejection or a notice from the ROC.

## What is MGT-7?

MGT-7 is the full Annual Return filed by private limited companies that do not qualify as "Small Companies" or One Person Companies. It includes detailed information about:

• Shareholding pattern — all shareholders with names, addresses, PAN
• Debenture holders and other securities
• Directors — all directors with DIN, date of appointment, resignation
• Key Managerial Personnel (KMP)
• Meetings held — board meetings, general meetings
• Remuneration of directors and KMPs
• Penalties and punishment during the year
• Related party relationships
• Certification by Company Secretary

MGT-7 must be filed within 60 days of the AGM. For FY 2025-26, with AGM deadline at 30 September 2026, the MGT-7 due date is 29 November 2026.

## What is MGT-7A?

MGT-7A is the abridged (simplified) Annual Return introduced in 2021 for Small Companies and OPCs. It has fewer disclosure requirements compared to MGT-7, reducing the compliance burden for smaller entities.

MGT-7A can be signed by a single director (CS not mandatory).

## Who Can File MGT-7A?

A company qualifies as a "Small Company" under Section 2(85) if:

• Paid-up share capital does NOT exceed ₹2 crore, AND
• Turnover does NOT exceed ₹20 crore

One Person Companies (OPCs) always file MGT-7A regardless of size.

Important: The company must satisfy both conditions simultaneously. If either limit is exceeded, it must file MGT-7.

## Companies That Cannot File MGT-7A

Even if a company meets the Small Company criteria, the following cannot use MGT-7A:

• Holding or subsidiary company of a public company
• Companies registered under Section 8 (not-for-profit)
• Companies governed by any special act

## Key Differences at a Glance

• MGT-7: Full shareholding pattern with all details; requires CS certification if turnover > ₹2 crore
• MGT-7A: Simplified format; single director signature sufficient
• Due date: Same — 60 days from AGM — for both forms

## What Happens If You File the Wrong Form?

Filing MGT-7 when you should file MGT-7A (or vice versa) constitutes a defective filing. The ROC can issue a notice requiring you to refile. This may also trigger additional fees for the period of delay.

## Due Date for FY 2025-26

• AGM: Must be held by 30 September 2026
• MGT-7/7A due date: 29 November 2026 (60 days from AGM)
• Late fee: 2× to 12× normal fee depending on delay period

---

What to do: ComplianceSearch.in's Annual Filing Generator automatically detects your company type (Small Company, OPC, or regular Pvt Ltd) and generates the correct MGT-7 or MGT-7A attachment — no manual checking required.`,
    daysAgo: 4,
  },

  {
    title: "Director's Report (Board Report) Format for FY 2025-26 — Complete Guide",
    category: "mca_roc",
    tags: "director report,board report,Section 134,FY 2025-26,annual filing",
    excerpt: "The Director's Report (Board Report) under Section 134 is the most important AOC-4 attachment. Here is a complete guide to what must be included for FY 2025-26, with format requirements.",
    content: `The Director's Report — also called the Board Report — is a mandatory disclosure document that directors must present to shareholders at the Annual General Meeting. It is the most comprehensive attachment to AOC-4 and must comply with Section 134 of the Companies Act 2013 and the Companies (Accounts) Rules, 2014.

## Legal Requirement

Under Section 134(1), the Board of Directors must attach the Director's Report to every financial statement laid before the company at an AGM. The report must be signed by the Chairperson (if authorised by the Board), or by at least two directors including the Managing Director.

## Mandatory Contents of Board Report — FY 2025-26

## 1. Financial Performance Summary

A brief overview of financial performance — revenue, profit/loss, key financial ratios — comparing FY 2025-26 with FY 2024-25.

## 2. Dividend

If any dividend was declared or recommended for FY 2025-26, the amount and percentage must be stated. If no dividend was declared, the reason must be given.

## 3. Transfer to Reserves

Any amount transferred to General Reserve or any specific reserve during the year.

## 4. Directors' Responsibility Statement

This is a statutory declaration under Section 134(5) confirming:

• Applicable accounting standards have been followed
• Accounting policies are consistent and proper
• Sufficient care has been taken to maintain adequate accounting records
• Financial statements have been prepared on a going concern basis
• Adequate internal financial controls are in place
• Proper systems for legal compliance have been devised

## 5. Number of Board Meetings

Total number of board meetings held during FY 2025-26, with dates. The minimum frequency: at least one meeting every quarter, with maximum gap of 120 days between consecutive meetings.

## 6. Audit Committee Details

Composition of the Audit Committee, number of meetings, and whether any recommendations were not accepted by the Board (if so, reasons must be given).

## 7. Related Party Transactions

Particulars of contracts/arrangements with related parties under Section 188. If such transactions are at arm's length and in ordinary course of business, they may be described briefly. Non-arm's-length transactions must be disclosed in AOC-2 (attached separately).

## 8. Details of Loans, Guarantees, Investments (Section 186)

Particulars of loans given, guarantees provided, and investments made during FY 2025-26 under Section 186.

## 9. Risk Management

Description of risk management policy and key risks identified during the year.

## 10. Internal Financial Controls

Board's statement on adequacy of internal financial controls and whether such controls are operating effectively.

## 11. Subsidiary, Associate and Joint Venture Companies

Performance highlights of subsidiaries, associates, and JVs. A statement in Form AOC-1 must be annexed.

## 12. Conservation of Energy, Technology Absorption, Foreign Exchange (Rule 8)

• Energy conservation measures taken and their impact
• Technology absorption, adaptation, and innovation
• Foreign exchange earnings and outgo

## 13. Annual Return

The web address where the Annual Return (MGT-7/7A) has been placed on the company's website, or extract in Form MGT-9. Note: Since the MGT-9 requirement was deleted (effective 2020-21), companies now simply provide the web link.

## 14. CSR Report

Applicable if the company meets any of these thresholds: Net worth ≥ ₹500 crore, or Turnover ≥ ₹1,000 crore, or Net profit ≥ ₹5 crore in any of the 3 preceding FYs. The CSR Report in the prescribed format must be annexed.

## 15. Secretarial Audit Report (Form MR-3)

Mandatory for: (a) listed companies, (b) unlisted public companies with paid-up capital ≥ ₹50 crore or turnover ≥ ₹250 crore, and (c) every company having outstanding loans/borrowings/debentures/deposits > ₹100 crore.

## 16. Details of Employees

Details of employees drawing remuneration above the threshold under Rule 5 of Companies (Appointment and Remuneration of Managerial Personnel) Rules, 2014.

## For Small Companies and OPCs

Section 134(3)(p) — statement on annual evaluation of board performance — does not apply to OPCs and Small Companies. Similarly, certain other sub-clauses of 134(3) have relaxations.

---

What to do: ComplianceSearch.in generates the complete Board Report draft in the correct format for FY 2025-26 — including all mandatory sections, Directors' Responsibility Statement, and energy conservation disclosures. Free for CAs and CSs.`,
    daysAgo: 6,
  },

  {
    title: "DIR-3 KYC: Due Date, Process, and Penalty for Non-Filing in 2025-26",
    category: "mca_roc",
    tags: "DIR-3 KYC,DIN,due date,penalty,MCA,FY 2025-26",
    excerpt: "Every director with a DIN must file DIR-3 KYC every year. Missing the August deadline deactivates your DIN and attracts ₹5,000 penalty. Here is everything you need to know.",
    content: `DIR-3 KYC is an annual mandatory filing for every individual who holds a Director Identification Number (DIN), regardless of whether they are currently a director in any company. Failure to file by the due date leads to deactivation of the DIN and a late fee of ₹5,000 to reactivate.

## Why Was DIR-3 KYC Introduced?

The Ministry of Corporate Affairs (MCA) introduced DIR-3 KYC in 2018 to:

• Verify and update the contact details of all DIN holders
• Identify and deactivate "ghost" DINs (those not in active use or obtained fraudulently)
• Ensure mobile numbers and email IDs in MCA records are current and verified with OTP

## Who Must File DIR-3 KYC?

Every DIN holder must file DIR-3 KYC, including:

• Active directors in any company
• Retired directors who retain their DIN
• Directors who have resigned but not surrendered their DIN
• Partners/designated partners of LLPs who hold DINs

## Two Types of KYC Filing

## DIR-3 KYC (Web-based)

For directors who have already filed DIR-3 KYC in a previous year and where no details have changed. This is a simpler web-based form requiring only OTP verification on the registered mobile and email. No DSC needed.

## DIR-3 KYC (e-Form)

For first-time filers or directors who need to update their details (mobile number, email, address, PAN, Aadhaar). This form requires self-attestation and can optionally be certified by a CA or CS.

## Due Date for FY 2025-26

• Annual due date: 30 September 2026 (updated deadline — was 31 August previously; check MCA notifications as dates can change)
• Note: MCA has in past years extended the deadline — always check the official MCA portal for the current year's notification

For practical planning, treat 31 August as the safe deadline to avoid any last-minute rush.

## Penalty for Non-Filing

If DIR-3 KYC is not filed by the due date:

• DIN is marked as "Deactivated due to non-filing of DIR-3 KYC" on the MCA portal
• A late fee of ₹5,000 is payable to reactivate the DIN
• During deactivation, the director cannot be appointed in any company, and any filing with that DIN on MCA V3 will be rejected

## Process to File DIR-3 KYC

• Log in to MCA V3 portal (mca.gov.in)
• Go to e-Filing → Company Forms → DIR-3 KYC (or DIR-3 KYC Web)
• Verify details — name, father's name, date of birth, PAN, Aadhaar, mobile, email
• Enter OTP sent to registered mobile and email
• Submit (attach DSC if using e-form)
• Fees: Nil if filed before due date; ₹5,000 if filed after deactivation

## Common Errors to Avoid

• Entering wrong PAN or Aadhaar details — causes rejection
• Mobile number not linked to Aadhaar — OTP verification will fail
• Using expired DSC — ensure DSC is valid before filing e-form

---

What to do: Set a reminder for 31 August every year for DIR-3 KYC. Use the ComplianceSearch.in Compliance Calendar to track all MCA due dates including DIR-3 KYC, ADT-1, AOC-4, and MGT-7 in one place.`,
    daysAgo: 8,
  },

  {
    title: "Private Limited Company Annual Compliance Checklist for FY 2025-26",
    category: "mca_roc",
    tags: "Pvt Ltd,annual compliance,checklist,FY 2025-26,ROC,MCA",
    excerpt: "Running a private limited company in India? Here is the complete annual compliance checklist for FY 2025-26 — every filing, meeting, and deadline you must not miss.",
    content: `A private limited company in India has multiple mandatory compliance obligations every year. Missing any of these can attract significant penalties under the Companies Act 2013, income tax laws, GST, and labour laws. This checklist covers everything a typical Pvt Ltd must do in FY 2025-26.

## MCA / ROC Compliance

## Board Meetings
• Minimum 4 board meetings per year
• Maximum gap between consecutive meetings: 120 days
• Notice period: 7 days (minimum) before each meeting
• Quorum: 1/3rd of total directors or 2 directors, whichever is higher
• Minutes: Must be prepared within 30 days and signed by Chairman

## Annual General Meeting (AGM)
• Must be held by 30 September 2026 for FY 2025-26
• Notice period: 21 days clear days (except when all members consent to shorter notice)
• Quorum: 2 members personally present (or 5 members for public company)
• Business: Adoption of financial statements, dividend declaration, director retirement/reappointment, auditor reappointment

## Annual Filings with ROC
• AOC-4 — Financial statements: Within 30 days of AGM (by 29 October 2026)
• MGT-7 / MGT-7A — Annual return: Within 60 days of AGM (by 29 November 2026)
• ADT-1 — Auditor appointment: Within 15 days of AGM (by 15 October 2026)
• DIR-3 KYC — For all directors: By 31 August 2026

## Other ROC Filings (as applicable)
• DPT-3 — Return of deposits: By 30 June annually (covers loans from shareholders, directors etc.)
• BEN-2 — Significant Beneficial Owner disclosure
• INC-20A — Commencement of business (one-time, for companies incorporated after Nov 2019)

## Income Tax Compliance

• Advance Tax: Q1 by 15 Jun, Q2 by 15 Sep, Q3 by 15 Dec, Q4 by 15 Mar 2026
• TDS deductions: Monthly deduction, quarterly return filing (24Q, 26Q)
• TDS certificates: Form 16A by 15 days after end of each quarter
• Income Tax Return (ITR-6): By 31 October 2026 (if tax audit applicable)
• Tax Audit Report (Form 3CB + 3CD): By 30 September 2026 if turnover exceeds ₹1 crore
• Transfer Pricing Audit: By 31 October if international transactions exist

## GST Compliance

• GSTR-1: Monthly by 11th, or quarterly by 13th (if turnover ≤ ₹5 crore under QRMP)
• GSTR-3B: Monthly by 20th, or quarterly under QRMP scheme
• GSTR-9 (Annual Return): By 31 December 2026 for FY 2025-26 (if turnover > ₹2 crore)
• GSTR-9C (Reconciliation): By 31 December 2026 (if turnover > ₹5 crore)

## Labour Law Compliance

• PF ECR (Electronic Challan-cum-Return): Monthly by 15th of following month
• ESIC Return: Monthly by 15th + half-yearly return (April and October)
• Professional Tax: Monthly/quarterly challan depending on state
• TDS on salary (Section 192): Monthly deduction + Form 24Q quarterly

## Key Penalty Reference

• Late AGM: Up to ₹1,00,000 fine on company + ₹5,000 per day of default on directors
• Late AOC-4: 2× to 12× additional filing fee
• Late MGT-7: 2× to 12× additional filing fee
• Late DPT-3: ₹5,000 per day of default (up to ₹25 lakhs)
• Late PF: 12% interest + damages up to 25% of unpaid amount

---

What to do: Visit ComplianceSearch.in to get your personalised compliance checklist based on your company's specific profile — turnover, employees, industry, and state.`,
    daysAgo: 10,
  },

  {
    title: "AGM for Private Limited Company: Everything You Need to Know",
    category: "mca_roc",
    tags: "AGM,annual general meeting,Section 96,Companies Act,private limited",
    excerpt: "Every private limited company must hold an AGM every year. Know the due date, notice requirements, quorum, mandatory agenda, and penalty for non-compliance.",
    content: `The Annual General Meeting (AGM) is a mandatory yearly meeting of the shareholders of a company. Under Section 96 of the Companies Act 2013, every company (other than a One Person Company) must hold an AGM each year. Non-compliance attracts serious penalties.

## When Must the AGM Be Held?

• First AGM: Within 9 months from the close of the first financial year (e.g., company incorporated in FY 2024-25 must hold first AGM by 31 December 2025)
• Subsequent AGMs: Within 6 months from the close of each financial year, i.e., by 30 September each year
• Gap between two AGMs: Must not exceed 15 months

For FY 2025-26 (April 2025 to March 2026), the AGM must be held by 30 September 2026.

## AGM Notice Requirements

Under Section 101 and Secretarial Standard SS-2:

• Notice must be sent to all directors, members, auditors, and debenture trustees
• Minimum 21 clear days before the meeting (not counting the day of sending or the day of meeting)
• Shorter notice allowed if consent of members holding ≥ 95% paid-up voting capital is obtained
• Notice must contain: date, time, venue, full text of special resolutions (if any), explanatory statement for special/ordinary businesses

## Mode of AGM

• Physical meeting: At the registered office or within the same city/town
• Video conferencing: Allowed under MCA rules (companies must maintain attendance register, minutes with Chairman signature)
• Members can attend via video call and vote (OTP-based or electronic)

## Quorum for AGM

• Private limited company: 2 members personally present (cannot be by proxy)
• If quorum not present within 30 minutes of appointed time, meeting is adjourned to same day next week at same time and place
• At adjourned meeting, any 2 members form the quorum

## Standard Agenda Items (Ordinary Business)

Under Section 102, the following are "ordinary business" at every AGM:

• Adoption of financial statements (balance sheet, P&L, cash flow) and Board's/Auditor's report
• Declaration of dividend (if any)
• Appointment/re-appointment of director retiring by rotation
• Appointment/re-appointment of auditors and fixing their remuneration

## Special Business

Any business other than the above is "special business" and requires a Special Notice and Explanatory Statement.

## Minutes of AGM

• Must be prepared within 30 days of the AGM
• Signed by the Chairman of that meeting or by the Chairman of the next general meeting
• Must comply with Secretarial Standard SS-2

## Penalty for Not Holding AGM

Under Section 99:

• Company: Fine of up to ₹1,00,000
• Every officer in default: Fine of up to ₹1,00,000
• Continuing default: Additional fine of ₹5,000 per day

The Regional Director can also call an AGM on a member's application if one is not held.

---

What to do: Generate SS-2 compliant AGM Minutes using ComplianceSearch.in's free AGM Minutes Generator. Fill in the meeting details, attendance, and agenda items — and download the minutes in under 2 minutes.`,
    daysAgo: 12,
  },

  {
    title: "What is CARO 2020? Applicability, Key Requirements and Audit Compliance",
    category: "mca_roc",
    tags: "CARO 2020,audit report,auditor,private limited,companies act",
    excerpt: "CARO 2020 requires auditors to report on 21 specific areas in the audit report. Know whether it applies to your company and what the auditor must report.",
    content: `The Companies (Auditor's Report) Order 2020 — commonly known as CARO 2020 — is an order issued by the Central Government under Section 143(11) of the Companies Act 2013. It specifies additional matters that company auditors must include in their audit report. CARO 2020 became effective from the financial year 2021-22.

## Why CARO 2020?

CARO 2020 replaced CARO 2016 and significantly expanded the reporting requirements. The objective is to improve audit quality, identify frauds, and ensure better disclosure of company financials. Auditors must report specific facts — not just give a clean or qualified opinion — under CARO.

## Who Does CARO 2020 Apply To?

CARO 2020 applies to ALL companies except those meeting ALL THREE of the following conditions simultaneously:

• Paid-up capital + free reserves + securities premium do NOT exceed ₹1 crore as at the balance sheet date
• Total borrowings from banks, financial institutions, and NBFCs do NOT exceed ₹1 crore at any point during the year
• Total revenue (turnover + other income) does NOT exceed ₹10 crore during the year

If your company exceeds ANY one of these thresholds, CARO 2020 applies.

Important: Banking companies, insurance companies, Section 8 companies, and one person companies are exempt from CARO 2020.

## 21 Areas Auditors Must Report Under CARO 2020

The key reporting areas include:

• Property, Plant and Equipment (PPE) — physical verification, title deeds, revaluation
• Inventories — physical verification, discrepancies
• Investments, loans, advances, guarantees given — whether terms are prejudicial to company
• Compliance with Section 185 (loans to directors) and Section 186 (investments/loans/guarantees)
• Public deposits — whether accepted in compliance with RBI directives and Chapter V of Companies Act
• Cost records — whether maintained as required by Central Government under Section 148(1)
• Statutory dues — whether TDS, GST, PF, ESI, customs, excise have been regularly deposited; arrears pending
• Unsecured loans — whether repayment schedule is regular; default or overdue interest
• Fraud or suspected fraud — whether any fraud noticed or reported
• Managerial remuneration — whether paid/provided in accordance with Section 197
• Nidhi company compliance (if applicable)
• Related party transactions — whether in accordance with Section 177 and 188
• Internal audit — whether applicable companies have appointed internal auditor
• Non-cash transactions with directors — Section 192 compliance
• RBI registration — whether NBFC registration is required

## CARO 2020 for Subsidiaries

If a holding company's audit report includes CARO remarks on any subsidiary, the subsidiary's auditor must also separately address the CARO matters on the consolidated financial statements. This is a new requirement under CARO 2020 that was not in CARO 2016.

## Practical Implication for Small Companies

Most small private limited companies (capital + reserves < ₹1 crore, borrowings < ₹1 crore, revenue < ₹10 crore) are exempt from CARO 2020. However, once ANY threshold is crossed, the full CARO reporting kicks in — there is no partial applicability.

---

What to do: If CARO 2020 applies to your company, ensure your auditor addresses all 21 reporting areas. Use ComplianceSearch.in's Annual Filing Generator to produce a CARO-compliant audit report attachment format.`,
    daysAgo: 15,
  },

  // ─────────── GST ───────────
  {
    title: "GST Registration in India: Who Must Register and How?",
    category: "gst",
    tags: "GST registration,threshold,mandatory,voluntary,GSTIN",
    excerpt: "Is your business required to register under GST? Here is a complete guide on who must register, turnover thresholds, documents required, and the registration process.",
    content: `GST (Goods and Services Tax) registration is mandatory for businesses crossing a specified turnover threshold in India. Operating without a GSTIN when registration is mandatory can lead to penalties up to ₹10,000 or 100% of the tax due — whichever is higher. Here is a complete guide.

## Mandatory Registration Thresholds

## Supply of Goods (Non-Special Category States)
• Annual aggregate turnover exceeds ₹40 lakhs: Mandatory registration

## Supply of Services (Non-Special Category States)
• Annual aggregate turnover exceeds ₹20 lakhs: Mandatory registration

## Special Category States (Arunachal Pradesh, Uttarakhand, Manipur, Meghalaya, Mizoram, Nagaland, Sikkim, Tripura, Himachal Pradesh, J&K)
• Goods: ₹20 lakhs threshold
• Services: ₹10 lakhs threshold

## Mandatory Registration Regardless of Turnover

The following must register under GST even if turnover is below the threshold:

• Any person making inter-state taxable supply of goods
• Casual taxable persons (those supplying goods/services occasionally in a state where they have no fixed establishment)
• Non-resident taxable persons
• Persons required to pay tax under reverse charge mechanism
• E-commerce operators (who facilitate supply) — mandatory regardless of turnover
• Suppliers through e-commerce platforms (aggregators like Amazon, Flipkart)
• Persons required to deduct TDS under GST (government entities, PSUs)
• Input Service Distributor (ISD)
• Persons supplying goods through e-commerce operators who are liable to collect TCS

## Voluntary Registration

A business with turnover below the threshold can voluntarily register for GST. Benefits include:

• Ability to collect GST from customers and claim input tax credit
• Required for B2B transactions where buyers want to claim ITC
• Credibility with larger corporate customers who prefer GST-registered vendors

## Documents Required for GST Registration

• PAN card of the business/owner
• Aadhaar card of proprietor/partners/directors
• Proof of business address — electricity bill/rent agreement
• Bank account details — cancelled cheque or bank statement
• Photograph of proprietor/authorised signatory
• Memorandum of Association (for companies) or Partnership Deed (for partnerships)
• Digital Signature Certificate (DSC) for companies and LLPs
• Board resolution authorising the signatory (for companies)

## Composition Scheme

Small businesses with annual aggregate turnover up to ₹1.5 crore (₹75 lakhs for special category states) can opt for the Composition Scheme — file quarterly returns, pay GST at a flat rate (1% for manufacturers, 5% for restaurants, 6% for service providers), and reduce compliance burden. However, composition dealers cannot collect GST from customers or claim ITC.

## Penalty for Non-Registration

If a person required to register under GST fails to do so:

• Penalty: ₹10,000 or the amount of tax evaded, whichever is higher
• The supply is treated as made without a valid registration
• Input tax credit on purchases cannot be claimed

---

What to do: Use ComplianceSearch.in's Compliance Checker to check whether GST registration is mandatory for your business based on your turnover, state, and type of supply.`,
    daysAgo: 18,
  },

  {
    title: "GSTR-1 vs GSTR-3B: Difference, Due Dates and How to File for FY 2025-26",
    category: "gst",
    tags: "GSTR-1,GSTR-3B,GST return,due date,FY 2025-26",
    excerpt: "Every GST registered business must file GSTR-1 and GSTR-3B regularly. Know the exact difference, what each covers, due dates for FY 2025-26, and common mistakes to avoid.",
    content: `For most GST-registered businesses in India, two returns form the core of monthly/quarterly compliance: GSTR-1 (outward supply statement) and GSTR-3B (summary return and tax payment). Understanding the difference between them — and filing them correctly — is essential to avoid notices, penalties, and blocked input tax credit.

## What is GSTR-1?

GSTR-1 is a statement of all outward supplies (sales) made by a GST-registered taxpayer during a tax period. It includes:

• B2B invoices — supply to registered businesses (by GSTIN)
• B2C large invoices — supply to unregistered persons above ₹2.5 lakhs (for inter-state)
• B2C small invoices — summary of small supplies to unregistered persons
• Export invoices — zero-rated supplies
• Credit notes and debit notes
• Amendments to previous period invoices

GSTR-1 does NOT involve any tax payment — it is only a disclosure of invoice details.

## What is GSTR-3B?

GSTR-3B is the monthly/quarterly summary return where a taxpayer:

• Reports aggregate outward supply (sales) — total values by tax rate
• Reports ITC (Input Tax Credit) claimed for the period
• Reports any reverse charge liability
• Pays the net GST liability (after setting off ITC)

GSTR-3B involves actual tax payment — the GST liability must be paid in cash/ITC before or while filing 3B.

## Key Difference

• GSTR-1: Invoice-level detail of sales; no tax payment
• GSTR-3B: Summary return; net tax payment; ITC set-off

The GSTR-2B auto-populated statement (generated from counterparty GSTR-1 filings) feeds into GSTR-3B for ITC claims. Always reconcile GSTR-2B with your purchase register before filing 3B.

## Due Dates for FY 2025-26

## Monthly Filers (Turnover > ₹5 crore or opted out of QRMP)
• GSTR-1: 11th of the following month
• GSTR-3B: 20th of the following month

## Quarterly Filers (QRMP Scheme — Turnover ≤ ₹5 crore)
• GSTR-1 Quarterly: 13th of month following the quarter
• Invoice Furnishing Facility (IFF): Optional monthly upload of B2B invoices by 13th
• GSTR-3B Quarterly: Last date of month following the quarter (28th/30th)
• Tax payment (PMT-06): First two months of quarter — by 25th of following month

## GSTR-9 Annual Return

In addition to monthly/quarterly returns, businesses with turnover > ₹2 crore must file GSTR-9 (Annual Return) by 31 December of the following year. Businesses with turnover > ₹5 crore must also file GSTR-9C (reconciliation statement, audited by CA/CMA).

## Consequences of Non-Filing

• Late fee: ₹50 per day (₹25 CGST + ₹25 SGST) for GSTR-3B; ₹100/day for nil returns
• For GSTR-1: ₹50 per day; nil filers ₹20 per day
• Filing of GSTR-3B is blocked if GSTR-1 has not been filed for the previous 2 months (monthly filers)
• ITC claims of your customers may be blocked if you don't file GSTR-1 correctly

---

What to do: Track all GST due dates for FY 2025-26 using ComplianceSearch.in's free GST Due Dates calendar — covers GSTR-1, GSTR-3B, GSTR-9, GSTR-9C, and all other GST filings month by month.`,
    daysAgo: 20,
  },

  {
    title: "Input Tax Credit (ITC) Under GST: Complete Rules and Eligibility for FY 2025-26",
    category: "gst",
    tags: "ITC,input tax credit,GST,Section 16,GSTR-2B,FY 2025-26",
    excerpt: "Input Tax Credit is the most valuable benefit of GST — but it comes with strict eligibility conditions. Know Section 16 conditions, blocked credits, and the GSTR-2B matching rule.",
    content: `Input Tax Credit (ITC) allows a GST-registered business to reduce its GST liability by the GST it has already paid on business purchases. In simple terms: if you pay ₹18,000 GST on a purchase, and collect ₹25,000 GST on your sales, your net GST payment to the government is only ₹7,000. Without ITC, you would pay ₹25,000.

## Conditions for Claiming ITC (Section 16)

To claim ITC, ALL of the following conditions must be satisfied:

• You are a registered taxpayer under GST
• You have a valid tax invoice or debit note from the supplier
• The goods/services have been received (delivery condition)
• The supplier has filed GSTR-1 and the invoice appears in your GSTR-2B
• You have paid the tax invoice value to the supplier (including GST) within 180 days from the date of invoice
• The goods/services are used for business purposes (not personal use)
• You have filed your GSTR-3B for the relevant period

## GSTR-2B — The New ITC Rule (Finance Act 2022)

From January 2022, ITC can only be claimed to the extent it appears in the taxpayer's GSTR-2B (auto-generated statement). GSTR-2B is generated monthly based on GSTR-1 filed by your suppliers.

This means: if your supplier has not filed GSTR-1 (or filed it incorrectly), the ITC will NOT appear in your GSTR-2B, and you cannot claim it — even if you have a valid tax invoice.

Always reconcile your purchase register with GSTR-2B before filing GSTR-3B.

## Blocked Credits (Section 17(5))

ITC is NOT available on the following, even if you have a valid invoice:

• Motor vehicles and conveyances (except if used for specified purposes — transport of goods, passenger transport business, driving school)
• Works contract services used for construction of immovable property (except plant & machinery)
• Goods/services used for personal consumption
• Food and beverages, outdoor catering, beauty treatment, health services, cosmetic surgery (except when used for re-supply or as part of composite supply)
• Club memberships, health and fitness centre fees
• Travel benefits extended to employees (leave travel, home travel concession)
• Goods lost, stolen, destroyed, written off, or given as gift/free samples

## ITC on Capital Goods

ITC on capital goods (machinery, equipment) can be claimed in the year of purchase — there is no requirement to spread it over multiple years. However, if the capital goods are used partly for exempt supplies, proportionate ITC reversal is required.

## Reversal of ITC

ITC must be reversed in the following situations:

• Payment to supplier not made within 180 days (ITC must be reversed; can be re-claimed on payment)
• Goods/services used for exempt or non-business purposes (Rule 42/43 proportionate reversal)
• Filing GSTR-3B late does not automatically reverse ITC, but interest applies on delayed payment of tax

## ITC Claim Deadline

For FY 2025-26 invoices, ITC must be claimed by the earlier of: (a) 30 November 2026 (due date of GSTR-3B for October 2026), or (b) the date of filing annual return GSTR-9.

---

What to do: Check your GSTR-2B every month before filing GSTR-3B. If suppliers are not filing their GSTR-1, follow up with them — unclaimed ITC increases your GST cost.`,
    daysAgo: 22,
  },

  {
    title: "GST Late Fee and Interest: How to Calculate for FY 2025-26",
    category: "gst",
    tags: "GST late fee,interest,GSTR-3B,penalty,Section 47,Section 50",
    excerpt: "Filed a GST return late? Here is exactly how to calculate the late fee and interest for GSTR-1, GSTR-3B, and GSTR-9 — with formula, rates, and waiver conditions.",
    content: `Delaying GST return filing attracts two separate charges: Late Fee (a fixed per-day penalty) and Interest (on the unpaid tax amount). Understanding how each is calculated helps you plan your filings and budget for the cost of any unavoidable delays.

## Late Fee for GSTR-3B

Under Section 47 of the CGST Act:

For returns with tax liability:
• ₹50 per day of delay (₹25 CGST + ₹25 SGST)
• Maximum: ₹10,000 (₹5,000 CGST + ₹5,000 SGST)

For nil returns (no tax liability):
• ₹20 per day (₹10 CGST + ₹10 SGST)
• Maximum: ₹500

## Late Fee for GSTR-1

• With invoices: ₹50 per day (₹25 + ₹25)
• Nil GSTR-1: ₹20 per day (₹10 + ₹10)
• Maximum: ₹10,000

## Late Fee for GSTR-9 (Annual Return)

• ₹200 per day (₹100 CGST + ₹100 SGST) — no daily cap, but the government often issues maximum fee notifications
• FY 2025-26 annual return (GSTR-9): Due by 31 December 2026

## Interest on Late Payment of Tax

Under Section 50:

• Standard rate: 18% per annum on the outstanding tax amount
• If ITC is reversed/reclaimed wrongly: 24% per annum (not 18%)
• Calculated from the day following the due date until the actual payment date
• Interest applies on the NET cash liability (not on the ITC portion) — confirmed by the courts and GST Council

Formula: Interest = Tax Amount × 18% ÷ 365 × Number of Days Delay

Example: ₹1,00,000 tax liability paid 30 days late
Interest = ₹1,00,000 × 18% ÷ 365 × 30 = ₹1,479

## Amnesty Schemes

The GST Council periodically announces amnesty or late fee waiver schemes for businesses that have pending returns from prior years. These typically offer a reduced late fee (sometimes zero, sometimes capped at ₹500) for a limited time. Always check the GST portal or consult your CA for current amnesty windows.

## Penalty (Separate from Late Fee)

Under Section 122, if a registered person fails to pay tax or makes short payment, a penalty of ₹10,000 or 100% of tax (whichever is higher) can be imposed — but this applies to deliberate non-payment, not just late filing.

## Important: File Even If You Cannot Pay

Never skip filing a GST return just because you cannot pay the tax. The late fee accumulates on every day of delay. File the return (even with zero payment), then pay the tax + interest separately. This way, at least the late fee stops accumulating after the return is filed.

---

What to do: Use ComplianceSearch.in's MCA Penalty Calculator for ROC late fees, and track all GST due dates on the GST Due Dates calendar to avoid late filings.`,
    daysAgo: 25,
  },

  // ─────────── Income Tax ───────────
  {
    title: "Income Tax Return Due Dates for AY 2026-27 (FY 2025-26) — All Categories",
    category: "income_tax",
    tags: "ITR due date,AY 2026-27,FY 2025-26,income tax,filing deadline",
    excerpt: "What is the last date to file income tax return for FY 2025-26 (AY 2026-27)? Here are all ITR due dates by taxpayer category — including tax audit cases and belated returns.",
    content: `Filing your income tax return on time for FY 2025-26 (Assessment Year 2026-27) is critical to avoid interest under Section 234A, late fees under Section 234F, and loss of the ability to carry forward losses. Here are all the due dates by category.

## ITR Due Dates — AY 2026-27

## Individuals, HUFs, Partnership Firms (Non-Audit Cases)
• Due date: 31 July 2026
• Applicable to: Individuals (both salaried and business income), HUFs, partnership firms that do not require audit under any law

## Companies (All Companies)
• Due date: 31 October 2026
• All private limited companies, LLPs with limited liability, public companies
• Even if a company has no income, ITR-6 must be filed

## Businesses Requiring Tax Audit Under Section 44AB
• Due date: 31 October 2026
• Applicable to: Businesses with gross turnover > ₹1 crore (or ₹10 crore for cash-based businesses), professionals with gross receipts > ₹50 lakhs
• Tax audit report (Form 3CA/3CB + 3CD) due: 30 September 2026

## Businesses with Transfer Pricing
• Due date: 30 November 2026
• Applicable if international transactions or specified domestic transactions exist
• Form 3CEB (Transfer Pricing report by CA) due: 31 October 2026

## Belated Return (Section 139(4))
• Last date: 31 December 2026
• Can file after original due date but before 31 December 2026
• Penalty: ₹5,000 under Section 234F (₹1,000 if total income ≤ ₹5 lakhs)
• Cannot carry forward losses (except house property loss) if filed belatedly
• Interest under Section 234A: 1% per month from original due date

## Updated Return (Section 139(8A) — ITR-U)
• File: Within 2 years from the end of the relevant assessment year
• For AY 2026-27: Can file updated return up to 31 March 2029
• Additional tax: 25% extra tax if filed within 12 months; 50% extra tax if filed between 12-24 months
• Cannot be filed if assessment is pending or notice issued

## Form 16 / 16A Due Dates

• Form 16 (TDS on salary): 15 June 2026 (for FY 2025-26)
• Form 16A (TDS on non-salary): 15 days after end of each quarter
  - Q1 (Apr–Jun): 15 August 2026
  - Q2 (Jul–Sep): 15 November 2026
  - Q3 (Oct–Dec): 15 February 2027
  - Q4 (Jan–Mar): 15 June 2027

## Advance Tax Due Dates — FY 2025-26

• 15 June 2025: 15% of estimated tax
• 15 September 2025: 45% of estimated tax (cumulative)
• 15 December 2025: 75% of estimated tax (cumulative)
• 15 March 2026: 100% of estimated tax
• Applicable if tax liability exceeds ₹10,000 after TDS credit

## Consequences of Missed Deadline

• Section 234A: Interest at 1% per month from original due date until actual filing
• Section 234F: Late fee of ₹5,000 (₹1,000 if income ≤ ₹5 lakhs)
• Cannot carry forward business losses (except unabsorbed depreciation and house property loss)
• Prosecution under Section 276CC: If tax evaded exceeds ₹25 lakhs (rigorous imprisonment)

---

What to do: Track all income tax deadlines in one place using ComplianceSearch.in's Income Tax Due Dates calendar — updated for AY 2026-27 with all filing, payment, and TDS dates.`,
    daysAgo: 28,
  },

  {
    title: "Advance Tax: Due Dates, Calculation, and Interest Penalty for FY 2025-26",
    category: "income_tax",
    tags: "advance tax,due date,Section 234B,Section 234C,FY 2025-26",
    excerpt: "Advance tax is payable in 4 instalments during FY 2025-26. Miss an instalment and pay interest at 1% per month. Here is how to calculate, when to pay, and how to avoid penalties.",
    content: `Advance tax is the mechanism by which income tax is paid in instalments during the financial year itself, rather than as a lump sum at the end. The principle is "pay as you earn." If you miss advance tax instalments, you pay interest under Section 234B and 234C.

## Who Must Pay Advance Tax?

Every taxpayer (individual, firm, company) whose estimated income tax liability for the year exceeds ₹10,000 (after credit for TDS) must pay advance tax.

Exceptions:
• Senior citizens (age 60+) not having business/professional income are exempt from advance tax
• Persons opting for presumptive taxation under Section 44AD/44ADA must pay entire advance tax by 15 March (single instalment)

## Due Dates and Instalment Percentages — FY 2025-26

• 15 June 2025: Minimum 15% of total estimated tax liability for the year
• 15 September 2025: Minimum 45% of total estimated tax (cumulative)
• 15 December 2025: Minimum 75% of total estimated tax (cumulative)
• 15 March 2026: 100% of total estimated tax

## How to Calculate Advance Tax

Step 1: Estimate your total income for FY 2025-26 (salary, business income, capital gains, rental income, other sources)

Step 2: Calculate gross tax on estimated income using applicable slab rates

Step 3: Deduct TDS already deducted or expected to be deducted

Step 4: If net tax > ₹10,000 → advance tax is payable

Step 5: Pay proportionate amount by each due date

Example:
• Estimated total tax: ₹2,00,000
• Expected TDS: ₹60,000
• Net advance tax: ₹1,40,000
• By 15 June: ₹1,40,000 × 15% = ₹21,000
• By 15 September: ₹1,40,000 × 45% = ₹63,000 (cumulative) — pay ₹42,000 more
• By 15 December: ₹1,40,000 × 75% = ₹1,05,000 (cumulative) — pay ₹42,000 more
• By 15 March: ₹1,40,000 remaining ₹35,000

## Interest for Non-Payment or Short Payment

## Section 234C — Deferment of Advance Tax Instalments

Interest at 1% per month is charged for short payment of each instalment:

• June instalment short: 1% per month for 3 months
• September instalment short: 1% per month for 3 months
• December instalment short: 1% per month for 3 months
• March instalment short: 1% per month for 1 month

## Section 234B — Default in Payment of Advance Tax

If total advance tax paid is less than 90% of the total tax liability, interest at 1% per month is charged from 1 April of the assessment year until the date of actual payment/assessment.

## Tips to Avoid Advance Tax Interest

• Review your income at the beginning of each quarter and revise your estimate
• Pay a slightly higher amount in early instalments — better to overpay slightly than underpay
• Self-employed professionals: Estimate income conservatively; if income grows, pay the additional tax in the next instalment
• Capital gains: If you have a large capital gain late in the year (e.g., in February), you can pay the entire advance tax on that gain in March without attracting 234C interest

---

What to do: Use ComplianceSearch.in's Income Tax Due Dates calendar to never miss an advance tax instalment. Set a reminder for 10 June, 10 September, 10 December, and 10 March.`,
    daysAgo: 30,
  },

  {
    title: "TDS Rate Chart FY 2025-26: Section-wise Complete Reference",
    category: "income_tax",
    tags: "TDS rate,Section 194,TDS chart,FY 2025-26,tax deducted at source",
    excerpt: "Updated TDS rate chart for FY 2025-26 with all sections — 194A, 194C, 194H, 194I, 194J, 192, and more. Includes threshold limits and rates for resident and non-resident cases.",
    content: `Tax Deducted at Source (TDS) is a mechanism to collect income tax at the point of income payment itself. As a payer (deductor), you are required to deduct TDS at the applicable rate and deposit it with the government before making payment to the payee. Here is the complete TDS rate chart for FY 2025-26.

## Key TDS Sections — FY 2025-26

## Section 192 — Salary
• Rate: As per the applicable income tax slab of the employee
• Threshold: Income above basic exemption limit
• When to deduct: Monthly at the time of payment

## Section 192A — EPF Premature Withdrawal
• Rate: 10%
• Threshold: Withdrawal exceeds ₹50,000
• Rate if no PAN: 30%

## Section 194 — Dividend
• Rate: 10%
• Threshold: Dividend > ₹5,000

## Section 194A — Interest (Other than Securities)
• Rate: 10%
• Threshold: ₹50,000 per year (from banks/co-op societies by senior citizens); ₹40,000 for others (banks); ₹5,000 (other cases)

## Section 194B — Lottery / Puzzle Winnings
• Rate: 30%
• Threshold: Winning > ₹10,000

## Section 194C — Contractor Payments
• Rate: 1% (individual/HUF), 2% (others)
• Threshold: Single payment > ₹30,000 or aggregate > ₹1,00,000 in a year

## Section 194D — Insurance Commission
• Rate: 5%
• Threshold: Commission > ₹15,000

## Section 194H — Commission or Brokerage
• Rate: 5%
• Threshold: Commission > ₹15,000

## Section 194I — Rent
• Rate: 10% (land/building/furniture), 2% (plant/machinery/equipment)
• Threshold: Rent > ₹2,40,000 per year

## Section 194IA — Sale of Immovable Property
• Rate: 1%
• Threshold: Sale consideration > ₹50 lakhs
• Deducted by buyer at the time of payment

## Section 194IB — Rent by Individual/HUF
• Rate: 5%
• Threshold: Monthly rent > ₹50,000
• TDS to be deducted once a year or at end of tenancy

## Section 194J — Professional/Technical Fees
• Rate: 10% (professionals — doctors, lawyers, CAs); 2% (technical services)
• Threshold: Payment > ₹30,000 per year

## Section 194N — Cash Withdrawal from Bank
• Rate: 2% on withdrawal exceeding ₹1 crore in a year (from a single bank); 5% if ITR not filed for 3 years and cash > ₹20 lakhs

## Section 194Q — Purchase of Goods
• Rate: 0.1%
• Threshold: Purchase > ₹50 lakhs in a year from a single seller
• Applicable to buyers with turnover > ₹10 crore

## TDS Return Due Dates — FY 2025-26

• Q1 (Apr–Jun 2025): 31 July 2025
• Q2 (Jul–Sep 2025): 31 October 2025
• Q3 (Oct–Dec 2025): 31 January 2026
• Q4 (Jan–Mar 2026): 31 May 2026

## Penalty for TDS Default

• Non-deduction or short deduction: Interest at 1% per month from due date of deduction to actual deduction
• Non-payment after deduction: Interest at 1.5% per month from deduction to payment date
• Late TDS return filing: ₹200 per day under Section 234E
• Failure to file TDS return: Penalty of ₹10,000 to ₹1,00,000 under Section 271H

---

What to do: Track quarterly TDS return due dates on ComplianceSearch.in's Income Tax calendar. Also verify whether Section 194Q (purchase of goods) TDS applies to your business.`,
    daysAgo: 33,
  },

  // ─────────── Labour Law ───────────
  {
    title: "PF Registration: When Is It Mandatory and How to Register?",
    category: "labour_law",
    tags: "PF registration,EPF,EPFO,20 employees,mandatory,provident fund",
    excerpt: "PF registration under the EPF Act is mandatory once you have 20 or more employees. Know the threshold, contribution rates, registration process, and penalty for non-compliance.",
    content: `The Employees' Provident Fund (EPF) is a retirement benefit scheme mandated under the Employees' Provident Funds and Miscellaneous Provisions Act, 1952. For employees, it is a forced savings mechanism; for employers, it is a mandatory contribution. Understanding when PF registration becomes compulsory is critical for compliance.

## When is PF Registration Mandatory?

PF registration is mandatory for any establishment that:

• Employs 20 or more persons, OR
• Is notified by the Central Government (certain industries are notified even below 20 employees)

"Person" includes all employees — permanent, temporary, contract, probationary, apprentices — working in the establishment on any day during the year.

Once an establishment is covered (crosses 20 employees), coverage continues even if the number later falls below 20.

## Voluntary Coverage

Establishments with fewer than 20 employees can voluntarily register under EPF with the consent of the majority of employees and employer.

## PF Contribution Rates

The contribution is 12% of Basic Wages + Dearness Allowance + Retaining Allowance:

• Employee's contribution: 12% of basic wages
• Employer's contribution: 12% of basic wages, split as:
  - 8.33% to Employee Pension Scheme (EPS) — capped at 8.33% of ₹15,000 = ₹1,250
  - 3.67% to EPF (or the balance after EPS contribution)
  - 0.5% to EDLI (Employees' Deposit-Linked Insurance)
  - 0.5% as administrative charges (EPF); 0.01% as administrative charges (EDLI)

For employees drawing basic wages above ₹15,000, the EPS contribution is restricted to ₹1,250 (8.33% of ₹15,000). The employer PF (3.67%) is calculated on actual basic wages.

## How to Register

• Visit the EPFO Unified Shram Suvidha Portal (registration.shramsuvidha.gov.in)
• Select "New Registration" under EPF and ESI
• Fill in establishment details — name, address, PAN, type of business, date of commencement
• Upload documents — incorporation certificate, address proof, bank details, list of employees
• After registration, you receive a 17-digit PF Code (also called PF Establishment Code)

## Monthly Compliance

• Deduct 12% from employee salary
• Add employer's 12% contribution
• Deposit total (24%) by 15th of the following month through ECR (Electronic Challan-cum-Return) on the EPFO portal
• File monthly ECR (electronic return) with employee-wise contribution details

## Penalty for Non-Compliance

• Failure to register or pay PF: Damages ranging from 5% to 25% of arrear amount (depending on delay period)
• Interest: 12% per annum on unpaid amounts
• Prosecution: Up to 3 years imprisonment + fine for wilful non-compliance
• EPFO inspectors can visit and audit books

## UAN Generation

Every employee must be assigned a Universal Account Number (UAN) — a 12-digit permanent identification number. Once allotted, the UAN stays with the employee across all employers. The employer is responsible for UAN generation for new employees (via EPFO portal).

---

What to do: Not sure if PF applies to your business? Use ComplianceSearch.in's Compliance Checker — enter your employee count and the tool tells you whether PF registration is mandatory, along with all other applicable compliances.`,
    daysAgo: 36,
  },

  {
    title: "ESIC Registration: Applicability, Contribution Rate and Process",
    category: "labour_law",
    tags: "ESIC,ESI,employees state insurance,applicability,10 employees,registration",
    excerpt: "ESIC provides medical and insurance benefits to employees. Registration is mandatory for establishments with 10 or more employees in notified areas. Know the contribution rate and process.",
    content: `The Employees' State Insurance (ESI) Scheme is a social security and health insurance scheme for Indian workers. It is governed by the Employees' State Insurance Act, 1948, and administered by the Employees' State Insurance Corporation (ESIC). Employers who must register but don't face penalties, prosecution, and liability for employees' medical costs.

## When is ESIC Registration Mandatory?

ESIC registration is mandatory for:

• Factories with 10 or more employees (in states/UTs where the Act has been extended to factories below 20)
• Shops, hotels, restaurants, cinemas, road transport, newspaper establishments, private educational institutions: 10 or more employees in notified areas

Note: Some states have extended ESI to establishments with fewer employees. Check the ESIC notification for your state.

## Wage Ceiling for ESI Coverage

ESI coverage applies to employees drawing wages of up to ₹21,000 per month (₹25,000 for persons with disability). Employees earning above ₹21,000 are NOT covered under ESI.

## ESI Contribution Rates

• Employee's contribution: 0.75% of gross wages
• Employer's contribution: 3.25% of gross wages
• Total: 4% of gross wages

For employees earning up to ₹176/day (approx ₹5,000/month), the employee's contribution is NIL — only the employer pays 3.25%.

## Benefits Available to ESI Subscribers

Registered employees are entitled to:

• Medical care — for the insured person and entire family
• Sickness benefit — up to 91 days per year
• Maternity benefit — 26 weeks paid leave
• Disablement benefit — temporary or permanent
• Dependants benefit — on death due to employment injury
• Funeral expenses — ₹15,000
• Unemployment allowance — up to 90 days if unemployed due to non-employment injury

## Registration Process

• Visit ESIC portal (esic.gov.in)
• Register as an employer under "Employer Registration"
• Fill in establishment details, PAN, list of employees, bank details
• On successful registration, receive 17-digit ESIC Employer Code
• Register each covered employee and obtain their ESI/IP Number (Insurance Person Number)

## Monthly Compliance

• Deduct 0.75% from covered employees' wages
• Add employer contribution of 3.25%
• Deposit total 4% by 15th of the following month through ESIC portal
• File half-yearly returns: April–September (by 11 November) and October–March (by 11 May)

## Penalty for Non-Registration or Non-Payment

• Non-payment of contribution: Interest at 12% per annum
• Damages: 5% to 25% depending on delay period
• Employer liable for all medical expenses incurred by covered employees during the period of default

---

What to do: Use ComplianceSearch.in's Compliance Checker to verify ESIC applicability for your establishment based on your employee count, state, and business type.`,
    daysAgo: 40,
  },

  {
    title: "POSH Act Compliance: Mandatory for Every Employer with 10+ Workers",
    category: "labour_law",
    tags: "POSH Act,sexual harassment,ICC,annual report,compliance",
    excerpt: "The Prevention of Sexual Harassment (POSH) Act applies to every employer with 10 or more workers. Non-compliance attracts ₹50,000 penalty. Know your mandatory obligations.",
    content: `The Sexual Harassment of Women at Workplace (Prevention, Prohibition and Redressal) Act, 2013 — commonly known as the POSH Act — is one of the most underrated mandatory compliances for Indian employers. It applies to virtually every organisation with 10 or more workers, and non-compliance can lead to penalties, cancellation of registration/licence, and serious reputational risk.

## Who Does the POSH Act Apply To?

The POSH Act applies to ALL employers with 10 or more employees — regardless of:

• Type of industry (IT, manufacturing, hospitality, hospitals, NGOs, law firms)
• Nature of employment (permanent, contractual, part-time, probationary, interns, trainees)
• Gender of workforce

"Aggrieved woman" under the Act includes not just employees but also customers, visitors, and contractors who face harassment on the employer's premises.

## Key Obligations for Employers

## 1. Constitute an Internal Complaints Committee (ICC)

Every employer with 10+ employees must form an ICC (now renamed Internal Committee — IC) at each office/branch:

• Presiding Officer: A woman employed at a senior level
• Two employee members (ideally committed to the cause of women)
• One external member from an NGO, association, or legal/social expert dealing with women's issues

## 2. Display Information

Every workplace must display:

• The POSH policy in a conspicuous place
• Name and contact details of the Presiding Officer / IC members

## 3. Conduct Annual Awareness Programme

At least one awareness programme per year for employees — workshops, trainings, or sensitisation sessions.

## 4. Prepare Annual Report

The IC must prepare an Annual Report with:

• Number of complaints received during the year
• Number of complaints disposed of
• Number of cases pending
• Nature of action taken

This report must be submitted to the employer and the District Officer.

## 5. Include in Board Report

Listed companies and certain unlisted companies must disclose POSH compliance status in their Director's Report (Board Report) — including number of complaints received, disposed of, and pending.

## Penalty for Non-Compliance

• First offence: Fine up to ₹50,000
• Repeat offence: Double the penalty + possible cancellation/non-renewal of registration or licence
• Criminal liability: Prosecution of employer possible under the Act

## For Employers with Less Than 10 Employees

If you have fewer than 10 workers, the POSH Act still covers your employees — but the government constitutes a Local Complaints Committee (LCC) at the district level to handle complaints, since an internal ICC is not required.

However, you still must have a POSH policy and inform employees about the LCC.

---

What to do: Use ComplianceSearch.in's Compliance Checker to see all applicable labour laws for your business — POSH, PF, ESIC, Minimum Wages, Gratuity, Bonus Act — in one personalised list.`,
    daysAgo: 43,
  },

  // ─────────── General / Secretarial ───────────
  {
    title: "Board Resolution for Bank Account Opening: Format and Requirements",
    category: "general",
    tags: "board resolution,bank account,current account,authorised signatory,format",
    excerpt: "Every company opening a bank account must pass a Board Resolution. Know what it must contain, which banks accept it, and how to add authorised signatories.",
    content: `Opening a current account for a company is not as simple as walking into a bank with company documents. Every bank in India — whether SBI, HDFC, ICICI, or Axis — requires a certified copy of a Board Resolution passed by the company's directors authorising the account opening. Without it, the application is incomplete.

## Why Do Banks Require a Board Resolution?

A company is a separate legal entity from its directors and shareholders. Only the Board of Directors can authorise who has the power to operate the company's bank account — and they do so through a formal Board Resolution. The bank needs this to ensure:

• The account is opened with proper corporate authority
• The authorised signatories are clearly identified and their signing powers are defined
• Any future transactions by these signatories are legally binding on the company

## What Must the Resolution Contain?

A valid Board Resolution for bank account opening must include:

• Company name, CIN, registered office address
• Date, time, and place of the Board Meeting
• Names and designations of directors present (establishing quorum)
• Resolution text — RESOLVED THAT a current account be opened with [Bank Name], [Branch Name and Address]
• Name(s) of authorised signatory/signatories with designations (Director / CEO / CFO etc.)
• Mode of operation — "singly" (single signatory) or "jointly" (any two signatories, or specific combination)
• Scope of operation — deposits, withdrawals, cheque signing, NEFT/RTGS, overdraft, correspondence
• Certification line — "Certified to be a True Extract of the Minutes of the Board Meeting held on [date]"
• Signature of Chairman or any two directors

## Single vs Joint Signatory

• Single: One authorised signatory can independently operate the account — convenient for day-to-day operations
• Joint: Two or more specified signatories must sign together — better internal control for larger transactions

Common practice: Single signatory for transactions up to a certain amount; joint for above. This can be specified in the resolution.

## Documents Banks Typically Ask For Alongside Resolution

• Certified copy of Board Resolution (certified by a director or CS)
• Certificate of Incorporation
• Memorandum and Articles of Association
• PAN card of company
• GST registration certificate (if registered)
• KYC of authorised signatories — PAN, Aadhaar, photograph
• KYC of all directors — PAN, Aadhaar
• Address proof of registered office
• Latest utility bill or rent agreement for premises

## Common Mistakes to Avoid

• Omitting the exact bank name and branch address — some banks reject incomplete resolutions
• Not specifying whether operation is "singly" or "jointly" — banks will ask for clarification
• Not signing the CTC — the certified true copy must clearly state who certified it and in what capacity
• Outdated meeting date — the resolution should be dated close to the bank application date

---

What to do: Generate a complete, bank-ready Board Resolution for bank account opening in under 60 seconds using ComplianceSearch.in's free Bank Resolution Generator. Accepted by all major Indian banks.`,
    daysAgo: 46,
  },

  {
    title: "Share Transfer in Private Limited Company: Complete Procedure and Documents",
    category: "general",
    tags: "share transfer,SH-4,Section 56,stamp duty,private limited,procedure",
    excerpt: "Transferring shares in a private limited company involves specific documents, board approval, stamp duty, and ROC updates. Here is the complete step-by-step procedure.",
    content: `Shares in a private limited company can be transferred, but unlike public company shares traded on a stock exchange, the transfer follows a specific corporate procedure. The process involves preparing transfer documents, paying stamp duty, obtaining board approval, and updating ROC records.

## Step 1: Check Articles of Association (AOA)

Most private limited companies have restrictions on share transfer in their Articles of Association. Typical restrictions:

• Right of first refusal: The selling shareholder must first offer shares to existing shareholders before selling to an outsider
• Board approval required: Transfer must be approved by the Board of Directors
• Lock-in period: Certain investor agreements may have lock-in periods

Always check the AOA before proceeding.

## Step 2: Determine Fair Market Value

For income tax purposes:
• If shares are transferred above FMV: No issue
• If shares are transferred below FMV: The difference may be taxable as "income from other sources" in the hands of the buyer (Section 56(2)(x))
• FMV is calculated under Rule 11UA — Net Asset Value (book value method)

For FEMA (if foreign shareholder involved):
• Shares must be transferred at or above FMV determined by a SEBI-registered Merchant Banker / practicing CA (DCF method)

## Step 3: Execute Share Transfer Deed (Form SH-4)

Form SH-4 is the Securities Transfer Form prescribed under Rule 11(1) of Companies (Share Capital and Debentures) Rules, 2014.

The deed must contain:
• Name of the company
• Transferor's name, address, folio number
• Number and class of shares being transferred
• Distinctive numbers (from–to)
• Consideration (price paid)
• Date of execution
• Signatures of transferor AND transferee (both must sign)
• Two witness signatures

## Step 4: Pay Stamp Duty on SH-4

As per Indian Stamp Act (amended 2020):

• Rate: 0.015% of consideration value or market value, whichever is higher
• Example: Transfer of shares for ₹10,00,000 → stamp duty = ₹1,500
• The stamp must be physically affixed on the SH-4 before execution, or paid online depending on state rules

Note: Several states have now moved to e-stamping. Check your state government's e-stamping portal.

## Step 5: Board Meeting for Transfer Approval

Hold a Board Meeting (or pass a Board Resolution by circulation) to approve the transfer. The resolution must note:

• Transferor name and folio number
• Transferee name and address
• Number of shares being transferred
• Approval of the transfer and direction to update the Register of Members

## Step 6: Update Register of Members

The company must update:

• Register of Members (Form MGT-1) — remove transferor, add transferee with date of entry
• Register of Share Transfers (Form SH-4 register)

## Step 7: Issue New Share Certificate

Within 1 month of approval of transfer (Section 56(4)):

• Cancel the old share certificate
• Issue a new share certificate in Form SH-1 to the transferee
• New certificate should reference the transfer date and board resolution

## Step 8: File SH-7 with ROC (if applicable)

If the transfer results in a change in shareholding pattern that requires notifying the ROC, file MGT-7 (in the Annual Return) reflecting the updated shareholding. There is no separate form for reporting individual share transfers in private companies — it is captured in the Annual Return.

---

What to do: Generate both the Share Transfer Deed (SH-4) and the new Share Certificate (SH-1) using ComplianceSearch.in's free tools — both are available under the Documents section.`,
    daysAgo: 50,
  },

  {
    title: "Business Valuation Methods in India: DCF, NAV, and EBITDA Explained",
    category: "general",
    tags: "business valuation,DCF,NAV,EBITDA,Rule 11UA,India,share transfer",
    excerpt: "How is a business valued in India? Three main methods — DCF, NAV (Rule 11UA), and EBITDA multiple — serve different purposes. Here is when to use each and how they work.",
    content: `Business valuation is required for multiple purposes in India — share transfers, FDI transactions, M&A, ESOPs, fundraising, and even court proceedings. Three methods dominate Indian practice: Discounted Cash Flow (DCF), Net Asset Value (NAV/book value under Rule 11UA), and EBITDA Multiple. Understanding which method to use — and when — can significantly affect tax outcomes and regulatory compliance.

## 1. Net Asset Value (NAV) — Rule 11UA Method

## When to Use
• Share transfer between Indian residents for income tax purposes (Section 56(2)(x))
• Determining whether any "gift tax" applies under income tax

## The Rule 11UA Formula

Fair Market Value per share = (A + B + C + D – L) × PV / PE

Where:
• A = Book value of all assets (net of depreciation)
• B = Market value of listed shares held
• C = Market value of shares in subsidiaries
• D = Value of other specified assets
• L = Book value of all liabilities
• PV = Paid-up value of shares being valued
• PE = Total paid-up equity share capital of company

The Rule 11UA method is simple to apply but may significantly undervalue high-growth businesses (whose value lies in future earnings, not just current assets).

## 2. Discounted Cash Flow (DCF)

## When to Use
• FDI — FEMA pricing guidelines (RBI Master Directions) require DCF for pricing shares in international transactions
• Fundraising — investors use DCF as a foundation for term sheets
• M&A — buyer-side due diligence
• ESOP grant price determination

## How DCF Works

DCF projects the company's future free cash flows (typically 5 years) and discounts them back to present value using the Weighted Average Cost of Capital (WACC).

Value = FCF₁/(1+WACC)¹ + FCF₂/(1+WACC)² + ... + Terminal Value/(1+WACC)⁵

Terminal Value captures the value beyond the projection period (using Gordon Growth Model).

## Key Inputs

• Free cash flows for next 5 years
• WACC (typically 12–22% for Indian companies)
• Terminal growth rate (typically 4–6% for stable businesses)

DCF can produce significantly higher valuations for growing businesses compared to NAV — making it more favourable for sellers in FDI transactions.

## 3. EBITDA Multiple

## When to Use
• M&A transactions — most common benchmark for deal pricing
• PE / VC investment discussions
• Comparing value to listed sector peers

## How It Works

Value = EBITDA × Industry Multiple

Industry multiples are derived from comparable listed companies on BSE/NSE or from recent M&A transactions in the sector.

Example: A profitable IT services company with EBITDA of ₹5 crore and an industry multiple of 12× → Valuation = ₹60 crore

## Typical India Sector EBITDA Multiples (indicative)

• IT services and software: 12–25×
• Pharmaceuticals: 14–20×
• FMCG: 18–30×
• Manufacturing (auto ancillary): 8–14×
• Real estate: 10–16× (based on NAV)
• Hospitality: 10–18×
• Financial services: Price/Book basis (1.5×–4× P/B)

## Which Method to Use?

• For regulatory compliance (share transfer between residents): Rule 11UA (NAV)
• For FDI/FEMA pricing: DCF (mandatory)
• For fundraising term sheets: DCF + EBITDA multiple cross-check
• For startup with no revenue: Berkus method or scorecard method
• For mature profitable business sale: EBITDA multiple

---

What to do: Calculate your business value using all 6 methods simultaneously at ComplianceSearch.in's free Business Valuation Calculator — includes DCF, NAV (Rule 11UA), EBITDA multiple, Revenue multiple, P/E, and Berkus.`,
    daysAgo: 54,
  },

  {
    title: "Section 135 CSR: Applicability, Mandatory Amount and Compliance for FY 2025-26",
    category: "general",
    tags: "CSR,Section 135,corporate social responsibility,2% profit,Board Report",
    excerpt: "Is your company required to spend on CSR under Section 135? Know the applicability thresholds, mandatory spend calculation, permitted activities, and what to disclose in the Board Report.",
    content: `Corporate Social Responsibility (CSR) under Section 135 of the Companies Act 2013 requires eligible companies to spend at least 2% of their average net profit on CSR activities. Failure to spend — or improper spending — can attract penalties and mandatory transfer to government funds.

## Which Companies Must Do CSR?

Under Section 135, CSR is mandatory for any company that, in any financial year, meets ANY ONE of these thresholds:

• Net worth ≥ ₹500 crore, OR
• Turnover ≥ ₹1,000 crore, OR
• Net profit ≥ ₹5 crore

These thresholds are checked for the immediately preceding financial year (or any preceding 3 years if the company is new).

Note: Companies having a CSR obligation must continue for all subsequent years, regardless of whether they continue to meet the thresholds — until the Board reviews and stops the obligation.

## How Much Must Be Spent?

Eligible companies must spend at least:

• 2% of average net profits for the preceding 3 financial years

"Net profit" for this purpose is calculated under Section 198 of the Companies Act — which broadly includes profits before tax (with specific additions and deductions).

Example: If average net profit over FY 2022-23, 2023-24, and 2024-25 was ₹10 crore, then CSR obligation for FY 2025-26 = ₹20 lakhs.

## Permitted CSR Activities (Schedule VII)

The 2% must be spent on activities listed in Schedule VII of Companies Act 2013, which broadly covers:

• Eradicating hunger, poverty, malnutrition
• Promotion of education and skill development
• Gender equality and women empowerment
• Environmental sustainability and ecological balance
• Protection of national heritage, art and culture
• Measures for armed forces veterans, war widows
• Sports: training for paralympic and olympic sports
• Prime Minister's National Relief Fund (PMNRF) and other government funds
• Promotion of rural sports and nationally recognised sports
• Technology incubators
• Rural development projects
• Slum area development

## CSR Governance Requirements

• Form a CSR Committee: Minimum 3 directors (for companies with independent directors — at least 1 must be independent); for others, 2 directors
• Prepare CSR Policy: Board must approve the CSR policy based on Committee's recommendation
• Annual Action Plan: Board must approve an annual CSR action plan

## What If 2% Is Not Spent?

• Amount unspent on ongoing projects: Transfer to a special bank account (unspent CSR account) within 30 days of end of FY; spend within 3 years
• Amount not related to ongoing projects: Transfer to one of the specified government funds (like PMNRF, PMCARES) within 6 months of end of FY

Penalty for non-compliance (effective from January 2021):

• Company: Fine of twice the unspent amount, minimum ₹1 lakh
• Officer in default: Fine up to ₹2 lakhs

## Board Report Disclosure

Companies with CSR obligation must include in the Board Report:

• Composition of CSR Committee
• Web link to CSR policy
• Amount prescribed (2% of average net profit)
• Amount actually spent
• Reasons for shortfall (if any)
• Format: Annexure in Form prescribed under Companies (CSR Policy) Rules

---

What to do: Not sure if CSR applies to your company? Use ComplianceSearch.in's Compliance Checker — enter your net profit, turnover, and net worth to instantly check CSR applicability and all other compliance requirements.`,
    daysAgo: 57,
  },

  {
    title: "Startup India DPIIT Recognition: Eligibility, Benefits and How to Apply",
    category: "startup",
    tags: "Startup India,DPIIT,recognition,tax exemption,Section 80IAC,startup",
    excerpt: "DPIIT recognition opens the door to tax exemptions, easier compliance, and government funding for eligible startups. Here is the eligibility criteria, benefits, and step-by-step application process.",
    content: `The Startup India initiative, launched by the Government of India in 2016, provides a wide range of benefits to eligible startups — including income tax exemptions, access to government funding, relaxed compliance norms, and easier winding-up provisions. The gateway to all these benefits is DPIIT (Department for Promotion of Industry and Internal Trade) recognition.

## Who is a "Startup" Under DPIIT?

An entity qualifies as a DPIIT-recognised startup if:

• It is incorporated as a Private Limited Company, Registered Partnership Firm, or LLP
• It has been incorporated/registered for not more than 10 years from the date of incorporation
• Annual turnover has not exceeded ₹100 crore in any financial year since incorporation
• It is working towards innovation, development, or improvement of products/processes/services, OR it is a scalable business model with high potential for employment generation or wealth creation
• It has not been formed by splitting up or reconstructing an existing business

## How to Apply for DPIIT Recognition

• Visit the Startup India portal (startupindia.gov.in)
• Create an account and log in
• Fill in the application form — company details, incorporation date, nature of business, brief about the product/service
• Answer whether it is a new product/service or an improvement over existing ones
• Submit self-certification that the entity meets the definition of a startup
• Upload incorporation certificate, description of products/services, pitch deck/video (optional but recommended)
• Recognition is typically granted within 2–5 working days
• No fees for recognition

## Benefits of DPIIT Recognition

## Tax Exemption — Section 80IAC

DPIIT-recognised startups incorporated on or after 1 April 2016 can apply for 100% income tax exemption on profits for any 3 consecutive years out of the first 10 years of incorporation.

Condition: Must be a private limited company; must meet the startup definition; profits from eligible businesses

How to apply: Separately apply to the Inter-Ministerial Board (IMB) — this is a different, more rigorous process from basic DPIIT recognition.

## Angel Tax Exemption — Section 56(2)(viib)

DPIIT-recognised startups are exempt from "angel tax" — the tax on share premium above fair market value when shares are issued to angel investors. This is a significant benefit for fundraising.

## Self-Certification Compliance

DPIIT-recognised startups can self-certify compliance with 9 labour laws and 3 environmental laws for 3 years from incorporation (except manufacturing startups). This reduces the compliance burden significantly.

## Faster Winding Up

Startups that qualify as "Fast Track" firms under the Insolvency and Bankruptcy Code can wind up in 90 days — compared to several years for normal companies.

## Access to Government Funds

• Fund of Funds for Startups (FFS): SIDBI manages a corpus to fund startups through SEBI-registered Alternative Investment Funds
• Startup India Seed Fund Scheme (SISFS): Up to ₹20 lakhs as grants + ₹50 lakhs as convertible debentures
• Priority in government procurement: Startups can apply for government tenders without meeting the prior turnover/experience requirement

---

What to do: Use ComplianceSearch.in's Compliance Checker to understand all compliance requirements for your startup — and verify whether your company qualifies for DPIIT recognition.`,
    daysAgo: 60,
  },

  {
    title: "MSME / Udyam Registration: Benefits, Eligibility and Process",
    category: "startup",
    tags: "MSME,Udyam,Udyam registration,benefits,priority lending,small business",
    excerpt: "Udyam Registration is free, paperless, and unlocks massive benefits — priority lending, lower interest rates, government subsidies, and collateral-free loans. Here is how to register.",
    content: `Udyam Registration (formerly Udyog Aadhaar) is the official MSME registration under the MSMED Act, 2006. Administered by the Ministry of MSME, it is completely free, online, and paperless. Despite being voluntary (no penalty for non-registration), the benefits of Udyam Registration are substantial — especially for access to credit and government schemes.

## Who Qualifies as an MSME?

As per the revised MSME definition (effective 1 July 2020):

## Micro Enterprise
• Investment in Plant & Machinery/Equipment: Up to ₹1 crore
• Annual Turnover: Up to ₹5 crore

## Small Enterprise
• Investment: Up to ₹10 crore
• Turnover: Up to ₹50 crore

## Medium Enterprise
• Investment: Up to ₹50 crore
• Turnover: Up to ₹250 crore

Both conditions (investment AND turnover) must be within the limit. If either exceeds, the enterprise moves to the next category.

## Who Can Register?

Any enterprise engaged in manufacturing, production, processing, or preservation of goods, OR provision of services, can register under Udyam — including:

• Proprietorships
• Partnership firms
• LLPs
• Private limited companies
• Trusts and co-operative societies

## Benefits of Udyam Registration

## Credit Benefits
• Collateral-free loans: Under CGTMSE (Credit Guarantee Fund Trust for Micro and Small Enterprises), micro and small enterprises can avail collateral-free loans up to ₹2 crore
• Priority sector lending: Banks must lend a defined percentage of their credit to MSMEs
• Lower interest rates: Many banks offer preferential interest rates of 1–1.5% lower than standard rates to Udyam-registered entities

## Government Procurement
• 20% of total government procurement must be from MSMEs
• 25% of procurement in certain categories is exclusively reserved for micro and small enterprises
• No earnest money deposit (EMD) required for tender applications by Udyam-registered MSMEs

## Payment Protection
• Buyers (of goods/services) from Udyam-registered MSMEs must pay within 45 days
• If payment is delayed, the buyer must pay compound interest at 3× the bank rate — creating a legal right to timely payment for MSMEs

## Subsidies and Schemes
• Technology upgradation: CLCSS scheme subsidises 15% (up to ₹1 crore) on machinery purchase
• ISO certification: Subsidies available
• State government subsidies: Most state governments have additional MSME subsidies (power tariff, stamp duty exemption, etc.)

## How to Register (Udyam Portal)

• Visit udyamregistration.gov.in
• For new registration: Enter Aadhaar number and PAN of the owner/authorised signatory
• Fill enterprise details — name, address, bank account, NIC code (industry code), investment, turnover
• Self-declare the investment and turnover (auto-verified from IT returns and GST data)
• Submit — receive Udyam Registration Certificate immediately (PDF downloadable)
• No fee, no document upload, no government verification required at registration stage

Note: Udyam certificate is permanent — no renewal required. But update turnover/investment figures annually on the portal.

---

What to do: Udyam Registration takes less than 10 minutes and costs nothing. If your business qualifies, register today at udyamregistration.gov.in. Use ComplianceSearch.in's Compliance Checker to see all other applicable compliances for your business.`,
    daysAgo: 64,
  },

  {
    title: "OPC (One Person Company) Annual Compliance Checklist for FY 2025-26",
    category: "mca_roc",
    tags: "OPC,one person company,annual compliance,MGT-7A,AOC-4,FY 2025-26",
    excerpt: "OPCs have simpler compliance requirements than regular Pvt Ltd companies — no AGM, abridged MGT-7A, single director. But annual filings are still mandatory. Here is the complete OPC checklist.",
    content: `A One Person Company (OPC) was introduced under the Companies Act 2013 to enable a single entrepreneur to operate as a company and enjoy limited liability. While OPCs have certain relaxations compared to private limited companies, they still have mandatory annual compliance obligations. Missing any of these can lead to significant penalties.

## What is an OPC?

An OPC is a company incorporated under Section 2(62) with only ONE member (shareholder). It must have a nominee — a person who becomes the member in the event of death or incapacity of the sole member.

As per the 2021 amendment, any natural person (resident or non-resident) can incorporate an OPC. The previous residency restriction (only Indian residents) has been removed.

## OPC vs Pvt Ltd — Key Compliance Differences

• No AGM required: OPCs are exempt from holding an Annual General Meeting (Section 96 exemption)
• Simplified Board: A single director can run the OPC — no minimum two director requirement
• MGT-7A instead of MGT-7: OPCs file the abridged annual return
• Board meetings: Only 2 board meetings per year (one per half-year, with maximum 90-day gap)
• Cash Flow Statement: Not mandatory for OPCs (unless Ind AS applies)

## Annual Compliance Checklist — OPC FY 2025-26

## ROC Filings

• AOC-4 — Financial Statements: Must be filed within 180 days from close of financial year, i.e., by 27 September 2026 (Note: OPC has 180 days, not 30 days from AGM like regular companies)
• MGT-7A — Annual Return: Must be filed within 60 days from close of financial year, i.e., by 29 May 2026 (Note: OPC has 60 days from FY close, not from AGM)
• ADT-1 — Auditor Appointment: Within 15 days of conclusion of first AGM (for OPC, within 30 days from first board meeting post-incorporation for initial auditor; subsequent auditors by ADT-1 annually)
• DIR-3 KYC: By 31 August 2026 for the sole director's DIN

## Board Meetings

• 2 board meetings per year — one in each half (April–September and October–March)
• Maximum gap between two meetings: 90 days
• Minutes to be prepared within 30 days

## Income Tax
• ITR-6: By 31 October 2026
• Advance Tax: 4 instalments (same as Pvt Ltd)
• TDS: As applicable on payments made

## GST
• GSTR-1, GSTR-3B: Same as regular companies — monthly or quarterly based on turnover
• GSTR-9: If turnover > ₹2 crore

## Key Relaxations for OPC
• Director related party transactions approved by sole member = automatic board approval
• No need for separate shareholder approval if sole member = sole director
• Sole member can sign financial statements if the OPC has no CS

## Mandatory Conversion to Pvt Ltd

An OPC must mandatorily convert to a private limited company if:

• Paid-up capital exceeds ₹50 lakhs, OR
• Average annual turnover for 3 consecutive years exceeds ₹2 crore

After the 2021 amendment, conversion is still required on exceeding these thresholds, but can also be done voluntarily at any time.

---

What to do: Generate your OPC's MGT-7A and AOC-4 attachments (including Board Report) using ComplianceSearch.in's Annual Filing Generator — it auto-detects OPC company type and generates the correct documents.`,
    daysAgo: 68,
  },

  {
    title: "FSSAI Licence: Types, Eligibility and How to Apply for Food Businesses",
    category: "fssai",
    tags: "FSSAI,food licence,food safety,FSSAI registration,State Central licence",
    excerpt: "Every food business operator in India must have an FSSAI registration or licence. Know the three types — Basic, State, Central — and which one your business needs based on turnover.",
    content: `The Food Safety and Standards Authority of India (FSSAI) is the apex food regulatory body in India, established under the Food Safety and Standards Act, 2006. Every Food Business Operator (FBO) — from a street food cart to a multinational food company — must obtain the appropriate FSSAI registration or licence before starting operations.

Operating without an FSSAI licence is a criminal offence, punishable with imprisonment up to 6 months and fine up to ₹5 lakhs.

## Three Types of FSSAI Licence

## 1. Basic Registration (FSSAI Registration)

For small food businesses with annual turnover below ₹12 lakhs:

• Petty food manufacturers, retailers, temporary stalls, small home-based businesses
• Hawkers, small eateries, home-based bakers
• Fee: ₹100 per year
• Validity: 1–5 years
• Can apply at state/district level (offline or online)

## 2. State Licence

For medium food businesses with annual turnover between ₹12 lakhs and ₹20 crores:

• Restaurants, food processing units, dairy plants, ice cream manufacturers
• Meat processing, grocery stores above threshold
• Fee: ₹2,000–₹5,000 per year (varies by state)
• Validity: 1–5 years
• Applied to the designated State Designated Officer

## 3. Central Licence

For large food businesses and specific categories regardless of turnover:

• Annual turnover exceeds ₹20 crores
• Operating in more than one state (multi-state operations)
• Importing or exporting food
• Food business operators in Central Government premises (railway canteens, defence establishments)
• 100+ bed hospital canteens
• Five-star hotels
• Airports and seaports
• Fee: ₹7,500 per year
• Applied to the Central Licensing Authority

## Documents Required for FSSAI Application

• PAN card of the applicant/entity
• Proof of business address (rent agreement/electricity bill)
• Photograph of the applicant/premises
• List of food products to be manufactured/processed/sold
• Form B declaration (for new applicants)
• For companies/partnerships: Certificate of Incorporation, PAN, board resolution

Additional for food manufacturers:
• Blueprint/layout plan of the processing unit
• List of machinery and equipment
• Water test report (potability certificate)
• Medical fitness certificate of food handlers

## Annual Return Filing

FSSAI licence holders must file an annual return on the FoSCoS portal by 31 May of every year for the preceding financial year — declaring total food products manufactured, imported, and exported.

## Penalty for Non-Compliance

• Operating without FSSAI registration: Imprisonment up to 6 months + fine up to ₹5 lakhs
• Selling unsafe food: Imprisonment up to 7 years + fine up to ₹10 lakhs
• Misleading advertisement: Fine up to ₹10 lakhs
• Selling food without licence (specific food categories): Fine up to ₹2 lakhs

---

What to do: Use ComplianceSearch.in's Compliance Checker to determine whether you need Basic Registration, State Licence, or Central Licence based on your food business turnover and type of operations.`,
    daysAgo: 72,
  },

  {
    title: "Section 44AB Tax Audit: Who Needs It, Threshold and Due Date",
    category: "income_tax",
    tags: "tax audit,Section 44AB,44AB threshold,3CB 3CD,FY 2025-26",
    excerpt: "Section 44AB mandates tax audit for businesses above turnover thresholds and professionals above receipt limits. Know exact thresholds for FY 2025-26, the audit report format, and due date.",
    content: `Tax audit under Section 44AB of the Income Tax Act, 1961, is an audit conducted by a Chartered Accountant (CA) to verify that a business's income, deductions, and taxes are correctly reported in the income tax return. It is not a statutory audit under the Companies Act — it is purely an income tax requirement.

## Who Must Get Tax Audit Done?

## Businesses (Section 44AB(a))

Tax audit is mandatory if:
• Business gross turnover/receipts exceed ₹1 crore in FY 2025-26

Special threshold for cash-based businesses:
• If cash transactions do not exceed 5% of total sales/receipts AND total cash payments do not exceed 5% of total payments → threshold is ₹10 crore (not ₹1 crore)

This higher threshold incentivises digital transactions.

## Professionals (Section 44AB(b))

• Gross receipts from profession exceed ₹50 lakhs in FY 2025-26

## Persons Opting for Presumptive Taxation (Section 44AB(e))

If a person opts for presumptive taxation under Section 44AD (business) or 44ADA (profession) and declares income lower than the presumptive rate → mandatory tax audit applies even if turnover is below threshold.

## What Does the Tax Auditor Check?

The tax auditor:

• Verifies that books of accounts are properly maintained under Section 44AA
• Checks whether income has been correctly computed
• Reports on compliance with specific income tax provisions (Section 40A, 40, 43B etc.)
• Comments on cash payments exceeding ₹10,000 under Section 269ST
• Reports on loans and deposits under Section 269SS and 269T

## Audit Report Format

• Form 3CA: Audit report where accounts are already audited under another law (e.g., companies audited under Companies Act)
• Form 3CB: Audit report where accounts are NOT audited under any other law (proprietorships, partnerships, LLPs)
• Form 3CD: Detailed statement (44 clauses) of particulars — same for both 3CA and 3CB filers

## Due Date — FY 2025-26

• Tax audit report (3CA/3CB + 3CD): 30 September 2026
• Income Tax Return: 31 October 2026 (for tax audit cases)

## Penalty for Not Getting Tax Audit Done

Under Section 271B:

• Penalty: 0.5% of total sales/turnover/gross receipts, or ₹1,50,000 — whichever is LOWER
• Example: Business with ₹3 crore turnover subject to audit → penalty = 0.5% × ₹3 crore = ₹1,50,000 (and the cap is also ₹1,50,000 — so full amount applies)

Reasonable cause is a valid defence against this penalty.

## Important: Limit on Number of Tax Audits per CA

A CA can conduct maximum 60 tax audits in a financial year (as per ICAI guidelines). This creates demand during the September–October period — plan early and book your CA before September.

---

What to do: Track the 30 September tax audit report due date and 31 October ITR filing deadline on ComplianceSearch.in's Income Tax Due Dates calendar. Set reminders well in advance.`,
    daysAgo: 75,
  },

  {
    title: "DPT-3: Return of Deposits — What Every Private Limited Company Must Know",
    category: "mca_roc",
    tags: "DPT-3,deposits,Section 73,Chapter V,annual return,due date 30 June",
    excerpt: "DPT-3 is an annual return that every company accepting or holding deposits — or loans from directors and shareholders — must file by 30 June. Penalty for default is ₹5,000 per day.",
    content: `DPT-3 (Return of Deposits) is a mandatory annual filing for private limited companies that have outstanding deposits, director loans, shareholder loans, or inter-company loans. It is one of the most overlooked ROC filings — and carries one of the highest daily penalties under the Companies Act 2013.

## What is DPT-3?

DPT-3 is the return that companies file annually under Rule 16 of the Companies (Acceptance of Deposits) Rules, 2014. It reports all outstanding loans, deposits, and money received by the company that is not covered under the definition of "share capital" or "secured borrowings from banks/FIs."

## Who Must File DPT-3?

ALL companies (except government companies, banking companies, and housing finance companies) must file DPT-3 if they have:

• Deposits accepted from public (Chapter V companies)
• Loans received from directors (which are exempted deposits under Rule 2(1)(c))
• Loans received from shareholders (companies other than public companies)
• Inter-corporate deposits
• Unsecured loans from related parties
• Advance received for projects that have not been repaid for more than 365 days

Importantly: Even if a company has zero such deposits/loans, many practitioners advise filing a NIL DPT-3 to be safe — though the MCA has clarified that NIL DPT-3 is not mandatory where there are truly no such amounts.

## Due Date

• Annual DPT-3: 30 June every year
• For FY 2025-26 data: Due by 30 June 2026

## Penalty for Non-Filing

This is where DPT-3 differs from other annual filings:

Under Section 73(3) read with Section 76A:

• Company: Fine up to twice the amount of deposits not reported, or ₹10 crore — whichever is LOWER
• Every officer in default: Imprisonment up to 7 years AND/OR fine up to ₹25 lakhs
• Daily default penalty: ₹5,000 per day continuing after the initial penalty

This is significantly higher than the additional fees for AOC-4 or MGT-7 delays. DPT-3 non-filing is treated as a serious violation.

## What to Include in DPT-3

• Total outstanding loans/deposits as on 31 March of the relevant year
• Category-wise breakup (director loans, shareholder loans, inter-corporate deposits, etc.)
• Whether any credit rating has been obtained (for public deposits)
• Auditor's certificate confirming the correctness of the details

## Common Situations Where DPT-3 Is Required

• Director has given a personal loan to the company (not shareholder in capacity but director loan)
• Promoter/shareholder has lent money to the company (common in early-stage companies)
• Company received advance from a customer more than 12 months ago and has not supplied the goods/services
• Holding company has given an inter-corporate loan

---

What to do: Track the 30 June DPT-3 due date on ComplianceSearch.in's ROC Filing Due Dates calendar. Consult your CA to identify whether any amounts received constitute reportable deposits under DPT-3.`,
    daysAgo: 78,
  },
];

async function main() {
  console.log("🌱 Seeding blog posts...\n");
  let created = 0;

  for (const post of posts) {
    const baseSlug = toSlug(post.title);
    let slug = baseSlug;
    let suffix = 1;
    while (await prisma.blogPost.findUnique({ where: { slug } })) {
      slug = `${baseSlug}-${suffix++}`;
    }

    const publishedAt = new Date();
    publishedAt.setDate(publishedAt.getDate() - post.daysAgo);

    await prisma.blogPost.create({
      data: {
        title: post.title,
        slug,
        content: post.content.trim(),
        excerpt: post.excerpt,
        category: post.category,
        tags: post.tags,
        authorName: AUTHOR,
        authorEmail: EMAIL,
        authorPhone: PHONE,
        status: "approved",
        publishedAt,
      },
    });

    console.log(`✅ [${post.category.toUpperCase().padEnd(12)}] ${post.title}`);
    created++;
  }

  console.log(`\n🎉 Done! ${created} blog posts created.`);
}

main()
  .catch(e => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
