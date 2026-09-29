import { auth } from "./auth";
import { db } from "./db";
import {
  formatPrice as formatPriceIntl,
  type FormatPriceOptions,
} from "./currency";

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

/**
 * Backwards-compatible wrapper around {@link formatPriceIntl}.
 * Accepts a legacy `(cents, "USD")` pair or a `{ currency, locale }` object.
 */
export function formatPrice(
  cents: number,
  currencyOrOptions?: string | FormatPriceOptions | null,
  locale?: string | null,
) {
  if (typeof currencyOrOptions === "string" || currencyOrOptions == null) {
    return formatPriceIntl(cents, {
      currency: currencyOrOptions ?? undefined,
      locale: locale ?? undefined,
    });
  }
  return formatPriceIntl(cents, currencyOrOptions);
}