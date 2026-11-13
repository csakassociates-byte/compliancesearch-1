export interface DocTypeDefinition {
  type: string;
  label: string;
  required?: boolean;
  hasExpiry?: boolean;
  hasFY?: boolean;
}

export interface CategoryDefinition {
  key: string;
  label: string;
  icon: string;
  color: string;
  hasFY?: boolean;
  docs: DocTypeDefinition[];
}

export const DOC_CATEGORIES: CategoryDefinition[] = [
  // ── 1. INCORPORATION ──────────────────────────────────────────────────────
  {
    key: "INCORPORATION",
    label: "Incorporation",
    icon: "ti-certificate",
    color: "blue",
    docs: [
      { type: "COI",           label: "Certificate of Incorporation",          required: true },
      { type: "MOA",           label: "MOA (Memorandum of Association)",        required: true },
      { type: "AOA",           label: "AOA (Articles of Association)",          required: true },
      { type: "PAN",           label: "PAN Card",                               required: true },
      { type: "TAN",           label: "TAN Card" },
      { type: "INC20A",        label: "INC-20A (Commencement of Business)" },
      { type: "INC22",         label: "INC-22 (Registered Office Proof)" },
      { type: "RUN_APPROVAL",  label: "Name Approval Letter (RUN)" },
      { type: "SHARE_CERT",    label: "Share Certificates" },
      { type: "SHOP_ACT",      label: "Shop & Establishment" },
    ],
  },

  // ── 2. REGISTRATIONS & LICENSES ───────────────────────────────────────────
  {
    key: "CERTIFICATES",
    label: "Registrations & Licenses",
    icon: "ti-license",
    color: "emerald",
    docs: [
      { type: "GST_CERT",        label: "GST Registration Certificate" },
      { type: "MSME_CERT",       label: "MSME / Udyam Certificate" },
      { type: "IEC_CERT",        label: "IEC Certificate (Import Export Code)" },
      { type: "PT_REG",          label: "Professional Tax Registration" },
      { type: "ESIC_REG",        label: "ESIC Registration Certificate" },
      { type: "EPF_REG",         label: "EPF / PF Registration Certificate" },
      { type: "STARTUP_INDIA",   label: "Startup India / DPIIT Recognition" },
      { type: "TRADE_LICENSE",   label: "Trade License",                        hasExpiry: true },
      { type: "FSSAI",           label: "FSSAI License",                        hasExpiry: true },
      { type: "DRUG_LICENSE",    label: "Drug License",                         hasExpiry: true },
      { type: "FACTORY_LICENSE", label: "Factory License",                      hasExpiry: true },
      { type: "POLLUTION_NOC",   label: "Pollution Control Certificate (CTE/CTO)", hasExpiry: true },
      { type: "FIRE_NOC",        label: "Fire NOC",                             hasExpiry: true },
    ],
  },

  // ── 3. ANNUAL FILINGS (MCA) ────────────────────────────────────────────────
  {
    key: "ANNUAL_FILING",
    label: "Annual Filings",
    icon: "ti-file-invoice",
    color: "violet",
    hasFY: true,
    docs: [
      { type: "AOC4",                 label: "AOC-4 (Financial Statements)" },
      { type: "MGT7",                 label: "MGT-7 / MGT-7A (Annual Return)" },
      { type: "BOARD_REPORT",         label: "Board Report" },
      { type: "AUDITOR_REPORT",       label: "Auditor's Report" },
      { type: "CARO_REPORT",          label: "CARO Report (Auditor's Annexure)" },
      { type: "FINANCIAL_STATEMENTS", label: "Financial Statements (BS + P&L)" },
      { type: "ADT1",                 label: "ADT-1 (Auditor Appointment ROC)" },
      { type: "AUDITOR_APPT_LETTER",  label: "Auditor Appointment Letter" },
      { type: "DPT3",                 label: "DPT-3 (Return of Deposits / Loans)" },
      { type: "MGT14_FINANCIAL",      label: "MGT-14 (Financial Resolutions)" },
      { type: "MR3",                  label: "MR-3 (Secretarial Audit Report)" },
      { type: "INTERNAL_AUDIT",       label: "Internal Audit Report" },
    ],
  },

  // ── 4. RESOLUTIONS & MINUTES ───────────────────────────────────────────────
  {
    key: "RESOLUTIONS",
    label: "Resolutions & Minutes",
    icon: "ti-notes",
    color: "teal",
    hasFY: true,
    docs: [
      { type: "BOARD_NOTICE",        label: "Board Meeting Notice" },
      { type: "BOARD_MINUTES",       label: "Board Meeting Minutes" },
      { type: "BOARD_ATTENDANCE",    label: "Board Meeting Attendance Register" },
      { type: "AGM_NOTICE",          label: "AGM Notice" },
      { type: "AGM_MINUTES",         label: "AGM Minutes" },
      { type: "EGM_MINUTES",         label: "EGM Minutes" },
      { type: "CIRCULAR_RESOLUTION", label: "Circular / Written Resolution" },
      { type: "POSTAL_BALLOT",       label: "Postal Ballot Notice & Result" },
      { type: "COMMITTEE_MINUTES",   label: "Committee Minutes (Audit / NRC)" },
      { type: "PROXY_FORMS",         label: "Proxy Forms (MGT-11)" },
      { type: "SHAREHOLDER_AGREEMENT",label: "Shareholder Agreement (SHA)" },
    ],
  },

  // ── 5. DIRECTORS & SHAREHOLDERS ───────────────────────────────────────────
  {
    key: "DIRECTORS",
    label: "Directors & Shareholders",
    icon: "ti-users",
    color: "amber",
    docs: [
      { type: "DIN_LETTER",      label: "DIN Allotment Letter" },
      { type: "DIR2",            label: "DIR-2 (Director Consent Letter)" },
      { type: "DIR3_KYC",        label: "DIR-3 KYC" },
      { type: "DIR8",            label: "DIR-8 (Disqualification Declaration)" },
      { type: "MBP1",            label: "MBP-1 (Director's Disclosure of Interest)" },
      { type: "DIR12",           label: "DIR-12 (Change in Directors)" },
      { type: "DIR_APPT_LETTER", label: "Director Appointment Letter" },
      { type: "DIR_RESIGN",      label: "Director Resignation Letter" },
      { type: "MGT1",            label: "Register of Members (MGT-1)" },
      { type: "BEN1",            label: "BEN-1 (SBO Declaration)" },
      { type: "BEN2",            label: "BEN-2 (SBO Return — ROC)" },
      { type: "BEN3",            label: "BEN-3 (Register of Beneficial Owners)" },
      { type: "PAS3",            label: "PAS-3 (Return of Share Allotment)" },
      { type: "SH4",             label: "SH-4 (Share Transfer Deed)" },
      { type: "CHG1",            label: "CHG-1 (Charge Creation)" },
      { type: "CHG4",            label: "CHG-4 (Charge Satisfaction)" },
    ],
  },

  // ── 6. TAX FILINGS ────────────────────────────────────────────────────────
  {
    key: "TAX",
    label: "Tax Filings",
    icon: "ti-receipt-tax",
    color: "red",
    hasFY: true,
    docs: [
      { type: "ITR",             label: "Income Tax Return (ITR-6)" },
      { type: "TAX_AUDIT_3CD",   label: "Tax Audit Report (3CD + 3CB)" },
      { type: "FORM_26AS",       label: "Form 26AS / AIS / TIS" },
      { type: "ADVANCE_TAX",     label: "Advance Tax Challan" },
      { type: "TDS_RETURNS",     label: "TDS Returns — 24Q (Salary)" },
      { type: "TDS_26Q",         label: "TDS Returns — 26Q (Non-Salary)" },
      { type: "FORM16",          label: "Form 16 / 16A (TDS Certificates)" },
      { type: "ASSESSMENT_ORDER",label: "143(1) Intimation / Assessment Order" },
      { type: "GST_ANNUAL",      label: "GSTR-9 (Annual Return)" },
      { type: "GSTR9C",          label: "GSTR-9C (Reconciliation Statement)" },
      { type: "GSTR1",           label: "GSTR-1 (Outward Supplies)" },
      { type: "GSTR3B",          label: "GSTR-3B (Summary Return)" },
      { type: "PT_RETURN",       label: "Professional Tax Return" },
    ],
  },

  // ── 7. LABOUR & HR COMPLIANCE ─────────────────────────────────────────────
  {
    key: "LABOUR",
    label: "Labour & HR Compliance",
    icon: "ti-id-badge",
    color: "indigo",
    hasFY: true,
    docs: [
      { type: "EPF_CHALLAN",   label: "EPF / PF Monthly Challan (ECR)" },
      { type: "PF_ANNUAL",     label: "Annual PF Return (Form 3A / 6A)" },
      { type: "ESIC_CHALLAN",  label: "ESIC Monthly Challan" },
      { type: "ESIC_RETURN",   label: "ESIC Half-yearly Return" },
      { type: "PT_CHALLAN",    label: "Professional Tax Challan" },
      { type: "LWF_CHALLAN",   label: "Labour Welfare Fund Challan" },
      { type: "POSH_POLICY",   label: "POSH Policy" },
      { type: "POSH_ANNUAL",   label: "POSH Annual Report" },
      { type: "GRATUITY",      label: "Gratuity Fund / LIC Policy" },
      { type: "BONUS_REGISTER",label: "Bonus Payment Register" },
    ],
  },

  // ── 8. BANKING & FINANCE ──────────────────────────────────────────────────
  {
    key: "BANKING",
    label: "Banking & Finance",
    icon: "ti-bank",
    color: "sky",
    docs: [
      { type: "BANK_RESOLUTION",   label: "Bank Account Opening Resolution" },
      { type: "LOAN_SANCTION",     label: "Loan Sanction Letter" },
      { type: "LOAN_AGREEMENT",    label: "Loan Agreement / Hypothecation Deed" },
      { type: "OD_CC_DOCS",        label: "OD / CC Facility Documents" },
      { type: "MORTGAGE_DOCS",     label: "Mortgage / Property Pledge Documents" },
      { type: "NET_WORTH_CERT",    label: "Net Worth Certificate" },
      { type: "BANK_STATEMENT",    label: "Annual Bank Statement" },
    ],
  },

  // ── 9. IP, CONTRACTS & PROPERTY ───────────────────────────────────────────
  {
    key: "IP_CONTRACTS",
    label: "IP, Contracts & Property",
    icon: "ti-file-code",
    color: "fuchsia",
    docs: [
      { type: "TRADEMARK_CERT",   label: "Trademark Registration Certificate", hasExpiry: true },
      { type: "TRADEMARK_APP",    label: "Trademark Application Acknowledgement" },
      { type: "PATENT_CERT",      label: "Patent Registration Certificate",    hasExpiry: true },
      { type: "COPYRIGHT_CERT",   label: "Copyright Registration Certificate" },
      { type: "DOMAIN_REG",       label: "Domain Name Registration",           hasExpiry: true },
      { type: "LEASE_AGREEMENT",  label: "Lease Agreement (Registered Office)", hasExpiry: true },
      { type: "PROPERTY_DEED",    label: "Property Deed / Sale Deed" },
      { type: "INSURANCE_DO",     label: "D&O Liability Insurance",            hasExpiry: true },
      { type: "INSURANCE_PI",     label: "Professional Indemnity Insurance",   hasExpiry: true },
      { type: "INSURANCE_GHI",    label: "Group Health Insurance",             hasExpiry: true },
      { type: "IP_ASSIGNMENT",    label: "IP Assignment Deed" },
      { type: "SOFTWARE_LICENSE", label: "Software License Agreements",        hasExpiry: true },
    ],
  },

  // ── OTHER ─────────────────────────────────────────────────────────────────
  {
    key: "OTHER",
    label: "Other Documents",
    icon: "ti-folder-plus",
    color: "slate",
    docs: [
      { type: "OTHER", label: "Other Document" },
    ],
  },
];

export function getCategoryByKey(key: string): CategoryDefinition | undefined {
  return DOC_CATEGORIES.find(c => c.key === key);
}

export function getDocLabel(category: string, docType: string): string {
  const cat = getCategoryByKey(category);
  const doc = cat?.docs.find(d => d.type === docType);
  return doc?.label ?? docType;
}
