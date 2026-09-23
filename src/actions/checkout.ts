"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { currentUser } from "@/lib/permissions";
import { CART_COOKIE_NAME, getDetailedCart } from "@/lib/cart";
import { stripe, isStripeConfigured } from "@/lib/stripe";

export type CheckoutState = { error?: string };

function appUrl() {
  return (
    process.env.NEXT_PUBLIC_APP_URL ??
    (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : "http://localhost:3000")
  );
}

async function clearCartCookie() {
  const store = await cookies();
  store.delete(CART_COOKIE_NAME);
}

/**
 * Validate cart and group lines per store.
 * Throws CheckoutState-shaped error as string via returned { error }.
 */
async function loadValidatedCart() {
  const user = await currentUser();
  if (!user) return { error: "Please sign in to check out." as const, user: null };

  const { lines, subtotal } = await getDetailedCart();
  if (lines.length === 0) return { error: "Your cart is empty." as const, user: null };

  for (const line of lines) {
    if (!line.product.isPublished) {
      return { error: `"${line.product.name}" is no longer available.` as const, user: null };
    }
    if (line.qty > line.product.stock) {
      return {
        error: `Only ${line.product.stock} × "${line.product.name}" left in stock.` as const,
        user: null,
      };
    }
  }

  const byStore = new Map<string, typeof lines>();
  for (const line of lines) {
    const arr = byStore.get(line.product.store.id) ?? [];
    arr.push(line);
    byStore.set(line.product.store.id, arr);
  }

  return { user, lines, subtotal, byStore, error: undefined as string | undefined };
}

export async function createCheckoutSession(
  _prev: CheckoutState,
): Promise<CheckoutState & { url?: string }> {
  const validated = await loadValidatedCart();
  if (validated.error || !validated.user || !validated.byStore) {
    return { error: validated.error ?? "Unable to check out." };
  }
  const { user, byStore, lines } = validated;

  // --- Dev fallback: no Stripe keys -> place test order directly ---
  if (!isStripeConfigured()) {
    const sessionId = `test_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
    await db.$transaction(async (tx) => {
      for (const [storeId, storeLines] of byStore) {
        const total = storeLines.reduce((s, l) => s + l.product.price * l.qty, 0);
        await tx.order.create({
          data: {
            buyerId: user.id,
            storeId,
            status: "PAID",
            total,
            stripeSessionId: `${sessionId}_${storeId}`,
            items: {
              create: storeLines.map((l) => ({
                productId: l.product.id,
                quantity: l.qty,
                price: l.product.price,
              })),
            },
          },
        });
        for (const l of storeLines) {
          await tx.product.update({
            where: { id: l.product.id },
            data: { stock: { decrement: l.qty } },
          });
        }
      }
    });
    await clearCartCookie();
    redirect(`/checkout/success?test_order=1`);
  }

  // --- Real Stripe flow: one Checkout Session, one PENDING Order per store ---
  // Create pending orders first so the webhook can flip them to PAID.
  const createdOrders = [];
  for (const [storeId, storeLines] of byStore) {
    const total = storeLines.reduce((s, l) => s + l.product.price * l.qty, 0);
    const order = await db.order.create({
      data: {
        buyerId: user.id,
        storeId,
        status: "PENDING",
        total,
        items: {
          create: storeLines.map((l) => ({
            productId: l.product.id,
            quantity: l.qty,
            price: l.product.price,
          })),
        },
      },
    });
    createdOrders.push(order);
  }
  const orderIds = createdOrders.map((o) => o.id);

  let session;
  try {
    session = await stripe.checkout.sessions.create({
      mode: "payment",
      customer_email: user.email ?? undefined,
      line_items: lines.map((l) => ({
        price_data: {
          currency: "usd",
          product_data: {
            name: `${l.product.name} (${l.product.store.name})`,
          },
          unit_amount: l.product.price,
        },
        quantity: l.qty,
      })),
      metadata: { orderIds: orderIds.join(",") },
      success_url: `${appUrl()}/checkout/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${appUrl()}/checkout/cancel`,
    });
  } catch (err) {
    // Roll back pending orders if Stripe fails
    await db.order.deleteMany({ where: { id: { in: orderIds } } });
    console.error("Stripe checkout failed", err);
    return { error: "Could not start payment. Please try again." };
  }

  // Link all orders to this session (non-unique by design for multi-vendor).
  await db.order.updateMany({
    where: { id: { in: orderIds } },
    data: { stripeSessionId: session.id },
  });

  if (!session.url) return { error: "Could not start payment. Please try again." };
  redirect(session.url);
}
