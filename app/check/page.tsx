"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import type { BusinessProfile, BusinessType, IndustrySector } from "@/lib/types";

const INDIAN_STATES = [
  "Andhra Pradesh","Arunachal Pradesh","Assam","Bihar","Chhattisgarh","Goa",
  "Gujarat","Haryana","Himachal Pradesh","Jharkhand","Karnataka","Kerala",
  "Madhya Pradesh","Maharashtra","Manipur","Meghalaya","Mizoram","Nagaland",
  "Odisha","Punjab","Rajasthan","Sikkim","Tamil Nadu","Telangana","Tripura",
  "Uttar Pradesh","Uttarakhand","West Bengal","Delhi","Jammu & Kashmir","Ladakh",
  "Chandigarh","Puducherry","Andaman & Nicobar","Dadra & Nagar Haveli","Daman & Diu",
];

const STEPS = [
  { n: 1, label: "Business Structure" },
  { n: 2, label: "Financial Details" },
  { n: 3, label: "Business Sector" },
  { n: 4, label: "Workforce" },
  { n: 5, label: "Special Activities" },
];

type BizCard = { id: BusinessType; label: string; icon: string; desc: string };
const BIZ_TYPES: BizCard[] = [
  { id: "proprietorship", label: "Sole Proprietorship", icon: "🧑‍💼", desc: "Single owner, unregistered" },
  { id: "partnership", label: "Partnership Firm", icon: "🤝", desc: "2 or more partners" },
  { id: "llp", label: "LLP", icon: "🏢", desc: "Limited Liability Partnership" },
  { id: "opc", label: "OPC", icon: "👤", desc: "One Person Company" },
  { id: "pvt_ltd", label: "Private Limited", icon: "🏭", desc: "Private Ltd. Company" },
  { id: "public_ltd", label: "Public Limited", icon: "📈", desc: "Public Ltd. Company" },
  { id: "section8", label: "Section 8 / NGO", icon: "🌱", desc: "Non-profit Company" },
];

const SECTORS: { id: IndustrySector; label: string; icon: string }[] = [
  { id: "manufacturing", label: "Manufacturing", icon: "🏭" },
  { id: "trading", label: "Trading / Wholesale / Retail", icon: "🛒" },
  { id: "services", label: "Services (General)", icon: "🔧" },
  { id: "it_software", label: "IT / Software / Technology", icon: "💻" },
  { id: "food_beverage", label: "Food & Beverage", icon: "🍽️" },
  { id: "pharma_drug", label: "Pharma / Drug / Medical Devices", icon: "💊" },
  { id: "healthcare", label: "Healthcare / Hospital / Clinic", icon: "🏥" },
  { id: "construction", label: "Construction / Infrastructure", icon: "🏗️" },
  { id: "real_estate", label: "Real Estate / Property", icon: "🏠" },
  { id: "finance_nbfc", label: "Finance / NBFC / Lending", icon: "🏦" },
  { id: "education", label: "Education / Training Institute", icon: "🎓" },
  { id: "hospitality", label: "Hotel / Restaurant / Tourism", icon: "🏨" },
  { id: "transport", label: "Transport / Logistics", icon: "🚛" },
  { id: "agriculture", label: "Agriculture / Agri-processing", icon: "🌾" },
  { id: "other", label: "Other / Miscellaneous", icon: "📦" },
];

const TURNOVER_OPTIONS = [
  { label: "Below ₹12 Lakh", value: 10 },
  { label: "₹12 Lakh – ₹20 Lakh", value: 16 },
  { label: "₹20 Lakh – ₹40 Lakh", value: 30 },
  { label: "₹40 Lakh – ₹1 Crore", value: 70 },
  { label: "₹1 Crore – ₹5 Crore", value: 300 },
  { label: "₹5 Crore – ₹20 Crore", value: 1200 },
  { label: "₹20 Crore – ₹100 Crore", value: 6000 },
  { label: "₹100 Crore – ₹500 Crore", value: 30000 },
  { label: "Above ₹500 Crore", value: 100000 },
];

