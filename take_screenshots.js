/**
 * Annual Filing Tool — Screenshot Capture
 * Uses existing Chrome profile (already logged in session)
 */
const puppeteer = require('puppeteer-core');
const fs = require('fs');
const path = require('path');

const CHROME_EXE  = "C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe";
// Use existing Chrome profile so session cookies work (user already logged in)
const USER_DATA   = "C:\\Users\\HP\\AppData\\Local\\Google\\Chrome\\User Data";
const BASE        = "https://compliancesearch.in";
const OUT         = path.join(__dirname, "screenshots");

if (!fs.existsSync(OUT)) fs.mkdirSync(OUT, { recursive: true });

const sleep = ms => new Promise(r => setTimeout(r, ms));

async function shot(page, name) {
  const p = path.join(OUT, `${name}.png`);
  await page.screenshot({ path: p, fullPage: false });
  console.log(`  ✓ ${name}.png`);
  return p;
}

async function scrollTo(page, y) {
  await page.evaluate(y => window.scrollTo({ top: y, behavior: 'instant' }), y);
  await sleep(500);
}

async function clickStepBtn(page, text) {
  await page.evaluate((txt) => {
    const all = Array.from(document.querySelectorAll('button, [role="button"]'));
    const btn = all.find(b => b.innerText && b.innerText.trim().includes(txt));
    if (btn) btn.click();
  }, text);
  await sleep(1800);
}

(async () => {
  console.log("Launching Chrome with existing profile...");

  let browser;
  try {
    browser = await puppeteer.launch({
      executablePath: CHROME_EXE,
      userDataDir: USER_DATA,
      headless: false,
      args: [
        '--no-first-run',
        '--no-default-browser-check',
        '--profile-directory=Default',
      ],
      defaultViewport: { width: 1280, height: 800 },
    });
  } catch(e) {
    // Chrome may already be open with the profile — try without userDataDir
    console.log("Profile locked, trying without profile...");
    browser = await puppeteer.launch({
      executablePath: CHROME_EXE,
      headless: false,
      defaultViewport: { width: 1280, height: 800 },
      args: ['--no-sandbox'],
    });
  }

  const page = await browser.newPage();
  await page.setViewport({ width: 1280, height: 800 });

  // ── Navigate to Annual Filing ────────────────────────────────────────
  console.log("\n→ Opening Annual Filing tool...");
  await page.goto(`${BASE}/tools/documents/annual-filing`, {
    waitUntil: 'networkidle2', timeout: 40000
  });
  await sleep(2500);

  // Check if redirected to login
  const url = page.url();
  if (url.includes('/login') || url.includes('/signin') || url.includes('/auth')) {
    console.log("\n⚠  Not logged in. Please log in in the browser window.");
    console.log("   Waiting 25 seconds...");
    await sleep(25000);
    await page.goto(`${BASE}/tools/documents/annual-filing`, {
      waitUntil: 'networkidle2', timeout: 30000
    });
    await sleep(2000);
  }

  console.log("\n📸 Step 1 — Company & Financial Year");
  await scrollTo(page, 0);
  await shot(page, '01_step1_overview');
  await scrollTo(page, 220);
  await shot(page, '02_step1_import_company');
  await scrollTo(page, 600);
  await shot(page, '03_step1_company_details');
  await scrollTo(page, 1050);
  await shot(page, '04_step1_fy_type');
  await scrollTo(page, 1400);
  await shot(page, '05_step1_business');

  console.log("\n📸 Step 2 — Auditor");
  await clickStepBtn(page, 'Auditor');
  await scrollTo(page, 0);
  await shot(page, '06_step2_saved_ca');
  await scrollTo(page, 400);
  await shot(page, '07_step2_firm_details');
  await scrollTo(page, 850);
  await shot(page, '08_step2_appointment');
  await scrollTo(page, 1200);
  await shot(page, '09_step2_opinion_fees');

  console.log("\n📸 Step 3 — Financials");
  await clickStepBtn(page, 'Financials');
  await scrollTo(page, 0);
  await shot(page, '10_step3_top');
  await scrollTo(page, 200);
  await shot(page, '11_step3_pl_table');
  await scrollTo(page, 750);
  await shot(page, '12_step3_bs_table');

  console.log("\n📸 Step 4 — Board & Compliance");
  await clickStepBtn(page, 'Board');
  await scrollTo(page, 0);
  await shot(page, '13_step4_top');
  await scrollTo(page, 350);
  await shot(page, '14_step4_meetings');
  await scrollTo(page, 950);
  await shot(page, '15_step4_compliance_flags');
  await scrollTo(page, 1400);
  await shot(page, '16_step4_dividend');
  await scrollTo(page, 1800);
  await shot(page, '17_step4_employees');

  console.log("\n📸 Step 5 — Directors");
  await clickStepBtn(page, 'Directors');
  await scrollTo(page, 0);
  await shot(page, '18_step5_top');
  await scrollTo(page, 400);
  await shot(page, '19_step5_director_kyc');
  await scrollTo(page, 900);
  await shot(page, '20_step5_signatory');

  console.log("\n📸 Step 6 — Shareholders");
  await clickStepBtn(page, 'Shareholders');
  await scrollTo(page, 0);
  await shot(page, '21_step6_top');
  await scrollTo(page, 400);
  await shot(page, '22_step6_sh_list');

  console.log("\n📸 Step 8 — Generate All");
  await clickStepBtn(page, 'Generate');
  await scrollTo(page, 0);
  await shot(page, '23_step8_summary');
  await scrollTo(page, 400);
  await shot(page, '24_step8_checklist');
  await scrollTo(page, 800);
  await shot(page, '25_step8_documents');

  const files = fs.readdirSync(OUT).filter(f => f.endsWith('.png'));
  console.log(`\n✅ Done! ${files.length} screenshots saved to:\n   ${OUT}`);

  await browser.close();
})().catch(e => {
  console.error("Error:", e.message);
  process.exit(1);
});
