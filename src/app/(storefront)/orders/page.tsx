import Link from "next/link";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { currentUser, formatPrice } from "@/lib/permissions";

function StatusBadge({ status }: { status: string }) {
  const styles: Record<string, string> = {
    PENDING: "bg-amber-100 text-amber-800",
    PAID: "bg-green-100 text-green-800",
    SHIPPED: "bg-blue-100 text-blue-800",
    DELIVERED: "bg-neutral-900 text-white",
    CANCELLED: "bg-neutral-100 text-neutral-500",
    REFUNDED: "bg-purple-100 text-purple-800",
  };
  return (
    <span
      className={`rounded-full px-2 py-0.5 text-xs font-medium ${styles[status] ?? "bg-neutral-100 text-neutral-600"}`}
    >
      {status}
    </span>
  );
}

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
      <div className="mx-auto max-w-2xl space-y-4">
        <h1 className="text-xl font-bold">Your orders</h1>
        <p className="text-sm text-neutral-600">
          You haven&apos;t placed any orders yet.{" "}
          <Link href="/" className="underline">
            Start shopping
          </Link>
        </p>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl space-y-4">
      <h1 className="text-xl font-bold">Your orders ({orders.length})</h1>
      <ul className="space-y-3">
        {orders.map((o) => (
          <li key={o.id} className="rounded border p-4 text-sm">
            <div className="flex items-center justify-between gap-2">
              <Link
                href={`/orders/${o.id}`}
                className="font-medium hover:underline"
              >
                Order {o.id.slice(0, 8)} · {o.store.name}
              </Link>
              <StatusBadge status={o.status} />
            </div>
            <p className="mt-1 text-xs text-neutral-500">
              {o.createdAt.toLocaleDateString("en-US", {
                year: "numeric",
                month: "short",
                day: "numeric",
              })}{" "}
              · {o.items.reduce((s, i) => s + i.quantity, 0)} items
            </p>
            <ul className="mt-2 space-y-1 text-neutral-600">
              {o.items.slice(0, 3).map((item) => (
                <li key={item.id} className="flex justify-between">
                  <span>
                    {item.product.name} × {item.quantity}
                  </span>
                  <span>{formatPrice(item.price * item.quantity)}</span>
                </li>
              ))}
              {o.items.length > 3 && (
                <li className="text-xs text-neutral-500">
                  +{o.items.length - 3} more items
                </li>
              )}
            </ul>
            <div className="mt-2 flex items-center justify-between">
              <Link
                href={`/orders/${o.id}`}
                className="text-xs text-neutral-600 underline"
              >
                View details
              </Link>
              <p className="font-medium">{formatPrice(o.total)}</p>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
