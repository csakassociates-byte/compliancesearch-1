import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Corporate Action Kit — Complete Compliance Package | ComplianceSearch.in",
  description:
    "Select a corporate action — Director Appointment, Resignation, Auditor, Office Change — and get every document, deadline, and ROC filing guide automatically. Free, per Companies Act 2013.",
  alternates: { canonical: "https://compliancesearch.in/tools/corporate-action-kit" },
};

export default function CorporateActionKitLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
