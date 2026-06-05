"use client";
import { useState, useMemo, useRef, useEffect } from "react";
import Link from "next/link";
import Navbar from "@/components/Navbar";
import CompanyExcelUpload from "@/components/CompanyExcelUpload";
import CompanySearch from "@/components/CompanySearch";
import type { CompanyData } from "@/lib/types/company";

/* ══════════════════════════════════════════════════════════════════
   TYPES
══════════════════════════════════════════════════════════════════ */
interface Director    { name: string; designation: string }
interface Signatory   { name: string; designation: string; dinPan: string }
interface CertPerson  { name: string; desig: string; din: string }
interface DirectorInfo{ name: string; designation: string; din: string }

interface F {
  // Step 1 — Company
  companyName: string; cin: string; regAddress: string; entityType: string;
  // Step 2 — Bank
  bankName: string; branchName: string; city: string; accountType: string; ifscCode: string;
  // Step 3 — Meeting
  meetingDate: string; meetingTime: string; meetingVenue: string;
  directors: Director[];
  // Step 4 — Signatories
  signatories: Signatory[];
  signingMode: string;
  // Step 5 — Certification (multiple)
  certPersons: CertPerson[];
  certDate: string; certPlace: string;
  // Letterhead fields (entered per session, NOT auto-filled)
  printOnLetterhead: boolean;
  printMobile: string;
  printEmail: string;
  printGst: string;
  // legacy compat
  certName: string; certDesig: string;
}

const BLANK_DIR:  Director  = { name:"", designation:"" };
const BLANK_SIG:  Signatory = { name:"", designation:"", dinPan:"" };

const DEFAULT: F = {
  companyName:"", cin:"", regAddress:"", entityType:"pvt_ltd",
  bankName:"", branchName:"", city:"", accountType:"current", ifscCode:"",
  meetingDate:"", meetingTime:"", meetingVenue:"",
  directors:[ { ...BLANK_DIR }, { ...BLANK_DIR } ],
  signatories:[ { ...BLANK_SIG }, { ...BLANK_SIG } ],
  signingMode:"singly",
  certPersons:[ { name:"", desig:"Director", din:"" }, { name:"", desig:"Director", din:"" } ],
  certDate:"", certPlace:"",
  printOnLetterhead: true, printMobile:"", printEmail:"", printGst:"",
  certName:"", certDesig:"Director",
};

// Companies Act designation hierarchy (lower index = higher rank)
const DESIG_HIERARCHY = [
  "Managing Director",
  "Whole-time Director",
  "Whole-Time Director",
  "Executive Director",
  "Director",
  "Company Secretary",
  "Chief Executive Officer",
  "Chief Financial Officer",
  "CEO",
  "CFO",
];

function desigRank(desig: string): number {
  const d = (desig || "").trim();
  const idx = DESIG_HIERARCHY.findIndex(h => h.toLowerCase() === d.toLowerCase());
  return idx === -1 ? 99 : idx;
}

const ENTITY_LABELS: Record<string,string> = {
  pvt_ltd:"Private Limited Company", opc:"One Person Company",
  public_ltd:"Public Limited Company", llp:"Limited Liability Partnership",
  section8:"Section 8 Company (NGO)", nidhi:"Nidhi Company", other:"Company",
};

const ACCOUNT_LABELS: Record<string,string> = {
  current:"Current Account", savings:"Savings Account",
  cc:"Cash Credit Account", od:"Overdraft Account",
};

/* ══════════════════════════════════════════════════════════════════
   DOCUMENT GENERATOR
══════════════════════════════════════════════════════════════════ */
function fmtDate(d: string) {
  if (!d) return "__________";
  try {
    return new Date(d).toLocaleDateString("en-IN",{ day:"numeric", month:"long", year:"numeric" });
  } catch { return d; }
}

function ordinal(n: number) {
  const s = ["th","st","nd","rd"], v = n % 100;
  return n + (s[(v-20)%10] || s[v] || s[0]);
}

function generateDoc(f: F): { meta: Record<string,string>; body: string[] } {
  const entity      = ENTITY_LABELS[f.entityType] || "Company";
  const accountType = ACCOUNT_LABELS[f.accountType] || "Current Account";
  const activeSigs  = f.signatories.filter(s => s.name.trim());
  const activeDir   = f.directors.filter(d => d.name.trim());

  const sigAuthLine = activeSigs.map((s, i) => {
    const dinPan = s.dinPan.trim() ? ` (DIN/PAN: ${s.dinPan.trim()})` : "";
    return `Shri/Ms. ${s.name.trim()}, ${s.designation.trim() || "Director"}${dinPan}`;
  });

  let sigMode = "";
  if (f.signingMode === "singly")         sigMode = "severally (singly)";
  else if (f.signingMode === "joint_any_two") sigMode = "jointly (any two of the above)";
  else                                     sigMode = "jointly (all of the above)";

  const dirList = activeDir.length
    ? activeDir.map((d, i) => `${i+1}.  ${d.name.trim() || "___________"}, ${d.designation.trim() || "Director"}`).join("\n")
    : "1.  ___________,  Director\n2.  ___________,  Director";

  const sigBlock = sigAuthLine.length
    ? sigAuthLine.map((s,i) => `${i+1}.  ${s}`).join("\n")
    : "1.  ___________, Director\n2.  ___________, Director";

  const branchFull  = [f.branchName, f.city].filter(Boolean).join(", ") || "___________";
  const ifscLine    = f.ifscCode.trim() ? ` (IFSC: ${f.ifscCode.trim()})` : "";

  const meta: Record<string,string> = {
    companyName: f.companyName.trim() || "[COMPANY NAME]",
    cin:         f.cin.trim()         || "U_______________",
    regAddress:  f.regAddress.trim()  || "[REGISTERED OFFICE ADDRESS]",
    entity,
    meetingDate: fmtDate(f.meetingDate),
    meetingTime: f.meetingTime || "___:___ [AM/PM]",
    meetingVenue: f.meetingVenue.trim() || "[VENUE OF MEETING]",
    bankName:    f.bankName.trim()    || "[BANK NAME]",
    branchFull,
    accountType,
    ifscLine,
    certName:    (f.certPersons?.[0]?.name || f.certName).trim()   || "___________",
    certDesig:   (f.certPersons?.[0]?.desig || f.certDesig).trim() || "Director",
    certDate:    fmtDate(f.certDate),
    certPlace:   f.certPlace.trim()   || "___________",
  };

  const body = [
    /* ─ Resolved 1 – Account Opening ─ */
    `"RESOLVED THAT pursuant to Section 179(3)(d) of the Companies Act, 2013 read with Rule 8 of the Companies (Meetings of Board and its Powers) Rules, 2014, and in accordance with the Articles of Association of the Company, the consent of the Board of Directors be and is hereby accorded to open and maintain a ${accountType} in the name of the Company, namely '${meta.companyName}', with ${meta.bankName}, ${branchFull}${ifscLine}."`,

    /* ─ Resolved 2 – Authorised Signatories ─ */
    `"RESOLVED FURTHER THAT the following person(s) be and are hereby authorised to operate the said Bank Account ${sigMode} on behalf of the Company:\n\n${sigBlock}\n\nand that the Bank is hereby authorised to honour all such instructions, cheques, drafts, orders, pay orders and other negotiable instruments signed by the authorised signatory(ies) in accordance with the above authority."`,

    /* ─ Resolved 3 – Specific Powers ─ */
    `"RESOLVED FURTHER THAT the authorised signatory(ies) named above be and are hereby specifically authorised to:\n\n(a) Deposit, withdraw money and issue instructions in relation to the said Bank Account;\n(b) Draw, sign, accept and endorse cheques, demand drafts, pay orders, banker's cheques and all other negotiable instruments;\n(c) Instruct the Bank for NEFT, RTGS, IMPS, UPI and any other electronic mode of payment or receipt;\n(d) Execute all applications, forms, mandates, indemnities, agreements and such other documents as may be required by the Bank from time to time;\n(e) Do all such acts, deeds and things as may be necessary, expedient or incidental for the purpose of operating the said Bank Account."`,

    /* ─ Resolved 4 – Seal & Specimen Signatures ─ */
    `"RESOLVED FURTHER THAT the specimen signatures of the above-named authorised signatory(ies) be provided to the Bank for its records, and the Company's Common Seal (if applicable) be affixed on such documents as may be required by the Bank, in the presence of the authorised signatory(ies)."`,

    /* ─ Resolved 5 – Certification Authority ─ */
    `"RESOLVED FURTHER THAT ${meta.certName}, ${meta.certDesig} of the Company, be and is hereby authorised to certify a true copy of this Resolution for the purpose of submission to ${meta.bankName} and for any other purpose as may be necessary."`,
  ];

  return { meta, body };
}

