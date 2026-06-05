import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Business Valuation Tool India — Free Company Valuation Calculator | ComplianceSearch.in",
  description:
    "Free business valuation tool for Indian companies. Uses DCF, EBITDA multiples, Revenue multiples, P/E, NAV and Berkus methods. India-specific BSE industry multiples, WACC and Risk-Free Rate. Get instant valuation report for any business — startup to ₹1 lakh crore company.",
  keywords:
    "business valuation India, company valuation calculator, DCF calculator India, EBITDA multiple valuation, startup valuation India, Rule 11UA valuation, unlisted company valuation, free valuation tool",
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
