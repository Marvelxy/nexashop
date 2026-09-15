import { beforeEach, describe, expect, it, vi } from "vitest";
import { AuthError } from "next-auth";
import { signIn } from "@/lib/auth";
import {
  signInCredentials,
  register,
  requestPasswordReset,
  resetPassword,
} from "@/actions/auth";
import { db } from "@/lib/db";
import { verifyPassword } from "@/lib/password";

vi.mock("@/lib/auth", () => ({
  signIn: vi.fn(),
}));

vi.mock("@/lib/email", () => ({
  sendPasswordResetEmail: vi.fn().mockResolvedValue(undefined),
}));

const mockedSignIn = vi.mocked(signIn);
const mockedSendEmail = () => import("@/lib/email").then((m) => vi.mocked(m.sendPasswordResetEmail));

function form(data: Record<string, string>) {
  const f = new FormData();
  for (const [k, v] of Object.entries(data)) f.set(k, v);
  return f;
}

describe("signInCredentials", () => {
  beforeEach(() => {
    mockedSignIn.mockReset();
    mockedSignIn.mockResolvedValue(undefined as never);
  });

  it("returns an error when fields are missing", async () => {
    expect(await signInCredentials({}, form({}))).toEqual({
      error: "Enter your email and password",
    });
    expect(mockedSignIn).not.toHaveBeenCalled();
  });

  it("returns an error for invalid credentials", async () => {
    mockedSignIn.mockRejectedValueOnce(new AuthError("CredentialsSignin"));
    const res = await signInCredentials(
      {},
      form({ email: "admin@nexashop.dev", password: "wrong" }),
    );
    expect(res).toEqual({ error: "Invalid email or password" });
  });

  it("passes through valid credentials and sanitizes callbackUrl", async () => {
    const res = await signInCredentials(
      {},
      form({ email: "admin@nexashop.dev", password: "dev", callbackUrl: "//evil.com" }),
    );
    expect(mockedSignIn).toHaveBeenCalledWith("credentials", {
      email: "admin@nexashop.dev",
      password: "dev",
      redirectTo: "/",
    });
    expect(res).toEqual({});
  });
});

describe("register", () => {
  beforeEach(() => {
    mockedSignIn.mockReset();
    mockedSignIn.mockResolvedValue(undefined as never);
  });

  it("rejects an invalid email", async () => {
    const res = await register(
      {},
      form({ name: "Tester", email: "nope", password: "password123" }),
    );
    expect(res.error).toBeDefined();
    expect(mockedSignIn).not.toHaveBeenCalled();
  });

  it("rejects a short password", async () => {
    const res = await register(
      {},
      form({ name: "Tester", email: "b@nexashop.dev", password: "short" }),
    );
    expect(res.error).toBeDefined();
  });

  it("creates a hashed-password account and signs in", async () => {
    const email = `newbie-${Date.now()}@nexashop.dev`;
    const res = await register(
      {},
      form({ name: "New Person", email, password: "password123" }),
    );
    expect(res.error).toBeUndefined();

    const user = await db.user.findUnique({ where: { email } });
    expect(user).not.toBeNull();
    expect(user?.role).toBe("BUYER");
    expect(await verifyPassword("password123", user!.password!)).toBe(true);
    expect(mockedSignIn).toHaveBeenCalledWith("credentials", {
      email,
      password: "password123",
      redirectTo: "/",
    });
  });

  it("rejects an existing email", async () => {
    const res = await register(
      {},
      form({ name: "Dup", email: "buyer@nexashop.dev", password: "password123" }),
    );
    expect(res.error).toContain("already exists");
  });
});

describe("requestPasswordReset + resetPassword", () => {
  beforeEach(() => {
    mockedSignIn.mockReset();
    mockedSignIn.mockResolvedValue(undefined as never);
  });

  it("does not reveal unknown accounts", async () => {
    const res = await requestPasswordReset({}, form({ email: "ghost@nexashop.dev" }));
    expect(res.success).toContain("If an account exists");
  });

  it("creates a token and lets the user reset the password", async () => {
    const res = await requestPasswordReset({}, form({ email: "buyer@nexashop.dev" }));
    expect(res.success).toBeDefined();

    const emailSender = await mockedSendEmail();
    const rawToken = String(emailSender.mock.calls.at(-1)?.[1]).split("token=")[1];
    expect(rawToken).toBeTruthy();

    const resetToken = await db.passwordResetToken.findFirst({
      where: { user: { email: "buyer@nexashop.dev" } },
      orderBy: { createdAt: "desc" },
    });
    expect(resetToken).not.toBeNull();

    const updated = await resetPassword(
      {},
      form({ token: rawToken!, password: "newpassword123" }),
    );
    expect(updated.success).toContain("Password updated");
    expect(await db.passwordResetToken.findUnique({ where: { id: resetToken!.id } })).toMatchObject({
      usedAt: expect.any(Date),
    });

    const user = await db.user.findUnique({ where: { email: "buyer@nexashop.dev" } });
    expect(await verifyPassword("newpassword123", user!.password!)).toBe(true);
    expect(await verifyPassword("dev", user!.password!)).toBe(false);
  }, 20_000);

  it("rejects an unknown token", async () => {
    const res = await resetPassword({}, form({ token: "deadbeef", password: "password123" }));
    expect(res.error).toContain("invalid or has expired");
  });
});