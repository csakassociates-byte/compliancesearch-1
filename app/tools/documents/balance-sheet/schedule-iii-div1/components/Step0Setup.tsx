"use client";
import { useState, useEffect } from "react";
import CompanyExcelUpload from "@/components/CompanyExcelUpload";
import CompanySearch from "@/components/CompanySearch";
import type { CompanyData, DirectorData } from "@/lib/types/company";
import type { BalanceSheetData, BSFinancialYear, BSCompanyType, DisplayUnit } from "@/lib/balance-sheet/types";

interface Props {
  data: BalanceSheetData;
  update: (patch: Partial<BalanceSheetData>) => void;
}

interface SavedCA {
  id: string;
  firmName: string;
  frn: string;
  partnerName: string;
  membershipNo: string;
  place?: string | null;
}

const FY_OPTIONS: { label: string; value: BSFinancialYear; start: string; end: string }[] = [
  { label: "FY 2025-26", value: "2025-26", start: "01/04/2025", end: "31/03/2026" },
  { label: "FY 2024-25", value: "2024-25", start: "01/04/2024", end: "31/03/2025" },
  { label: "FY 2023-24", value: "2023-24", start: "01/04/2023", end: "31/03/2024" },
];

const COMPANY_TYPES: { value: BSCompanyType; label: string }[] = [
  { value: "manufacturing", label: "Manufacturing" },
  { value: "trading",       label: "Trading" },
  { value: "service",       label: "Service" },
  { value: "finance",       label: "Finance / NBFC" },
  { value: "nidhi",         label: "Nidhi Company" },
  { value: "nbfc",          label: "NBFC (RBI Registered)" },
];

const UNIT_OPTIONS: { value: DisplayUnit; label: string }[] = [
  { value: "actual",    label: "₹ Actual Rupees" },
  { value: "thousands", label: "₹ in Thousands" },
  { value: "lakhs",     label: "₹ in Lakhs" },
  { value: "millions",  label: "₹ in Millions" },
  { value: "crores",    label: "₹ in Crores" },
];

// ── Helpers ───────────────────────────────────────────────────────────────────

function parseCapital(raw: string | undefined | null): number {
  if (!raw) return 0;
  return parseInt(raw.replace(/,/g, ""), 10) || 0;
}

function inp(extra?: React.CSSProperties): React.CSSProperties {
  return { width: "100%", border: "1px solid #d1d5db", borderRadius: 8, padding: "9px 12px", fontSize: 13, color: "#0f172a", background: "#fff", boxSizing: "border-box", ...extra };
}
function lbl(text: string, required = false) {
  return (
    <label style={{ display: "block", fontSize: 12, fontWeight: 700, color: "#374151", marginBottom: 5 }}>
      {text}{required && <span style={{ color: "#ef4444", marginLeft: 2 }}>*</span>}
    </label>
  );
}
function Row({ children, cols = 2 }: { children: React.ReactNode; cols?: number }) {
  return (
    <div style={{ display: "grid", gridTemplateColumns: `repeat(${cols}, 1fr)`, gap: 16 }}>
      {children}
    </div>
  );
}
function Card({ title, icon, children }: { title: string; icon: string; children: React.ReactNode }) {
  return (
    <div style={{ background: "#fff", border: "1px solid #e2e8f0", borderRadius: 16, overflow: "hidden", marginBottom: 20 }}>
      <div style={{ background: "#f8fafc", borderBottom: "1px solid #e2e8f0", padding: "14px 20px", display: "flex", alignItems: "center", gap: 10 }}>
        <span style={{ fontSize: 18 }}>{icon}</span>
        <span style={{ fontWeight: 800, fontSize: 14, color: "#0f172a" }}>{title}</span>
      </div>
      <div style={{ padding: "20px" }}>{children}</div>
    </div>
  );
}

// ── Component ─────────────────────────────────────────────────────────────────

