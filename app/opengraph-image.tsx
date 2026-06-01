import { ImageResponse } from "next/og";

export const runtime = "edge";
export const alt = "ComplianceSearch.in — Business Compliance Checker India";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function OGImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          background: "linear-gradient(135deg, #eff6ff 0%, #dbeafe 50%, #e0f2fe 100%)",
          fontFamily: "sans-serif",
          padding: "60px",
        }}
      >
        {/* Logo row */}
        <div style={{ display: "flex", alignItems: "center", gap: "16px", marginBottom: "32px" }}>
          <div style={{
            width: 64, height: 64, borderRadius: 16,
            background: "linear-gradient(135deg,#1e40af,#1d4ed8)",
            display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: 32,
          }}>⚖️</div>
          <div style={{ display: "flex", alignItems: "baseline", gap: "4px" }}>
            <span style={{ fontSize: 42, fontWeight: 800, color: "#0f172a" }}>ComplianceSearch</span>
            <span style={{ fontSize: 42, fontWeight: 800, color: "#d97706" }}>.in</span>
          </div>
        </div>

        {/* Main heading */}
        <div style={{ fontSize: 52, fontWeight: 900, color: "#0f172a", textAlign: "center", lineHeight: 1.15, marginBottom: "20px" }}>
          Know Every Compliance
        </div>
        <div style={{ fontSize: 44, fontWeight: 800, color: "#1d4ed8", textAlign: "center", marginBottom: "28px" }}>
          Your Business Needs
        </div>

        {/* Subtitle */}
        <div style={{ fontSize: 22, color: "#475569", textAlign: "center", maxWidth: 700, marginBottom: "40px", lineHeight: 1.5 }}>
          GST · Income Tax · Labour Laws · FEMA · CSR · FSSAI · 70+ More
        </div>

        {/* Badges */}
        <div style={{ display: "flex", gap: "20px" }}>
          {["77+ Rules", "11 Categories", "Free · Instant", "🇮🇳 India-Specific"].map(b => (
            <div key={b} style={{
              background: "#dbeafe", color: "#1e40af", fontWeight: 700,
              fontSize: 18, padding: "10px 20px", borderRadius: 12,
              border: "2px solid #bfdbfe",
            }}>{b}</div>
          ))}
        </div>

        {/* Powered by */}
        <div style={{
          position: "absolute", bottom: 32, right: 48,
          fontSize: 16, color: "#92400e", fontWeight: 600,
          background: "#fffbeb", padding: "8px 16px", borderRadius: 20,
          border: "1px solid #fde68a",
        }}>
          🌐 Powered by Gee Bharat
        </div>
      </div>
    ),
    { ...size }
  );
}
