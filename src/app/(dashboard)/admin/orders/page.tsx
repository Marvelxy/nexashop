import { redirect } from "next/navigation";
import Link from "next/link";
import { db } from "@/lib/db";
import { currentUser, formatPrice } from "@/lib/permissions";

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

  const orders = await db.order.findMany({
    where: activeStatus ? { status: activeStatus as (typeof STATUSES)[number] } : undefined,
    include: {
      buyer: { select: { email: true, name: true } },
      store: { select: { name: true } },
      _count: { select: { items: true } },
    },
    orderBy: { createdAt: "desc" },
    take: 100,
  });

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold">Orders</h1>
        <div className="flex gap-3 text-sm">
          <Link href="/admin/stores" className="underline">
            Stores
          </Link>
          <Link href="/admin/products" className="underline">
            Products
          </Link>
        </div>
      </div>

      <div className="flex flex-wrap gap-2 text-xs">
        <Link
          href="/admin/orders"
          className={`rounded border px-2 py-1 ${!activeStatus ? "bg-neutral-900 text-white" : ""}`}
        >
          All
        </Link>
        {STATUSES.map((s) => (
          <Link
            key={s}
            href={`/admin/orders?status=${s}`}
            className={`rounded border px-2 py-1 ${activeStatus === s ? "bg-neutral-900 text-white" : ""}`}
          >
            {s}
          </Link>
        ))}
      </div>

      {orders.length === 0 && (
        <p className="text-sm text-neutral-500">
          No orders{activeStatus ? ` with status ${activeStatus}` : ""} yet.
        </p>
      )}

      <ul className="divide-y rounded border">
        {orders.map((o) => (
          <li key={o.id} className="flex items-center justify-between gap-4 p-3 text-sm">
            <div>
              <Link href={`/admin/orders/${o.id}`} className="font-medium hover:underline">
                {o.id.slice(0, 8)} · {o.store.name}
              </Link>
              <p className="text-neutral-600">
                {o.buyer.name ?? o.buyer.email} · {o._count.items} items ·{" "}
                {o.createdAt.toLocaleDateString("en-US", {
                  year: "numeric",
                  month: "short",
                  day: "numeric",
                })}
              </p>
            </div>
            <div className="flex items-center gap-3">
              <span className="rounded-full bg-neutral-100 px-2 py-0.5 text-xs font-medium">
                {o.status}
              </span>
              <span className="font-medium">{formatPrice(o.total)}</span>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
