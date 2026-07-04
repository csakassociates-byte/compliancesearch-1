/**
 * Board Report Rule 8A (Abridged) — docx generator
 * For OPC and Small Companies
 */

import {
  AlignmentType,
  Document,
  Paragraph,
  Table,
  TableCell,
  TableRow,
  TextRun,
  WidthType,
} from "docx";
import type { AnnualFilingData } from "../types";
import { buildDividendText } from "../types";
import { fmtDate, fmtRs, fyEndYear, fyStartYear } from "../utils";
import {
  FONT,
  MARGIN,
  NO_BORDER,
  PAGE_HEIGHT,
  PAGE_WIDTH,
  SZ10,
  SZ12,
  SZ9,
  THIN_BORDER,
  USABLE_WIDTH,
  base64ToBuffer,
  blankLine,
  buildFooterWithDirectors,
  buildHeader,
  buildTable,
  h2,
  h3,
  p,
  pr,
  r,
  sigParagraphs,
  toDocxBuffer,
} from "./utils";
import { ImageRun } from "docx";

function ordinalStr(n: number): string {
  const v = n % 100;
  if (v >= 11 && v <= 13) return `${n}th`;
  switch (n % 10) {
    case 1: return `${n}st`;
    case 2: return `${n}nd`;
    case 3: return `${n}rd`;
    default: return `${n}th`;
  }
}

const TENURE_WORDS: Record<number, string> = {
  1: "one (1)", 2: "two (2)", 3: "three (3)", 4: "four (4)", 5: "five (5)",
};

function getStatutoryAuditorText(data: AnnualFilingData): string {
  const a = data.auditor;
  const isProp = a.firmType === "proprietorship";
  const auditorWord = isProp ? "Auditor" : "Auditors";
  const auditorName = isProp
    ? `${a.partnerName}, Chartered Accountant (Membership No. ${a.membershipNo})`
    : `M/s. ${a.firmName}, Chartered Accountants (Firm Registration No. ${a.frn})`;

  if (a.appointmentType === "board" && a.boardAppointmentDate) {
    return `The Board of Directors of the Company, at its meeting held on ${fmtDate(a.boardAppointmentDate)}, appointed ${auditorName}, as the First Statutory ${auditorWord} of the Company pursuant to Section 139(6) of the Companies Act, 2013, to hold office until the conclusion of the First Annual General Meeting of the Company.`;
  }
  if (a.appointmentType === "agm" && a.appointmentAGMNo && a.appointmentYear) {
    const tenure = a.tenureYears || 5;
    const tenureWord = TENURE_WORDS[tenure] || `${tenure}`;
    const endAGMNo = a.appointmentAGMNo + tenure;
    const apptOrd = ordinalStr(a.appointmentAGMNo);
    const endOrd = ordinalStr(endAGMNo);
    return `The Company at its ${apptOrd} Annual General Meeting held in ${a.appointmentYear}, appointed ${auditorName}, as the Statutory ${auditorWord} of the Company for a period of ${tenureWord} consecutive year${tenure > 1 ? "s" : ""}, to hold office from the conclusion of the ${apptOrd} Annual General Meeting until the conclusion of the ${endOrd} Annual General Meeting of the Company.`;
  }
  if (a.firmName) {
    return isProp
      ? `${a.partnerName}, Chartered Accountant (Membership No. ${a.membershipNo}), is the Statutory ${auditorWord} of the Company. The appointment is in compliance with the applicable provisions of Section 139 of the Companies Act, 2013.`
      : `M/s. ${a.firmName}, Chartered Accountants (Firm Registration No. ${a.frn}), are the Statutory ${auditorWord} of the Company. The appointment is in compliance with the applicable provisions of Section 139 of the Companies Act, 2013.`;
  }
  return `The Statutory Auditors of the Company hold office as per applicable provisions of the Companies Act, 2013. Their appointment has been duly made in compliance with Section 139 of the Companies Act, 2013.`;
}

function dirHasLeft(d: AnnualFilingData["directors"][0]): boolean {
  return d.changedDuringYear === true && (d.changeType === "resigned" || d.changeType === "ceased" || d.isActive === false);
}

function dirIsFirstDirector(d: AnnualFilingData["directors"][0], data: AnnualFilingData): boolean {
  return !!(d.dateOfAppointment && data.incorporationDate && d.dateOfAppointment === data.incorporationDate);
}

