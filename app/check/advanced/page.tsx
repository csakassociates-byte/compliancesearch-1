"use client";
import { useState, useMemo, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import type { BusinessProfile } from "@/lib/types";

// ─── Toggle ────────────────────────────────────────────────────────────────
function Toggle({ label, sub, icon, checked, onChange }: {
  label: string; sub?: string; icon: string; checked: boolean; onChange: (v: boolean) => void;
}) {
  return (
    <button type="button" onClick={() => onChange(!checked)}
      className={`flex items-center gap-3 px-4 py-3 rounded-xl border-2 text-sm font-medium transition-all text-left w-full ${
        checked ? "border-blue-500 bg-blue-50 text-blue-800" : "border-gray-200 bg-white text-gray-700 hover:border-gray-300"
      }`}
    >
      <span className="text-xl shrink-0">{icon}</span>
      <span className="flex-1">
        <span>{label}</span>
        {sub && <span className="block text-xs font-normal text-gray-500 mt-0.5">{sub}</span>}
      </span>
      <span className={`text-xs px-2.5 py-0.5 rounded-full font-semibold shrink-0 ${
        checked ? "bg-blue-500 text-white" : "bg-gray-100 text-gray-400"
      }`}>{checked ? "Yes" : "No"}</span>
    </button>
  );
}

// ─── Section Header ────────────────────────────────────────────────────────
function Section({ n, title, sub, icon }: { n: number; title: string; sub: string; icon: string }) {
  return (
    <div className="flex items-start gap-3 mb-4">
      <div className="w-8 h-8 rounded-full bg-blue-600 text-white text-sm font-bold flex items-center justify-center shrink-0 mt-0.5">{n}</div>
      <div>
        <div className="flex items-center gap-2">
          <span className="text-lg">{icon}</span>
          <h3 className="text-base font-bold text-gray-900">{title}</h3>
        </div>
        <p className="text-xs text-gray-500 mt-0.5">{sub}</p>
      </div>
    </div>
  );
}

// ─── Main Content ──────────────────────────────────────────────────────────
function AdvancedCheckContent() {
  const searchParams = useSearchParams();
  const router = useRouter();

  const basicProfile = useMemo<BusinessProfile | null>(() => {
    try {
      const d = searchParams.get("data");
      return d ? JSON.parse(decodeURIComponent(d)) as BusinessProfile : null;
    } catch { return null; }
  }, [searchParams]);

  // Advanced fields state
  const [adv, setAdv] = useState({
    // Financial
    netProfitBracket: "" as "" | "below5cr" | "5to50cr" | "50to500cr" | "above500cr",
    netWorthBracket:  "" as "" | "below500cr" | "above500cr",
    // International
    hasFDIReceived:        false,
    hasOverseasSub:        false,
    makesForeignPayments:  false,
    hasECBBorrowing:       false,
    isForeignEntityIndia:  false,
    expandingAbroad:       false,
    intlTxnBracket:        "" as "" | "none" | "below1cr" | "1to500cr" | "above500cr",
    groupRevBracket:       "" as "" | "below500cr" | "500to5500cr" | "above5500cr",
    // Digital / E-commerce
    isEcomOperator:       false,
    collectsPersonalData: false,
    // Real Estate / Construction
    hasRealEstateDev:        false,
    hasConstructionActivity: false,
    // Other
    hasCryptoVDA:            false,
    receivesForeignDonation: false,
    hasMSMEDues:             false,
  });

  const set = <K extends keyof typeof adv>(k: K, v: typeof adv[K]) =>
    setAdv(p => ({ ...p, [k]: v }));

  function buildAdvancedProfile(): BusinessProfile {
    // Map brackets to numeric values
    const netProfitLakhs =
      adv.netProfitBracket === "below5cr"      ? 0 :
      adv.netProfitBracket === "5to50cr"       ? 600 :
      adv.netProfitBracket === "50to500cr"     ? 3000 :
      adv.netProfitBracket === "above500cr"    ? 60000 : undefined;

    const netWorthCrore =
      adv.netWorthBracket === "below500cr"     ? 100 :
      adv.netWorthBracket === "above500cr"     ? 600 : undefined;

    const intlTxnLakhs =
      adv.intlTxnBracket === "none"            ? 0 :
      adv.intlTxnBracket === "below1cr"        ? 50 :
      adv.intlTxnBracket === "1to500cr"        ? 200 :
      adv.intlTxnBracket === "above500cr"      ? 60000 : undefined;

    const groupRevCrore =
      adv.groupRevBracket === "below500cr"     ? 100 :
      adv.groupRevBracket === "500to5500cr"    ? 1000 :
      adv.groupRevBracket === "above5500cr"    ? 6000 : undefined;

    return {
      ...(basicProfile as BusinessProfile),
      netProfitLakhs,
      netWorthCrore,
      hasFDIReceived:        adv.hasFDIReceived,
      hasOverseasSub:        adv.hasOverseasSub,
      makesForeignPayments:  adv.makesForeignPayments,
      hasECBBorrowing:       adv.hasECBBorrowing,
      isForeignEntityIndia:  adv.isForeignEntityIndia,
      expandingAbroad:       adv.expandingAbroad,
      intlTxnLakhs,
      groupRevCrore,
      isEcomOperator:        adv.isEcomOperator,
      collectsPersonalData:  adv.collectsPersonalData,
      hasRealEstateDev:      adv.hasRealEstateDev,
      hasConstructionActivity: adv.hasConstructionActivity,
      hasCryptoVDA:          adv.hasCryptoVDA,
      receivesForeignDonation: adv.receivesForeignDonation,
      hasMSMEDues:           adv.hasMSMEDues,
    };
  }

  function handleSubmit() {
    const full = buildAdvancedProfile();
    router.push(`/results?data=${encodeURIComponent(JSON.stringify(full))}`);
  }

  if (!basicProfile) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-500 mb-3">No basic profile found.</p>
          <a href="/check" className="text-blue-600 underline text-sm">Start from Basic Check →</a>
        </div>
      </div>
    );
  }

  const BIZ_LABEL: Record<string,string> = {
    proprietorship:"Sole Proprietorship", partnership:"Partnership",
    llp:"LLP", opc:"OPC", pvt_ltd:"Private Limited",
    public_ltd:"Public Limited", section8:"Section 8 / NGO",
  };

  const isCompany = ["pvt_ltd","public_ltd","opc","llp","section8"].includes(basicProfile.businessType);
  const isLargeCompany = basicProfile.turnoverLakhs >= 100000;

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-2xl mx-auto">

        {/* Header */}
        <div className="text-center mb-6">
          <a href="/" className="inline-flex items-center gap-2 text-blue-800 font-bold text-xl mb-2">
            <span>⚖️</span> ComplianceCheck India
          </a>
          <div className="inline-flex items-center gap-2 bg-green-100 border border-green-200 text-green-800 text-xs font-semibold px-3 py-1.5 rounded-full mb-3">
            <span>✓</span> Basic Check Complete
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-1">Advanced Compliance Analysis</h1>
          <p className="text-gray-500 text-sm">
            Answer these additional questions for a <strong>360° legal compliance analysis</strong> —
            covering CSR, Transfer Pricing, FEMA, SEBI, DPDP, RERA, and more.
          </p>
        </div>

        {/* Basic profile summary */}
        <div className="bg-blue-50 border border-blue-200 rounded-xl px-4 py-3 mb-6 flex items-center gap-3">
          <span className="text-2xl">🏢</span>
          <div>
            <p className="text-sm font-semibold text-blue-900">
              {BIZ_LABEL[basicProfile.businessType]} • {basicProfile.sector.replace(/_/g," ").replace(/\b\w/g,c=>c.toUpperCase())} • {basicProfile.state}
            </p>
            <p className="text-xs text-blue-700 mt-0.5">
              Turnover: {basicProfile.turnoverLakhs >= 10000 ? `₹${(basicProfile.turnoverLakhs/100).toFixed(0)} Cr` : `₹${basicProfile.turnoverLakhs}L`} •
              Employees: {basicProfile.employeeCount || "None"}
            </p>
          </div>
        </div>

        {/* Questions */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 space-y-8">

          {/* ── Section 1: Financial Metrics ──────────────── */}
          {isCompany && (
            <div>
              <Section n={1} icon="💰" title="Financial Metrics"
                sub="Determines CSR applicability (Section 135), DPT-3 relevance, and Secretarial Audit requirements" />
              <div className="space-y-3">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Net Profit (after tax) — last financial year
                    <span className="ml-2 text-xs font-normal text-gray-500">(CSR threshold: ₹5 Crore)</span>
                  </label>
                  <div className="space-y-1.5">
                    {[
                      { id:"below5cr",   label:"Below ₹5 Crore",          desc:"CSR not applicable" },
                      { id:"5to50cr",    label:"₹5 Crore – ₹50 Crore",    desc:"CSR applicable — 2% spending required" },
                      { id:"50to500cr",  label:"₹50 Crore – ₹500 Crore",  desc:"CSR + impact assessment for large projects" },
                      { id:"above500cr", label:"Above ₹500 Crore",         desc:"CSR + multiple advanced compliances" },
                    ].map(opt => (
                      <button key={opt.id} type="button" onClick={() => set("netProfitBracket", opt.id as typeof adv.netProfitBracket)}
                        className={`w-full flex items-center justify-between px-4 py-2.5 rounded-xl border-2 text-sm transition-all ${
                          adv.netProfitBracket === opt.id
                            ? "border-blue-500 bg-blue-50 font-semibold text-blue-800"
                            : "border-gray-200 hover:border-blue-200 text-gray-700"
                        }`}>
                        <div>
                          <span className="font-medium">{opt.label}</span>
                          <span className="ml-2 text-xs text-gray-500">{opt.desc}</span>
                        </div>
                        {adv.netProfitBracket === opt.id && <span className="text-blue-500">✓</span>}
                      </button>
                    ))}
                  </div>
                </div>

                {isLargeCompany && (
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Net Worth of company
                      <span className="ml-2 text-xs font-normal text-gray-500">(CSR threshold: ₹500 Crore)</span>
                    </label>
                    <div className="space-y-1.5">
                      {[
                        { id:"below500cr", label:"Below ₹500 Crore" },
                        { id:"above500cr", label:"₹500 Crore or above", desc:"CSR applicable even if profit < ₹5 Crore" },
                      ].map(opt => (
                        <button key={opt.id} type="button" onClick={() => set("netWorthBracket", opt.id as typeof adv.netWorthBracket)}
                          className={`w-full flex items-center justify-between px-4 py-2.5 rounded-xl border-2 text-sm transition-all ${
                            adv.netWorthBracket === opt.id
                              ? "border-blue-500 bg-blue-50 font-semibold text-blue-800"
                              : "border-gray-200 hover:border-blue-200 text-gray-700"
                          }`}>
                          <span>{opt.label}{opt.desc && <span className="ml-2 text-xs text-gray-500">{opt.desc}</span>}</span>
                          {adv.netWorthBracket === opt.id && <span className="text-blue-500">✓</span>}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                <Toggle label="Company has outstanding dues to MSME suppliers beyond 45 days"
                  sub="Triggers MSME Form 1 filing (half-yearly) + Section 43B(h) tax disallowance"
                  icon="📦" checked={adv.hasMSMEDues} onChange={v => set("hasMSMEDues", v)} />
              </div>
            </div>
          )}

          {/* ── Section 2: International & Cross-Border ───── */}
          <div>
            <Section n={isCompany ? 2 : 1} icon="🌏" title="International & Cross-Border"
              sub="FEMA, RBI filings, Transfer Pricing, Equalization Levy, LRS — for any foreign transactions" />
            <div className="space-y-2.5">
              <Toggle label="Company has received FDI (foreign equity investment in its shares)"
                sub="Triggers FC-GPR, FLA Return, FDI Policy compliance"
                icon="💱" checked={adv.hasFDIReceived} onChange={v => set("hasFDIReceived", v)} />
              <Toggle label="Company has an overseas subsidiary, JV, or branch office"
                sub="Triggers ODI Form FC, Annual Performance Report (APR), FLA Return"
                icon="🏢" checked={adv.hasOverseasSub} onChange={v => set("hasOverseasSub", v)} />
              <Toggle label="Company expands / invests / establishes business abroad"
                sub="ODI compliance, FEMA Overseas Investment Rules 2022, LRS TCS implications"
                icon="✈️" checked={adv.expandingAbroad} onChange={v => set("expandingAbroad", v)} />
              <Toggle label="Company makes payments to non-resident parties (royalty, services, commission, dividends)"
                sub="Triggers Form 15CA/15CB for each remittance, Equalization Levy on digital ad payments"
                icon="💸" checked={adv.makesForeignPayments} onChange={v => set("makesForeignPayments", v)} />
              <Toggle label="Company has taken External Commercial Borrowing (ECB) from foreign lenders"
                sub="Triggers ECB Form + ECB-2 monthly returns to RBI"
                icon="🏦" checked={adv.hasECBBorrowing} onChange={v => set("hasECBBorrowing", v)} />
              <Toggle label="This is a foreign company / entity operating in India (Branch/Liaison/Project Office)"
                sub="RBI Form FNC, Annual Activity Certificate, ROC filings FC-3, FC-4"
                icon="🌐" checked={adv.isForeignEntityIndia} onChange={v => set("isForeignEntityIndia", v)} />

              {(adv.makesForeignPayments || adv.hasFDIReceived || adv.hasOverseasSub) && (
                <div className="pt-1">
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Approximate value of international related-party transactions (per year)
                    <span className="ml-2 text-xs font-normal text-gray-500">(Transfer Pricing — Form 3CEB triggered by any amount)</span>
                  </label>
                  <div className="space-y-1.5">
                    {[
                      { id:"none",        label:"No related-party international transactions" },
                      { id:"below1cr",    label:"Below ₹1 Crore",     desc:"Form 3CEB not required" },
                      { id:"1to500cr",    label:"₹1 Crore – ₹500 Crore", desc:"Form 3CEB + TP documentation required" },
                      { id:"above500cr",  label:"Above ₹500 Crore",   desc:"TP + possible Master File / CbCR" },
                    ].map(opt => (
                      <button key={opt.id} type="button" onClick={() => set("intlTxnBracket", opt.id as typeof adv.intlTxnBracket)}
                        className={`w-full flex items-center justify-between px-4 py-2.5 rounded-xl border-2 text-sm transition-all ${
                          adv.intlTxnBracket === opt.id
                            ? "border-blue-500 bg-blue-50 font-semibold text-blue-800"
                            : "border-gray-200 hover:border-blue-200 text-gray-700"
                        }`}>
                        <div>
                          <span className="font-medium">{opt.label}</span>
                          {opt.desc && <span className="ml-2 text-xs text-gray-500">{opt.desc}</span>}
                        </div>
                        {adv.intlTxnBracket === opt.id && <span className="text-blue-500">✓</span>}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {(adv.hasOverseasSub || adv.hasFDIReceived || adv.makesForeignPayments) && (
                <div className="pt-1">
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Consolidated group revenue (all group companies worldwide)
                    <span className="ml-2 text-xs font-normal text-gray-500">(Master File ≥ ₹500 Cr | CbCR ≥ ₹5,500 Cr)</span>
                  </label>
                  <div className="space-y-1.5">
                    {[
                      { id:"below500cr",  label:"Below ₹500 Crore",          desc:"No Master File or CbCR obligation" },
                      { id:"500to5500cr", label:"₹500 Crore – ₹5,500 Crore", desc:"Master File (Form 3CEAA) required" },
                      { id:"above5500cr", label:"Above ₹5,500 Crore (~USD 750M)", desc:"Master File + CbCR (Form 3CEAD) required" },
                    ].map(opt => (
                      <button key={opt.id} type="button" onClick={() => set("groupRevBracket", opt.id as typeof adv.groupRevBracket)}
                        className={`w-full flex items-center justify-between px-4 py-2.5 rounded-xl border-2 text-sm transition-all ${
                          adv.groupRevBracket === opt.id
                            ? "border-blue-500 bg-blue-50 font-semibold text-blue-800"
                            : "border-gray-200 hover:border-blue-200 text-gray-700"
                        }`}>
                        <div>
                          <span className="font-medium">{opt.label}</span>
                          {opt.desc && <span className="ml-2 text-xs text-gray-500">{opt.desc}</span>}
                        </div>
                        {adv.groupRevBracket === opt.id && <span className="text-blue-500">✓</span>}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* ── Section 3: Digital & E-commerce ───────────── */}
          <div>
            <Section n={isCompany ? 3 : 2} icon="💻" title="Digital & E-Commerce"
              sub="DPDP Act, IT Intermediary Rules 2021, Consumer Protection E-Commerce Rules 2020" />
            <div className="space-y-2.5">
              <Toggle label="Business runs an online marketplace / aggregator / e-commerce platform"
                sub="Consumer Protection E-Commerce Rules, IT Intermediary Rules, Equalization Levy"
                icon="🛒" checked={adv.isEcomOperator} onChange={v => set("isEcomOperator", v)} />
              <Toggle label="Business collects, stores, or processes personal data of customers / users"
                sub="Digital Personal Data Protection (DPDP) Act 2023, IT Rules 2021"
                icon="🔒" checked={adv.collectsPersonalData} onChange={v => set("collectsPersonalData", v)} />
            </div>
          </div>

          {/* ── Section 4: Real Estate & Construction ──────── */}
          <div>
            <Section n={isCompany ? 4 : 3} icon="🏗️" title="Real Estate & Construction"
              sub="RERA registration for developers, BOCW cess for construction activities" />
            <div className="space-y-2.5">
              <Toggle label="Business develops real estate projects for sale (residential / commercial)"
                sub="RERA Registration mandatory — plot > 500 sqm or > 8 apartments"
                icon="🏠" checked={adv.hasRealEstateDev} onChange={v => set("hasRealEstateDev", v)} />
              <Toggle label="Business undertakes building / civil construction activities with 10+ workers"
                sub="BOCW cess (1% of construction cost), registration with State BOCW Board"
                icon="🏗️" checked={adv.hasConstructionActivity} onChange={v => set("hasConstructionActivity", v)} />
            </div>
          </div>

          {/* ── Section 5: Other Sector-Specific ──────────── */}
          <div>
            <Section n={isCompany ? 5 : 4} icon="⚙️" title="Other Sector-Specific Activities"
              sub="Virtual Digital Assets, FCRA (NGOs), and any other unique compliance triggers" />
            <div className="space-y-2.5">
              <Toggle label="Business deals in Virtual Digital Assets (Bitcoin, Ethereum, NFTs, crypto tokens)"
                sub="30% flat tax on VDA gains, 1% TDS u/s 194S, PMLA reporting (FIU-IND registration)"
                icon="₿" checked={adv.hasCryptoVDA} onChange={v => set("hasCryptoVDA", v)} />
              {["section8","partnership","proprietorship"].includes(basicProfile.businessType) && (
                <Toggle label="Organisation receives foreign contributions / donations from foreign sources"
                  sub="FCRA Registration / Prior Permission from MHA; FC-3 Annual Return by Dec 31"
                  icon="🌱" checked={adv.receivesForeignDonation} onChange={v => set("receivesForeignDonation", v)} />
              )}
            </div>
          </div>

          {/* ── Info box ─────────────────────────────────── */}
          <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 text-xs text-amber-800">
            <span className="font-bold">ℹ️ Note: </span>
            Answer only what applies to your business. Unanswered questions default to "No."
            If unsure about a field, consult your CA / CS before submitting.
          </div>

          {/* ── Submit ────────────────────────────────────── */}
          <div className="flex items-center justify-between pt-2 border-t border-gray-100">
            <button type="button"
              onClick={() => router.back()}
              className="text-sm text-gray-500 hover:text-gray-800 transition-colors">
              ← Back to Basic Results
            </button>
            <button type="button" onClick={handleSubmit}
              className="bg-blue-600 hover:bg-blue-700 text-white font-bold px-8 py-3 rounded-xl transition-colors flex items-center gap-2">
              <span>🔍</span>
              Get Advanced Analysis →
            </button>
          </div>
        </div>

        <p className="text-center text-gray-400 text-xs mt-4">
          ⚠️ For guidance only. Consult a qualified CA / CS for professional advice.
        </p>
      </div>
    </div>
  );
}

export default function AdvancedCheckPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <p className="text-gray-500">Loading...</p>
      </div>
    }>
      <AdvancedCheckContent />
    </Suspense>
  );
}
