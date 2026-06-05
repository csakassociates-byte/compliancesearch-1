import type { CompanyData, DirectorData, ChargeData } from "./types/company";

function entityTypeFromExcel(classOfCompany: string, subcat: string): string {
  const cls = (classOfCompany || "").toLowerCase();
  const sub = (subcat || "").toLowerCase();
  if (sub.includes("one person"))                                    return "opc";
  if (sub.includes("section 8") || sub.includes("section8"))        return "section8";
  if (sub.includes("nidhi"))                                         return "nidhi";
  if (cls.includes("private"))                                       return "pvt_ltd";
  if (cls.includes("public"))                                        return "public_ltd";
  if (cls.includes("llp") || sub.includes("liability partnership"))  return "llp";
  return "pvt_ltd";
}

export async function parseCompanyExcel(
  file: File
): Promise<{ data: CompanyData; warnings: string[] }> {
  const XLSX = await import("xlsx");
  const buf  = await file.arrayBuffer();
  const wb   = XLSX.read(buf, { type: "array" });
  const warnings: string[] = [];

  // Row 0 = title, Row 1 = headers, Row 2+ = data
  function sheetToMapped(sheetName: string): Record<string, string>[] {
    const sheet = wb.Sheets[sheetName];
    if (!sheet) return [];
    const raw = XLSX.utils.sheet_to_json<string[]>(sheet, { header: 1, defval: "" }) as string[][];
    if (raw.length < 2) return [];
    const headers = raw[1].map(h => String(h).trim());
    return raw
      .slice(2)
      .map(row => {
        const obj: Record<string, string> = {};
        headers.forEach((h, i) => { obj[h] = String(row[i] ?? "").trim(); });
        return obj;
      })
      .filter(row => Object.values(row).some(v => v !== ""));
  }

  // ── MasterData sheet (key-value pairs) ──────────────────────────────────
  const masterSheet = wb.Sheets["MasterData"];
  const masterRaw   = masterSheet
    ? (XLSX.utils.sheet_to_json<string[]>(masterSheet, { header: 1, defval: "" }) as string[][])
    : [];
  const m: Record<string, string> = {};
  for (const row of masterRaw) {
    const key = String(row[0] || "").trim();
    const val = String(row[1] || "").trim();
    if (key && val) m[key] = val;
  }

  const companyName        = m["Company Name"]                                              || "";
  const cin                = m["CIN"]                                                       || "";
  const regAddress         = m["Registered Address"]                                        || "";
  const classOfCo          = m["Class of Company"]                                          || "";
  const subcategory        = m["Subcategory of the Company"] || m["Company Sub-Category"]   || "";
  const categoryOfCompany  = m["Category of the Company"]   || m["Company Category"]        || "";
  const entityType         = entityTypeFromExcel(classOfCo, subcategory);
  const registrationNumber = m["Registration Number"]                                       || undefined;
  const incorporationDate  = m["Date of Incorporation"]                                     || undefined;
  const dateOfLastAGM      = m["Date of Last AGM"]                                          || undefined;
  const dateOfBalanceSheet = m["Date of Balance Sheet"]                                     || undefined;
  const paidUpCapital      = m["Paid up Capital (Rs)"]                                      || undefined;
  const authorisedCapital  = m["Authorised Capital (Rs)"]                                   || undefined;
  const email              = m["Email Id"]                                                  || undefined;
  const rocName            = m["ROC Name"] || m["ROC Name (display)"]                       || undefined;
  const status             = m["Company Status (for efiling)"] || m["Company Status"]       || undefined;
  const isListed           = (m["Listed in Stock Exchange(s) (Y/N)"] || "").toLowerCase() === "yes";
  const mobile             = m["Phone Number"] || m["Mobile Number"]                        || undefined;
  const gstNumber          = m["GST No"] || m["GST Number"]                                 || undefined;
  const jurisdiction       = m["Jurisdiction"]                                              || undefined;
  const smallCompany       = subcategory.toLowerCase().includes("small company");

  if (!companyName) warnings.push("Company Name not found in MasterData sheet.");
  if (!cin)         warnings.push("CIN not found in MasterData sheet.");

  // ── Director Details ──────────────────────────────────────────────────────
  const dirRows  = sheetToMapped("Director Details");
  const directors: DirectorData[] = [];

  for (const row of dirRows) {
    const name      = row["Name"]              || "";
    const desig     = row["Designation"]       || "";
    const din       = row["DIN/PAN"]           || "";
    const isSig     = (row["Signatory"] || "").toLowerCase() === "yes";
    const cessation = row["Cessation Date"]    || "";
    const appointed = row["Date of Appointment"] || "";
    const category  = row["Category"]          || "";

    if (!name) continue;
    const isActive = !cessation || cessation === "-";

    directors.push({
      din:         din       || undefined,
      name,
      designation: desig     || undefined,
      category:    category  || undefined,
      appointedAt: appointed || undefined,
      ceasedAt:    (cessation && cessation !== "-") ? cessation : undefined,
      isActive,
      isSig,
    });
  }

  if (directors.length === 0) warnings.push("No directors found in Director Details sheet.");

  // ── IndexOfCharges ────────────────────────────────────────────────────────
  const chargeRows = sheetToMapped("IndexOfCharges");
  const charges: ChargeData[] = [];

  for (const row of chargeRows) {
    const holder   = row["Charge Holder Name"] || "";
    const chargeId = row["Charge Id"]          || "";
    const dateCr   = row["Date of Creation"]   || "";
    const amount   = row["Amount"]             || "";
    const address  = row["Address"]            || "";
    const satDate  = row["Date of Satisfaction"] || "";

    if (!holder) continue;
    charges.push({
      chargeId:       chargeId || undefined,
      holderName:     holder,
      dateOfCreation: (dateCr  && dateCr  !== "-") ? dateCr  : undefined,
      amount:         (amount  && amount  !== "-") ? amount  : undefined,
      address:        (address && address !== "-") ? address : undefined,
      isSatisfied:    satDate !== "-" && satDate !== "",
    });
  }

  const data: CompanyData = {
    cin,
    companyName,
    regAddress:        regAddress       || undefined,
    entityType:        entityType       || undefined,
    registrationNumber,
    email,
    rocName,
    status,
    isListed,
    authorisedCapital,
    paidUpCapital,
    incorporationDate,
    dateOfLastAGM,
    dateOfBalanceSheet,
    categoryOfCompany: categoryOfCompany || undefined,
    subcategory:       subcategory      || undefined,
    classOfCompany:    classOfCo        || undefined,
    jurisdiction,
    smallCompany,
    mobile,
    gstNumber,
    sourceFile:        file.name,
    directors,
    charges,
  };

  // ── Save to DB (silent — never blocks UI) ────────────────────────────────
  if (cin && companyName) {
    fetch("/api/companies/upsert", {
      method:  "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        cin, companyName, regAddress, entityType,
        email, rocName, status, isListed,
        sourceFile: file.name,
        registrationNumber, incorporationDate,
        dateOfLastAGM, dateOfBalanceSheet,
        categoryOfCompany, subcategory,
        classOfCompany: classOfCo,
        jurisdiction, smallCompany,
        paidUpCapital, authorisedCapital,
        mobile, gstNumber,
        directors: directors.map(d => ({
          din: d.din, name: d.name, designation: d.designation,
          category: d.category, appointedAt: d.appointedAt,
          ceasedAt: d.ceasedAt, isActive: d.isActive,
        })),
        charges,
      }),
    }).catch(() => {});
  }

  return { data, warnings };
}
