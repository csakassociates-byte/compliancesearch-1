"use client";
import { NCEFinancialsData, NCEEntityType, NCEFinancialYear } from "@/lib/nce-financials/types";

interface Props {
  data: NCEFinancialsData;
  update: (patch: Partial<NCEFinancialsData>) => void;
  fyLabels: { current: string; prev: string };
}

const inp = { width: "100%", padding: "9px 12px", border: "1px solid #e2e8f0", borderRadius: 8, fontSize: 13, boxSizing: "border-box" as const, outline: "none" };
const label = { fontSize: 12, fontWeight: 700 as const, color: "#374151", marginBottom: 5, display: "block" };

const ENTITY_OPTIONS: { value: NCEEntityType; label: string }[] = [
  { value: "proprietorship", label: "Sole Proprietorship" },
  { value: "partnership", label: "Partnership Firm" },
  { value: "llp", label: "Limited Liability Partnership (LLP)" },
  { value: "huf", label: "Hindu Undivided Family (HUF)" },
  { value: "trust", label: "Trust" },
  { value: "association", label: "Association of Persons / BOI" },
];

const FY_OPTIONS: NCEFinancialYear[] = ["2025-26", "2024-25", "2023-24", "2022-23"];

const SIGNATORY_LABELS: Record<NCEEntityType, string> = {
  proprietorship: "Proprietor",
  partnership: "Managing Partner",
  llp: "Designated Partner",
  huf: "Karta",
  trust: "Trustee",
  association: "Secretary / President",
};

export default function Step0Setup({ data, update, fyLabels }: Props) {
  function field(key: keyof NCEFinancialsData, label_: string, placeholder?: string, type = "text") {
    return (
      <div>
        <label style={label}>{label_}</label>
        <input
          type={type}
          value={String(data[key] ?? "")}
          onChange={e => update({ [key]: e.target.value } as Partial<NCEFinancialsData>)}
          placeholder={placeholder}
          style={inp}
        />
      </div>
    );
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>

      {/* Entity Information */}
      <div style={{ background: "#fff", border: "1px solid #e2e8f0", borderRadius: 16, padding: "22px 24px" }}>
        <h3 style={{ fontSize: 15, fontWeight: 800, color: "#0f172a", margin: "0 0 18px" }}>Entity Information</h3>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
          <div style={{ gridColumn: "1 / -1" }}>
            <label style={label}>Entity / Firm Name *</label>
            <input
              value={data.entityName}
              onChange={e => update({ entityName: e.target.value })}
              placeholder="M/s ABC & Co."
              style={{ ...inp, fontSize: 15, fontWeight: 600 }}
            />
          </div>
          <div>
            <label style={label}>Entity Type *</label>
            <select value={data.entityType} onChange={e => update({ entityType: e.target.value as NCEEntityType, signatoryDesignation: SIGNATORY_LABELS[e.target.value as NCEEntityType] })} style={inp}>
              {ENTITY_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
            </select>
          </div>
          <div>
            <label style={label}>Financial Year *</label>
            <select value={data.financialYear} onChange={e => update({ financialYear: e.target.value as NCEFinancialYear })} style={inp}>
              {FY_OPTIONS.map(fy => <option key={fy} value={fy}>FY {fy}</option>)}
            </select>
          </div>

          {/* FY labels */}
          <div style={{ gridColumn: "1 / -1" }}>
            <div style={{ background: "#f0f9ff", border: "1px solid #bae6fd", borderRadius: 10, padding: "12px 16px", display: "flex", gap: 32 }}>
              <div>
                <div style={{ fontSize: 11, fontWeight: 700, color: "#0369a1" }}>Current Year</div>
                <div style={{ fontSize: 13, fontWeight: 700 }}>{fyLabels.current}</div>
              </div>
              {!data.isFirstYear && (
                <div>
                  <div style={{ fontSize: 11, fontWeight: 700, color: "#64748b" }}>Previous Year</div>
                  <div style={{ fontSize: 13, fontWeight: 600 }}>{fyLabels.prev}</div>
                </div>
              )}
            </div>
          </div>

          <div style={{ gridColumn: "1 / -1", display: "flex", alignItems: "center", gap: 10 }}>
            <input type="checkbox" id="firstYear" checked={data.isFirstYear} onChange={e => update({ isFirstYear: e.target.checked })} style={{ width: 16, height: 16, accentColor: "#0ea5e9", cursor: "pointer" }} />
            <label htmlFor="firstYear" style={{ fontSize: 13, fontWeight: 600, color: "#374151", cursor: "pointer" }}>First Year of preparation — no previous year figures</label>
          </div>

          <div style={{ gridColumn: "1 / -1" }}>
            <label style={label}>Registered Address</label>
            <textarea value={data.address} onChange={e => update({ address: e.target.value })} placeholder="Full address..." rows={2} style={{ ...inp, resize: "vertical" as const }} />
          </div>
          {field("pan", "PAN", "AABCP1234Q")}
          {field("gstin", "GSTIN (if applicable)", "29AABCP1234Q1ZM")}
          {field("registrationNumber", "Registration / Incorporation Number", "LLP Reg. No. / Deed No.")}
        </div>
      </div>

      {/* Auditor Details */}
      <div style={{ background: "#fff", border: "1px solid #e2e8f0", borderRadius: 16, padding: "22px 24px" }}>
        <h3 style={{ fontSize: 15, fontWeight: 800, color: "#0f172a", margin: "0 0 18px" }}>Auditor / Accountant Details</h3>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
          {field("auditorName", "Auditor's Name", "CA Rajesh Kumar")}
          {field("auditorFirm", "Firm Name", "Kumar & Associates")}
          {field("auditorMembership", "Membership Number", "M-123456")}
          <div style={{ gridColumn: "1 / -1" }}>
            <label style={label}>Firm Address</label>
            <textarea value={data.auditorAddress} onChange={e => update({ auditorAddress: e.target.value })} placeholder="Full address..." rows={2} style={{ ...inp, resize: "vertical" as const }} />
          </div>
          {field("auditorPlace", "Place", "New Delhi")}
          {field("auditorDate", "Date", "", "date")}
        </div>
      </div>

      {/* Signatory */}
      <div style={{ background: "#fff", border: "1px solid #e2e8f0", borderRadius: 16, padding: "22px 24px" }}>
        <h3 style={{ fontSize: 15, fontWeight: 800, color: "#0f172a", margin: "0 0 18px" }}>Signatory Details</h3>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
          {field("signatoryName", "Name", "Rajesh Kumar")}
          {field("signatoryDesignation", "Designation", SIGNATORY_LABELS[data.entityType])}
          {field("signatoryPlace", "Place", "New Delhi")}
          {field("signatoryDate", "Date", "", "date")}
        </div>
      </div>

    </div>
  );
}
