import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { SUPER_USER_EMAIL } from "@/lib/tools-config";
import Link from "next/link";

interface Props {
  children: React.ReactNode;
  toolName: string;
}

export default async function ToolLockGuard({ children, toolName }: Props) {
  const session = await getServerSession(authOptions);
  const isSuperUser = session?.user?.email === SUPER_USER_EMAIL;

  if (isSuperUser) {
    return (
      <>
        <div style={{
          position: "fixed", bottom: 20, right: 20, zIndex: 9999,
          background: "#1e293b", color: "#fbbf24", fontSize: 11, fontWeight: 800,
          padding: "7px 16px", borderRadius: 99, display: "flex", alignItems: "center", gap: 6,
          boxShadow: "0 4px 16px rgba(0,0,0,0.35)", pointerEvents: "none",
          letterSpacing: "0.05em",
        }}>
          🔓 Admin Preview
        </div>
        {children}
      </>
    );
  }

  return (
    <div style={{
      minHeight: "80vh", display: "flex", flexDirection: "column",
      alignItems: "center", justifyContent: "center",
      background: "linear-gradient(135deg,#f8fafc 0%,#eff6ff 100%)",
      padding: "60px 20px", fontFamily: "system-ui, -apple-system, sans-serif",
    }}>
      <div style={{
        background: "#fff", borderRadius: 24, padding: "52px 40px",
        boxShadow: "0 8px 48px rgba(0,0,0,0.08)", border: "1.5px solid #e2e8f0",
        maxWidth: 460, width: "100%", textAlign: "center",
      }}>
        <div style={{ fontSize: 60, marginBottom: 20, lineHeight: 1 }}>🔒</div>
        <div style={{
          display: "inline-block", background: "#fef3c7", color: "#b45309",
          fontSize: 10, fontWeight: 800, padding: "4px 14px", borderRadius: 99,
          textTransform: "uppercase", letterSpacing: "0.12em", marginBottom: 18,
        }}>
          Coming Soon
        </div>
        <h1 style={{ fontSize: 24, fontWeight: 900, color: "#0f172a", margin: "0 0 14px", lineHeight: 1.25 }}>
          {toolName}
        </h1>
        <p style={{ color: "#64748b", fontSize: 15, lineHeight: 1.7, margin: "0 0 10px" }}>
          We&apos;re perfecting this tool to make it 100% accurate before releasing it.
        </p>
        <p style={{ color: "#94a3b8", fontSize: 13, margin: "0 0 32px" }}>
          It will be live very soon — check back shortly!
        </p>
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          <Link href="/tools" style={{
            display: "block", background: "linear-gradient(135deg,#1d4ed8,#2563eb)",
            color: "#fff", fontWeight: 700, fontSize: 14, padding: "13px 24px",
            borderRadius: 12, textDecoration: "none",
          }}>
            ← Browse Available Tools
          </Link>
          <Link href="/" style={{
            display: "block", background: "#f8fafc", border: "1.5px solid #e2e8f0",
            color: "#64748b", fontWeight: 600, fontSize: 13, padding: "12px 24px",
            borderRadius: 12, textDecoration: "none",
          }}>
            Back to Home
          </Link>
        </div>
      </div>
    </div>
  );
}
