import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { db } from "@/lib/db";
import { currentUser, formatPrice } from "@/lib/permissions";
import { OrderStatusBadge } from "@/components/dashboard-ui";

type Props = { params: Promise<{ id: string }> };

export default async function BuyerOrderDetailPage({ params }: Props) {
  const { id } = await params;
  const user = await currentUser();
  if (!user) redirect(`/login?callbackUrl=/orders/${id}`);

  const order = await db.order.findUnique({
    where: { id },
    include: {
      store: true,
      items: { include: { product: true } },
    },
  });

  if (!order || order.buyerId !== user.id) notFound();

  return (
    <div className="mx-auto max-w-2xl space-y-5">
      <Link href="/orders" className="inline-block rounded-full border border-neutral-200 bg-white px-4 py-1.5 text-sm font-medium transition hover:border-neutral-900">
        ← Back to orders
      </Link>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-extrabold tracking-tight">Order #{order.id.slice(0, 8)}</h1>
        <OrderStatusBadge status={order.status} />
      </div>

      <div className="rounded-2xl border border-neutral-200 bg-white p-5 text-sm">
        <p className="text-neutral-600">
          Sold by <span className="font-semibold text-neutral-900">{order.store.name}</span>
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
              <Link href={`/products/${item.product.slug}`} className="font-semibold hover:underline">
                {item.product.name}
              </Link>
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
    </div>
  );
}
