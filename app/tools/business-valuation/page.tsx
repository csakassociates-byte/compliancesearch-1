"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import Navbar from "@/components/Navbar";

/* ══════════════════════════════════════════════════════════════════════════
   46-SECTOR INDUSTRY DATABASE
   Source: Kroll Industry Multiples India 2024 (26th Ed.) · BSE indices ·
           Damodaran India WACC 2025 · incwert.com ERP Jan 2026
   Format : { label, evE:[lo,mid,hi], evR:[lo,mid,hi], pe:[lo,mid,hi], beta }
══════════════════════════════════════════════════════════════════════════ */

type T3 = [number, number, number];
interface IData { label: string; evE: T3; evR: T3; pe: T3; beta: number }

const IND: Record<string, IData> = {
  /* Agriculture & Primary */
  agri:         { label:"Agriculture / Agri-Tech / Food Processing",    evE:[6, 11,17], evR:[0.6,1.3,2.5], pe:[9, 14,22], beta:0.85 },
  mining:       { label:"Mining & Minerals / Quarrying",                evE:[5,  9,15], evR:[1.5,3.0,5.0], pe:[8, 13,20], beta:1.25 },
  sugar:        { label:"Sugar & Ethanol / Distilleries",               evE:[4,  7,12], evR:[0.4,0.8,1.5], pe:[7, 12,18], beta:1.05 },
  fertilizer:   { label:"Fertilizers & Agrochemicals",                  evE:[5,  9,14], evR:[0.6,1.2,2.0], pe:[9, 15,22], beta:0.90 },
  /* Energy */
  oil_gas:      { label:"Oil & Gas (E&P / Refining / Integrated)",      evE:[5,  9,14], evR:[0.5,1.2,2.5], pe:[8, 14,22], beta:0.95 },
  gas_pipes:    { label:"Gas Distribution & City Gas Networks",         evE:[8, 13,20], evR:[2.0,4.0,7.0], pe:[12,18,28], beta:0.80 },
  energy:       { label:"Power / Renewables / Nuclear / Utilities",     evE:[7, 12,18], evR:[1.5,3.5,7.0], pe:[10,16,26], beta:1.00 },
  /* Heavy Manufacturing */
  metals_steel: { label:"Steel & Ferrous Metals / Iron",                evE:[4,  7,11], evR:[0.4,0.7,1.2], pe:[8, 12,18], beta:1.20 },
  metals_nf:    { label:"Non-Ferrous Metals (Aluminium, Copper, Zinc)", evE:[4,  8,12], evR:[0.3,0.7,1.2], pe:[7, 11,17], beta:1.25 },
  cement:       { label:"Cement & Building Materials",                  evE:[8, 13,18], evR:[1.5,2.5,4.0], pe:[14,22,32], beta:1.05 },
  paper_pkg:    { label:"Paper, Packaging & Printing",                  evE:[5,  8,13], evR:[0.5,1.0,1.8], pe:[9, 14,22], beta:0.95 },
  /* Specialty Manufacturing */
  chemicals:    { label:"Specialty Chemicals",                          evE:[8, 13,20], evR:[1.0,1.8,3.0], pe:[12,20,30], beta:1.05 },
  pharma:       { label:"Pharmaceuticals / Generic Drugs / Formulations",evE:[14,20,28],evR:[2.5,4.0,7.0], pe:[20,28,40], beta:0.85 },
  cro_cdmo:     { label:"CRO / CDMO / Biotech Manufacturing Services",  evE:[18,30,50], evR:[3.0,6.0,12],  pe:[28,45,70], beta:1.10 },
  auto:         { label:"Automobile / Auto Ancillary / EV Components",  evE:[7, 10,14], evR:[0.7,1.1,1.8], pe:[13,18,26], beta:1.10 },
  manufacturing:{ label:"Capital Goods / General Manufacturing",        evE:[6,  9,13], evR:[0.6,1.0,1.6], pe:[11,16,23], beta:1.05 },
  cables_wires: { label:"Cables, Wires & Electronics Manufacturing",    evE:[7, 12,18], evR:[0.8,1.5,2.5], pe:[14,22,32], beta:1.00 },
  textiles:     { label:"Textiles, Apparel, Garments & Footwear",       evE:[5,  9,14], evR:[0.5,1.0,1.8], pe:[10,16,24], beta:1.10 },
  defence:      { label:"Defence & Aerospace / Space Tech",             evE:[18,28,40], evR:[2.5,5.0,9.0], pe:[25,40,60], beta:1.00 },
  /* Consumer */
  fmcg:         { label:"FMCG / Consumer Staples",                      evE:[28,42,58], evR:[3.5,5.5,9.0], pe:[35,50,68], beta:0.70 },
  retail:       { label:"Retail / D2C / QSR / Supermarket",             evE:[11,17,26], evR:[0.4,0.9,1.8], pe:[16,24,36], beta:0.95 },
  fnb_rest:     { label:"Food & Beverages / Restaurants / HORECA",      evE:[15,24,36], evR:[2.0,4.0,7.0], pe:[25,40,60], beta:0.85 },
  hospitality:  { label:"Hotels / Hospitality / Travel & Tourism",      evE:[9, 14,22], evR:[1.2,2.2,4.0], pe:[15,24,36], beta:1.20 },
  gems_jewelry: { label:"Gems, Jewelry & Accessories",                  evE:[7, 14,22], evR:[0.5,1.2,2.5], pe:[14,25,40], beta:1.10 },
  paints:       { label:"Paints, Adhesives & Home Improvement",         evE:[28,40,55], evR:[4.0,7.0,11],  pe:[40,58,80], beta:0.85 },
  /* Technology */
  it_services:  { label:"IT Services / BPO / Software",                 evE:[16,22,30], evR:[2.5,4.5,7.0], pe:[24,32,42], beta:0.90 },
  saas:         { label:"SaaS / Tech Product / Platform",               evE:[20,32,55], evR:[4.0,9.0,18],  pe:[30,50,80], beta:1.25 },
  it_hardware:  { label:"IT Hardware / Electronics / Semiconductors",   evE:[8, 15,25], evR:[1.5,3.0,6.0], pe:[15,24,40], beta:1.20 },
  cybersec:     { label:"Cybersecurity / InfoSec / Cloud Security",     evE:[18,30,55], evR:[5.0,10,20],   pe:[30,55,90], beta:1.30 },
  ecommerce:    { label:"E-commerce / Marketplace / Quick Commerce",    evE:[10,20,40], evR:[0.6,1.5,3.5], pe:[20,40,80], beta:1.45 },
  ev_mobility:  { label:"EV / Electric Vehicles / New Mobility Tech",   evE:[15,28,60], evR:[2.0,5.0,15],  pe:[30,60,120],beta:1.40 },
  fintech:      { label:"Fintech / Payments / Digital Lending / BNPL",  evE:[15,28,55], evR:[4.0,10,25],   pe:[25,50,100],beta:1.35 },
  /* Healthcare */
  healthcare:   { label:"Healthcare / Hospitals / Clinics / Diagnostics",evE:[14,22,32],evR:[1.8,3.0,5.0], pe:[20,30,44], beta:0.82 },
  diagnostics:  { label:"Diagnostics, Pathology & Imaging Labs",        evE:[18,28,40], evR:[3.0,5.0,9.0], pe:[30,45,65], beta:0.80 },
  /* Financial Services */
  banking:      { label:"Banking / NBFC / MFI / Financial Services",    evE:[9, 14,22], evR:[1.8,3.0,5.0], pe:[10,14,22], beta:1.30 },
  insurance:    { label:"Insurance (Life, General, Health, Re-ins.)",   evE:[10,16,24], evR:[1.0,2.0,4.0], pe:[18,26,40], beta:0.85 },
  asset_mgmt:   { label:"Asset Management / Broking / Wealth Mgmt",    evE:[12,20,35], evR:[3.0,6.0,12],  pe:[20,32,55], beta:1.20 },
  real_estate:  { label:"Real Estate / Construction / REITs / PropTech",evE:[8, 13,20], evR:[1.2,2.5,5.0], pe:[11,16,26], beta:1.35 },
  /* Infrastructure & Transport */
  infrastructure:{label:"Infrastructure / EPC / Construction",          evE:[8, 12,18], evR:[1.5,3.0,6.0], pe:[12,18,28], beta:0.95 },
  logistics:    { label:"Logistics / Supply Chain / Warehousing / 3PL", evE:[9, 14,21], evR:[0.7,1.3,2.0], pe:[13,20,30], beta:1.00 },
  aviation:     { label:"Aviation & Airlines",                           evE:[5,  9,15], evR:[0.5,1.0,1.8], pe:[10,18,30], beta:1.30 },
  shipping:     { label:"Shipping & Marine / Ports & Terminals",        evE:[5,  9,14], evR:[1.0,2.0,4.0], pe:[8, 14,22], beta:1.10 },
  telecom:      { label:"Telecom / ISP / Tower / Data Centre",          evE:[6, 10,15], evR:[1.2,2.0,3.5], pe:[10,16,26], beta:0.85 },
  water_enviro: { label:"Water Treatment & Environment Services",       evE:[9, 15,22], evR:[1.5,3.0,5.0], pe:[15,24,36], beta:0.90 },
  /* Media & Services */
  media:        { label:"Media / Entertainment / OTT / Gaming / Sports",evE:[9, 15,24], evR:[1.2,2.5,5.0], pe:[14,22,34], beta:1.10 },
  education:    { label:"Education / EdTech / Skill Training / Test-Prep",evE:[16,26,40],evR:[2.5,5.0,10], pe:[22,36,55], beta:0.90 },
  /* Conglomerate & Other */
  conglomerate: { label:"Conglomerate / Diversified Group (use SOTP)",  evE:[7, 12,18], evR:[0.8,1.8,3.5], pe:[10,16,26], beta:1.00 },
  other:        { label:"Other / Mixed Business",                       evE:[7, 12,18], evR:[0.8,1.8,3.5], pe:[10,16,26], beta:1.00 },
};

