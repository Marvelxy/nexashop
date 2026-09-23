import Link from "next/link";
import { cookies } from "next/headers";
import { db } from "@/lib/db";
import { currentUser, formatPrice } from "@/lib/permissions";
import { CART_COOKIE_NAME } from "@/lib/cart";

type Props = {
  searchParams: Promise<{ session_id?: string; test_order?: string }>;
};

export default async function CheckoutSuccessPage({ searchParams }: Props) {
  const params = await searchParams;
  const user = await currentUser();

  // Cart can only be cleared server-side on a page visit (webhooks have no
  // access to the buyer's cookies), so clear it here after payment.
  const store = await cookies();
  if (store.get(CART_COOKIE_NAME)) store.delete(CART_COOKIE_NAME);

  let orders: {
    id: string;
    status: string;
    total: number;
    store: { name: string };
    items: { quantity: number; price: number; product: { name: string } }[];
  }[] = [];

  if (user) {
    if (params.session_id) {
      orders = await db.order.findMany({
        where: { stripeSessionId: params.session_id, buyerId: user.id },
        include: { store: true, items: { include: { product: true } } },
        orderBy: { createdAt: "desc" },
      });
    } else if (params.test_order) {
      orders = await db.order.findMany({
        where: { buyerId: user.id },
        include: { store: true, items: { include: { product: true } } },
        orderBy: { createdAt: "desc" },
        take: 5,
      });
    }
  }

  return (
    <div className="mx-auto max-w-2xl space-y-4">
      <h1 className="text-xl font-bold">Payment successful</h1>
      {params.test_order ? (
        <p className="text-sm text-neutral-600">
          Test order placed (Stripe not configured). Stock was decremented and
          your cart was cleared.
        </p>
      ) : (
        <p className="text-sm text-neutral-600">
          Thank you! The Stripe webhook will mark your order(s) as PAID and
          decrement stock. Your cart was cleared.
        </p>
      )}

      {orders.length > 0 && (
        <div className="space-y-3">
          {orders.map((o) => (
            <div key={o.id} className="rounded border p-4 text-sm">
              <div className="flex justify-between font-medium">
                <span>
                  Order {o.id.slice(0, 8)} · {o.store.name}
                </span>
                <span>{o.status}</span>
              </div>
              <ul className="mt-2 space-y-1 text-neutral-600">
                {o.items.map((item, i) => (
                  <li key={i} className="flex justify-between">
                    <span>
                      {item.product.name} × {item.quantity}
                    </span>
                    <span>{formatPrice(item.price * item.quantity)}</span>
                  </li>
                ))}
              </ul>
              <p className="mt-2 text-right font-medium">{formatPrice(o.total)}</p>
            </div>
          ))}
        </div>
      )}

      <div className="flex gap-2">
        <Link href="/" className="rounded border px-4 py-2 text-sm hover:bg-neutral-50">
          Continue shopping
        </Link>
        <Link
          href="/orders"
          className="rounded bg-neutral-900 px-4 py-2 text-sm text-white"
        >
          View orders
        </Link>
      </div>
    </div>
  );
}