const EMP_OPTIONS = [
  { label: "No employees (owner only)", value: 0 },
  { label: "1 – 4 employees", value: 2 },
  { label: "5 – 9 employees", value: 7 },
  { label: "10 – 19 employees", value: 14 },
  { label: "20 – 49 employees", value: 35 },
  { label: "50 – 99 employees", value: 75 },
  { label: "100 – 499 employees", value: 200 },
  { label: "500+ employees", value: 600 },
];

function defaultProfile(): Partial<BusinessProfile> {
  return {
    businessType: undefined, state: "", turnoverLakhs: undefined,
    employeeCount: undefined, contractWorkers: 0, sector: undefined,
    hasFood: false, hasPharma: false, hasManufacturing: false, hasImportExport: false,
    hasForeignInvestment: false, isStartup: false, isListed: false,
    hasHazardousWaste: false, isNBFC: false, hasMultipleStates: false,
    providesServices: false, sellsGoods: false,
  };
}

function Toggle({ label, icon, checked, onChange }: {
  label: string; icon: string; checked: boolean; onChange: (v: boolean) => void;
}) {
  return (
    <button
      type="button"
      onClick={() => onChange(!checked)}
      className={`flex items-center gap-3 px-4 py-3 rounded-xl border-2 text-sm font-medium transition-all text-left w-full ${
        checked
          ? "border-blue-500 bg-blue-50 text-blue-800"
          : "border-gray-200 bg-white text-gray-700 hover:border-gray-300"
      }`}
    >
      <span className="text-xl shrink-0">{icon}</span>
      <span className="flex-1">{label}</span>
      <span className={`text-xs px-2.5 py-0.5 rounded-full font-semibold shrink-0 ${
        checked ? "bg-blue-500 text-white" : "bg-gray-100 text-gray-400"
      }`}>
        {checked ? "Yes" : "No"}
      </span>
    </button>
  );
}

