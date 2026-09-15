import { stripe } from "@/lib/stripe";
import { db } from "@/lib/db";

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
    const session = event.data.object as { id: string };
    const order = await db.order.findUnique({
      where: { stripeSessionId: session.id },
      include: { items: true },
    });
    if (order && order.status === "PENDING") {
      await db.$transaction([
        db.order.update({ where: { id: order.id }, data: { status: "PAID" } }),
        ...order.items.map((item) =>
          db.product.update({
            where: { id: item.productId },
            data: { stock: { decrement: item.quantity } },
          })
        ),
      ]);
    }
  }

  return Response.json({ received: true });
}
