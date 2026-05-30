/**
 * Required documents for each compliance rule.
 * Keyed by ruleKey. Used by seed script and admin panel.
 */
export const RULE_DOCUMENTS: Record<string, string[]> = {

  // ─── CENTRAL TAX ──────────────────────────────────────────────────────────

  pan: [
    "Aadhaar Card of proprietor / directors / partners",
    "Certificate of Incorporation / Partnership Deed / Trust Deed",
    "Address proof of registered office (rent agreement or utility bill)",
    "Passport-size photograph of applicant",
    "Board resolution / authority letter (for companies)",
  ],

  itr: [
    "Audited / provisional P&L Account and Balance Sheet",
    "Bank statements for full financial year (all accounts)",
    "Form 26AS / AIS / TIS — Annual Tax Credit Statement",
    "TDS certificates — Form 16 (salary) / Form 16A (non-salary)",
    "Tax audit report in Form 3CB-3CD (if turnover exceeds threshold)",
    "Investment and capital gain statements",
    "Previous year's filed ITR copy",
    "Challan receipts for advance tax paid",
  ],

  tds_deduction: [
    "TAN Registration Certificate (applied via Form 49B)",
    "PAN of all deductees (employees / contractors / vendors)",
    "Salary register / contractor invoices / rent agreements",
    "TDS deposit challans (BSR code, date, amount)",
    "Form 24Q / 26Q / 27Q / 27EQ data for quarterly returns",
    "TRACES login credentials for filing returns",
    "Deductee-wise TDS working sheet",
  ],

  advance_tax: [
    "Estimated income and tax liability calculation",
    "Form 26AS / AIS to check TDS credits",
    "Challan 280 receipts for each instalment paid",
    "Previous year's final tax liability for reference",
  ],

  gst_reg: [
    "PAN card of the business entity",
    "Aadhaar card of proprietor / managing partner / authorized director",
    "Certificate of Incorporation / Partnership deed / LLP agreement",
    "Address proof of principal place of business (rent agreement + electricity bill)",
    "Latest bank account statement or cancelled cheque (pre-printed name)",
    "Passport-size photograph of authorized signatory",
    "Digital Signature Certificate — DSC (mandatory for companies & LLPs)",
    "Board resolution / authority letter authorizing signatory",
    "NOC from property owner (if premises are rented)",
  ],

  gstr1: [
    "Tax invoices (B2B and B2C sales)",
    "Credit notes and debit notes issued",
    "Advance receipt vouchers and adjustment invoices",
    "Export invoices / bill of export / shipping bills",
    "HSN / SAC-wise sales summary",
    "E-way bill numbers (if applicable)",
  ],

  gstr3b: [
    "Sales summary (GSTR-1 data reconciled)",
    "Purchase invoices eligible for Input Tax Credit",
    "GSTR-2B auto-drafted ITC statement",
    "Reverse charge liability details",
    "GST payment challan (DRC-03 / PMT-06 if advance)",
    "ITC reversal details (Rule 42 / 43 if applicable)",
  ],

  gstr9: [
    "All GSTR-1 returns filed during the financial year",
    "All GSTR-3B returns filed during the financial year",
    "Audited annual financial statements",
    "Annual ITC reconciliation statement (GSTR-2A vs books)",
    "Any pending ITC claimed / reversed in subsequent year",
    "HSN-wise annual supply summary",
  ],

  gstr9c: [
    "Filed GSTR-9 for the year",
    "Audited P&L Account and Balance Sheet",
    "CA / CMA certificate and signed reconciliation statement",
    "Detailed working notes for turnover and tax reconciliation",
    "Annual ITC reconciliation workings",
  ],

  // ─── MCA / ROC ────────────────────────────────────────────────────────────

  roc_incorporation: [
    "Memorandum of Association (MOA) — objects clause",
    "Articles of Association (AOA)",
    "Director Identification Number (DIN) for all directors",
    "Digital Signature Certificate (DSC) of at least one director",
    "Identity proof of all directors (Aadhaar / Passport)",
    "Address proof of registered office (ownership / rent agreement)",
    "NOC from property owner for use as registered office",
    "Subscriber sheet signed by all promoters",
  ],

  aoc4: [
    "Audited Balance Sheet as at 31 March",
    "Audited Profit & Loss Statement for the year",
    "Cash Flow Statement (mandatory for all except OPC/small cos)",
    "Notes to Financial Accounts",
    "Directors' Report with required annexures (MGT-9, AOC-2, etc.)",
    "Auditor's Report (standalone)",
    "Board resolution approving financial statements and Directors' Report",
    "AGM notice and minutes approving accounts",
  ],

  mgt7: [
    "List of shareholders with no. of shares, class, and paid-up value",
    "Details of all directors: DIN, address, date of appointment / cessation",
    "Details of all board meetings held with attendance",
    "Indebtedness details (secured / unsecured loans)",
    "Details of shares transferred during the year",
    "Company's registered / principal business activity",
    "Signed copy of Annual Return (certified by CS / director)",
  ],

  llp_form11: [
    "Details of all partners: DPIN, name, address, contribution",
    "Details of designated partners",
    "LLP agreement (if any changes occurred during the year)",
    "Summary of changes in partner details during the year",
  ],

  llp_form8: [
    "Statement of Assets and Liabilities (Balance Sheet)",
    "Statement of Income and Expenditure (P&L)",
    "Solvency declaration signed by designated partners",
    "Auditor's Report (if turnover exceeds ₹40 Lakhs)",
    "Bank statements for reconciliation",
  ],

  statutory_audit: [
    "Complete books of accounts — cash book, ledgers, day book",
    "Bank statements and bank reconciliation statements for all accounts",
    "Fixed asset register with additions, disposals, and depreciation",
    "Stock / inventory records and closing stock valuation",
    "All purchase and sales invoices",
    "Loan agreements and repayment schedules",
    "Investment portfolio details",
    "Statutory registers (members register, directors register, etc.)",
    "Previous year's audited financial statements and audit report",
  ],

  board_meetings: [
    "Board meeting notice (21 clear days in advance)",
    "Agenda for each meeting",
    "Board papers / management reports",
    "Signed minutes of each board meeting",
    "Attendance register / recording of attendance",
    "Resolutions passed (signed by Chairman)",
  ],

  agm: [
    "AGM notice with 21 clear days' advance (shorter if 95% consent)",
    "Annual Report — Directors' Report + Financial Statements",
    "Auditor's Report",
    "Proxy Form (Form MGT-11)",
    "Attendance register at AGM",
    "Minutes of AGM signed by Chairman",
    "Voting results (if e-voting conducted — Form MGT-13)",
  ],

  dir3_kyc: [
    "Aadhaar card (self-attested)",
    "PAN card",
    "Personal mobile number (for OTP verification)",
    "Personal email ID (for OTP verification)",
    "Passport-size photograph (recent)",
    "Digital Signature Certificate (Class 3 DSC)",
    "Passport copy (for NRIs / foreign nationals)",
  ],

  // ─── LABOUR LAWS ──────────────────────────────────────────────────────────

  pf_reg: [
    "PAN of the establishment",
    "Certificate of registration / incorporation",
    "Address proof of establishment (utility bill / lease deed)",
    "List of all employees with name, DOB, Aadhaar, PAN, salary",
    "Bank account details of establishment (cancelled cheque)",
    "Digital Signature Certificate of authorized signatory",
    "Wage / salary register",
  ],

  esic_reg: [
    "PAN of employer",
    "Certificate of registration / incorporation",
    "List of employees with wages and dates of joining",
    "Address proof of establishment",
    "Bank account details (cancelled cheque)",
    "Aadhaar / ID proof of employees (for IP numbers)",
    "Employee health check-up records (desirable)",
  ],

  professional_tax: [
    "Employee salary register with gross salary details",
    "Professional Tax Enrollment Certificate (PT EC) of employer",
    "PT Registration Certificate (state-specific)",
    "Monthly wage slips for each employee",
    "PT payment challans to state treasury",
  ],

  shops_est: [
    "Application form (state labour department form)",
    "Identity proof of owner — Aadhaar / PAN / Passport",
    "Address proof of business premises (rent agreement or ownership deed)",
    "Rent agreement / lease deed (if rented premises)",
    "List of employees with designation and wages",
    "Photograph of establishment and signboard",
    "NOC from property owner (if applicable)",
  ],

  gratuity: [
    "Employee service records from date of joining",
    "Salary history — last drawn salary details",
    "Nomination form (Form F) submitted by employee",
    "Group Gratuity insurance policy certificate (if insured)",
    "Attendance and leave records",
    "Separation documents (resignation / termination letter)",
  ],

  payment_bonus: [
    "Wage / salary register showing gross and allocable surplus",
    "Annual bonus calculation statement (Form B — Computation)",
    "Register of bonus paid to each employee (Form D)",
    "Employee attendance records for bonus eligibility",
    "P&L account for arriving at allocable surplus",
  ],

  minimum_wages: [
    "Muster roll showing daily attendance (Form XVI)",
    "Wage register showing wages paid per employee (Form I)",
    "Wage slips issued to employees",
    "State government minimum wage notification (current rates)",
    "Register of deductions from wages (Form II)",
    "Register of overtime (if applicable)",
  ],

  posh_act: [
    "ICC constitution order naming all members",
    "POSH policy document (approved by management)",
    "Records of awareness training / workshops conducted",
    "Annual report filed to District Officer (as per Form in Rules)",
    "Complaint register (maintained by ICC)",
    "External member appointment letter / MOU",
  ],

  contract_labour: [
    "Registration certificate (Form I) — principal employer",
    "Contractor's license (Form IV) for each contractor",
    "List of contractors with nature of work and worker count",
    "Contract / work order agreements",
    "Register of contractors (Form XII)",
    "Register of contract workers (Form XIII)",
    "Muster roll and wage register of contract workers",
  ],

  lwf: [
    "LWF registration certificate from State Labour Welfare Board",
    "Employee register with wages (for contribution calculation)",
    "Half-yearly / annual LWF contribution challans",
    "Statement of contribution paid (Form A / state-specific form)",
  ],

  maternity_benefit: [
    "Medical certificate confirming pregnancy (Form A)",
    "Employee's application for maternity leave",
    "Employment records (to establish 80 days eligibility)",
    "ESIC coverage details (if covered, separate compliance not needed)",
    "Medical bonus payment proof (₹3,500 if no creche facility)",
  ],

  // ─── INDUSTRY LICENSES ────────────────────────────────────────────────────

  factory_license: [
    "Site plan and factory layout plan",
    "Details of manufacturing process / flow chart",
    "Complete list of machinery and equipment with power in KW",
    "List of workers — male, female, child (not permitted)",
    "Structural stability certificate from licensed engineer",
    "Fire NOC from State Fire Department",
    "NOC from State Pollution Control Board (CTE)",
    "Ownership / lease deed of factory premises",
    "Form 2 — Application to State Chief Inspector of Factories",
  ],

  pollution_noc: [
    "Application form to State Pollution Control Board",
    "Process flow diagram with all emission and effluent points",
    "Water and power requirement and source details",
    "List of raw materials and finished products with quantities",
    "ETP / STP design documents and capacity",
    "Stack emission data and air pollution control equipment details",
    "Land documents (ownership or lease deed)",
    "Site location map",
    "Environmental Impact Assessment report (for large projects)",
  ],

  fire_noc: [
    "Building / factory layout plan showing fire escape routes",
    "List of fire safety equipment installed (extinguishers, hydrants, sprinklers)",
    "Fire extinguisher maintenance records and AMC certificates",
    "Emergency evacuation plan and assembly point details",
    "Occupancy / completion certificate",
    "Application form to local Fire Department",
  ],

  fssai_license: [
    "PAN card of business",
    "Food Safety Management System (FSMS) plan",
    "Complete list of food products manufactured / handled",
    "Ownership or rent agreement for food premises",
    "Latest water test report from NABL-accredited lab",
    "Medical fitness certificates of all food handlers",
    "Source and supplier details of raw materials",
    "List of equipment and machinery used",
    "NOC from Municipal corporation / Gram Panchayat",
    "Blueprint / layout plan of food processing area",
  ],

  fssai_return: [
    "FSSAI license number",
    "Quantity of each food product manufactured / processed during the year",
    "Raw material consumption register",
    "Turnover details (as per books of accounts)",
    "Export quantity details (if applicable)",
  ],

  drug_license: [
    "Layout plan of premises (showing dispensing / manufacturing area)",
    "Ownership or tenancy document of premises",
    "Educational qualification certificates of Registered Pharmacist",
    "Registration certificate of Pharmacist (Form D — State Pharmacy Council)",
    "Equipment and instrument list with specifications",
    "NOC from local body / municipal authority",
    "Certificate of Incorporation (for companies)",
    "Affidavit / undertaking in prescribed format",
  ],

  // ─── IMPORT / EXPORT ─────────────────────────────────────────────────────

  iec: [
    "PAN card of the applicant business",
    "Aadhaar card / Passport of proprietor / director / partner",
    "Current bank account statement or cancelled cheque (with pre-printed name)",
    "Certificate of Incorporation / Partnership deed / Aadhaar (for proprietors)",
    "Address proof of principal place of business",
  ],

  rcmc: [
    "IEC (Import Export Code) certificate",
    "PAN card",
    "GST Registration Certificate (GSTIN)",
    "Bank account details",
    "Brief description of products / services exported",
    "MOA / Partnership deed (as applicable)",
  ],

  fema_compliance: [
    "FIRC — Foreign Inward Remittance Certificate from AD bank",
    "KYC documents of foreign investor (Passport, address proof)",
    "Board resolution authorizing allotment to foreign investor",
    "Certificate of Incorporation of Indian company",
    "Valuation certificate from SEBI-registered Merchant Banker or CA (FMV)",
    "FC-GPR form details (filed through AD bank on RBI FIRMS portal)",
    "FEMA declaration form",
  ],

  // ─── MSME & STARTUP ──────────────────────────────────────────────────────

  udyam: [
    "Aadhaar card of proprietor / managing partner / director",
    "PAN card of the enterprise",
    "GSTIN (if registered under GST)",
    "Bank account number (IFSC code)",
    "Investment in plant & machinery / equipment details",
    "Annual turnover from ITR / CA certificate",
  ],

  startup_dpiit: [
    "Certificate of Incorporation / Registration",
    "Brief write-up on the innovative / scalable nature of the business",
    "PAN card of the startup",
    "Pitch deck / product description (optional but helpful)",
    "Website URL or mobile app link (if available)",
    "Details of all founders and their roles",
  ],

  // ─── STATE COMPLIANCE ────────────────────────────────────────────────────

  trade_license: [
    "Application form (municipal corporation format)",
    "Proof of identity of owner — Aadhaar / PAN / Passport",
    "Address proof of business premises (rent agreement + utility bill)",
    "NOC from property owner (if rented)",
    "Photographs of business premises (inside and outside / signboard)",
    "Previous year's trade license (for renewal)",
    "Municipal fee payment receipt",
  ],

  // ─── FINANCIAL SECTOR ────────────────────────────────────────────────────

  nbfc_reg: [
    "RBI prescribed application form (COSMOS portal)",
    "Memorandum and Articles of Association with financial services objects",
    "Audited financial statements for the last 3 years",
    "Business plan with 5-year financial projections",
    "Net Worth Certificate from statutory auditor (min ₹10 Crore NOF)",
    "Bankers' report and credit report of promoters",
    "Certificate of Incorporation",
    "KYC documents of all directors and promoters (Aadhaar, PAN, address proof)",
    "Source of funds certificate",
  ],

  // ─── ENVIRONMENTAL ───────────────────────────────────────────────────────

  hazardous_waste: [
    "Application Form 1 to State Pollution Control Board",
    "List of hazardous wastes generated (as per HWM Rules Schedule I/II/III)",
    "Quantity of hazardous waste generated per year (waste-wise)",
    "Storage facility specifications and area details",
    "Disposal method — recycling / treatment / landfill (with recycler agreement)",
    "Emergency response and onsite disaster management plan",
    "Hazardous waste manifest book (for transportation records)",
    "Annual return of hazardous waste (Form 3 / Form 4)",
  ],

  // ─── ADVANCED CENTRAL TAX ─────────────────────────────────────────────────

  tax_audit_44ab: [
    "Audited P&L Account, Balance Sheet and Notes to Accounts",
    "Trial balance and ledger extracts",
    "Bank statements for all accounts (full FY)",
    "Details of purchases, sales, and closing stock",
    "Fixed Asset Register with depreciation workings",
    "TDS returns filed (24Q / 26Q) and reconciliation",
    "GST returns (GSTR-1 / GSTR-3B) for the FY",
    "Previous year's tax audit report (Form 3CA/3CB-3CD)",
    "CA engagement letter and signed audit report",
    "Details of related party transactions",
  ],

  form_15ca_cb: [
    "Invoice / agreement with non-resident payee",
    "Bank swift / FIRC / AD bank advice for the transaction",
    "Tax Residency Certificate (TRC) of non-resident from home country tax authority",
    "Form 10F filled and signed by non-resident (if DTAA benefit claimed)",
    "Order / contract / purchase order evidencing purpose of payment",
    "Form 15CB — CA certificate (for remittances > ₹5 Lakh / not in specified list)",
    "PAN of non-resident (if available)",
    "Withholding tax computation and working",
  ],

  equalization_levy: [
    "Invoice from non-resident digital service provider (Google / Meta / LinkedIn Ads, etc.)",
    "Proof of payment — bank statement / swift MT103",
    "Annual calculation of aggregate payments to each non-resident provider",
    "Equalization Levy deposit challans (monthly by 7th)",
    "Form 1 — Annual Return (by June 30) filed on income tax portal",
    "Reconciliation of amounts paid vs. levy deposited",
  ],

  vda_tax: [
    "Trade history from all crypto exchanges (CSV export — Binance, WazirX, CoinDCX, etc.)",
    "Wallet transaction history (blockchain records / explorer links)",
    "Cost of acquisition for each VDA asset (purchase price + fees)",
    "Bank statements showing VDA purchase/sale proceeds",
    "Form 26AS reflecting TDS u/s 194S (if applicable)",
    "TDS challans (Form 26QE) if self-deducting TDS",
    "Exchange-issued tax statement or profit/loss summary",
    "Schedule VDA in ITR — fully filled",
    "FIU-IND registration certificate (for crypto exchanges)",
  ],

  transfer_pricing_3ceb: [
    "List of all Associated Enterprises (AEs) — domestic and foreign",
    "Details of all international transactions (type, amount, parties)",
    "Transfer Pricing documentation — FAR analysis (Functions, Assets, Risks)",
    "Benchmarking study — list of comparable companies / transactions",
    "Method selected (CUP/RPM/CPM/TNMM/PSM) and justification",
    "Agreements / contracts with AEs for each transaction type",
    "Financial statements of AEs (if available)",
    "Form 3CEB signed by practicing Chartered Accountant",
    "Form 3CEAA (Master File) if group revenue ≥ ₹500 Crore",
    "Form 3CEAC (CbCR notification) if applicable",
  ],

  master_file_cbcr: [
    "Consolidated financial statements of the MNE group",
    "Organizational chart of entire MNE group",
    "List of all constituent entities (jurisdiction-wise)",
    "Description of business activities of each major entity",
    "IP (Intellectual Property) ownership and licensing details",
    "Intercompany financial arrangements (loans, guarantees)",
    "Country-by-Country Report data (revenue, profit, tax, employees per country)",
    "Form 3CEAA — Part A and Part B",
    "Form 3CEAC — CbCR notification (if parent is non-resident)",
    "Form 3CEAD — CbCR report (if Indian entity is UHC with ≥ ₹5,500 Crore revenue)",
  ],

  // ─── ADVANCED MCA / ROC ───────────────────────────────────────────────────

  csr_compliance: [
    "Board Resolution constituting CSR Committee (names of 3 directors + 1 Independent Director)",
    "CSR Policy document (approved by Board, published on website)",
    "CSR budget calculation — 2% of average net profit of preceding 3 FYs",
    "Project-wise CSR expenditure details with implementing agency agreements",
    "Receipts and utilization certificates from implementing agencies",
    "Impact Assessment Report (if CSR obligation ≥ ₹10 Crore in 3 preceding FYs for projects ≥ ₹1 Crore)",
    "Bank statement of Unspent CSR Account (for ongoing projects)",
    "Transfer challan to PM Fund / Schedule VII fund (if amount not spent)",
    "Form CSR-2 filed on MCA21 portal (by March 31)",
    "CSR Disclosure in Board's Annual Report (Annexure II format)",
  ],

  dpt_3: [
    "Complete list of all outstanding receipts of money / loans NOT classified as deposits",
    "Ledger extracts for: loans from directors, inter-company loans, advance from customers, security deposits",
    "Director's loans — Board resolution, loan agreement, interest calculation",
    "Signed statements from all depositors / loan givers",
    "Audited balance sheet as of March 31 (or provisional if audit not complete)",
    "CA Audit Report on DPT-3 (as required under Companies Act)",
    "Previous year's DPT-3 for cross-reference",
    "DPT-3 filing acknowledgement on MCA21",
  ],

  msme_form1: [
    "List of all MSME (Micro / Small) suppliers with Udyam Registration Numbers",
    "Invoice-wise outstanding dues to each MSME supplier beyond 45 days",
    "Age-wise outstanding analysis for MSME vendor payments",
    "Bank statements showing payment dates to MSME suppliers",
    "Purchase orders and invoices from MSME suppliers",
    "MSME Form 1 filing acknowledgement on MCA21 portal",
    "Internal aging report certified by CFO / Finance Head",
  ],

  secretarial_audit: [
    "Board minutes and agenda for all board meetings in the FY",
    "Shareholder meeting minutes and resolutions",
    "Statutory registers (Register of Members, Directors, Charges, etc.)",
    "All MCA annual filing acknowledgements (AOC-4, MGT-7, DIR-3 KYC)",
    "Compliance certificates from company departments",
    "List of all related party transactions with approvals",
    "Form MR-3 — Secretarial Audit Report signed by PCS",
    "Annual Secretarial Compliance Report (for listed companies — Reg. 24A SEBI LODR)",
    "Details of any show cause notices / penalties from regulators during the year",
  ],

  // ─── SEBI / FINANCIAL SECTOR ──────────────────────────────────────────────

  sebi_lodr_quarterly: [
    "Quarterly financial statements (standalone + consolidated) — approved by Board",
    "Limited Review Report from CA (for Q1/Q2/Q3)",
    "Statutory Auditor's Report (for Q4 / Annual results)",
    "Corporate Governance Report — as per SEBI format",
    "Statement of Investor Complaints (from Registrar and Transfer Agent)",
    "Shareholding Pattern data (from Registrar / DP / depositories)",
    "SEBI LODR compliance checklist signed by Compliance Officer",
    "Board meeting intimation filed with stock exchanges (5 working days advance for results)",
    "Outcome of board meeting filed within 30 minutes of conclusion",
  ],

  sebi_pit_code: [
    "SEBI PIT Code of Conduct adopted by Board — both Schedule A and B",
    "List of Designated Persons (DPs) with designations and contact details",
    "Structured Digital Database (SDD) — audit trail enabled, tamper-proof for 8 years",
    "Trading window closure and opening records",
    "Pre-clearance approval records for trades by DPs",
    "Form C — Initial disclosures by directors/promoters",
    "Form D — Continual disclosures (acquisitions/disposals > ₹5 Lakh or 1% equity)",
    "Form E — Disclosures forwarded to stock exchanges",
    "Training records for DPs on insider trading awareness",
    "Annual compliance certificate from Compliance Officer",
  ],

  sebi_rscr: [
    "Register of Members (updated as of quarter end)",
    "Demat summary from NSDL / CDSL (demat shares held)",
    "Physical share certificate records",
    "Pending transfer / transmission requests",
    "Total issued and paid-up capital per board records",
    "RSCR report signed by PCA / PCS (quarterly)",
    "RSCR filed with all stock exchanges where listed",
  ],

  sebi_brsr: [
    "BRSR template as per SEBI format (9 principles of NGRBC)",
    "Environmental data — energy consumption, GHG emissions, water usage, waste generated",
    "Social data — employee headcount, training hours, CSR expenditure, safety incidents",
    "Governance data — board composition, ethics policy, whistleblower policy, cybersecurity policy",
    "BRSR Core disclosures (for top 150 by market cap) with assurance",
    "ESG report / sustainability report (if separately published)",
    "External assurance certificate (for BRSR Core from FY 2024-25)",
  ],

  // ─── FOREIGN COMPLIANCE ───────────────────────────────────────────────────

  fdi_fc_gpr: [
    "FIRC (Foreign Inward Remittance Certificate) from bank",
    "KYC documents of foreign investor (passport, address proof, board resolution authorizing investment)",
    "Valuation Certificate from SEBI-registered Valuer or CA (DCF / Fair Value method)",
    "Board Resolution of Indian company allotting shares to foreign investor",
    "Certificate from CS confirming compliance with FDI policy and Companies Act",
    "Share Subscription Agreement / Share Purchase Agreement",
    "FIRMS portal filing acknowledgement (Inward Remittance + FC-GPR)",
    "Sector-specific approvals (if applicable — government route sectors)",
    "Confirmation of no prohibition under FEMA",
  ],

  fla_return: [
    "Audited Balance Sheet as of March 31 (or provisional if audit not done)",
    "Schedule of outstanding FDI liabilities (amount, investor details, instrument type)",
    "Schedule of ODI assets (amount, overseas entity, jurisdiction)",
    "List of all equity instruments allotted to non-residents (shares, CCPS, CCDs)",
    "FIRC copies for all FDI received",
    "Loan agreements for ECB (if any)",
    "FLA Return filed on FLAIR portal (flair.rbi.org.in)",
    "Previous year's filed FLA Return for cross-reference",
  ],

  fc_trs: [
    "Share Transfer Form / SH-4 executed by transferor and transferee",
    "Valuation Certificate — for unlisted shares: DCF; for listed shares: SEBI pricing guidelines",
    "FIRC (for non-resident buying) or outward remittance swift (for non-resident selling)",
    "KYC documents of both transferor and transferee",
    "Board Resolution approving transfer",
    "No-objection from existing shareholders (if SHA requires)",
    "FC-TRS filing acknowledgement on FIRMS portal",
    "Original Share Certificate (to be cancelled and reissued)",
  ],

  odi_compliance: [
    "Board Resolution approving overseas investment",
    "Shareholder approval (special resolution) if investment > 60% of net worth (for companies above threshold)",
    "Certificate of Incorporation of overseas entity (apostilled)",
    "Shareholder agreement / JV agreement with overseas entity",
    "Valuation report of overseas entity (if acquiring existing entity)",
    "Net worth certificate of Indian company from CA",
    "Proof of ODI route compliance (automatic/RBI approval)",
    "Form OI (Overseas Investment Form) filed via FIRMS portal and AD Bank",
    "Annual Performance Report (APR) filed by December 31 each year",
    "Due Diligence report on overseas entity",
  ],

  ecb_reporting: [
    "Loan Agreement / Bond Subscription Agreement with foreign lender",
    "Details of lender — name, country, relationship with Indian borrower (AE / non-AE)",
    "End-use certificate from CFO / CEO confirming permitted end-use",
    "Hedging policy (if applicable — hedging of foreign exchange risk)",
    "Form ECB (application for LRN) filed on FIRMS portal via AD bank",
    "Loan Registration Number (LRN) issued by RBI",
    "ECB-2 Monthly Returns (filed by 7th of each month)",
    "Draw-down schedule and repayment schedule",
    "All-in-cost computation (interest + fees ≤ benchmark + 450 bps)",
  ],

  branch_lo_setup: [
    "Form FNC filed with RBI via Authorised Dealer (Category I) bank",
    "RBI Approval Letter / Unique Identification Number (UIN)",
    "Certificate of Incorporation of foreign parent (apostilled + notarized)",
    "MOA / AOA / Charter documents of foreign parent (apostilled)",
    "Latest 3 years audited financial statements of foreign parent",
    "Board Resolution of foreign parent authorizing India operations",
    "Power of Attorney in favor of Indian resident (apostilled)",
    "Net worth certificate of foreign company from bank",
    "Banker's report / letter of comfort from parent's bank",
    "Form FC-1 — Registration with Registrar of Companies",
    "Annual Activity Certificate (AAC) from CA — submitted to AD bank by September 30",
    "Form FC-3 — Annual accounts of foreign company (within 6 months of FY end)",
    "Form FC-4 — Annual return (within 60 days of AGM)",
  ],

  lrs_tcs: [
    "Form A2 — Application for foreign remittance (submitted to AD bank)",
    "Purpose declaration for remittance",
    "Supporting documents for purpose (admission letter for education, medical reports, investment contract, etc.)",
    "TCS Certificate issued by bank (Form 27D)",
    "PAN of remitter (mandatory for LRS)",
    "Bank statement evidencing LRS remittances for the FY",
    "ITR with TCS credit claimed (Form 26AS showing TCS)",
  ],

  fdi_fema_fdi_policy: [
    "Consolidated FDI Policy circular from DPIIT (latest version)",
    "Sector-specific approval from ministry (if government route)",
    "FIPB/CCEA/CC approval document (for defense/media sectors)",
    "Board Resolution evidencing compliance with sectoral caps",
    "Shareholding chart showing FDI percentage post-investment",
    "Downstream investment chart (if company has Indian subsidiaries)",
    "Valuation certificate for each FDI tranche received",
    "FIRMS portal filing acknowledgements (FC-GPR for all tranches)",
    "Press Note issued by DPIIT for sector-specific conditions (if applicable)",
  ],

  // ─── IMPORT / EXPORT ──────────────────────────────────────────────────────

  gst_lut: [
    "GST Registration Certificate",
    "IEC (Import Export Code)",
    "Letter of Undertaking (LUT) — Form RFD-11 filed on GST portal",
    "LUT acknowledgement / ARN from GST portal",
    "Export Invoices issued with LUT number",
    "Shipping Bills / Let Export Orders (for goods)",
    "Bank Realization Certificates (BRC) / eFIRC for export proceeds",
  ],

  advance_auth_compliance: [
    "Advance Authorisation licence (from DGFT portal)",
    "SION (Standard Input Output Norms) for the export product or Ad-hoc norms approval",
    "Import documents — Bill of Entry, shipping documents for each consignment imported",
    "Customs bond and bank guarantee submitted at time of import",
    "Export shipping bills matching the authorization",
    "BRC / eFIRC for each export shipment",
    "EODC (Export Obligation Discharge Certificate) application — ANF 4C",
    "CA certificate for value addition calculation (minimum 15%)",
    "Customs authority acknowledgement of bond cancellation after EODC",
  ],

  // ─── ENVIRONMENTAL (ADVANCED) ─────────────────────────────────────────────

  ewaste_epr: [
    "CPCB EPR Portal registration certificate as Producer / Manufacturer / Importer",
    "Product-wise EEE (Electrical & Electronic Equipment) list as per E-Waste Rules 2022",
    "Annual E-Waste generation data (units sold / weight-wise)",
    "EPR Annual Target calculation (60%/70%/80% of waste generated)",
    "Agreements with CPCB-registered Recyclers / Dismantlers / PROs",
    "E-Waste Certificates (EWC) received from recyclers",
    "Annual E-Waste Return (filed by June 30)",
    "Evidence of EPR target fulfillment",
  ],

  // ─── DIGITAL COMPLIANCE ───────────────────────────────────────────────────

  dpdp_act: [
    "Data Inventory / Data Map — what personal data is collected, from whom, for what purpose",
    "Consent Management Framework — opt-in mechanism, granular consent records",
    "Privacy Notice / Privacy Policy (in English and local language, accessible on website/app)",
    "Data Retention and Deletion Policy",
    "Data Breach Response Plan — incident response procedure",
    "Appointment of Grievance Officer (name, contact, designation on platform)",
    "Privacy Impact Assessment (PIA) for high-risk processing activities",
    "Vendor / third-party data processing agreements",
    "Records of all consents obtained from data principals",
    "Security measures documentation (encryption, access controls, audit logs)",
  ],

  ecommerce_consumer_rules: [
    "Legal entity details displayed on website/app (company name, registered address, CIN, GST, PAN)",
    "Grievance Officer appointment — name, designation, contact email/phone published on platform",
    "Complaint Management System — acknowledgement within 48 hours, resolution within 30 days",
    "Return / Refund / Cancellation / Exchange Policy published before checkout",
    "Country of origin disclosed for all products (especially imported goods)",
    "Seller information displayed for each product on marketplace (seller name, address, GSTIN)",
    "IT Rules 2021 compliance certificate",
    "Consumer complaint register / CRM records",
    "Nodal officer details (for court / authority communications)",
  ],

  it_intermediary_rules: [
    "Privacy Policy and Terms of Use — published on website/app",
    "Grievance Officer appointment — name, designation, contact details published",
    "Complaint Management System — 24-hour acknowledgement, 15-day resolution",
    "Content takedown procedure (for government / court orders — within 36 hours)",
    "User data retention policy (180 days after account deletion)",
    "If > 50 lakh users: Chief Compliance Officer appointment, Nodal Contact Person, Resident Grievance Officer",
    "Monthly compliance report (for significant social media intermediaries)",
    "IT Act Section 79 safe harbor compliance documentation",
    "Employee training on IT Rules obligations",
  ],

  // ─── LABOR LAW (ADVANCED) ─────────────────────────────────────────────────

  bocw_cess: [
    "BOCW Cess payment receipt (1% of construction cost, paid to municipal authority)",
    "BOCW establishment registration certificate from State Board",
    "List of construction workers registered with State BOCW Welfare Board",
    "Construction workers' identity cards (issued by BOCW Board)",
    "Site register of construction workers (attendance, wages, safety equipment)",
    "Structural approval / building plan sanctioned by authority",
    "Bond / insurance for worker welfare compliance",
    "Safety equipment inventory list (helmets, harnesses, etc.)",
  ],

  // ─── STATE COMPLIANCE (ADVANCED) ─────────────────────────────────────────

  rera_project: [
    "RERA Project Registration Certificate from State RERA Authority",
    "Approved building plan / layout plan from municipal authority",
    "Title deed / sale deed / development agreement for the land",
    "Commencement Certificate from local authority",
    "Architect certificate on technical specifications",
    "Project disclosure form as per RERA (project details, promoter details, unit schedule)",
    "Designated bank account details (70% escrow) — bank letter",
    "CA certificate on opening of separate escrow account",
    "All encumbrance certificates and NOCs for the land",
    "Quarterly project update — construction progress photos",
  ],

  fcra_registration: [
    "FCRA Registration Certificate (5-year validity) or Prior Permission letter",
    "SBI NDMB (New Delhi Main Branch) account statement — all FCRA receipts",
    "FCRA Utilization Account bank statement",
    "Foreign contribution receipts — donor-wise (name, country, amount, purpose)",
    "Income & Expenditure Account and Balance Sheet certified by CA",
    "Form FC-3 (Annual Return) filed on FCRA portal by December 31",
    "Form FC-4 (Audited accounts) attached with FC-3",
    "20% administrative expenses cap calculation and compliance",
    "Board resolution for each foreign contribution received",
    "Cancellation/Renewal application (6 months before expiry)",
  ],

  // ─── MSME / STARTUP (ADVANCED) ────────────────────────────────────────────

  gem_registration: [
    "Aadhaar card of authorized signatory",
    "PAN of the business entity",
    "MSME / Udyam Registration Certificate",
    "GST Registration Certificate",
    "Bank account details (for payment)",
    "Digital Signature Certificate (DSC) or Aadhaar OTP authentication",
    "Product / service details with specifications and images",
    "Trade licence / shops establishment certificate",
    "ISO / BIS / quality certificates (if any — improves bid scores)",
  ],

  // ─── NBFC / FINANCIAL SECTOR ──────────────────────────────────────────────

  nbfc_returns_rbi: [
    "NBFC Registration Certificate from RBI",
    "Audited Balance Sheet and P&L Account",
    "Capital Adequacy Ratio (CRAR) calculation",
    "NPA classification schedule (asset quality data)",
    "ALM (Asset Liability Management) statement",
    "CRILC (Central Repository of Information on Large Credits) data — for borrowers > ₹5 Crore",
    "NBS-1 Return — XBRL filing on COSMOS portal",
    "NBS-2 Prudential Norms statement",
    "Fraud reporting to RBI (if applicable)",
    "Annual Statutory Audit Report",
    "IT Returns and Tax Audit Report",
  ],

  pmla_reporting: [
    "KYC Policy and AML (Anti-Money Laundering) Policy approved by Board",
    "FIU-IND Registration / Reporting Entity registration certificate",
    "Customer Due Diligence (CDD) records for all customers",
    "Enhanced Due Diligence (EDD) records for PEPs and high-risk customers",
    "Suspicious Transaction Reports (STRs) — archived copies",
    "Cash Transaction Reports (CTRs) for cash transactions > ₹10 Lakh",
    "Record maintenance policy — 5-year retention plan",
    "Principal Officer appointment letter (PMLA compliance officer)",
    "Employee training records on AML/KYC obligations",
    "Transaction monitoring system documentation",
    "Beneficial Ownership (UBO) declaration forms",
  ],

};
