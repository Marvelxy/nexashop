import Link from "next/link";
import { cookies } from "next/headers";
import { db } from "@/lib/db";
import { currentUser, formatPrice } from "@/lib/permissions";
import { CART_COOKIE_NAME } from "@/lib/cart";
import { OrderStatusBadge } from "@/components/dashboard-ui";

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

  const itemCount = orders.reduce((s, o) => s + o.items.reduce((n, i) => n + i.quantity, 0), 0);
  const totalPaid = orders.reduce((s, o) => s + o.total, 0);

  return (
    <div className="mx-auto max-w-2xl space-y-6 py-4">
      {/* Success hero */}
      <section className="relative overflow-hidden rounded-3xl bg-neutral-950 p-8 text-center text-white sm:p-10">
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 bg-[radial-gradient(30rem_16rem_at_50%_-20%,#3b3b3b,transparent),radial-gradient(24rem_14rem_at_50%_120%,#262626,transparent)]"
        />
        <div className="relative space-y-3">
          <p aria-hidden className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-emerald-500 text-2xl font-bold">
            ✓
          </p>
          <p className="text-xs font-semibold uppercase tracking-widest text-neutral-400">
            Payment successful
          </p>
          <h1 className="text-3xl font-extrabold tracking-tight">
            Thank you{user?.name ? `, ${user.name.split(" ")[0]}` : ""}!
          </h1>
          <p className="mx-auto max-w-md text-sm text-neutral-300">
            {params.test_order ? (
              <>Test order placed (Stripe not configured). Stock was decremented and your cart was cleared.</>
            ) : (
              <>Your payment went through. The Stripe webhook will mark your order(s) as PAID — your cart is cleared.</>
            )}
          </p>
          {orders.length > 0 && (
            <dl className="mx-auto flex max-w-sm justify-center gap-8 pt-2 text-sm">
              <div>
                <dt className="text-neutral-400">Orders</dt>
                <dd className="text-xl font-bold">{orders.length}</dd>
              </div>
              <div>
                <dt className="text-neutral-400">Items</dt>
                <dd className="text-xl font-bold">{itemCount}</dd>
              </div>
              <div>
                <dt className="text-neutral-400">Total</dt>
                <dd className="text-xl font-bold">{formatPrice(totalPaid)}</dd>
              </div>
            </dl>
          )}
        </div>
      </section>

      {/* What happens next */}
      <ol className="grid gap-3 text-sm sm:grid-cols-3">
        {[
          { icon: "📧", title: "Confirmation", text: "Receipt sent to your email." },
          { icon: "📦", title: "Sellers pack", text: "Sellers prepare your items." },
          { icon: "🚚", title: "Track delivery", text: "Follow status in Orders." },
        ].map((s) => (
          <li key={s.title} className="rounded-2xl border border-neutral-200 bg-white p-4">
            <p className="text-xl">{s.icon}</p>
            <p className="mt-1.5 font-semibold">{s.title}</p>
            <p className="mt-0.5 text-xs text-neutral-500">{s.text}</p>
          </li>
        ))}
      </ol>

      {orders.length > 0 && (
        <div className="space-y-3">
          <h2 className="text-lg font-bold tracking-tight">Your orders</h2>
          {orders.map((o) => (
            <div key={o.id} className="rounded-2xl border border-neutral-200 bg-white p-5">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <p className="font-bold">
                  #{o.id.slice(0, 8)} · {o.store.name}
                </p>
                <OrderStatusBadge status={o.status} />
              </div>
              <ul className="mt-3 space-y-1.5 rounded-xl bg-neutral-50 p-3 text-sm text-neutral-600">
                {o.items.map((item, i) => (
                  <li key={i} className="flex justify-between gap-4">
                    <span className="truncate">
                      {item.product.name} × {item.quantity}
                    </span>
                    <span className="shrink-0 font-medium text-neutral-900">
                      {formatPrice(item.price * item.quantity)}
                    </span>
                  </li>
                ))}
              </ul>
              <div className="mt-3 flex items-center justify-between">
                <Link href={`/orders/${o.id}`} className="rounded-full border border-neutral-200 px-4 py-1.5 text-xs font-medium transition hover:border-neutral-900">
                  View details →
                </Link>
                <p className="text-lg font-extrabold">{formatPrice(o.total)}</p>
              </div>
            </div>
          ))}
        </div>
      )}

      <div className="flex flex-col gap-2 sm:flex-row">
        <Link href="/orders" className="flex-1 rounded-full bg-neutral-900 py-3 text-center text-sm font-semibold text-white transition hover:bg-neutral-700">
          View orders →
        </Link>
        <Link href="/" className="flex-1 rounded-full border border-neutral-200 bg-white py-3 text-center text-sm font-medium transition hover:border-neutral-900">
          Continue shopping
        </Link>
      </div>
    </div>
  );
}
