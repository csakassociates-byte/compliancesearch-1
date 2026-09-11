import { Resend } from "resend";

// Lazy initialization — avoids crash at build time when env var not available
function getResendClient() {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) throw new Error("RESEND_API_KEY environment variable is not set.");
  return new Resend(apiKey);
}

const ADMIN_EMAIL = "csakassociates@gmail.com";
const FROM = "ComplianceSearch.in <noreply@compliancesearch.in>";

export async function sendEnquiryAdminNotification(params: {
  name: string; email: string; mobile: string;
  companyName?: string; queryType: string; message: string;
  source: string; id: string;
}) {
  const resend = getResendClient();
  const queryLabels: Record<string, string> = {
    general: "General Inquiry", pricing: "Pricing & Plans",
    tool_support: "Tool Support", technical: "Technical Issue", partnership: "Partnership",
  };
  const label = queryLabels[params.queryType] || params.queryType;
  await resend.emails.send({
    from: FROM,
    to: ADMIN_EMAIL,
    subject: `📩 New Enquiry [${label}] — ${params.name}`,
    html: `
<!DOCTYPE html><html><head><meta charset="UTF-8"/></head>
<body style="font-family:Arial,sans-serif;background:#f8fafc;margin:0;padding:20px;">
  <div style="max-width:560px;margin:0 auto;background:#fff;border-radius:12px;border:1px solid #e2e8f0;overflow:hidden;">
    <div style="background:linear-gradient(135deg,#1e40af,#1d4ed8);padding:20px 28px;">
      <h1 style="color:#fff;margin:0;font-size:18px;">⚖️ ComplianceSearch.in</h1>
      <p style="color:#bfdbfe;margin:4px 0 0;font-size:13px;">New Enquiry Received</p>
    </div>
    <div style="padding:24px 28px;">
      <div style="background:#eff6ff;border-left:4px solid #3b82f6;border-radius:4px;padding:12px 16px;margin-bottom:20px;">
        <p style="margin:0;font-size:14px;font-weight:700;color:#1e40af;">${label}</p>
        <p style="margin:4px 0 0;font-size:12px;color:#64748b;">via ${params.source === "floating" ? "Floating Button" : "Contact Page"}</p>
      </div>
      <table style="width:100%;border-collapse:collapse;font-size:14px;">
        <tr><td style="padding:8px 0;color:#64748b;width:130px;vertical-align:top;font-weight:600;">Name</td><td style="padding:8px 0;color:#1e293b;font-weight:700;">${params.name}</td></tr>
        <tr><td style="padding:8px 0;color:#64748b;font-weight:600;">Mobile</td><td style="padding:8px 0;"><a href="tel:${params.mobile}" style="color:#1d4ed8;font-weight:700;">${params.mobile}</a></td></tr>
        <tr><td style="padding:8px 0;color:#64748b;font-weight:600;">Email</td><td style="padding:8px 0;"><a href="mailto:${params.email}" style="color:#1d4ed8;">${params.email}</a></td></tr>
        ${params.companyName ? `<tr><td style="padding:8px 0;color:#64748b;font-weight:600;">Company</td><td style="padding:8px 0;color:#1e293b;">${params.companyName}</td></tr>` : ""}
      </table>
      <div style="margin-top:16px;background:#f8fafc;border:1px solid #e2e8f0;border-radius:8px;padding:16px;">
        <p style="margin:0 0 8px;font-size:12px;font-weight:700;color:#64748b;text-transform:uppercase;letter-spacing:0.5px;">Message</p>
        <p style="margin:0;font-size:14px;color:#1e293b;line-height:1.6;">${params.message.replace(/\n/g, "<br>")}</p>
      </div>
      <div style="margin-top:20px;text-align:center;">
        <a href="mailto:${params.email}?subject=Re: Your Enquiry on ComplianceSearch.in" style="display:inline-block;background:#1d4ed8;color:#fff;text-decoration:none;padding:10px 24px;border-radius:8px;font-weight:700;font-size:14px;">Reply to ${params.name}</a>
      </div>
    </div>
    <div style="background:#f8fafc;border-top:1px solid #e2e8f0;padding:12px 28px;text-align:center;">
      <p style="color:#94a3b8;font-size:12px;margin:0;">Enquiry ID: ${params.id} &nbsp;·&nbsp; © ${new Date().getFullYear()} ComplianceSearch.in</p>
    </div>
  </div>
</body></html>`,
  });
}

