import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Director Appointment Kit — Board Notice, DIR-2, DIR-8, ROC Guide | ComplianceSearch.in",
  description:
    "Generate complete Director Appointment package: SS-1 Board Notice, Board Resolution (Section 161), DIR-2 Consent, DIR-8 Declaration, and DIR-12 ROC filing guide. Free, legally accurate.",
  alternates: { canonical: "https://compliancesearch.in/tools/corporate-action-kit/director-appointment" },
};

export default function DirectorAppointmentLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
