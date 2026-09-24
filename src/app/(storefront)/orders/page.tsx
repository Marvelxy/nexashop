import Link from "next/link";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { currentUser, formatPrice } from "@/lib/permissions";
import { EmptyState, OrderStatusBadge, PageHeader, Stat } from "@/components/dashboard-ui";

export default async function BuyerOrdersPage() {
  const user = await currentUser();
  if (!user) redirect("/login?callbackUrl=/orders");

  const orders = await db.order.findMany({
    where: { buyerId: user.id },
    include: {
      store: true,
      items: { include: { product: true } },
    },
    orderBy: { createdAt: "desc" },
    take: 50,
  });

  if (orders.length === 0) {
    return (
      <div className="mx-auto max-w-2xl space-y-6">
        <PageHeader eyebrow="Orders" title="Your orders" subtitle="Track purchases and reorder favorites." />
        <EmptyState
          icon="📦"
          title="No orders yet"
          text="You haven't placed any orders. Start with new arrivals."
          action={
            <Link href="/" className="rounded-full bg-neutral-900 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-neutral-700">
              Start shopping
            </Link>
          }
        />
      </div>
    );
  }

  const totalSpent = orders
    .filter((o) => o.status !== "CANCELLED" && o.status !== "REFUNDED")
    .reduce((s, o) => s + o.total, 0);
  const active = orders.filter((o) => o.status === "PENDING" || o.status === "PAID" || o.status === "SHIPPED").length;

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <PageHeader
        eyebrow="Orders"
        title={`Your orders (${orders.length})`}
        subtitle="Every purchase is covered by buyer protection."
      />
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        <Stat label="Orders" value={String(orders.length)} sub="Last 50" />
        <Stat label="Total spent" value={formatPrice(totalSpent)} sub="Excl. cancelled" />
        <Stat label="In transit" value={String(active)} sub="Pending → shipped" />
      </div>
      <ul className="space-y-3">
        {orders.map((o) => (
          <li key={o.id} className="rounded-2xl border border-neutral-200 bg-white p-5 transition hover:shadow-lg hover:shadow-neutral-900/5">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <Link href={`/orders/${o.id}`} className="font-bold hover:underline">
                #{o.id.slice(0, 8)} · {o.store.name}
              </Link>
              <OrderStatusBadge status={o.status} />
            </div>
            <p className="mt-1 text-xs text-neutral-500">
              {o.createdAt.toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" })} · {o.items.reduce((s, i) => s + i.quantity, 0)} items
            </p>
            <ul className="mt-3 space-y-1.5 rounded-xl bg-neutral-50 p-3 text-sm text-neutral-600">
              {o.items.slice(0, 3).map((item) => (
                <li key={item.id} className="flex justify-between gap-4">
                  <span className="truncate">{item.product.name} × {item.quantity}</span>
                  <span className="shrink-0 font-medium text-neutral-900">{formatPrice(item.price * item.quantity)}</span>
                </li>
              ))}
              {o.items.length > 3 && (
                <li className="text-xs text-neutral-500">+{o.items.length - 3} more items</li>
              )}
            </ul>
            <div className="mt-3 flex items-center justify-between">
              <Link href={`/orders/${o.id}`} className="rounded-full border border-neutral-200 px-4 py-1.5 text-xs font-medium transition hover:border-neutral-900">
                View details →
              </Link>
              <p className="text-lg font-extrabold">{formatPrice(o.total)}</p>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
