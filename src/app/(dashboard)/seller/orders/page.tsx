import Link from "next/link";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { currentUser } from "@/lib/permissions";
import { formatPrice } from "@/lib/permissions";
import { EmptyState, OrderStatusBadge, PageHeader, Stat, Tabs } from "@/components/dashboard-ui";

export default async function SellerOrdersPage() {
  const user = await currentUser();
  if (!user) redirect("/login?callbackUrl=/seller/orders");
  if (user.role !== "SELLER" && user.role !== "ADMIN") redirect("/become-seller");

  const store = await db.store.findUnique({ where: { ownerId: user.id } });
  if (!store) {
    return (
      <div className="space-y-6">
        <PageHeader eyebrow="Seller dashboard" title="Orders" subtitle="Orders placed for your products." />
        <EmptyState
          icon="🧾"
          title="No store yet"
          text="Create a store to start receiving orders."
          action={
            <Link href="/seller/products" className="rounded-full bg-neutral-900 px-5 py-2.5 text-sm font-semibold text-white">
              Set up store
            </Link>
          }
        />
      </div>
    );
  }

  const orders = await db.order.findMany({
    where: { storeId: store.id },
    include: { items: { include: { product: true } } },
    orderBy: { createdAt: "desc" },
    take: 50,
  });

  const revenue = orders
    .filter((o) => o.status === "PAID" || o.status === "SHIPPED" || o.status === "DELIVERED")
    .reduce((s, o) => s + o.total, 0);
  const pending = orders.filter((o) => o.status === "PENDING" || o.status === "PAID").length;

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Seller dashboard"
        title="Orders"
        subtitle={`${store.name} · ${orders.length} order${orders.length === 1 ? "" : "s"}`}
        actions={
          <Link href="/seller/products" className="rounded-full border border-neutral-200 bg-white px-4 py-2 text-sm font-medium transition hover:border-neutral-900">
            Products
          </Link>
        }
      />
      <Tabs
        items={[
          { href: "/seller/products", label: "Products" },
          { href: "/seller/orders", label: "Orders", active: true },
        ]}
      />
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-3">
        <Stat label="Orders" value={String(orders.length)} sub="Last 50" />
        <Stat label="Revenue" value={formatPrice(revenue)} sub="Paid + shipped + delivered" />
        <Stat label="Needs action" value={String(pending)} sub="Pending or paid" />
      </div>
      {orders.length === 0 ? (
        <EmptyState icon="📭" title="No orders yet" text="When buyers order your products, they will show up here." />
      ) : (
        <ul className="space-y-3">
          {orders.map((o) => (
            <li key={o.id} className="rounded-2xl border border-neutral-200 bg-white p-4">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <p className="font-semibold">#{o.id.slice(0, 8)}</p>
                <OrderStatusBadge status={o.status} />
              </div>
              <p className="mt-1 text-xs text-neutral-500">
                {o.createdAt.toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" })} · {o.items.reduce((s, i) => s + i.quantity, 0)} items
              </p>
              <ul className="mt-2 space-y-1 text-sm text-neutral-600">
                {o.items.slice(0, 3).map((item) => (
                  <li key={item.id} className="flex justify-between gap-4">
                    <span className="truncate">{item.product.name} × {item.quantity}</span>
                    <span className="shrink-0">{formatPrice(item.price * item.quantity)}</span>
                  </li>
                ))}
                {o.items.length > 3 && <li className="text-xs text-neutral-500">+{o.items.length - 3} more</li>}
              </ul>
              <div className="mt-2 flex items-center justify-between border-t border-neutral-100 pt-2">
                <span className="text-xs text-neutral-500">Fulfil from your inventory, then update status in Admin.</span>
                <p className="font-bold">{formatPrice(o.total)}</p>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
