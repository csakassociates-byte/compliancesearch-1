import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import crypto from "crypto";

/* ── Auto-migrate ─────────────────────────────────────────────── */
async function ensureCols() {
  await prisma.$executeRawUnsafe(`
    ALTER TABLE csi_documents
      ADD COLUMN IF NOT EXISTS "companyId"  TEXT,
      ADD COLUMN IF NOT EXISTS "sourceType" TEXT,
      ADD COLUMN IF NOT EXISTS "sourceId"   TEXT
  `).catch(() => {});

  await prisma.$executeRawUnsafe(`
    ALTER TABLE csi_share_transfers
      ADD COLUMN IF NOT EXISTS "meetingDocId"   TEXT,
      ADD COLUMN IF NOT EXISTS "resolutionNo"   TEXT,
      ADD COLUMN IF NOT EXISTS "resolutionText" TEXT
  `).catch(() => {});
}

/* ═══════════════════════════════════════════════════════════════
   GET /api/board-resolutions?companyId=xxx&date=yyyy-mm-dd
   — Returns existing board_minutes docs for that company + date
   — Also returns all board meetings (for dropdown)
══════════════════════════════════════════════════════════════════ */
export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const userId = (session.user as { id: string }).id;

  await ensureCols();

  const { searchParams } = new URL(req.url);
  const companyId = searchParams.get("companyId");
  const date      = searchParams.get("date");

  if (!companyId) return NextResponse.json({ error: "companyId required" }, { status: 400 });

  // All board meetings for this company (for dropdown)
  const allMeetings = await prisma.$queryRawUnsafe<Array<{
    id: string; title: string; meetingDate: string; formDataJson: string;
  }>>(
    `SELECT id, title, "meetingDate", "formDataJson"
     FROM csi_documents
     WHERE "userId" = $1
       AND "companyId" = $2
       AND type = 'board_minutes'
     ORDER BY "meetingDate" DESC
     LIMIT 20`,
    userId, companyId
  );

  // Meeting on exact date (if provided)
  let exactMatch: typeof allMeetings[0] | null = null;
  if (date) {
    exactMatch = allMeetings.find(m => m.meetingDate === date) ?? null;
  }

  return NextResponse.json({ allMeetings, exactMatch });
}