/* ══════════════════════════════════════════════════════════════════
   PRINT STYLES  (injected once)
══════════════════════════════════════════════════════════════════ */
const PRINT_CSS = `
@page { size: A4; margin: 14mm 16mm 14mm 16mm; }
@media print {
  body * { visibility: hidden !important; }
  #resolution-doc, #resolution-doc * { visibility: visible !important; }
  #resolution-doc {
    position: absolute !important;
    top: 0 !important; left: 0 !important;
    width: 100% !important;
    margin: 0 !important; padding: 0 !important;
    font-family: "Times New Roman", Times, serif !important;
    font-size: 10.5pt !important;
    line-height: 1.35 !important;
    color: #000 !important;
    background: #fff !important;
    -webkit-print-color-adjust: exact !important;
    print-color-adjust: exact !important;
  }
}
`;

/* ══════════════════════════════════════════════════════════════════
   UI HELPERS
══════════════════════════════════════════════════════════════════ */
const INP = "w-full border border-slate-300 rounded-xl px-3 py-2.5 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-300 bg-white";
const SEL = "w-full border border-slate-300 rounded-xl px-3 py-2.5 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-300 bg-white";

function Lbl({ c, h }: { c: React.ReactNode; h?: string }) {
  return (
    <div className="mb-1">
      <p className="text-sm font-semibold text-slate-700">{c}</p>
      {h && <p className="text-xs text-slate-400">{h}</p>}
    </div>
  );
}

