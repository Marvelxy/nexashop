"use server";

import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { db } from "@/lib/db";
import {
  CART_COOKIE_NAME,
  CART_MAX_QTY_PER_ITEM,
  parseCart,
  serializeCart,
} from "@/lib/cart";

export type CartState = { error?: string; success?: string };

const addSchema = z.object({
  productId: z.string().min(1),
  qty: z.coerce.number().int().min(1).max(CART_MAX_QTY_PER_ITEM).default(1),
});

const updateSchema = z.object({
  productId: z.string().min(1),
  qty: z.coerce.number().int().min(0).max(CART_MAX_QTY_PER_ITEM),
});

const removeSchema = z.object({
  productId: z.string().min(1),
});

async function readLines() {
  const store = await cookies();
  return parseCart(store.get(CART_COOKIE_NAME)?.value);
}

async function writeLines(lines: { productId: string; qty: number }[]) {
  const store = await cookies();
  if (lines.length === 0) {
    store.delete(CART_COOKIE_NAME);
  } else {
    store.set(CART_COOKIE_NAME, serializeCart(lines), {
      httpOnly: true,
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 60 * 24 * 30, // 30 days
    });
  }
}

function revalidateCart() {
  revalidatePath("/cart");
  revalidatePath("/");
}

export async function addToCart(
  _prev: CartState,
  formData: FormData,
): Promise<CartState> {
  const parsed = addSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }
  const { productId, qty } = parsed.data;

  const product = await db.product.findUnique({
    where: { id: productId },
    include: { store: true },
  });
  if (!product || !product.isPublished || !product.store.isApproved) {
    return { error: "Product not available" };
  }
  if (product.stock < 1) {
    return { error: "Product is out of stock" };
  }

  const lines = await readLines();
  const existing = lines.find((l) => l.productId === productId);
  const nextQty = Math.min(
    (existing?.qty ?? 0) + qty,
    CART_MAX_QTY_PER_ITEM,
    product.stock,
  );

  if (existing) existing.qty = nextQty;
  else lines.push({ productId, qty: Math.min(qty, product.stock) });

  await writeLines(lines);
  revalidateCart();
  return { success: `Added ${product.name} to cart` };
}

export async function updateCartItem(
  _prev: CartState,
  formData: FormData,
): Promise<CartState> {
  const parsed = updateSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }
  const { productId, qty } = parsed.data;

  let lines = await readLines();
  if (qty === 0) {
    lines = lines.filter((l) => l.productId !== productId);
  } else {
    const product = await db.product.findUnique({ where: { id: productId } });
    if (!product) {
      lines = lines.filter((l) => l.productId !== productId);
    } else {
      const capped = Math.min(qty, CART_MAX_QTY_PER_ITEM, Math.max(product.stock, 1));
      const existing = lines.find((l) => l.productId === productId);
      if (existing) existing.qty = capped;
      else lines.push({ productId, qty: capped });
    }
  }

  await writeLines(lines);
  revalidateCart();
  return { success: "Cart updated" };
}

export async function removeFromCart(
  _prev: CartState,
  formData: FormData,
): Promise<CartState> {
  const parsed = removeSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { error: "Invalid input" };

  const lines = (await readLines()).filter(
    (l) => l.productId !== parsed.data.productId,
  );
  await writeLines(lines);
  revalidateCart();
  return { success: "Removed from cart" };
}

export async function clearCart(): Promise<void> {
  const store = await cookies();
  store.delete(CART_COOKIE_NAME);
  revalidateCart();
}
