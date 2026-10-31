import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import Anthropic from "@anthropic-ai/sdk";
import JSZip from "jszip";
import { fillAoc4, ALIAS, type AocFillData } from "@/lib/annual-filing/aoc4kit";
import type { AnnualFilingData } from "@/lib/annual-filing/types";

export const maxDuration = 60;

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

// ── Auditor default texts ─────────────────────────────────────────────────────

function buildAudTexts(name: string, profit: boolean, section8 = false) {
  const lossOrProfit = profit ? "its profit for the year" : "its loss for the year";
  let opinion = `We have audited the accompanying standalone financial statements of ${name} (the Company), which comprise the Balance Sheet as at March 31, 2026, the Statement of Profit and Loss for the year then ended, and the notes to the financial statements, including a summary of significant accounting policies and other explanatory information.\n\nIn our opinion and to the best of our information and according to the explanations given to us, the aforesaid financial statements give the information required by the Act in the manner so required and give a true and fair view, in conformity with the accounting principles generally accepted in India, of the state of affairs of the Company as at March 31, 2026, and ${lossOrProfit} ended on that date.`;
  let legal = `As required by Section 143(3) of the Act, we report that:\n\na) We have sought and obtained all the information and explanations which to the best of our knowledge and belief were necessary for the purposes of our audit.\n\nb) In our opinion, proper books of account as required by law have been kept by the Company so far as it appears from our examination of those books.\n\nc) the Balance Sheet and the Statement of Profit and Loss dealt with by this Report are in agreement with the books of account.\n\nd) In our opinion, the aforesaid financial statements comply with the Accounting Standards specified under Section 133 of the Act and rules made thereunder.\n\ne) On the basis of the written representations received from the directors as on 31st March, 2026 taken on record by the Board of Directors, none of the directors is disqualified as on 31st March, 2026 from being appointed as a director in terms of Section 164(2) of the Act.\n\nf) With respect to the adequacy of the internal financial controls over financial reporting of the Company: Since the Company's turnover as per last audited financial statements is less than Rs.50 Crores and its borrowings from banks and financial institutions at any time during the year is less than Rs.25 Crores, the Company is exempted from getting an audit opinion with respect to the adequacy of the internal financial controls over financial reporting of the company and the operating effectiveness of such controls vide notification dated June 13, 2017.\n\ng) With respect to the matter to be included in the Auditor's Report under section 197(16): In our opinion and according to the information and explanations given to us, the remuneration paid by the Company to its directors during the current year is in accordance with the provisions of section 197 of the Act. The remuneration paid to any director is not in excess of the limit laid down under section 197 of the Act.`;

  if (section8) {
    opinion = opinion.replace("the Statement of Profit and Loss for the year then ended,", "the Statement of Profit and Loss and the Cash Flow Statement for the year then ended,");
    legal = legal.replace("c) the Balance Sheet and the Statement of Profit and Loss dealt with", "c) the Balance Sheet, the Statement of Profit and Loss and the Cash Flow Statement dealt with");
  }

  return {
    opinion,
    basis: `We conducted our audit in accordance with the Standards on Auditing (SAs) specified under section 143(10) of the Companies Act, 2013. Our responsibilities under those Standards are further described in the Auditor's Responsibilities section of our report. We are independent of the Company in accordance with the Code of Ethics issued by the Institute of Chartered Accountants of India, together with the ethical requirements relevant to our audit under the provisions of the Companies Act, 2013 and the Rules thereunder, and we have fulfilled our other ethical responsibilities in accordance with these requirements and the Code of Ethics. We believe that the audit evidence we have obtained is sufficient and appropriate to provide a basis for our opinion.`,
    eom: `There are no matters to be emphasized in the financial statements. Accordingly, no Emphasis of Matter paragraph has been reported.`,
    kam: `Key Audit Matters are those matters that, in our professional judgement, were of most significance in our audit of the financial statements of the current period. These matters were addressed in the context of our audit of the financial statements as a whole and in forming our opinion thereon, and we do not provide a separate opinion on these matters. Reporting of Key Audit Matters as per SA 701 is not applicable to the Company, since the Company falls under the category of unlisted companies, and as such, the requirement for reporting Key Audit Matters does not apply to it.`,
    other_info: `The Company's Board of Directors is responsible for the preparation of the other information. The other information comprises the information included in the Board's Report, including Annexures to the Board's Report, but does not include the financial statements and our auditor's report thereon. Our opinion on the financial statements does not cover the other information, and we do not express any form of assurance conclusion thereon. In connection with our audit of the financial statements, our responsibility is to read the other information and, in doing so, consider whether the other information is materially inconsistent with the financial statements or our knowledge obtained during the course of our audit, or otherwise appears to be materially misstated. If, based on the work we have performed, we conclude that there is a material misstatement of this other information, we are required to report that fact. We have nothing to report in this regard.`,
    mgmt: `The Company's Board of Directors is responsible for the matters stated in Section 134(5) of the Companies Act, 2013 (the Act) with respect to the preparation of these financial statements that give a true and fair view of the financial position, financial performance, and cash flows of the Company in accordance with the accounting principles generally accepted in India, including the Accounting Standards specified under Section 133 of the Act. This responsibility also includes the maintenance of adequate accounting records in accordance with the provisions of the Act for safeguarding the assets of the Company and for preventing and detecting frauds and other irregularities; selection and application of appropriate accounting policies; making of judgments and estimates that are reasonable and prudent; and the design, implementation, and maintenance of adequate internal financial controls that were operating effectively for ensuring the accuracy and completeness of the accounting records, relevant to the preparation and presentation of the financial statements that give a true and fair view and are free from material misstatement.\n\nIn preparing the financial statements, the Board of Directors is responsible for assessing the Company's ability to continue as a going concern, disclosing, as applicable, matters related to going concern, and using the going concern basis of accounting, unless the Board of Directors either intends to liquidate the Company or to cease operations, or has no realistic alternative but to do so. The Board of Directors is also responsible for overseeing the Company's financial reporting process.`,
    aud_resp: `Our objectives are to obtain reasonable assurance about whether the financial statements as a whole are free from material misstatement, whether due to fraud or error, and to issue an auditor's report that includes our opinion. Reasonable assurance is a high level of assurance, but it is not a guarantee that an audit conducted in accordance with the SAs will always detect a material misstatement when it exists. Misstatements can arise from fraud or error and are considered material if, individually or in the aggregate, they could reasonably be expected to influence the economic decisions of users taken on the basis of these financial statements.`,
    rule11: `With respect to the other matters to be included in the Auditor's Report in accordance with Rule 11 of the Companies (Audit and Auditors) Rules, 2014, in our opinion and to the best of our information and according to the explanations given to us:\n\ni. The Company does not have any pending litigations which would impact its financial position.\n\nii. The Company did not have any long-term contracts including derivative contracts for which there were any material foreseeable losses.\n\niii. There were no amounts which were required to be transferred to the Investor Education and Protection Fund by the Company.\n\niv. (a) The management has represented that, to the best of its knowledge and belief, other than as disclosed in the notes to the accounts, no funds have been advanced or loaned or invested (either from borrowed funds or share premium or any other sources or kind of funds) by the Company to or in any other person(s) or entity(ies), including foreign entities (Intermediaries), with the understanding, whether recorded in writing or otherwise, that the Intermediary shall, whether directly or indirectly, lend or invest in other persons or entities identified in any manner whatsoever by or on behalf of the Company (Ultimate Beneficiaries) or provide any guarantee, security or the like on behalf of the Ultimate Beneficiaries.\n\n(b) The management has represented that, to the best of its knowledge and belief, other than as disclosed in the notes to the accounts, no funds have been received by the Company from any person(s) or entity(ies), including foreign entities (Funding Parties), with the understanding, whether recorded in writing or otherwise, that the Company shall, whether directly or indirectly, lend or invest in other persons or entities identified in any manner whatsoever by or on behalf of the Funding Party (Ultimate Beneficiaries) or provide any guarantee, security or the like on behalf of the Ultimate Beneficiaries.\n\n(c) Based on audit procedures considered reasonable and appropriate in the circumstances, nothing has come to our notice that has caused us to believe that the representations under sub-clauses (a) and (b) above contain any material misstatement.`,
    other_matters: `Pursuant to Rule 11(g) of the Companies (Audit and Auditors) Rules, 2014, we report that, based on our examination, which included test checks and information provided, the Company utilized accounting software for maintaining its books of account. However, the software lacked an audit trail (edit log) feature to record all relevant transactions throughout the year, as required by the Proviso to Rule 3(1) of the Companies (Accounts) Rules, 2014. Consequently, we are unable to give any opinion on this matter.`,
    legal,
    ifc: `With respect to the adequacy of the internal financial controls over financial reporting of the Company: Since the Company's turnover as per last audited financial statements is less than Rs.50 Crores and its borrowings from banks and financial institutions at any time during the year is less than Rs.25 Crores, the Company is exempted from getting an audit opinion with respect to the adequacy of the internal financial controls over financial reporting of the company and the operating effectiveness of such controls vide notification dated June 13, 2017.`,
  };
}