export async function sendEnquiryAutoReply(params: {
  name: string; email: string; queryType: string;
}) {
  const resend = getResendClient();
  await resend.emails.send({
    from: FROM,
    to: params.email,
    subject: "We received your enquiry — ComplianceSearch.in",
    html: `
<!DOCTYPE html><html><head><meta charset="UTF-8"/></head>
<body style="font-family:Arial,sans-serif;background:#f8fafc;margin:0;padding:20px;">
  <div style="max-width:480px;margin:0 auto;background:#fff;border-radius:12px;border:1px solid #e2e8f0;overflow:hidden;">
    <div style="background:linear-gradient(135deg,#1e40af,#1d4ed8);padding:24px 32px;">
      <h1 style="color:#fff;margin:0;font-size:20px;">⚖️ ComplianceSearch.in</h1>
    </div>
    <div style="padding:32px;">
      <h2 style="color:#1e293b;font-size:20px;margin:0 0 8px;">Thank you, ${params.name}!</h2>
      <p style="color:#475569;font-size:15px;margin:0 0 20px;">We've received your enquiry and our team will get back to you within <strong>24 hours</strong>.</p>
      <div style="background:#eff6ff;border:1px solid #bfdbfe;border-radius:8px;padding:16px;margin-bottom:20px;">
        <p style="margin:0;font-size:14px;color:#1e40af;">For urgent queries, you can also reach us at <a href="mailto:csakassociates@gmail.com" style="color:#1d4ed8;font-weight:700;">csakassociates@gmail.com</a></p>
      </div>
      <p style="color:#94a3b8;font-size:13px;margin:0;">Meanwhile, explore our free compliance tools at <a href="https://compliancesearch.in/tools" style="color:#1d4ed8;">compliancesearch.in/tools</a></p>
    </div>
    <div style="background:#f8fafc;border-top:1px solid #e2e8f0;padding:16px 32px;text-align:center;">
      <p style="color:#94a3b8;font-size:12px;margin:0;">© ${new Date().getFullYear()} ComplianceSearch.in — Compliance Made Simple</p>
    </div>
  </div>
</body></html>`,
  });
}

export async function sendDeleteOtpEmail(params: {
  to: string;
  otp: string;
  companyName: string;
  deletedByName: string;
  deletedByEmail: string;
}) {
  const resend = getResendClient();
  await resend.emails.send({
    from: "ComplianceSearch.in <noreply@compliancesearch.in>",
    to: params.to,
    subject: `⚠️ Company Deletion OTP — ${params.companyName}`,
    html: `
<!DOCTYPE html>
<html>
<head><meta charset="UTF-8"/></head>
<body style="font-family:Arial,sans-serif;background:#fef2f2;margin:0;padding:20px;">
  <div style="max-width:480px;margin:0 auto;background:#fff;border-radius:12px;border:2px solid #fca5a5;overflow:hidden;">
    <div style="background:linear-gradient(135deg,#dc2626,#b91c1c);padding:24px 32px;">
      <h1 style="color:#fff;margin:0;font-size:20px;">⚖️ ComplianceSearch.in</h1>
      <p style="color:#fecaca;margin:6px 0 0 0;font-size:13px;">Security Alert — Company Deletion Request</p>
    </div>
    <div style="padding:32px;">
      <h2 style="color:#1e293b;font-size:20px;margin:0 0 8px 0;">Company Deletion OTP</h2>
      <p style="color:#475569;font-size:15px;margin:0 0 20px 0;">
        A request has been made to permanently delete the following company from your account:
      </p>
      <div style="background:#fff7ed;border:1px solid #fed7aa;border-radius:8px;padding:14px 18px;margin-bottom:20px;">
        <p style="margin:0;font-size:15px;font-weight:700;color:#c2410c;">🏢 ${params.companyName}</p>
        <p style="margin:6px 0 0 0;font-size:13px;color:#78350f;">
          Requested by: <strong>${params.deletedByName || params.deletedByEmail}</strong> (${params.deletedByEmail})
        </p>
      </div>
      <p style="color:#475569;font-size:14px;margin:0 0 16px 0;">
        Use the OTP below to authorise this deletion. <strong>This action cannot be undone.</strong>
      </p>
      <div style="background:#fef2f2;border:2px dashed #f87171;border-radius:12px;padding:20px;text-align:center;margin-bottom:24px;">
        <p style="font-size:38px;font-weight:900;letter-spacing:12px;color:#dc2626;margin:0;font-family:monospace;">${params.otp}</p>
      </div>
      <p style="color:#94a3b8;font-size:13px;margin:0;">
        This OTP is valid for <strong>10 minutes</strong>. If you did not initiate this request, please ignore this email — no action will be taken without OTP confirmation.
      </p>
    </div>
    <div style="background:#fef2f2;border-top:1px solid #fca5a5;padding:16px 32px;text-align:center;">
      <p style="color:#94a3b8;font-size:12px;margin:0;">© ${new Date().getFullYear()} ComplianceSearch.in — Compliance Made Simple</p>
    </div>
  </div>
</body>
</html>`,
  });
}

export async function sendOtpEmail(email: string, otp: string, purpose: "signup" | "forgot_password") {
  const resend = getResendClient();

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
