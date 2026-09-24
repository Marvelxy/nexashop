import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { db } from "@/lib/db";
import { currentUser, formatPrice } from "@/lib/permissions";
import { OrderStatusForm } from "@/components/order-status-form";
import { OrderStatusBadge } from "@/components/dashboard-ui";

type Props = { params: Promise<{ id: string }> };

export default async function AdminOrderDetailPage({ params }: Props) {
  const user = await currentUser();
  if (!user) redirect("/login?callbackUrl=/admin/orders");
  if (user.role !== "ADMIN") redirect("/login?callbackUrl=/admin/orders");

  const { id } = await params;
  const order = await db.order.findUnique({
    where: { id },
    include: {
      buyer: { select: { email: true, name: true } },
      store: { select: { name: true } },
      items: { include: { product: true } },
    },
  });
  if (!order) notFound();

  return (
    <div className="mx-auto max-w-2xl space-y-5">
      <Link href="/admin/orders" className="inline-block rounded-full border border-neutral-200 bg-white px-4 py-1.5 text-sm font-medium transition hover:border-neutral-900">
        ← Back to orders
      </Link>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-extrabold tracking-tight">Order #{order.id.slice(0, 8)}</h1>
        <OrderStatusBadge status={order.status} />
      </div>

      <div className="rounded-2xl border border-neutral-200 bg-white p-5 text-sm">
        <p>
          Buyer: <span className="font-semibold">{order.buyer.name ?? order.buyer.email}</span>{" "}
          <span className="text-neutral-500">({order.buyer.email})</span>
        </p>
        <p className="mt-1">
          Store: <span className="font-semibold">{order.store.name}</span>
        </p>
        <p className="mt-1 text-neutral-500">
          Placed{" "}
          {order.createdAt.toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })}
        </p>
      </div>

      <ul className="divide-y divide-neutral-100 rounded-2xl border border-neutral-200 bg-white">
        {order.items.map((item) => (
          <li key={item.id} className="flex items-center justify-between gap-4 p-4 text-sm">
            <div>
              <p className="font-semibold">{item.product.name}</p>
              <p className="text-neutral-500">{formatPrice(item.price)} × {item.quantity}</p>
            </div>
            <p className="font-bold">{formatPrice(item.price * item.quantity)}</p>
          </li>
        ))}
      </ul>

      <div className="flex items-center justify-between rounded-2xl border border-neutral-200 bg-white p-5">
        <p className="font-semibold">Total</p>
        <p className="text-xl font-extrabold">{formatPrice(order.total)}</p>
      </div>

      <div className="rounded-2xl border border-neutral-200 bg-white p-5">
        <h2 className="font-semibold">Manage order</h2>
        <div className="mt-2">
          <OrderStatusForm orderId={order.id} current={order.status} />
        </div>
        <p className="mt-2 text-xs text-neutral-500">
          Cancelling or refunding a paid order restores stock. Marking a pending order paid deducts stock (blocked if insufficient).
        </p>
      </div>
    </div>
  );
}
