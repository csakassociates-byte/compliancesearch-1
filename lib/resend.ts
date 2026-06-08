import { Resend } from "resend";
export const resend = new Resend(process.env.RESEND_API_KEY);

export async function sendOtpEmail(email: string, otp: string, purpose: "signup" | "forgot_password") {
  const subject = purpose === "signup"
    ? "Verify your email — ComplianceSearch.in"
    : "Reset your password — ComplianceSearch.in";

  const heading = purpose === "signup" ? "Verify Your Email" : "Reset Your Password";
  const bodyText = purpose === "signup"
    ? "Use the OTP below to complete your signup:"
    : "Use the OTP below to reset your password:";

  await resend.emails.send({
    from: "ComplianceSearch.in <noreply@compliancesearch.in>",
    to: email,
    subject,
    html: `
<!DOCTYPE html>
<html>
<head><meta charset="UTF-8"/></head>
<body style="font-family:Arial,sans-serif;background:#f8fafc;margin:0;padding:20px;">
  <div style="max-width:480px;margin:0 auto;background:#fff;border-radius:12px;border:1px solid #e2e8f0;overflow:hidden;">
    <div style="background:linear-gradient(135deg,#1e40af,#1d4ed8);padding:24px 32px;">
      <h1 style="color:#fff;margin:0;font-size:20px;">⚖️ ComplianceSearch.in</h1>
    </div>
    <div style="padding:32px;">
      <h2 style="color:#1e293b;font-size:22px;margin:0 0 8px 0;">${heading}</h2>
      <p style="color:#475569;font-size:15px;margin:0 0 24px 0;">${bodyText}</p>
      <div style="background:#eff6ff;border:2px dashed #3b82f6;border-radius:12px;padding:20px;text-align:center;margin-bottom:24px;">
        <p style="font-size:38px;font-weight:900;letter-spacing:12px;color:#1d4ed8;margin:0;font-family:monospace;">${otp}</p>
      </div>
      <p style="color:#94a3b8;font-size:13px;margin:0;">This OTP is valid for <strong>10 minutes</strong>. Do not share it with anyone.</p>
    </div>
    <div style="background:#f8fafc;border-top:1px solid #e2e8f0;padding:16px 32px;text-align:center;">
      <p style="color:#94a3b8;font-size:12px;margin:0;">© ${new Date().getFullYear()} ComplianceSearch.in — Compliance Made Simple</p>
    </div>
  </div>
</body>
</html>`,
  });
}
