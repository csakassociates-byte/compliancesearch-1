/**
 * Injects watermark + blur gate into print HTML for non-logged-in preview.
 * Shows top ~45% of report normally, blurs the rest with a login card.
 */
export function injectPreviewWatermark(html: string): string {
  const injection = `
  <style>
    /* ── Preview Banner ───────────────────────────────────── */
    #csi-preview-banner {
      position: fixed;
      top: 0; left: 0; right: 0;
      background: linear-gradient(135deg, #1e3a8a 0%, #1d4ed8 100%);
      color: white;
      padding: 10px 20px;
      display: flex;
      align-items: center;
      justify-content: space-between;
      z-index: 99999;
      font-family: Arial, sans-serif;
      font-size: 13px;
      box-shadow: 0 3px 16px rgba(0,0,0,0.3);
      gap: 12px;
      flex-wrap: wrap;
    }
    #csi-preview-banner .banner-left {
      display: flex; align-items: center; gap: 8px; flex: 1;
    }
    #csi-preview-banner .banner-left strong { font-size: 14px; }
    #csi-preview-banner a.btn-login {
      background: #fbbf24; color: #1e293b;
      padding: 7px 20px; border-radius: 8px;
      text-decoration: none; font-weight: 800; font-size: 13px;
      white-space: nowrap; flex-shrink: 0;
      box-shadow: 0 2px 8px rgba(0,0,0,0.2);
      transition: background 0.2s;
    }

    /* ── Watermark tiles ──────────────────────────────────── */
    #csi-watermark {
      position: fixed;
      top: 0; left: 0; right: 0; bottom: 0;
      pointer-events: none;
      z-index: 9995;
      overflow: hidden;
    }
    #csi-watermark span {
      position: absolute;
      font-size: 32px;
      font-weight: 900;
      color: rgba(30, 64, 175, 0.065);
      transform: rotate(-38deg);
      white-space: nowrap;
      font-family: 'Arial Black', Arial, sans-serif;
      letter-spacing: 3px;
      user-select: none;
    }

    /* ── Blur gate (bottom portion) ───────────────────────── */
    #csi-blur-gate {
      position: fixed;
      top: 42vh; left: 0; right: 0; bottom: 0;
      z-index: 9990;
      display: flex;
      align-items: center;
      justify-content: center;
    }
    /* Gradient fade into blur */
    #csi-blur-gate::before {
      content: '';
      position: absolute;
      top: -60px; left: 0; right: 0; height: 80px;
      background: linear-gradient(to bottom, transparent, rgba(248,250,252,0.95));
      pointer-events: none;
    }
    #csi-blur-backdrop {
      position: absolute;
      top: 0; left: 0; right: 0; bottom: 0;
      backdrop-filter: blur(12px) brightness(1.08);
      -webkit-backdrop-filter: blur(12px) brightness(1.08);
      background: rgba(241,245,249,0.82);
    }

    /* ── Login card ───────────────────────────────────────── */
    #csi-login-card {
      position: relative;
      z-index: 10;
      background: white;
      border: 2px solid #dbeafe;
      border-radius: 22px;
      padding: 30px 42px;
      text-align: center;
      box-shadow: 0 24px 64px rgba(30,64,175,0.15), 0 0 0 1px rgba(30,64,175,0.06);
      max-width: 400px;
      width: 90%;
      margin-top: -30px;
    }
    #csi-login-card .lock-icon {
      font-size: 50px; display: block; margin-bottom: 12px; line-height: 1;
    }
    #csi-login-card h2 {
      font-family: Arial, sans-serif; color: #0f172a;
      font-size: 21px; margin: 0 0 8px 0; font-weight: 800;
    }
    #csi-login-card p {
      font-family: Arial, sans-serif; color: #64748b;
      font-size: 13px; margin: 0 0 22px 0; line-height: 1.6;
    }
    #csi-login-card a.btn-signin {
      display: block;
      background: linear-gradient(135deg, #1e40af, #1d4ed8);
      color: white; padding: 13px; border-radius: 11px;
      text-decoration: none; font-family: Arial, sans-serif;
      font-weight: 800; font-size: 15px; margin-bottom: 10px;
      box-shadow: 0 4px 14px rgba(30,64,175,0.35);
    }
    #csi-login-card a.btn-signup {
      display: block; border: 1.5px solid #e2e8f0;
      color: #475569; padding: 10px; border-radius: 11px;
      text-decoration: none; font-family: Arial, sans-serif;
      font-weight: 600; font-size: 13px;
      background: #f8fafc;
    }
    #csi-login-card .free-badge {
      display: inline-block;
      background: #dcfce7; color: #166534;
      font-size: 11px; font-weight: 700;
      padding: 2px 8px; border-radius: 20px;
      margin-left: 6px; vertical-align: middle;
      font-family: Arial, sans-serif;
    }

    /* Hide all injected UI on actual print */
    @media print {
      #csi-preview-banner,
      #csi-watermark,
      #csi-blur-gate { display: none !important; }
      body { margin-top: 0 !important; }
    }
  </style>

  <!-- Top Banner -->
  <div id="csi-preview-banner">
    <div class="banner-left">
      <span style="font-size:18px;">⚖️</span>
      <span>
        <strong>Preview Mode</strong>
        &nbsp;—&nbsp; You're viewing a watermarked preview of this report.
        Sign in to download the complete, clean PDF — it's free!
      </span>
    </div>
    <a href="/auth/login" class="btn-login">🔓 Sign In to Download →</a>
  </div>

  <!-- Watermark layer -->
  <div id="csi-watermark"></div>

  <!-- Blur gate with login card -->
  <div id="csi-blur-gate">
    <div id="csi-blur-backdrop"></div>
    <div id="csi-login-card">
      <span class="lock-icon">🔒</span>
      <h2>View Full Report</h2>
      <p>
        Sign in to access the <strong>complete minutes &amp; certified true copies</strong> —
        professionally formatted, watermark-free, and ready to print.
        <span class="free-badge">FREE</span>
      </p>
      <a href="/auth/login" class="btn-signin">Sign In to Download →</a>
      <a href="/auth/signup" class="btn-signup">Create Free Account in 1 min</a>
    </div>
  </div>

  <script>
    (function () {
      // Push body down for the fixed banner
      document.documentElement.style.scrollPaddingTop = '48px';
      document.body.style.marginTop = '48px';

      // Generate watermark tiles
      var wm = document.getElementById('csi-watermark');
      var text = 'PREVIEW  •  ComplianceSearch.in  •  ';
      var cols = Math.ceil(window.innerWidth / 380) + 2;
      var rows = Math.ceil(window.innerHeight / 210) + 3;
      for (var r = 0; r < rows; r++) {
        for (var c = 0; c < cols; c++) {
          var s = document.createElement('span');
          s.textContent = text;
          s.style.top  = (r * 210 - 60) + 'px';
          s.style.left = (c * 380 - 80 + (r % 2 === 0 ? 0 : 190)) + 'px';
          wm.appendChild(s);
        }
      }
    })();
  </script>
  `;

  return html.replace(/<\/body>\s*<\/html>/i, `${injection}</body></html>`);
}