export async function buildBoardReportRule8aDocx(data: AnnualFilingData): Promise<Buffer> {
  const fy = data.financialYear;
  const fyEnd = fyEndYear(fy);
  const fyStart = fyStartYear(fy);
  const prevFY = `${Number(fyStart) - 1}-${fyStart.slice(2)}`;
  const isOPC = data.companyType === "opc";
  const totalMeetings = data.boardMeetings?.length || 0;
  const totalMeetingsWord = ["Zero","One","Two","Three","Four","Five","Six","Seven","Eight","Nine","Ten","Eleven","Twelve"][totalMeetings] ?? String(totalMeetings);

  function calcARNo(): number {
    if (!data.incorporationDate) return 1;
    const d = new Date(data.incorporationDate);
    const incFYStart = d.getMonth() + 1 >= 4 ? d.getFullYear() : d.getFullYear() - 1;
    const fyStartNum = parseInt(data.financialYear.split("-")[0]);
    return Math.max(1, fyStartNum - incFYStart + 1);
  }
  const arNo = data.annualReportNo || calcARNo();
  const arLabel = `${ordinalStr(arNo)} Annual Report`;

  const reportDate = fmtDate(data.dateOfReport) || "________________";
  const reportPlace = data.placeOfSigning || data.stateOfIncorporation || "";

  const nomineeDirector = data.directors.find(d => d.designation?.toLowerCase().includes("nominee"));

  const sig1 = data.signatoryDirectors.director1;
  const sig2 = data.signatoryDirectors.director2;
  const sig3 = data.signatoryDirectors.director3;

  const sigDirs = [
    { name: sig1.name, designation: sig1.designation, din: sig1.din, base64: sig1.signatureBase64 },
    ...(sig2?.name ? [{ name: sig2.name, designation: sig2.designation, din: sig2.din, base64: sig2.signatureBase64 }] : []),
    ...(sig3?.name ? [{ name: sig3.name, designation: sig3.designation, din: sig3.din, base64: sig3.signatureBase64 }] : []),
  ];

  const meetingRows = (data.boardMeetings || []).map(m => [
    String(m.serialNo),
    fmtDate(m.date) || "—",
    m.directorsPresent?.join(", ") || "—",
  ]);
  const meetingColWidths = [900, 2000, USABLE_WIDTH - 2900];
  const meetingTable = buildTable(
    ["Sl. No.", "Date of Meeting", "Directors Present"],
    meetingRows.length > 0 ? meetingRows : [["—", "—", "—"]],
    meetingColWidths,
    { fontSize: SZ10 }
  );

  const activeDirectors = data.directors.filter(d => d.isActive);
  const attendanceRows = activeDirectors.map(d => {
    const attended = (data.boardMeetings || []).filter(m =>
      m.directorsPresent?.some(np => np.toLowerCase().includes(d.name.toLowerCase()))
    ).length;
    const pct = totalMeetings > 0 ? `${Math.round((attended / totalMeetings) * 100)}%` : "—";
    return [d.name, d.designation, String(totalMeetings), attended > 0 ? String(attended) : "—", attended > 0 ? pct : "—"];
  });
  const attendColWidths = [2400, 2000, 1400, 1500, 1538]; // ~sum=9238 within USABLE
  const attendTable = buildTable(
    ["Name of Director", "Designation", "Meetings Entitled", "Meetings Attended", "% Attendance"],
    attendanceRows.length > 0 ? attendanceRows : [["—", "—", "—", "—", "—"]],
    attendColWidths,
    { fontSize: SZ10 }
  );

  const dirRows = data.directors
    .filter(d => d.isActive || dirHasLeft(d) || d.changeType === "resigned" || d.changeType === "ceased")
    .map((d, i) => {
      const left = dirHasLeft(d);
      const statusLabel = left ? (d.changeType === "resigned" ? "Resigned" : "Ceased") : "Active";
      const isFirst = dirIsFirstDirector(d, data);
      const apptText = `${fmtDate(d.dateOfAppointment) || "—"}${isFirst ? " (First Director)" : ""}`;
      return [String(i + 1), d.name, d.din || "—", d.designation, apptText, d.dateOfCessation ? fmtDate(d.dateOfCessation) : "—", statusLabel];
    });
  const dirColWidths = [500, 2000, 1200, 1800, 1500, 1400, 900];
  const dirTable = buildTable(
    ["Sl.", "Name of Director", "DIN", "Designation", "Date of Appointment", "Date of Cessation", "Status"],
    dirRows.length > 0 ? dirRows : [["—", "—", "—", "—", "—", "—", "—"]],
    dirColWidths,
    { fontSize: SZ9 }
  );

  const finColWidths = [5400, 2100, 2138];
  const finTable = buildTable(
    ["Particulars", `FY ${fy} (Rs.)`, `FY ${prevFY} (Rs.)`],
    [
      ["Revenue from Operations", fmtRs(data.financials.revenueFromOperations), fmtRs(data.financials.prevRevenueFromOperations)],
      ["Other Income", fmtRs(data.financials.otherIncome), fmtRs(data.financials.prevOtherIncome)],
      ["Total Income", fmtRs(data.financials.totalIncome), fmtRs(data.financials.prevTotalIncome)],
      ["Total Expenses", fmtRs(data.financials.totalExpenses), fmtRs(data.financials.prevTotalExpenses)],
      ["Profit / (Loss) Before Tax", fmtRs(data.financials.profitBeforeTax), fmtRs(data.financials.prevProfitBeforeTax)],
      ["Current Tax", fmtRs(data.financials.currentTax), fmtRs(data.financials.prevCurrentTax)],
      ["Deferred Tax", fmtRs(data.financials.deferredTax), fmtRs(data.financials.prevDeferredTax)],
      ["Profit / (Loss) After Tax (PAT)", fmtRs(data.financials.profitAfterTax), fmtRs(data.financials.prevProfitAfterTax)],
      ["Total Reserves & Surplus", fmtRs(data.financials.reservesAndSurplus), fmtRs(data.financials.prevReservesAndSurplus)],
    ],
    finColWidths,
    { fontSize: SZ10 }
  );

  const capColWidths = [6000, 3638];
  const capTable = buildTable(
    ["Particulars", "Amount (Rs.)"],
    [
      ["Authorised Share Capital", fmtRs(data.financials.authorisedCapital)],
      ["Paid-up Share Capital", fmtRs(data.financials.paidUpCapital)],
    ],
    capColWidths,
    { fontSize: SZ10 }
  );

  // Director changes text
  const fyFromDate = new Date(`${fyStart}-04-01`);
  const fyToDate = new Date(`${Number(fyStart) + 1}-03-31`);
  const isInFY = (dateStr: string) => {
    if (!dateStr) return false;
    const d = new Date(dateStr);
    return d >= fyFromDate && d <= fyToDate;
  };
  const appointed = data.directors.filter(d => isInFY(d.dateOfAppointment) && !dirIsFirstDirector(d, data) && !dirHasLeft(d));
  const resigned = data.directors.filter(d => dirHasLeft(d));

  const dirChangesParas: (Paragraph | Table)[] = [];
  if (appointed.length === 0 && resigned.length === 0) {
    dirChangesParas.push(p("There were no changes in the directorship of the Company during the Financial Year under review."));
  } else {
    if (appointed.length > 0) {
      dirChangesParas.push(p(`During the Financial Year ${fy}, the following Director(s) were appointed on the Board of the Company:`));
      dirChangesParas.push(buildTable(
        ["Name of Director", "DIN", "Designation", "Date of Appointment"],
        appointed.map(d => [d.name, d.din || "—", d.designation, fmtDate(d.dateOfAppointment)]),
        [2800, 1200, 2200, 2638],
        { fontSize: SZ9 }
      ));
    }
    if (resigned.length > 0) {
      dirChangesParas.push(p(`During the Financial Year ${fy}, the following Director(s) resigned / ceased to be Director(s) of the Company:`));
      dirChangesParas.push(buildTable(
        ["Name of Director", "DIN", "Designation", "Date of Cessation"],
        resigned.map(d => [d.name, d.din || "—", d.designation, d.dateOfCessation ? fmtDate(d.dateOfCessation) : "—"]),
        [2800, 1200, 2200, 2638],
        { fontSize: SZ9 }
      ));
    }
  }

  const children: (Paragraph | Table)[] = [
    // Header block
    new Paragraph({
      children: [r(data.companyName.toUpperCase(), { bold: true, size: SZ12 })],
      alignment: AlignmentType.CENTER, spacing: { after: 60 },
    }),
    new Paragraph({
      children: [r(`CIN: ${data.cin}`, { size: SZ10 })],
      alignment: AlignmentType.CENTER, spacing: { after: 60 },
    }),
    new Paragraph({
      children: [r(`Registered Office: ${data.regAddress}`, { size: SZ10 })],
      alignment: AlignmentType.CENTER, spacing: { after: 60 },
    }),
    ...(data.companyPhone || data.companyEmail ? [new Paragraph({
      children: [r([data.companyPhone ? `Tel: ${data.companyPhone}` : "", data.companyEmail ? `Email: ${data.companyEmail}` : ""].filter(Boolean).join("  |  "), { size: SZ9 })],
      alignment: AlignmentType.CENTER, spacing: { after: 60 },
    })] : []),
    new Paragraph({
      children: [r("DIRECTORS' REPORT", { bold: true, size: SZ12, underline: true })],
      alignment: AlignmentType.CENTER, spacing: { after: 60 },
    }),
    new Paragraph({
      children: [r(`For the Financial Year ended 31st March, ${fyEnd}`, { size: SZ10 })],
      alignment: AlignmentType.CENTER, spacing: { after: 200 },
    }),

    // Opening
    pr([r("To,", { size: SZ12 })], { align: AlignmentType.LEFT, after: 60 }),
    pr([r(isOPC ? "The Member," : "The Members,", { size: SZ12 })], { align: AlignmentType.LEFT, after: 60 }),
    pr([r(data.companyName, { bold: true, size: SZ12 })], { align: AlignmentType.LEFT, after: 160 }),
    pr([
      r("Your Directors have pleasure in presenting the ", { size: SZ12 }),
      r(arLabel, { bold: true, size: SZ12 }),
      r(` of the Company together with the Audited Financial Statements for the Financial Year ended 31st March, ${fyEnd}.`, { size: SZ12 }),
    ], { after: 120 }),
    ...(isOPC && nomineeDirector ? [p(`The Company is a One Person Company (OPC) within the meaning of Section 2(62) of the Companies Act, 2013. The Nominee of the sole Member is ${nomineeDirector.name}.`)] : []),

    h2("1. Financial Summary / Highlights"),
    p(`The financial performance of the Company for the Financial Year ended 31st March, ${fyEnd} is summarized below:`),
    finTable,
    blankLine(),

    h2("2. Dividend"),
    p(data.dividendDeclared
      ? `Your Directors are pleased to report that the Company has declared and/or paid dividend of ${buildDividendText(data)} on the Equity Shares of the Company for the Financial Year ended 31st March, ${fyEnd}. The dividend was paid in compliance with the provisions of Section 123 of the Companies Act, 2013. There is no unpaid / unclaimed dividend pending for transfer to the Investor Education and Protection Fund (IEPF).`
      : `Your Directors do not recommend any dividend on the Equity Shares of the Company for the Financial Year ended 31st March, ${fyEnd} in order to conserve resources for the future operations of the Company. No dividend was paid during the Financial Year ${fy}. There is no unpaid / unclaimed dividend pending for transfer to the Investor Education and Protection Fund (IEPF).`
    ),

    h2("3. Transfer to Reserves"),
    p(`The Board of Directors has not proposed any transfer to reserves for the Financial Year ${fy}. The entire profit / (loss) has been retained in the Profit and Loss Account of the Company.`),

    h2("4. State of Affairs / Business Operations"),
    p(data.stateOfAffairs || `During the Financial Year ${fy}, the Company continued its principal business activities. The overall performance of the Company was satisfactory during the year under review.`),

    h2("5. Annual Return"),
    p(data.annualReturnWebLink
      ? `Pursuant to Section 92(3) of the Companies Act, 2013 read with Rule 12(1) of the Companies (Management and Administration) Rules, 2014, the Annual Return of the Company in Form MGT-7A for the Financial Year ended 31st March, ${fyEnd} is available on the website of the Company at: ${data.annualReturnWebLink}`
      : `Pursuant to Section 92(3) of the Companies Act, 2013 read with Rule 12(1) of the Companies (Management and Administration) Rules, 2014, the Annual Return of the Company in Form MGT-7A for the Financial Year ended 31st March, ${fyEnd} shall be filed with the Registrar of Companies. A copy of the Annual Return shall be made available at the Registered Office of the Company for inspection during business hours. The extract of Annual Return in Form MGT-9 is no longer required pursuant to the Companies (Amendment) Act, 2017.`
    ),

    h2("6. Number of Board Meetings"),
    pr([
      r("During the Financial Year ", { size: SZ12 }),
      r(fy, { size: SZ12 }),
      r(", ", { size: SZ12 }),
      r(`${totalMeetings} (${totalMeetingsWord})`, { bold: true, size: SZ12 }),
      r(" meeting(s) of the Board of Directors were held. The details of Board Meetings held during the year are as under:", { size: SZ12 }),
    ]),
    meetingTable,
    blankLine(),
    p("The gap between any two consecutive Board Meetings did not exceed one hundred and twenty days as required under Section 173(1) of the Companies Act, 2013."),
    pr([r("Attendance of Directors at Board Meetings:", { bold: true, size: SZ12 })], { align: AlignmentType.LEFT }),
    attendTable,
    blankLine(),

    h2("7. General Meetings"),
    ...(isOPC
      ? [p("The Company being a One Person Company is exempt from holding Annual General Meeting pursuant to Section 96 of the Companies Act, 2013. As per the provisions applicable to One Person Companies, resolutions are passed by the sole member / sole director by means of circular resolutions or in writing, as applicable.")]
      : [p((() => {
          const agm = data.memberMeetings?.find(m => m.type === "agm");
          const agmDate = agm?.date ? fmtDate(agm.date) : "________________";
          const agmVenue = agm?.venue ? `, held at ${agm.venue}` : "";
          return `The Annual General Meeting (AGM) of the Company for the Financial Year ${prevFY} was held on ${agmDate}${agmVenue}. The next AGM for the Financial Year ${fy} will be held within the stipulated time as prescribed under Section 96 of the Companies Act, 2013.`;
        })())]
    ),

    h2("8. Share Capital"),
    p(`As on 31st March, ${fyEnd}, the Share Capital of the Company stood as under:`),
    capTable,
    blankLine(),
    p(data.capitalChanges || `There was no change in the Authorised or Paid-up Share Capital of the Company during the Financial Year ${fy}.`),

    h2("9. Directors' Responsibility Statement"),
    p(`Pursuant to the requirement under Section 134(3)(c) read with Section 134(5) of the Companies Act, 2013, your Directors confirm and state that:`),
    p("(i) In the preparation of the annual accounts for the Financial Year ended 31st March, " + fyEnd + ", the applicable accounting standards have been followed along with proper explanation relating to material departures, if any;", { indent: 400 }),
    p("(ii) The Directors have selected such accounting policies and applied them consistently and made judgements and estimates that are reasonable and prudent so as to give a true and fair view of the state of affairs of the Company as at 31st March, " + fyEnd + " and of the profit / (loss) of the Company for the year ended on that date;", { indent: 400 }),
    p("(iii) The Directors have taken proper and sufficient care for the maintenance of adequate accounting records in accordance with the provisions of the Companies Act, 2013 for safeguarding the assets of the Company and for preventing and detecting fraud and other irregularities;", { indent: 400 }),
    p("(iv) The Directors have prepared the annual accounts on a going concern basis; and", { indent: 400 }),
    p("(v) The Directors have devised proper systems to ensure compliance with the provisions of all applicable laws and that such systems were adequate and operating effectively.", { indent: 400 }),

    h2("10. Declaration by Independent Directors"),
    p(isOPC
      ? "The Company being a One Person Company is not required to appoint Independent Director(s) on its Board as per the provisions of the Companies Act, 2013. Accordingly, no declaration under Section 149(7) of the Companies Act, 2013 is required."
      : `As at 31st March, ${fyEnd}, the Company does not have any Independent Director on its Board. Accordingly, the provisions of Section 149(6) and Section 149(7) of the Companies Act, 2013 are not applicable to the Company.`
    ),

    h2("11. Board Performance Evaluation"),
    p(isOPC
      ? "The Company being a One Person Company with a sole director is exempt from the provisions relating to performance evaluation as prescribed under Section 134(3)(p) of the Companies Act, 2013."
      : "The Board of Directors has carried out an annual evaluation of its own performance as well as that of individual Directors as mandated by Section 134(3)(p) of the Companies Act, 2013. The evaluation framework focused on areas such as Board composition, meeting process, strategic engagement, effectiveness of decision-making, adherence to governance standards, and contribution of each Director. The performance evaluation of the Company does not require formal evaluation by an NRC / Independent Directors as the Company is below the prescribed thresholds."
    ),

    h2("12. Audit Committee"),
    p("The provisions of Section 177 of the Companies Act, 2013 relating to constitution of Audit Committee are applicable to public companies with paid-up share capital of Rs.10 Crores or more, or turnover of Rs.100 Crores or more, or outstanding loans/borrowings/debentures/deposits >= Rs.50 Crores. The Company does not meet these thresholds. Accordingly, the constitution of an Audit Committee is not mandatory for the Company at present."),

    h2("13. Nomination & Remuneration Committee (NRC)"),
    p("The provisions of Section 178 of the Companies Act, 2013 relating to constitution of a Nomination and Remuneration Committee are not applicable to the Company as it does not meet the prescribed thresholds (paid-up capital >= Rs.10 Crore or turnover >= Rs.100 Crore). Accordingly, the Company is not required to formulate a Nomination and Remuneration Policy under Section 178(3) of the Companies Act, 2013."),

    h2("14. Corporate Social Responsibility (CSR) Committee"),
    p(`The provisions of Section 135 of the Companies Act, 2013 relating to Corporate Social Responsibility are not applicable to the Company for the Financial Year ${fy} as the Company's net worth, turnover and net profit are below the prescribed thresholds under Section 135(1) of the Companies Act, 2013. Accordingly, the Company has not constituted a CSR Committee and no CSR expenditure was required to be made.`),

    h2("15. Stakeholders Relationship Committee"),
    p("The constitution of a Stakeholders Relationship Committee is required only where the number of shareholders, debenture holders or other security holders exceeds one thousand. As the Company's total number of members is well below the said threshold, the Stakeholders Relationship Committee has not been constituted."),

    h2("16. Risk Management Committee"),
    p("The provisions relating to constitution of a Risk Management Committee under the Companies Act, 2013 and SEBI (LODR) Regulations, 2015 are not applicable to the Company as it is an unlisted private company. Accordingly, no Risk Management Committee has been constituted."),

    h2("17. Vigil Mechanism / Whistle-blower Policy"),
    p("The provisions of Section 177(9) and 177(10) of the Companies Act, 2013 regarding Vigil Mechanism are mandatory for listed companies, companies accepting deposits from the public, and companies with outstanding borrowings from banks/public financial institutions exceeding Rs.50 Crores. The Company does not fall under any of the above categories. Accordingly, the Company is not required to establish a formal Vigil Mechanism / Whistle-blower Policy. However, the Board of Directors ensures that a culture of transparency and integrity is maintained within the organisation and any genuine concerns of the employees can be communicated directly to the Directors."),

    h2("18. Risk Management"),
    p(data.riskManagementDetails || "The Company has a risk management framework to identify, assess and mitigate risks. The Board periodically reviews the risk landscape and takes appropriate steps to minimize risks. The major risks identified by the Company include business risk, operational risk, financial risk and legal/regulatory risk. Adequate systems and processes are in place to manage these risks effectively."),

    h2("19. Conservation of Energy"),
    p(data.energyConservationDetails || "The operations of the Company are not energy-intensive. The Company has taken adequate measures for conservation of energy wherever possible, including use of energy-efficient equipment and optimisation of energy usage."),
    p("(i) Steps taken or impact on conservation of energy: The Company continues to implement energy conservation practices.\n(ii) Steps taken for utilising alternate sources of energy: Not applicable.\n(iii) Capital investment on energy conservation equipment: Nil."),

    h2("20. Technology Absorption"),
    p(data.technologyAbsorptionDetails || `The Company has not imported any technology during the Financial Year ${fy}. The Company has not incurred any expenditure on Research and Development. No technology absorption or adaptation was carried out during the year.`),

    h2("21. Foreign Exchange Earnings and Outgo"),
    buildTable(
      ["Particulars", `FY ${fy} (Rs.)`],
      [
        ["Foreign Exchange Earnings", data.foreignExchangeEarnings ? fmtRs(data.foreignExchangeEarnings) : "Nil"],
        ["Foreign Exchange Outgo", data.foreignExchangeOutgo ? fmtRs(data.foreignExchangeOutgo) : "Nil"],
      ],
      [7000, 2638],
      { fontSize: SZ10 }
    ),
    blankLine(),

    h2("22. Related Party Transactions"),
    p(data.hasRPT
      ? `All contracts or arrangements or transactions entered into by the Company during the Financial Year ${fy} with related parties referred to in Section 188(1) of the Companies Act, 2013 were in the ordinary course of business and on arm's length basis, except as mentioned in Form AOC-2 annexed hereto as Annexure I.`
      : `All contracts or arrangements or transactions entered into by the Company during the Financial Year ${fy} with related parties referred to in Section 188(1) of the Companies Act, 2013 were in the ordinary course of business and at arm's length basis. The Company does not have any contracts, arrangements or transactions with related parties which are not at arm's length. Accordingly, disclosure in Form AOC-2 is not required. Details of related party transactions as per AS-18 are disclosed in the Notes to the Financial Statements.`
    ),

    h2("23. Loans, Guarantees and Investments"),
    p(data.hasLoansGiven
      ? "The particulars of loans given, investments made, guarantees given and securities provided under Section 186 of the Companies Act, 2013 are provided in the Notes to the Financial Statements."
      : `During the Financial Year ${fy}, the Company has not given any loans, provided any guarantees or made any investments falling under the provisions of Section 186 of the Companies Act, 2013.`
    ),

    h2("24. Subsidiaries, Associates and Joint Ventures"),
    p(data.hasSubsidiaries
      ? "A statement containing salient features of the financial statements of subsidiary/associate companies in Form AOC-1 is annexed hereto as Annexure II pursuant to Section 129(3) of the Companies Act, 2013."
      : `The Company does not have any subsidiary, associate company or joint venture as on 31st March, ${fyEnd}. Accordingly, Form AOC-1 is not required to be annexed.`
    ),

    h2("25. Corporate Social Responsibility"),
    p(data.csrApplicable && data.csrDetails
      ? `The Company is required to undertake CSR activities as per the provisions of Section 135 of the Companies Act, 2013. A CSR Committee has been constituted. Details of CSR activities and expenditure during the Financial Year ${fy} are as follows: ${data.csrDetails}`
      : `The provisions of Section 135 of the Companies Act, 2013 regarding Corporate Social Responsibility are not applicable to the Company for the Financial Year ${fy} as the Company's net worth, turnover and net profit are below the prescribed thresholds under Section 135(1) of the Companies Act, 2013. Hence, no CSR activity is required to be undertaken and no disclosure is required under the Companies (Corporate Social Responsibility Policy) Rules, 2014.`
    ),

    h2("26. Deposits"),
    p(data.hasDeposits
      ? `The Company has accepted deposits during the Financial Year ${fy}. Details in compliance with Chapter V of the Companies Act, 2013 are disclosed in the Notes to Financial Statements.`
      : `The Company has not accepted any deposits from the public within the meaning of Sections 73 and 74 of the Companies Act, 2013 read with the Companies (Acceptance of Deposits) Rules, 2014 during the Financial Year ${fy}. There are no outstanding deposits and no amount of principal or interest was outstanding as on 31st March, ${fyEnd}.`
    ),

    h2("27. Statutory Auditor"),
    p(getStatutoryAuditorText(data)),

    h2("28. Secretarial Audit"),
    p("The provisions of Section 204 of the Companies Act, 2013 relating to Secretarial Audit are applicable to public companies with paid-up share capital of Rs.50 Crores or more, or turnover of Rs.250 Crores or more. The Company is a private limited company and does not meet the aforesaid thresholds. Accordingly, Secretarial Audit is not applicable to the Company."),

    h2("29. Cost Audit"),
    p(`The provisions of Section 148 of the Companies Act, 2013 relating to Cost Audit are not applicable to the Company for the Financial Year ${fy} as the Company is below the prescribed thresholds for maintenance of cost records and audit. Accordingly, no Cost Audit was conducted during the year.`),

    h2("30. Auditors' Report - Qualifications, Reservations and Adverse Remarks"),
    p(data.auditQualification && data.auditQualificationExplanation
      ? `The Statutory Auditors have made certain qualifications / reservations / adverse remarks in their Audit Report. The Board of Directors provides the following explanation / comments thereon as required under Section 134(3)(f) of the Companies Act, 2013: ${data.auditQualificationExplanation}`
      : `The Statutory Auditors' Report for the Financial Year ${fy} does not contain any qualification, reservation, adverse remark or disclaimer. Accordingly, no explanation or comment is required to be given by the Board of Directors under Section 134(3)(f) of the Companies Act, 2013.`
    ),

    h2("31. Frauds Reported by Statutory Auditors"),
    p(data.fraudReported && data.fraudDetails
      ? `The Statutory Auditors have reported the following instances of fraud committed against the Company by its officers or employees to the Board of Directors during the Financial Year ${fy}: ${data.fraudDetails}`
      : `The Statutory Auditors of the Company have not reported any instance of fraud committed against the Company by its officers or employees as specified under Section 143(12) of the Companies Act, 2013 during the Financial Year ${fy}. Hence, no disclosure is required to be made under Rule 13 of the Companies (Audit and Auditors) Rules, 2014.`
    ),

    h2("32. Internal Financial Controls"),
    p("The Company has established adequate internal financial controls with reference to the financial statements. The Board of Directors has devised proper systems to ensure compliance with the provisions of all applicable laws, and such systems are adequate and operating effectively. The Statutory Auditors have not reported any significant deficiency or material weakness in internal financial controls over financial reporting."),

    h2("33. Material Changes and Commitments"),
    p(data.materialChangesAfterFY && data.materialChangesDetails
      ? data.materialChangesDetails
      : `There are no material changes and commitments, affecting the financial position of the Company, which have occurred between the end of the Financial Year ${fy} and the date of this Report.`
    ),

    h2("34. Changes in Directors and Key Managerial Personnel"),
    ...dirChangesParas,

    h2("35. Significant and Material Orders by Regulators / Courts"),
    p(data.significantOrders && data.significantOrdersDetails
      ? data.significantOrdersDetails
      : `No significant or material orders have been passed by any Regulator, Court or Tribunal which would impact the going concern status and future operations of the Company during the Financial Year ${fy}.`
    ),

    h2("36. Proceedings Under Insolvency and Bankruptcy Code, 2016"),
    p(`No application has been made and no proceeding is pending under the Insolvency and Bankruptcy Code, 2016 against the Company during the Financial Year ${fy}.`),

    h2("37. Details of Difference Between Amount of Valuation on One-Time Settlement"),
    p(`There were no instances of one-time settlement with any Bank or Financial Institution during the Financial Year ${fy}. Hence, no disclosure is required under this clause.`),

    h2("38. Particulars of Employees"),
    p("The information required pursuant to Section 197(12) of the Companies Act, 2013 read with Rule 5(2) and 5(3) of the Companies (Appointment and Remuneration of Managerial Personnel) Rules, 2014 in respect of employees of the Company is as under:"),
    p(`During the Financial Year ${fy}, no employee of the Company was in receipt of remuneration in excess of the limits prescribed under Rule 5(2) of the Companies (Appointment and Remuneration of Managerial Personnel) Rules, 2014. Accordingly, no statement is required to be annexed to this Report.`),

    h2("39. Prevention of Sexual Harassment at Workplace (POSH)"),
    p("The Company is committed to providing a safe and harassment-free workplace for every woman at work. The Company has put in place a policy for prevention of sexual harassment in compliance with the provisions of the Sexual Harassment of Women at Workplace (Prevention, Prohibition and Redressal) Act, 2013 and the Rules made thereunder."),
    p(`The following is the summary of complaints received and disposed-off during the Financial Year ${fy}:`),
    buildTable(
      ["Particulars", "Number"],
      [
        ["Number of complaints received during the year", "Nil"],
        ["Number of complaints disposed-off during the year", "Nil"],
        ["Number of complaints pending as on end of the year", "Nil"],
      ],
      [7500, 2138],
      { fontSize: SZ10 }
    ),
    blankLine(),

    h2("40. Compliance with Maternity Benefit Act, 1961"),
    p(`The Company is in compliance with the applicable provisions of the Maternity Benefit Act, 1961. No employee availed maternity leave or filed any related complaint during the Financial Year ${fy}.`),

    h2(`41. Particulars of Employees (Gender-wise) as on 31st March, ${fyEnd}`),
    buildTable(
      ["Category", "Number of Employees"],
      [
        ["Female", String(data.employeesFemale ?? "________________")],
        ["Male", String(data.employeesMale ?? "________________")],
        ["Transgender / Other", String(data.employeesOther ?? "________________")],
        ["Total", String((data.employeesMale != null || data.employeesFemale != null || data.employeesOther != null) ? ((data.employeesMale || 0) + (data.employeesFemale || 0) + (data.employeesOther || 0)) : "________________")],
      ],
      [6000, 3638],
      { fontSize: SZ10 }
    ),
    blankLine(),

    h2("42. Compliance with Secretarial Standards"),
    p("The Company has complied with the applicable Secretarial Standards issued by the Institute of Company Secretaries of India (ICSI), namely SS-1 (Secretarial Standard on Meetings of the Board of Directors) and SS-2 (Secretarial Standard on General Meetings), as applicable to the Company."),

    h2("43. Business Responsibility and Sustainability Report"),
    p("The provisions of Regulation 34(2)(f) of the SEBI (Listing Obligations and Disclosure Requirements) Regulations, 2015 regarding Business Responsibility and Sustainability Report are applicable only to the top 1000 listed companies by market capitalisation. The Company is an unlisted private company. Accordingly, this provision is not applicable to the Company."),

    h2("44. Corporate Governance"),
    p("The provisions relating to Corporate Governance Report as required under the SEBI (Listing Obligations and Disclosure Requirements) Regulations, 2015 are not applicable to the Company as it is an unlisted private company. However, the Company strives to maintain good corporate governance practices in its day-to-day operations."),

    h2("45. Acknowledgements"),
    p(`Your Directors place on record their sincere appreciation for the assistance, co-operation and support extended by the bankers, government authorities, regulatory agencies, customers, suppliers and other business associates during the Financial Year ${fy}. Your Directors also express their deep appreciation for the dedicated efforts and contribution of the employees at all levels.`),
    p(`The Board also thanks the ${isOPC ? "Member" : "Members"} of the Company for reposing confidence and trust in the management of the Company.`),

    // Director table on new page
    new Paragraph({ children: [], pageBreakBefore: true, spacing: { after: 0, before: 0 } }),
    h2(`Details of Directors of the Company as on 31st March, ${fyEnd}`),
    dirTable,
    blankLine(),

    // Signature block
    pr([
      r("For and on behalf of the Board of Directors of", { size: SZ12 }),
    ], { align: AlignmentType.LEFT, after: 60 }),
    pr([r(data.companyName, { bold: true, size: SZ12 })], { align: AlignmentType.LEFT, after: 120 }),
    ...sigParagraphs(sigDirs, undefined, reportDate, reportPlace),
  ];

  const doc = new Document({
    sections: [
      {
        properties: {
          page: {
            size: { width: PAGE_WIDTH, height: PAGE_HEIGHT },
            margin: { top: MARGIN, right: MARGIN, bottom: MARGIN, left: MARGIN },
          },
        },
        headers: { default: buildHeader(data.companyName, "Directors' Report") },
        footers: { default: buildFooterWithDirectors(sigDirs, data.companyName) },
        children,
      },
    ],
  });

  return toDocxBuffer(doc);
}
