import { Suspense } from "react";
import AnnualFilingsClient from "./AnnualFilingsClient";

export const metadata = { title: "Annual Filings — ComplianceSearch" };

export default function AnnualFilingsPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-slate-50 flex items-center justify-center text-slate-400">Loading…</div>}>
      <AnnualFilingsClient />
    </Suspense>
  );
}