export default function Step0Setup({ data, update }: Props) {
  const [showSearch, setShowSearch] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [companyDirectors, setCompanyDirectors] = useState<DirectorData[]>([]);
  const [savedCAs, setSavedCAs] = useState<SavedCA[]>([]);

  // Load saved CAs on mount
  useEffect(() => {
    fetch("/api/auditors")
      .then(r => r.json())
      .then((j: { auditors?: SavedCA[] }) => setSavedCAs(j.auditors || []))
      .catch(() => {});
  }, []);

  function applyCompanyData(c: CompanyData) {
    const fyOpt = FY_OPTIONS.find(f => f.value === data.financialYear) || FY_OPTIONS[0];

    // Parse capital from MCA master data
    const authAmt = parseCapital(c.authorisedCapital);
    const paidAmt = parseCapital(c.paidUpCapital);
    const authShares = authAmt > 0 ? String(Math.round(authAmt / 10)) : "";
    const paidShares = paidAmt > 0 ? String(Math.round(paidAmt / 10)) : "";

    // Auto-fill note1ShareCapital classes[0] (Equity Shares)
    const updatedClasses = [...data.note1ShareCapital.classes];
    if (updatedClasses.length > 0 && (authAmt > 0 || paidAmt > 0)) {
      updatedClasses[0] = {
        ...updatedClasses[0],
        className:        updatedClasses[0].className || "Equity Shares",
        faceValue:        updatedClasses[0].faceValue || "10",
        authorisedShares: authShares || updatedClasses[0].authorisedShares,
        issuedShares:     paidShares || updatedClasses[0].issuedShares,
        subscribedShares: paidShares || updatedClasses[0].subscribedShares,
        paidUpShares:     paidShares || updatedClasses[0].paidUpShares,
        paidUpAmount:     paidAmt > 0 ? String(paidAmt) : updatedClasses[0].paidUpAmount,
      };
    }

    // Store directors for dropdown
    if (c.directors?.length) {
      setCompanyDirectors(c.directors.filter(d => d.isActive !== false));
    }

    update({
      companyName:  c.companyName || data.companyName,
      cin:          c.cin         || data.cin,
      pan:          data.pan,
      regAddress:   c.regAddress  || data.regAddress,
      companyEmail: c.email       || data.companyEmail,
      gstin:        c.gstNumber   || data.gstin,
      fyStart:      fyOpt.start,
      fyEnd:        fyOpt.end,
      note1ShareCapital: { ...data.note1ShareCapital, classes: updatedClasses },
    });
    setShowSearch(false);
  }

  function handleFYChange(fy: BSFinancialYear) {
    const opt = FY_OPTIONS.find(f => f.value === fy)!;
    update({ financialYear: fy, fyStart: opt.start, fyEnd: opt.end });
  }

  // Fill director slot from dropdown selection
  function applyDirector(slot: 1 | 2, din: string) {
    const dir = companyDirectors.find(d => d.din === din);
    if (!dir) return;
    if (slot === 1) {
      update({
        directorName1:        dir.name,
        directorDin1:         dir.din || "",
        directorDesignation1: dir.designation || dir.category || "",
      });
    } else {
      update({
        directorName2:        dir.name,
        directorDin2:         dir.din || "",
        directorDesignation2: dir.designation || dir.category || "",
      });
    }
  }

  // Fill auditor from saved CA
  function applyCA(ca: SavedCA) {
    update({
      auditorFirmName:     ca.firmName,
      auditorFRN:          ca.frn,
      auditorPartnerName:  ca.partnerName,
      auditorMembershipNo: ca.membershipNo,
      auditorPlace:        ca.place || data.auditorPlace,
    });
  }

  const hasDirectors = companyDirectors.length > 0;

  return (
    <div style={{ maxWidth: 860, margin: "0 auto" }}>

      {/* ── MCA Master Data ── */}
      <Card title="Company Data — MCA Master Data" icon="🏢">
        <p style={{ fontSize: 13, color: "#64748b", margin: "0 0 16px", lineHeight: 1.6 }}>
          Upload MCA Master Data Excel (downloaded from MCA21 portal) to auto-fill company details, or search from previously saved companies.
        </p>
        <div style={{ display: "flex", gap: 10, marginBottom: 16, flexWrap: "wrap" }}>
          <button
            onClick={() => setShowSearch(s => !s)}
            style={{ background: "#0f172a", color: "#fff", border: "none", borderRadius: 8, padding: "9px 18px", fontSize: 13, fontWeight: 700, cursor: "pointer" }}
          >
            🔍 {showSearch ? "Hide Search" : "Search Saved Companies"}
          </button>
        </div>
        {showSearch && (
          <div style={{ marginBottom: 16 }}>
            <CompanySearch value={searchQuery} onChange={setSearchQuery} onSelect={applyCompanyData} />
          </div>
        )}
        <CompanyExcelUpload onFill={applyCompanyData} accent="blue" />
      </Card>

      {/* ── Company Details ── */}
      <Card title="Company Details" icon="📋">
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          <Row cols={2}>
            <div>
              {lbl("Company Name", true)}
              <input style={inp()} value={data.companyName} onChange={e => update({ companyName: e.target.value })} placeholder="XYZ Private Limited" />
            </div>
            <div>
              {lbl("CIN")}
              <input style={inp()} value={data.cin} onChange={e => update({ cin: e.target.value })} placeholder="U12345MH2020PTC123456" />
            </div>
          </Row>
          <Row cols={2}>
            <div>
              {lbl("PAN")}
              <input style={inp()} value={data.pan || ""} onChange={e => update({ pan: e.target.value })} placeholder="AABCX1234D" />
            </div>
            <div>
              {lbl("GSTIN")}
              <input style={inp()} value={data.gstin || ""} onChange={e => update({ gstin: e.target.value })} placeholder="27AABCX1234D1Z5" />
            </div>
          </Row>
          <div>
            {lbl("Registered Address", true)}
            <textarea style={{ ...inp(), minHeight: 64, resize: "vertical" }} value={data.regAddress} onChange={e => update({ regAddress: e.target.value })} placeholder="Full registered office address" />
          </div>
          <Row cols={2}>
            <div>
              {lbl("Company Email")}
              <input style={inp()} value={data.companyEmail || ""} onChange={e => update({ companyEmail: e.target.value })} placeholder="info@company.com" />
            </div>
            <div>
              {lbl("Company Phone")}
              <input style={inp()} value={data.companyPhone || ""} onChange={e => update({ companyPhone: e.target.value })} placeholder="+91 98765 43210" />
            </div>
          </Row>
        </div>
      </Card>

      {/* ── Balance Sheet Settings ── */}
      <Card title="Balance Sheet Settings" icon="⚙️">
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          <Row cols={3}>
            <div>
              {lbl("Financial Year", true)}
              <select style={inp()} value={data.financialYear} onChange={e => handleFYChange(e.target.value as BSFinancialYear)}>
                {FY_OPTIONS.map(f => <option key={f.value} value={f.value}>{f.label}</option>)}
              </select>
            </div>
            <div>
              {lbl("Display Figures In", true)}
              <select style={inp()} value={data.displayUnit} onChange={e => update({ displayUnit: e.target.value as DisplayUnit })}>
                {UNIT_OPTIONS.map(u => <option key={u.value} value={u.value}>{u.label}</option>)}
              </select>
              <div style={{ fontSize: 11, color: "#64748b", marginTop: 4 }}>
                Amounts are always entered in actual ₹. This unit applies only to print/download output.
              </div>
            </div>
            <div>
              {lbl("Company Type", true)}
              <select style={inp()} value={data.companyType} onChange={e => update({ companyType: e.target.value as BSCompanyType })}>
                {COMPANY_TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
              </select>
            </div>
          </Row>
          <Row cols={2}>
            <div>
              {lbl("Balance Sheet Date", true)}
              <input type="date" style={inp()} value={data.dateOfBalance} onChange={e => update({ dateOfBalance: e.target.value })} />
            </div>
            <div>
              {lbl("Place of Signing", true)}
              <input style={inp()} value={data.placeOfSigning} onChange={e => update({ placeOfSigning: e.target.value })} placeholder="Mumbai" />
            </div>
          </Row>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <input type="checkbox" id="firstYear" checked={data.isFirstYear} onChange={e => update({ isFirstYear: e.target.checked })} style={{ width: 16, height: 16, cursor: "pointer" }} />
            <label htmlFor="firstYear" style={{ fontSize: 13, fontWeight: 600, color: "#374151", cursor: "pointer" }}>
              First year of operation — no comparative (previous year) figures required
            </label>
          </div>
        </div>
      </Card>

      {/* ── Signatories ── */}
      <Card title="Signatories" icon="✍️">
        <p style={{ fontSize: 12, color: "#64748b", margin: "0 0 16px" }}>
          Details of directors signing the Balance Sheet (Section 134)
        </p>

        {/* Director 1 */}
        <div style={{ background: "#f8fafc", border: "1px solid #e2e8f0", borderRadius: 10, padding: 16, marginBottom: 12 }}>
          <div style={{ fontSize: 12, fontWeight: 700, color: "#059669", marginBottom: 12, textTransform: "uppercase", letterSpacing: "0.05em" }}>Director 1</div>

          {/* Director dropdown */}
          {hasDirectors && (
            <div style={{ marginBottom: 12 }}>
              {lbl("Select from Company Directors")}
              <select
                style={inp()}
                value={data.directorDin1 || ""}
                onChange={e => applyDirector(1, e.target.value)}
              >
                <option value="">— Select director —</option>
                {companyDirectors.map(d => (
                  <option key={d.din || d.name} value={d.din || ""}>
                    {d.name}{d.designation ? ` — ${d.designation}` : ""}{d.din ? ` (DIN: ${d.din})` : ""}
                  </option>
                ))}
              </select>
            </div>
          )}

          <Row cols={3}>
            <div>
              {lbl("Full Name", true)}
              <input style={inp()} value={data.directorName1} onChange={e => update({ directorName1: e.target.value })} placeholder="Director Name" />
            </div>
            <div>
              {lbl("DIN", true)}
              <input style={inp()} value={data.directorDin1} onChange={e => update({ directorDin1: e.target.value })} placeholder="00000000" />
            </div>
            <div>
              {lbl("Designation")}
              <input style={inp()} value={data.directorDesignation1} onChange={e => update({ directorDesignation1: e.target.value })} placeholder="Managing Director" />
            </div>
          </Row>
        </div>

        {/* Director 2 */}
        <div style={{ background: "#f8fafc", border: "1px solid #e2e8f0", borderRadius: 10, padding: 16, marginBottom: 16 }}>
          <div style={{ fontSize: 12, fontWeight: 700, color: "#64748b", marginBottom: 12, textTransform: "uppercase", letterSpacing: "0.05em" }}>Director 2 (Optional)</div>

          {hasDirectors && (
            <div style={{ marginBottom: 12 }}>
              {lbl("Select from Company Directors")}
              <select
                style={inp()}
                value={data.directorDin2 || ""}
                onChange={e => applyDirector(2, e.target.value)}
              >
                <option value="">— Select director —</option>
                {companyDirectors.map(d => (
                  <option key={d.din || d.name} value={d.din || ""}>
                    {d.name}{d.designation ? ` — ${d.designation}` : ""}{d.din ? ` (DIN: ${d.din})` : ""}
                  </option>
                ))}
              </select>
            </div>
          )}

          <Row cols={3}>
            <div>
              {lbl("Full Name")}
              <input style={inp()} value={data.directorName2 || ""} onChange={e => update({ directorName2: e.target.value })} placeholder="Director Name" />
            </div>
            <div>
              {lbl("DIN")}
              <input style={inp()} value={data.directorDin2 || ""} onChange={e => update({ directorDin2: e.target.value })} placeholder="00000000" />
            </div>
            <div>
              {lbl("Designation")}
              <input style={inp()} value={data.directorDesignation2 || ""} onChange={e => update({ directorDesignation2: e.target.value })} placeholder="Director" />
            </div>
          </Row>
        </div>

        {/* Statutory Auditor */}
        <div style={{ background: "#eff6ff", border: "1px solid #bfdbfe", borderRadius: 10, padding: 16 }}>
          <div style={{ fontSize: 12, fontWeight: 700, color: "#1d4ed8", marginBottom: 12, textTransform: "uppercase", letterSpacing: "0.05em" }}>Statutory Auditor</div>

          {/* Saved CA selection */}
          {savedCAs.length > 0 && (
            <div style={{ marginBottom: 14 }}>
              {lbl("Select from Saved CAs")}
              <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                {savedCAs.map(ca => (
                  <div key={ca.id} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", background: "#fff", border: "1px solid #bfdbfe", borderRadius: 8, padding: "8px 12px" }}>
                    <div style={{ minWidth: 0 }}>
                      <div style={{ fontSize: 13, fontWeight: 700, color: "#1e3a5f" }}>{ca.firmName}</div>
                      <div style={{ fontSize: 11, color: "#64748b", marginTop: 2 }}>
                        FRN: {ca.frn} &bull; {ca.partnerName} (M.No. {ca.membershipNo}){ca.place ? ` • ${ca.place}` : ""}
                      </div>
                    </div>
                    <button
                      onClick={() => applyCA(ca)}
                      style={{ marginLeft: 12, flexShrink: 0, background: "#1d4ed8", color: "#fff", border: "none", borderRadius: 7, padding: "6px 14px", fontSize: 12, fontWeight: 700, cursor: "pointer" }}
                    >
                      Select →
                    </button>
                  </div>
                ))}
              </div>
              <div style={{ fontSize: 11, color: "#64748b", marginTop: 6 }}>You can edit the details below after selecting.</div>
            </div>
          )}

          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            <Row cols={2}>
              <div>
                {lbl("Firm Name", true)}
                <input style={inp()} value={data.auditorFirmName} onChange={e => update({ auditorFirmName: e.target.value })} placeholder="M/s ABC & Associates" />
              </div>
              <div>
                {lbl("FRN (Firm Reg. No.)")}
                <input style={inp()} value={data.auditorFRN} onChange={e => update({ auditorFRN: e.target.value })} placeholder="123456W" />
              </div>
            </Row>
            <Row cols={3}>
              <div>
                {lbl("Partner Name", true)}
                <input style={inp()} value={data.auditorPartnerName} onChange={e => update({ auditorPartnerName: e.target.value })} placeholder="CA Partner Name" />
              </div>
              <div>
                {lbl("Membership No.", true)}
                <input style={inp()} value={data.auditorMembershipNo} onChange={e => update({ auditorMembershipNo: e.target.value })} placeholder="M123456" />
              </div>
              <div>
                {lbl("Place")}
                <input style={inp()} value={data.auditorPlace} onChange={e => update({ auditorPlace: e.target.value })} placeholder="Mumbai" />
              </div>
            </Row>
            <div style={{ maxWidth: 260 }}>
              {lbl("Report Date")}
              <input type="date" style={inp()} value={data.auditorReportDate} onChange={e => update({ auditorReportDate: e.target.value })} />
            </div>
          </div>
        </div>
      </Card>

      {/* ── Tip ── */}
      <div style={{ background: "#f0fdf4", border: "1px solid #86efac", borderRadius: 12, padding: "14px 18px", fontSize: 13, color: "#166534" }}>
        <strong>Tip:</strong> After filling company details, click <strong>Next →</strong> to enter the Notes for Equity &amp; Liabilities. Share Capital (Note 1) has been pre-filled from MCA master data — verify and edit as needed.
      </div>

    </div>
  );
}
