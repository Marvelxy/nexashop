import { describe, it, expect } from "vitest";
import type { CredentialsConfig } from "@auth/core/providers/credentials";
import { authConfig, resolveRole } from "@/lib/auth";
import { hashPassword, verifyPassword } from "@/lib/password";

const credentialsProvider = authConfig.providers.find((p) => p.id === "credentials") as
  | undefined
  | (CredentialsConfig & { options: { authorize: unknown } });

// NextAuth merges the user-supplied config (held in `options`) onto the provider
// at runtime, so the real authorize handler lives there, not on the top level.
const authorize = credentialsProvider?.options.authorize as unknown as ((
  credentials: Record<string, unknown>,
) => Promise<{ email?: string | null; role?: string } | null>) | undefined;

describe("credentials provider", () => {
  it("has the credentials provider configured", () => {
    expect(credentialsProvider).toBeDefined();
    expect(authorize).toBeTypeOf("function");
  });

  it("accepts the seeded admin login (admin@nexashop.dev / dev)", async () => {
    const user = await authorize!({ email: "admin@nexashop.dev", password: "dev" });
    expect(user).not.toBeNull();
    expect(user?.email).toBe("admin@nexashop.dev");
    expect(user?.role).toBe("ADMIN");
  });

  it("accepts the seeded seller login (seller@nexashop.dev / dev)", async () => {
    const user = await authorize!({ email: "seller@nexashop.dev", password: "dev" });
    expect(user?.role).toBe("SELLER");
  });

  it("accepts a seeded buyer with a password", async () => {
    const user = await authorize!({ email: "buyer@nexashop.dev", password: "dev" });
    expect(user?.role).toBe("BUYER");
  });

  it("rejects a wrong password for the admin", async () => {
    const user = await authorize!({ email: "admin@nexashop.dev", password: "not-the-password" });
    expect(user).toBeNull();
  });

  it("rejects unknown emails", async () => {
    const user = await authorize!({ email: "nobody@nexashop.dev", password: "dev" });
    expect(user).toBeNull();
  });

  it("rejects empty credentials", async () => {
    expect(await authorize!({ email: "", password: "dev" })).toBeNull();
    expect(await authorize!({ email: "admin@nexashop.dev", password: "" })).toBeNull();
  });

  it("normalizes the email (trim + lowercase)", async () => {
    const user = await authorize!({
      email: "  Admin@Nexashop.Dev ",
      password: "dev",
    });
    expect(user?.email).toBe("admin@nexashop.dev");
  });

  it("falls back to AUTH_DEV_PASSWORD for accounts without a hash", async () => {
    const user = await authorize!({ email: "legacy@nexashop.dev", password: "dev" });
    expect(user?.email).toBe("legacy@nexashop.dev");
  });
});

describe("password hashing", () => {
  it("hashes and verifies a password round-trip", async () => {
    const hash = await hashPassword("s3cret-password");
    expect(hash).not.toBe("s3cret-password");
    expect(await verifyPassword("s3cret-password", hash)).toBe(true);
    expect(await verifyPassword("wrong", hash)).toBe(false);
  });
});

describe("resolveRole", () => {
  it("upgrades listed admin emails to ADMIN", () => {
    expect(resolveRole("SELLER", "admin@nexashop.dev")).toBe("ADMIN");
    expect(resolveRole("BUYER", "Admin@Nexashop.Dev")).toBe("ADMIN");
  });

  it("keeps the DB role for any other email", () => {
    expect(resolveRole("SELLER", "seller@nexashop.dev")).toBe("SELLER");
    expect(resolveRole("BUYER", "buyer@nexashop.dev")).toBe("BUYER");
  });

  it("handles missing emails", () => {
    expect(resolveRole("BUYER", null)).toBe("BUYER");
    expect(resolveRole("BUYER", undefined)).toBe("BUYER");
  });
});