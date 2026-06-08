import { prisma } from "./prisma";
import crypto from "crypto";

export function generateOtp(): string {
  return String(Math.floor(100000 + Math.random() * 900000));
}

export async function createOtp(email: string, purpose: "signup" | "forgot_password"): Promise<string> {
  // Invalidate old OTPs for same email+purpose
  await prisma.$executeRawUnsafe(
    `UPDATE csi_otps SET used = true WHERE email = $1 AND purpose = $2 AND used = false`,
    email, purpose
  );
  const code = generateOtp();
  const id = crypto.randomUUID();
  const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 min
  await prisma.$executeRawUnsafe(
    `INSERT INTO csi_otps (id, email, code, purpose, "expiresAt") VALUES ($1, $2, $3, $4, $5)`,
    id, email, code, purpose, expiresAt
  );
  return code;
}

export async function verifyOtp(email: string, code: string, purpose: "signup" | "forgot_password"): Promise<boolean> {
  const rows = await prisma.$queryRawUnsafe<Array<{id:string; "expiresAt": Date; used: boolean}>>(
    `SELECT id, "expiresAt", used FROM csi_otps WHERE email = $1 AND code = $2 AND purpose = $3 ORDER BY "createdAt" DESC LIMIT 1`,
    email, code, purpose
  );
  if (!rows.length) return false;
  const otp = rows[0];
  if (otp.used || new Date(otp.expiresAt) < new Date()) return false;
  await prisma.$executeRawUnsafe(`UPDATE csi_otps SET used = true WHERE id = $1`, otp.id);
  return true;
}
