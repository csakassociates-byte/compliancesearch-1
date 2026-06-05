"use client";
import { useRef, useState } from "react";
import { parseCompanyExcel } from "@/lib/company-excel-parser";
import type { CompanyData } from "@/lib/types/company";

interface Props {
  onFill: (data: CompanyData) => void;
  /** "blue" (default) for Bank Resolution, "amber" for Share Certificate */
  accent?: "blue" | "amber";
  /** Extra label shown below the drop zone */
  note?: string;
}

export default function CompanyExcelUpload({ onFill, accent = "blue", note }: Props) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [status,   setStatus]   = useState<"idle" | "loading" | "done" | "error">("idle");
  const [warnings, setWarnings] = useState<string[]>([]);
  const [filled,   setFilled]   = useState<string[]>([]);

  const colors = accent === "amber"
    ? { border: "border-amber-200", bg: "bg-amber-50/50", hover: "hover:border-amber-400",
        doneBg: "bg-green-50", doneBorder: "border-green-300",
        errBg: "bg-red-50",   errBorder: "border-red-300",
        btn: "bg-amber-600", icon: "bg-amber-50" }
    : { border: "border-blue-200", bg: "bg-blue-50/50", hover: "hover:border-blue-400",
        doneBg: "bg-green-50", doneBorder: "border-green-300",
        errBg: "bg-red-50",   errBorder: "border-red-300",
        btn: "bg-blue-600", icon: "bg-white shadow-sm" };

  async function handleFile(file: File) {
    if (!file.name.match(/\.(xlsx|xls)$/i)) {
      setStatus("error");
      setWarnings(["Only .xlsx or .xls files are supported."]);
      return;
    }
    setStatus("loading");
    setWarnings([]);
    try {
      const { data, warnings: w } = await parseCompanyExcel(file);

      const filledFields: string[] = [];
      if (data.companyName)                                  filledFields.push("Company Name");
      if (data.cin)                                          filledFields.push("CIN");
      if (data.regAddress)                                   filledFields.push("Registered Address");
      if (data.incorporationDate)                            filledFields.push("Incorporation Date");
      if (data.paidUpCapital)                                filledFields.push("Paid-up Capital");
      if (data.charges?.[0]?.holderName)                     filledFields.push("Bank Name");
      const activeDirs = data.directors.filter(d => d.isActive);
      const sigDirs    = activeDirs.filter(d => d.isSig);
      if (activeDirs.length) filledFields.push(`${activeDirs.length} Director(s)`);
      if (sigDirs.length)    filledFields.push(`${sigDirs.length} Signatory(ies)`);

      onFill(data);
      setFilled(filledFields);
      setWarnings(w);
      setStatus("done");
    } catch {
      setStatus("error");
      setWarnings(["Could not read the file. Make sure it is a valid MDS Excel export."]);
    }
  }

  const borderCls =
    status === "done"  ? `border-green-300 ${colors.doneBg}` :
    status === "error" ? `border-red-300   ${colors.errBg}`  :
    `${colors.border} ${colors.bg} ${colors.hover}`;

  return (
    <div className="mb-6 print:hidden">
      <div
        className={`relative rounded-2xl border-2 border-dashed transition-all cursor-pointer ${borderCls}`}
        onClick={() => inputRef.current?.click()}
        onDragOver={e => e.preventDefault()}
        onDrop={e => { e.preventDefault(); const f = e.dataTransfer.files[0]; if (f) handleFile(f); }}
      >
        <input
          ref={inputRef} type="file" accept=".xlsx,.xls" className="hidden"
          onChange={e => { const f = e.target.files?.[0]; if (f) handleFile(f); e.target.value = ""; }}
        />

        <div className="px-5 py-4 flex items-start gap-4">
          <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-2xl shrink-0 ${
            status === "done" ? "bg-green-100" : status === "error" ? "bg-red-100" : colors.icon
          }`}>
            {status === "loading" ? "⏳" : status === "done" ? "✅" : status === "error" ? "❌" : "📊"}
          </div>

          <div className="flex-1 min-w-0">
            {status === "idle" && (
              <>
                <p className="font-bold text-slate-800 text-sm">Upload MDS Excel — Auto-fill Form</p>
                <p className="text-xs text-slate-500 mt-0.5">
                  Upload your MCA Master Data Sheet (.xlsx) — Company details, Directors &amp; Signatories will be filled automatically.
                </p>
                <p className={`text-xs font-semibold mt-1.5 ${accent === "amber" ? "text-amber-600" : "text-blue-500"}`}>
                  Click to browse or drag &amp; drop here
                </p>
              </>
            )}
            {status === "loading" && (
              <p className="font-bold text-blue-700 text-sm mt-2">Reading Excel file…</p>
            )}
            {status === "done" && (
              <div>
                <p className="font-bold text-green-700 text-sm">Auto-filled successfully!</p>
                <div className="flex flex-wrap gap-1.5 mt-1.5">
                  {filled.map(f => (
                    <span key={f} className="text-xs bg-green-100 text-green-700 border border-green-200 px-2 py-0.5 rounded-full font-medium">
                      ✓ {f}
                    </span>
                  ))}
                </div>
                <button
                  type="button"
                  onClick={e => { e.stopPropagation(); setStatus("idle"); setFilled([]); setWarnings([]); }}
                  className="text-xs text-slate-400 hover:text-slate-600 mt-1.5 underline"
                >
                  Upload a different file
                </button>
              </div>
            )}
            {status === "error" && (
              <div>
                <p className="font-bold text-red-700 text-sm">Upload failed</p>
                <p className="text-xs text-red-500 mt-0.5">{warnings[0]}</p>
                <button
                  type="button"
                  onClick={e => { e.stopPropagation(); setStatus("idle"); setWarnings([]); }}
                  className="text-xs text-red-500 hover:text-red-700 mt-1 underline"
                >
                  Try again
                </button>
              </div>
            )}
          </div>

          {status === "idle" && (
            <span className={`text-xs font-bold px-3 py-1 rounded-full text-white shrink-0 self-center ${colors.btn}`}>
              Upload
            </span>
          )}
        </div>

        {warnings.length > 0 && status === "done" && (
          <div className="px-5 pb-3">
            {warnings.map((w, i) => (
              <p key={i} className="text-xs text-amber-600 flex items-center gap-1">
                <span>⚠️</span> {w}
              </p>
            ))}
          </div>
        )}
      </div>

      <p className="text-xs text-slate-400 mt-1.5 text-center">
        {note || "Remaining fields fill karne honge manually."}
      </p>
    </div>
  );
}
