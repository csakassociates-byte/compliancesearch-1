"use client";
import { useRef, useState } from "react";
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
  const [results, setResults] = useState<Record<string, unknown>[]>([]);
  const [loading, setLoading] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout>>(null);

  function handleInput(val: string) {
    onChange(val);
    if (timer.current) clearTimeout(timer.current);
    if (val.length < 2) { setResults([]); return; }
    setLoading(true);
    timer.current = setTimeout(async () => {
      try {
        const res  = await fetch(`/api/companies/search?q=${encodeURIComponent(val)}`);
        const data = await res.json();
        setResults(Array.isArray(data) ? data : []);
      } catch { setResults([]); }
      setLoading(false);
    }, 300);
  }

  function handleSelect(company: Record<string, unknown>) {
    onChange(String(company.companyName || ""));
    onSelect(dbToCompanyData(company));
    setResults([]);
  }

  const hoverCls = accent === "amber" ? "hover:bg-amber-50" : "hover:bg-blue-50";
  const selTxtCls = accent === "amber" ? "text-amber-600" : "text-blue-500";

  const myCompanies  = results.filter(r => r._source === "my_companies");
  const mcaCompanies = results.filter(r => r._source === "mca");

  function renderCompanyRow(c: Record<string, unknown>, idx: number) {
    const activeDirs = ((c.directors || []) as Record<string, unknown>[]).filter(d => d.isActive);
    const isMyCompany = c._source === "my_companies";
    return (
      <button
        key={String(c.id || idx)}
        type="button"
        onMouseDown={() => handleSelect(c)}
        className={`w-full flex items-start gap-3 px-4 py-3 ${hoverCls} transition-colors text-left border-b border-slate-100 last:border-0`}
      >
        <div className={`w-9 h-9 rounded-xl flex items-center justify-center font-bold text-sm shrink-0 mt-0.5 ${
          isMyCompany
            ? "bg-blue-600 text-white"
            : accent === "amber" ? "bg-amber-100 text-amber-700" : "bg-slate-100 text-slate-600"
        }`}>
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
  }

  return (
    <div className="relative">
      <input
        className={className + " pr-8"}
        value={value}
        onChange={e => handleInput(e.target.value)}
        onBlur={() => setTimeout(() => setResults([]), 200)}
        placeholder={placeholder}
        autoComplete="off"
      />
      {loading && (
        <span className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 text-xs animate-pulse">⏳</span>
      )}

      {results.length > 0 && (
        <div className="absolute z-50 w-full mt-1 bg-white border border-slate-200 rounded-2xl shadow-xl overflow-hidden max-h-80 overflow-y-auto">
          {/* My Companies section */}
          {myCompanies.length > 0 && (
            <>
              <div className="px-4 py-2 bg-blue-50 border-b border-blue-100">
                <span className="text-xs font-bold text-blue-700 uppercase tracking-wider">📂 My Companies</span>
              </div>
              {myCompanies.map((c, i) => renderCompanyRow(c, i))}
            </>
          )}
          {/* MCA Database section */}
          {mcaCompanies.length > 0 && (
            <>
              <div className="px-4 py-2 bg-slate-50 border-b border-slate-100">
                <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">🏛️ MCA Database</span>
              </div>
              {mcaCompanies.map((c, i) => renderCompanyRow(c, myCompanies.length + i))}
            </>
          )}
        </div>
      )}
    </div>
  );
}