function SHead({ n, title, sub }: { n: number; title: string; sub: string }) {
  return (
    <div className="mb-5">
      <div className="flex items-center gap-3 mb-1">
        <span className="w-8 h-8 rounded-full bg-blue-600 text-white flex items-center justify-center font-extrabold text-sm shrink-0">{n}</span>
        <h2 className="text-xl font-extrabold text-slate-900">{title}</h2>
      </div>
      <p className="text-slate-500 text-sm ml-11">{sub}</p>
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════════
   DOCUMENT PREVIEW COMPONENT
══════════════════════════════════════════════════════════════════ */
/* ══════════════════════════════════════════════════════════════════
   PDF DOWNLOAD — opens clean print window
══════════════════════════════════════════════════════════════════ */
function downloadResolutionPDF(companyName: string) {
  const el = document.getElementById("resolution-doc");
  if (!el) return;

  const html = el.innerHTML;
  const title = `Board_Resolution_${companyName.replace(/\s+/g,"_").slice(0,30) || "Company"}`;

  const win = window.open("", "_blank");
  if (!win) { alert("Pop-up blocked. Please allow pop-ups for this site."); return; }

  win.document.write(`<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8"/>
  <title>${title}</title>
  <style>
    @page { size: A4; margin: 14mm 16mm; }
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      font-family: "Times New Roman", Times, serif;
      font-size: 10.5pt;
      line-height: 1.35;
      color: #000;
      background: #fff;
    }
    strong, b { font-weight: bold; }
    p { margin-bottom: 4px; }
  </style>
</head>
<body>${html}</body>
</html>`);
  win.document.close();
  win.focus();

  // Small delay so content renders, then print
  setTimeout(() => {
    win.print();
    // Close after print dialog closes (or after 3s fallback)
    win.onafterprint = () => win.close();
    setTimeout(() => { try { win.close(); } catch(_) {} }, 4000);
  }, 400);
}

function DocPreview({ f, presentDirs }: { f: F; presentDirs?: Director[] }) {
  const fWithPresent = presentDirs ? { ...f, directors: presentDirs } : f;
  const { meta, body } = useMemo(() => generateDoc(fWithPresent), [fWithPresent]);
  const activeDir = fWithPresent.directors.filter(d => d.name.trim());

  return (
    <div id="resolution-print-root">
    <div id="resolution-doc" className="bg-white font-serif leading-snug text-gray-900"
      style={{ fontFamily:'"Times New Roman", Times, serif', fontSize:"10.5pt", color:"#000", lineHeight:"1.35" }}>

      {/* ── Letterhead ── */}
      {f.printOnLetterhead && (
        <div style={{ borderBottom:"2px solid #000", paddingBottom:"4px", marginBottom:"6px", textAlign:"center" }}>
          <p style={{ fontWeight:"900", fontSize:"13pt", textTransform:"uppercase", letterSpacing:"1px" }}>{meta.companyName}</p>
          <p style={{ fontSize:"8.5pt", marginTop:"2px" }}>
            <strong>CIN:</strong> {meta.cin}
          </p>
          <p style={{ fontSize:"8.5pt" }}><strong>Reg. Office:</strong> {meta.regAddress}</p>
          <div style={{ display:"flex", justifyContent:"center", gap:"24px", flexWrap:"wrap", fontSize:"8.5pt", marginTop:"2px" }}>
            {f.printMobile && <span><strong>Mobile:</strong> {f.printMobile}</span>}
            {f.printEmail  && <span><strong>Email:</strong> {f.printEmail}</span>}
            {f.printGst    && <span><strong>GST:</strong> {f.printGst}</span>}
          </div>
        </div>
      )}

      {/* Header — continuous single paragraph */}
      <div style={{ textAlign:"center", marginBottom:"6px" }}>
        <p style={{ fontWeight:"bold", fontSize:"10.5pt", textTransform:"uppercase", letterSpacing:"0.3px", lineHeight:"1.4" }}>
          Certified True Copy of Resolution Passed at the Meeting of Board of Directors of
          {!f.printOnLetterhead && (
            <> <span style={{ textDecoration:"underline" }}>{meta.companyName}</span> ({meta.entity})</>
          )}
        </p>
      </div>

      {/* Company Info Box */}
      <div style={{ border:"1px solid #555", borderRadius:"3px", padding:"4px 8px", marginBottom:"6px", fontSize:"8.5pt" }}>
        <p><strong>CIN / Registration No.:</strong> {meta.cin}</p>
        <p><strong>Registered Office:</strong> {meta.regAddress}</p>
      </div>

      {/* Meeting Details */}
      <div style={{ marginBottom:"5px", fontSize:"8.5pt" }}>
        <p><strong>Date of Board Meeting:</strong> {meta.meetingDate} &nbsp;|&nbsp; <strong>Time:</strong> {meta.meetingTime}</p>
        <p><strong>Venue:</strong> {meta.meetingVenue}</p>
      </div>

      {/* Directors Present */}
      <div style={{ marginBottom:"4px", fontSize:"8.5pt" }}>
        <strong>Directors Present:</strong>{" "}
        {activeDir.length > 0
          ? activeDir.map((d, i) => `${i+1}. ${d.name}, ${d.designation || "Director"}`).join(";  ")
          : "1. ___________, Director;  2. ___________, Director"}
      </div>

      {/* Quorum */}
      <p style={{ fontSize:"8.5pt", marginBottom:"5px" }}><strong>Quorum:</strong> Present and Fulfilled</p>

      {/* Divider */}
      <div style={{ borderTop:"1.5px solid #333", margin:"6px 0" }} />

      {/* Resolution Header */}
      <p style={{ fontWeight:"bold", fontSize:"10pt", textAlign:"center", marginBottom:"6px", textTransform:"uppercase", letterSpacing:"0.3px" }}>
        Resolution No. __/__/{new Date().getFullYear()} — Opening of Bank Account
      </p>

      {/* Resolved Clauses — compact paragraphs */}
      <div style={{ fontSize:"9pt", textAlign:"justify" }}>
        {body.map((clause, i) => (
          <p key={i} style={{ marginBottom:"5px", lineHeight:"1.4" }}>{clause}</p>
        ))}
      </div>

      {/* Divider */}
      <div style={{ borderTop:"1px solid #888", margin:"6px 0" }} />

      {/* Certification Block */}
      <div style={{ fontSize:"8.5pt" }}>
        <p style={{ fontWeight:"bold", marginBottom:"4px" }}>Certified True Copy</p>
        <div style={{ display:"flex", gap:"16px", flexWrap:"wrap", marginBottom:"4px" }}>
          {(f.certPersons && f.certPersons.some(cp => cp.name)
            ? f.certPersons.filter(cp => cp.name && cp.name !== "__manual__")
            : [{ name: meta.certName, desig: meta.certDesig, din: "" }]
          ).map((cp, i) => (
            <div key={i} style={{ flex:"1", minWidth:"140px" }}>
              <div style={{ borderBottom:"1px solid #777", minHeight:"36px", marginBottom:"3px" }} />
              <p><strong>Name:</strong> {cp.name}</p>
              <p><strong>Designation:</strong> {cp.desig}</p>
              {cp.din && <p><strong>DIN:</strong> {cp.din}</p>}
            </div>
          ))}
          <div style={{ width:"70px", height:"55px", border:"1.5px solid #888", display:"flex", alignItems:"center", justifyContent:"center", fontSize:"7.5pt", color:"#999", textAlign:"center", flexShrink:0 }}>
            Company<br/>Seal
          </div>
        </div>
        <p><strong>Date:</strong> {meta.certDate} &nbsp;&nbsp; <strong>Place:</strong> {meta.certPlace}</p>
      </div>

      {/* Disclaimer (screen only) */}
      <p className="print:hidden" style={{ color:"#aaa", fontSize:"7.5pt", marginTop:"12px", borderTop:"1px solid #eee", paddingTop:"6px" }}>
        Generated by ComplianceSearch.in — Computer-generated document. Review before submitting. Consult CA/CS if required.
      </p>
    </div>
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════════
   MAIN PAGE
══════════════════════════════════════════════════════════════════ */

export default function BankResolutionPage() {
  const [f, setF]         = useState<F>(DEFAULT);
  const [step, setStep]   = useState<1|2|3|4|5|6>(1);
  const [preview, setPreview] = useState(false);

  const set = (k: keyof F, v: unknown) => setF(p => ({ ...p, [k]: v }));

  // Load bank list as soon as Step 2 is reached
  useEffect(() => {
    if (step === 2 && !bankListLoaded) {
      fetch("/api/ifsc/banks")
        .then(r => r.json())
        .then(data => { setBankList(Array.isArray(data) ? data : []); setBankListLoaded(true); })
        .catch(() => setBankListLoaded(true));
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [step]);

  // Registry: directors with DIN (for dropdown auto-fill)
  const [dirRegistry, setDirRegistry] = useState<DirectorInfo[]>([]);

  function handleExcelFill(data: CompanyData) {
    const activeDirs = data.directors.filter(d => d.isActive);
    const sigDirs    = activeDirs.filter(d => d.isSig);

    const directors: Director[] = activeDirs.slice(0, 8).map(d => ({
      name: d.name, designation: d.designation || "Director",
    }));
    const signatories: Signatory[] = (sigDirs.length > 0 ? sigDirs : activeDirs).slice(0, 3).map(d => ({
      name: d.name, designation: d.designation || "Director", dinPan: d.din || "",
    }));

    const sorted = [...activeDirs].sort((a, b) => desigRank(a.designation || "") - desigRank(b.designation || ""));
    let certPersons: CertPerson[] = sorted.slice(0, 2).map(d => ({
      name: d.name, desig: d.designation || "Director", din: d.din || "",
    }));
    while (certPersons.length < 2) certPersons.push({ name: "", desig: "Director", din: "" });

    setDirRegistry(activeDirs.map(d => ({
      name: d.name, designation: d.designation || "Director", din: d.din || "",
    })));

    const bankName = data.charges?.[0]?.holderName || "";

    setF(p => ({
      ...p,
      ...(data.companyName && { companyName: data.companyName }),
      ...(data.cin         && { cin:         data.cin         }),
      ...(data.regAddress  && { regAddress:  data.regAddress  }),
      ...(data.entityType  && { entityType:  data.entityType  }),
      ...(bankName         && { bankName                      }),
      directors:   directors.length   > 0 ? directors   : p.directors,
      signatories: signatories.length > 0 ? signatories : p.signatories,
      certPersons,
    }));
  }

  function setDir(i: number, k: keyof Director, v: string) {
    const dirs = [...f.directors]; dirs[i] = { ...dirs[i], [k]: v }; set("directors", dirs);
  }
  function setSig(i: number, k: keyof Signatory, v: string) {
    const sigs = [...f.signatories]; sigs[i] = { ...sigs[i], [k]: v }; set("signatories", sigs);
  }
  function addDir()  { if (f.directors.length  < 8) set("directors",  [...f.directors,  { ...BLANK_DIR }]); }
  function addSig()  { if (f.signatories.length < 3) set("signatories",[...f.signatories,{ ...BLANK_SIG }]); }
  function remDir(i: number) { set("directors",  f.directors.filter((_,x) => x !== i)); }
  function remSig(i: number) { set("signatories",f.signatories.filter((_,x) => x !== i)); }

  const TOTAL = 5;


  /* ─ STEP 1: Company ─ */
  const s1 = (
    <div className="space-y-4">
      <SHead n={1} title="Company Details" sub="Enter your company's basic information" />

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {/* Company Name — search from saved DB */}
        <div className="sm:col-span-2">
          <Lbl c="Company Name *" h="Type to search saved companies, or enter manually"/>
          <CompanySearch
            value={f.companyName}
            onChange={val => set("companyName", val)}
            onSelect={handleExcelFill}
            placeholder="e.g. ABC Enterprises Private Limited"
            className={INP}
            accent="blue"
          />
        </div>
        <div>
          <Lbl c="CIN / Registration No. *" h="21-digit Corporate Identification Number"/>
          <input className={INP} value={f.cin} onChange={e=>set("cin",e.target.value)} placeholder="e.g. U74999MH2020PTC123456"/>
        </div>
        <div>
          <Lbl c="Entity Type"/>
          <select className={SEL} value={f.entityType} onChange={e=>set("entityType",e.target.value)}>
            <option value="pvt_ltd">Private Limited Company</option>
            <option value="opc">One Person Company (OPC)</option>
            <option value="public_ltd">Public Limited Company</option>
            <option value="llp">LLP</option>
            <option value="section8">Section 8 Company (NGO)</option>
            <option value="nidhi">Nidhi Company</option>
            <option value="other">Other</option>
          </select>
        </div>
        <div className="sm:col-span-2">
          <Lbl c="Registered Office Address *" h="Complete address as per MCA records"/>
          <textarea className={`${INP} h-20 resize-none`} value={f.regAddress} onChange={e=>set("regAddress",e.target.value)} placeholder="e.g. 101, Business Tower, Andheri East, Mumbai – 400 069, Maharashtra"/>
        </div>
      </div>
    </div>
  );

  /* ─ STEP 2: Bank ─ */
  const [ifscStatus, setIfscStatus] = useState<"idle"|"loading"|"found"|"error">("idle");
  const [ifscData,   setIfscData]   = useState<{ bank: string; branch: string; city: string; address: string } | null>(null);

  // Find-IFSC panel state
  const [findOpen,      setFindOpen]      = useState(false);
  const [bankList,      setBankList]      = useState<string[]>([]);
  const [bankListLoaded,setBankListLoaded] = useState(false);
  const [selBank,       setSelBank]       = useState("");
  const [bankSearch,    setBankSearch]    = useState("");
  const [branchQ,       setBranchQ]       = useState("");
  const [branchResults, setBranchResults] = useState<{ ifsc:string; branch:string; city:string; district:string; state:string; address:string }[]>([]);
  const [branchLoading, setBranchLoading] = useState(false);
  const branchTimer = useRef<ReturnType<typeof setTimeout>>(null);

  function openFindPanel() {
    setFindOpen(true);
    // Pre-fill bank search from already-entered bank name
    if (f.bankName && !bankSearch) setBankSearch(f.bankName);
  }

  function handleBranchSearch(val: string) {
    setBranchQ(val);
    if (branchTimer.current) clearTimeout(branchTimer.current);
    if (!selBank || val.length < 2) { setBranchResults([]); return; }
    setBranchLoading(true);
    branchTimer.current = setTimeout(async () => {
      try {
        const res  = await fetch(`/api/ifsc/search?bank=${encodeURIComponent(selBank)}&q=${encodeURIComponent(val)}`);
        const data = await res.json();
        setBranchResults(Array.isArray(data) ? data : []);
      } catch { setBranchResults([]); }
      setBranchLoading(false);
    }, 350);
  }

  function selectBranch(row: { ifsc:string; branch:string; city:string; district:string; state:string; address:string }) {
    setF(p => ({
      ...p,
      ifscCode:   row.ifsc,
      bankName:   selBank,
      branchName: row.branch,
      city:       row.city || row.district,
    }));
    setIfscData({ bank: selBank, branch: row.branch, city: row.city || row.district, address: row.address || "" });
    setIfscStatus("found");
    setFindOpen(false);
    setBranchQ(""); setBranchResults([]); setSelBank(""); setBankSearch("");
  }

  // Show dropdown only when typing AND not yet selected
  const showBankDropdown = bankSearch.length > 0 && bankSearch !== selBank;
  const filteredBanks = showBankDropdown
    ? bankList.filter(b => b.toLowerCase().includes(bankSearch.toLowerCase())).slice(0, 8)
    : [];

  async function fetchIfsc(code: string) {
    const clean = code.trim().toUpperCase();
    if (clean.length !== 11) { setIfscStatus("idle"); setIfscData(null); return; }
    setIfscStatus("loading");
    try {
      const res  = await fetch(`https://ifsc.razorpay.com/${clean}`);
      if (!res.ok) throw new Error("not found");
      const json = await res.json();
      const info = {
        bank:    json.BANK    || "",
        branch:  json.BRANCH  || "",
        city:    json.CITY    || json.DISTRICT || "",
        address: json.ADDRESS || "",
      };
      setIfscData(info);
      setIfscStatus("found");
      // Auto-fill bank, branch, city
      setF(p => ({
        ...p,
        bankName:   info.bank   || p.bankName,
        branchName: info.branch || p.branchName,
        city:       info.city   || p.city,
      }));
    } catch {
      setIfscStatus("error");
      setIfscData(null);
    }
  }

  const s2 = (
    <div className="space-y-4">
      <SHead n={2} title="Bank Details" sub="Details of the bank where account is being opened" />
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">

        {/* IFSC — moved to top so it can auto-fill below fields */}
        <div className="sm:col-span-2">
          <Lbl c="IFSC Code" h="Enter 11-digit IFSC — Bank name, Branch & City will auto-fill"/>
          <div className="relative">
            <input
              className={`${INP} pr-28 font-mono tracking-widest`}
              value={f.ifscCode}
              maxLength={11}
              onChange={e => {
                const val = e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, "");
                set("ifscCode", val);
                fetchIfsc(val);
              }}
              placeholder="e.g. SBIN0001234"
            />
            <span className={`absolute right-3 top-1/2 -translate-y-1/2 text-xs font-semibold px-2 py-0.5 rounded-full ${
              ifscStatus === "loading" ? "text-blue-500 animate-pulse" :
              ifscStatus === "found"   ? "text-green-600 bg-green-50 border border-green-200" :
              ifscStatus === "error"   ? "text-red-500 bg-red-50 border border-red-200" :
              "text-slate-300"
            }`}>
              {ifscStatus === "loading" ? "⏳ Looking up…" :
               ifscStatus === "found"   ? "✓ Auto-filled" :
               ifscStatus === "error"   ? "✗ Not found" :
               `${f.ifscCode.length}/11`}
            </span>
          </div>

          {/* IFSC detail card */}
          {ifscStatus === "found" && ifscData && (
            <div className="mt-2 bg-green-50 border border-green-200 rounded-xl px-4 py-3 flex items-start gap-3">
              <span className="text-xl shrink-0">🏦</span>
              <div className="text-xs text-green-800 space-y-0.5">
                <p className="font-bold text-sm text-green-900">{ifscData.bank}</p>
                <p>{ifscData.branch} Branch — {ifscData.city}</p>
                {ifscData.address && <p className="text-green-600">{ifscData.address}</p>}
              </div>
            </div>
          )}
          {ifscStatus === "error" && (
            <p className="mt-1 text-xs text-red-500">Invalid IFSC or bank not found. Fill details manually below.</p>
          )}

          {/* Find IFSC trigger */}
          <button type="button" onClick={openFindPanel}
            className="mt-2 inline-flex items-center gap-1.5 text-xs font-semibold text-blue-600 hover:text-blue-800 transition">
            🔍 Don't know IFSC? Find by Bank &amp; Branch/City
          </button>

          {/* ── Find IFSC Panel ── */}
          {findOpen && (
            <div className="mt-3 bg-slate-50 border-2 border-blue-200 rounded-2xl p-4 space-y-3">
              <div className="flex items-center justify-between">
                <p className="font-bold text-slate-800 text-sm">🏦 Find IFSC by Bank &amp; Branch</p>
                <button type="button" onClick={() => setFindOpen(false)}
                  className="text-slate-400 hover:text-slate-700 text-lg leading-none">✕</button>
              </div>

              {/* Step A: Select Bank — Autocomplete */}
              <div>
                <p className="text-xs font-semibold text-slate-600 mb-1.5">
                  Step 1 — Select Bank
                  {selBank && <span className="ml-2 text-green-600 font-bold">✓ {selBank}</span>}
                </p>
                <div className="relative">
                  <input
                    className={INP + " pr-8"}
                    value={bankSearch}
                    onChange={e => {
                      setBankSearch(e.target.value);
                      // Clear selection if user modifies
                      if (selBank && e.target.value !== selBank) setSelBank("");
                    }}
                    placeholder="Type bank name… SBI, HDFC, ICICI, Axis…"
                    autoFocus
                  />
                  {!bankListLoaded && (
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-slate-400 animate-pulse">⏳</span>
                  )}
                  {selBank && (
                    <button type="button"
                      onClick={() => { setSelBank(""); setBankSearch(""); setBranchResults([]); setBranchQ(""); }}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-red-500 text-sm">✕</button>
                  )}

                  {/* Instant dropdown */}
                  {showBankDropdown && (
                    <div className="absolute z-50 w-full mt-1 bg-white border border-blue-200 rounded-xl shadow-xl overflow-hidden">
                      {!bankListLoaded ? (
                        <p className="px-3 py-2.5 text-xs text-slate-400 animate-pulse">⏳ Loading bank list…</p>
                      ) : filteredBanks.length > 0 ? filteredBanks.map(b => (
                        <button key={b} type="button"
                          onMouseDown={() => { setSelBank(b); setBankSearch(b); setBranchResults([]); setBranchQ(""); }}
                          className="w-full text-left px-3 py-2.5 text-sm hover:bg-blue-50 hover:text-blue-700 border-b border-slate-100 last:border-0 transition font-medium text-slate-700">
                          🏦 {b}
                        </button>
                      )) : (
                        <p className="px-3 py-2.5 text-xs text-slate-400">No match — try shorter keyword (e.g. "Central" for Central Bank)</p>
                      )}
                    </div>
                  )}
                </div>
              </div>

              {/* Step B: Search Branch/City */}
              {selBank && (
                <div>
                  <p className="text-xs font-semibold text-slate-600 mb-1">
                    Step 2 — Type Branch name or City
                    <span className="font-normal text-slate-400 ml-1">({selBank})</span>
                  </p>
                  <div className="relative">
                    <input
                      className={INP + " pr-8"}
                      value={branchQ}
                      onChange={e => handleBranchSearch(e.target.value)}
                      placeholder="e.g. Andheri East, Connaught Place, Boring Road…"
                      autoFocus
                    />
                    {branchLoading && (
                      <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-blue-400 animate-pulse">⏳</span>
                    )}
                  </div>

                  {/* Results */}
                  {branchResults.length > 0 && (
                    <div className="mt-1.5 max-h-52 overflow-y-auto rounded-xl border border-slate-200 bg-white shadow-sm">
                      {branchResults.map(row => (
                        <button key={row.ifsc} type="button"
                          onClick={() => selectBranch(row)}
                          className="w-full text-left px-3 py-2.5 hover:bg-blue-50 border-b border-slate-100 last:border-0 transition group">
                          <div className="flex items-start justify-between gap-2">
                            <div>
                              <p className="text-xs font-bold text-slate-800 group-hover:text-blue-700">{row.branch}</p>
                              <p className="text-xs text-slate-500">{[row.city || row.district, row.state].filter(Boolean).join(", ")}</p>
                              {row.address && <p className="text-xs text-slate-400 truncate max-w-xs">{row.address}</p>}
                            </div>
                            <span className="shrink-0 text-xs font-mono font-bold text-blue-600 bg-blue-50 border border-blue-200 px-2 py-0.5 rounded-lg mt-0.5">
                              {row.ifsc}
                            </span>
                          </div>
                        </button>
                      ))}
                    </div>
                  )}
                  {branchQ.length >= 2 && !branchLoading && branchResults.length === 0 && (
                    <p className="text-xs text-slate-400 mt-1">No branches found. Try a different keyword.</p>
                  )}
                </div>
              )}
            </div>
          )}
        </div>

        <div>
          <Lbl c="Bank Name *" h="Auto-filled from IFSC or enter manually"/>
          <input className={INP} value={f.bankName} onChange={e=>set("bankName",e.target.value)} placeholder="e.g. State Bank of India"/>
        </div>
        <div>
          <Lbl c="Account Type *"/>
          <select className={SEL} value={f.accountType} onChange={e=>set("accountType",e.target.value)}>
            <option value="current">Current Account</option>
            <option value="savings">Savings Account</option>
            <option value="cc">Cash Credit Account</option>
            <option value="od">Overdraft Account</option>
          </select>
        </div>
        <div>
          <Lbl c="Branch Name *"/>
          <input className={INP} value={f.branchName} onChange={e=>set("branchName",e.target.value)} placeholder="e.g. Andheri East"/>
        </div>
        <div>
          <Lbl c="City *"/>
          <input className={INP} value={f.city} onChange={e=>set("city",e.target.value)} placeholder="e.g. Mumbai"/>
        </div>
      </div>
    </div>
  );

  // Directors from Excel (with attendance checkbox state)
  const [dirPresent, setDirPresent] = useState<boolean[]>([]);

  // Keep dirPresent in sync when directors array changes
  const presentFlags = f.directors.map((_, i) =>
    dirPresent[i] !== undefined ? dirPresent[i] : true
  );
  function togglePresent(i: number) {
    const next = [...presentFlags];
    next[i] = !next[i];
    setDirPresent(next);
  }

  // Directors present (checked ones) — used for document generation
  const activeDirectors = f.directors.filter((_, i) => presentFlags[i] && f.directors[i].name.trim());

  // Extract city/district from registered address for venue default
  function extractCityFromAddress(addr: string): string {
    if (!addr) return "";
    // Try to find city — common patterns: last meaningful word before state/pin
    const parts = addr.split(",").map(s => s.trim()).filter(Boolean);
    // Look for a part that looks like a city (not a pin code, not "India")
    for (let i = parts.length - 1; i >= 0; i--) {
      const p = parts[i];
      if (/^\d{6}$/.test(p)) continue;
      if (/^india$/i.test(p)) continue;
      if (/^\d/.test(p)) continue;
      return p;
    }
    return parts[0] || "";
  }

  // Director name list for dropdowns
  const directorNames = f.directors.filter(d => d.name.trim());

  /* ─ STEP 3: Meeting ─ */
  const venueDefault = f.meetingVenue ||
    (f.regAddress ? `Registered office of the Company at ${extractCityFromAddress(f.regAddress)}` : "");

  const s3 = (
    <div className="space-y-4">
      <SHead n={3} title="Board Meeting Details" sub="Details of the Board Meeting at which this resolution is passed" />
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <Lbl c="Date of Board Meeting *"/>
          <input type="date" className={INP} value={f.meetingDate} onChange={e=>set("meetingDate",e.target.value)}/>
        </div>
        <div>
          <Lbl c="Time of Meeting"/>
          <input type="time" className={INP} value={f.meetingTime} onChange={e=>set("meetingTime",e.target.value)}/>
        </div>
        <div className="sm:col-span-2">
          <Lbl c="Venue / Place of Meeting *" h="Full address where meeting is held"/>
          <input className={INP}
            value={f.meetingVenue}
            onChange={e=>set("meetingVenue",e.target.value)}
            onFocus={e => { if (!f.meetingVenue && venueDefault) set("meetingVenue", venueDefault); }}
            placeholder={venueDefault || "e.g. Registered office of the Company at Mumbai"}
          />
          {!f.meetingVenue && venueDefault && (
            <button type="button" onClick={()=>set("meetingVenue", venueDefault)}
              className="text-xs text-blue-500 hover:text-blue-700 mt-1 font-medium">
              ↳ Use: "{venueDefault}"
            </button>
          )}
        </div>
      </div>

      {/* Directors Present — with checkboxes */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <Lbl c="Directors Present at Meeting *" h="Tick the directors who attended"/>
          {f.directors.length < 8 && (
            <button onClick={addDir} className="text-xs font-bold text-blue-600 hover:text-blue-800">+ Add Director</button>
          )}
        </div>

        {directorNames.length > 0 && (
          <p className="text-xs text-slate-400 mb-2">
            ✅ {presentFlags.filter((p,i)=>p && f.directors[i]?.name).length} of {directorNames.length} marked present
          </p>
        )}

        <div className="space-y-2">
          {f.directors.map((d, i) => (
            <div key={i} className="flex items-center gap-2">
              {/* Attendance checkbox */}
              <button
                type="button"
                onClick={() => togglePresent(i)}
                className={`shrink-0 w-5 h-5 rounded border-2 flex items-center justify-center transition-all ${
                  presentFlags[i]
                    ? "bg-blue-600 border-blue-600"
                    : "border-slate-300 hover:border-blue-400"
                }`}
                title={presentFlags[i] ? "Mark Absent" : "Mark Present"}
              >
                {presentFlags[i] && (
                  <svg className="w-3 h-3 text-white" viewBox="0 0 10 8" fill="none">
                    <path d="M1 4l3 3 5-6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                )}
              </button>

              <span className="text-xs text-slate-400 w-5 shrink-0">{i+1}.</span>
              <input
                className={`${INP} flex-1 ${!presentFlags[i] ? "opacity-50" : ""}`}
                value={d.name}
                onChange={e=>setDir(i,"name",e.target.value)}
                placeholder={`Director ${i+1} full name`}
              />
              <input
                className={`${INP} flex-1 ${!presentFlags[i] ? "opacity-50" : ""}`}
                value={d.designation}
                onChange={e=>setDir(i,"designation",e.target.value)}
                placeholder="Designation"
              />
              {f.directors.length > 1 && (
                <button onClick={()=>remDir(i)} className="text-red-400 hover:text-red-600 text-lg shrink-0">✕</button>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  /* ─ STEP 4: Signatories ─ */
  const s4 = (
    <div className="space-y-4">
      <SHead n={4} title="Authorised Signatories" sub="Persons authorised to operate the bank account" />
      <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 text-xs text-amber-700">
        <strong>Tip:</strong> Banks typically require at least 2 authorised signatories. DIN is required for Directors; PAN for others.
      </div>

      <div className="space-y-3">
        {f.signatories.map((s, i) => {
          const isFromDir = directorNames.some(d => d.name === s.name);
          return (
            <div key={i} className="bg-slate-50 border border-slate-200 rounded-xl p-4">
              <div className="flex items-center justify-between mb-2">
                <p className="text-sm font-bold text-slate-700">Signatory {i+1}</p>
                {f.signatories.length > 1 && (
                  <button onClick={()=>remSig(i)} className="text-xs text-red-500 hover:text-red-700 font-semibold">Remove</button>
                )}
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <Lbl c="Full Name *"/>
                  {directorNames.length > 0 ? (
                    <select
                      className={SEL}
                      value={s.name}
                      onChange={e => {
                        const val = e.target.value;
                        const reg = dirRegistry.find(d => d.name === val);
                        const dir = directorNames.find(d => d.name === val);
                        // Single update — avoids React state batching issue
                        const sigs = [...f.signatories];
                        sigs[i] = {
                          ...sigs[i],
                          name:        val,
                          designation: reg?.designation || dir?.designation || sigs[i].designation,
                          dinPan:      reg?.din ?? sigs[i].dinPan,
                        };
                        set("signatories", sigs);
                      }}
                    >
                      <option value="">— Select Director —</option>
                      {directorNames.map((d, di) => (
                        <option key={di} value={d.name}>{d.name} — {d.designation}</option>
                      ))}
                      <option value="__manual__">+ Enter manually</option>
                    </select>
                  ) : (
                    <input className={INP} value={s.name} onChange={e=>setSig(i,"name",e.target.value)} placeholder="e.g. Rahul Sharma"/>
                  )}
                  {/* Manual input if __manual__ selected or no match */}
                  {s.name === "__manual__" && (
                    <input className={`${INP} mt-1`} value="" onChange={e=>setSig(i,"name",e.target.value)} placeholder="Type name manually" autoFocus/>
                  )}
                </div>
                <div>
                  <Lbl c="Designation *"/>
                  <input className={INP} value={s.designation} onChange={e=>setSig(i,"designation",e.target.value)} placeholder="e.g. Managing Director"/>
                </div>
                <div>
                  <Lbl c="DIN / PAN No." h="DIN for directors, PAN for others"/>
                  <input className={INP} value={s.dinPan} onChange={e=>setSig(i,"dinPan",e.target.value.toUpperCase())} placeholder="e.g. 12345678 or ABCDE1234F"/>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {f.signatories.length < 3 && (
        <button onClick={addSig}
          className="w-full py-2.5 rounded-xl border-2 border-dashed border-slate-300 text-slate-500 text-sm font-semibold hover:border-blue-400 hover:text-blue-600 transition">
          + Add Signatory (max 3)
        </button>
      )}

      <div>
        <Lbl c="Mode of Operation *" h="How the account will be operated by the signatories"/>
        <select className={SEL} value={f.signingMode} onChange={e=>set("signingMode",e.target.value)}>
          <option value="singly">Severally / Singly (any one can sign)</option>
          <option value="joint_any_two">Jointly — Any Two of the above</option>
          <option value="jointly_all">Jointly — All of the above</option>
        </select>
      </div>
    </div>
  );

  /* ─ STEP 5: Certification ─ */
  const allCertOptions = directorNames.map(d => {
    const reg = dirRegistry.find(r => r.name === d.name);
    return { name: d.name, desig: d.designation, din: reg?.din || "" };
  });

  function setCertPerson(i: number, k: keyof CertPerson, v: string) {
    const next = [...f.certPersons];
    next[i] = { ...next[i], [k]: v };
    set("certPersons", next);
  }
  function addCertPerson() {
    set("certPersons", [...f.certPersons, { name: "", desig: "Director" }]);
  }
  function removeCertPerson(i: number) {
    if (f.certPersons.length <= 1) return;
    set("certPersons", f.certPersons.filter((_, x) => x !== i));
  }

  const DESIG_OPTIONS = [
    "Managing Director", "Whole-Time Director", "Director",
    "Company Secretary", "Chief Executive Officer", "Chief Financial Officer",
  ];

  const s5 = (
    <div className="space-y-5">
      <SHead n={5} title="Certification Details" sub="Persons certifying this as True Copy for bank submission" />

      <div className="bg-blue-50 border border-blue-200 rounded-xl p-3 text-xs text-blue-700">
        As per Companies Act — MD / Whole-time Director has highest authority. Minimum 1 certifying person required. Banks usually accept 1–2.
      </div>

      {/* Certifying Persons Cards */}
      <div className="space-y-3">
        {f.certPersons.map((cp, i) => (
          <div key={i} className="bg-slate-50 border border-slate-200 rounded-xl p-4">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <span className="w-6 h-6 rounded-full bg-blue-600 text-white text-xs font-bold flex items-center justify-center shrink-0">{i + 1}</span>
                <p className="text-sm font-bold text-slate-700">
                  Certifying Person {i + 1}
                  {i === 0 && <span className="ml-2 text-xs font-normal text-blue-500">(Primary)</span>}
                </p>
              </div>
              {f.certPersons.length > 1 && (
                <button type="button" onClick={() => removeCertPerson(i)}
                  className="text-xs text-red-500 hover:text-red-700 font-semibold">Remove</button>
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {/* Name — dropdown if directors available */}
              <div>
                <Lbl c="Name *" />
                {allCertOptions.length > 0 ? (
                  <select
                    className={SEL}
                    value={cp.name}
                    onChange={e => {
                      const val = e.target.value;
                      const chosen = allCertOptions.find(o => o.name === val);
                      // Single update — avoids React state batching issue
                      const next = [...f.certPersons];
                      next[i] = {
                        ...next[i],
                        name:  val,
                        desig: chosen?.desig || next[i].desig,
                        din:   chosen?.din   ?? next[i].din,
                      };
                      set("certPersons", next);
                    }}
                  >
                    <option value="">— Select Director —</option>
                    {allCertOptions.map((o, oi) => (
                      <option key={oi} value={o.name}>{o.name} — {o.desig}</option>
                    ))}
                    <option value="__manual__">+ Enter manually</option>
                  </select>
                ) : (
                  <input className={INP} value={cp.name}
                    onChange={e => setCertPerson(i, "name", e.target.value)}
                    placeholder="e.g. Rahul Sharma" />
                )}
                {cp.name === "__manual__" && (
                  <input className={`${INP} mt-1.5`} value=""
                    onChange={e => setCertPerson(i, "name", e.target.value)}
                    placeholder="Type name" autoFocus />
                )}
              </div>

              {/* Designation */}
              <div>
                <Lbl c="Designation" />
                <select className={SEL} value={cp.desig}
                  onChange={e => setCertPerson(i, "desig", e.target.value)}>
                  {DESIG_OPTIONS.map(d => <option key={d} value={d}>{d}</option>)}
                </select>
              </div>

              {/* DIN */}
              <div>
                <Lbl c="DIN" h="Director Identification Number"/>
                <input className={INP} value={cp.din}
                  onChange={e => setCertPerson(i, "din", e.target.value)}
                  placeholder="e.g. 01234567"/>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Add more */}
      <button type="button" onClick={addCertPerson}
        className="w-full py-2.5 rounded-xl border-2 border-dashed border-slate-300 text-slate-500 text-sm font-semibold hover:border-blue-400 hover:text-blue-600 transition">
        + Add Another Certifying Person
      </button>

      {/* Date & Place — common for all */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2 border-t border-slate-100">
        <div>
          <Lbl c="Date of Certification" />
          <input type="date" className={INP} value={f.certDate} onChange={e => set("certDate", e.target.value)} />
        </div>
        <div>
          <Lbl c="Place" />
          <input className={INP} value={f.certPlace} onChange={e => set("certPlace", e.target.value)} placeholder="e.g. Mumbai" />
        </div>
      </div>
    </div>
  );

  const stepContent: Record<number, React.ReactNode> = { 1:s1, 2:s2, 3:s3, 4:s4, 5:s5 };

  return (
    <main className="min-h-screen bg-white flex flex-col">
      {/* Print styles */}
      <style dangerouslySetInnerHTML={{ __html: PRINT_CSS }} />

      <Navbar />

      {/* Hero */}
      {step === 1 && !preview && (
        <section className="border-b border-slate-100 print:hidden overflow-hidden relative"
          style={{ background:"linear-gradient(160deg,#eff6ff 0%,#f5f3ff 50%,#fafafa 100%)" }}>

          {/* Decorative blobs background */}
          <div className="absolute top-0 left-0 w-72 h-72 rounded-full pointer-events-none opacity-30"
            style={{ background:"radial-gradient(circle,#bfdbfe,transparent 70%)", transform:"translate(-30%,-30%)" }} />
          <div className="absolute bottom-0 right-0 w-64 h-64 rounded-full pointer-events-none opacity-20"
            style={{ background:"radial-gradient(circle,#ddd6fe,transparent 70%)", transform:"translate(30%,30%)" }} />

          <div className="max-w-6xl mx-auto px-4 py-12 md:py-16 relative z-10">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-10 items-center">

              {/* ── LEFT SIDE ── */}
              <div className="flex flex-col gap-5">

                {/* Badge */}
                <div className="inline-flex items-center gap-2 text-xs font-bold px-4 py-1.5 rounded-full border w-fit"
                  style={{ background:"#eff6ff", borderColor:"#bfdbfe", color:"#1e40af" }}>
                  📄 Legal Document Generator
                </div>

                {/* Heading */}
                <div>
                  <h1 className="text-3xl md:text-4xl font-extrabold text-slate-900 leading-tight mb-3">
                    Bank Account Opening{" "}
                    <span style={{ background:"linear-gradient(90deg,#1d4ed8,#7c3aed)", WebkitBackgroundClip:"text", WebkitTextFillColor:"transparent" }}>
                      Resolution
                    </span>
                  </h1>
                  <p className="text-slate-500 text-sm leading-relaxed max-w-md">
                    Generate a legally formatted Board Resolution for opening a bank account — free, instant, and Companies Act 2013 compliant.
                  </p>
                </div>

                {/* Stats row */}
                <div className="flex items-center gap-5 flex-wrap">
                  <div className="flex items-center gap-1.5 text-sm text-slate-600">
                    <span className="text-blue-500 text-base">⬇</span>
                    <span className="font-bold text-slate-800">2,400+</span>
                    <span className="text-slate-500">Downloads</span>
                  </div>
                  <div className="w-px h-4 bg-slate-200" />
                  <div className="flex items-center gap-1.5 text-sm">
                    <div className="flex gap-0.5">
                      {[1,2,3,4,5].map(i => (
                        <svg key={i} className="w-4 h-4" viewBox="0 0 20 20" fill={i <= 4 ? "#f59e0b" : "none"} stroke="#f59e0b" strokeWidth="1">
                          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"/>
                        </svg>
                      ))}
                    </div>
                    <span className="font-bold text-slate-800">4.8</span>
                    <span className="text-slate-400 text-xs">(312 ratings)</span>
                  </div>
                  <div className="w-px h-4 bg-slate-200" />
                  <div className="flex items-center gap-1.5 text-xs text-slate-400">
                    <span>🕒</span>
                    <span>Updated: June 2025</span>
                  </div>
                </div>

                {/* Feature tags */}
                <div className="flex flex-wrap gap-2">
                  {["✓ Companies Act 2013","✓ Print-Ready A4","✓ All Banks","✓ Free"].map(t => (
                    <span key={t} className="text-xs px-3 py-1.5 bg-white border border-slate-200 rounded-full text-slate-600 font-medium shadow-sm">
                      {t}
                    </span>
                  ))}
                </div>

                {/* CTA Button */}
                <div>
                  <button
                    onClick={() => document.getElementById("resolution-form")?.scrollIntoView({ behavior:"smooth" })}
                    className="inline-flex items-center gap-2 font-bold text-white text-base px-8 py-3.5 rounded-2xl transition-all hover:scale-105 shadow-lg"
                    style={{ background:"linear-gradient(135deg,#1d4ed8,#7c3aed)", boxShadow:"0 12px 32px rgba(29,78,216,0.30)" }}>
                    Get Started →
                  </button>
                  <p className="text-xs text-slate-400 mt-2">No signup required · Instant download</p>
                </div>
              </div>

              {/* ── RIGHT SIDE — Document Preview ── */}
              <div className="relative flex items-center justify-center">

                {/* Top decorative ellipse */}
                <div className="absolute -top-6 left-1/2 -translate-x-1/2 w-48 h-10 rounded-full pointer-events-none opacity-40"
                  style={{ background:"radial-gradient(ellipse,#bfdbfe,transparent 80%)", filter:"blur(8px)" }} />

                {/* Document mockup card */}
                <div className="relative w-full max-w-sm bg-white rounded-2xl shadow-2xl border border-slate-200 p-6 rotate-1 hover:rotate-0 transition-transform duration-300">
                  {/* Mockup header */}
                  <div className="text-center mb-4 border-b border-slate-100 pb-3">
                    <p className="text-xs font-bold uppercase tracking-wide text-slate-600">Certified True Copy</p>
                    <p className="text-xs text-slate-500">Board Resolution — Bank Account Opening</p>
                    <p className="text-sm font-extrabold text-slate-900 mt-1">ABC ENTERPRISES PVT. LTD.</p>
                  </div>
                  {/* Mockup lines */}
                  <div className="space-y-2">
                    <div className="flex gap-2 text-xs text-slate-500">
                      <span className="font-bold text-slate-700 shrink-0">CIN:</span>
                      <div className="h-3 bg-slate-100 rounded flex-1" />
                    </div>
                    <div className="flex gap-2 text-xs text-slate-500">
                      <span className="font-bold text-slate-700 shrink-0">Date:</span>
                      <div className="h-3 bg-slate-100 rounded w-28" />
                    </div>
                    <div className="h-px bg-slate-200 my-2" />
                    <div className="bg-blue-50 border border-blue-100 rounded-lg p-2.5 text-xs text-blue-700 leading-relaxed">
                      <span className="font-bold">"RESOLVED THAT</span> pursuant to Section 179(3)(d) of the Companies Act, 2013… the consent of the Board is hereby accorded to open a Current Account with <span className="font-semibold">State Bank of India…</span>"
                    </div>
                    <div className="h-3 bg-slate-100 rounded w-full" />
                    <div className="h-3 bg-slate-100 rounded w-4/5" />
                    <div className="h-3 bg-slate-100 rounded w-3/5" />
                    <div className="h-px bg-slate-200 my-2" />
                    <div className="flex items-end justify-between mt-3">
                      <div>
                        <div className="h-px w-20 bg-slate-400 mb-1" />
                        <p className="text-xs text-slate-500">Signature</p>
                      </div>
                      <div className="w-14 h-14 border-2 border-dashed border-slate-300 rounded flex items-center justify-center">
                        <p className="text-xs text-slate-300 text-center leading-tight">Company<br/>Seal</p>
                      </div>
                    </div>
                  </div>
                  {/* Watermark */}
                  <div className="absolute top-3 right-3 bg-green-100 text-green-700 text-xs font-bold px-2 py-0.5 rounded-full border border-green-200">
                    FREE
                  </div>
                </div>

                {/* Bottom decorative ellipse */}
                <div className="absolute -bottom-6 left-1/2 -translate-x-1/2 w-48 h-10 rounded-full pointer-events-none opacity-30"
                  style={{ background:"radial-gradient(ellipse,#ddd6fe,transparent 80%)", filter:"blur(8px)" }} />
              </div>

            </div>
          </div>
        </section>
      )}

      <div id="resolution-form" className="max-w-3xl mx-auto w-full px-4 py-8 flex-1 print:hidden">

        {!preview ? (
          <>
            {/* Progress */}
            <div className="mb-7">
              <div className="flex items-center justify-between mb-2">
                <p className="text-sm font-bold text-slate-700">
                  Step {step} of {TOTAL} — {["Company","Bank","Meeting","Signatories","Certification"][step-1]}
                </p>
                <p className="text-xs text-slate-400">{Math.round((step/TOTAL)*100)}% complete</p>
              </div>
              <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                <div className="h-full rounded-full transition-all duration-500"
                  style={{ width:`${(step/TOTAL)*100}%`, background:"linear-gradient(90deg,#1d4ed8,#7c3aed)"}}/>
              </div>
            </div>

            {/* Excel Upload — Step 1 only */}
            {step === 1 && (
              <CompanyExcelUpload
                onFill={handleExcelFill}
                accent="blue"
                note="Remaining fields (Bank details, Meeting date, Certification) fill karne honge manually."
              />
            )}

            {/* Form */}
            <div className="bg-white mb-6">{stepContent[step]}</div>

            {/* Navigation */}
            <div className="flex items-center justify-between">
              <button onClick={()=>setStep(s=>Math.max(s-1,1) as typeof step)}
                disabled={step===1}
                className="px-6 py-3 rounded-xl font-bold text-slate-600 border-2 border-slate-200 text-sm disabled:opacity-40 hover:bg-slate-50 transition">
                ← Back
              </button>
              {step < TOTAL ? (
                <button onClick={()=>setStep(s=>Math.min(s+1,TOTAL) as typeof step)}
                  className="px-8 py-3 rounded-xl font-bold text-white text-sm transition hover:scale-105"
                  style={{ background:"linear-gradient(135deg,#1d4ed8,#7c3aed)" }}>
                  Continue →
                </button>
              ) : (
                <button onClick={()=>setPreview(true)}
                  className="flex items-center gap-2 px-8 py-3 rounded-xl font-bold text-white text-sm transition hover:scale-105"
                  style={{ background:"linear-gradient(135deg,#16a34a,#15803d)" }}>
                  📄 Generate Resolution →
                </button>
              )}
            </div>

            {/* Related */}
            {step === 1 && (
              <div className="mt-8 bg-slate-50 rounded-2xl p-4 border border-slate-200">
                <p className="font-bold text-slate-700 mb-2 text-sm">📌 More Document Generators Coming Soon</p>
                <div className="flex flex-wrap gap-2">
                  {["Change of Authorised Signatory","Account Closure Resolution","Loan Sanction Resolution","Board Resolution for GST"].map(l=>(
                    <span key={l} className="text-xs px-3 py-1.5 rounded-full border border-slate-200 text-slate-400 bg-white">
                      {l} (Soon)
                    </span>
                  ))}
                </div>
              </div>
            )}
          </>
        ) : (
          /* ─── PREVIEW MODE ─── */
          <>
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-xl font-extrabold text-slate-900">Resolution Preview</h2>
                <p className="text-xs text-slate-400 mt-0.5">Review carefully before printing.</p>
              </div>
              <div className="flex items-center gap-2 flex-wrap justify-end">
                <button onClick={()=>setPreview(false)}
                  className="px-4 py-2 rounded-xl font-bold text-slate-600 border-2 border-slate-200 text-sm hover:bg-slate-50 transition">
                  ← Edit
                </button>
                <button onClick={()=>window.print()}
                  className="flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold text-white text-sm transition hover:scale-105"
                  style={{ background:"linear-gradient(135deg,#475569,#334155)" }}>
                  🖨️ Print
                </button>
                <button
                  onClick={() => downloadResolutionPDF(f.companyName)}
                  className="flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold text-white text-sm transition hover:scale-105 shadow-lg"
                  style={{ background:"linear-gradient(135deg,#16a34a,#15803d)", boxShadow:"0 6px 20px rgba(22,163,74,0.35)" }}>
                  ⬇ Download PDF
                </button>
              </div>
            </div>

            {/* ── Letterhead Settings ── */}
            <div className="mb-4 bg-slate-50 border border-slate-200 rounded-2xl p-4 space-y-3">
              {/* Toggle */}
              <button type="button"
                onClick={() => set("printOnLetterhead", !f.printOnLetterhead)}
                className={`flex items-center gap-3 w-full text-left px-4 py-2.5 rounded-xl border-2 transition-all text-sm font-medium ${
                  f.printOnLetterhead
                    ? "border-blue-500 bg-blue-50 text-blue-800"
                    : "border-slate-200 bg-white text-slate-600"
                }`}>
                <span className={`w-5 h-5 rounded border-2 flex items-center justify-center shrink-0 transition-all ${
                  f.printOnLetterhead ? "bg-blue-600 border-blue-600" : "border-slate-300"
                }`}>
                  {f.printOnLetterhead && (
                    <svg className="w-3 h-3 text-white" viewBox="0 0 10 8" fill="none">
                      <path d="M1 4l3 3 5-6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
                    </svg>
                  )}
                </span>
                <span>🏢 Print on Company Letterhead</span>
                <span className={`ml-auto text-xs px-2 py-0.5 rounded-full font-semibold ${
                  f.printOnLetterhead ? "bg-blue-600 text-white" : "bg-slate-200 text-slate-500"
                }`}>{f.printOnLetterhead ? "ON" : "OFF"}</span>
              </button>

              {/* Letterhead details */}
              {f.printOnLetterhead && (
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
                  <div>
                    <Lbl c="Mobile Number" h="Company contact number for letterhead"/>
                    <input className={INP} value={f.printMobile}
                      onChange={e => set("printMobile", e.target.value)}
                      placeholder="e.g. +91 98765 43210"/>
                  </div>
                  <div>
                    <Lbl c="Email ID" h="Editable — pre-fill or type"/>
                    <input className={INP} value={f.printEmail}
                      onChange={e => set("printEmail", e.target.value)}
                      placeholder="e.g. info@company.com"/>
                  </div>
                  <div>
                    <Lbl c="GST Number" h="Optional"/>
                    <input className={INP} value={f.printGst}
                      onChange={e => set("printGst", e.target.value.toUpperCase())}
                      placeholder="e.g. 27AAAAA0000A1Z5"/>
                  </div>
                </div>
              )}
            </div>

            {/* Document on screen */}
            <div className="border-2 border-slate-200 rounded-2xl p-6 sm:p-10 shadow-sm bg-white">
              <DocPreview f={f} presentDirs={activeDirectors} />
            </div>

            <div className="mt-4 bg-amber-50 border border-amber-200 rounded-xl p-3 text-xs text-amber-700">
              <strong>Before you print:</strong> Verify all details. Banks may ask for COI, MOA, AOA. Consult CA / CS if needed.
            </div>

            <div className="mt-3 flex justify-center">
              <button onClick={()=>setPreview(false)}
                className="text-sm text-blue-600 hover:underline font-semibold">
                ← Go back and edit
              </button>
            </div>
          </>
        )}
      </div>

      {/* Print view (A4) */}
      {preview && (
        <div className="hidden print:block">
          <DocPreview f={f} presentDirs={activeDirectors} />
        </div>
      )}

      <footer className="border-t border-slate-200 py-5 px-4 mt-auto print:hidden">
        <div className="max-w-3xl mx-auto text-center text-sm text-slate-400">
          <Link href="/tools/documents" className="text-blue-500 hover:underline text-xs">← All Document Generators</Link>
          {" · "}
          © {new Date().getFullYear()} ComplianceSearch.in — Powered by{" "}
          <a href="https://geebharat.com" className="text-amber-600 hover:underline">Gee Bharat</a>
        </div>
      </footer>
    </main>
  );
}
