"use client";
import { useRef, useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import Link from "next/link";
import type { CompanyData, DirectorData, ChargeData } from "@/lib/types/company";

function dbToCompanyData(c: Record<string, unknown>): CompanyData {
  return {
    cin:                String(c.cin         || ""),
    companyName:        String(c.companyName || ""),
    regAddress:         (c.regAddress         as string)  || undefined,
    entityType:         (c.entityType         as string)  || undefined,
    email:              (c.email              as string)  || undefined,
    rocName:            (c.rocName            as string)  || undefined,
    status:             (c.status             as string)  || undefined,
    isListed:           Boolean(c.isListed),
    incorporationDate:  (c.incorporationDate  as string)  || undefined,
    paidUpCapital:      (c.paidUpCapital      as string)  || undefined,
    authorisedCapital:  (c.authorisedCapital  as string)  || undefined,
    registrationNumber: (c.registrationNumber as string)  || undefined,
    dateOfLastAGM:      (c.dateOfLastAGM      as string)  || undefined,
    dateOfBalanceSheet: (c.dateOfBalanceSheet as string)  || undefined,
    categoryOfCompany:  (c.categoryOfCompany  as string)  || undefined,
    subcategory:        (c.subcategory        as string)  || undefined,
    classOfCompany:     (c.classOfCompany     as string)  || undefined,
    jurisdiction:       (c.jurisdiction       as string)  || undefined,
    smallCompany:       Boolean(c.smallCompany),
    mobile:             (c.mobile             as string)  || undefined,
    gstNumber:          (c.gstNumber          as string)  || undefined,
    sourceFile:         (c.sourceFile         as string)  || undefined,
    directors: ((c.directors || []) as Record<string, unknown>[]).map(d => ({
      din:         (d.din         as string) || undefined,
      name:        String(d.name || ""),
      designation: (d.designation as string) || undefined,
      category:    (d.category   as string) || undefined,
      appointedAt: (d.appointedAt as string) || undefined,
      ceasedAt:    (d.ceasedAt   as string) || undefined,
      isActive:    Boolean(d.isActive),
      isSig:       false,
    }) as DirectorData),
    charges: ((c.charges || []) as Record<string, unknown>[]).map(ch => ({
      chargeId:       (ch.chargeId       as string) || undefined,
      holderName:     String(ch.holderName || ""),
      dateOfCreation: (ch.dateOfCreation as string) || undefined,
      amount:         (ch.amount         as string) || undefined,
      address:        (ch.address        as string) || undefined,
      isSatisfied:    Boolean(ch.isSatisfied),
    }) as ChargeData),
  };
}

interface Props {
  value: string;
  onChange: (val: string) => void;
  onSelect: (company: CompanyData) => void;
  placeholder?: string;
  className?: string;
  accent?: "blue" | "amber";
}

export default function CompanySearch({
  value, onChange, onSelect,
  placeholder = "e.g. ABC Enterprises Private Limited",
  className = "",
  accent = "blue",
}: Props) {
  const { data: session, status: authStatus } = useSession();
  const [results, setResults]     = useState<Record<string, unknown>[]>([]);
  const [loading, setLoading]     = useState(false);
  const [showLoginPopup, setShowLoginPopup] = useState(false);
  const [userTyped, setUserTyped] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout>>(null);
  const prevValue = useRef(value);

  // When value changes externally (e.g. Excel auto-fill), clear dropdown
  useEffect(() => {
    if (prevValue.current !== value) {
      prevValue.current = value;
      setResults([]);
      setLoading(false);
      setUserTyped(false);
      if (timer.current) clearTimeout(timer.current);
    }
  }, [value]);

  function handleInput(val: string) {
    onChange(val);
    setUserTyped(true);
    prevValue.current = val; // prevent useEffect from clearing on this change
    if (timer.current) clearTimeout(timer.current);

    // Not logged in — show popup, no search
    if (authStatus !== "loading" && !session?.user) {
      if (val.length >= 1) setShowLoginPopup(true);
      setResults([]);
      return;
    }

    if (val.length < 2) { setResults([]); return; }
    setLoading(true);
    timer.current = setTimeout(async () => {
      try {
        const res  = await fetch(`/api/companies/search?q=${encodeURIComponent(val)}`);
        const data = await res.json();
        // Show only MY companies (not MCA database)
        const all = Array.isArray(data) ? data : [];
        setResults(all.filter(r => r._source === "my_companies"));
      } catch { setResults([]); }
      setLoading(false);
    }, 300);
  }

  function handleSelect(company: Record<string, unknown>) {
    onChange(String(company.companyName || ""));
    onSelect(dbToCompanyData(company));
    setResults([]);
  }

  const hoverCls  = accent === "amber" ? "hover:bg-amber-50"  : "hover:bg-blue-50";
  const selTxtCls = accent === "amber" ? "text-amber-600"     : "text-blue-600";
  const ringCls   = accent === "amber" ? "focus:ring-amber-400" : "focus:ring-blue-400";

  return (
    <>
      <div className="relative">
        <input
          className={className + " pr-8"}
          value={value}
          onChange={e => handleInput(e.target.value)}
          onFocus={() => {
            if (authStatus !== "loading" && !session?.user && value.length >= 1) {
              setShowLoginPopup(true);
            }
          }}
          onBlur={() => setTimeout(() => setResults([]), 200)}
          placeholder={placeholder}
          autoComplete="off"
        />
        {loading && (
          <span className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 text-xs animate-pulse">⏳</span>
        )}
        {!session?.user && authStatus !== "loading" && (
          <span className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-300 text-sm">🔒</span>
        )}

        {/* My Companies dropdown */}
        {results.length > 0 && session?.user && (
          <div className="absolute z-50 w-full mt-1 bg-white border border-slate-200 rounded-2xl shadow-xl overflow-hidden max-h-72 overflow-y-auto">
            <div className="px-4 py-2 bg-blue-50 border-b border-blue-100">
              <span className="text-xs font-bold text-blue-700 uppercase tracking-wider">📂 My Companies</span>
            </div>
            {results.map((c, i) => {
              const activeDirs = ((c.directors || []) as Record<string, unknown>[]).filter(d => d.isActive);
              return (
                <button
                  key={String(c.id || i)}
                  type="button"
                  onMouseDown={() => handleSelect(c)}
                  className={`w-full flex items-start gap-3 px-4 py-3 ${hoverCls} transition-colors text-left border-b border-slate-100 last:border-0`}
                >
                  <div className={`w-9 h-9 rounded-xl flex items-center justify-center font-bold text-sm shrink-0 mt-0.5 bg-blue-600 text-white`}>
                    {String(c.companyName || "C")[0]}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-slate-800 text-sm truncate">{String(c.companyName || "")}</p>
                    <p className="text-xs text-slate-400">{String(c.cin || "")}</p>
                    {activeDirs.length > 0 && (
                      <div className="flex gap-1 mt-1 flex-wrap">
                        {activeDirs.slice(0, 3).map((d, di) => (
                          <span key={di} className="text-xs bg-slate-100 text-slate-500 px-1.5 py-0.5 rounded-full">
                            {String(d.name || "")}
                          </span>
                        ))}
                        {activeDirs.length > 3 && (
                          <span className="text-xs text-slate-400">+{activeDirs.length - 3} more</span>
                        )}
                      </div>
                    )}
                  </div>
                  <span className={`text-xs font-semibold shrink-0 mt-1 ${selTxtCls}`}>Select →</span>
                </button>
              );
            })}
          </div>
        )}

        {/* No results found (logged in but no match) — only show when user actively typed */}
        {results.length === 0 && loading === false && session?.user && value.length >= 2 && userTyped && (
          <div className="absolute z-50 w-full mt-1 bg-white border border-slate-200 rounded-2xl shadow-md px-4 py-3">
            <p className="text-sm text-slate-500">No company found — <span className="text-slate-700 font-medium">enter name manually</span> or <Link href="/dashboard/clients" className="text-blue-600 underline">upload Excel</Link> to add companies.</p>
          </div>
        )}
      </div>

      {/* ── Login Popup ── */}
      {showLoginPopup && (
        <div
          className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/50 backdrop-blur-sm"
          onClick={() => setShowLoginPopup(false)}
        >
          <div
            className="bg-white rounded-3xl shadow-2xl p-8 mx-4 max-w-sm w-full text-center"
            onClick={e => e.stopPropagation()}
          >
            {/* Icon */}
            <div className="w-16 h-16 rounded-2xl mx-auto mb-4 flex items-center justify-center text-3xl"
              style={{ background: "linear-gradient(135deg,#1e40af,#1d4ed8)" }}>
              🏢
            </div>

            <h2 className="text-xl font-bold text-slate-800 mb-2">Login to Search Companies</h2>
            <p className="text-sm text-slate-500 mb-6">
              Company search sirf aapki apni uploaded companies dikhata hai.<br />
              Login karke apni companies access karein.
            </p>

            {/* Benefits */}
            <div className="bg-blue-50 rounded-2xl p-4 mb-6 text-left space-y-2">
              <p className="text-xs text-blue-700 font-semibold flex items-center gap-2">
                <span>✅</span> Excel se company upload karein — permanently save
              </p>
              <p className="text-xs text-blue-700 font-semibold flex items-center gap-2">
                <span>✅</span> Sabhi tools mein ek click mein company select
              </p>
              <p className="text-xs text-blue-700 font-semibold flex items-center gap-2">
                <span>✅</span> Documents save karein, download karein
              </p>
              <p className="text-xs text-blue-700 font-semibold flex items-center gap-2">
                <span>✅</span> Client management dashboard
              </p>
            </div>

            <div className="flex gap-3">
              <Link
                href="/auth/login"
                className="flex-1 py-3 rounded-xl font-bold text-white text-sm shadow-md text-center"
                style={{ background: "linear-gradient(135deg,#1e40af,#1d4ed8)" }}
              >
                Sign In →
              </Link>
              <Link
                href="/auth/signup"
                className="flex-1 py-3 rounded-xl font-bold text-sm border-2 border-blue-200 text-blue-700 hover:bg-blue-50 transition text-center"
              >
                Sign Up Free
              </Link>
            </div>

            <button
              onClick={() => setShowLoginPopup(false)}
              className="mt-4 text-xs text-slate-400 hover:text-slate-600 underline"
            >
              Continue without login (manual entry only)
            </button>
          </div>
        </div>
      )}
    </>
  );
}
