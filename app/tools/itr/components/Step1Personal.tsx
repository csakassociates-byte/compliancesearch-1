"use client";
import { ITRData, STATE_CODES, ResidentialStatus } from "@/lib/itr/types";

interface Props {
  data: ITRData;
  update: (patch: Partial<ITRData>) => void;
}

const inp = { width: "100%", padding: "9px 12px", border: "1px solid #e2e8f0", borderRadius: 8, fontSize: 13, boxSizing: "border-box" as const };
const lbl = { fontSize: 12, fontWeight: 700 as const, color: "#374151", marginBottom: 5, display: "block" };
const field = { display: "flex", flexDirection: "column" as const };

function Field({ label, children, badge }: { label: string; children: React.ReactNode; badge?: string }) {
  return (
    <div style={field}>
      <label style={lbl}>
        {label}
        {badge && <span style={{ marginLeft: 8, fontSize: 10, background: "#dcfce7", color: "#166534", padding: "1px 7px", borderRadius: 10, fontWeight: 600 }}>{badge}</span>}
      </label>
      {children}
    </div>
  );
}

export default function Step1Personal({ data, update }: Props) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>

      {/* PAN + Basic */}
      <div style={{ background: "#fff", border: "1px solid #e2e8f0", borderRadius: 16, padding: "22px 24px" }}>
        <h3 style={{ fontSize: 15, fontWeight: 800, color: "#0f172a", margin: "0 0 16px" }}>Basic Information</h3>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 14 }}>
          <Field label="PAN" badge={data.hasPrefill ? "Prefill" : undefined}>
            <input style={{ ...inp, fontFamily: "monospace", textTransform: "uppercase" }} value={data.pan}
              onChange={e => update({ pan: e.target.value.toUpperCase() })} maxLength={10} placeholder="ABCDE1234F" />
          </Field>
          <Field label="Date of Birth" badge={data.hasPrefill ? "Prefill" : undefined}>
            <input type="date" style={inp} value={data.dob} onChange={e => update({ dob: e.target.value })} />
          </Field>
          <Field label="Aadhaar Number" badge={data.hasPrefill ? "Prefill" : undefined}>
            <input style={{ ...inp, fontFamily: "monospace" }} value={data.aadhaar}
              onChange={e => update({ aadhaar: e.target.value.replace(/\D/g, "").slice(0, 12) })} placeholder="12 digit Aadhaar" />
          </Field>
        </div>
      </div>

      {/* Name */}
      <div style={{ background: "#fff", border: "1px solid #e2e8f0", borderRadius: 16, padding: "22px 24px" }}>
        <h3 style={{ fontSize: 15, fontWeight: 800, color: "#0f172a", margin: "0 0 16px" }}>Name</h3>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr 1fr", gap: 14 }}>
          <Field label="First Name" badge={data.hasPrefill ? "Prefill" : undefined}>
            <input style={inp} value={data.firstName} onChange={e => update({ firstName: e.target.value })} />
          </Field>
          <Field label="Middle Name">
            <input style={inp} value={data.middleName} onChange={e => update({ middleName: e.target.value })} />
          </Field>
          <Field label="Last Name / Surname" badge={data.hasPrefill ? "Prefill" : undefined}>
            <input style={inp} value={data.lastName} onChange={e => update({ lastName: e.target.value })} />
          </Field>
          <Field label="Father's Name" badge={data.hasPrefill ? "Prefill" : undefined}>
            <input style={inp} value={data.fatherName} onChange={e => update({ fatherName: e.target.value })} />
          </Field>
        </div>
      </div>

      {/* Contact */}
      <div style={{ background: "#fff", border: "1px solid #e2e8f0", borderRadius: 16, padding: "22px 24px" }}>
        <h3 style={{ fontSize: 15, fontWeight: 800, color: "#0f172a", margin: "0 0 16px" }}>Contact Details</h3>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
          <Field label="Mobile Number" badge={data.hasPrefill ? "Prefill" : undefined}>
            <input style={inp} value={data.mobile} onChange={e => update({ mobile: e.target.value })} placeholder="10-digit mobile" />
          </Field>
          <Field label="Email Address" badge={data.hasPrefill ? "Prefill" : undefined}>
            <input type="email" style={inp} value={data.email} onChange={e => update({ email: e.target.value })} />
          </Field>
        </div>
      </div>

      {/* Address */}
      <div style={{ background: "#fff", border: "1px solid #e2e8f0", borderRadius: 16, padding: "22px 24px" }}>
        <h3 style={{ fontSize: 15, fontWeight: 800, color: "#0f172a", margin: "0 0 16px" }}>Address</h3>
        <div style={{ display: "grid", gridTemplateColumns: "1fr", gap: 14 }}>
          <Field label="Door / Flat / Building / Road" badge={data.hasPrefill ? "Prefill" : undefined}>
            <input style={inp} value={data.address} onChange={e => update({ address: e.target.value })} />
          </Field>
          <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr 1fr 1fr", gap: 14 }}>
            <Field label="City / Town / District" badge={data.hasPrefill ? "Prefill" : undefined}>
              <input style={inp} value={data.city} onChange={e => update({ city: e.target.value })} />
            </Field>
            <Field label="State" badge={data.hasPrefill ? "Prefill" : undefined}>
              <select style={inp} value={data.state} onChange={e => update({ state: e.target.value })}>
                <option value="">-- Select --</option>
                {Object.entries(STATE_CODES).map(([code, name]) => (
                  <option key={code} value={code}>{code} – {name}</option>
                ))}
              </select>
            </Field>
            <Field label="PIN Code" badge={data.hasPrefill ? "Prefill" : undefined}>
              <input style={inp} value={data.pinCode} onChange={e => update({ pinCode: e.target.value.replace(/\D/g, "").slice(0, 6) })} />
            </Field>
            <Field label="Residential Status" badge={data.hasPrefill ? "Prefill" : undefined}>
              <select style={inp} value={data.residentialStatus} onChange={e => update({ residentialStatus: e.target.value as ResidentialStatus })}>
                <option value="RES">Resident (RES)</option>
                <option value="RNOR">RNOR</option>
                <option value="NRI">Non-Resident (NRI)</option>
              </select>
            </Field>
          </div>
        </div>
      </div>

      {/* Bank Accounts */}
      {data.bankAccounts.length > 0 && (
        <div style={{ background: "#fff", border: "1px solid #e2e8f0", borderRadius: 16, padding: "22px 24px" }}>
          <h3 style={{ fontSize: 15, fontWeight: 800, color: "#0f172a", margin: "0 0 4px" }}>
            Bank Accounts
            <span style={{ fontSize: 12, fontWeight: 600, color: "#059669", marginLeft: 10 }}>Auto-loaded from prefill</span>
          </h3>
          <p style={{ fontSize: 12, color: "#64748b", margin: "0 0 14px" }}>Select the account for tax refund credit.</p>
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {data.bankAccounts.map((b, i) => (
              <div key={i} style={{
                padding: "14px 18px", borderRadius: 12,
                border: `2px solid ${b.useForRefund === "true" ? "#3b82f6" : "#e2e8f0"}`,
                background: b.useForRefund === "true" ? "#eff6ff" : "#f8fafc",
                display: "flex", alignItems: "center", gap: 16, cursor: "pointer",
              }} onClick={() => {
                const updated = data.bankAccounts.map((ba, j) => ({ ...ba, useForRefund: j === i ? "true" : "false" }));
                update({ bankAccounts: updated, refundBankAccount: b.bankAccountNo, refundBankIFSC: b.ifsccode });
              }}>
                <div style={{ width: 20, height: 20, borderRadius: "50%", border: `2px solid ${b.useForRefund === "true" ? "#3b82f6" : "#cbd5e1"}`, background: b.useForRefund === "true" ? "#3b82f6" : "transparent", display: "flex", alignItems: "center", justifyContent: "center" }}>
                  {b.useForRefund === "true" && <div style={{ width: 8, height: 8, borderRadius: "50%", background: "#fff" }} />}
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 14, fontWeight: 700, color: b.useForRefund === "true" ? "#1d4ed8" : "#0f172a" }}>{b.bankName}</div>
                  <div style={{ fontSize: 12, color: "#64748b", fontFamily: "monospace", marginTop: 2 }}>
                    {b.bankAccountNo} &nbsp;·&nbsp; IFSC: {b.ifsccode} &nbsp;·&nbsp; {b.AccountType}
                  </div>
                </div>
                {b.useForRefund === "true" && (
                  <span style={{ fontSize: 11, background: "#dcfce7", color: "#166534", padding: "3px 10px", borderRadius: 8, fontWeight: 700 }}>Refund Account</span>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

    </div>
  );
}
