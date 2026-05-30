import { BusinessProfile, ComplianceRule } from "./types";
import { COMPLIANCE_RULES } from "./compliance-rules";

export interface EngineResult {
  applicable: ComplianceRule[];
  notApplicable: ComplianceRule[];
  byCategory: Record<string, ComplianceRule[]>;
  counts: {
    total: number;
    critical: number;
    high: number;
    medium: number;
    low: number;
    byCategory: Record<string, number>;
  };
}

export function runComplianceEngine(profile: BusinessProfile): EngineResult {
  const applicable: ComplianceRule[] = [];
  const notApplicable: ComplianceRule[] = [];

  for (const rule of COMPLIANCE_RULES) {
    try {
      if (rule.condition(profile)) {
        applicable.push(rule);
      } else {
        notApplicable.push(rule);
      }
    } catch {
      // Skip on error
    }
  }

  // Group by category
  const byCategory: Record<string, ComplianceRule[]> = {};
  for (const rule of applicable) {
    if (!byCategory[rule.category]) byCategory[rule.category] = [];
    byCategory[rule.category].push(rule);
  }

  // Sort each category by priority
  const priorityOrder = { critical: 0, high: 1, medium: 2, low: 3 };
  for (const cat of Object.keys(byCategory)) {
    byCategory[cat].sort(
      (a, b) => priorityOrder[a.priority] - priorityOrder[b.priority]
    );
  }

  const counts = {
    total: applicable.length,
    critical: applicable.filter((r) => r.priority === "critical").length,
    high: applicable.filter((r) => r.priority === "high").length,
    medium: applicable.filter((r) => r.priority === "medium").length,
    low: applicable.filter((r) => r.priority === "low").length,
    byCategory: Object.fromEntries(
      Object.entries(byCategory).map(([k, v]) => [k, v.length])
    ),
  };

  return { applicable, notApplicable, byCategory, counts };
}
