export type BusinessType =
  | "proprietorship"
  | "partnership"
  | "llp"
  | "opc"
  | "pvt_ltd"
  | "public_ltd"
  | "section8";

export type IndustrySector =
  | "manufacturing"
  | "trading"
  | "services"
  | "it_software"
  | "food_beverage"
  | "pharma_drug"
  | "healthcare"
  | "construction"
  | "real_estate"
  | "finance_nbfc"
  | "education"
  | "hospitality"
  | "transport"
  | "agriculture"
  | "other";

export type ComplianceCategory =
  | "central_tax"
  | "mca_roc"
  | "labor_law"
  | "industry_license"
  | "environmental"
  | "state_compliance"
  | "import_export"
  | "msme_startup"
  | "financial_sector"
  | "foreign_compliance"
  | "digital_compliance";

export type Frequency =
  | "one_time"
  | "monthly"
  | "quarterly"
  | "half_yearly"
  | "annually"
  | "event_based"
  | "as_applicable";

export interface BusinessProfile {
  // ── Basic fields (Step 1–5 of /check) ──────────────────────────────────────
  businessType: BusinessType;
  state: string;
  turnoverLakhs: number;          // Annual turnover in lakhs
  employeeCount: number;
  contractWorkers: number;
  sector: IndustrySector;
  hasFood: boolean;
  hasPharma: boolean;
  hasManufacturing: boolean;
  hasImportExport: boolean;
  hasForeignInvestment: boolean;
  isStartup: boolean;             // < 10 years, DPIIT criteria
  isListed: boolean;
  hasHazardousWaste: boolean;
  isNBFC: boolean;
  hasMultipleStates: boolean;
  providesServices: boolean;
  sellsGoods: boolean;

  // ── Advanced fields (from /check/advanced — optional) ──────────────────────
  // Financial
  netProfitLakhs?: number;          // ₹ lakhs — CSR threshold: 500 = ₹5 Crore
  netWorthCrore?: number;           // ₹ crore  — CSR threshold: 500 Crore

  // International / FEMA
  hasFDIReceived?: boolean;         // Received FDI in equity → FC-GPR, FLA Return
  hasOverseasSub?: boolean;         // Overseas subsidiary/JV/branch → ODI, APR
  makesForeignPayments?: boolean;   // Payments to non-residents → Form 15CA/15CB
  intlTxnLakhs?: number;           // International related-party transactions (any amount → Form 3CEB)
  groupRevCrore?: number;           // Consolidated group revenue → Master File (≥500), CbCR (≥5500)
  hasECBBorrowing?: boolean;        // External Commercial Borrowing → ECB-2 monthly return
  isForeignEntityIndia?: boolean;   // Foreign entity (Branch/LO/PO) operating in India
  expandingAbroad?: boolean;        // Indian company investing/expanding abroad → ODI

  // Digital / E-commerce
  isEcomOperator?: boolean;         // Runs online marketplace/aggregator → Equalization Levy, ecommerce rules
  collectsPersonalData?: boolean;   // Collects user data → DPDP Act

  // Real Estate / Construction
  hasRealEstateDev?: boolean;       // Real estate developer → RERA project registration
  hasConstructionActivity?: boolean; // Construction with 10+ workers → BOCW cess

  // Other Sector-specific
  hasCryptoVDA?: boolean;           // Virtual Digital Assets (crypto/NFT) → 30% tax, 1% TDS
  receivesForeignDonation?: boolean; // NGO/Section8 with foreign contributions → FCRA
  hasMSMEDues?: boolean;            // Has outstanding dues to MSME suppliers → MSME Form 1
}

export interface ComplianceRule {
  id: string;
  name: string;
  shortName: string;
  category: ComplianceCategory;
  authority: string;
  description: string;
  howToComply: string;
  frequency: Frequency;
  dueDate?: string;
  penalty?: string;
  registrationLink?: string;
  priority: "critical" | "high" | "medium" | "low";
  condition: (p: BusinessProfile) => boolean;
  tags: string[];
}

export interface ComplianceResult {
  rule: ComplianceRule;
  applicable: boolean;
}

export type CategoryMeta = {
  label: string;
  icon: string;
  color: string;
  bgColor: string;
  borderColor: string;
};