// ── Director report default texts ────────────────────────────────────────────

function buildDirTexts(
  companyName: string,
  pat: number,
  stateOfAffairs: string,
  financialSummary: string,
  femalePct: number,
  malePct: number,
): Record<string, string | number> {
  const profit = pat > 0;
  return {
    directorResponsibilityStatement: `Directors state that:\ni. In the preparation of the Annual Accounts, the applicable accounting standards have been followed along with proper explanation relating to material departures;\nii. They have selected such accounting policies and applied them consistently and made judgments and estimates that are reasonable and prudent so as to give a true and fair view of the state of affairs of the Company at the end of the financial year and of the profit and loss of the Company for that period;\niii. They have taken proper and sufficient care for the maintenance of adequate accounting records in accordance with the provisions of the Act for safeguarding the assets of the Company and for preventing and detecting fraud and other irregularities;\niv. They have prepared the annual accounts on a going concern basis;\nv. They have devised proper systems to ensure compliance with the provisions of all applicable laws and that such systems are adequate and operating effectively.`,
    fraudReportedByAuditors: `No cases regarding frauds have been filed during the year under the Act.`,
    disclosureOfStatementOnDecalaration: `The provision regarding appointment of Independent Director is not applicable to this Company.`,
    disclosureForCompaniesOnDirectorAppointmentAndReumeration: `The provisions of Section 178(1) and Section 178(3) relating to the constitution of Nomination and Remuneration Committee and Stakeholders Relationship Committee are not applicable to the Company. Hence, no such disclosures are required to be made in this Report.`,
    whetherAnyCompanyFallsInCategory: 2,
    briefDetails: `The Company has not given any loans, guarantees or investments under Section 186 during the financial year. Hence, there are no reportable transactions.`,
    "reserveDetails.briefDescription": `The Company has transferred Rs. NIL to its Reserves in the Balance Sheet during the year under review.`,
    "reserveDetails.amount": "0",
    "dividendDetails.briefDescription": profit
      ? `The Board of Directors has not recommended any dividend for the financial year 2025-26 in order to conserve resources for the business of the Company.`
      : `In view of the losses incurred during the year, the Board of Directors has not recommended any dividend for the financial year 2025-26.`,
    "dividendDetails.amount": "0",
    detailsOfMaterialChangesAndCommitment: `There have been no material changes and commitments affecting the financial position of the Company between the end of the financial year to which the financial statement relates and date of this Report.`,
    disclosureOfStementOnDevelopmentAndImplemetationOfRiskMgmt: `The Management of the Company has framed the risk management policy for the Company including identification of the elements of risk. Further, there is no material risk which in the opinion of the Board might threaten the existence of the Company.`,
    "csrDetails.whetherCsrApplicableAsPerSec135": 2,
    detRegardTechAbsorptionAsperRule83B: `The Company has not imported any technology during the period under review.`,
    detRegardEngyConserRule83A: `The Company has taken adequate measures to ensure optimum utilization of all equipment and resources so as to conserve energy.`,
    detForeignExngeEarnOutgoAsPerRul83C: `There were no foreign exchange earnings or outgo during the financial year under review.`,
    "rule8Disclosure.disclosureOfCompanies": `The Company does not have any subsidiary, associate company or joint venture. Hence, no such disclosures are required.`,
    stmtRegBoardOpinion: `Not applicable, as no independent director was appointed during the year.`,
    detInResOfAdequacy: `There is an adequate internal financial control system in place.`,
    disWhetherMaintananceCRReq: `The maintenance of cost records is not mandated under Companies (Cost Records and Audit) Rules, 2014, for the business activities carried out by the Company.`,
    detProceedingPending: `No applications are filed or pending under the Insolvency and Bankruptcy Code, 2016 (31 of 2016) against the Company.`,
    detDiffBetweenValuationAmt: `There was no instance of one-time settlement with any Bank or Financial Institution.`,
    "rule8Disclosure.disclosureOfChangeInNatureOfBusiness": `During the financial year ended 31st March, 2026, there has been no change in the nature of the business of the Company.`,
    "rule8Disclosure.detailsOfDirectorsOrKeyManagerialAppointedOrresignedDuringYear": `During the financial year ended 31st March, 2026, there were no appointments or resignations of directors or key managerial personnel in the Company.`,
    "rule8Disclosure.depositsAcceptedDuringYear": "0",
    "rule8Disclosure.depositsRemainedUnpaidOrUnclaimedAtEndOfYear": "0",
    "rule8Disclosure.amountOfDefaultInRepaymentOfDepositBeginingOfYear": "0",
    "rule8Disclosure.maximumAmountOfDefaultInRepaymentOfDepositDuringYear": "0",
    "rule8Disclosure.amountOfDefaultInRepaymentOfDepositEndOfYear": "0",
    "rule8Disclosure.noOfCasesOfDefaultInRepaymentOfDepositBeginingOfYear": "0",
    "rule8Disclosure.maximumNoOfCasesOfDefaultInRepaymentOfDepositDuringYear": "0",
    "rule8Disclosure.noOfCasesOfDefaultInRepaymentOfDepositEndOfYear": "0",
    "rule8Disclosure.detailsOfDepositNotInComplianceWithReqOfChapt5OfAct": `During the year under review, the Company has not accepted any deposits from the public within the meaning of Sections 73 to 76 of the Companies Act, 2013 and rules made thereunder.`,
    "rule8Disclosure.detailsOfSinificantAndMaterialOrderPassedByRegulator": `There are no significant or material orders passed by any Regulators or Courts or Tribunals which would impact the going concern status of the Company and its future operations.`,
    stmtIndicatingAnnualEval: `The formal annual evaluation of Board performance is not mandatorily applicable to the Company as per provisions of Section 134(3)(p) read with applicable Rules.`,
    stmtUnderSexualHarassAct: `In compliance with the Sexual Harassment of Women at Workplace (Prevention, Prohibition & Redressal) Act, 2013, the Company has adopted a zero-tolerance policy towards sexual harassment.`,
    numOfSHComplaintsRcvd: "0",
    numOfSHComplaintsDispOff: "0",
    numOfSHComplaintsBeyond90Days: "0",
    stmtCompiledMaternityBenefit: `The Board of Directors confirms that the Company has complied with the provisions of the Maternity Benefit Act, 1961.`,
    noOfMatterToBeIncludedInDirectorReport: "18",
    headingForTheMatter: "Refer to Directors' Report for the same",
    referenceToSectionRuleItPertains: "Refer to Directors' Report for the same",
    briefDescriptionOfMatter: "Refer to Directors' Report for the same",
    descriptionOfStateOfCompanyAffairs: stateOfAffairs.slice(0, 490),
    "rule8Disclosure.disclsoreOfFinancialSummaryOrHighlight": financialSummary.slice(0, 490),
    numOfFemaleEmployee: String(femalePct),
    numOfMaleEmployee: String(malePct),
    numOfTransEmployee: "0",
  };
}

