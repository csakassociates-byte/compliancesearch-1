/**
 * Notes on Accounts — Schedule III Division I
 * Applicable to companies following AS (Accounting Standards) — not Ind AS
 * Covers: OPC, Private Small, Section 8, FPC
 *
 * Mandatory Notes as per Schedule III + AS disclosures:
 *   Note 1  — Significant Accounting Policies (AS 1)
 *   Note 2  — Share Capital
 *   Note 3  — Reserves and Surplus
 *   Note 4  — Long-term Borrowings
 *   Note 5  — Deferred Tax Liabilities / Assets (AS 22)
 *   Note 6  — Other Long-term Liabilities
 *   Note 7  — Short-term Borrowings
 *   Note 8  — Trade Payables
 *   Note 9  — Other Current Liabilities
 *   Note 10 — Short-term Provisions
 *   Note 11 — Fixed Assets (Tangible + Intangible) — Schedule III format
 *   Note 12 — Long-term Investments
 *   Note 13 — Long-term Loans and Advances
 *   Note 14 — Trade Receivables
 *   Note 15 — Cash and Bank Balances
 *   Note 16 — Short-term Loans and Advances
 *   Note 17 — Other Current Assets
 *   Note 18 — Revenue from Operations
 *   Note 19 — Other Income
 *   Note 20 — Cost of Materials / Purchases
 *   Note 21 — Changes in Inventories
 *   Note 22 — Employee Benefits Expense (AS 15)
 *   Note 23 — Finance Costs
 *   Note 24 — Depreciation and Amortisation
 *   Note 25 — Other Expenses
 *   Note 26 — Related Party Disclosures (AS 18)
 *   Note 27 — Contingent Liabilities (AS 29)
 *   Note 28 — Earnings Per Share (AS 20) — if applicable
 *   Note 29 — Segment Reporting (AS 17) — if applicable
 *   Note 30 — Dues to MSME (MSMED Act 2006)
 *   Note 31 — Ageing of Receivables / Payables (Sch III amendment)
 *   Note 32 — Other Disclosures — Benami, Undisclosed income, Crypto, Title deeds
 *
 * Template approach: Most notes are tables with blank rows for CA to fill.
 * Accounting policies use standard AS-1 language that applies to all companies.
 */

import type { AnnualFilingData } from "../types";
import { fyEndYear, fyStartYear, wrapPage } from "../utils";

