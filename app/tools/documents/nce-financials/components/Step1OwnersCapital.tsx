"use client";
import { NCEFinancialsData, OwnerCapitalAccount, PartnersRemunerationItem, newOwnerAccount } from "@/lib/nce-financials/types";

interface Props {
  data: NCEFinancialsData;
  update: (patch: Partial<NCEFinancialsData>) => void;
  fyLabels: { current: string; prev: string };
}

const inp = { padding: "7px 10px", border: "1px solid #e2e8f0", borderRadius: 7, fontSize: 13, width: "100%", boxSizing: "border-box" as const, textAlign: "right" as const, outline: "none" };
const inpLeft = { ...inp, textAlign: "left" as const };
const thStyle = { padding: "10px 10px", fontSize: 11, fontWeight: 700 as const, color: "#64748b", textTransform: "uppercase" as const, letterSpacing: "0.05em", background: "#f8fafc", borderBottom: "1px solid #e2e8f0", whiteSpace: "nowrap" as const };
const tdStyle = { padding: "8px 8px", borderBottom: "1px solid #f1f5f9", verticalAlign: "middle" as const };

function n(val: string) { return parseFloat(val) || 0; }
function fmt(val: number) { return val === 0 ? "" : val.toLocaleString("en-IN") ; }

function ownerClosing(o: OwnerCapitalAccount): number {
  return n(o.openingCapital) + n(o.contributions) + n(o.profitShare) - n(o.remuneration) - n(o.interest) - n(o.withdrawals);
}
function ownerClosingPrev(o: OwnerCapitalAccount): number {
  return n(o.openingCapitalPrev) + n(o.contributionsPrev) + n(o.profitSharePrev) - n(o.remunerationPrev) - n(o.interestPrev) - n(o.withdrawalsPrev);
}

