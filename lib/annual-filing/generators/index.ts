/**
 * Annual Filing Generators — Central Export
 * All document generators for AOC-4 and MGT-7/7A attachments
 */

export { generateAuditReport }           from "./audit-report";
export type { AuditReportOptions, OpinionType } from "./audit-report";

export { generateBoardReportRule8A }     from "./board-report-rule8a";
export { generateBoardReportRule8 }      from "./board-report-rule8";

export { generateNotesOnAccounts }       from "./notes-on-accounts";

export { generateAOC1 }                  from "./aoc1";
export { generateAOC2 }                  from "./aoc2";

export { generateDirectorList }          from "./director-list";
export { generateShareholderList }       from "./shareholder-list";

export type { AnnualFilingData, CompanyType, FinancialYear } from "../types";
export { INITIAL_FILING_DATA }           from "../types";

/**
 * Master generator — generates all applicable attachments for a company
 * Returns a map of { documentName → htmlString }
 */
import type { AnnualFilingData } from "../types";
import { generateAuditReport, type AuditReportOptions } from "./audit-report";
import { generateBoardReportRule8A } from "./board-report-rule8a";
import { generateBoardReportRule8 }  from "./board-report-rule8";
import { generateNotesOnAccounts }   from "./notes-on-accounts";
import { generateAOC1 }              from "./aoc1";
import { generateAOC2 }              from "./aoc2";
import { generateDirectorList }      from "./director-list";
import { generateShareholderList }   from "./shareholder-list";

export interface GeneratedDocuments {
  "audit-report":      string;
  "board-report":      string;
  "notes-on-accounts": string;
  "director-list":     string;
  "shareholder-list":  string;
  "aoc-1"?:            string;  // Conditional — only if has subsidiaries
  "aoc-2"?:            string;  // Conditional — only if has RPT
}

export function generateAllAttachments(
  data: AnnualFilingData,
  auditOpts: AuditReportOptions
): GeneratedDocuments {
  const isOPC      = data.companyType === "opc";
  const isSmall    = data.companyType === "private_small";
  const isSection8 = data.companyType === "section8";
  const isFPC      = data.companyType === "fpc";

  // Cash Flow Statement — OPC and Small companies are EXEMPT (Sec. 2(40))
  // Section 8 and FPC must prepare Cash Flow Statement
  const cashFlowIncluded = isSection8 || isFPC;

  const auditOptsWithCashFlow: AuditReportOptions = {
    ...auditOpts,
    cashFlowIncluded,
  };

  // Board Report — Rule 8A for OPC/Small; Rule 8 (Full) for Section 8/FPC
  const boardReport = (isOPC || isSmall)
    ? generateBoardReportRule8A(data)
    : generateBoardReportRule8(data);

  const docs: GeneratedDocuments = {
    "audit-report":      generateAuditReport(data, auditOptsWithCashFlow),
    "board-report":      boardReport,
    "notes-on-accounts": generateNotesOnAccounts(data),
    "director-list":     generateDirectorList(data),
    "shareholder-list":  generateShareholderList(data),
  };

  // Conditional: AOC-1 only if company has subsidiaries/associates/JVs
  if (data.hasSubsidiaries && data.subsidiaries && data.subsidiaries.length > 0) {
    docs["aoc-1"] = generateAOC1(data);
  }

  // Conditional: AOC-2 only if company has RPT not at arm's length or material
  if (data.hasRPT) {
    docs["aoc-2"] = generateAOC2(data);
  }

  return docs;
}