/* ═══════════════════════════════════════════════════════════════
   POST /api/board-resolutions
   — Create new meeting doc OR add resolution to existing one
   — Returns meetingDocId + resolutionNo

   Body:
   {
     companyId:       string,
     companyName:     string,
     cin?:            string,
     regAddress?:     string,

     // Meeting (new or existing)
     meetingDocId?:   string,   // if attaching to existing meeting
     meetingDate:     string,
     meetingSerial?:  string,   // e.g. "06" → auto if blank
     venue?:          string,
     chairmanName?:   string,
     directors?:      Array<{ name, din, designation, present }>,

     // Resolution
     resolutionText:  string,
     transferId?:     string,   // link to transfer after creation
   }
══════════════════════════════════════════════════════════════════ */
export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const userId = (session.user as { id: string }).id;

  await ensureCols();

  const body = await req.json() as {
    companyId:      string;
    companyName:    string;
    cin?:           string;
    regAddress?:    string;
    meetingDocId?:  string;
    meetingDate:    string;
    meetingSerial?: string;
    venue?:         string;
    chairmanName?:  string;
    directors?:     Array<{ name: string; din: string; designation: string; present: boolean }>;
    resolutionText: string;
    transferId?:    string;
  };

  if (!body.companyId)     return NextResponse.json({ error: "companyId required" }, { status: 400 });
  if (!body.meetingDate)   return NextResponse.json({ error: "meetingDate required" }, { status: 400 });
  if (!body.resolutionText) return NextResponse.json({ error: "resolutionText required" }, { status: 400 });

  let meetingDocId = body.meetingDocId ?? null;
  let existingFormData: Record<string, unknown> | null = null;

  /* ── 1. Load existing meeting if provided ── */
  if (meetingDocId) {
    const [existing] = await prisma.$queryRawUnsafe<Array<{ formDataJson: string }>>(
      `SELECT "formDataJson" FROM csi_documents WHERE id = $1 AND "userId" = $2`,
      meetingDocId, userId
    );
    if (existing) existingFormData = JSON.parse(existing.formDataJson) as Record<string, unknown>;
  }

  /* ── 2. Auto serial number if new meeting ── */
  let meetingSerial = body.meetingSerial || '';
  if (!meetingDocId && !meetingSerial) {
    const [lastDoc] = await prisma.$queryRawUnsafe<Array<{ formDataJson: string }>>(
      `SELECT "formDataJson" FROM csi_documents
       WHERE "userId" = $1 AND "companyId" = $2 AND type = 'board_minutes'
       ORDER BY "meetingDate" DESC LIMIT 1`,
      userId, body.companyId
    );
    if (lastDoc) {
      const last = JSON.parse(lastDoc.formDataJson) as { meetingSerial?: string };
      const lastN = parseInt(last.meetingSerial || '0') || 0;
      meetingSerial = String(lastN + 1).padStart(2, '0');
    } else {
      meetingSerial = '01';
    }
  }

  /* ── 3. Build new agenda item (share transfer resolution) ── */
  const existingItems = (existingFormData?.agendaItems as unknown[]) ?? [];
  const resolutionNo  = `${meetingSerial}/${(existingItems.length + 1).toString().padStart(2, '0')}`;

  const newAgendaItem = {
    id:             `share-transfer-${body.transferId || crypto.randomUUID()}`,
    templateId:     'share_transfer',
    title:          'Share Transfer — Approval of Transfer of Shares',
    discussion:     'The Board considered the request for transfer of shares as per Form SH-4 submitted along with share certificate(s).',
    resolution:     body.resolutionText,
    resolutionType: 'ordinary' as const,
    votingResult:   'passed' as const,
    fields:         {},
    sourceType:     'share_transfer',
    transferId:     body.transferId ?? null,
  };

  /* ── 4. Build full formDataJson ── */
  const formData = existingFormData ?? {
    companyName:    body.companyName,
    cin:            body.cin            ?? '',
    regAddress:     body.regAddress     ?? '',
    entityType:     'pvt_ltd',
    meetingSerial,
    financialYear:  '',
    meetingDate:    body.meetingDate,
    meetingTime:    '11:00',
    closingTime:    '',
    venue:          body.venue          ?? 'Registered Office of the Company',
    chairmanName:   body.chairmanName   ?? '',
    chairmanDin:    '',
    chairmanDesig:  'Director',
    prevMeetingDate:'',
    directors:      body.directors      ?? [],
    invitees:       [],
    printOnLetterhead: true,
    printMobile:    '',
    printEmail:     '',
    ctcSignatories: [
      { name: '', designation: 'Director', din: '' },
      { name: '', designation: 'Director', din: '' },
    ],
    agendaItems: [],
  };

  // Update serial/date if already existed
  if (existingFormData) {
    (formData as Record<string, unknown>).meetingDate = body.meetingDate;
    if (body.directors?.length) (formData as Record<string, unknown>).directors = body.directors;
  }

  // Add new agenda item
  const agendaItems = [...(formData.agendaItems as unknown[]), newAgendaItem];
  (formData as Record<string, unknown>).agendaItems = agendaItems;

  const fmtDate = (d: string) => {
    if (!d) return '';
    const dt = new Date(d);
    return dt.toLocaleDateString('en-IN', { day: '2-digit', month: 'long', year: 'numeric' });
  };

  const title = `Board Meeting ${meetingSerial} — ${fmtDate(body.meetingDate)} — ${body.companyName}`;

  /* ── 5. Save or update document ── */
  if (meetingDocId && existingFormData) {
    // UPDATE existing meeting — append resolution
    await prisma.$executeRawUnsafe(
      `UPDATE csi_documents SET
         "formDataJson" = $1,
         "updatedAt"    = NOW()
       WHERE id = $2 AND "userId" = $3`,
      JSON.stringify(formData), meetingDocId, userId
    );
  } else {
    // CREATE new meeting document
    meetingDocId = crypto.randomUUID();
    await prisma.$executeRawUnsafe(
      `INSERT INTO csi_documents
         (id, "userId", "companyId", type, title, "companyName", "meetingDate", "formDataJson", "sourceType", "updatedAt")
       VALUES ($1,$2,$3,'board_minutes',$4,$5,$6,$7,'share_transfer',NOW())`,
      meetingDocId, userId, body.companyId,
      title, body.companyName,
      body.meetingDate, JSON.stringify(formData)
    );
  }

  /* ── 6. Link transfer to meeting ── */
  if (body.transferId) {
    await prisma.$executeRawUnsafe(
      `UPDATE csi_share_transfers SET
         "meetingDocId"   = $1,
         "resolutionNo"   = $2,
         "resolutionText" = $3
       WHERE id = $4 AND "userId" = $5`,
      meetingDocId, resolutionNo, body.resolutionText,
      body.transferId, userId
    );
  }

  return NextResponse.json({ meetingDocId, resolutionNo, meetingSerial });
}
