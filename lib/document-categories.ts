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
  {
    key: "INCORPORATION",
    label: "Incorporation",
    icon: "ti-certificate",
    color: "blue",
    docs: [
      { type: "COI",        label: "Certificate of Incorporation", required: true },
      { type: "MOA",        label: "MOA (Memorandum of Association)", required: true },
      { type: "AOA",        label: "AOA (Articles of Association)",  required: true },
      { type: "PAN",        label: "PAN Card",                     required: true },
      { type: "TAN",        label: "TAN Card" },
      { type: "SHOP_ACT",  label: "Shop & Establishment" },
    ],
  },
  {
    key: "CERTIFICATES",
    label: "Certificates",
    icon: "ti-award",
    color: "emerald",
    docs: [
      { type: "GST_CERT",       label: "GST Certificate" },
      { type: "MSME_CERT",      label: "MSME Certificate",  hasExpiry: true },
      { type: "IEC_CERT",       label: "IEC Certificate" },
      { type: "TRADE_LICENSE",  label: "Trade License",     hasExpiry: true },
      { type: "FSSAI",          label: "FSSAI License",     hasExpiry: true },
      { type: "DRUG_LICENSE",   label: "Drug License",      hasExpiry: true },
    ],
  },
  {
    key: "ANNUAL_FILING",
    label: "Annual Filings",
    icon: "ti-file-invoice",
    color: "violet",
    hasFY: true,
    docs: [
      { type: "AOC4",                label: "AOC-4" },
      { type: "MGT7",                label: "MGT-7 / 7A" },
      { type: "BOARD_REPORT",        label: "Board Report" },
      { type: "AUDITOR_REPORT",      label: "Auditor's Report" },
      { type: "FINANCIAL_STATEMENTS",label: "Financial Statements" },
    ],
  },
  {
    key: "DIRECTORS",
    label: "Director Documents",
    icon: "ti-user-check",
    color: "amber",
    docs: [
      { type: "DIR3_KYC",   label: "DIR-3 KYC" },
      { type: "DIR12",      label: "DIR-12" },
      { type: "DIN_LETTER", label: "DIN Allotment Letter" },
    ],
  },
  {
    key: "RESOLUTIONS",
    label: "Resolutions & Minutes",
    icon: "ti-notes",
    color: "teal",
    hasFY: true,
    docs: [
      { type: "BOARD_MINUTES",        label: "Board Meeting Minutes" },
      { type: "AGM_MINUTES",          label: "AGM Minutes" },
      { type: "EGM_MINUTES",          label: "EGM Minutes" },
      { type: "SHAREHOLDER_AGREEMENT",label: "Shareholder Agreement" },
    ],
  },
  {
    key: "TAX",
    label: "Tax Filings",
    icon: "ti-receipt-tax",
    color: "red",
    hasFY: true,
    docs: [
      { type: "ITR",             label: "Income Tax Return (ITR)" },
      { type: "TAX_AUDIT_3CD",   label: "Tax Audit Report (3CD)" },
      { type: "TDS_RETURNS",     label: "TDS Returns (24Q/26Q)" },
      { type: "GST_ANNUAL",      label: "GST Annual Return (GSTR-9)" },
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