const IND_GROUPS: { label: string; keys: string[] }[] = [
  { label:"Agriculture & Primary",          keys:["agri","mining","sugar","fertilizer"] },
  { label:"Energy",                         keys:["oil_gas","gas_pipes","energy"] },
  { label:"Heavy Manufacturing",            keys:["metals_steel","metals_nf","cement","paper_pkg"] },
  { label:"Specialty Manufacturing",        keys:["chemicals","pharma","cro_cdmo","auto","manufacturing","cables_wires","textiles","defence"] },
  { label:"Consumer",                       keys:["fmcg","retail","fnb_rest","hospitality","gems_jewelry","paints"] },
  { label:"Technology",                     keys:["it_services","saas","it_hardware","cybersec","ecommerce","ev_mobility","fintech"] },
  { label:"Healthcare & Life Sciences",     keys:["healthcare","diagnostics"] },
  { label:"Financial Services",             keys:["banking","insurance","asset_mgmt","real_estate"] },
  { label:"Infrastructure & Transport",     keys:["infrastructure","logistics","aviation","shipping","telecom","water_enviro"] },
  { label:"Media & Services",               keys:["media","education"] },
  { label:"Conglomerate & Other",           keys:["conglomerate","other"] },
];

/* ══ India Macros 2025-26 ════════════════════════════════════════════ */
const RF = 0.065;   // 10-yr G-Sec ~6.5%
const ERP = 0.070;  // India ERP Jan 2026 = 7.0% (incwert.com)
function sizeP(r: number) {
  return r < 1 ? 0.08 : r < 10 ? 0.06 : r < 100 ? 0.04 : r < 1000 ? 0.02 : 0.00;
}

/* ══ TYPES ═══════════════════════════════════════════════════════════ */
interface Seg { id:number; name:string; basis:"ebitda"|"revenue"|"nav"|"pe"; value:string; multiple:string; industry:string }
interface VR  { method:string; short:string; low:number; mid:number; high:number; weight:number; desc:string }

/* ══ HELPERS ═════════════════════════════════════════════════════════ */
const num  = (s:string|number) => { const x = parseFloat(String(s).replace(/,/g,"")); return isNaN(x)?0:x; };
const toCr = (v:number,u:string) => u==="crores"?v:v/100;
const pct  = (v:number) => `${v.toFixed(1)}%`;
function fmtCr(v:number):string {
  if(!isFinite(v)||v<=0) return "—";
  if(v>=100000) return `₹${(v/100000).toFixed(2)} Lakh Cr`;
  if(v>=1000)   return `₹${v.toFixed(0)} Cr`;
  if(v>=100)    return `₹${v.toFixed(1)} Cr`;
  if(v>=1)      return `₹${v.toFixed(2)} Cr`;
  return `₹${(v*100).toFixed(1)} L`;
}
function fmtPS(v:number):string {
  if(!isFinite(v)||v<=0) return "—";
  return `₹${v.toLocaleString("en-IN",{maximumFractionDigits:2})}`;
}

/* ══ CALCULATION ENGINE ══════════════════════════════════════════════ */
function calcWACC(indKey:string, rs:number, nd:number, nw:number, tax:number, rev:number):number {
  const {beta} = IND[indKey]??IND.other;
  const riskAdj = Math.max(0,(3-rs))*0.025;
  const Ke = RF + beta*ERP + sizeP(rev) + riskAdj;
  const cap = Math.max(nd,0)+Math.max(nw,0);
  if(cap<=0) return Ke;
  const dr = Math.min(0.85,Math.max(0,nd/cap));
  const Kd = (RF+0.045)*(1-tax);
  return Ke*(1-dr)+Kd*dr;
}

function calcDCF(ebitda:number, capex:number, tax:number, gr:number, tg:number, wacc:number):number {
  if(ebitda<=0||wacc<=tg/100+0.001) return 0;
  let fcf = ebitda*0.82*(1-tax)-capex; // EBIT≈EBITDA×82%; NOPAT=EBIT×(1-t)
  if(fcf<=0) return 0;
  let pv=0;
  for(let t=1;t<=5;t++){ fcf*=(1+gr/100); pv+=fcf/Math.pow(1+wacc,t); }
  const tgR=tg/100;
  const tv=(fcf*(1+tgR))/(wacc-tgR);
  return pv+tv/Math.pow(1+wacc,5);
}

function calcSOTP(segs:Seg[],nd:number,disc:number):number {
  const ev = segs.reduce((s,sg)=>{ const v=num(sg.value),m=num(sg.multiple); return s+(v>0&&m>0?v*m:0); },0);
  return Math.max(0, ev*(1-disc/100)-nd);
}

function calcDDM(dps:number, ke:number, g:number):number {
  if(ke<=g||dps<=0) return 0;
  return (dps*(1+g))/(ke-g);
}

function sensGrid(ebitda:number,capex:number,tax:number,nd:number,shares:number,wacc:number,gr:number,tg:number) {
  const dw=0.02, dg=1;
  const wLvl=[wacc-2*dw,wacc-dw,wacc,wacc+dw,wacc+2*dw];
  const gLvl=[gr-2*dg,gr-dg,gr,gr+dg,gr+2*dg];
  const grid=wLvl.map(w=>gLvl.map(g=>{
    const ev=calcDCF(ebitda,capex,tax,Math.max(0,g),tg,Math.max(w,0.05));
    const eq=Math.max(0,ev-nd);
    return shares>0?eq/shares:eq;
  }));
  return {wLvl,gLvl,grid};
}

/* ══ FORM STATE ══════════════════════════════════════════════════════ */
const DEFAULT = {
  // Step 1
  name:"", entity:"pvt_ltd", industry:"other", stage:"growth",
  years:"5", employees:"25", purpose:"internal", unit:"lakhs",
  isListed:"no", isSotp:"no",
  // Step 2 — Financials
  rev0:"", ebitda0:"", np0:"",
  debt:"0", cash:"0", netWorth:"", capex:"0", taxRate:"25",
  // Step 2 — Startup Berkus
  bIdea:"70", bProto:"50", bTeam:"65", bPart:"40", bSales:"25",
  // Step 3 — SOTP conglomerate discount
  conglomDisc:"10",
  // Step 4 — Listed company
  cmp:"", sharesOuts:"", bseCode:"", promoterPct:"",
  annualDps:"0", divGrowth:"6",
  // Step 5 — Growth & Scenarios
  growthRate:"20", termG:"4",
  bullProb:"25", bullGrowth:"35", bearProb:"25", bearGrowth:"5",
  // Step 6 — Risk
  rMgmt:"3", rMkt:"3", rVis:"3", rCust:"3", rReg:"3", rFin:"3",
};
type Frm = typeof DEFAULT;

const DEFAULT_SEGS: Seg[] = [
  { id:1, name:"Segment 1", basis:"ebitda", value:"", multiple:"10", industry:"other" },
];

/* ══ UI PRIMITIVES ═══════════════════════════════════════════════════ */
function Lbl({c,h}:{c:React.ReactNode;h?:string}) {
  return <div className="mb-1"><p className="text-sm font-semibold text-slate-700">{c}</p>{h&&<p className="text-xs text-slate-400">{h}</p>}</div>;
}
function Inp({value,onChange,placeholder,type="text"}:{value:string;onChange:(v:string)=>void;placeholder?:string;type?:string}) {
  return <input type={type} value={value} placeholder={placeholder}
    onChange={e=>onChange(e.target.value)}
    className="w-full border border-slate-300 rounded-xl px-3 py-2.5 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-300 bg-white"/>;
}
function Sel({value,onChange,children}:{value:string;onChange:(v:string)=>void;children:React.ReactNode}) {
  return <select value={value} onChange={e=>onChange(e.target.value)}
    className="w-full border border-slate-300 rounded-xl px-3 py-2.5 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-300 bg-white">
    {children}</select>;
}
function RiskSlider({label,hint,value,onChange}:{label:string;hint:string;value:string;onChange:(v:string)=>void}) {
  const v=num(value);
  const cols=["","bg-red-500","bg-orange-400","bg-yellow-400","bg-lime-500","bg-green-500"];
  const lbls=["","Very Poor","Below Avg","Average","Good","Excellent"];
  return (
    <div className="bg-slate-50 rounded-xl p-4 border border-slate-200">
      <div className="flex items-center justify-between mb-1">
        <p className="text-sm font-semibold text-slate-700">{label}</p>
        <span className={`text-xs font-bold px-2 py-0.5 rounded-full text-white ${cols[v]||"bg-slate-300"}`}>{v}/5 — {lbls[v]||"—"}</span>
      </div>
      <p className="text-xs text-slate-400 mb-2">{hint}</p>
      <input type="range" min={1} max={5} value={value} onChange={e=>onChange(e.target.value)} className="w-full accent-blue-600"/>
      <div className="flex justify-between text-xs text-slate-300 mt-0.5">
        <span>Very Poor</span><span>Average</span><span>Excellent</span>
      </div>
    </div>
  );
}

