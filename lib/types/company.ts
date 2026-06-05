/**
 * Standard CompanyData type — used across all document tools.
 * Parsed from MCA Master Data Excel (MDS) and/or stored in DB.
 */

export interface DirectorData {
  din?: string;
  name: string;
  designation?: string;
  category?: string;
  appointedAt?: string;
  ceasedAt?: string;
  isActive: boolean;
  isSig?: boolean; // is signatory = Yes in MDS
}

export interface ChargeData {
  chargeId?: string;
  holderName: string;
  dateOfCreation?: string;
  amount?: string;
  address?: string;
  isSatisfied?: boolean;
}

export interface CompanyData {
  // ── Identifiers ──────────────────────────────────────────
  cin: string;
  companyName: string;
  registrationNumber?: string;

  // ── Basic Info ───────────────────────────────────────────
  regAddress?: string;
  entityType?: string;              // pvt_ltd | opc | public_ltd | llp | section8 | nidhi
  email?: string;
  rocName?: string;
  status?: string;                  // Active | Struck off etc.
  isListed?: boolean;

  // ── Capital ──────────────────────────────────────────────
  authorisedCapital?: string;       // Raw string: "60,00,00,000"
  paidUpCapital?: string;           // Raw string: "39,99,99,800"

  // ── Dates ────────────────────────────────────────────────
  incorporationDate?: string;       // "28/09/2017"
  dateOfLastAGM?: string;
  dateOfBalanceSheet?: string;

  // ── Classification ───────────────────────────────────────
  categoryOfCompany?: string;       // "Company limited by shares"
  subcategory?: string;             // "Non-government company"
  classOfCompany?: string;          // "Public" | "Private"
  jurisdiction?: string;
  smallCompany?: boolean;

  // ── Contact ──────────────────────────────────────────────
  mobile?: string;
  gstNumber?: string;

  // ── Source ───────────────────────────────────────────────
  sourceFile?: string;

  // ── Related ──────────────────────────────────────────────
  directors: DirectorData[];
  charges: ChargeData[];
}
