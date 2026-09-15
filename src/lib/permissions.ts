import { auth } from "./auth";
import { db } from "./db";

export async function currentUser() {
  const session = await auth();
  if (!session?.user?.id) return null;
  return db.user.findUnique({ where: { id: session.user.id } });
}

export async function requireUser() {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Unauthorized");
  return session;
}

export async function requireSeller() {
  const user = await currentUser();
  if (!user || (user.role !== "SELLER" && user.role !== "ADMIN"))
    throw new Error("Seller only");
  return { user };
}

export async function requireAdmin() {
  const user = await currentUser();
  if (!user || user.role !== "ADMIN") throw new Error("Admin only");
  return { user };
}

export function formatPrice(cents: number, currency = "USD") {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency,
  }).format(cents / 100);
}