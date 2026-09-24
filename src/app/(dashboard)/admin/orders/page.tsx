import { redirect } from "next/navigation";
import Link from "next/link";
import { db } from "@/lib/db";
import { currentUser, formatPrice } from "@/lib/permissions";
import { EmptyState, OrderStatusBadge, PageHeader, Stat, Tabs } from "@/components/dashboard-ui";

const STATUSES = [
  "PENDING",
  "PAID",
  "SHIPPED",
  "DELIVERED",
  "CANCELLED",
  "REFUNDED",
] as const;

type Props = {
  searchParams: Promise<{ status?: string }>;
};

export default async function AdminOrdersPage({ searchParams }: Props) {
  const user = await currentUser();
  if (!user) redirect("/login?callbackUrl=/admin/orders");
  if (user.role !== "ADMIN") redirect("/login?callbackUrl=/admin/orders");

  const { status } = await searchParams;
  const activeStatus = STATUSES.includes(status as (typeof STATUSES)[number])
    ? status!
    : undefined;

  const [orders, total] = await Promise.all([
    db.order.findMany({
      where: activeStatus ? { status: activeStatus as (typeof STATUSES)[number] } : undefined,
      include: {
        buyer: { select: { email: true, name: true } },
        store: { select: { name: true } },
        _count: { select: { items: true } },
      },
      orderBy: { createdAt: "desc" },
      take: 100,
    }),
    db.order.count(),
  ]);

  const revenue = await db.order.aggregate({
    _sum: { total: true },
    where: { status: { in: ["PAID", "SHIPPED", "DELIVERED"] } },
  });

  return (
    <div className="space-y-6">
      <PageHeader eyebrow="Admin" title="Orders" subtitle={`${total} total orders`} />
      <Tabs
        items={[
          { href: "/admin/stores", label: "Stores" },
          { href: "/admin/products", label: "Products" },
          { href: "/admin/orders", label: "Orders", active: true },
        ]}
      />
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-3">
        <Stat label="Total" value={String(total)} sub="All time" />
        <Stat label="Revenue" value={formatPrice(revenue._sum.total ?? 0)} sub="Paid + shipped + delivered" />
        <Stat label="Showing" value={String(orders.length)} sub={activeStatus ?? "All statuses"} />
      </div>

      <div className="flex flex-wrap gap-2 text-xs font-medium">
        <Link
          href="/admin/orders"
          className={`rounded-full border px-3.5 py-1.5 transition ${!activeStatus ? "border-neutral-900 bg-neutral-900 text-white" : "border-neutral-200 bg-white hover:border-neutral-400"}`}
        >
          All
        </Link>
        {STATUSES.map((s) => (
          <Link
            key={s}
            href={`/admin/orders?status=${s}`}
            className={`rounded-full border px-3.5 py-1.5 transition ${activeStatus === s ? "border-neutral-900 bg-neutral-900 text-white" : "border-neutral-200 bg-white hover:border-neutral-400"}`}
          >
            {s}
          </Link>
        ))}
      </div>

      {orders.length === 0 ? (
        <EmptyState icon="🧾" title="No orders" text={activeStatus ? `No orders with status ${activeStatus} yet.` : "Orders will show up here."} />
      ) : (
        <ul className="divide-y divide-neutral-100 rounded-2xl border border-neutral-200 bg-white">
          {orders.map((o) => (
            <li key={o.id} className="flex flex-wrap items-center justify-between gap-3 p-4">
              <div className="min-w-0">
                <Link href={`/admin/orders/${o.id}`} className="font-semibold hover:underline">
                  #{o.id.slice(0, 8)} · {o.store.name}
                </Link>
                <p className="truncate text-xs text-neutral-500">
                  {o.buyer.name ?? o.buyer.email} · {o._count.items} items ·{" "}
                  {o.createdAt.toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" })}
                </p>
              </div>
              <div className="flex items-center gap-3">
                <OrderStatusBadge status={o.status} />
                <span className="font-bold">{formatPrice(o.total)}</span>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
