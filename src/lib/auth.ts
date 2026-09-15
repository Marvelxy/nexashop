import NextAuth from "next-auth";
import type { NextAuthConfig } from "next-auth";
import GitHub from "next-auth/providers/github";
import Google from "next-auth/providers/google";
import Credentials from "next-auth/providers/credentials";
import { PrismaAdapter } from "@auth/prisma-adapter";
import { db } from "./db";
import { verifyPassword } from "./password";

type Role = "BUYER" | "SELLER" | "ADMIN";

const githubId = process.env.AUTH_GITHUB_ID;
const githubSecret = process.env.AUTH_GITHUB_SECRET;
const googleId = process.env.AUTH_GOOGLE_ID;
const googleSecret = process.env.AUTH_GOOGLE_SECRET;
const devPassword = process.env.AUTH_DEV_PASSWORD;
const adminEmails = (process.env.AUTH_ADMIN_EMAILS ?? "")
  .split(",")
  .map((e) => e.trim().toLowerCase())
  .filter(Boolean);

export function resolveRole(dbRole: Role, email?: string | null): Role {
  return adminEmails.includes((email ?? "").toLowerCase()) ? "ADMIN" : dbRole;
}

export const authConfig = {
  adapter: PrismaAdapter(db),
  // JWT is required for the Credentials provider (database sessions cannot store it).
  session: { strategy: "jwt" },
  trustHost: true,
  pages: { signIn: "/login" },
  providers: [
    ...(githubId && githubSecret
      ? [GitHub({ clientId: githubId, clientSecret: githubSecret })]
      : []),
    ...(googleId && googleSecret
      ? [Google({ clientId: googleId, clientSecret: googleSecret })]
      : []),
    Credentials({
      name: "Email",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        const email = String(credentials?.email ?? "").trim().toLowerCase();
        const password = String(credentials?.password ?? "");
        if (!email || !password) return null;

        const user = await db.user.findUnique({ where: { email } });
        if (!user) return null;

        // Accounts created before per-user passwords (or OAuth-only accounts) have
        // no hash. In dev, the shared AUTH_DEV_PASSWORD is accepted instead.
        if (user.password) {
          const ok = await verifyPassword(password, user.password);
          if (!ok) return null;
        } else if (!devPassword || password !== devPassword) {
          return null;
        }

        return {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
        };
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        const dbUser = await db.user.findUnique({
          where: { id: user.id },
          select: { role: true, email: true },
        });
        const email = user.email ?? dbUser?.email ?? "";
        token.role = resolveRole(dbUser?.role ?? user.role ?? "BUYER", email);
      }
      return token;
    },
    async session({ session, token }) {
      const id = token.id;
      const role = token.role;
      if (session.user && id && role) {
        session.user.id = id;
        session.user.role = role;
      }
      return session;
    },
  },
} satisfies NextAuthConfig;

export const { handlers, auth, signIn, signOut } = NextAuth(authConfig);

export const getAuthSession = auth;

export function authProviders() {
  return {
    github: Boolean(githubId && githubSecret),
    google: Boolean(googleId && googleSecret),
    credentials: true,
  };
}