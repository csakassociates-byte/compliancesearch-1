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
  const DATE_HEADERS = new Set([
    "Date of Appointment", "Date of Appointment of Director",
    "Cessation Date", "Date of Incorporation",
  ]);
  function cellToStr(h: string, v: unknown): string {
    if (v === null || v === undefined || v === "") return "";
    if (v instanceof Date) {
      if (isNaN(v.getTime())) return "";
      return `${String(v.getDate()).padStart(2,"0")}/${String(v.getMonth()+1).padStart(2,"0")}/${v.getFullYear()}`;
    }
    if (DATE_HEADERS.has(h) && typeof v === "number" && v > 1 && v < 60000) {
      const d = new Date((v - 25569) * 86400000);
      if (!isNaN(d.getTime()))
        return `${String(d.getDate()).padStart(2,"0")}/${String(d.getMonth()+1).padStart(2,"0")}/${d.getFullYear()}`;
    }
    return String(v).trim();
  }
  function sheetToMapped(sheetName: string): Record<string, string>[] {
    const sheet = wb.Sheets[sheetName];
    if (!sheet) return [];
    const raw = XLSX.utils.sheet_to_json<unknown[]>(sheet, { header: 1, defval: "" }) as unknown[][];
    if (raw.length < 2) return [];
    const headers = (raw[1] as unknown[]).map(h => String(h).trim());
    return raw
      .slice(2)
      .map(row => {
        const obj: Record<string, string> = {};
        headers.forEach((h, i) => { obj[h] = cellToStr(h, (row as unknown[])[i]); });
        return obj;
      })
      .filter(row => Object.values(row).some(v => v !== ""));
  }

  // ── MasterData sheet (key-value pairs) ──────────────────────────────────
  const masterSheet = wb.Sheets["MasterData"];
  const masterRaw   = masterSheet
    ? (XLSX.utils.sheet_to_json<unknown[]>(masterSheet, { header: 1, defval: "" }) as unknown[][])
    : [];
  const m: Record<string, string> = {};
  // Date fields that may come as Excel serial numbers instead of strings
  const DATE_KEYS = new Set(["Date of Incorporation", "Date of Last AGM", "Date of Balance Sheet"]);
  function excelSerialToStr(n: number): string {
    const d = new Date((n - 25569) * 86400000);
    if (isNaN(d.getTime())) return String(n);
    return `${String(d.getDate()).padStart(2,"0")}/${String(d.getMonth()+1).padStart(2,"0")}/${d.getFullYear()}`;
  }
  for (const row of masterRaw) {
    const key = String((row as unknown[])[0] || "").trim();
    const raw = (row as unknown[])[1];
    if (!key || raw === "" || raw === null || raw === undefined) continue;
    if (DATE_KEYS.has(key) && typeof raw === "number" && raw > 1 && raw < 60000) {
      m[key] = excelSerialToStr(raw);
    } else if (raw instanceof Date) {
      if (!isNaN(raw.getTime()))
        m[key] = `${String(raw.getDate()).padStart(2,"0")}/${String(raw.getMonth()+1).padStart(2,"0")}/${raw.getFullYear()}`;
    } else {
      m[key] = String(raw).trim();
    }
  }

  // ── Detect LLP vs Company (LLP Excel uses "LLPIN" and "LLP Name") ──────────
  const isLLP = !!(m["LLPIN"] || m["LLP Name"]);

  const companyName        = m["Company Name"] || m["LLP Name"]                             || "";
  const cin                = m["CIN"]          || m["LLPIN"]                                || "";
  const regAddress         = m["Registered Address"]                                        || "";
  const classOfCo          = m["Class of Company"]                                          || (isLLP ? "LLP" : "");
  const subcategory        = m["Subcategory of the Company"] || m["Company Sub-Category"]   || "";
  const categoryOfCompany  = m["Category of the Company"]   || m["Company Category"]        || "";
  const entityType         = isLLP ? "llp" : entityTypeFromExcel(classOfCo, subcategory);
  const registrationNumber = m["Registration Number"]                                       || undefined;
  const incorporationDate  = m["Date of Incorporation"]                                     || undefined;
  const dateOfLastAGM      = m["Date of Last AGM"]                                          || undefined;
  const dateOfBalanceSheet = m["Date of Balance Sheet"]                                     || undefined;
  const paidUpCapital      = m["Paid up Capital (Rs)"] || m["Total Obligation of Contribution"] || undefined;
  const authorisedCapital  = m["Authorised Capital (Rs)"]                                   || undefined;
  const email              = (m["Email Id"] || "").replace("[at]", "@").replace("[dot]", ".") || undefined;
  const rocName            = m["ROC Name"] || m["ROC Name (display)"]                       || undefined;
  const status             = m["Company Status (for efiling)"] || m["Company Status"] || m["LLP Status"] || undefined;
  const isListed           = (m["Listed in Stock Exchange(s) (Y/N)"] || "").toLowerCase() === "yes";
  const mobile             = m["Phone Number"] || m["Mobile Number"]                        || undefined;
  const gstNumber          = m["GST No"] || m["GST Number"]                                 || undefined;
  const jurisdiction       = m["Jurisdiction"]                                              || undefined;
  const smallCompany       = subcategory.toLowerCase().includes("small company") || (m["Small LLP"] || "").toLowerCase() === "yes";

  if (!companyName) warnings.push(`${isLLP ? "LLP" : "Company"} Name not found in MasterData sheet.`);
  if (!cin)         warnings.push(`${isLLP ? "LLPIN" : "CIN"} not found in MasterData sheet.`);

  // ── Director Details ──────────────────────────────────────────────────────
  const dirRows  = sheetToMapped("Director Details");
  const directors: DirectorData[] = [];

  for (const row of dirRows) {
    const name      = row["Name"]
                   || row["Name of Director"]
                   || row["Director Name"]
                   || row["Name of Directors"]
                   || row["Full Name"]
                   || "";
    const desig     = row["Designation"]
                   || row["Designation in the Company"]
                   || row["Director Designation"]
                   || "";
    const din       = row["DIN/PAN"]
                   || row["DIN"]
                   || row["Director Identification Number"]
                   || row["DIN / PAN"]
                   || "";
    const isSig     = (row["Signatory"] || "").toLowerCase() === "yes";
    const cessation = row["Cessation Date"] || row["Cessation date"] || "";
    // LLP sheet: column 5 = Date of Appointment, column 6 = Cessation Date
    const appointed = row["Date of Appointment"]
                   || row["Date of Appointment of Director"]
                   || row["Date of appointment"]
                   || "";
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

  if (directors.length === 0) warnings.push(`No ${isLLP ? "partners" : "directors"} found in Director Details sheet.`);

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
