import { cookies } from "next/headers";
import { db } from "@/lib/db";

export const CART_COOKIE_NAME = "nexashop_cart";
export const CART_MAX_QTY_PER_ITEM = 99;

export type CartLine = {
  productId: string;
  qty: number;
};

export type CartLineWithProduct = CartLine & {
  product: {
    id: string;
    name: string;
    slug: string;
    price: number;
    stock: number;
    images: string[];
    isPublished: boolean;
    store: { name: string };
  };
};

export function parseCart(raw: string | undefined | null): CartLine[] {
  if (!raw) return [];
  try {
    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    const lines: CartLine[] = [];
    for (const entry of parsed) {
      if (
        typeof entry === "object" &&
        entry !== null &&
        typeof (entry as { productId?: unknown }).productId === "string" &&
        typeof (entry as { qty?: unknown }).qty === "number"
      ) {
        const productId = (entry as { productId: string }).productId;
        const qty = Math.floor((entry as { qty: number }).qty);
        if (!productId || qty < 1) continue;
        lines.push({
          productId,
          qty: Math.min(qty, CART_MAX_QTY_PER_ITEM),
        });
      }
    }
    // Merge duplicates, keep first-seen order
    const merged = new Map<string, number>();
    for (const l of lines) {
      merged.set(l.productId, (merged.get(l.productId) ?? 0) + l.qty);
    }
    return [...merged.entries()].map(([productId, qty]) => ({
      productId,
      qty: Math.min(qty, CART_MAX_QTY_PER_ITEM),
    }));
  } catch {
    return [];
  }
}

export function serializeCart(lines: CartLine[]): string {
  return JSON.stringify(lines);
}

export async function getCartLines(): Promise<CartLine[]> {
  const store = await cookies();
  return parseCart(store.get(CART_COOKIE_NAME)?.value);
}

export async function getCartCount(): Promise<number> {
  const lines = await getCartLines();
  return lines.reduce((sum, l) => sum + l.qty, 0);
}

export async function getDetailedCart(): Promise<{
  lines: CartLineWithProduct[];
  subtotal: number;
  count: number;
}> {
  const lines = await getCartLines();
  if (lines.length === 0) return { lines: [], subtotal: 0, count: 0 };

  const products = await db.product.findMany({
    where: { id: { in: lines.map((l) => l.productId) } },
    include: { store: true },
  });
  const byId = new Map(products.map((p) => [p.id, p]));

  const detailed: CartLineWithProduct[] = [];
  for (const line of lines) {
    const p = byId.get(line.productId);
    if (!p) continue;
    const images = Array.isArray(p.images) ? (p.images as string[]) : [];
    detailed.push({
      ...line,
      product: {
        id: p.id,
        name: p.name,
        slug: p.slug,
        price: p.price,
        stock: p.stock,
        images,
        isPublished: p.isPublished,
        store: { name: p.store.name },
      },
    });
  }

  const subtotal = detailed.reduce((s, l) => s + l.product.price * l.qty, 0);
  const count = detailed.reduce((s, l) => s + l.qty, 0);
  return { lines: detailed, subtotal, count };
}
