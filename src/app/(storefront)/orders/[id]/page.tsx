import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { db } from "@/lib/db";
import { currentUser, formatPrice } from "@/lib/permissions";

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
    <div className="mx-auto max-w-2xl space-y-4">
      <Link href="/orders" className="text-sm text-neutral-600 underline">
        ← Back to orders
      </Link>
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold">Order {order.id.slice(0, 8)}</h1>
        <span className="rounded-full bg-neutral-100 px-2 py-0.5 text-xs font-medium">
          {order.status}
        </span>
      </div>

      <div className="rounded border p-4 text-sm">
        <p className="text-neutral-600">
          Sold by <span className="font-medium text-neutral-900">{order.store.name}</span>
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
          <li key={item.id} className="flex items-center justify-between gap-4 p-4 text-sm">
            <div>
              <Link
                href={`/products/${item.product.slug}`}
                className="font-medium hover:underline"
              >
                {item.product.name}
              </Link>
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
    </div>
  );
}
