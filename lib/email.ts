import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);
const FROM   = "ComplianceSearch <noreply@compliancesearch.in>";
const APP_URL = process.env.NEXT_PUBLIC_APP_URL || "https://compliancesearch.in";

// ── Team invite (new account created) ────────────────────────────────────────

export async function sendTeamInviteEmail(params: {
  to: string;
  toName: string;
  invitedByName: string;
  teamName: string;
  tempPassword: string;
}) {
  await resend.emails.send({
    from: FROM,
    to:   params.to,
    subject: `You've been added to ${params.teamName} on ComplianceSearch.in`,
    html: inviteHtml(params),
  });
}

// ── Existing user added to team ───────────────────────────────────────────────

export async function sendTeamJoinNotificationEmail(params: {
  to: string;
  toName: string;
  invitedByName: string;
  teamName: string;
}) {
  await resend.emails.send({
    from: FROM,
    to:   params.to,
    subject: `You've been added to ${params.teamName} on ComplianceSearch.in`,
    html: joinNotificationHtml(params),
  });
}

// ── Forgot password ───────────────────────────────────────────────────────────

export async function sendForgotPasswordEmail(params: {
  to: string;
  toName: string;
  tempPassword: string;
}) {
  await resend.emails.send({
    from: FROM,
    to:   params.to,
    subject: "Your temporary password — ComplianceSearch.in",
    html: forgotPasswordHtml(params),
  });
}

// ── HTML templates ────────────────────────────────────────────────────────────

function shell(body: string) {
  return `<!DOCTYPE html><html><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#f1f5f9;font-family:'Segoe UI',Arial,sans-serif;">
<div style="max-width:560px;margin:40px auto;background:#fff;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.08);">
  <div style="background:linear-gradient(135deg,#1e40af,#1d4ed8);padding:28px 40px;text-align:center;">
    <span style="font-size:28px;">⚖️</span>
    <h1 style="color:#fff;margin:8px 0 0;font-size:20px;font-weight:700;">
      ComplianceSearch<span style="color:#fcd34d;">.in</span>
    </h1>
  </div>
  ${body}
  <div style="background:#f8fafc;padding:14px 40px;text-align:center;border-top:1px solid #e2e8f0;">
    <p style="color:#94a3b8;font-size:12px;margin:0;">© ComplianceSearch.in — Professional Compliance Management</p>
  </div>
</div></body></html>`;
}

function credBox(label: string, value: string, warning?: string) {
  return `<div style="background:#f8fafc;border:2px solid #e2e8f0;border-radius:12px;padding:22px;margin:0 0 24px;">
    <p style="color:#64748b;font-size:12px;font-weight:600;margin:0 0 10px;text-transform:uppercase;letter-spacing:0.5px;">${label}</p>
    <span style="color:#1e40af;font-size:30px;font-weight:700;letter-spacing:5px;font-family:'Courier New',monospace;">${value}</span>
    ${warning ? `<p style="color:#ef4444;font-size:12px;font-weight:500;margin:10px 0 0;">⚠️ ${warning}</p>` : ""}
  </div>`;
}

function loginBtn() {
  return `<a href="${APP_URL}/auth/login" style="display:block;background:linear-gradient(135deg,#1e40af,#1d4ed8);color:#fff;text-align:center;padding:14px;border-radius:12px;font-weight:700;font-size:15px;text-decoration:none;margin-bottom:20px;">Login to ComplianceSearch →</a>`;
}

function inviteHtml(p: { to: string; toName: string; invitedByName: string; teamName: string; tempPassword: string }) {
  return shell(`
    <div style="padding:32px 40px;">
      <h2 style="color:#1e293b;font-size:19px;margin:0 0 10px;">Welcome to the team! 👋</h2>
      <p style="color:#475569;font-size:15px;line-height:1.6;margin:0 0 22px;">
        <strong>${p.invitedByName}</strong> has added you to <strong>${p.teamName}</strong> on ComplianceSearch.in.
      </p>
      <div style="background:#f8fafc;border:2px solid #e2e8f0;border-radius:12px;padding:22px;margin:0 0 24px;">
        <p style="color:#64748b;font-size:12px;font-weight:600;margin:0 0 14px;text-transform:uppercase;letter-spacing:0.5px;">Your Login Credentials</p>
        <div style="margin-bottom:14px;">
          <span style="color:#94a3b8;font-size:12px;">Email Address</span><br>
          <span style="color:#1e293b;font-size:16px;font-weight:600;">${p.to}</span>
        </div>
        <div>
          <span style="color:#94a3b8;font-size:12px;">Temporary Password</span><br>
          <span style="color:#1e40af;font-size:30px;font-weight:700;letter-spacing:5px;font-family:'Courier New',monospace;">${p.tempPassword}</span>
        </div>
        <p style="color:#ef4444;font-size:12px;font-weight:500;margin:12px 0 0;">⚠️ You will be asked to set a new password after your first login.</p>
      </div>
      ${loginBtn()}
      <p style="color:#94a3b8;font-size:13px;text-align:center;margin:0;">For any issues, contact your team administrator.</p>
    </div>`);
}

function joinNotificationHtml(p: { toName: string; invitedByName: string; teamName: string }) {
  return shell(`
    <div style="padding:32px 40px;">
      <h2 style="color:#1e293b;font-size:19px;margin:0 0 10px;">You've been added to a team 🤝</h2>
      <p style="color:#475569;font-size:15px;line-height:1.6;margin:0 0 22px;">
        Hi <strong>${p.toName || "there"}</strong>, <strong>${p.invitedByName}</strong> has added you to
        <strong>${p.teamName}</strong>. Your account data is now shared with this team.
      </p>
      ${loginBtn()}
      <p style="color:#94a3b8;font-size:13px;text-align:center;margin:0;">
        If you didn't expect this, please contact the team administrator.
      </p>
    </div>`);
}

function forgotPasswordHtml(p: { toName: string; tempPassword: string }) {
  return shell(`
    <div style="padding:32px 40px;">
      <h2 style="color:#1e293b;font-size:19px;margin:0 0 10px;">Password Reset 🔐</h2>
      <p style="color:#475569;font-size:15px;line-height:1.6;margin:0 0 22px;">
        Hi <strong>${p.toName || "there"}</strong>, here is your temporary password.
        Use it to login and then set a new password immediately.
      </p>
      ${credBox("Temporary Password", p.tempPassword, "This password expires in 24 hours. Set a new password after login.")}
      ${loginBtn()}
      <p style="color:#94a3b8;font-size:13px;text-align:center;margin:0;">
        If you didn't request this, please ignore this email.
      </p>
    </div>`);
}
