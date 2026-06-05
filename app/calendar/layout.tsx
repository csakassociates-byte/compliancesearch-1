import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Compliance Calendar India 2025-26 — Due Dates for GST, TDS, ROC, PF",
  description:
    "Monthly compliance calendar for Indian businesses — GST return dates, TDS payment due dates, ROC filing deadlines, PF/ESIC, advance tax and more. Never miss a due date.",
  keywords: [
    "compliance calendar india 2025",
    "gst due dates india",
    "tds payment due date",
    "roc filing deadline",
    "pf esic payment date",
    "advance tax due date",
    "compliance due dates india",
    "statutory compliance calendar",
  ],
  alternates: { canonical: "https://compliancesearch.in/calendar" },
  openGraph: {
    title: "India Compliance Calendar — All Due Dates in One Place",
    description: "GST, TDS, ROC, PF, ESIC and more — never miss a compliance deadline.",
    url: "https://compliancesearch.in/calendar",
  },
};

export default function CalendarLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