/* ══ MAIN PAGE ════════════════════════════════════════════════════════ */
export default function BusinessValuationPage() {
  const [f,setF]     = useState<Frm>(DEFAULT);
  const [segs,setSegs] = useState<Seg[]>(DEFAULT_SEGS);
  const [stepIdx,setStepIdx] = useState(0);

  const set = (k:keyof Frm,v:string) => setF(p=>({...p,[k]:v}));
  const isPre = f.stage==="pre_revenue";

  // Dynamic step list
  const steps = useMemo(()=>{
    if(isPre) return [{id:1,lbl:"Profile"},{id:2,lbl:"Startup Info"},{id:6,lbl:"Risk"},{id:7,lbl:"Results"}];
    const s=[{id:1,lbl:"Profile"},{id:2,lbl:"Financials"}];
    if(f.isSotp==="yes") s.push({id:3,lbl:"SOTP Segments"});
    if(f.isListed==="yes") s.push({id:4,lbl:"Listed Data"});
    s.push({id:5,lbl:"Growth"},{id:6,lbl:"Risk"},{id:7,lbl:"Results"});
    return s;
  },[isPre,f.isSotp,f.isListed]);

  const step = steps[stepIdx]?.id ?? 1;
  const isLast = stepIdx === steps.length-1;
  const isResults = step===7;
  function goNext(){ if(!isLast) setStepIdx(i=>i+1); }
  function goBack(){ if(stepIdx>0) setStepIdx(i=>i-1); }

  const unitL = f.unit==="lakhs"?"₹ Lakhs":"₹ Crores";

  // Run valuation only on results step
  const result = useMemo(()=>{
    if(step!==7) return null;
    const u=f.unit;
    const rev=toCr(num(f.rev0),u), ebitda=toCr(num(f.ebitda0),u), np=toCr(num(f.np0),u);
    const debt=toCr(num(f.debt),u), cash=toCr(num(f.cash),u);
    const nw=toCr(num(f.netWorth),u), capex=toCr(num(f.capex),u);
    const tax=num(f.taxRate)/100;
    const netDebt=Math.max(0,debt-cash);
    const rs=(num(f.rMgmt)+num(f.rMkt)+num(f.rVis)+num(f.rCust)+num(f.rReg)+num(f.rFin))/6;
    const wacc=calcWACC(f.industry,rs,netDebt,nw,tax,rev);
    const gr=num(f.growthRate), tg=num(f.termG);
    const ind=IND[f.industry]??IND.other;
    const ke=RF+ind.beta*ERP+sizeP(rev)+Math.max(0,(3-rs)*0.025);
    const shares=num(f.sharesOuts);

    // Weights
    type WM=Record<string,number>;
    const W:Record<string,WM>={
      pre_revenue:{dcf:0,evE:0,evR:0,pe:0,nav:0.10,berkus:0.45,sc:0.45,ddm:0,sotp:0},
      early:      {dcf:0.20,evE:0.10,evR:0.45,pe:0,nav:0.10,berkus:0.15,sc:0,ddm:0,sotp:0},
      growth:     {dcf:0.35,evE:0.25,evR:0.25,pe:0.10,nav:0.05,berkus:0,sc:0,ddm:0,sotp:0},
      mature:     {dcf:0.33,evE:0.27,evR:0.12,pe:0.10,nav:0.05,berkus:0,sc:0,ddm:0.13,sotp:0},
      declining:  {dcf:0.15,evE:0.20,evR:0.10,pe:0.05,nav:0.50,berkus:0,sc:0,ddm:0,sotp:0},
    };
    const wt:WM={...(W[f.stage]??W.mature)};
    if(["real_estate","banking","infrastructure","mining","oil_gas"].includes(f.industry)){
      wt.nav=Math.min(wt.nav+0.20,0.45); wt.dcf=Math.max(wt.dcf-0.10,0.10); wt.evE=Math.max(wt.evE-0.05,0.10);
    }
    if(num(f.annualDps)>0&&f.stage==="mature") wt.ddm=0.13;
    const sotpEq=f.isSotp==="yes"?calcSOTP(segs,netDebt,num(f.conglomDisc)):0;
    if(sotpEq>0){ Object.keys(wt).forEach(k=>{ wt[k]*=0.25; }); wt.sotp=0.75; }

    const vrs:VR[]=[];

    // 1 DCF
    const dcfEV=!isPre?calcDCF(ebitda,capex,tax,gr,tg,wacc):0;
    if(dcfEV>0&&wt.dcf>0) vrs.push({method:"Discounted Cash Flow (DCF)",short:"DCF",
      low:Math.max(0,dcfEV*0.80-netDebt),mid:Math.max(0,dcfEV-netDebt),high:Math.max(0,dcfEV*1.30-netDebt),
      weight:wt.dcf,desc:`WACC ${pct(wacc*100)} | Growth ${gr}%/yr | Terminal ${tg}% | EV ${fmtCr(dcfEV)}`});

    // 2 EV/EBITDA
    if(ebitda>0&&!isPre&&wt.evE>0){ const[a,b,c]=ind.evE;
      vrs.push({method:"EV / EBITDA Multiple",short:"EV/EBITDA",
        low:Math.max(0,ebitda*a-netDebt),mid:Math.max(0,ebitda*b-netDebt),high:Math.max(0,ebitda*c-netDebt),
        weight:wt.evE,desc:`BSE sector: ${a}x – ${c}x | EBITDA ${fmtCr(ebitda)}`}); }

    // 3 EV/Revenue
    if(rev>0&&wt.evR>0){ const[a,b,c]=ind.evR;
      vrs.push({method:"EV / Revenue Multiple",short:"EV/Rev",
        low:Math.max(0,rev*a-netDebt),mid:Math.max(0,rev*b-netDebt),high:Math.max(0,rev*c-netDebt),
        weight:wt.evR,desc:`BSE sector: ${a}x – ${c}x | Revenue ${fmtCr(rev)}`}); }

    // 4 P/E
    if(np>0&&!isPre&&f.stage!=="early"&&wt.pe>0){ const[a,b,c]=ind.pe;
      vrs.push({method:"P/E (Price / Earnings)",short:"P/E",
        low:np*a,mid:np*b,high:np*c,weight:wt.pe,
        desc:`BSE sector P/E: ${a}x – ${c}x | Net Profit ${fmtCr(np)}`}); }

    // 5 NAV
    if(nw>0&&wt.nav>0){ const em=rev>0?ebitda/rev:0; const nm=em>0.25?2.5:em>0.15?1.8:em>0.05?1.3:1.0;
      vrs.push({method:"Net Asset Value (NAV / Book)",short:"NAV",
        low:nw*0.8,mid:nw*nm,high:nw*nm*1.6,weight:wt.nav,
        desc:`Net Worth ${fmtCr(nw)} | NAV mult ${nm}x (EBITDA margin ${pct(em*100)})`}); }

    // 6 DDM
    const dps=num(f.annualDps), divG=num(f.divGrowth)/100;
    const ddmPS=calcDDM(dps,ke,divG);
    const ddmEq=shares>0?ddmPS*shares:0;
    if(ddmEq>0&&wt.ddm>0) vrs.push({method:"Dividend Discount Model (Gordon Growth)",short:"DDM",
      low:ddmEq*0.80,mid:ddmEq,high:ddmEq*1.25,weight:wt.ddm,
      desc:`DPS ₹${dps} | Ke ${pct(ke*100)} | Div Growth ${pct(divG*100)} | Per Share: ${fmtPS(ddmPS)}`});

    // 7 SOTP
    if(sotpEq>0&&wt.sotp>0) vrs.push({method:"Sum of Parts (SOTP) — Segment-wise Valuation",short:"SOTP",
      low:sotpEq*0.80,mid:sotpEq,high:sotpEq*1.25,weight:wt.sotp,
      desc:`${segs.filter(s=>num(s.value)>0).length} business segments | Conglomerate disc: ${f.conglomDisc}% | Net Debt: ${fmtCr(netDebt)}`});

    // 8 Berkus
    if(isPre&&wt.berkus>0){ const M=[1.5,2.0,2.0,1.5,2.0];
      const mid=[num(f.bIdea),num(f.bProto),num(f.bTeam),num(f.bPart),num(f.bSales)].reduce((s,v,i)=>s+(v/100)*M[i],0);
      vrs.push({method:"Berkus Method (Pre-Revenue Startup)",short:"Berkus",
        low:mid*0.60,mid,high:mid*1.55,weight:wt.berkus,desc:`5 risk-reduction factors | Max ₹9 Cr (India 2025)`}); }

    // 9 Scorecard
    if(isPre&&wt.sc>0){ const base=["saas","it_services","ecommerce","fintech"].includes(f.industry)?8:["fmcg","pharma","healthcare"].includes(f.industry)?6:4;
      const adj=0.30*(num(f.rMgmt)/5)+0.25*0.85+0.25*(rs/5)+0.20*0.80;
      const mid=Math.max(0.5,base*adj*2.2);
      vrs.push({method:"Scorecard Method (Pre-Revenue Startup)",short:"Scorecard",
        low:Math.max(0.3,mid*0.55),mid,high:mid*1.8,weight:wt.sc,desc:`Sector benchmark ₹${base}–${base*3} Cr | Adjusted for team, market, risk`}); }

    // Normalize
    const tw=vrs.reduce((s,r)=>s+r.weight,0);
    const norm=vrs.map(r=>({...r,weight:tw>0?r.weight/tw:0}));
    const eq={
      low:norm.reduce((s,r)=>s+r.low*r.weight,0),
      mid:norm.reduce((s,r)=>s+r.mid*r.weight,0),
      high:norm.reduce((s,r)=>s+r.high*r.weight,0),
    };

    // First Chicago
    const fcBull=!isPre?calcDCF(ebitda,capex,tax,num(f.bullGrowth),tg,wacc*0.90):0;
    const fcBear=!isPre?calcDCF(ebitda,capex,tax,num(f.bearGrowth),tg,wacc*1.10):0;
    const bp=num(f.bullProb)/100, brp=num(f.bearProb)/100, bsp=1-bp-brp;
    const fcVal=fcBull>0&&fcBear>0?
      (Math.max(0,fcBull-netDebt)*bp + eq.mid*Math.max(0,bsp) + Math.max(0,fcBear-netDebt)*brp)
      : 0;

    const perShare=shares>0?eq.mid/shares:0;
    const cmp=num(f.cmp);
    const premDisc=cmp>0&&perShare>0?((perShare/cmp)-1)*100:0;

    const sg=sensGrid(ebitda,capex,tax,netDebt,shares,wacc,gr,tg);

    return {
      vrs:norm, eq, wacc, ke, netDebt, rs, ddmPS, perShare, premDisc, fcVal, sg,
      m:{rev,ebitda,np,ebitdaMgn:rev>0?(ebitda/rev)*100:0,npMgn:rev>0?(np/rev)*100:0,
         nw,roe:nw>0?(np/nw)*100:0,evMid:eq.mid+netDebt,
         impEVRev:rev>0?(eq.mid+netDebt)/rev:0,impEVEBIT:ebitda>0?(eq.mid+netDebt)/ebitda:0,
         impPE:np>0?eq.mid/np:0,shares,cmp,mktCap:shares>0&&cmp>0?shares*cmp:0},
    };
  },[step,f,segs,isPre]);

  /* ── STEP 1: Profile ─────────────────────────────────────────────── */
  const s1 = (
    <div className="space-y-5">
      <div className="mb-6"><div className="flex items-center gap-3 mb-1"><span className="w-8 h-8 rounded-full bg-blue-600 text-white flex items-center justify-center font-extrabold text-sm">1</span><h2 className="text-xl font-extrabold text-slate-900">Business Profile</h2></div><p className="text-slate-500 text-sm ml-11">Basic details — determines which valuation methods apply</p></div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div><Lbl c="Company Name" h="Optional — appears on report"/><Inp value={f.name} onChange={v=>set("name",v)} placeholder="e.g. Reliance Industries Ltd"/></div>
        <div><Lbl c="Entity Type"/><Sel value={f.entity} onChange={v=>set("entity",v)}>
          <option value="pvt_ltd">Private Limited (Pvt Ltd)</option>
          <option value="opc">One Person Company (OPC)</option>
          <option value="public_listed">Public Listed Company (BSE / NSE)</option>
          <option value="public_unlisted">Public Unlisted Company</option>
          <option value="llp">LLP</option>
          <option value="partnership">Partnership / Proprietorship</option>
          <option value="startup">Startup (Registered / Unregistered)</option>
          <option value="trust_ngo">Trust / NGO / Section 8</option>
          <option value="other">Other</option>
        </Sel></div>
        <div><Lbl c="Industry / Sector *" h="46 sectors — affects multiples significantly"/><Sel value={f.industry} onChange={v=>set("industry",v)}>
          {IND_GROUPS.map(g=>(
            <optgroup key={g.label} label={`── ${g.label}`}>
              {g.keys.map(k=><option key={k} value={k}>{IND[k]?.label}</option>)}
            </optgroup>
          ))}
        </Sel></div>
        <div><Lbl c="Business Stage *" h="Determines method weights"/><Sel value={f.stage} onChange={v=>set("stage",v)}>
          <option value="pre_revenue">Pre-Revenue (Idea / MVP)</option>
          <option value="early">Early Stage (0–3 yr, some revenue)</option>
          <option value="growth">Growth Stage (3–7 yr, growing fast)</option>
          <option value="mature">Mature / Established (7+ yr, stable)</option>
          <option value="declining">Declining / Turnaround</option>
        </Sel></div>
        <div><Lbl c="Years in Operation"/><Inp value={f.years} onChange={v=>set("years",v)} placeholder="e.g. 15" type="number"/></div>
        <div><Lbl c="Employees (approx)"/><Inp value={f.employees} onChange={v=>set("employees",v)} placeholder="e.g. 2,36,000" type="number"/></div>
        <div><Lbl c="Purpose of Valuation"/><Sel value={f.purpose} onChange={v=>set("purpose",v)}>
          <option value="internal">Internal / Strategic Assessment</option>
          <option value="investment">Investor / Fundraising / VC</option>
          <option value="ma">M&A — Buy side or Sell side</option>
          <option value="tax">Income Tax / Rule 11UA / Angel Tax</option>
          <option value="loan">Bank Loan / Credit Facility</option>
          <option value="legal">Legal / NCLT / IBC Proceedings</option>
          <option value="esop">ESOP Grant / Exercise Price</option>
          <option value="fdi">FDI / FEMA Compliance</option>
          <option value="ipo">IPO Pricing / Pre-IPO</option>
          <option value="other">Other</option>
        </Sel></div>
        <div><Lbl c="Financial Inputs Unit *"/><div className="flex gap-3 mt-1">
          {[["lakhs","₹ Lakhs"],["crores","₹ Crores"]].map(([v,l])=>(
            <button key={v} onClick={()=>set("unit",v)} className={`flex-1 py-2.5 rounded-xl text-sm font-bold border-2 transition ${f.unit===v?"border-blue-500 bg-blue-50 text-blue-700":"border-slate-200 text-slate-500 hover:border-slate-300"}`}>{l}</button>
          ))}
        </div></div>
      </div>
      {/* Toggles */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className={`rounded-2xl p-4 border-2 cursor-pointer transition ${f.isListed==="yes"?"border-blue-400 bg-blue-50":"border-slate-200 hover:border-slate-300"}`}
          onClick={()=>set("isListed",f.isListed==="yes"?"no":"yes")}>
          <div className="flex items-center gap-3">
            <div className={`w-5 h-5 rounded border-2 flex items-center justify-center ${f.isListed==="yes"?"border-blue-600 bg-blue-600":"border-slate-300"}`}>
              {f.isListed==="yes"&&<span className="text-white text-xs">✓</span>}
            </div>
            <div><p className="font-bold text-slate-800 text-sm">Listed Public Company</p><p className="text-xs text-slate-400">BSE / NSE listed — enter CMP, shares, dividend</p></div>
          </div>
        </div>
        <div className={`rounded-2xl p-4 border-2 cursor-pointer transition ${f.isSotp==="yes"?"border-purple-400 bg-purple-50":"border-slate-200 hover:border-slate-300"}`}
          onClick={()=>set("isSotp",f.isSotp==="yes"?"no":"yes")}>
          <div className="flex items-center gap-3">
            <div className={`w-5 h-5 rounded border-2 flex items-center justify-center ${f.isSotp==="yes"?"border-purple-600 bg-purple-600":"border-slate-300"}`}>
              {f.isSotp==="yes"&&<span className="text-white text-xs">✓</span>}
            </div>
            <div><p className="font-bold text-slate-800 text-sm">Conglomerate / SOTP</p><p className="text-xs text-slate-400">Multiple business segments — like Reliance, Tata, Mahindra</p></div>
          </div>
        </div>
      </div>
      <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 text-xs text-blue-700">
        <strong>🧠 Smart Engine:</strong> Tool automatically selects methods by stage — Pre-revenue: Berkus+Scorecard · Early: Revenue multiples · Growth: DCF+Multiples · Mature: DCF+EBITDA+P/E+DDM · Listed: adds per-share intrinsic value vs CMP · SOTP: segment-wise with conglomerate discount.
      </div>
    </div>
  );

  /* ── STEP 2A: Startup ────────────────────────────────────────────── */
  const s2startup = (
    <div className="space-y-5">
      <div className="mb-6"><div className="flex items-center gap-3 mb-1"><span className="w-8 h-8 rounded-full bg-blue-600 text-white flex items-center justify-center font-extrabold text-sm">2</span><h2 className="text-xl font-extrabold text-slate-900">Startup Scoring (Berkus Method)</h2></div><p className="text-slate-500 text-sm ml-11">Rate 5 risk-reduction factors — India 2025 benchmarks</p></div>
      <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 text-xs text-amber-700">
        <strong>Berkus Method:</strong> Each factor adds up to ₹1.5–₹2 Cr. Maximum pre-revenue valuation = <strong>₹9 Crore</strong> (India 2025 angel / seed benchmark).
      </div>
      {([
        {key:"bIdea", label:"Sound Idea / Problem-Solution Fit",      max:"₹1.5 Cr", hint:"How validated is the problem? Does your solution clearly address a real, painful problem?"},
        {key:"bProto",label:"Working Prototype / MVP",                max:"₹2.0 Cr", hint:"Functional product, demo, or MVP that customers can actually use?"},
        {key:"bTeam", label:"Quality of Management Team",             max:"₹2.0 Cr", hint:"Domain expertise, IIT/IIM/IIT pedigree, relevant startup experience, serial founder?"},
        {key:"bPart", label:"Strategic Relationships / Partnerships", max:"₹1.5 Cr", hint:"LOIs, pilot agreements, distribution deals, marquee advisors, accelerator backing?"},
        {key:"bSales",label:"Early Sales / GTM Traction",             max:"₹2.0 Cr", hint:"Paying customers, signed pilots, GMV, letter of intents, waitlist, app downloads?"},
      ] as {key:string;label:string;max:string;hint:string}[]).map(item=>(
        <div key={item.key} className="bg-white border border-slate-200 rounded-xl p-4">
          <div className="flex items-center justify-between mb-1">
            <div><p className="text-sm font-bold text-slate-800">{item.label}</p><p className="text-xs text-slate-400">{item.hint}</p></div>
            <div className="text-right shrink-0 ml-3"><p className="text-2xl font-extrabold text-blue-700">{f[item.key as keyof Frm]}</p><p className="text-xs text-green-600">max {item.max}</p></div>
          </div>
          <input type="range" min={0} max={100} value={f[item.key as keyof Frm]} onChange={e=>set(item.key as keyof Frm,e.target.value)} className="w-full accent-blue-600 mt-2"/>
          <div className="flex justify-between text-xs text-slate-300 mt-1"><span>Absent (0)</span><span>Exceptional (100)</span></div>
        </div>
      ))}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div><Lbl c="Annual Revenue (if any)" h={unitL}/><Inp value={f.rev0} onChange={v=>set("rev0",v)} placeholder="0" type="number"/></div>
        <div><Lbl c="Net Worth / Assets" h={unitL}/><Inp value={f.netWorth} onChange={v=>set("netWorth",v)} placeholder="0" type="number"/></div>
      </div>
    </div>
  );

  /* ── STEP 2B: Financials ─────────────────────────────────────────── */
  const s2fin = (
    <div className="space-y-5">
      <div className="mb-6"><div className="flex items-center gap-3 mb-1"><span className="w-8 h-8 rounded-full bg-blue-600 text-white flex items-center justify-center font-extrabold text-sm">2</span><h2 className="text-xl font-extrabold text-slate-900">Financial Data</h2></div><p className="text-slate-500 text-sm ml-11">Latest completed FY figures in {unitL}</p></div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div><Lbl c={`Revenue / Turnover * (${unitL})`}/><Inp value={f.rev0} onChange={v=>set("rev0",v)} placeholder={f.unit==="lakhs"?"e.g. 8,50,000":"e.g. 8,500"} type="number"/>
          {num(f.rev0)>0&&<p className="text-xs text-green-600 mt-1">{fmtCr(toCr(num(f.rev0),f.unit))}</p>}</div>
        <div><Lbl c={`EBITDA * (${unitL})`} h="Earnings before Interest, Tax, Depreciation & Amortisation"/><Inp value={f.ebitda0} onChange={v=>set("ebitda0",v)} placeholder="0" type="number"/>
          {num(f.rev0)>0&&num(f.ebitda0)>0&&<p className="text-xs text-blue-600 mt-1">Margin: {pct((num(f.ebitda0)/num(f.rev0))*100)}</p>}</div>
        <div><Lbl c={`Net Profit After Tax (PAT) (${unitL})`}/><Inp value={f.np0} onChange={v=>set("np0",v)} placeholder="0" type="number"/></div>
        <div><Lbl c="Effective Tax Rate (%)" h="Actual effective rate, not statutory"/><Inp value={f.taxRate} onChange={v=>set("taxRate",v)} placeholder="25" type="number"/></div>
        <div><Lbl c={`Total Debt / Borrowings (${unitL})`} h="All loans: term + working capital + debentures"/><Inp value={f.debt} onChange={v=>set("debt",v)} placeholder="0" type="number"/></div>
        <div><Lbl c={`Cash & Bank Balances (${unitL})`} h="Cash + bank + liquid investments + FDs"/><Inp value={f.cash} onChange={v=>set("cash",v)} placeholder="0" type="number"/></div>
        <div><Lbl c={`Net Worth / Book Value * (${unitL})`} h="Total Equity = Total Assets – Total Liabilities"/><Inp value={f.netWorth} onChange={v=>set("netWorth",v)} placeholder="0" type="number"/></div>
        <div><Lbl c={`Annual CapEx (${unitL})`} h="Capital expenditure — purchase of fixed assets"/><Inp value={f.capex} onChange={v=>set("capex",v)} placeholder="0" type="number"/></div>
      </div>
      {/* Snapshot */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          {l:"Revenue",  v:fmtCr(toCr(num(f.rev0),f.unit))},
          {l:"EBITDA",   v:fmtCr(toCr(num(f.ebitda0),f.unit))},
          {l:"Net Profit",v:fmtCr(toCr(num(f.np0),f.unit))},
          {l:"Net Debt", v:fmtCr(toCr(Math.max(0,num(f.debt)-num(f.cash)),f.unit))},
        ].map(m=>(
          <div key={m.l} className="bg-slate-50 border border-slate-200 rounded-xl p-3 text-center">
            <p className="text-xs text-slate-400 font-semibold">{m.l}</p>
            <p className="font-extrabold text-slate-800 text-sm mt-0.5">{m.v||"—"}</p>
          </div>
        ))}
      </div>
    </div>
  );

  /* ── STEP 3: SOTP ────────────────────────────────────────────────── */
  const s3sotp = (
    <div className="space-y-5">
      <div className="mb-6"><div className="flex items-center gap-3 mb-1"><span className="w-8 h-8 rounded-full bg-purple-600 text-white flex items-center justify-center font-extrabold text-sm">3</span><h2 className="text-xl font-extrabold text-slate-900">SOTP — Business Segments</h2></div><p className="text-slate-500 text-sm ml-11">Value each business separately — like Reliance (O2C + Retail + Jio + New Energy)</p></div>
      <div className="bg-purple-50 border border-purple-200 rounded-xl p-4 text-xs text-purple-700 space-y-1">
        <p><strong>How to use:</strong> Add each business segment. Enter the financial metric (EBITDA/Revenue/NAV) and the appropriate industry multiple. The tool will sum all segment EVs, apply conglomerate discount, and subtract net debt.</p>
        <p><strong>Example (Reliance):</strong> O2C: EBITDA ₹65,000 Cr × 8x = ₹5.2L Cr | Retail: EBITDA ₹20,000 Cr × 30x = ₹6L Cr | Jio: EBITDA ₹55,000 Cr × 18x = ₹9.9L Cr | New Energy: NAV ₹50,000 Cr × 1x</p>
      </div>
      <div className="space-y-3">
        {segs.map((sg,idx)=>(
          <div key={sg.id} className="bg-white border border-slate-200 rounded-2xl p-4">
            <div className="flex items-center justify-between mb-3">
              <p className="font-bold text-slate-700">Segment {idx+1}</p>
              {segs.length>1&&<button onClick={()=>setSegs(p=>p.filter(s=>s.id!==sg.id))} className="text-xs text-red-500 hover:text-red-700 font-semibold">✕ Remove</button>}
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div><Lbl c="Segment Name"/><Inp value={sg.name} onChange={v=>setSegs(p=>p.map(s=>s.id===sg.id?{...s,name:v}:s))} placeholder="e.g. O2C Business"/></div>
              <div><Lbl c="Valuation Basis"/><Sel value={sg.basis} onChange={v=>setSegs(p=>p.map(s=>s.id===sg.id?{...s,basis:v as Seg["basis"]}:s))}>
                <option value="ebitda">EBITDA × Multiple</option>
                <option value="revenue">Revenue × Multiple</option>
                <option value="nav">NAV / Investment Value (× 1 or custom)</option>
                <option value="pe">Net Profit × P/E</option>
              </Sel></div>
              <div><Lbl c={`${sg.basis==="ebitda"?"EBITDA":sg.basis==="revenue"?"Revenue":sg.basis==="pe"?"Net Profit":"NAV / Investment"} (${unitL})`}/><Inp value={sg.value} onChange={v=>setSegs(p=>p.map(s=>s.id===sg.id?{...s,value:v}:s))} placeholder="0" type="number"/></div>
              <div><Lbl c="Multiple to Apply" h={`Industry: ${IND[sg.industry]?.evE[1]}x EBITDA / ${IND[sg.industry]?.evR[1]}x Rev`}/><Inp value={sg.multiple} onChange={v=>setSegs(p=>p.map(s=>s.id===sg.id?{...s,multiple:v}:s))} placeholder="10" type="number"/></div>
              <div className="sm:col-span-2"><Lbl c="Segment Industry (for reference multiples)"/><Sel value={sg.industry} onChange={v=>setSegs(p=>p.map(s=>s.id===sg.id?{...s,industry:v}:s))}>
                {IND_GROUPS.map(g=>(
                  <optgroup key={g.label} label={`── ${g.label}`}>{g.keys.map(k=><option key={k} value={k}>{IND[k]?.label}</option>)}</optgroup>
                ))}
              </Sel></div>
            </div>
            {num(sg.value)>0&&num(sg.multiple)>0&&(
              <div className="mt-3 bg-purple-50 rounded-xl px-4 py-2 flex items-center justify-between">
                <span className="text-xs text-purple-600 font-medium">Segment EV ({sg.basis.toUpperCase()} × {sg.multiple}x)</span>
                <span className="font-extrabold text-purple-800">{fmtCr(toCr(num(sg.value),f.unit)*num(sg.multiple))}</span>
              </div>
            )}
          </div>
        ))}
      </div>
      {segs.length<6&&(
        <button onClick={()=>setSegs(p=>[...p,{id:Date.now(),name:`Segment ${p.length+1}`,basis:"ebitda",value:"",multiple:"10",industry:"other"}])}
          className="w-full py-3 rounded-xl border-2 border-dashed border-slate-300 text-slate-500 text-sm font-semibold hover:border-blue-400 hover:text-blue-600 transition">
          + Add Business Segment (max 6)
        </button>
      )}
      <div>
        <Lbl c="Conglomerate Discount (%)" h="Applied to total SOTP EV — 10–20% is typical for Indian conglomerates"/>
        <div className="flex gap-3 items-center">
          <Inp value={f.conglomDisc} onChange={v=>set("conglomDisc",v)} placeholder="10" type="number"/>
          <span className="text-sm text-slate-500 whitespace-nowrap">% discount</span>
        </div>
        <p className="text-xs text-slate-400 mt-1">0% = pure sum · 10% = typical conglomerate · 20% = high complexity discount</p>
      </div>
      {/* SOTP Preview */}
      {segs.some(s=>num(s.value)>0)&&(
        <div className="bg-slate-50 rounded-2xl border border-slate-200 p-4">
          <p className="font-bold text-slate-700 mb-3 text-sm">📊 SOTP Preview</p>
          {segs.filter(s=>num(s.value)>0&&num(s.multiple)>0).map(s=>(
            <div key={s.id} className="flex justify-between text-sm py-1 border-b border-slate-100">
              <span className="text-slate-600">{s.name}</span>
              <span className="font-semibold text-slate-800">{fmtCr(toCr(num(s.value),f.unit)*num(s.multiple))}</span>
            </div>
          ))}
          <div className="flex justify-between text-sm py-1 mt-1">
            <span className="text-slate-500">Less: Conglomerate Discount ({f.conglomDisc}%)</span>
            <span className="text-red-500">−{fmtCr(segs.reduce((s2,s)=>s2+toCr(num(s.value),f.unit)*num(s.multiple),0)*num(f.conglomDisc)/100)}</span>
          </div>
          <div className="flex justify-between font-extrabold text-base pt-2 border-t border-slate-300 mt-1">
            <span>Net Equity Value (before debt adj.)</span>
            <span className="text-purple-700">{fmtCr(calcSOTP(segs.map(s=>({...s,value:String(toCr(num(s.value),f.unit))})),0,num(f.conglomDisc)))}</span>
          </div>
        </div>
      )}
    </div>
  );

  /* ── STEP 4: Listed Company ──────────────────────────────────────── */
  const s4listed = (
    <div className="space-y-5">
      <div className="mb-6"><div className="flex items-center gap-3 mb-1"><span className="w-8 h-8 rounded-full bg-blue-600 text-white flex items-center justify-center font-extrabold text-sm">4</span><h2 className="text-xl font-extrabold text-slate-900">Listed Company Data</h2></div><p className="text-slate-500 text-sm ml-11">CMP, shares outstanding, dividend — enables per-share intrinsic value</p></div>
      <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 text-xs text-blue-700">
        <strong>Output:</strong> Tool will calculate per-share intrinsic value and compare it with CMP to show Premium (+) or Discount (−) to current market price — the most important output for stock investors.
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div><Lbl c="Current Market Price (CMP) — ₹" h="Share price on BSE / NSE as of valuation date"/><Inp value={f.cmp} onChange={v=>set("cmp",v)} placeholder="e.g. 1420.50" type="number"/></div>
        <div><Lbl c="Shares Outstanding (Crores)" h="Total shares issued — find in Annual Report / Screener.in"/><Inp value={f.sharesOuts} onChange={v=>set("sharesOuts",v)} placeholder="e.g. 675" type="number"/>
          {num(f.cmp)>0&&num(f.sharesOuts)>0&&<p className="text-xs text-blue-600 mt-1">Market Cap: {fmtCr(num(f.cmp)*num(f.sharesOuts))}</p>}</div>
        <div><Lbl c="BSE / NSE Stock Code" h="Optional — for reference only"/><Inp value={f.bseCode} onChange={v=>set("bseCode",v)} placeholder="e.g. 500325 / RELIANCE"/></div>
        <div><Lbl c="Promoter Holding (%)" h="Higher promoter stake = positive signal"/><Inp value={f.promoterPct} onChange={v=>set("promoterPct",v)} placeholder="e.g. 50.4" type="number"/></div>
        <div><Lbl c="Annual Dividend Per Share (DPS) — ₹" h="For DDM — enter 0 if no dividend"/><Inp value={f.annualDps} onChange={v=>set("annualDps",v)} placeholder="e.g. 10" type="number"/></div>
        <div><Lbl c="Expected Dividend Growth Rate (%)" h="Long-term sustainable dividend growth"/><Inp value={f.divGrowth} onChange={v=>set("divGrowth",v)} placeholder="6" type="number"/></div>
      </div>
      {num(f.annualDps)>0&&(
        <div className="bg-green-50 border border-green-200 rounded-xl p-4 text-xs text-green-700">
          <strong>DDM will be included:</strong> Dividend Discount Model (Gordon Growth) = DPS × (1+g) ÷ (Ke − g). This gives fundamental value per share from dividend stream. DDM weight = 13% for mature companies.
        </div>
      )}
    </div>
  );

  /* ── STEP 5: Growth & Scenarios ─────────────────────────────────── */
  const s5growth = (
    <div className="space-y-5">
      <div className="mb-6"><div className="flex items-center gap-3 mb-1"><span className="w-8 h-8 rounded-full bg-blue-600 text-white flex items-center justify-center font-extrabold text-sm">5</span><h2 className="text-xl font-extrabold text-slate-900">Growth Assumptions</h2></div><p className="text-slate-500 text-sm ml-11">Used in DCF — also powers First Chicago 3-scenario analysis</p></div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
        <div>
          <Lbl c="Base Case Revenue Growth (next 5 yr avg) *" h="Conservative, realistic estimate"/>
          <div className="flex gap-2 items-center"><Inp value={f.growthRate} onChange={v=>set("growthRate",v)} placeholder="15" type="number"/><span className="text-sm text-slate-500 whitespace-nowrap">% per yr</span></div>
          {num(f.ebitda0)>0&&(
            <div className="mt-3 bg-slate-50 rounded-xl border border-slate-200 p-3">
              <p className="text-xs text-slate-500 font-semibold mb-2">5-Year EBITDA Projection (Base):</p>
              <div className="grid grid-cols-5 gap-1 text-center">
                {[1,2,3,4,5].map(yr=>{
                  const b=toCr(num(f.ebitda0),f.unit), g=num(f.growthRate)/100;
                  return <div key={yr} className="bg-white rounded-lg p-1.5 border border-slate-100"><p className="text-xs text-slate-400">Y{yr}</p><p className="text-xs font-bold text-blue-700">{fmtCr(b*Math.pow(1+g,yr))}</p></div>;
                })}
              </div>
            </div>
          )}
        </div>
        <div>
          <Lbl c="Terminal Growth Rate (%)" h="India long-run GDP growth ~4%"/>
          <div className="flex gap-2 items-center"><Inp value={f.termG} onChange={v=>set("termG",v)} placeholder="4" type="number"/><span className="text-sm text-slate-500 whitespace-nowrap">% p.a.</span></div>
          <div className="mt-3 bg-slate-50 rounded-xl border border-slate-200 p-3 text-xs space-y-1">
            {[["Large cap / Stable","3 – 4%"],["Growth company","4 – 5%"],["Sector leader","4 – 6%"],["Declining","1 – 2%"]].map(([l,r])=>(
              <div key={l} className="flex justify-between"><span className="text-slate-500">{l}</span><span className="font-bold text-slate-700">{r}</span></div>
            ))}
          </div>
        </div>
      </div>
      {/* First Chicago Scenarios */}
      <div className="bg-purple-50 border border-purple-200 rounded-2xl p-5">
        <p className="font-extrabold text-purple-900 mb-1">🎯 First Chicago Method — 3-Scenario DCF</p>
        <p className="text-xs text-purple-600 mb-4">Probability-weighted average of Bull, Base, and Bear case valuations</p>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="bg-green-50 border border-green-200 rounded-xl p-3">
            <p className="font-bold text-green-700 text-sm mb-2">🐂 Bull Case</p>
            <Lbl c="Growth Rate (%)" h="Optimistic scenario"/><Inp value={f.bullGrowth} onChange={v=>set("bullGrowth",v)} placeholder="35" type="number"/>
            <div className="mt-2"><Lbl c="Probability (%)"/><Inp value={f.bullProb} onChange={v=>set("bullProb",v)} placeholder="25" type="number"/></div>
          </div>
          <div className="bg-blue-50 border border-blue-200 rounded-xl p-3">
            <p className="font-bold text-blue-700 text-sm mb-2">📊 Base Case</p>
            <p className="text-sm font-semibold text-slate-600 mt-1">Growth: {f.growthRate}%</p>
            <p className="text-xs text-slate-400 mt-1 mb-2">(from above)</p>
            <div className="mt-2"><Lbl c="Probability (%)"/>
              <div className="bg-white rounded-xl border border-blue-200 px-3 py-2.5 text-sm font-bold text-blue-700">
                {Math.max(0,100-num(f.bullProb)-num(f.bearProb))}%
              </div>
            </div>
          </div>
          <div className="bg-red-50 border border-red-200 rounded-xl p-3">
            <p className="font-bold text-red-700 text-sm mb-2">🐻 Bear Case</p>
            <Lbl c="Growth Rate (%)" h="Pessimistic scenario"/><Inp value={f.bearGrowth} onChange={v=>set("bearGrowth",v)} placeholder="5" type="number"/>
            <div className="mt-2"><Lbl c="Probability (%)"/><Inp value={f.bearProb} onChange={v=>set("bearProb",v)} placeholder="25" type="number"/></div>
          </div>
        </div>
        <p className="text-xs text-purple-500 mt-3">Bull + Base + Bear = 100% | Base = {Math.max(0,100-num(f.bullProb)-num(f.bearProb))}%</p>
      </div>
    </div>
  );

  /* ── STEP 6: Risk ────────────────────────────────────────────────── */
  const riskN = isPre?3:f.isSotp==="yes"&&f.isListed==="yes"?6:f.isSotp==="yes"||f.isListed==="yes"?5:5;
  const s6risk = (
    <div className="space-y-4">
      <div className="mb-6"><div className="flex items-center gap-3 mb-1"><span className="w-8 h-8 rounded-full bg-blue-600 text-white flex items-center justify-center font-extrabold text-sm">{riskN}</span><h2 className="text-xl font-extrabold text-slate-900">Risk Assessment</h2></div><p className="text-slate-500 text-sm ml-11">6 factors — adjusts WACC and valuation range</p></div>
      <div className="bg-purple-50 border border-purple-200 rounded-xl p-3 text-xs text-purple-700">
        <strong>Impact:</strong> Each factor rated 1–5. Average score {"<"}3 adds up to +5% risk premium to WACC, directly reducing valuation. Score 5 across all = lowest discount rate = highest valuation.
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <RiskSlider label="Management Quality & Depth"         hint="CEO/MD experience, bench strength, board quality, succession planning"  value={f.rMgmt} onChange={v=>set("rMgmt",v)}/>
        <RiskSlider label="Market Position / Competitive Moat" hint="Brand, market share, patents, switching costs, network effects, pricing power" value={f.rMkt} onChange={v=>set("rMkt",v)}/>
        <RiskSlider label="Revenue Predictability / Visibility" hint="Recurring revenue, long-term contracts, order book, subscription model"  value={f.rVis} onChange={v=>set("rVis",v)}/>
        <RiskSlider label="Customer Concentration"             hint="5=well-diversified (no single customer >5%) | 1=single customer dependent" value={f.rCust} onChange={v=>set("rCust",v)}/>
        <RiskSlider label="Regulatory & Compliance Risk"       hint="5=low regulatory exposure, fully compliant | 1=high ESG/regulatory risk"  value={f.rReg} onChange={v=>set("rReg",v)}/>
        <RiskSlider label="Financial Health / Leverage"        hint="5=debt-free/healthy balance sheet | 1=over-leveraged / stressed"          value={f.rFin} onChange={v=>set("rFin",v)}/>
      </div>
      <div className="bg-slate-50 rounded-xl border border-slate-200 p-4">
        {(()=>{const avg=(num(f.rMgmt)+num(f.rMkt)+num(f.rVis)+num(f.rCust)+num(f.rReg)+num(f.rFin))/6; const pctW=((avg-1)/4)*100; const col=avg>=4?"bg-green-500":avg>=3?"bg-yellow-400":avg>=2?"bg-orange-400":"bg-red-500"; return (<><div className="flex items-center justify-between mb-2"><p className="text-xs font-semibold text-slate-600">Overall Risk Score</p><span className="text-sm font-extrabold text-slate-700">{avg.toFixed(1)}/5</span></div><div className="h-3 bg-slate-200 rounded-full overflow-hidden"><div className={`h-full rounded-full ${col} transition-all`} style={{width:`${pctW}%`}}/></div><p className="text-xs text-slate-400 mt-1">Risk premium added to WACC: +{pct(Math.max(0,(3-avg))*2.5)}</p></>);})()}
      </div>
    </div>
  );

  /* ── STEP 7: Results ─────────────────────────────────────────────── */
  const s7results = result && (
    <div className="space-y-8 print:space-y-6">
      {/* Header */}
      <div className="text-center print:mb-4">
        <p className="text-xs font-semibold uppercase tracking-widest text-slate-400 mb-1">Valuation Report</p>
        <h2 className="text-3xl font-extrabold text-slate-900">{f.name||"Business Valuation"}</h2>
        <p className="text-slate-500 text-sm mt-1">{IND[f.industry]?.label} · {f.stage.replace(/_/g," ")} · {f.entity.replace(/_/g," ")}</p>
        {f.isListed==="yes"&&f.bseCode&&<p className="text-blue-600 text-xs font-semibold mt-0.5">Stock: {f.bseCode} | CMP: {fmtPS(num(f.cmp))} | Market Cap: {fmtCr(result.m.mktCap)}</p>}
      </div>

      {/* Valuation Summary */}
      <div className="rounded-3xl overflow-hidden border border-slate-200 shadow-lg print:shadow-none">
        <div className="py-3 px-5 text-center text-sm font-bold text-white" style={{background:"linear-gradient(135deg,#1d4ed8,#7c3aed)"}}>
          ⚡ Estimated Business Valuation (Equity Value) — Weighted Average of All Methods
        </div>
        <div className="grid grid-cols-3 divide-x divide-slate-200 bg-white">
          {[
            {label:"Conservative",val:result.eq.low, sub:"Bear case — low multiples",   col:"text-orange-600",bg:"bg-orange-50"},
            {label:"Base Case",   val:result.eq.mid, sub:"Median — most probable",       col:"text-blue-700",  bg:"bg-blue-50"},
            {label:"Optimistic",  val:result.eq.high,sub:"Bull case — high multiples",   col:"text-green-700", bg:"bg-green-50"},
          ].map(c=>(
            <div key={c.label} className={`p-5 text-center ${c.bg}`}>
              <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-1">{c.label}</p>
              <p className={`text-2xl md:text-3xl font-extrabold ${c.col}`}>{fmtCr(c.val)}</p>
              <p className="text-xs text-slate-400 mt-1">{c.sub}</p>
            </div>
          ))}
        </div>
        <div className="bg-slate-50 px-5 py-3 border-t border-slate-200 flex flex-wrap gap-4 justify-center text-xs text-slate-500">
          <span>EV (Base): <strong className="text-slate-800">{fmtCr(result.m.evMid)}</strong></span>
          <span>Net Debt: <strong className="text-slate-800">{fmtCr(result.netDebt)}</strong></span>
          <span>WACC: <strong className="text-slate-800">{pct(result.wacc*100)}</strong></span>
          <span>Risk Score: <strong className="text-slate-800">{result.rs.toFixed(1)}/5</strong></span>
        </div>
      </div>

      {/* Per-Share Value (Listed Companies) */}
      {f.isListed==="yes"&&result.perShare>0&&(
        <div className={`rounded-2xl p-6 border-2 ${result.premDisc>=0?"border-green-300 bg-green-50":"border-red-300 bg-red-50"}`}>
          <p className="text-xs font-semibold uppercase tracking-widest mb-3 text-slate-500">📊 Per Share Intrinsic Value vs Market Price</p>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-center">
            <div><p className="text-xs text-slate-400 mb-1">Current Market Price</p><p className="text-2xl font-extrabold text-slate-800">{fmtPS(num(f.cmp))}</p></div>
            <div><p className="text-xs text-slate-400 mb-1">Intrinsic Value (Base)</p><p className={`text-2xl font-extrabold ${result.premDisc>=0?"text-green-700":"text-blue-700"}`}>{fmtPS(result.perShare)}</p></div>
            <div><p className="text-xs text-slate-400 mb-1">Premium / Discount</p><p className={`text-2xl font-extrabold ${result.premDisc>=0?"text-green-700":"text-red-600"}`}>{result.premDisc>=0?"+":""}{result.premDisc.toFixed(1)}%</p></div>
            <div><p className="text-xs text-slate-400 mb-1">Verdict</p><p className={`text-lg font-extrabold ${result.premDisc>=15?"text-green-700":result.premDisc>=0?"text-amber-500":result.premDisc>=-15?"text-orange-600":"text-red-600"}`}>{result.premDisc>=15?"Undervalued 🟢":result.premDisc>=0?"Fair / Slight Disc. 🟡":result.premDisc>=-15?"Slightly Overvalued 🟠":"Overvalued 🔴"}</p></div>
          </div>
          {result.ddmPS>0&&<p className="text-xs text-slate-500 mt-3 text-center">DDM Intrinsic Value: <strong>{fmtPS(result.ddmPS)}</strong> per share (Gordon Growth: DPS × (1+g) / (Ke − g))</p>}
        </div>
      )}

      {/* First Chicago */}
      {result.fcVal>0&&(
        <div className="bg-purple-50 border border-purple-200 rounded-2xl p-5">
          <h3 className="text-base font-extrabold text-purple-900 mb-3">🎯 First Chicago Method — Probability-Weighted Valuation</h3>
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 text-center text-sm">
            {[
              {label:`🐂 Bull (${f.bullProb}%)`,sub:`Growth: ${f.bullGrowth}%`,col:"text-green-700"},
              {label:`📊 Base (${Math.max(0,100-num(f.bullProb)-num(f.bearProb))}%)`,sub:`Growth: ${f.growthRate}%`,col:"text-blue-700"},
              {label:`🐻 Bear (${f.bearProb}%)`,sub:`Growth: ${f.bearGrowth}%`,col:"text-red-600"},
              {label:"⚡ Weighted Avg",sub:"Probability-weighted",col:"text-purple-700"},
            ].map((c,i)=>(
              <div key={i} className="bg-white rounded-xl border border-purple-200 p-3">
                <p className="text-xs font-semibold text-slate-400 mb-1">{c.label}</p>
                <p className={`text-xl font-extrabold ${c.col}`}>
                  {i===3?fmtCr(result.fcVal):fmtCr(i===0?result.eq.high:i===1?result.eq.mid:result.eq.low)}
                </p>
                <p className="text-xs text-slate-400 mt-0.5">{c.sub}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Method Breakdown */}
      <div>
        <h3 className="text-lg font-extrabold text-slate-900 mb-3">🔍 Method-by-Method Breakdown</h3>
        <div className="overflow-x-auto rounded-2xl border border-slate-200 shadow-sm">
          <table className="w-full text-sm">
            <thead><tr className="bg-slate-800 text-white">
              <th className="text-left px-4 py-3 font-bold">Valuation Method</th>
              <th className="text-center px-3 py-3 font-bold">Weight</th>
              <th className="text-right px-3 py-3 font-bold">Conservative</th>
              <th className="text-right px-3 py-3 font-bold">Base</th>
              <th className="text-right px-3 py-3 font-bold">Optimistic</th>
              {f.sharesOuts&&num(f.sharesOuts)>0&&<th className="text-right px-3 py-3 font-bold">Per Share</th>}
            </tr></thead>
            <tbody>
              {result.vrs.filter(r=>r.weight>0).map((r,i)=>(
                <tr key={r.method} className={i%2===0?"bg-white":"bg-slate-50"}>
                  <td className="px-4 py-3"><p className="font-bold text-slate-800 text-xs">{r.method}</p><p className="text-xs text-slate-400 mt-0.5">{r.desc}</p></td>
                  <td className="px-3 py-3 text-center"><span className="text-xs font-bold px-2 py-1 bg-blue-100 text-blue-700 rounded-full">{pct(r.weight*100)}</span></td>
                  <td className="px-3 py-3 text-right text-xs text-orange-600 font-medium">{fmtCr(r.low)}</td>
                  <td className="px-3 py-3 text-right font-extrabold text-blue-700">{fmtCr(r.mid)}</td>
                  <td className="px-3 py-3 text-right text-xs text-green-700 font-medium">{fmtCr(r.high)}</td>
                  {f.sharesOuts&&num(f.sharesOuts)>0&&<td className="px-3 py-3 text-right text-xs font-semibold text-slate-600">{num(f.sharesOuts)>0?fmtPS(r.mid/num(f.sharesOuts)):"—"}</td>}
                </tr>
              ))}
              <tr className="bg-gradient-to-r from-blue-50 to-purple-50 border-t-2 border-blue-200">
                <td className="px-4 py-3 font-extrabold text-slate-900">⚡ Weighted Average</td>
                <td className="px-3 py-3 text-center text-xs font-bold text-blue-700">100%</td>
                <td className="px-3 py-3 text-right font-bold text-orange-600">{fmtCr(result.eq.low)}</td>
                <td className="px-3 py-3 text-right font-extrabold text-blue-700 text-base">{fmtCr(result.eq.mid)}</td>
                <td className="px-3 py-3 text-right font-bold text-green-700">{fmtCr(result.eq.high)}</td>
                {f.sharesOuts&&num(f.sharesOuts)>0&&<td className="px-3 py-3 text-right font-extrabold text-purple-700">{fmtPS(result.perShare)}</td>}
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* Sensitivity Grid */}
      {result.m.ebitda>0&&(
        <div>
          <h3 className="text-lg font-extrabold text-slate-900 mb-1">🎛️ DCF Sensitivity Analysis</h3>
          <p className="text-xs text-slate-400 mb-3">
            {num(f.sharesOuts)>0?"Per-share value":"Equity value (₹ Cr)"} across WACC (rows) vs Growth Rate (columns) · <span className="bg-blue-100 text-blue-700 px-1 rounded font-bold">Blue</span> = Base Case
          </p>
          <div className="overflow-x-auto rounded-2xl border border-slate-200 shadow-sm">
            <table className="text-xs w-full">
              <thead><tr className="bg-slate-100">
                <th className="px-3 py-2 text-slate-500 font-semibold text-left">WACC \ Growth</th>
                {result.sg.gLvl.map(g=><th key={g} className="px-3 py-2 text-center font-bold text-slate-700">{g.toFixed(0)}%</th>)}
              </tr></thead>
              <tbody>
                {result.sg.wLvl.map((w,wi)=>(
                  <tr key={w} className={wi%2===0?"bg-white":"bg-slate-50"}>
                    <td className="px-3 py-2 font-semibold text-slate-700">{pct(w*100)}</td>
                    {result.sg.grid[wi].map((v,gi)=>{
                      const isBase=wi===2&&gi===2;
                      return <td key={gi} className={`px-3 py-2 text-center font-${isBase?"extrabold":"medium"} ${isBase?"bg-blue-100 text-blue-800 rounded":"text-slate-600"}`}>
                        {num(f.sharesOuts)>0?fmtPS(v):fmtCr(v)}
                      </td>;
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Key Metrics */}
      {result.m.rev>0&&(
        <div>
          <h3 className="text-lg font-extrabold text-slate-900 mb-3">📈 Key Financial Metrics</h3>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {[
              {l:"Revenue",       v:fmtCr(result.m.rev),                        s:"Latest Year"},
              {l:"EBITDA",        v:fmtCr(result.m.ebitda),                     s:`Margin: ${pct(result.m.ebitdaMgn)}`},
              {l:"Net Profit",    v:fmtCr(result.m.np),                         s:`Margin: ${pct(result.m.npMgn)}`},
              {l:"Net Worth",     v:fmtCr(result.m.nw),                         s:`ROE: ${pct(result.m.roe)}`},
              {l:"WACC",          v:pct(result.wacc*100),                        s:"Discount Rate"},
              {l:"Enterprise Val",v:fmtCr(result.m.evMid),                      s:"Base Case EV"},
              {l:"Implied EV/Rev",v:result.m.impEVRev>0?`${result.m.impEVRev.toFixed(1)}x`:"—", s:"Revenue Multiple"},
              {l:"Implied EV/EBITDA",v:result.m.impEVEBIT>0?`${result.m.impEVEBIT.toFixed(1)}x`:"—",s:"EBITDA Multiple"},
            ].map(m=>(
              <div key={m.l} className="bg-white border border-slate-200 rounded-2xl p-4 text-center hover:shadow-sm transition">
                <p className="text-xs text-slate-400 font-semibold mb-1">{m.l}</p>
                <p className="text-xl font-extrabold text-slate-900">{m.v}</p>
                <p className="text-xs text-slate-400 mt-0.5">{m.s}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* WACC Build-Up */}
      <div className="bg-slate-50 border border-slate-200 rounded-2xl p-5">
        <h3 className="text-base font-extrabold text-slate-800 mb-3">🔢 WACC Build-Up — India CAPM (2025-26)</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
          {[
            ["Risk-Free Rate (India 10-yr G-Sec)", pct(RF*100)],
            [`Equity Risk Premium — India (Jan 2026)`, pct(ERP*100)],
            [`Industry Beta — ${IND[f.industry]?.label}`, `${(IND[f.industry]?.beta??1).toFixed(2)}×`],
            ["Size Premium (revenue-based)",        pct(sizeP(result.m.rev)*100)],
            ["Company-Specific Risk Adj.",          pct(Math.max(0,(3-result.rs))*2.5)],
            ["Cost of Equity (Ke)",                 pct(result.ke*100)],
            ["WACC (blended Ke + after-tax Kd)",    pct(result.wacc*100)],
          ].map(([l,v])=>(
            <div key={l} className="flex justify-between bg-white border border-slate-100 rounded-xl px-3 py-2">
              <span className="text-slate-600">{l}</span><span className="font-bold text-slate-900">{v}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Indian Law Reference */}
      <div className="bg-green-50 border border-green-200 rounded-2xl p-5 print:hidden">
        <h3 className="text-sm font-extrabold text-green-900 mb-3">⚖️ Applicable Indian Valuation Laws</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs text-green-800">
          {[
            ["Rule 11UA — Income Tax","FMV of unlisted shares for Sec 56(2)(viib) Angel Tax. NAV or DCF method. 10% safe harbour."],
            ["Companies Act Sec 247","IBBI Registered Valuers mandatory for mergers, ESOP, RPT above threshold."],
            ["FEMA / RBI Pricing","FDI must be at/above FMV. ODI must be at/below FMV. DCF preferred by RBI."],
            ["SEBI ICDR / LODR","Listed companies: registered valuers for preferential allotment, buyback pricing."],
            ["IBC 2016","Resolution value by Registered Valuers — going concern vs liquidation value."],
            ["Income Tax Act Sec 50C/50CA","Transfer of unlisted shares — FMV guidance from AO / registered valuers."],
          ].map(([l,d])=>(
            <div key={l} className="bg-white rounded-xl border border-green-100 p-3">
              <p className="font-bold text-green-900">{l}</p><p className="text-green-700 mt-0.5">{d}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Actions */}
      <div className="flex flex-wrap gap-3 justify-center print:hidden">
        <button onClick={()=>window.print()} className="flex items-center gap-2 px-6 py-3 rounded-xl font-bold text-white text-sm hover:scale-105 transition" style={{background:"linear-gradient(135deg,#1d4ed8,#7c3aed)"}}>🖨️ Print / Save as PDF</button>
        <button onClick={()=>{ setStepIdx(0); setF(DEFAULT); setSegs(DEFAULT_SEGS); }} className="flex items-center gap-2 px-6 py-3 rounded-xl font-bold text-slate-700 border-2 border-slate-300 bg-white hover:bg-slate-50 text-sm transition">🔄 New Valuation</button>
        <Link href="/roc-filing-due-dates" className="flex items-center gap-2 px-6 py-3 rounded-xl font-bold text-purple-700 border-2 border-purple-200 bg-purple-50 hover:bg-purple-100 text-sm transition">📋 ROC Due Dates</Link>
      </div>

      {/* Disclaimer */}
      <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 text-xs text-amber-700">
        <strong>⚠️ Disclaimer:</strong> This tool provides an indicative valuation range for reference only. It is NOT a substitute for a certified valuation report by an IBBI Registered Valuer, Chartered Accountant, or Company Secretary. Industry multiples are based on BSE publicly-listed companies — unlisted companies typically trade at a 20–35% illiquidity discount. This tool does not constitute investment advice. ComplianceSearch.in is not liable for any decisions made based on this report.
      </div>
    </div>
  );

  /* ── STEP CONTENT MAP ────────────────────────────────────────────── */
  const contentMap: Record<number, React.ReactNode> = {
    1: s1,
    2: isPre ? s2startup : s2fin,
    3: s3sotp,
    4: s4listed,
    5: s5growth,
    6: s6risk,
    7: s7results,
  };

  /* ── RENDER ──────────────────────────────────────────────────────── */
  return (
    <main className="min-h-screen bg-white flex flex-col">
      <Navbar />

      {step===1&&(
        <section className="py-12 px-4 text-center print:hidden" style={{background:"linear-gradient(160deg,#eff6ff 0%,#f5f3ff 50%,#fafafa 100%)"}}>
          <div className="inline-flex items-center gap-2 text-sm font-semibold px-4 py-1.5 rounded-full mb-5 border" style={{background:"#eff6ff",borderColor:"#bfdbfe",color:"#1e40af"}}>
            🇮🇳 46 Industries · BSE/NSE Multiples · Listed + SOTP Mode
          </div>
          <h1 className="text-4xl md:text-5xl font-extrabold text-slate-900 mb-4 leading-tight">
            Business{" "}
            <span style={{background:"linear-gradient(90deg,#1d4ed8,#7c3aed)",WebkitBackgroundClip:"text",WebkitTextFillColor:"transparent"}}>
              Valuation Tool
            </span>
          </h1>
          <p className="text-slate-500 max-w-2xl mx-auto text-base leading-relaxed mb-5">
            Investment-banking grade. DCF · EV/EBITDA · Revenue Multiple · P/E · NAV · DDM · SOTP · Berkus · Scorecard · First Chicago. Works for ₹10L startup to ₹20 Lakh Cr Reliance-scale company.
          </p>
          <div className="flex flex-wrap justify-center gap-3 text-xs font-semibold">
            {["46 Industries (BSE/NSE)","Listed Company + Per-Share Value","SOTP for Conglomerates","DDM for Dividend Stocks","First Chicago 3-Scenario","Sensitivity Grid (5×5)","Rule 11UA / FEMA Aligned"].map(t=>(
              <span key={t} className="flex items-center gap-1.5 px-3 py-1.5 bg-white border border-slate-200 rounded-full text-slate-600"><span className="text-green-500">✓</span>{t}</span>
            ))}
          </div>
        </section>
      )}

      <div className="max-w-3xl mx-auto w-full px-4 py-8 flex-1">
        {/* Progress */}
        {step<7&&(
          <div className="mb-8 print:hidden">
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm font-bold text-slate-700">Step {stepIdx+1} of {steps.length} — {steps[stepIdx]?.lbl}</p>
              <p className="text-xs text-slate-400">{Math.round(((stepIdx+1)/steps.length)*100)}%</p>
            </div>
            <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
              <div className="h-full rounded-full transition-all duration-500" style={{width:`${((stepIdx+1)/steps.length)*100}%`,background:"linear-gradient(90deg,#1d4ed8,#7c3aed)"}}/>
            </div>
            <div className="flex justify-between mt-2">
              {steps.map((s,i)=>(
                <span key={s.id} className={`text-xs font-medium truncate ${i<=stepIdx?"text-blue-600":"text-slate-300"}`}>{s.lbl}</span>
              ))}
            </div>
          </div>
        )}

        {/* Content */}
        <div className="bg-white">{contentMap[step]}</div>

        {/* Navigation */}
        {step<7&&(
          <div className="flex items-center justify-between mt-8 print:hidden">
            <button onClick={goBack} disabled={stepIdx===0} className="px-6 py-3 rounded-xl font-bold text-slate-600 border-2 border-slate-200 text-sm disabled:opacity-40 hover:bg-slate-50 transition">← Back</button>
            <button onClick={goNext} className="px-8 py-3 rounded-xl font-bold text-white text-sm transition hover:scale-105" style={{background:"linear-gradient(135deg,#1d4ed8,#7c3aed)"}}>
              {isLast?"⚡ Calculate Valuation →":"Continue →"}
            </button>
          </div>
        )}

        {step===1&&(
          <div className="mt-8 bg-slate-50 rounded-2xl p-5 border border-slate-200 print:hidden">
            <p className="font-bold text-slate-700 mb-3 text-sm">📌 Related</p>
            <div className="flex flex-wrap gap-2">
              {[{l:"ROC Filing Dates",h:"/roc-filing-due-dates"},{l:"Companies Act Guide",h:"/companies-act-compliance"},{l:"GST Due Dates",h:"/gst-due-dates"},{l:"Penalty Calculator",h:"/tools/penalty-calculator"}].map(l=>(
                <Link key={l.h} href={l.h} className="text-xs font-semibold px-3 py-1.5 rounded-full border border-slate-300 text-slate-600 hover:border-blue-400 hover:text-blue-600 transition">{l.l} →</Link>
              ))}
            </div>
          </div>
        )}
      </div>

      <footer className="border-t border-slate-200 py-6 px-4 mt-auto print:hidden">
        <div className="max-w-3xl mx-auto text-center text-sm text-slate-400">
          © {new Date().getFullYear()} ComplianceSearch.in — Powered by <a href="https://geebharat.com" className="text-amber-600 hover:underline">Gee Bharat</a>
        </div>
      </footer>
    </main>
  );
}
