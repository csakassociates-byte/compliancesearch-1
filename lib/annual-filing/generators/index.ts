/**
 * Annual Filing Generators — FY Dispatcher
 * Routes to the correct per-FY generator set based on data.financialYear.
 * To add a new FY: create a new subfolder, copy the previous year's files, edit as needed.
 */

import type { AnnualFilingData, FinancialYear } from "../types";
export type { AnnualFilingData, CompanyType, FinancialYear } from "../types";
export { INITIAL_FILING_DATA } from "../types";

import {
  generateAllAttachments as gen2024_25,
  type AuditReportOptions,
  type GeneratedDocuments,
} from "./2024-25/index";

import {
  generateAllAttachments as gen2025_26,
} from "./2025-26/index";

export type { AuditReportOptions, OpinionType } from "./2025-26/index";
export type { GeneratedDocuments } from "./2025-26/index";

export function generateAllAttachments(
  data: AnnualFilingData,
  auditOpts: AuditReportOptions
): GeneratedDocuments {
  const fy = data.financialYear as FinancialYear;

  if (fy === "2024-25") return gen2024_25(data, auditOpts);
  if (fy === "2025-26") return gen2025_26(data, auditOpts);

  // Fallback to latest FY for unknown values
  return gen2025_26(data, auditOpts);
}
