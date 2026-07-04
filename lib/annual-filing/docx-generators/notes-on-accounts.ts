/**
 * Notes to Financial Statements — docx generator
 */

import { AlignmentType, Document, ImageRun, Paragraph, Table, TableCell, TableRow, WidthType } from "docx";
import type { AnnualFilingData } from "../types";
import { buildDividendText } from "../types";
import { fmtDate, fyEndYear, fyStartYear } from "../utils";
import {
  FONT, MARGIN, NO_BORDER, PAGE_HEIGHT, PAGE_WIDTH,
  SZ10, SZ12, SZ9, USABLE_WIDTH,
  base64ToBuffer, blankLine, buildFooter, buildHeader, buildTable,
  h2, h3, p, pr, r, sigParagraphs, toDocxBuffer,
} from "./utils";

export async function buildNotesOnAccountsDocx(data: AnnualFilingData): Promise<Buffer> {
  const fy = data.financialYear;
  const fyEnd = fyEndYear(fy);
  const fyStart = fyStartYear(fy);
  const prevFY = `${Number(fyStart) - 1}-${fyStart.slice(2)}`;

  const isSection8 = data.companyType === "section8";
  const isOPC = data.companyType === "opc";
  const isFPC = data.companyType === "fpc";
  const pandlLabel = isSection8 ? "Income and Expenditure Account" : "Statement of Profit and Loss";

  let corporateInfo: string;
  if (isFPC) {
    corporateInfo = `${data.companyName} is a Producer Company incorporated in India under the provisions of Part IXA of the Companies Act, 1956 read with the Companies Act, 2013. The CIN of the Company is ${data.cin || "____"}. The Company is registered under ${data.rocName || "Registrar of Companies"}. The registered office of the Company is situated at ${data.regAddress || "____"}. The principal business of the Company is ${data.businessDescription || "procurement, processing, marketing and other activities for the benefit of its producer members"}.`;
  } else if (isSection8) {
    corporateInfo = `${data.companyName} is a Company incorporated under Section 8 of the Companies Act, 2013 for the promotion of charitable objects including ${data.businessDescription || "promotion of commerce, arts, science, education, research, social welfare, religion, charity, protection of environment or any such other object"}. The CIN of the Company is ${data.cin || "____"}. The Company is registered under ${data.rocName || "Registrar of Companies"}. The registered office of the Company is situated at ${data.regAddress || "____"}.`;
  } else if (isOPC) {
    const bizDesc = data.businessDescription || data.principalActivity || "";
    corporateInfo = `${data.companyName} is a One Person Company (OPC) incorporated in India under Section 3(1)(c) of the Companies Act, 2013 having a single member${bizDesc ? `, engaged in ${bizDesc}` : ""}. The CIN of the Company is ${data.cin || "____"}. The Company is registered under ${data.rocName || "Registrar of Companies"}. The registered office of the Company is situated at ${data.regAddress || "____"}.`;
  } else {
    const bizDesc = data.businessDescription || data.principalActivity || "";
    corporateInfo = `${data.companyName} is a Private Limited Company incorporated in India under the Companies Act, 2013${bizDesc ? `, engaged in ${bizDesc}` : ""}. The CIN of the Company is ${data.cin || "____"}. The Company is registered under ${data.rocName || "Registrar of Companies"}. The registered office of the Company is situated at ${data.regAddress || "____"}.`;
  }

  const nomineeDirector = data.directors.find(d => d.designation?.toLowerCase().includes("nominee"));

  const patCurrent = parseFloat((data.financials.profitAfterTax || "0").replace(/,/g, "")) || 0;
  const patPrev = parseFloat((data.financials.prevProfitAfterTax || "0").replace(/,/g, "")) || 0;
  const sharesNum = data.totalShares || 0;
  const faceVal = data.nominalValuePerShare || "10";
  const epsCurr = sharesNum > 0 ? (patCurrent / sharesNum).toFixed(2) : "—";
  const epsPrev = sharesNum > 0 ? (patPrev / sharesNum).toFixed(2) : "—";

  const aud = data.auditor;
  const auditorFirmName = aud.firmName ? `M/s ${aud.firmName.replace(/^M\/s\s*/i, "")}` : "[Firm Name]";
  const auditorFRN = aud.frn || "[_______]";
  const partnerName = aud.partnerName || "[Partner Name]";
  const partnerLabel = aud.firmType === "proprietorship" ? "Proprietor" : "Partner";
  const memberNo = aud.membershipNo || "[_______]";
  const udin = aud.udin || "[____________________]";
  const auditorDate = fmtDate(aud.reportDate || data.dateOfReport) || "________________";
  const signingPlace = data.placeOfSigning || "________________";

  const dir1 = data.signatoryDirectors.director1;
  const dir2 = data.signatoryDirectors.director2;
  const dir3 = data.signatoryDirectors.director3;

  const revenueText = isFPC
    ? "Revenue is recognized on accrual basis. Revenue from operations includes income from procurement, processing, storage and marketing of produce on behalf of producer members. Revenue from Services including applicable taxes is excluded while recording Revenue from Operations. Patronage bonus to members, if declared, is recognised as an expenditure."
    : "Revenue is recognized on accrual basis. Income from Services is recognized as per the terms of the contract upon rendering of Services. Revenue from Services including service tax/GST is excluded while recording Revenue from Operations.";

  const dirRemunerationText = data.directorRemunerationCurrent
    ? `Details of Directors Remuneration: Rs. ${data.directorRemunerationCurrent} paid during the Financial Year ${fy}. (Previous Year: Rs. ${data.directorRemunerationPrev || "NIL"})`
    : isOPC
    ? `Details of Directors Remuneration: As per the terms of appointment, the sole director was paid a remuneration of Rs. __________ during the Financial Year ${fy}. (Previous Year: Rs. __________)`
    : "Details of Directors Remuneration: NIL";

  let otherNote: string;
  if (isSection8) {
    otherNote = "The Company is a Section 8 Company incorporated for the promotion of charitable/non-profit objects. The Company is prohibited under Section 8 of the Companies Act, 2013 from paying dividends to its members. Any income or property of the Company shall be applied solely towards the promotion of the objects of the Company as set out in its Memorandum of Association.";
  } else if (isFPC) {
    otherNote = "The Company is a Producer Company formed and registered under the provisions of Part IXA of the Companies Act, 1956 read with the Companies Act, 2013. The objects of the Company include production, harvesting, procurement, grading, pooling, handling, marketing, selling and export of primary produce of members and import of goods or services for their benefit. The Company complies with Sections 581A to 581ZT of the Companies Act, 1956 as saved and continued under the Companies Act, 2013. Disclosure pursuant to Notification No. S.O. 1702(E) dated 16th June, 2016: The amount due to Micro, Small and Medium Enterprises as on date is Rs. NIL.";
  } else {
    const udyamLine = data.hasUdyamRegistration
      ? "The Company has obtained Udyam Registration under the Micro, Small and Medium Enterprises Development Act, 2006."
      : "The Company has not obtained Udyam Registration under the Micro, Small and Medium Enterprises Development Act, 2006.";
    otherNote = `Disclosure pursuant to Notification No. S.O. 1702(E) dated 16th June, 2016 issued by the Ministry of Corporate Affairs: ${udyamLine} The amount due to Micro, Small and Medium Enterprises as on date is Rs. NIL.`;
  }

  const children: (Paragraph | Table)[] = [
    // Header
    new Paragraph({ children: [r(data.companyName.toUpperCase(), { bold: true, size: SZ12 })], alignment: AlignmentType.CENTER, spacing: { after: 60 } }),
    new Paragraph({ children: [r(`CIN: ${data.cin || "____"}`, { size: SZ10 })], alignment: AlignmentType.CENTER, spacing: { after: 60 } }),
    ...(data.regAddress ? [new Paragraph({ children: [r(data.regAddress, { size: SZ10 })], alignment: AlignmentType.CENTER, spacing: { after: 60 } })] : []),
    new Paragraph({ children: [r("NOTES TO FINANCIAL STATEMENTS", { bold: true, size: SZ12, underline: true })], alignment: AlignmentType.CENTER, spacing: { after: 60 } }),
    new Paragraph({ children: [r(`For the year ended 31st March, ${fyEnd}`, { size: SZ10 })], alignment: AlignmentType.CENTER, spacing: { after: 200 } }),

    h2("A. Corporate Information"),
    p(corporateInfo),
    ...(data.incorporationDate ? [pr([r("The Company was incorporated on ", { size: SZ12 }), r(fmtDate(data.incorporationDate), { bold: true, size: SZ12 }), r(".", { size: SZ12 })], { after: 120 })] : []),
    ...(isOPC && nomineeDirector ? [p(`The Company has nominated ${nomineeDirector.name} as the Nominee of the sole member in the event of death or incapacity of the sole member, as required under Section 3(1)(c) of the Companies Act, 2013.`)] : []),

    h2("B. Significant Accounting Policies"),
    h3("a. Basis of Accounting"),
    p("These financial statements are prepared in accordance with Indian Generally Accepted Accounting Principles (GAAP) under the historical cost convention on an accrual basis. GAAP comprises mandatory accounting standards as prescribed under Section 133 of the Companies Act, 2013 read with Companies (Accounting Standards) Rules, 2021, and guidelines issued by the Institute of Chartered Accountants of India (ICAI). The accounts are prepared based on the concept of a going concern."),
    p("System of Accounting: The Company follows the Accrual System of Accounting and these accounts are prepared in accordance with the Indian Accounting Standards notified under the provisions of Section 133 of the Companies Act, 2013 as amended from time to time. The Company has adopted a 12-month operating cycle for classifying assets and liabilities into current and non-current."),

    h3("b. Use of Estimates"),
    p("In preparing the Company's financial statements in conformity with accounting principles generally accepted in India, management is required to make estimates and assumptions that affect the reported amounts of assets and liabilities and the disclosure of contingent liabilities as of the date of the financial statements, and reported amounts of revenues and expenses during the reporting period. Actual results could differ from those estimates. Any revisions to accounting estimates are recognised prospectively in current and future periods."),

    h3("c. Property, Plant & Equipment (Including Intangibles)"),
    p("Fixed assets are stated at cost of acquisition net of recoverable taxes less depreciation. All costs attributable to acquisition including incidental expenditure incurred during installation and erection forming part of the asset has been capitalised as part of the asset."),

    h3("d. Depreciation and Amortization"),
    p(`Depreciation on fixed assets is provided on ${data.depreciationMethod === "slm" ? "Straight Line Method (SLM)" : "Written Down Value Method (WDV Method)"} for the following assets for the period from the date they are available for use:`),
    buildTable(
      ["Asset", "Useful Life"],
      [
        ["Plant & Machinery", "10 Years"],
        ["Computer and Peripherals", "3 Years"],
        ["Furniture & Fixtures", "15 Years"],
        ["Office Equipment", "10 Years"],
        ["Intangible Assets", "3 Years"],
      ],
      [6000, 3638], { fontSize: SZ10 }
    ),
    blankLine(),

    h3("e. Inventories"),
    p(data.inventoryMethod === "na"
      ? "The Company does not hold any inventories in the normal course of its operations. Accordingly, this accounting policy is not applicable to the Company."
      : `The inventories are valued at cost or net realisable value, whichever is lower. Cost is determined by ${data.inventoryMethod === "weighted_avg" ? "Weighted Average Method" : "First In First Out (FIFO) Method"}.`
    ),

    h3("f. Revenue Recognition"),
    p(revenueText),

    h3("g. Employee Benefits"),
    p(`Expenditure on Employee Benefits is charged to the ${pandlLabel} as per the requirement of Accounting Standard 15 (Revised) on Employee Benefits issued by the Institute of Chartered Accountants of India (ICAI):`),
    p("a. Defined Contribution Plans: The Company's contribution to Defined Contribution plans in the form of Provident Fund is charged to the " + pandlLabel + " of the year when the contributions to the respective funds are due. As per the approved scheme with the prescribed authority, there is no obligation other than contribution payable to the fund."),
    p("b. Defined Benefit Plans: The Company has a defined benefit plan in the form of Employee Gratuity Plan and Leave Encashment. Provision for Gratuity and Leave Encashment is made based on the Projected Unit Credit (PUC) Method through an actuarial valuation carried out at the balance sheet date. In accordance with the applicable Indian laws, the Company provides for gratuity, a defined benefit retirement plan (the Gratuity Plan) for all employees."),
    p("c. Short-term employee benefits: All employee benefits payable within twelve months of rendering the service are classified as short-term employee benefits. Benefits such as salaries, wages, expected cost of bonus and ex-gratia are recognised during the period in which the employee renders the related service."),
    p("d. Long-term employee benefits: Compensated absences which are not expected to occur within twelve months after the end of the period in which the employee renders the related service are recognised as a liability at the present value of the defined benefit obligation as at the balance sheet date."),

    h3("h. Taxation"),
    p("Income tax expense for the year comprises current tax and deferred tax."),
    p(`Current tax liability has been computed in accordance with the provisions of the Income Tax Act, 1961 for the accounting period ended on 31st March, ${fyEnd}.`),
    p("Deferred tax is recognized on timing differences, being the difference between taxable income and accounting income that originate in one period and are capable of reversal in one or more subsequent periods. Deferred tax assets and liabilities are measured at tax rates prescribed under the Income Tax Act, 1961 that have been enacted or substantively enacted by the Balance Sheet date. Deferred tax assets are recognized only to the extent there is virtual certainty of realization. Deferred tax is recognized as per AS-22."),

    h3("i. Provisions and Contingencies"),
    p("A provision is recognised when the company has a present obligation as a result of a past event and it is probable that an outflow of resources will be required to settle the obligation, in respect of which a reliable estimate can be made. Provisions are not discounted to present value and are determined based on best estimate required to settle the obligation at the balance sheet date. These are reviewed at each balance sheet date and adjusted to reflect the current best estimates."),
    p("Contingent liability is disclosed for possible obligations which will be confirmed only by future events not wholly within the control of the company, or present obligations where it is not probable that an outflow of resources will be required or the amount cannot be estimated reliably. Contingent assets are not recognised in the financial statements since this may result in recognition of income that may never be achieved."),

    h3("j. Earnings Per Share"),
    p(isSection8
      ? "The Company is incorporated as a Section 8 (Not-for-Profit) Company. Earnings per Share (AS 20) is not applicable as the Company does not distribute profits to its members."
      : "Basic earnings per share are calculated by dividing the net profit for the year attributable to equity shareholders (after deducting preference dividends and attributable taxes) by the weighted average number of equity shares outstanding during the year.\n\nFor the purpose of calculating diluted earnings per share, the net profit or loss for the period attributable to equity shareholders and the weighted average number of shares outstanding during the period are adjusted for the effects of all dilutive potential equity shares."
    ),
    ...(!isSection8 && sharesNum > 0 ? [
      buildTable(
        ["Particulars", `FY ${fy}`, `FY ${prevFY}`],
        [
          ["Net Profit / (Loss) after Tax attributable to equity shareholders (Rs.)", data.financials.profitAfterTax || "—", data.financials.prevProfitAfterTax || "—"],
          ["Weighted average number of equity shares outstanding", sharesNum.toLocaleString("en-IN"), sharesNum.toLocaleString("en-IN")],
          ["Face value per share (Rs.)", faceVal, faceVal],
          ["Basic and Diluted Earnings Per Share (Rs.)", epsCurr, epsPrev],
        ],
        [5000, 2300, 2338], { fontSize: SZ10 }
      ),
      blankLine(),
    ] : []),

    h3("k. Impairment of Asset"),
    p(`An asset is treated as impaired when the carrying cost of the asset exceeds its recoverable value. An impairment loss is charged to the ${pandlLabel} in the year in which an asset is identified as impaired. The impairment loss recognised in prior accounting periods is reversed if there has been a change in the estimate of recoverable amount.`),

    h3("l. Leases"),
    p(`Leases, where the lessor effectively retains substantially all the risks and benefits of ownership of the leased item, are classified as operating leases. Operating lease payments are recognised as an expense in the ${pandlLabel} on a straight-line basis over the lease term.`),

    h3("m. Operating Cycle"),
    p("Based on the nature of products/activities of the company and the normal time between acquisition of assets and their realisation in cash or cash equivalents, the company has determined its operating cycle as 12 months for the purpose of classification of its assets and liabilities as current and non-current."),

    h3("n. General"),
    p("Accounting policies not specifically referred to are consistent with generally accepted accounting principles."),

    h3("o. Cash and Cash Equivalents"),
    p("Cash and cash equivalents comprise cash at bank and in hand and short-term investments with an original maturity of three months or less."),

    h3("p. Directors Remuneration"),
    p(dirRemunerationText),

    h3("q. Capital and Other Commitments"),
    p("Capital and other commitments: Rs. Nil"),

    h3("r. Details of Payment to Auditors"),
    buildTable(
      ["Particulars", `Current Year (FY ${fy}) (Rs.)`, `Previous Year (FY ${prevFY}) (Rs.)`],
      [
        ["Statutory Audit Fees", data.auditFeesCurrent || "—", data.auditFeesPrev || "—"],
        ["Tax Audit Fees", data.taxAuditFeesCurrent || "—", data.taxAuditFeesPrev || "—"],
      ],
      [4000, 2900, 2738], { fontSize: SZ10 }
    ),
    blankLine(),

    h3("s. Depreciation"),
    p(`Depreciation has been provided for in the accounts on ${data.depreciationMethod === "slm" ? "Straight Line (SLM) Method" : "Written Down Value (WDV) Method"} in accordance with and on the basis of useful life of the assets as prescribed under Schedule II of the Companies Act, 2013. Assets costing less than Rs. 5,000/- are fully depreciated in the year of acquisition.`),

    h3("t. Functional and Presentation Currency"),
    p("The functional and presentation currency of the Company is Indian Rupees (Rs.). Amounts in the financial statements are rounded off to the nearest rupee."),

    h3("u. Other"),
    p(otherNote),
    ...(isSection8 ? [p("Note: The Company being a Section 8 Company is prohibited from distributing surplus as dividend. Any surplus is applied solely towards the furtherance of the Company's objects.", { italic: true })] : []),
    ...(isFPC ? [p("Note: As a Producer Company, after making provisions for limited return and reserves as required under Part IXA of the Companies Act, 1956, the Board may distribute the remaining surplus as Patronage Bonus amongst members in proportion to their participation in the business of the Company.", { italic: true })] : []),

    h3("v. Dividend"),
    p(isSection8
      ? "The Company being a Section 8 not-for-profit entity is prohibited from declaring or paying any dividend. Any surplus is applied solely towards the furtherance of the Company's objects."
      : data.dividendDeclared
      ? `The Board of Directors has declared / recommended a dividend of ${buildDividendText(data)} on the Equity Shares of the Company for the Financial Year ${fy} in compliance with the provisions of Section 123 of the Companies Act, 2013.`
      : `The Board of Directors has not recommended any dividend on the Equity Shares of the Company for the Financial Year ${fy}. No dividend was paid during the year. There is no unpaid / unclaimed dividend pending for transfer to the Investor Education and Protection Fund (IEPF).`
    ),
    blankLine(),
    blankLine(),

    // Dual signature block
  ];

  // Build dual sig table: auditor left, directors right
  const audLeftChildren: Paragraph[] = [
    p(`As per our report of even date attached`, { align: AlignmentType.LEFT, after: 60 }),
    pr([r("For ", { size: SZ12 }), r(auditorFirmName, { bold: true, size: SZ12 })], { align: AlignmentType.LEFT, after: 60 }),
    p("Chartered Accountants", { after: 60, align: AlignmentType.LEFT }),
    p(`Firm No.: ${auditorFRN}`, { after: 80, align: AlignmentType.LEFT }),
  ];
  if (aud.sealBase64) {
    try {
      const buf = base64ToBuffer(aud.sealBase64);
      audLeftChildren.push(new Paragraph({ children: [new ImageRun({ data: buf, transformation: { width: 80, height: 50 }, type: "jpg" })], spacing: { after: 40, before: 40 } }));
    } catch {}
  }
  if (aud.signatureBase64) {
    try {
      const buf = base64ToBuffer(aud.signatureBase64);
      audLeftChildren.push(new Paragraph({ children: [new ImageRun({ data: buf, transformation: { width: 90, height: 36 }, type: "jpg" })], spacing: { after: 40, before: aud.sealBase64 ? 20 : 80 } }));
    } catch {}
  }
  audLeftChildren.push(
    p(partnerName, { bold: true, after: 40, align: AlignmentType.LEFT }),
    p(partnerLabel, { after: 40, align: AlignmentType.LEFT }),
    p(`M.No.: ${memberNo}`, { after: 40, align: AlignmentType.LEFT }),
    p(`UDIN: ${udin}`, { after: 40, align: AlignmentType.LEFT })
  );

  const dirRightChildren: Paragraph[] = [
    pr([r("For and on behalf of the Board", { size: SZ12 })], { align: AlignmentType.LEFT, after: 60 }),
    pr([r("FOR:- ", { size: SZ12 }), r(data.companyName, { bold: true, size: SZ12 })], { align: AlignmentType.LEFT, after: 80 }),
  ];
  const dirsForSig = [
    dir1,
    ...(dir2?.name ? [dir2] : []),
    ...(dir3?.name ? [dir3] : []),
  ];
  for (const d of dirsForSig) {
    if (d.signatureBase64) {
      try {
        const buf = base64ToBuffer(d.signatureBase64);
        dirRightChildren.push(new Paragraph({ children: [new ImageRun({ data: buf, transformation: { width: 90, height: 36 }, type: "jpg" })], spacing: { after: 40, before: 40 } }));
      } catch {}
    } else {
      dirRightChildren.push(new Paragraph({ children: [r("", { size: SZ12 })], spacing: { before: 80, after: 0 } }));
    }
    dirRightChildren.push(
      p(d.name || "________________", { bold: true, after: 40, align: AlignmentType.LEFT }),
      p(d.designation || "Director", { after: 40, align: AlignmentType.LEFT }),
      p(`DIN: ${d.din || "________________"}`, { after: 60, align: AlignmentType.LEFT })
    );
  }

  const halfW = Math.floor(USABLE_WIDTH / 2);
  const sigTable = new Table({
    rows: [new TableRow({
      children: [
        new TableCell({ children: audLeftChildren, width: { size: halfW, type: WidthType.DXA }, borders: { top: NO_BORDER, bottom: NO_BORDER, left: NO_BORDER, right: NO_BORDER } }),
        new TableCell({ children: dirRightChildren, width: { size: halfW, type: WidthType.DXA }, borders: { top: NO_BORDER, bottom: NO_BORDER, left: NO_BORDER, right: NO_BORDER } }),
      ],
    })],
    width: { size: USABLE_WIDTH, type: WidthType.DXA },
    borders: { top: NO_BORDER, bottom: NO_BORDER, left: NO_BORDER, right: NO_BORDER, insideHorizontal: NO_BORDER, insideVertical: NO_BORDER },
  });
  children.push(sigTable);
  children.push(
    pr([r(`Date: ${auditorDate}     Place: ${signingPlace}`, { size: SZ12 })], { align: AlignmentType.LEFT, before: 120, after: 0 })
  );

  const doc = new Document({
    sections: [{
      properties: {
        page: {
          size: { width: PAGE_WIDTH, height: PAGE_HEIGHT },
          margin: { top: MARGIN, right: MARGIN, bottom: MARGIN, left: MARGIN },
        },
      },
      headers: { default: buildHeader(data.companyName, "Notes to Financial Statements") },
      footers: { default: buildFooter() },
      children,
    }],
  });

  return toDocxBuffer(doc);
}
