"use server";

import { createHash, randomBytes } from "node:crypto";
import { z } from "zod";
import { AuthError } from "next-auth";
import { signIn } from "@/lib/auth";
import { db } from "@/lib/db";
import { hashPassword } from "@/lib/password";
import { sendPasswordResetEmail } from "@/lib/email";

export type AuthState = { error?: string; success?: string };

const registerSchema = z.object({
  name: z.string().trim().min(2).max(80),
  email: z.string().trim().toLowerCase().email(),
  password: z.string().min(8).max(128),
});

const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
const RESET_TTL_MS = 60 * 60 * 1000; // 1 hour

function hashToken(token: string) {
  return createHash("sha256").update(token).digest("hex");
}

export async function signInCredentials(
  _prev: AuthState,
  formData: FormData,
): Promise<AuthState> {
  const email = String(formData.get("email") ?? "");
  const password = String(formData.get("password") ?? "");
  const raw = String(formData.get("callbackUrl") ?? "/");
  const next = raw.startsWith("/") && !raw.startsWith("//") ? raw : "/";
  if (!email || !password) return { error: "Enter your email and password" };

  try {
    await signIn("credentials", { email, password, redirectTo: next });
  } catch (error) {
    if (error instanceof AuthError) {
      return { error: "Invalid email or password" };
    }
    throw error; // let Next.js handle the success redirect
  }
  return {};
}

export async function register(_prev: AuthState, formData: FormData): Promise<AuthState> {
  const parsed = registerSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid details" };
  }

  const { name, email, password } = parsed.data;

  const existing = await db.user.findUnique({ where: { email } });
  if (existing) return { error: "An account with that email already exists" };

  const user = await db.user.create({
    data: {
      name,
      email,
      role: "BUYER",
      password: await hashPassword(password),
    },
  });

  try {
    await signIn("credentials", { email, password: password, redirectTo: "/" });
  } catch (error) {
    if (!(error instanceof AuthError)) throw error;
    // Sign-in should succeed right after account creation; surface any failure.
    return { error: "Account created, but automatic sign-in failed. Please sign in." };
  }

  return user ? { success: "Account created" } : { error: "Could not create account" };
}

export async function requestPasswordReset(
  _prev: AuthState,
  formData: FormData,
): Promise<AuthState> {
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  if (!email) return { error: "Enter your email" };

  const user = await db.user.findUnique({ where: { email } });

  // Always return success to avoid leaking which accounts exist.
  if (!user) return { success: "If an account exists, a reset link has been sent." };

  const token = randomBytes(32).toString("hex");
  await db.passwordResetToken.deleteMany({ where: { userId: user.id } });
  await db.passwordResetToken.create({
    data: {
      userId: user.id,
      token: hashToken(token),
      expiresAt: new Date(Date.now() + RESET_TTL_MS),
    },
  });

  const resetUrl = `${appUrl}/reset-password?token=${token}`;
  await sendPasswordResetEmail(email, resetUrl);

  return { success: "If an account exists, a reset link has been sent." };
}

export async function resetPassword(_prev: AuthState, formData: FormData): Promise<AuthState> {
  const token = String(formData.get("token") ?? "");
  const password = String(formData.get("password") ?? "");
  if (!token) return { error: "Missing reset token" };
  if (password.length < 8) return { error: "Password must be at least 8 characters" };

  const reset = await db.passwordResetToken.findUnique({
    where: { token: hashToken(token) },
    include: { user: true },
  });

  if (!reset || reset.usedAt || reset.expiresAt.getTime() < Date.now() || !reset.user.email) {
    return { error: "This reset link is invalid or has expired. Request a new one." };
  }

  const user = reset.user;
  await db.$transaction([
    db.user.update({
      where: { id: user.id },
      data: { password: await hashPassword(password) },
    }),
    db.passwordResetToken.update({
      where: { id: reset.id },
      data: { usedAt: new Date() },
    }),
  ]);

  try {
    await signIn("credentials", { email: user.email, password: password, redirectTo: "/" });
  } catch (error) {
    if (!(error instanceof AuthError)) throw error;
    return { error: "Password updated, but automatic sign-in failed. Please sign in." };
  }

  return { success: "Password updated" };
}