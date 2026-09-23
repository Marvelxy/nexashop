import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { db } from "@/lib/db";
import { currentUser, formatPrice } from "@/lib/permissions";
import { OrderStatusForm } from "@/components/order-status-form";

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
    <div className="mx-auto max-w-2xl space-y-4">
      <Link href="/admin/orders" className="text-sm text-neutral-600 underline">
        ← Back to orders
      </Link>
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold">Order {order.id.slice(0, 8)}</h1>
        <span className="rounded-full bg-neutral-100 px-2 py-0.5 text-xs font-medium">
          {order.status}
        </span>
      </div>

      <div className="rounded border p-4 text-sm">
        <p>
          Buyer: <span className="font-medium">{order.buyer.name ?? order.buyer.email}</span>{" "}
          <span className="text-neutral-500">({order.buyer.email})</span>
        </p>
        <p>
          Store: <span className="font-medium">{order.store.name}</span>
        </p>
        <p className="text-neutral-600">
          Placed{" "}
          {order.createdAt.toLocaleDateString("en-US", {
            year: "numeric",
            month: "long",
            day: "numeric",
          })}
        </p>
      </div>

      <ul className="divide-y rounded border">
        {order.items.map((item) => (
          <li key={item.id} className="flex items-center justify-between gap-4 p-3 text-sm">
            <div>
              <p className="font-medium">{item.product.name}</p>
              <p className="text-neutral-500">
                {formatPrice(item.price)} × {item.quantity}
              </p>
            </div>
            <p className="font-medium">{formatPrice(item.price * item.quantity)}</p>
          </li>
        ))}
      </ul>

      <div className="flex items-center justify-between rounded border p-4">
        <p className="font-medium">Total</p>
        <p className="text-lg font-bold">{formatPrice(order.total)}</p>
      </div>

      <div className="rounded border p-4">
        <h2 className="mb-2 text-sm font-medium">Manage order</h2>
        <OrderStatusForm orderId={order.id} current={order.status} />
        <p className="mt-2 text-xs text-neutral-500">
          Cancelling or refunding a paid order restores stock. Marking a pending
          order paid deducts stock (blocked if insufficient).
        </p>
      </div>
    </div>
  );
}
