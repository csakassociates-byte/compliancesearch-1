"use client";
import { useState } from "react";
import CompanyExcelUpload from "@/components/CompanyExcelUpload";
import CompanySearch from "@/components/CompanySearch";
import type { CompanyData } from "@/lib/types/company";
import type { BalanceSheetData, BSFinancialYear, BSCompanyType, DisplayUnit } from "@/lib/balance-sheet/types";

interface Props {
  data: BalanceSheetData;
  update: (patch: Partial<BalanceSheetData>) => void;
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

// ── Shared input style ────────────────────────────────────────────────────────

function inp(extra?: React.CSSProperties): React.CSSProperties {
  return { width: "100%", border: "1px solid #d1d5db", borderRadius: 8, padding: "9px 12px", fontSize: 13, color: "#0f172a", background: "#fff", boxSizing: "border-box", ...extra };
}
function label(text: string, required = false) {
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

  function applyCompanyData(c: CompanyData) {
    const fyOpt = FY_OPTIONS.find(f => f.value === data.financialYear) || FY_OPTIONS[0];
    update({
      companyName:  c.companyName || data.companyName,
      cin:          c.cin         || data.cin,
      pan:          data.pan,
      regAddress:   c.regAddress  || data.regAddress,
      companyEmail: c.email       || data.companyEmail,
      gstin:        c.gstNumber   || data.gstin,
      fyStart:      fyOpt.start,
      fyEnd:        fyOpt.end,
    });
    setShowSearch(false);
  }

  function handleFYChange(fy: BSFinancialYear) {
    const opt = FY_OPTIONS.find(f => f.value === fy)!;
    update({ financialYear: fy, fyStart: opt.start, fyEnd: opt.end });
  }

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
            <CompanySearch onSelect={applyCompanyData} />
          </div>
        )}

        <CompanyExcelUpload onFill={applyCompanyData} accent="blue" />
      </Card>

      {/* ── Company Details ── */}
      <Card title="Company Details" icon="📋">
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          <Row cols={2}>
            <div>
              {label("Company Name", true)}
              <input
                style={inp()}
                value={data.companyName}
                onChange={e => update({ companyName: e.target.value })}
                placeholder="XYZ Private Limited"
              />
            </div>
            <div>
              {label("CIN")}
              <input
                style={inp()}
                value={data.cin}
                onChange={e => update({ cin: e.target.value })}
                placeholder="U12345MH2020PTC123456"
              />
            </div>
          </Row>

          <Row cols={2}>
            <div>
              {label("PAN")}
              <input
                style={inp()}
                value={data.pan || ""}
                onChange={e => update({ pan: e.target.value })}
                placeholder="AABCX1234D"
              />
            </div>
            <div>
              {label("GSTIN")}
              <input
                style={inp()}
                value={data.gstin || ""}
                onChange={e => update({ gstin: e.target.value })}
                placeholder="27AABCX1234D1Z5"
              />
            </div>
          </Row>

          <div>
            {label("Registered Address", true)}
            <textarea
              style={{ ...inp(), minHeight: 64, resize: "vertical" }}
              value={data.regAddress}
              onChange={e => update({ regAddress: e.target.value })}
              placeholder="Full registered office address"
            />
          </div>

          <Row cols={2}>
            <div>
              {label("Company Email")}
              <input
                style={inp()}
                value={data.companyEmail || ""}
                onChange={e => update({ companyEmail: e.target.value })}
                placeholder="info@company.com"
              />
            </div>
            <div>
              {label("Company Phone")}
              <input
                style={inp()}
                value={data.companyPhone || ""}
                onChange={e => update({ companyPhone: e.target.value })}
                placeholder="+91 98765 43210"
              />
            </div>
          </Row>
        </div>
      </Card>

      {/* ── Balance Sheet Settings ── */}
      <Card title="Balance Sheet Settings" icon="⚙️">
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          <Row cols={3}>
            <div>
              {label("Financial Year", true)}
              <select
                style={inp()}
                value={data.financialYear}
                onChange={e => handleFYChange(e.target.value as BSFinancialYear)}
              >
                {FY_OPTIONS.map(f => (
                  <option key={f.value} value={f.value}>{f.label}</option>
                ))}
              </select>
            </div>
            <div>
              {label("Display Figures In", true)}
              <select
                style={inp()}
                value={data.displayUnit}
                onChange={e => update({ displayUnit: e.target.value as DisplayUnit })}
              >
                {UNIT_OPTIONS.map(u => (
                  <option key={u.value} value={u.value}>{u.label}</option>
                ))}
              </select>
            </div>
            <div>
              {label("Company Type", true)}
              <select
                style={inp()}
                value={data.companyType}
                onChange={e => update({ companyType: e.target.value as BSCompanyType })}
              >
                {COMPANY_TYPES.map(t => (
                  <option key={t.value} value={t.value}>{t.label}</option>
                ))}
              </select>
            </div>
          </Row>

          <Row cols={2}>
            <div>
              {label("Balance Sheet Date", true)}
              <input
                type="date"
                style={inp()}
                value={data.dateOfBalance}
                onChange={e => update({ dateOfBalance: e.target.value })}
              />
            </div>
            <div>
              {label("Place of Signing", true)}
              <input
                style={inp()}
                value={data.placeOfSigning}
                onChange={e => update({ placeOfSigning: e.target.value })}
                placeholder="Mumbai"
              />
            </div>
          </Row>

          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <input
              type="checkbox"
              id="firstYear"
              checked={data.isFirstYear}
              onChange={e => update({ isFirstYear: e.target.checked })}
              style={{ width: 16, height: 16, cursor: "pointer" }}
            />
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
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>

          {/* Director 1 */}
          <div style={{ background: "#f8fafc", border: "1px solid #e2e8f0", borderRadius: 10, padding: 16 }}>
            <div style={{ fontSize: 12, fontWeight: 700, color: "#059669", marginBottom: 12, textTransform: "uppercase", letterSpacing: "0.05em" }}>Director 1</div>
            <Row cols={3}>
              <div>
                {label("Full Name", true)}
                <input style={inp()} value={data.directorName1} onChange={e => update({ directorName1: e.target.value })} placeholder="Director Name" />
              </div>
              <div>
                {label("DIN", true)}
                <input style={inp()} value={data.directorDin1} onChange={e => update({ directorDin1: e.target.value })} placeholder="00000000" />
              </div>
              <div>
                {label("Designation")}
                <input style={inp()} value={data.directorDesignation1} onChange={e => update({ directorDesignation1: e.target.value })} placeholder="Managing Director" />
              </div>
            </Row>
          </div>

          {/* Director 2 */}
          <div style={{ background: "#f8fafc", border: "1px solid #e2e8f0", borderRadius: 10, padding: 16 }}>
            <div style={{ fontSize: 12, fontWeight: 700, color: "#64748b", marginBottom: 12, textTransform: "uppercase", letterSpacing: "0.05em" }}>Director 2 (Optional)</div>
            <Row cols={3}>
              <div>
                {label("Full Name")}
                <input style={inp()} value={data.directorName2 || ""} onChange={e => update({ directorName2: e.target.value })} placeholder="Director Name" />
              </div>
              <div>
                {label("DIN")}
                <input style={inp()} value={data.directorDin2 || ""} onChange={e => update({ directorDin2: e.target.value })} placeholder="00000000" />
              </div>
              <div>
                {label("Designation")}
                <input style={inp()} value={data.directorDesignation2 || ""} onChange={e => update({ directorDesignation2: e.target.value })} placeholder="Director" />
              </div>
            </Row>
          </div>

          {/* Auditor */}
          <div style={{ background: "#eff6ff", border: "1px solid #bfdbfe", borderRadius: 10, padding: 16 }}>
            <div style={{ fontSize: 12, fontWeight: 700, color: "#1d4ed8", marginBottom: 12, textTransform: "uppercase", letterSpacing: "0.05em" }}>Statutory Auditor</div>
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              <Row cols={2}>
                <div>
                  {label("Firm Name", true)}
                  <input style={inp()} value={data.auditorFirmName} onChange={e => update({ auditorFirmName: e.target.value })} placeholder="M/s ABC & Associates" />
                </div>
                <div>
                  {label("FRN (Firm Reg. No.)")}
                  <input style={inp()} value={data.auditorFRN} onChange={e => update({ auditorFRN: e.target.value })} placeholder="123456W" />
                </div>
              </Row>
              <Row cols={3}>
                <div>
                  {label("Partner Name", true)}
                  <input style={inp()} value={data.auditorPartnerName} onChange={e => update({ auditorPartnerName: e.target.value })} placeholder="CA Partner Name" />
                </div>
                <div>
                  {label("Membership No.", true)}
                  <input style={inp()} value={data.auditorMembershipNo} onChange={e => update({ auditorMembershipNo: e.target.value })} placeholder="M123456" />
                </div>
                <div>
                  {label("Place")}
                  <input style={inp()} value={data.auditorPlace} onChange={e => update({ auditorPlace: e.target.value })} placeholder="Mumbai" />
                </div>
              </Row>
              <div style={{ maxWidth: 260 }}>
                {label("Report Date")}
                <input type="date" style={inp()} value={data.auditorReportDate} onChange={e => update({ auditorReportDate: e.target.value })} />
              </div>
            </div>
          </div>

        </div>
      </Card>

      {/* ── Tip ── */}
      <div style={{ background: "#f0fdf4", border: "1px solid #86efac", borderRadius: 12, padding: "14px 18px", fontSize: 13, color: "#166534" }}>
        <strong>Tip:</strong> After filling company details, click <strong>Next →</strong> to enter the Notes for Equity &amp; Liabilities. The Balance Sheet auto-generates as you fill each note.
      </div>

    </div>
  );
}