export function generateNotesOnAccounts(data: AnnualFilingData): string {
  const fy       = data.financialYear;
  const fyEnd    = fyEndYear(fy);
  const fyStart  = fyStartYear(fy);
  const prevFY   = `${Number(fyStart) - 1}-${fyStart.slice(2)}`;
  const prevFYEnd = String(Number(fyEnd) - 1);

  const isSection8 = data.companyType === "section8";
  const isOPC      = data.companyType === "opc";

  const amtCol = (label: string) => `<th class="right" style="width:20%">${label}</th>`;

  const bodyHtml = `

<!-- ══════════════ HEADER ══════════════ -->
<div class="header-block">
  <div class="company-name">${data.companyName}</div>
  <div class="cin-line">CIN: ${data.cin}</div>
  <div class="doc-title">NOTES TO THE FINANCIAL STATEMENTS</div>
  <div class="fy-line">For the Financial Year ended 31<sup>st</sup> March, ${fyEnd}</div>
  <div class="fy-line">(Forming part of the Balance Sheet and Statement of Profit &amp; Loss)</div>
</div>

<!-- ══════════════ NOTE 1: SIGNIFICANT ACCOUNTING POLICIES ══════════════ -->
<h2>Note 1 — Significant Accounting Policies</h2>

<h3>1.1 Basis of Preparation</h3>
<p>These financial statements have been prepared in accordance with the Generally Accepted Accounting Principles in India (Indian GAAP) under the historical cost convention on the accrual basis. These financial statements have been prepared to comply in all material respects with the Accounting Standards specified under Section 133 of the Companies Act, 2013, read with the Companies (Accounting Standards) Rules, 2021 (Division I of Schedule III of the Companies Act, 2013 applicable to companies following Accounting Standards). The accounting policies have been consistently applied by the Company.</p>

<h3>1.2 Use of Estimates</h3>
<p>The preparation of financial statements in conformity with Indian GAAP requires the management to make estimates and assumptions that affect the reported amounts of assets and liabilities, disclosure of contingent liabilities as at the date of the financial statements, and the reported amounts of revenue and expenses during the reporting period. Actual results could differ from those estimates. Any revisions to accounting estimates are recognised prospectively in current and future periods.</p>

<h3>1.3 Revenue Recognition (AS 9)</h3>
<p>Revenue from sale of goods is recognised when the significant risks and rewards of ownership of the goods are transferred to the buyer. Revenue from services is recognised on completion of services / on the basis of percentage completion method. Interest income is recognised on a time proportion basis. Dividend income is recognised when the right to receive the dividend is established.</p>

<h3>1.4 Fixed Assets and Depreciation (AS 6 / AS 10)</h3>
<p>Tangible fixed assets are stated at cost of acquisition less accumulated depreciation. Cost comprises the purchase price and any directly attributable costs. Depreciation on tangible fixed assets is provided on the Written Down Value (WDV) method / Straight Line Method (SLM) at rates prescribed in Schedule II to the Companies Act, 2013, based on the useful life of the assets. Intangible assets are amortised over their estimated useful economic life, not exceeding 10 years.</p>

<h3>1.5 Inventories (AS 2)</h3>
<p>Inventories are valued at cost or net realisable value, whichever is lower. Cost is determined on First-In-First-Out (FIFO) / Weighted Average basis. Cost comprises all costs of purchase, costs of conversion and other costs incurred in bringing the inventories to their present location and condition.</p>

<h3>1.6 Investments (AS 13)</h3>
<p>Long-term investments are stated at cost. Provision for diminution in the value of long-term investments is made only if such decline is other than temporary. Current investments are stated at cost or net realisable value, whichever is lower.</p>

<h3>1.7 Employee Benefits (AS 15)</h3>
<p>Short-term employee benefits are charged to the Statement of Profit and Loss in the year in which the employee renders the related service. Post-employment benefits (Gratuity, Provident Fund) are accounted for on the basis of actuarial valuation / contributions made to the fund, as applicable. The Company's contributions to Employees' Provident Fund are charged to the Statement of Profit and Loss as incurred.</p>

<h3>1.8 Borrowing Costs (AS 16)</h3>
<p>Borrowing costs that are attributable to the acquisition, construction or production of qualifying assets are capitalised as part of the cost of such assets. A qualifying asset is one that necessarily takes a substantial period of time to get ready for its intended use or sale. All other borrowing costs are charged to the Statement of Profit and Loss in the period in which they are incurred.</p>

<h3>1.9 Foreign Currency Transactions (AS 11)</h3>
<p>Foreign currency transactions are recorded at the exchange rate prevailing at the date of the transaction. Monetary items denominated in foreign currencies at the year-end are translated at the exchange rates prevailing at the Balance Sheet date. Exchange differences on translation or settlement of monetary items are recognised in the Statement of Profit and Loss.</p>

<h3>1.10 Taxation (AS 22)</h3>
<p>Current tax is determined as the amount of tax payable in respect of taxable income for the year. Deferred tax resulting from timing differences between book profit and taxable profit is accounted for under the liability method using the tax rates and laws enacted or substantively enacted as on the Balance Sheet date. Deferred tax assets are recognised only to the extent there is reasonable certainty that sufficient future taxable income will be available against which such deferred tax assets can be realised.</p>

<h3>1.11 Provisions, Contingent Liabilities and Contingent Assets (AS 29)</h3>
<p>Provisions involving substantial degree of estimation in measurement are recognised when there is a present obligation as a result of past events and it is probable that there will be an outflow of resources. Contingent liabilities are not recognised but are disclosed in the Notes. Contingent assets are neither recognised nor disclosed in the financial statements.</p>

<h3>1.12 Impairment of Assets (AS 28)</h3>
<p>The carrying amount of assets are reviewed at each Balance Sheet date to determine if there is any indication of impairment based on external / internal factors. An impairment loss is recognised wherever the carrying amount of an asset exceeds its recoverable amount, which is the greater of the asset's net selling price and value in use.</p>

<h3>1.13 Leases (AS 19)</h3>
<p>Assets under finance leases are recognised as assets at the inception of the lease. Operating lease rentals are recognised as expense in the Statement of Profit and Loss on a straight-line basis over the lease term.</p>

<h3>1.14 Earnings Per Share (AS 20)</h3>
<p>Basic Earnings Per Share (EPS) is computed by dividing the net profit after tax for the year by the weighted average number of equity shares outstanding during the year. Diluted EPS is computed using the weighted average number of equity and dilutive equivalent shares outstanding during the year.</p>

<!-- ══════════════ NOTE 2: SHARE CAPITAL ══════════════ -->
<h2 class="page-break">Note 2 — Share Capital</h2>
<table>
  <tr>
    <th style="width:60%">Particulars</th>
    ${amtCol(`As at 31st Mar ${fyEnd} (₹)`)}
    ${amtCol(`As at 31st Mar ${prevFYEnd} (₹)`)}
  </tr>
  <tr><td colspan="3"><strong>Authorised:</strong></td></tr>
  <tr>
    <td class="indent">________ Equity Shares of ₹${data.nominalValuePerShare || "10"}/- each</td>
    <td class="right"></td><td class="right"></td>
  </tr>
  <tr><td colspan="3"><strong>Issued, Subscribed and Paid-up:</strong></td></tr>
  <tr>
    <td class="indent">________ Equity Shares of ₹${data.nominalValuePerShare || "10"}/- each fully paid-up</td>
    <td class="right"></td><td class="right"></td>
  </tr>
  <tr style="font-weight:bold; background:#f2f2f2;">
    <td><strong>Total</strong></td>
    <td class="right"><strong>${data.financials.paidUpCapital ? "₹" + data.financials.paidUpCapital : ""}</strong></td>
    <td class="right"><strong>${data.financials.prevPaidUpCapital ? "₹" + data.financials.prevPaidUpCapital : ""}</strong></td>
  </tr>
</table>
<p><strong>a) Reconciliation of number of shares outstanding at the beginning and end of the year:</strong></p>
<table>
  <tr>
    <th>Particulars</th>
    <th class="right">No. of Shares</th>
    <th class="right">Amount (₹)</th>
    <th class="right">No. of Shares</th>
    <th class="right">Amount (₹)</th>
  </tr>
  <tr><td colspan="5" class="center"><em>(FY ${fy} on left; FY ${prevFY} on right)</em></td></tr>
  <tr><td>Opening Balance</td><td class="right"></td><td class="right"></td><td class="right"></td><td class="right"></td></tr>
  <tr><td>Add: Issued during the year</td><td class="right"></td><td class="right"></td><td class="right"></td><td class="right"></td></tr>
  <tr><td>Less: Bought back during the year</td><td class="right"></td><td class="right"></td><td class="right"></td><td class="right"></td></tr>
  <tr style="font-weight:bold;"><td><strong>Closing Balance</strong></td><td class="right"></td><td class="right"></td><td class="right"></td><td class="right"></td></tr>
</table>
<p><strong>b) Rights, preferences and restrictions attached to equity shares:</strong><br>
The Company has one class of equity shares having a par value of ₹${data.nominalValuePerShare || "10"} per share. Each shareholder is eligible for one vote per share held. ${isOPC ? "The Company being a One Person Company, has only one member." : "The dividend proposed by the Board of Directors is subject to the approval of the shareholders in the ensuing Annual General Meeting."} In the event of liquidation, the equity shareholders are eligible to receive the remaining assets of the Company after distribution of all preferential amounts, in proportion to their shareholding.</p>
<p><strong>c) Details of shareholders holding more than 5% shares:</strong></p>
<table>
  <tr>
    <th>Name of Shareholder</th>
    <th class="right">No. of Shares</th>
    <th class="right">% of Holding</th>
    <th class="right">No. of Shares (Prev. Year)</th>
    <th class="right">% of Holding (Prev. Year)</th>
  </tr>
  ${data.shareholders
    .filter(s => parseFloat(s.percentHolding) > 5)
    .map(s => `<tr>
      <td>${s.name}</td>
      <td class="right">${s.sharesHeld.toLocaleString("en-IN")}</td>
      <td class="right">${s.percentHolding}%</td>
      <td class="right">—</td>
      <td class="right">—</td>
    </tr>`).join("") || `<tr><td colspan="5" class="center">To be filled</td></tr>`
  }
</table>

<!-- ══════════════ NOTE 3: RESERVES AND SURPLUS ══════════════ -->
<h2>Note 3 — Reserves and Surplus</h2>
<table>
  <tr>
    <th style="width:60%">Particulars</th>
    ${amtCol(`As at 31st Mar ${fyEnd} (₹)`)}
    ${amtCol(`As at 31st Mar ${prevFYEnd} (₹)`)}
  </tr>
  <tr><td>General Reserve</td><td class="right"></td><td class="right"></td></tr>
  <tr><td>Opening Balance</td><td class="right"></td><td class="right"></td></tr>
  <tr><td class="indent">Add: Transfer from Profit &amp; Loss</td><td class="right"></td><td class="right"></td></tr>
  <tr><td><strong>Surplus in Statement of Profit &amp; Loss</strong></td><td></td><td></td></tr>
  <tr><td class="indent">Opening Balance</td><td class="right"></td><td class="right"></td></tr>
  <tr><td class="indent">Add: Profit / (Loss) for the year</td><td class="right"></td><td class="right"></td></tr>
  <tr><td class="indent">Less: Transfer to General Reserve</td><td class="right"></td><td class="right"></td></tr>
  <tr><td class="indent">Less: Dividend paid</td><td class="right"></td><td class="right"></td></tr>
  <tr style="font-weight:bold; background:#f2f2f2;"><td><strong>Total Reserves and Surplus</strong></td><td class="right"><strong>${data.financials.reservesAndSurplus ? "₹" + data.financials.reservesAndSurplus : ""}</strong></td><td class="right"></td></tr>
</table>

<!-- ══════════════ NOTE 4: LONG-TERM BORROWINGS ══════════════ -->
<h2>Note 4 — Long-term Borrowings</h2>
<table>
  <tr><th style="width:60%">Particulars</th>${amtCol(`31st Mar ${fyEnd} (₹)`)}${amtCol(`31st Mar ${prevFYEnd} (₹)`)}</tr>
  <tr><td><strong>Secured</strong></td><td></td><td></td></tr>
  <tr><td class="indent">Term Loans from Banks</td><td class="right"></td><td class="right"></td></tr>
  <tr><td class="indent">Term Loans from NBFCs / Financial Institutions</td><td class="right"></td><td class="right"></td></tr>
  <tr><td><strong>Unsecured</strong></td><td></td><td></td></tr>
  <tr><td class="indent">Loans from Directors / Shareholders</td><td class="right"></td><td class="right"></td></tr>
  <tr><td class="indent">Loans from Related Parties</td><td class="right"></td><td class="right"></td></tr>
  <tr style="font-weight:bold; background:#f2f2f2;"><td><strong>Total</strong></td><td class="right"></td><td class="right"></td></tr>
</table>
<p><em>Terms of repayment and security details to be provided separately for each loan.</em></p>

<!-- ══════════════ NOTE 5: DEFERRED TAX ══════════════ -->
<h2>Note 5 — Deferred Tax Liabilities / (Assets) (Net)</h2>
<table>
  <tr><th style="width:60%">Particulars</th>${amtCol(`31st Mar ${fyEnd} (₹)`)}${amtCol(`31st Mar ${prevFYEnd} (₹)`)}</tr>
  <tr><td>Deferred Tax Liability on account of timing differences in depreciation</td><td class="right"></td><td class="right"></td></tr>
  <tr><td>Deferred Tax Asset on account of provisions / carry forward losses</td><td class="right"></td><td class="right"></td></tr>
  <tr style="font-weight:bold; background:#f2f2f2;"><td><strong>Net Deferred Tax Liability / (Asset)</strong></td><td class="right"></td><td class="right"></td></tr>
</table>

<!-- ══════════════ NOTE 6-10: SHORT SUMMARIES ══════════════ -->
<h2>Note 6 — Other Long-term Liabilities</h2>
<table>
  <tr><th style="width:60%">Particulars</th>${amtCol(`31st Mar ${fyEnd} (₹)`)}${amtCol(`31st Mar ${prevFYEnd} (₹)`)}</tr>
  <tr><td>Security Deposits Received</td><td class="right"></td><td class="right"></td></tr>
  <tr><td>Other Liabilities</td><td class="right"></td><td class="right"></td></tr>
  <tr style="font-weight:bold; background:#f2f2f2;"><td><strong>Total</strong></td><td class="right"></td><td class="right"></td></tr>
</table>

<h2>Note 7 — Short-term Borrowings</h2>
<table>
  <tr><th style="width:60%">Particulars</th>${amtCol(`31st Mar ${fyEnd} (₹)`)}${amtCol(`31st Mar ${prevFYEnd} (₹)`)}</tr>
  <tr><td>Cash Credit / Overdraft from Banks (Secured)</td><td class="right"></td><td class="right"></td></tr>
  <tr><td>Loans Repayable on Demand — Unsecured</td><td class="right"></td><td class="right"></td></tr>
  <tr style="font-weight:bold; background:#f2f2f2;"><td><strong>Total</strong></td><td class="right"></td><td class="right"></td></tr>
</table>

<h2>Note 8 — Trade Payables</h2>
<table>
  <tr><th style="width:60%">Particulars</th>${amtCol(`31st Mar ${fyEnd} (₹)`)}${amtCol(`31st Mar ${prevFYEnd} (₹)`)}</tr>
  <tr><td>Due to Micro, Small and Medium Enterprises (MSME) <em>(refer Note 30)</em></td><td class="right"></td><td class="right"></td></tr>
  <tr><td>Due to Others</td><td class="right"></td><td class="right"></td></tr>
  <tr style="font-weight:bold; background:#f2f2f2;"><td><strong>Total</strong></td><td class="right"></td><td class="right"></td></tr>
</table>

<h2>Note 9 — Other Current Liabilities</h2>
<table>
  <tr><th style="width:60%">Particulars</th>${amtCol(`31st Mar ${fyEnd} (₹)`)}${amtCol(`31st Mar ${prevFYEnd} (₹)`)}</tr>
  <tr><td>Current Maturities of Long-term Debt</td><td class="right"></td><td class="right"></td></tr>
  <tr><td>Interest Accrued and Due on Borrowings</td><td class="right"></td><td class="right"></td></tr>
  <tr><td>Statutory Dues Payable (TDS, GST, PF, ESI etc.)</td><td class="right"></td><td class="right"></td></tr>
  <tr><td>Advance from Customers</td><td class="right"></td><td class="right"></td></tr>
  <tr><td>Other Payables</td><td class="right"></td><td class="right"></td></tr>
  <tr style="font-weight:bold; background:#f2f2f2;"><td><strong>Total</strong></td><td class="right"></td><td class="right"></td></tr>
</table>

<h2>Note 10 — Short-term Provisions</h2>
<table>
  <tr><th style="width:60%">Particulars</th>${amtCol(`31st Mar ${fyEnd} (₹)`)}${amtCol(`31st Mar ${prevFYEnd} (₹)`)}</tr>
  <tr><td>Provision for Income Tax (Net of Advance Tax)</td><td class="right"></td><td class="right"></td></tr>
  <tr><td>Provision for Employee Benefits (Gratuity / Leave Encashment)</td><td class="right"></td><td class="right"></td></tr>
  <tr><td>Other Provisions</td><td class="right"></td><td class="right"></td></tr>
  <tr style="font-weight:bold; background:#f2f2f2;"><td><strong>Total</strong></td><td class="right"></td><td class="right"></td></tr>
</table>

<!-- ══════════════ NOTE 11: FIXED ASSETS ══════════════ -->
<h2 class="page-break">Note 11 — Fixed Assets (Schedule III Format)</h2>
<p><em>Amount in ₹</em></p>
<table style="font-size:9.5pt;">
  <tr>
    <th rowspan="2">Particulars</th>
    <th colspan="4" class="center">Gross Block</th>
    <th colspan="3" class="center">Accumulated Depreciation</th>
    <th colspan="2" class="center">Net Block</th>
  </tr>
  <tr>
    <th class="right">Opening</th>
    <th class="right">Additions</th>
    <th class="right">Disposals</th>
    <th class="right">Closing</th>
    <th class="right">Opening</th>
    <th class="right">For the Year</th>
    <th class="right">Closing</th>
    <th class="right">As at 31/03/${fyEnd}</th>
    <th class="right">As at 31/03/${prevFYEnd}</th>
  </tr>
  <tr><td colspan="10"><strong>Tangible Assets</strong></td></tr>
  <tr><td class="indent">Land</td><td class="right"></td><td class="right"></td><td class="right"></td><td class="right"></td><td class="right">—</td><td class="right">—</td><td class="right">—</td><td class="right"></td><td class="right"></td></tr>
  <tr><td class="indent">Building</td><td class="right"></td><td class="right"></td><td class="right"></td><td class="right"></td><td class="right"></td><td class="right"></td><td class="right"></td><td class="right"></td><td class="right"></td></tr>
  <tr><td class="indent">Plant &amp; Machinery</td><td class="right"></td><td class="right"></td><td class="right"></td><td class="right"></td><td class="right"></td><td class="right"></td><td class="right"></td><td class="right"></td><td class="right"></td></tr>
  <tr><td class="indent">Furniture &amp; Fixtures</td><td class="right"></td><td class="right"></td><td class="right"></td><td class="right"></td><td class="right"></td><td class="right"></td><td class="right"></td><td class="right"></td><td class="right"></td></tr>
  <tr><td class="indent">Vehicles</td><td class="right"></td><td class="right"></td><td class="right"></td><td class="right"></td><td class="right"></td><td class="right"></td><td class="right"></td><td class="right"></td><td class="right"></td></tr>
  <tr><td class="indent">Office Equipment / Computers</td><td class="right"></td><td class="right"></td><td class="right"></td><td class="right"></td><td class="right"></td><td class="right"></td><td class="right"></td><td class="right"></td><td class="right"></td></tr>
  <tr style="font-weight:bold;"><td><strong>Sub-total (A)</strong></td><td class="right"></td><td class="right"></td><td class="right"></td><td class="right"></td><td class="right"></td><td class="right"></td><td class="right"></td><td class="right"></td><td class="right"></td></tr>
  <tr><td colspan="10"><strong>Intangible Assets</strong></td></tr>
  <tr><td class="indent">Computer Software</td><td class="right"></td><td class="right"></td><td class="right"></td><td class="right"></td><td class="right"></td><td class="right"></td><td class="right"></td><td class="right"></td><td class="right"></td></tr>
  <tr><td class="indent">Goodwill</td><td class="right"></td><td class="right"></td><td class="right"></td><td class="right"></td><td class="right"></td><td class="right"></td><td class="right"></td><td class="right"></td><td class="right"></td></tr>
  <tr style="font-weight:bold;"><td><strong>Sub-total (B)</strong></td><td class="right"></td><td class="right"></td><td class="right"></td><td class="right"></td><td class="right"></td><td class="right"></td><td class="right"></td><td class="right"></td><td class="right"></td></tr>
  <tr style="font-weight:bold; background:#f2f2f2;"><td><strong>Total (A+B)</strong></td><td class="right"></td><td class="right"></td><td class="right"></td><td class="right"></td><td class="right"></td><td class="right"></td><td class="right"></td><td class="right"></td><td class="right"></td></tr>
</table>

<!-- ══════════════ NOTES 12-17: ASSETS ══════════════ -->
<h2>Note 12 — Long-term Investments</h2>
<table>
  <tr><th style="width:60%">Particulars</th>${amtCol(`31st Mar ${fyEnd} (₹)`)}${amtCol(`31st Mar ${prevFYEnd} (₹)`)}</tr>
  <tr><td>Investment in Subsidiaries (at cost)</td><td class="right"></td><td class="right"></td></tr>
  <tr><td>Investment in Associates (at cost)</td><td class="right"></td><td class="right"></td></tr>
  <tr><td>Other Long-term Investments</td><td class="right"></td><td class="right"></td></tr>
  <tr style="font-weight:bold; background:#f2f2f2;"><td><strong>Total</strong></td><td class="right"></td><td class="right"></td></tr>
</table>

<h2>Note 13 — Long-term Loans and Advances</h2>
<table>
  <tr><th style="width:60%">Particulars</th>${amtCol(`31st Mar ${fyEnd} (₹)`)}${amtCol(`31st Mar ${prevFYEnd} (₹)`)}</tr>
  <tr><td>Capital Advances</td><td class="right"></td><td class="right"></td></tr>
  <tr><td>Security Deposits</td><td class="right"></td><td class="right"></td></tr>
  <tr><td>Advance Tax / TDS Receivable (Net of Provisions)</td><td class="right"></td><td class="right"></td></tr>
  <tr><td>Other Long-term Loans &amp; Advances</td><td class="right"></td><td class="right"></td></tr>
  <tr style="font-weight:bold; background:#f2f2f2;"><td><strong>Total</strong></td><td class="right"></td><td class="right"></td></tr>
</table>

<h2>Note 14 — Trade Receivables</h2>
<table>
  <tr><th style="width:60%">Particulars</th>${amtCol(`31st Mar ${fyEnd} (₹)`)}${amtCol(`31st Mar ${prevFYEnd} (₹)`)}</tr>
  <tr><td><strong>Outstanding for a period exceeding 6 months from due date:</strong></td><td></td><td></td></tr>
  <tr><td class="indent">Considered Good — Secured</td><td class="right"></td><td class="right"></td></tr>
  <tr><td class="indent">Considered Good — Unsecured</td><td class="right"></td><td class="right"></td></tr>
  <tr><td class="indent">Credit Impaired</td><td class="right"></td><td class="right"></td></tr>
  <tr><td><strong>Others:</strong></td><td></td><td></td></tr>
  <tr><td class="indent">Considered Good — Secured</td><td class="right"></td><td class="right"></td></tr>
  <tr><td class="indent">Considered Good — Unsecured</td><td class="right"></td><td class="right"></td></tr>
  <tr><td class="indent">Credit Impaired</td><td class="right"></td><td class="right"></td></tr>
  <tr><td class="indent">Less: Allowance for doubtful debts</td><td class="right"></td><td class="right"></td></tr>
  <tr style="font-weight:bold; background:#f2f2f2;"><td><strong>Total</strong></td><td class="right"></td><td class="right"></td></tr>
</table>

<h2>Note 15 — Cash and Bank Balances</h2>
<table>
  <tr><th style="width:60%">Particulars</th>${amtCol(`31st Mar ${fyEnd} (₹)`)}${amtCol(`31st Mar ${prevFYEnd} (₹)`)}</tr>
  <tr><td><strong>Cash and Cash Equivalents:</strong></td><td></td><td></td></tr>
  <tr><td class="indent">Cash on Hand</td><td class="right"></td><td class="right"></td></tr>
  <tr><td class="indent">Balances with Banks — Current Accounts</td><td class="right"></td><td class="right"></td></tr>
  <tr><td class="indent">Balances with Banks — Fixed Deposits (maturity ≤ 3 months)</td><td class="right"></td><td class="right"></td></tr>
  <tr><td><strong>Other Bank Balances:</strong></td><td></td><td></td></tr>
  <tr><td class="indent">Earmarked Balances (Unpaid Dividend etc.)</td><td class="right"></td><td class="right"></td></tr>
  <tr><td class="indent">Fixed Deposits (maturity &gt; 3 months but ≤ 12 months)</td><td class="right"></td><td class="right"></td></tr>
  <tr><td class="indent">Margin Money / Security against Borrowings</td><td class="right"></td><td class="right"></td></tr>
  <tr style="font-weight:bold; background:#f2f2f2;"><td><strong>Total</strong></td><td class="right"></td><td class="right"></td></tr>
</table>

<h2>Note 16 — Short-term Loans and Advances</h2>
<table>
  <tr><th style="width:60%">Particulars</th>${amtCol(`31st Mar ${fyEnd} (₹)`)}${amtCol(`31st Mar ${prevFYEnd} (₹)`)}</tr>
  <tr><td>Loans to Related Parties (Unsecured, Considered Good)</td><td class="right"></td><td class="right"></td></tr>
  <tr><td>Advances to Suppliers</td><td class="right"></td><td class="right"></td></tr>
  <tr><td>Prepaid Expenses</td><td class="right"></td><td class="right"></td></tr>
  <tr><td>GST Input Tax Credit Receivable</td><td class="right"></td><td class="right"></td></tr>
  <tr><td>Other Loans &amp; Advances</td><td class="right"></td><td class="right"></td></tr>
  <tr style="font-weight:bold; background:#f2f2f2;"><td><strong>Total</strong></td><td class="right"></td><td class="right"></td></tr>
</table>

<h2>Note 17 — Other Current Assets</h2>
<table>
  <tr><th style="width:60%">Particulars</th>${amtCol(`31st Mar ${fyEnd} (₹)`)}${amtCol(`31st Mar ${prevFYEnd} (₹)`)}</tr>
  <tr><td>Interest Accrued on Deposits</td><td class="right"></td><td class="right"></td></tr>
  <tr><td>Unbilled Revenue</td><td class="right"></td><td class="right"></td></tr>
  <tr><td>Other Current Assets</td><td class="right"></td><td class="right"></td></tr>
  <tr style="font-weight:bold; background:#f2f2f2;"><td><strong>Total</strong></td><td class="right"></td><td class="right"></td></tr>
</table>

<!-- ══════════════ NOTES 18-25: P&L ITEMS ══════════════ -->
<h2 class="page-break">Note 18 — Revenue from Operations</h2>
<table>
  <tr><th style="width:60%">Particulars</th>${amtCol(`FY ${fy} (₹)`)}${amtCol(`FY ${prevFY} (₹)`)}</tr>
  <tr><td>Sale of Products / Services</td><td class="right"></td><td class="right"></td></tr>
  <tr><td>Other Operating Revenue</td><td class="right"></td><td class="right"></td></tr>
  <tr style="font-weight:bold; background:#f2f2f2;"><td><strong>Total Revenue from Operations</strong></td><td class="right"><strong>${data.financials.revenueFromOperations ? "₹" + data.financials.revenueFromOperations : ""}</strong></td><td class="right"></td></tr>
</table>

<h2>Note 19 — Other Income</h2>
<table>
  <tr><th style="width:60%">Particulars</th>${amtCol(`FY ${fy} (₹)`)}${amtCol(`FY ${prevFY} (₹)`)}</tr>
  <tr><td>Interest Income</td><td class="right"></td><td class="right"></td></tr>
  <tr><td>Dividend Income</td><td class="right"></td><td class="right"></td></tr>
  <tr><td>Profit on Sale of Assets</td><td class="right"></td><td class="right"></td></tr>
  <tr><td>Miscellaneous Income</td><td class="right"></td><td class="right"></td></tr>
  <tr style="font-weight:bold; background:#f2f2f2;"><td><strong>Total Other Income</strong></td><td class="right"><strong>${data.financials.otherIncome ? "₹" + data.financials.otherIncome : ""}</strong></td><td class="right"></td></tr>
</table>

<h2>Note 20 — Cost of Materials Consumed / Purchases of Stock-in-Trade</h2>
<table>
  <tr><th style="width:60%">Particulars</th>${amtCol(`FY ${fy} (₹)`)}${amtCol(`FY ${prevFY} (₹)`)}</tr>
  <tr><td>Opening Stock of Raw Materials</td><td class="right"></td><td class="right"></td></tr>
  <tr><td>Add: Purchases during the year</td><td class="right"></td><td class="right"></td></tr>
  <tr><td>Less: Closing Stock of Raw Materials</td><td class="right"></td><td class="right"></td></tr>
  <tr style="font-weight:bold; background:#f2f2f2;"><td><strong>Cost of Materials Consumed</strong></td><td class="right"></td><td class="right"></td></tr>
  <tr><td>Purchases of Stock-in-Trade (Trading Goods)</td><td class="right"></td><td class="right"></td></tr>
</table>

<h2>Note 21 — Changes in Inventories of Finished Goods, WIP and Stock-in-Trade</h2>
<table>
  <tr><th style="width:60%">Particulars</th>${amtCol(`FY ${fy} (₹)`)}${amtCol(`FY ${prevFY} (₹)`)}</tr>
  <tr><td>Opening Stock: Finished Goods + WIP + Stock-in-Trade</td><td class="right"></td><td class="right"></td></tr>
  <tr><td>Less: Closing Stock: Finished Goods + WIP + Stock-in-Trade</td><td class="right"></td><td class="right"></td></tr>
  <tr style="font-weight:bold; background:#f2f2f2;"><td><strong>(Increase) / Decrease in Inventories</strong></td><td class="right"></td><td class="right"></td></tr>
</table>

<h2>Note 22 — Employee Benefits Expense</h2>
<table>
  <tr><th style="width:60%">Particulars</th>${amtCol(`FY ${fy} (₹)`)}${amtCol(`FY ${prevFY} (₹)`)}</tr>
  <tr><td>Salaries, Wages and Bonus</td><td class="right"></td><td class="right"></td></tr>
  <tr><td>Contribution to Provident Fund and Other Funds</td><td class="right"></td><td class="right"></td></tr>
  <tr><td>Gratuity Expense</td><td class="right"></td><td class="right"></td></tr>
  <tr><td>Staff Welfare Expenses</td><td class="right"></td><td class="right"></td></tr>
  <tr style="font-weight:bold; background:#f2f2f2;"><td><strong>Total</strong></td><td class="right"></td><td class="right"></td></tr>
</table>

<h2>Note 23 — Finance Costs</h2>
<table>
  <tr><th style="width:60%">Particulars</th>${amtCol(`FY ${fy} (₹)`)}${amtCol(`FY ${prevFY} (₹)`)}</tr>
  <tr><td>Interest Expense on Borrowings</td><td class="right"></td><td class="right"></td></tr>
  <tr><td>Bank Charges and Processing Fees</td><td class="right"></td><td class="right"></td></tr>
  <tr><td>Other Finance Costs</td><td class="right"></td><td class="right"></td></tr>
  <tr style="font-weight:bold; background:#f2f2f2;"><td><strong>Total</strong></td><td class="right"></td><td class="right"></td></tr>
</table>

<h2>Note 24 — Depreciation and Amortisation Expense</h2>
<table>
  <tr><th style="width:60%">Particulars</th>${amtCol(`FY ${fy} (₹)`)}${amtCol(`FY ${prevFY} (₹)`)}</tr>
  <tr><td>Depreciation on Tangible Fixed Assets</td><td class="right"></td><td class="right"></td></tr>
  <tr><td>Amortisation on Intangible Assets</td><td class="right"></td><td class="right"></td></tr>
  <tr style="font-weight:bold; background:#f2f2f2;"><td><strong>Total</strong></td><td class="right"></td><td class="right"></td></tr>
</table>

<h2>Note 25 — Other Expenses</h2>
<table>
  <tr><th style="width:60%">Particulars</th>${amtCol(`FY ${fy} (₹)`)}${amtCol(`FY ${prevFY} (₹)`)}</tr>
  <tr><td>Rent</td><td class="right"></td><td class="right"></td></tr>
  <tr><td>Power and Fuel</td><td class="right"></td><td class="right"></td></tr>
  <tr><td>Repairs and Maintenance</td><td class="right"></td><td class="right"></td></tr>
  <tr><td>Communication Expenses</td><td class="right"></td><td class="right"></td></tr>
  <tr><td>Legal and Professional Charges</td><td class="right"></td><td class="right"></td></tr>
  <tr><td>Printing and Stationery</td><td class="right"></td><td class="right"></td></tr>
  <tr><td>Travelling and Conveyance</td><td class="right"></td><td class="right"></td></tr>
  <tr><td>Advertisement and Business Promotion</td><td class="right"></td><td class="right"></td></tr>
  <tr><td>Auditor's Remuneration (as Statutory Auditor)</td><td class="right"></td><td class="right"></td></tr>
  <tr><td>Miscellaneous Expenses</td><td class="right"></td><td class="right"></td></tr>
  <tr style="font-weight:bold; background:#f2f2f2;"><td><strong>Total</strong></td><td class="right"></td><td class="right"></td></tr>
</table>

<!-- ══════════════ NOTE 26: RELATED PARTY DISCLOSURES ══════════════ -->
<h2 class="page-break">Note 26 — Related Party Disclosures (AS 18)</h2>
<p><strong>A. Names of related parties and description of relationships:</strong></p>
<table>
  <tr><th style="width:50%">Name of Related Party</th><th>Nature of Relationship</th></tr>
  ${data.directors.map(d => `<tr><td>${d.name}</td><td>Director</td></tr>`).join("") ||
    `<tr><td colspan="2" class="center">To be filled by CA</td></tr>`}
</table>
<p><strong>B. Transactions with related parties during FY ${fy}:</strong></p>
<table>
  <tr>
    <th>Nature of Transaction</th>
    <th>Name of Related Party</th>
    <th class="right">FY ${fy} (₹)</th>
    <th class="right">FY ${prevFY} (₹)</th>
  </tr>
  <tr><td>Remuneration paid to Directors</td><td></td><td class="right"></td><td class="right"></td></tr>
  <tr><td>Loans Taken</td><td></td><td class="right"></td><td class="right"></td></tr>
  <tr><td>Loans Repaid</td><td></td><td class="right"></td><td class="right"></td></tr>
  <tr><td>Purchase of Goods / Services</td><td></td><td class="right"></td><td class="right"></td></tr>
  <tr><td>Sale of Goods / Services</td><td></td><td class="right"></td><td class="right"></td></tr>
  <tr><td>Interest Paid</td><td></td><td class="right"></td><td class="right"></td></tr>
</table>
<p><strong>C. Outstanding balances as at 31<sup>st</sup> March, ${fyEnd}:</strong></p>
<table>
  <tr><th>Particulars</th><th>Name of Related Party</th><th class="right">Amount (₹)</th></tr>
  <tr><td>Loans Payable</td><td></td><td class="right"></td></tr>
  <tr><td>Trade Payables</td><td></td><td class="right"></td></tr>
  <tr><td>Trade Receivables</td><td></td><td class="right"></td></tr>
</table>

<!-- ══════════════ NOTE 27: CONTINGENT LIABILITIES ══════════════ -->
<h2>Note 27 — Contingent Liabilities and Commitments (AS 29)</h2>
<table>
  <tr><th style="width:60%">Particulars</th>${amtCol(`31st Mar ${fyEnd} (₹)`)}${amtCol(`31st Mar ${prevFYEnd} (₹)`)}</tr>
  <tr><td>Claims not acknowledged as debts</td><td class="right">Nil</td><td class="right">Nil</td></tr>
  <tr><td>Guarantees given on behalf of others</td><td class="right">Nil</td><td class="right">Nil</td></tr>
  <tr><td>Income Tax / GST disputes pending</td><td class="right">Nil</td><td class="right">Nil</td></tr>
  <tr><td>Capital commitments (net of advances)</td><td class="right">Nil</td><td class="right">Nil</td></tr>
</table>

<!-- ══════════════ NOTE 28: EARNINGS PER SHARE ══════════════ -->
<h2>Note 28 — Earnings Per Share (AS 20)</h2>
<table>
  <tr><th style="width:60%">Particulars</th>${amtCol(`FY ${fy}`)}${amtCol(`FY ${prevFY}`)}</tr>
  <tr><td>Net Profit / (Loss) after tax (₹)</td><td class="right">${data.financials.profitAfterTax || ""}</td><td class="right"></td></tr>
  <tr><td>Weighted average number of Equity Shares (Basic)</td><td class="right"></td><td class="right"></td></tr>
  <tr><td>Weighted average number of Equity Shares (Diluted)</td><td class="right"></td><td class="right"></td></tr>
  <tr><td>Nominal Value per Share (₹)</td><td class="right">${data.nominalValuePerShare || "10"}</td><td class="right">${data.nominalValuePerShare || "10"}</td></tr>
  <tr style="font-weight:bold;"><td><strong>Basic EPS (₹)</strong></td><td class="right"></td><td class="right"></td></tr>
  <tr style="font-weight:bold;"><td><strong>Diluted EPS (₹)</strong></td><td class="right"></td><td class="right"></td></tr>
</table>

<!-- ══════════════ NOTE 29: SEGMENT REPORTING ══════════════ -->
<h2>Note 29 — Segment Reporting (AS 17)</h2>
<p>The Company operates in a single primary business segment and a single geographical segment (India). Accordingly, no separate segment reporting is required as per AS 17 — Segment Reporting.</p>

<!-- ══════════════ NOTE 30: DUES TO MSME ══════════════ -->
<h2>Note 30 — Dues to Micro, Small and Medium Enterprises</h2>
<p>The information as required to be disclosed under the Micro, Small and Medium Enterprises Development Act, 2006 (MSMED Act) has been determined to the extent such parties have been identified on the basis of information available with the Company:</p>
<table>
  <tr><th style="width:60%">Particulars</th>${amtCol(`31st Mar ${fyEnd} (₹)`)}${amtCol(`31st Mar ${prevFYEnd} (₹)`)}</tr>
  <tr><td>(i) Amount remaining unpaid to MSME suppliers as at year-end</td><td class="right">Nil</td><td class="right">Nil</td></tr>
  <tr><td>(ii) Interest due thereon</td><td class="right">Nil</td><td class="right">Nil</td></tr>
  <tr><td>(iii) Interest paid under Section 16 of MSMED Act</td><td class="right">Nil</td><td class="right">Nil</td></tr>
  <tr><td>(iv) Amount of interest due and payable for delayed payment</td><td class="right">Nil</td><td class="right">Nil</td></tr>
  <tr><td>(v) Interest accrued and remaining unpaid</td><td class="right">Nil</td><td class="right">Nil</td></tr>
  <tr><td>(vi) Amount of further interest remaining due and payable in succeeding years</td><td class="right">Nil</td><td class="right">Nil</td></tr>
</table>

<!-- ══════════════ NOTE 31: AGEING (Schedule III Amendment 2022) ══════════════ -->
<h2>Note 31 — Ageing Schedule of Trade Receivables and Trade Payables</h2>
<p><strong>A. Ageing of Trade Receivables as at 31<sup>st</sup> March, ${fyEnd}:</strong></p>
<table style="font-size:10pt;">
  <tr>
    <th rowspan="2">Category</th>
    <th colspan="4" class="center">Outstanding for following periods from due date</th>
    <th rowspan="2" class="right">Total</th>
  </tr>
  <tr>
    <th class="right">Less than 6 months</th>
    <th class="right">6 months – 1 year</th>
    <th class="right">1 – 2 years</th>
    <th class="right">More than 2 years</th>
  </tr>
  <tr><td>Undisputed — Considered Good</td><td class="right"></td><td class="right"></td><td class="right"></td><td class="right"></td><td class="right"></td></tr>
  <tr><td>Undisputed — Doubtful</td><td class="right"></td><td class="right"></td><td class="right"></td><td class="right"></td><td class="right"></td></tr>
  <tr><td>Disputed — Considered Good</td><td class="right"></td><td class="right"></td><td class="right"></td><td class="right"></td><td class="right"></td></tr>
  <tr><td>Disputed — Doubtful</td><td class="right"></td><td class="right"></td><td class="right"></td><td class="right"></td><td class="right"></td></tr>
  <tr style="font-weight:bold; background:#f2f2f2;"><td><strong>Total</strong></td><td class="right"></td><td class="right"></td><td class="right"></td><td class="right"></td><td class="right"></td></tr>
</table>

<p><strong>B. Ageing of Trade Payables as at 31<sup>st</sup> March, ${fyEnd}:</strong></p>
<table style="font-size:10pt;">
  <tr>
    <th rowspan="2">Category</th>
    <th colspan="4" class="center">Outstanding for following periods from due date</th>
    <th rowspan="2" class="right">Total</th>
  </tr>
  <tr>
    <th class="right">Less than 1 year</th>
    <th class="right">1 – 2 years</th>
    <th class="right">2 – 3 years</th>
    <th class="right">More than 3 years</th>
  </tr>
  <tr><td>MSME</td><td class="right"></td><td class="right"></td><td class="right"></td><td class="right"></td><td class="right"></td></tr>
  <tr><td>Others</td><td class="right"></td><td class="right"></td><td class="right"></td><td class="right"></td><td class="right"></td></tr>
  <tr><td>Disputed Dues — MSME</td><td class="right"></td><td class="right"></td><td class="right"></td><td class="right"></td><td class="right"></td></tr>
  <tr><td>Disputed Dues — Others</td><td class="right"></td><td class="right"></td><td class="right"></td><td class="right"></td><td class="right"></td></tr>
  <tr style="font-weight:bold; background:#f2f2f2;"><td><strong>Total</strong></td><td class="right"></td><td class="right"></td><td class="right"></td><td class="right"></td><td class="right"></td></tr>
</table>

<!-- ══════════════ NOTE 32: MANDATORY DISCLOSURES (Schedule III, 2022 Amendment) ══════════════ -->
<h2>Note 32 — Other Disclosures</h2>

<p><strong>(i) Benami Property:</strong> The Company has not been declared as a wilful defaulter by any bank or financial institution or other lender. No proceedings have been initiated or are pending against the Company for holding any benami property under the Benami Transactions (Prohibition) Act, 1988 and Rules made thereunder.</p>

<p><strong>(ii) Undisclosed Income:</strong> The Company has not surrendered or disclosed any transaction not recorded in the books of accounts in the course of any tax assessments under the Income Tax Act, 1961 during the year. There are no previously unrecorded income and related assets to be recorded in the books of accounts.</p>

<p><strong>(iii) Crypto / Virtual Assets:</strong> The Company has not traded or invested in Crypto Currency or Virtual Currency during the Financial Year ${fy}.</p>

<p><strong>(iv) Property Title Deeds:</strong> All immovable properties (land and buildings) are held in the name of the Company except as disclosed below: [NIL — unless stated].</p>

<p><strong>(v) Loans / Advances to Promoters, Directors, KMPs:</strong> There are no loans or advances outstanding from Promoters, Directors, Key Managerial Personnel or their relatives in the nature of a loan.</p>

<p><strong>(vi) Capital-Work-in-Progress (CWIP) Ageing:</strong> There is no Capital-Work-in-Progress as at 31<sup>st</sup> March, ${fyEnd} / The ageing of CWIP is as follows: [to be filled if applicable].</p>

<p><strong>(vii) Wilful Defaulter:</strong> The Company has not been declared a wilful defaulter by any bank, financial institution, government or government authority.</p>

<!-- ══════════════ NOTE 33: PREVIOUS YEAR FIGURES ══════════════ -->
<h2>Note 33 — Previous Year Figures</h2>
<p>Figures for the previous year have been regrouped / reclassified wherever necessary to make them comparable with those of the current year.</p>

<!-- ══════════════ NOTE 34: FIGURES IN ₹ ══════════════ -->
<h2>Note 34 — Figures</h2>
<p>All figures in these financial statements are in Indian Rupees (₹) and are stated in absolute terms unless otherwise indicated.</p>

<!-- ══════════════ SIGNATURE ══════════════ -->
<div class="sig-block">
  <p>As per our report of even date attached<br>
  For <strong>${data.auditor.firmName ? `M/s ${data.auditor.firmName}` : "[Firm Name]"}</strong><br>
  Chartered Accountants<br>
  ${data.auditor.frn ? `FRN: ${data.auditor.frn}` : "FRN: [_______]"}</p>

  <div class="sig-row">
    <div class="sig-col">
      <div class="sig-line">
        <strong>${data.auditor.partnerName || "[Partner Name]"}</strong><br>
        Partner<br>
        M. No.: ${data.auditor.membershipNo || "[_______]"}<br>
        UDIN: ${data.auditor.udin || "[____________________]"}
      </div>
    </div>
    <div class="sig-col">
      <div style="margin-top: 10pt;">
        <p>For and on behalf of the Board of Directors of<br>
        <strong>${data.companyName}</strong></p>
        <div class="sig-line">
          <strong>${data.signatoryDirectors.director1.name || "________________"}</strong><br>
          ${data.signatoryDirectors.director1.designation || "Director"}<br>
          DIN: ${data.signatoryDirectors.director1.din || "________________"}
        </div>
      </div>
    </div>
  </div>

  <p class="mt-16">
    Place: ${data.placeOfSigning || "________________"}<br>
    Date: ${data.dateOfReport ? data.dateOfReport : "________________"}
  </p>
</div>

`;

  return wrapPage(
    `Notes to Financial Statements — ${data.companyName} — FY ${fy}`,
    bodyHtml
  );
}
