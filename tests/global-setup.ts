import { execFileSync } from "node:child_process";
import { rmSync } from "node:fs";
import path from "node:path";
import { PrismaClient } from "@prisma/client";
import { hashSync } from "bcryptjs";

const root = path.resolve(__dirname, "..");
const testDbPath = path.join(root, "prisma", "test.db");

function seedDemoAccounts() {
  const db = new PrismaClient({ datasources: { db: { url: `file:${testDbPath}` } } });
  const dev = hashSync("dev", 12);

  return db.user.createMany({
    data: [
      { email: "admin@nexashop.dev", name: "Demo Admin", role: "ADMIN", password: dev },
      { email: "seller@nexashop.dev", name: "Demo Seller", role: "SELLER", password: dev },
      { email: "buyer@nexashop.dev", name: "Demo Buyer", role: "BUYER", password: dev },
      // Legacy account with no per-user password: relies on AUTH_DEV_PASSWORD fallback.
      { email: "legacy@nexashop.dev", name: "Legacy User", role: "BUYER" },
    ],
  }).then(() => db.$disconnect());
}

export default async function globalSetup() {
  rmSync(testDbPath, { force: true });
  execFileSync("npx", ["prisma", "db", "push", "--skip-generate", "--force-reset"], {
    cwd: root,
    env: { ...process.env, DATABASE_URL: `file:${testDbPath}` },
    stdio: "pipe",
  });
  await seedDemoAccounts();
}