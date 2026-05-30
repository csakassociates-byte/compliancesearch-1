import type { BusinessProfile } from "./types";

export type ConditionNode =
  | { op: "always" }
  | { op: "field"; field: string; cmp: ">=" | ">" | "<=" | "<" | "==" | "in"; val: number | boolean | string | string[] }
  | { op: "and"; conditions: ConditionNode[] }
  | { op: "or";  conditions: ConditionNode[] };

export function evaluateCondition(node: ConditionNode, profile: BusinessProfile): boolean {
  switch (node.op) {
    case "always":
      return true;

    case "field": {
      const raw = profile[node.field as keyof BusinessProfile];
      switch (node.cmp) {
        case ">=": return (raw as number) >= (node.val as number);
        case ">":  return (raw as number) >  (node.val as number);
        case "<=": return (raw as number) <= (node.val as number);
        case "<":  return (raw as number) <  (node.val as number);
        case "==": return raw === node.val;
        case "in": return (node.val as string[]).includes(raw as string);
        default:   return false;
      }
    }

    case "and":
      return node.conditions.every((c) => evaluateCondition(c, profile));

    case "or":
      return node.conditions.some((c) => evaluateCondition(c, profile));
  }
}

/** Human-readable label for a condition node (for admin panel display) */
export function conditionLabel(node: ConditionNode): string {
  switch (node.op) {
    case "always": return "Always applicable";
    case "field": {
      const labels: Record<string, string> = {
        // Basic fields
        turnoverLakhs: "Annual Turnover (₹ Lakhs)",
        employeeCount: "Employee Count",
        contractWorkers: "Contract Workers",
        businessType: "Business Type",
        state: "State",
        sector: "Industry Sector",
        hasFood: "Food Business",
        hasPharma: "Pharma/Drug Business",
        hasManufacturing: "Manufacturing Unit",
        hasImportExport: "Import/Export",
        hasForeignInvestment: "Foreign Investment/FDI",
        isStartup: "Startup",
        isListed: "Listed Company",
        hasHazardousWaste: "Hazardous Waste",
        isNBFC: "NBFC",
        hasMultipleStates: "Multi-State Operations",
        providesServices: "Provides Services",
        sellsGoods: "Sells Goods",
        // Advanced fields
        netProfitLakhs: "Net Profit (₹ Lakhs)",
        netWorthCrore: "Net Worth (₹ Crore)",
        hasFDIReceived: "Has Received FDI",
        hasOverseasSub: "Has Overseas Subsidiary/JV",
        makesForeignPayments: "Makes Payments to Non-Residents",
        intlTxnLakhs: "International Related-Party Transactions (₹ Lakhs)",
        groupRevCrore: "Group Consolidated Revenue (₹ Crore)",
        hasECBBorrowing: "Has ECB / Foreign Borrowing",
        isForeignEntityIndia: "Foreign Entity in India (Branch/LO/PO)",
        expandingAbroad: "Expanding / Investing Abroad",
        isEcomOperator: "E-Commerce Marketplace Operator",
        collectsPersonalData: "Collects Personal Data of Users",
        hasRealEstateDev: "Real Estate Developer",
        hasConstructionActivity: "Construction Activity (10+ Workers)",
        hasCryptoVDA: "Deals in Crypto / VDA",
        receivesForeignDonation: "Receives Foreign Contributions (FCRA)",
        hasMSMEDues: "Has Outstanding MSME Supplier Dues",
      };
      const fl = labels[node.field] || node.field;
      if (node.cmp === "==") return `${fl} = ${node.val}`;
      if (node.cmp === "in") return `${fl} in [${(node.val as string[]).join(", ")}]`;
      return `${fl} ${node.cmp} ${node.val}`;
    }
    case "and": return node.conditions.map(conditionLabel).join(" AND ");
    case "or":  return node.conditions.map(conditionLabel).join(" OR ");
  }
}

/** Extract all numeric threshold entries from a condition (for admin editing) */
export interface ThresholdEntry {
  path: number[];       // index path to the node in the tree
  label: string;
  field: string;
  cmp: string;
  val: number;
}

export function extractThresholds(node: ConditionNode, path: number[] = []): ThresholdEntry[] {
  if (node.op === "field" && typeof node.val === "number") {
    const labels: Record<string, string> = {
      turnoverLakhs: "Turnover (₹ Lakhs)",
      employeeCount: "Employee Count",
      contractWorkers: "Contract Workers",
    };
    if (labels[node.field]) {
      return [{ path, label: labels[node.field], field: node.field, cmp: node.cmp as string, val: node.val }];
    }
  }
  if (node.op === "and" || node.op === "or") {
    return node.conditions.flatMap((c, i) => extractThresholds(c, [...path, i]));
  }
  return [];
}

/** Update a numeric value at a given path in the condition tree */
export function updateThreshold(node: ConditionNode, path: number[], newVal: number): ConditionNode {
  if (path.length === 0 && node.op === "field") {
    return { ...node, val: newVal } as ConditionNode;
  }
  if ((node.op === "and" || node.op === "or") && path.length > 0) {
    const [head, ...rest] = path;
    const updated = [...node.conditions];
    updated[head] = updateThreshold(updated[head], rest, newVal);
    return { ...node, conditions: updated };
  }
  return node;
}
