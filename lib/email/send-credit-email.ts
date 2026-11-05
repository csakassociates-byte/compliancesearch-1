import nodemailer from "nodemailer";

export async function sendCreditEmail(opts: {
  toEmail: string;
  toName: string | null;
  creditsAdded: number;
}) {
  const { toEmail, toName, creditsAdded } = opts;
  const displayName = toName || "there";

  const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: "csakassociates@gmail.com",
      pass: process.env.GMAIL_APP_PASSWORD,
    },
  });

  const html = `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
</head>
<body style="margin:0;padding:0;background:#f4f7f6;font-family:Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f4f7f6;padding:32px 16px;">
    <tr><td align="center">
      <table width="600" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 2px 8px rgba(0,0,0,0.08);">

        <!-- Header -->
        <tr>
          <td style="background:linear-gradient(135deg,#059669,#0d9488);padding:32px 40px;text-align:center;">
            <div style="font-size:22px;font-weight:bold;color:#ffffff;letter-spacing:0.5px;">ComplianceSearch.in</div>
            <div style="font-size:13px;color:#a7f3d0;margin-top:4px;">Smart Compliance for Indian Companies</div>
          </td>
        </tr>

        <!-- Body -->
        <tr>
          <td style="padding:36px 40px;">
            <p style="margin:0 0 16px;font-size:16px;color:#111827;font-weight:600;">Dear ${displayName},</p>
            <p style="margin:0 0 24px;font-size:15px;color:#374151;line-height:1.7;">
              Your ComplianceSearch account has been credited with <strong style="color:#059669;">${creditsAdded} credit${creditsAdded !== 1 ? "s" : ""}</strong>. Your account is now active and ready to use.
            </p>

            <!-- Credits badge -->
            <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:28px;">
              <tr>
                <td style="background:#ecfdf5;border:1px solid #a7f3d0;border-radius:10px;padding:20px 24px;text-align:center;">
                  <div style="font-size:38px;font-weight:bold;color:#059669;">${creditsAdded}</div>
                  <div style="font-size:13px;color:#065f46;font-weight:600;text-transform:uppercase;letter-spacing:1px;">Credits Added</div>
                </td>
              </tr>
            </table>

            <p style="margin:0 0 20px;font-size:15px;color:#374151;line-height:1.7;font-weight:600;">Here is what you can do with your account:</p>

            <!-- Feature 1 -->
            <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:16px;">
              <tr>
                <td style="background:#f8fafc;border-left:4px solid #059669;border-radius:6px;padding:16px 20px;">
                  <div style="font-size:14px;font-weight:700;color:#111827;margin-bottom:6px;">Annual Filing Attachments Generator</div>
                  <div style="font-size:13px;color:#6b7280;line-height:1.6;">
                    Preparing annual filing documents — Board Report, Audit Report, and all statutory attachments — traditionally takes hours of careful drafting. Our tool generates them in minutes: simply enter your company data once, and all required documents are auto-drafted, properly formatted, and ready to review or submit.
                  </div>
                </td>
              </tr>
            </table>

            <!-- Feature 2 -->
            <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:28px;">
              <tr>
                <td style="background:#f8fafc;border-left:4px solid #0d9488;border-radius:6px;padding:16px 20px;">
                  <div style="font-size:14px;font-weight:700;color:#111827;margin-bottom:6px;">Compliance Dashboard</div>
                  <div style="font-size:13px;color:#6b7280;line-height:1.6;">
                    Stay on top of all your compliance obligations from one place. Track due dates, monitor filing status, and get timely reminders — so nothing slips through.
                  </div>
                </td>
              </tr>
            </table>

            <!-- CTA -->
            <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:28px;">
              <tr>
                <td align="center">
                  <a href="https://www.compliancesearch.in" style="display:inline-block;background:#059669;color:#ffffff;text-decoration:none;font-size:15px;font-weight:600;padding:14px 36px;border-radius:8px;letter-spacing:0.3px;">
                    Log In to ComplianceSearch.in →
                  </a>
                </td>
              </tr>
            </table>

            <p style="margin:0;font-size:13px;color:#9ca3af;line-height:1.6;">
              If you have any questions or need assistance, feel free to reach out to us. We are here to help you get the most out of your account.
            </p>
          </td>
        </tr>

        <!-- Footer -->
        <tr>
          <td style="background:#f9fafb;border-top:1px solid #e5e7eb;padding:20px 40px;text-align:center;">
            <div style="font-size:12px;color:#9ca3af;line-height:1.6;">
              Team ComplianceSearch &nbsp;|&nbsp; <a href="https://www.compliancesearch.in" style="color:#059669;text-decoration:none;">www.compliancesearch.in</a>
              <br />csakassociates@gmail.com
            </div>
          </td>
        </tr>

      </table>
    </td></tr>
  </table>
</body>
</html>`;

  await transporter.sendMail({
    from: '"Team ComplianceSearch" <csakassociates@gmail.com>',
    to: toEmail,
    subject: "Credits Activated — Your ComplianceSearch Account is Ready",
    html,
  });
}
