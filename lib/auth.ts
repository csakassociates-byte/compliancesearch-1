import type { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import { prisma } from "./prisma";

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: "credentials",
      credentials: {
        email:    { label: "Email",    type: "email"    },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        // Admin login via username
        const username = (credentials as any)?.username;
        if (username) {
          const expectedUser = process.env.ADMIN_USERNAME || "admin";
          const expectedPass = process.env.ADMIN_PASSWORD || "ARKbiz201@";
          if (username === expectedUser && (credentials as any)?.password === expectedPass) {
            return { id: "admin", name: "Admin", email: "admin@compliancesearch.in", plan: "admin", mustChangePassword: false } as any;
          }
          return null;
        }

        if (!credentials?.email || !credentials?.password) return null;
        const email = credentials.email.toLowerCase().trim();

        const rows = await prisma.$queryRawUnsafe<Array<{
          id: string; name: string | null; email: string;
          passwordHash: string | null; plan: string;
          mustChangePassword: boolean | null;
        }>>(
          `SELECT id, name, email, "passwordHash", plan, "mustChangePassword", ai_enabled
           FROM csi_users WHERE email = $1`,
          email
        );

        if (!rows.length) return null;
        const user = rows[0];
        if (!user.passwordHash) return null;

        const valid = await bcrypt.compare(credentials.password, user.passwordHash);
        if (!valid) return null;

        return {
          id:                user.id,
          name:              user.name,
          email:             user.email,
          plan:              user.plan,
          mustChangePassword: !!user.mustChangePassword,
          ai_enabled:        !!(user as { ai_enabled?: boolean }).ai_enabled,
        };
      },
    }),
  ],
  session: { strategy: "jwt" },
  callbacks: {
    async jwt({ token, user, trigger }) {
      if (user) {
        token.id                = user.id;
        token.plan              = (user as { plan?: string }).plan ?? "free";
        token.mustChangePassword = (user as { mustChangePassword?: boolean }).mustChangePassword ?? false;
        token.ai_enabled        = (user as { ai_enabled?: boolean }).ai_enabled ?? false;
        token.ai_model          = (user as { ai_model?: string }).ai_model ?? "haiku";
      }
      // Refresh ai_enabled from DB on every token refresh so admin changes take effect without re-login
      if (!user || trigger === "update") {
        try {
          const fresh = await prisma.csi_users.findUnique({
            where: { id: token.id as string },
            select: { ai_enabled: true, ai_model: true, plan: true },
          });
          if (fresh) {
            token.ai_enabled = fresh.ai_enabled ?? false;
            token.ai_model   = fresh.ai_model ?? "haiku";
            token.plan       = fresh.plan ?? token.plan;
          }
        } catch { /* keep stale token on DB error */ }
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        (session.user as { id?: string }).id                    = token.id as string;
        (session.user as { plan?: string }).plan                = token.plan as string;
        (session.user as { mustChangePassword?: boolean }).mustChangePassword
          = token.mustChangePassword as boolean ?? false;
        (session.user as { ai_enabled?: boolean }).ai_enabled   = token.ai_enabled as boolean ?? false;
        (session.user as { ai_model?: string }).ai_model        = token.ai_model as string ?? "haiku";
      }
      return session;
    },
  },
  pages: {
    signIn: "/auth/login",
    error:  "/auth/login",
  },
  secret: process.env.NEXTAUTH_SECRET,
};