// ── Helper: parse DD/MM/YYYY → date string ────────────────────────────────────
function dmyToIso(dmy: string): string {
  const [d, m, y] = dmy.split("/");
  return `${y}-${m.padStart(2, "0")}-${d.padStart(2, "0")}`;
}

// ── Main handler ──────────────────────────────────────────────────────────────

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const userId = (session.user as { id: string }).id;

  const formData = await req.formData();
  const financialPdf = formData.get("financialPdf") as File | null;
  const mcaZip       = formData.get("mcaZip") as File | null;
  const saveId       = formData.get("saveId") as string | null;

  if (!financialPdf || !mcaZip) {
    return NextResponse.json({ error: "Both financialPdf and mcaZip are required" }, { status: 400 });
  }

  // Load saved filing data from DB
  let filingData: AnnualFilingData | null = null;
  if (saveId) {
    const rows = await prisma.$queryRawUnsafe<Array<{ formDataJson: string }>>(
      `SELECT "formDataJson" FROM csi_documents WHERE id = $1 AND "userId" IN (SELECT id FROM csi_users WHERE id = $2 OR "teamOwnerId" = $2) LIMIT 1`,
      saveId, userId
    );
    if (rows[0]) {
      try { filingData = JSON.parse(rows[0].formDataJson) as AnnualFilingData; } catch { /* ignore */ }
    }
  }

  if (!filingData) {
    return NextResponse.json({ error: "Filing data not found. Please save your filing first." }, { status: 404 });
  }

  const companyName = filingData.companyName || "";
  const cin = filingData.cin || "";
  const pat = parseFloat(filingData.financials?.profitAfterTax || "0") || 0;
  const isSection8 = filingData.companyType === "section8";

  // ── Step 1: Claude reads the financial PDF ────────────────────────────────
  let aiFinancials: Record<string, number | null> = {};
  try {
    const pdfBuffer = await financialPdf.arrayBuffer();
    const base64Pdf = Buffer.from(pdfBuffer).toString("base64");

    const msg = await anthropic.messages.create({
      model: "claude-sonnet-5-5",
      max_tokens: 2048,
      messages: [{
        role: "user",
        content: [
          {
            type: "document",
            source: { type: "base64", media_type: "application/pdf", data: base64Pdf },
          } as unknown as { type: "text"; text: string },
          {
            type: "text",
            text: `You are extracting financial data from an Indian company's audited financial statements for AOC-4 MCA filing.
Extract ALL figures in Indian Rupees (actual rupees, not lakhs/crores unless stated).
Return ONLY raw JSON (no markdown, no code blocks) with these exact keys (use null if not found):
{
  "sale_services": null,
  "sale_mfg": null,
  "sale_traded": null,
  "other_income": null,
  "materials": null,
  "purchases": null,
  "employee": null,
  "managerial_rem": null,
  "auditor_fee": null,
  "finance_cost": null,
  "depreciation": null,
  "other_exp": null,
  "exceptional": null,
  "current_tax": null,
  "deferred_tax": null,
  "share_capital": null,
  "reserves": null,
  "lt_borrowings": null,
  "st_borrowings": null,
  "lt_provisions": null,
  "st_provisions": null,
  "payables_other": null,
  "payables_msme": null,
  "other_cl": null,
  "ppe": null,
  "intangibles": null,
  "cwip": null,
  "nc_invest": null,
  "dta": null,
  "lt_loans_adv": null,
  "other_nca": null,
  "inventory": null,
  "trade_rec": null,
  "cash": null,
  "st_loans_adv": null,
  "other_ca": null,
  "eps_basic_before": null,
  "eps_diluted_before": null,
  "eps_basic_after": null,
  "eps_diluted_after": null,
  "net_worth": null,
  "gross_ppe": null,
  "fp_depreciation": null,
  "rpt_gross_value": null,
  "rpt_gross_value_pl": null,
  "eq_shares_begin": null,
  "eq_nominal_begin": null,
  "eq_paidup_begin": null,
  "authorized_capital": null,
  "nominal_value_per_share": null,
  "total_shares": null,
  "lla_related": null,
  "lla_due_directors": null,
  "ltb_related": null,
  "stb_related": null,
  "tr_unsecured": null,
  "insurance": null,
  "power": null,
  "rent_paid": null
}
Company name: ${companyName}`,
          },
        ],
      }],
    });

    const textBlock = msg.content.find(c => c.type === "text") as { text: string } | undefined;
    const text = textBlock?.text ?? "";
    const stripped = text.replace(/```(?:json)?\s*/gi, "").replace(/```/g, "");
    const match = stripped.match(/\{[\s\S]*\}/);
    if (match) aiFinancials = JSON.parse(match[0]) as Record<string, number | null>;
  } catch (e) {
    console.error("[fill-aoc4] AI extraction failed:", e);
    // continue with what we have from filingData
  }

  // ── Step 2: Merge AI data with form data ──────────────────────────────────
  const fin = filingData.financials || {};
  const parseN = (v: string | undefined): number => parseFloat(v || "0") || 0;

  const bsTotal = parseN(fin.totalAssets);
  const patVal  = parseN(fin.profitAfterTax);

  // Build aoc dict — prefer AI, fall back to form data
  const aoc: Record<string, number | null> = {
    share_capital:   aiFinancials.share_capital   ?? parseN(fin.paidUpCapital),
    reserves:        aiFinancials.reserves         ?? parseN(fin.reservesAndSurplus),
    lt_provisions:   aiFinancials.lt_provisions    ?? 0,
    st_provisions:   aiFinancials.st_provisions    ?? 0,
    lt_borrowings:   aiFinancials.lt_borrowings    ?? 0,
    st_borrowings:   aiFinancials.st_borrowings    ?? 0,
    payables_other:  aiFinancials.payables_other   ?? 0,
    payables_msme:   aiFinancials.payables_msme    ?? 0,
    other_cl:        aiFinancials.other_cl         ?? 0,
    ppe:             aiFinancials.ppe              ?? 0,
    intangibles:     aiFinancials.intangibles      ?? 0,
    cwip:            aiFinancials.cwip             ?? 0,
    nc_invest:       aiFinancials.nc_invest        ?? 0,
    dta:             aiFinancials.dta              ?? 0,
    lt_loans_adv:    aiFinancials.lt_loans_adv     ?? 0,
    other_nca:       aiFinancials.other_nca        ?? 0,
    inventory:       aiFinancials.inventory        ?? 0,
    trade_rec:       aiFinancials.trade_rec        ?? 0,
    cash:            aiFinancials.cash             ?? 0,
    st_loans_adv:    aiFinancials.st_loans_adv     ?? 0,
    other_ca:        aiFinancials.other_ca         ?? 0,
    sale_services:   aiFinancials.sale_services    ?? parseN(fin.revenueFromOperations),
    sale_mfg:        aiFinancials.sale_mfg         ?? 0,
    sale_traded:     aiFinancials.sale_traded      ?? 0,
    other_income:    aiFinancials.other_income     ?? parseN(fin.otherIncome),
    materials:       aiFinancials.materials        ?? 0,
    purchases:       aiFinancials.purchases        ?? 0,
    employee:        aiFinancials.employee         ?? 0,
    managerial_rem:  aiFinancials.managerial_rem   ?? 0,
    auditor_fee:     aiFinancials.auditor_fee      ?? 0,
    finance_cost:    aiFinancials.finance_cost     ?? 0,
    depreciation:    aiFinancials.depreciation     ?? 0,
    other_exp:       aiFinancials.other_exp        ?? 0,
    exceptional:     aiFinancials.exceptional      ?? 0,
    current_tax:     aiFinancials.current_tax      ?? parseN(fin.currentTax),
    deferred_tax:    aiFinancials.deferred_tax     ?? parseN(fin.deferredTax),
    eps_basic_before:   aiFinancials.eps_basic_before   ?? null,
    eps_diluted_before: aiFinancials.eps_diluted_before ?? null,
    eps_basic_after:    aiFinancials.eps_basic_after    ?? null,
    eps_diluted_after:  aiFinancials.eps_diluted_after  ?? null,
    net_worth:       aiFinancials.net_worth         ?? parseN(fin.netWorth),
    gross_ppe:       aiFinancials.gross_ppe         ?? 0,
    fp_depreciation: aiFinancials.fp_depreciation   ?? 0,
    rpt_gross_value: aiFinancials.rpt_gross_value   ?? (aiFinancials.managerial_rem ?? 0),
    rpt_gross_value_pl: aiFinancials.rpt_gross_value_pl ?? (aiFinancials.managerial_rem ?? 0),
    eq_shares_begin: aiFinancials.eq_shares_begin   ?? (parseN(fin.paidUpCapital) / 10 || 0),
    eq_nominal_begin: aiFinancials.eq_nominal_begin ?? parseN(fin.paidUpCapital),
    eq_paidup_begin: aiFinancials.eq_paidup_begin   ?? parseN(fin.paidUpCapital),
    lla_related:     aiFinancials.lla_related       ?? 0,
    lla_due_directors: aiFinancials.lla_due_directors ?? 0,
    ltb_related:     aiFinancials.ltb_related       ?? 0,
    stb_related:     aiFinancials.stb_related       ?? 0,
    tr_unsecured:    aiFinancials.tr_unsecured      ?? (aiFinancials.trade_rec ?? 0),
    insurance:       aiFinancials.insurance         ?? 0,
    power:           aiFinancials.power             ?? 0,
    rent_paid:       aiFinancials.rent_paid         ?? 0,
    dtl:             0,
    other_lt_liab:   0,
    curr_invest:     0,
    iaud:            0,
  };

  // ── Step 3: Build signing director ───────────────────────────────────────
  const activeDirectors = (filingData.directors || []).filter(d => d.isActive);
  const sigDir1 = filingData.signatoryDirectors?.director1;
  const signDin = sigDir1?.din || activeDirectors[0]?.din || "";

  // Board meetings
  const boardMeetings: Array<[string, number, number]> = (filingData.boardMeetings || []).map(bm => {
    const d = new Date(bm.date);
    const dmy = `${String(d.getDate()).padStart(2, "0")}/${String(d.getMonth() + 1).padStart(2, "0")}/${d.getFullYear()}`;
    const total = filingData.directors?.filter(d2 => d2.isActive).length ?? 2;
    const attended = bm.directorsPresent?.length ?? total;
    return [dmy, total, attended];
  });

  const bmApprovalDate = boardMeetings[boardMeetings.length - 1]?.[0] ?? "01/09/2026";

  // Employees
  const femaleEmp = filingData.employeesFemale ?? 0;
  const maleEmp   = filingData.employeesMale   ?? 0;

  // State of affairs and financial summary
  const revenue = aoc.sale_services || aoc.sale_mfg || 0;
  const prevRevenue = parseN(fin.prevRevenueFromOperations);
  const stateOfAffairs = (filingData.stateOfAffairs || "").slice(0, 490) ||
    `The Company is engaged in its principal business activities. During the financial year 2025-26, the Company continued its operations. The state of affairs of the Company is adequately reflected in the Balance Sheet and Statement of Profit and Loss.`;
  const financialSummary = `During the financial year 2025-26, the Company earned revenue from operations of Rs. ${revenue.toLocaleString("en-IN")} (previous year Rs. ${prevRevenue.toLocaleString("en-IN")}). The net ${patVal >= 0 ? "profit" : "loss"} for the year was Rs. ${Math.abs(patVal).toLocaleString("en-IN")} (previous year Rs. ${Math.abs(parseN(fin.prevProfitAfterTax)).toLocaleString("en-IN")}).`.slice(0, 490);

  // NIC product code — detect from CIN
  const nicCode = cin.substring(1, 6);
  let productCode4 = "9983"; let productCode8 = "99831300"; let productDesc = "Information technology (IT) consulting and support services";
  if (nicCode.startsWith("451") || nicCode.startsWith("452")) { productCode4 = "9954"; productCode8 = "99541100"; productDesc = "Construction services of buildings"; }
  else if (nicCode.startsWith("681") || nicCode.startsWith("682")) { productCode4 = "9972"; productCode8 = "99721100"; productDesc = "Real estate services involving own or leased property"; }
  else if (nicCode.startsWith("85") || nicCode.startsWith("80")) { productCode4 = "9992"; productCode8 = "99929900"; productDesc = "Educational services"; }
  else if (nicCode.startsWith("86") || nicCode.startsWith("87") || nicCode.startsWith("88")) { productCode4 = "9993"; productCode8 = "99935900"; productDesc = "Health and social care services"; }
  else if (nicCode.startsWith("74")) { productCode4 = "9983"; productCode8 = "99831300"; productDesc = "Information technology (IT) consulting and support services"; }

  // ── Step 4: Fill Excel files ──────────────────────────────────────────────
  const mcaZipBuffer = await mcaZip.arrayBuffer();

  const fillData: AocFillData = {
    name: companyName,
    cin,
    sign_din: signDin,
    bm_date: bmApprovalDate,
    resolution_no: null,
    bs_total: bsTotal,
    pat: patVal,
    aoc,
    products: [{ code4: productCode4, code8: productCode8, desc: productDesc, turnover: revenue as number }],
    board_meetings: boardMeetings.length > 0 ? boardMeetings : [["01/09/2026", 2, 2]],
    female_employees: String(femaleEmp),
    male_employees:   String(maleEmp > 0 ? maleEmp : femaleEmp > 0 ? 0 : 2),
    trans_employees:  "0",
    aud: buildAudTexts(companyName, patVal > 0, isSection8),
    dir: buildDirTexts(companyName, patVal, stateOfAffairs, financialSummary, femaleEmp, maleEmp),
  };

  let fillResult;
  try {
    fillResult = await fillAoc4(mcaZipBuffer, fillData);
  } catch (e) {
    console.error("[fill-aoc4] fill error:", e);
    return NextResponse.json({ error: `Failed to fill Excel: ${e instanceof Error ? e.message : String(e)}` }, { status: 500 });
  }

  // ── Step 5: Return as ZIP of 3 filled files ───────────────────────────────
  const outZip = new JSZip();
  outZip.file(fillResult.aocName, fillResult.aocXlsx);
  outZip.file(fillResult.audName, fillResult.audXlsx);
  outZip.file(fillResult.dirName, fillResult.dirXlsx);

  const zipBuffer = await outZip.generateAsync({ type: "uint8array", compression: "DEFLATE" });

  return new NextResponse(Buffer.from(zipBuffer.buffer) as unknown as BodyInit, {
    status: 200,
    headers: {
      "Content-Type": "application/zip",
      "Content-Disposition": `attachment; filename="${cin}_AOC4_FILLED.zip"`,
      "X-AI-Fields-Found": String(Object.values(aiFinancials).filter(v => v !== null).length),
    },
  });
}