export default function CheckPage() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [profile, setProfile] = useState<Partial<BusinessProfile>>(defaultProfile());

  const set = <K extends keyof BusinessProfile>(k: K, v: BusinessProfile[K]) =>
    setProfile((p) => ({ ...p, [k]: v }));

  function canNext(): boolean {
    if (step === 1) return !!profile.businessType && !!profile.state;
    if (step === 2) return profile.turnoverLakhs !== undefined;
    if (step === 3) return !!profile.sector;
    if (step === 4) return profile.employeeCount !== undefined;
    return true;
  }

  function handleNext() {
    if (step < 5) {
      if (step === 3) {
        const s = profile.sector;
        setProfile((p) => ({
          ...p,
          hasFood: s === "food_beverage" || p.hasFood,
          hasPharma: s === "pharma_drug" || p.hasPharma,
          hasManufacturing: s === "manufacturing" || p.hasManufacturing,
          isNBFC: s === "finance_nbfc" || p.isNBFC,
        }));
      }
      setStep((s) => s + 1);
    } else {
      const full = profile as BusinessProfile;
      router.push(`/results?data=${encodeURIComponent(JSON.stringify(full))}`);
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-2xl mx-auto">

        {/* Header */}
        <div className="text-center mb-8">
          <a href="/" className="inline-flex items-center gap-2 text-blue-800 font-bold text-xl mb-1">
            <span>⚖️</span> ComplianceCheck India
          </a>
          <p className="text-gray-500 text-sm">Fill in your business details to get a compliance checklist</p>
        </div>

        {/* Progress bar */}
        <div className="flex items-center gap-1 mb-8">
          {STEPS.map((s, i) => (
            <div key={s.n} className="flex items-center flex-1">
              <div className="flex items-center gap-1.5 flex-1">
                <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold shrink-0 ${
                  step > s.n ? "bg-green-500 text-white" :
                  step === s.n ? "bg-blue-600 text-white" : "bg-gray-200 text-gray-500"
                }`}>
                  {step > s.n ? "✓" : s.n}
                </div>
                <span className={`text-xs hidden sm:block truncate ${
                  step === s.n ? "text-blue-700 font-semibold" : "text-gray-400"
                }`}>{s.label}</span>
              </div>
              {i < STEPS.length - 1 && (
                <div className={`h-0.5 flex-1 mx-1 ${step > s.n ? "bg-green-400" : "bg-gray-200"}`} />
              )}
            </div>
          ))}
        </div>

        {/* Card */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 md:p-8">

          {/* STEP 1 — Business Structure */}
          {step === 1 && (
            <div>
              <h2 className="text-xl font-bold text-gray-900 mb-1">Business Structure</h2>
              <p className="text-gray-500 text-sm mb-5">How is your business legally organized?</p>
              <div className="grid grid-cols-2 gap-3 mb-6">
                {BIZ_TYPES.map((bt) => (
                  <button key={bt.id} type="button" onClick={() => set("businessType", bt.id)}
                    className={`flex items-start gap-3 p-4 rounded-xl border-2 text-left transition-all ${
                      profile.businessType === bt.id
                        ? "border-blue-500 bg-blue-50"
                        : "border-gray-200 hover:border-blue-200 hover:bg-blue-50/30"
                    }`}>
                    <span className="text-2xl">{bt.icon}</span>
                    <div>
                      <p className="font-semibold text-gray-900 text-sm">{bt.label}</p>
                      <p className="text-gray-500 text-xs mt-0.5">{bt.desc}</p>
                    </div>
                  </button>
                ))}
              </div>
              <div className="mb-4">
                <label className="block text-sm font-semibold text-gray-700 mb-2">📍 Primary State of Business</label>
                <select value={profile.state} onChange={(e) => set("state", e.target.value)}
                  className="w-full border-2 border-gray-200 rounded-xl px-4 py-3 text-sm focus:border-blue-500 focus:outline-none">
                  <option value="">-- Select State --</option>
                  {INDIAN_STATES.map((s) => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
              <Toggle label="Business operates in multiple states" icon="🗺️"
                checked={!!profile.hasMultipleStates} onChange={(v) => set("hasMultipleStates", v)} />
            </div>
          )}

          {/* STEP 2 — Financial */}
          {step === 2 && (
            <div>
              <h2 className="text-xl font-bold text-gray-900 mb-1">Financial Details</h2>
              <p className="text-gray-500 text-sm mb-5">Approximate annual turnover</p>
              <div className="space-y-2">
                {TURNOVER_OPTIONS.map((opt) => (
                  <button key={opt.label} type="button" onClick={() => set("turnoverLakhs", opt.value)}
                    className={`w-full flex items-center justify-between px-4 py-3 rounded-xl border-2 text-sm transition-all ${
                      profile.turnoverLakhs === opt.value
                        ? "border-blue-500 bg-blue-50 font-semibold text-blue-800"
                        : "border-gray-200 hover:border-blue-200 text-gray-700"
                    }`}>
                    <span>{opt.label}</span>
                    {profile.turnoverLakhs === opt.value && <span className="text-blue-500 font-bold">✓</span>}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* STEP 3 — Sector */}
          {step === 3 && (
            <div>
              <h2 className="text-xl font-bold text-gray-900 mb-1">Primary Business Sector</h2>
              <p className="text-gray-500 text-sm mb-5">Select the sector that best describes your business</p>
              <div className="grid grid-cols-2 gap-2 mb-5">
                {SECTORS.map((sec) => (
                  <button key={sec.id} type="button" onClick={() => set("sector", sec.id)}
                    className={`flex items-center gap-2 px-3 py-3 rounded-xl border-2 text-sm text-left transition-all ${
                      profile.sector === sec.id
                        ? "border-blue-500 bg-blue-50 font-semibold text-blue-800"
                        : "border-gray-200 hover:border-blue-200 text-gray-700"
                    }`}>
                    <span className="text-xl">{sec.icon}</span>
                    <span className="text-xs leading-tight">{sec.label}</span>
                  </button>
                ))}
              </div>
              <div className="space-y-2">
                <p className="text-sm font-semibold text-gray-700">Business activities:</p>
                <Toggle label="Sells / deals in goods or products" icon="📦"
                  checked={!!profile.sellsGoods} onChange={(v) => set("sellsGoods", v)} />
                <Toggle label="Provides services to clients" icon="🔧"
                  checked={!!profile.providesServices} onChange={(v) => set("providesServices", v)} />
              </div>
            </div>
          )}

          {/* STEP 4 — Workforce */}
          {step === 4 && (
            <div>
              <h2 className="text-xl font-bold text-gray-900 mb-1">Workforce Details</h2>
              <p className="text-gray-500 text-sm mb-5">Employee count determines PF, ESIC, Bonus, and other labor law applicability</p>
              <div className="mb-5">
                <label className="block text-sm font-semibold text-gray-700 mb-2">👥 Permanent / Regular Employees</label>
                <div className="space-y-2">
                  {EMP_OPTIONS.map((opt) => (
                    <button key={opt.label} type="button" onClick={() => set("employeeCount", opt.value)}
                      className={`w-full flex items-center justify-between px-4 py-3 rounded-xl border-2 text-sm transition-all ${
                        profile.employeeCount === opt.value
                          ? "border-blue-500 bg-blue-50 font-semibold text-blue-800"
                          : "border-gray-200 hover:border-blue-200 text-gray-700"
                      }`}>
                      <span>{opt.label}</span>
                      {profile.employeeCount === opt.value && <span className="text-blue-500 font-bold">✓</span>}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">🔨 Contract / Third-Party Workers</label>
                <div className="grid grid-cols-4 gap-2">
                  {[{ label: "None", value: 0 }, { label: "1–9", value: 5 }, { label: "10–19", value: 15 }, { label: "20+", value: 25 }].map((opt) => (
                    <button key={opt.label} type="button" onClick={() => set("contractWorkers", opt.value)}
                      className={`py-3 rounded-xl border-2 text-sm font-medium transition-all ${
                        profile.contractWorkers === opt.value
                          ? "border-blue-500 bg-blue-50 text-blue-800"
                          : "border-gray-200 hover:border-blue-200 text-gray-700"
                      }`}>
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* STEP 5 — Special Activities */}
          {step === 5 && (
            <div>
              <h2 className="text-xl font-bold text-gray-900 mb-1">Special Activities & Conditions</h2>
              <p className="text-gray-500 text-sm mb-5">These trigger specific licenses and compliance obligations</p>
              <div className="space-y-2.5">
                <Toggle label="Engaged in food business (manufacturing, restaurant, trading)" icon="🍽️"
                  checked={!!profile.hasFood} onChange={(v) => set("hasFood", v)} />
                <Toggle label="Pharma / drug / medicine / medical devices" icon="💊"
                  checked={!!profile.hasPharma} onChange={(v) => set("hasPharma", v)} />
                <Toggle label="Has a manufacturing / production facility" icon="🏭"
                  checked={!!profile.hasManufacturing} onChange={(v) => set("hasManufacturing", v)} />
                <Toggle label="Involved in import or export of goods" icon="🚢"
                  checked={!!profile.hasImportExport} onChange={(v) => set("hasImportExport", v)} />
                <Toggle label="Has received foreign investment / FDI" icon="💱"
                  checked={!!profile.hasForeignInvestment} onChange={(v) => set("hasForeignInvestment", v)} />
                <Toggle label="Recognized startup (under 10 years, turnover below ₹100 Cr)" icon="🚀"
                  checked={!!profile.isStartup} onChange={(v) => set("isStartup", v)} />
                <Toggle label="Listed company (NSE / BSE)" icon="📈"
                  checked={!!profile.isListed} onChange={(v) => set("isListed", v)} />
                <Toggle label="Generates hazardous waste" icon="☢️"
                  checked={!!profile.hasHazardousWaste} onChange={(v) => set("hasHazardousWaste", v)} />
                <Toggle label="NBFC / financial company / lending business" icon="🏦"
                  checked={!!profile.isNBFC} onChange={(v) => set("isNBFC", v)} />
              </div>
            </div>
          )}

          {/* Navigation */}
          <div className="flex justify-between mt-8 pt-6 border-t border-gray-100">
            <button type="button" onClick={() => setStep((s) => Math.max(1, s - 1))} disabled={step === 1}
              className="px-5 py-2.5 text-sm font-medium text-gray-600 hover:text-gray-800 disabled:opacity-30 transition-colors">
              ← Back
            </button>
            <button type="button" onClick={handleNext} disabled={!canNext()}
              className="bg-blue-600 hover:bg-blue-700 disabled:opacity-40 disabled:cursor-not-allowed text-white font-bold px-8 py-3 rounded-xl transition-colors">
              {step === 5 ? "View My Compliance List →" : "Next →"}
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
