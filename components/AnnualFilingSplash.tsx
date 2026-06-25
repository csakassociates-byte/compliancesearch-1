"use client";
import { useState, useEffect } from "react";
import Link from "next/link";

export default function AnnualFilingSplash() {
  const [visible, setVisible] = useState(false);
  const [exiting, setExiting] = useState(false);
  const [progress, setProgress] = useState(100);

  useEffect(() => {
    if (typeof window !== "undefined" && sessionStorage.getItem("af_splash_shown")) return;
    const t = setTimeout(() => setVisible(true), 500);
    return () => clearTimeout(t);
  }, []);

  useEffect(() => {
    if (!visible) return;
    // Progress bar drains over 4 seconds
    const start = Date.now();
    const duration = 4000;
    const raf = () => {
      const elapsed = Date.now() - start;
      const pct = Math.max(0, 100 - (elapsed / duration) * 100);
      setProgress(pct);
      if (pct > 0) requestAnimationFrame(raf);
    };
    requestAnimationFrame(raf);
    const t = setTimeout(() => dismiss(), duration);
    return () => clearTimeout(t);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [visible]);

  function dismiss() {
    setExiting(true);
    setTimeout(() => {
      setVisible(false);
      sessionStorage.setItem("af_splash_shown", "1");
    }, 350);
  }

  if (!visible) return null;

  return (
    <div
      onClick={dismiss}
      style={{
        position: "fixed", inset: 0, zIndex: 9999,
        background: "rgba(0,0,0,0.55)",
        backdropFilter: "blur(4px)",
        display: "flex", alignItems: "center", justifyContent: "center",
        padding: "1rem",
        animation: exiting ? "splashFadeOut 0.35s ease forwards" : "splashFadeIn 0.35s ease forwards",
      }}>
      <div
        onClick={e => e.stopPropagation()}
        style={{
          background: "#fff",
          borderRadius: "24px",
          width: "100%",
          maxWidth: "480px",
          overflow: "hidden",
          boxShadow: "0 32px 80px rgba(0,0,0,0.25)",
          animation: exiting ? "cardSlideOut 0.35s ease forwards" : "cardSlideIn 0.35s ease forwards",
        }}>

        {/* Top accent bar */}
        <div style={{ background: "linear-gradient(135deg,#059669,#047857)", padding: "22px 28px 18px" }}>
          <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between" }}>
            <div>
              <span style={{
                display: "inline-block", background: "rgba(255,255,255,0.2)",
                color: "#fff", fontSize: "10px", fontWeight: 700,
                letterSpacing: "0.1em", textTransform: "uppercase",
                padding: "3px 10px", borderRadius: "99px", marginBottom: "10px",
              }}>NEW — FY 2025-26</span>
              <h2 style={{ color: "#fff", fontSize: "20px", fontWeight: 800, lineHeight: 1.25, margin: 0 }}>
                Spending hours on annual<br />filing attachments?
              </h2>
            </div>
            <button onClick={dismiss}
              style={{ background: "rgba(255,255,255,0.15)", border: "none", color: "#fff", borderRadius: "50%", width: 30, height: 30, cursor: "pointer", fontSize: 16, lineHeight: "30px", textAlign: "center", flexShrink: 0, marginLeft: 12 }}>
              ✕
            </button>
          </div>
        </div>

        {/* Body */}
        <div style={{ padding: "22px 28px 24px" }}>
          <p style={{ fontSize: "15px", color: "#475569", margin: "0 0 18px", lineHeight: 1.6 }}>
            Generate AOC-4 &amp; MGT-7 in <strong style={{ color: "#047857" }}>minutes — not hours.</strong>
            <br />All attachments at once. No manual errors. Filing-ready.
          </p>

          <div style={{ display: "flex", flexDirection: "column", gap: "8px", marginBottom: "22px" }}>
            {[
              "AOC-4 & MGT-7/7A — all attachments in one go",
              "Saves 1–2 hours per company per filing",
              "Zero clerical mistakes — auto-formatted",
              "FY 2025-26 compliance ready",
            ].map(pt => (
              <div key={pt} style={{ display: "flex", alignItems: "flex-start", gap: "8px", fontSize: "13px", color: "#334155" }}>
                <span style={{ color: "#059669", fontWeight: 700, marginTop: "1px", flexShrink: 0 }}>✓</span>
                {pt}
              </div>
            ))}
          </div>

          <Link href="/tools/documents/annual-filing" onClick={dismiss}
            style={{
              display: "block", textAlign: "center",
              background: "linear-gradient(135deg,#059669,#047857)",
              color: "#fff", fontWeight: 800, fontSize: "15px",
              padding: "13px 24px", borderRadius: "14px",
              textDecoration: "none",
              boxShadow: "0 8px 24px rgba(5,150,105,0.30)",
            }}>
            Generate My Filing Attachments →
          </Link>
          <p style={{ textAlign: "center", fontSize: "11px", color: "#94a3b8", margin: "8px 0 0" }}>
            Free · No login required
          </p>
        </div>

        {/* Auto-dismiss progress bar */}
        <div style={{ height: "3px", background: "#f1f5f9" }}>
          <div style={{
            height: "100%", background: "#059669",
            width: `${progress}%`, transition: "width 0.1s linear",
          }} />
        </div>
      </div>

      <style>{`
        @keyframes splashFadeIn  { from { opacity:0 } to { opacity:1 } }
        @keyframes splashFadeOut { from { opacity:1 } to { opacity:0 } }
        @keyframes cardSlideIn   { from { opacity:0; transform:translateY(24px) scale(0.97) } to { opacity:1; transform:translateY(0) scale(1) } }
        @keyframes cardSlideOut  { from { opacity:1; transform:translateY(0) scale(1) } to { opacity:0; transform:translateY(16px) scale(0.97) } }
      `}</style>
    </div>
  );
}