export default function Step1OwnersCapital({ data, update, fyLabels }: Props) {
  const owners = data.note3OwnersCapital;
  const totalCurrent = owners.reduce((s, o) => s + ownerClosing(o), 0);
  const totalPrev = owners.reduce((s, o) => s + ownerClosingPrev(o), 0);

  function updateOwner(idx: number, patch: Partial<OwnerCapitalAccount>) {
    update({ note3OwnersCapital: owners.map((o, i) => i === idx ? { ...o, ...patch } : o) });
  }

  function addOwner() {
    update({ note3OwnersCapital: [...owners, newOwnerAccount()] });
  }

  function removeOwner(idx: number) {
    if (owners.length === 1) return;
    update({ note3OwnersCapital: owners.filter((_, i) => i !== idx) });
  }

  // Partners' Remuneration sync
  function syncRemuneration() {
    const items: PartnersRemunerationItem[] = owners
      .filter(o => o.ownerName)
      .map(o => ({
        id: o.id,
        name: o.ownerName,
        amount: o.remuneration,
        amountPrev: o.remunerationPrev,
      }));
    update({ partnersRemuneration: items });
  }

  const entityLabel = data.entityType === "proprietorship" ? "Proprietor" :
    data.entityType === "huf" ? "Member" :
    data.entityType === "trust" ? "Trustee" : "Partner";

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>

      {/* Note 3: Owners' Capital Account */}
      <div style={{ background: "#fff", border: "1px solid #e2e8f0", borderRadius: 16, padding: "22px 24px" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 18 }}>
          <div>
            <h3 style={{ fontSize: 15, fontWeight: 800, color: "#0f172a", margin: 0 }}>Note 3 — {entityLabel}&apos;s Capital Account</h3>
            <p style={{ fontSize: 12, color: "#64748b", margin: "4px 0 0" }}>ICAI GN Format — Movement in Capital Account during the year</p>
          </div>
          <button onClick={addOwner} style={{ background: "#0ea5e9", color: "#fff", border: "none", borderRadius: 8, padding: "8px 14px", fontSize: 12, fontWeight: 700, cursor: "pointer" }}>
            + Add {entityLabel}
          </button>
        </div>

        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", minWidth: 900 }}>
            <thead>
              <tr>
                <th style={{ ...thStyle, textAlign: "left" }}>{entityLabel} Name</th>
                <th style={thStyle}>Ratio %</th>
                <th style={thStyle}>Opening<br />{fyLabels.current}</th>
                <th style={thStyle}>Opening<br />Prev Year</th>
                <th style={thStyle}>Contributions</th>
                <th style={thStyle}>Remuneration</th>
                <th style={thStyle}>Interest on<br />Capital</th>
                <th style={thStyle}>Drawings /<br />Withdrawals</th>
                <th style={thStyle}>Profit /<br />Loss Share</th>
                <th style={{ ...thStyle, color: "#059669" }}>Closing Balance<br />{fyLabels.current}</th>
                <th style={{ ...thStyle, color: "#64748b" }}>Closing<br />Prev Year</th>
                <th style={thStyle}></th>
              </tr>
            </thead>
            <tbody>
              {owners.map((o, idx) => (
                <tr key={o.id}>
                  <td style={tdStyle}>
                    <input value={o.ownerName} onChange={e => updateOwner(idx, { ownerName: e.target.value })} placeholder={`${entityLabel} ${idx + 1}`} style={inpLeft} />
                  </td>
                  <td style={tdStyle}>
                    <input value={o.ratio} onChange={e => updateOwner(idx, { ratio: e.target.value })} placeholder="25" style={inp} />
                  </td>
                  <td style={tdStyle}>
                    <input value={o.openingCapital} onChange={e => updateOwner(idx, { openingCapital: e.target.value })} placeholder="0" style={inp} />
                  </td>
                  <td style={tdStyle}>
                    <input value={o.openingCapitalPrev} onChange={e => updateOwner(idx, { openingCapitalPrev: e.target.value })} placeholder="0" style={{ ...inp, color: "#94a3b8" }} />
                  </td>
                  <td style={tdStyle}>
                    <input value={o.contributions} onChange={e => updateOwner(idx, { contributions: e.target.value })} placeholder="0" style={inp} />
                  </td>
                  <td style={tdStyle}>
                    <input value={o.remuneration} onChange={e => updateOwner(idx, { remuneration: e.target.value })} placeholder="0" style={inp} />
                  </td>
                  <td style={tdStyle}>
                    <input value={o.interest} onChange={e => updateOwner(idx, { interest: e.target.value })} placeholder="0" style={inp} />
                  </td>
                  <td style={tdStyle}>
                    <input value={o.withdrawals} onChange={e => updateOwner(idx, { withdrawals: e.target.value })} placeholder="0" style={inp} />
                  </td>
                  <td style={tdStyle}>
                    <input value={o.profitShare} onChange={e => updateOwner(idx, { profitShare: e.target.value })} placeholder="0" style={inp} />
                  </td>
                  <td style={{ ...tdStyle, background: "#f0fdf4" }}>
                    <div style={{ padding: "8px 10px", fontWeight: 700, fontSize: 13, color: "#059669", textAlign: "right" }}>
                      {fmt(ownerClosing(o))}
                    </div>
                  </td>
                  <td style={{ ...tdStyle, background: "#f8fafc" }}>
                    <div style={{ padding: "8px 10px", fontWeight: 600, fontSize: 13, color: "#64748b", textAlign: "right" }}>
                      {fmt(ownerClosingPrev(o))}
                    </div>
                  </td>
                  <td style={tdStyle}>
                    {owners.length > 1 && (
                      <button onClick={() => removeOwner(idx)} style={{ background: "#fee2e2", color: "#dc2626", border: "none", borderRadius: 6, padding: "4px 10px", fontSize: 12, cursor: "pointer" }}>✕</button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr style={{ background: "#f0fdf4" }}>
                <td colSpan={9} style={{ ...tdStyle, fontWeight: 800, fontSize: 13, color: "#0f172a", paddingLeft: 12 }}>Total Capital</td>
                <td style={{ ...tdStyle, fontWeight: 800, fontSize: 14, color: "#059669", textAlign: "right" }}>{fmt(totalCurrent)}</td>
                <td style={{ ...tdStyle, fontWeight: 700, fontSize: 13, color: "#64748b", textAlign: "right" }}>{fmt(totalPrev)}</td>
                <td style={tdStyle}></td>
              </tr>
            </tfoot>
          </table>
        </div>

        <div style={{ marginTop: 16, padding: "12px 16px", background: "#f0f9ff", borderRadius: 10, border: "1px solid #bae6fd", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div style={{ fontSize: 12, color: "#0369a1" }}>
            <strong>Note:</strong> Closing Balance = Opening + Contributions + Profit Share − Remuneration − Interest on Capital − Drawings
          </div>
          {data.entityType !== "proprietorship" && (
            <button onClick={syncRemuneration} style={{ background: "#0ea5e9", color: "#fff", border: "none", borderRadius: 8, padding: "8px 14px", fontSize: 12, fontWeight: 700, cursor: "pointer", whiteSpace: "nowrap" as const }}>
              Sync Remuneration to P&amp;L →
            </button>
          )}
        </div>
      </div>

      {/* Note 4: Reserves & Surplus */}
      <div style={{ background: "#fff", border: "1px solid #e2e8f0", borderRadius: 16, padding: "22px 24px" }}>
        <h3 style={{ fontSize: 15, fontWeight: 800, color: "#0f172a", margin: "0 0 18px" }}>Note 4 — Reserves & Surplus</h3>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 200px 200px", gap: 0 }}>
          {[
            ["General Reserve — Opening Balance", "note4Reserves", "generalReserveOpen", ""],
            ["Add: Transferred during the year", "note4Reserves", "generalReserveAdditions", ""],
            ["General Reserve — Closing Balance", "note4Reserves", "generalReserveClose", "generalReservePrev"],
            ["Surplus — Opening Balance (P&L)", "note4Reserves", "surplusOpeningBalance", ""],
            ["Add: Net Profit for the year", "note4Reserves", "surplusNetProfit", ""],
            ["Less: Transfer to Reserves", "note4Reserves", "surplusTransferToReserve", ""],
            ["Surplus — Closing Balance", "note4Reserves", "surplusClosingBalance", "surplusPrev"],
            ["Other Reserves", "note4Reserves", "otherReserves", "otherReservesPrev"],
          ].map(([lbl, , cur, prev]) => (
            <div key={String(cur)} style={{ display: "contents" }}>
              <div style={{ padding: "10px 12px", borderBottom: "1px solid #f1f5f9", fontSize: 13, color: "#374151" }}>{lbl}</div>
              <div style={{ padding: "6px 8px", borderBottom: "1px solid #f1f5f9" }}>
                <input
                  value={String(data.note4Reserves[cur as keyof typeof data.note4Reserves] ?? "")}
                  onChange={e => update({ note4Reserves: { ...data.note4Reserves, [cur as string]: e.target.value } })}
                  style={inp}
                  placeholder="0"
                />
              </div>
              <div style={{ padding: "6px 8px", borderBottom: "1px solid #f1f5f9" }}>
                {prev ? (
                  <input
                    value={String(data.note4Reserves[prev as keyof typeof data.note4Reserves] ?? "")}
                    onChange={e => update({ note4Reserves: { ...data.note4Reserves, [prev as string]: e.target.value } })}
                    style={{ ...inp, color: "#94a3b8" }}
                    placeholder="0"
                  />
                ) : <div style={{ padding: "8px 10px", color: "#e2e8f0", textAlign: "right" }}>—</div>}
              </div>
            </div>
          ))}
        </div>
      </div>

    </div>
  );
}
