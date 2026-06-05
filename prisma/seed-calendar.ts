import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import * as dotenv from "dotenv";
import * as path from "path";

dotenv.config({ path: path.resolve(__dirname, "../.env.local") });

const connectionString = process.env.DATABASE_URL!;
const adapter = new PrismaPg({ connectionString });
const prisma = new PrismaClient({ adapter } as any);

const events = [
  // ──────────── MONTHLY ────────────
  { title: "GSTR-1 (Monthly Filers)", description: "Monthly outward supply return for turnover > ₹5 Cr", category: "central_tax", authority: "CBIC / GST Portal", recurrence: "monthly", dueDay: 11, penalty: "₹50/day (CGST+SGST)", link: "https://gst.gov.in" },
  { title: "GSTR-3B Monthly Return", description: "Summary GST return with tax payment", category: "central_tax", authority: "CBIC / GST Portal", recurrence: "monthly", dueDay: 20, penalty: "₹50/day + 18% interest", link: "https://gst.gov.in" },
  { title: "TDS/TCS Payment", description: "Deposit TDS/TCS deducted in previous month", category: "central_tax", authority: "Income Tax Dept / TIN-NSDL", recurrence: "monthly", dueDay: 7, penalty: "1.5% per month", link: "https://tin.tin.nsdl.com" },
  { title: "PF Contribution Payment", description: "Employee + Employer PF contribution (for March: 15th April)", category: "labor_law", authority: "EPFO", recurrence: "monthly", dueDay: 15, penalty: "Interest @12% pa + damages", link: "https://www.epfindia.gov.in" },
  { title: "ESIC Contribution Payment", description: "Employer + Employee ESIC contribution", category: "labor_law", authority: "ESIC", recurrence: "monthly", dueDay: 15, penalty: "Interest + damages applicable", link: "https://www.esic.in" },
  { title: "Professional Tax (Maharashtra/Karnataka)", description: "Professional tax deduction & payment (state-specific)", category: "labor_law", authority: "State Tax Dept", recurrence: "monthly", dueDay: 31, penalty: "Varies by state", link: null },

  // ──────────── QUARTERLY ────────────
  { title: "TDS Return — Q1 (Apr-Jun)", description: "TDS return for Q1 — Form 24Q / 26Q / 27Q", category: "central_tax", authority: "Income Tax Dept", recurrence: "annual", dueDay: 31, dueMonth: 6, penalty: "₹200/day under Sec 234E", link: "https://tin.tin.nsdl.com" },
  { title: "TDS Return — Q2 (Jul-Sep)", description: "TDS return for Q2 — Form 24Q / 26Q / 27Q", category: "central_tax", authority: "Income Tax Dept", recurrence: "annual", dueDay: 31, dueMonth: 9, penalty: "₹200/day under Sec 234E", link: "https://tin.tin.nsdl.com" },
  { title: "TDS Return — Q3 (Oct-Dec)", description: "TDS return for Q3 — Form 24Q / 26Q / 27Q", category: "central_tax", authority: "Income Tax Dept", recurrence: "annual", dueDay: 31, dueMonth: 0, penalty: "₹200/day under Sec 234E", link: "https://tin.tin.nsdl.com" },
  { title: "TDS Return — Q4 (Jan-Mar)", description: "TDS return for Q4 — Form 24Q / 26Q / 27Q", category: "central_tax", authority: "Income Tax Dept", recurrence: "annual", dueDay: 31, dueMonth: 4, penalty: "₹200/day under Sec 234E", link: "https://tin.tin.nsdl.com" },
  { title: "Advance Tax — Q1 (15%)", description: "First installment of advance tax — 15% of annual tax liability", category: "central_tax", authority: "Income Tax Dept", recurrence: "annual", dueDay: 15, dueMonth: 5, penalty: "Interest u/s 234B & 234C", link: "https://www.incometax.gov.in" },
  { title: "Advance Tax — Q2 (45%)", description: "Second installment — cumulative 45% of annual tax", category: "central_tax", authority: "Income Tax Dept", recurrence: "annual", dueDay: 15, dueMonth: 8, penalty: "Interest u/s 234B & 234C", link: "https://www.incometax.gov.in" },
  { title: "Advance Tax — Q3 (75%)", description: "Third installment — cumulative 75% of annual tax", category: "central_tax", authority: "Income Tax Dept", recurrence: "annual", dueDay: 15, dueMonth: 11, penalty: "Interest u/s 234B & 234C", link: "https://www.incometax.gov.in" },
  { title: "Advance Tax — Q4 (100%)", description: "Final installment — 100% of annual tax liability", category: "central_tax", authority: "Income Tax Dept", recurrence: "annual", dueDay: 15, dueMonth: 2, penalty: "Interest u/s 234B & 234C", link: "https://www.incometax.gov.in" },
  { title: "GSTR-1 (Quarterly — QRMP)", description: "Quarterly return for QRMP filers (turnover ≤ ₹5 Cr)", category: "central_tax", authority: "CBIC / GST Portal", recurrence: "quarterly", dueDay: 13, penalty: "₹50/day", link: "https://gst.gov.in" },

  // ──────────── ANNUAL ────────────
  { title: "Income Tax Return — Individuals (ITR-1/2/3/4)", description: "Annual ITR for individuals & HUF (non-audit cases)", category: "central_tax", authority: "Income Tax Dept", recurrence: "annual", dueDay: 31, dueMonth: 6, penalty: "Late fee u/s 234F up to ₹5,000", link: "https://www.incometax.gov.in" },
  { title: "Income Tax Return — Companies (ITR-6)", description: "Annual ITR for companies (audit cases)", category: "central_tax", authority: "Income Tax Dept", recurrence: "annual", dueDay: 31, dueMonth: 9, penalty: "Late fee u/s 234F up to ₹10,000", link: "https://www.incometax.gov.in" },
  { title: "Tax Audit Report (Form 3CA/3CB)", description: "Tax audit report for turnover > ₹1 Cr (business) / ₹50L (profession)", category: "central_tax", authority: "Income Tax Dept", recurrence: "annual", dueDay: 30, dueMonth: 8, penalty: "0.5% of turnover or ₹1.5 Lakh (whichever less)", link: null },
  { title: "GSTR-9 Annual Return", description: "GST annual return (mandatory for turnover > ₹2 Cr)", category: "central_tax", authority: "CBIC / GST Portal", recurrence: "annual", dueDay: 31, dueMonth: 11, penalty: "₹200/day (CGST+SGST)", link: "https://gst.gov.in" },
  { title: "GSTR-9C (Reconciliation Statement)", description: "GST audit & reconciliation (turnover > ₹5 Cr)", category: "central_tax", authority: "CBIC / GST Portal", recurrence: "annual", dueDay: 31, dueMonth: 11, penalty: "₹200/day", link: "https://gst.gov.in" },
  { title: "ROC Annual Return (MGT-7/7A)", description: "Annual return with MCA for companies and LLPs", category: "mca_roc", authority: "MCA / ROC", recurrence: "annual", dueDay: 28, dueMonth: 10, penalty: "₹100/day additional fee", link: "https://mca.gov.in" },
  { title: "Financial Statements Filing (AOC-4)", description: "Filing audited financials with ROC", category: "mca_roc", authority: "MCA / ROC", recurrence: "annual", dueDay: 29, dueMonth: 9, penalty: "₹100/day additional fee", link: "https://mca.gov.in" },
  { title: "Company Annual Audit", description: "Statutory audit of financial statements — appoint auditor for FY", category: "mca_roc", authority: "ICAI / ROC", recurrence: "annual", dueDay: 30, dueMonth: 8, penalty: "Non-compliance of Companies Act", link: null },
  { title: "DPT-3 (Deposits Return)", description: "Return of deposits — for companies accepting loans/deposits", category: "mca_roc", authority: "MCA", recurrence: "annual", dueDay: 30, dueMonth: 5, penalty: "₹5,000 + ₹500/day", link: "https://mca.gov.in" },
  { title: "AGM (Annual General Meeting)", description: "Annual General Meeting — within 6 months from financial year end", category: "mca_roc", authority: "Companies Act 2013", recurrence: "annual", dueDay: 30, dueMonth: 8, penalty: "Default fine under Companies Act", link: null },
  { title: "PF Annual Return", description: "Annual PF return filing with EPFO", category: "labor_law", authority: "EPFO", recurrence: "annual", dueDay: 25, dueMonth: 3, penalty: "Damages applicable", link: "https://www.epfindia.gov.in" },
  { title: "ESIC Annual Return", description: "Annual ESIC return for covered establishments", category: "labor_law", authority: "ESIC", recurrence: "annual", dueDay: 11, dueMonth: 10, penalty: "Damages + interest", link: "https://www.esic.in" },
  { title: "FSSAI License Renewal", description: "Annual renewal of FSSAI food business operator license", category: "industry_license", authority: "FSSAI", recurrence: "annual", dueDay: 31, dueMonth: 3, penalty: "License cancellation, fine up to ₹5 Lakh", link: "https://foscos.fssai.gov.in" },
  { title: "Director KYC (DIR-3 KYC)", description: "Annual KYC for all directors having DIN", category: "mca_roc", authority: "MCA", recurrence: "annual", dueDay: 30, dueMonth: 8, penalty: "₹5,000 late fee + DIN deactivation", link: "https://mca.gov.in" },
  { title: "Form 15CA/15CB (Foreign Remittance)", description: "Reporting of foreign remittances under FEMA", category: "import_export", authority: "RBI / Income Tax Dept", recurrence: "annual", dueDay: 31, dueMonth: 9, penalty: "Penalty under FEMA", link: null },
  { title: "Transfer Pricing Report (Form 3CEB)", description: "Transfer pricing audit for international transactions > ₹1 Cr", category: "import_export", authority: "Income Tax Dept", recurrence: "annual", dueDay: 31, dueMonth: 9, penalty: "2% of value of international transaction", link: null },
];

async function main() {
  console.log("Seeding calendar events...");

  // Clear existing
  await prisma.calendarEvent.deleteMany({});

  for (const e of events) {
    await prisma.calendarEvent.create({
      data: {
        title: e.title,
        description: e.description || null,
        category: e.category,
        authority: e.authority,
        recurrence: e.recurrence,
        dueDay: (e as any).dueDay || null,
        dueMonth: (e as any).dueMonth != null ? (e as any).dueMonth : null,
        specificDate: (e as any).specificDate ? new Date((e as any).specificDate) : null,
        penalty: (e as any).penalty || null,
        link: (e as any).link || null,
        isActive: true,
      },
    });
  }

  console.log(`✓ Seeded ${events.length} calendar events`);
  await prisma.$disconnect();
}

main().catch(e => { console.error(e); process.exit(1); });
