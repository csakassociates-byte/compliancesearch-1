/**
 * Annual Filing Generators — FY 2024-25
 * Locked to FY 2024-25 format. Do NOT modify for future years.
 */

import type { AnnualFilingData } from "../../types";
import { generateAuditReport, type AuditReportOptions } from "./audit-report";
import { generateBoardReportRule8A } from "./board-report-rule8a";
import { generateBoardReportRule8 }  from "./board-report-rule8";
import { generateNotesOnAccounts }   from "./notes-on-accounts";
import { generateAOC1 }              from "./aoc1";
import { generateAOC2 }              from "./aoc2";
import { generateDirectorList }      from "./director-list";
import { generateShareholderList }   from "./shareholder-list";
import { generateMGT7CTC }           from "./mgt7-ctc";

export type { AuditReportOptions, OpinionType } from "./audit-report";

export interface GeneratedDocuments {
  "audit-report":      string;
  "board-report":      string;
  "notes-on-accounts": string;
  "director-list":     string;
  "shareholder-list":  string;
  "mgt7-ctc":          string;
  "aoc-1"?:            string;
  "aoc-2"?:            string;
}

export function generateAllAttachments(
  data: AnnualFilingData,
  auditOpts: AuditReportOptions
): GeneratedDocuments {
  const isOPC      = data.companyType === "opc";
  const isSmall    = data.companyType === "private_small";
  const isSection8 = data.companyType === "section8";
  const isFPC      = data.companyType === "fpc";

  const cashFlowIncluded = isSection8 || isFPC;

  const boardReport = (isOPC || isSmall)
    ? generateBoardReportRule8A(data)
    : generateBoardReportRule8(data);

  const docs: GeneratedDocuments = {
    "audit-report":      generateAuditReport(data, { ...auditOpts, cashFlowIncluded }),
    "board-report":      boardReport,
    "notes-on-accounts": generateNotesOnAccounts(data),
    "director-list":     generateDirectorList(data),
    "shareholder-list":  generateShareholderList(data),
    "mgt7-ctc":          generateMGT7CTC(data),
  };

  if (data.hasSubsidiaries && data.subsidiaries && data.subsidiaries.length > 0) {
    docs["aoc-1"] = generateAOC1(data);
  }

  if (data.hasRPT) {
    docs["aoc-2"] = generateAOC2(data);
  }

  return docs;
}
