import { stripe } from "@/lib/stripe";
import { db } from "@/lib/db";

async function markOrdersPaid(sessionId: string, orderIdsFromMetadata: string[]) {
  // Prefer metadata orderIds (works even if stripeSessionId linking failed),
  // fall back to lookup by stripeSessionId.
  let orders = [];
  if (orderIdsFromMetadata.length > 0) {
    orders = await db.order.findMany({
      where: { id: { in: orderIdsFromMetadata } },
      include: { items: true },
    });
  } else {
    orders = await db.order.findMany({
      where: { stripeSessionId: sessionId },
      include: { items: true },
    });
  }

  for (const order of orders) {
    if (order.status !== "PENDING") continue;
    await db.$transaction([
      db.order.update({ where: { id: order.id }, data: { status: "PAID" } }),
      ...order.items.map((item) =>
        db.product.update({
          where: { id: item.productId },
          data: { stock: { decrement: item.quantity } },
        }),
      ),
    ]);
  }
}

export async function POST(req: Request) {
  const sig = req.headers.get("stripe-signature");
  const secret = process.env.STRIPE_WEBHOOK_SECRET;

  if (!sig || !secret) return new Response("Missing webhook config", { status: 400 });

  const rawBody = await req.text();

  let event;
  try {
    event = stripe.webhooks.constructEvent(rawBody, sig, secret);
  } catch {
    return new Response("Invalid signature", { status: 400 });
  }

  if (event.type === "checkout.session.completed") {
    const session = event.data.object as {
      id: string;
      metadata?: { orderIds?: string };
    };
    const orderIds = (session.metadata?.orderIds ?? "")
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);
    await markOrdersPaid(session.id, orderIds);
  }

  return Response.json({ received: true });
}
