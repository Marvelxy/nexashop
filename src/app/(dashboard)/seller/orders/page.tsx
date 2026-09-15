import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { currentUser } from "@/lib/permissions";
import { formatPrice } from "@/lib/permissions";

export default async function SellerOrdersPage() {
  const user = await currentUser();
  if (!user) redirect("/login?callbackUrl=/seller/orders");
  if (user.role !== "SELLER" && user.role !== "ADMIN") redirect("/become-seller");

  const store = await db.store.findUnique({ where: { ownerId: user.id } });
  if (!store) {
    return (
      <div className="space-y-4">
        <h1 className="text-xl font-bold">Orders</h1>
        <p className="text-sm text-neutral-500">
          Create a store at{" "}
          <a href="/seller/products" className="underline">
            /seller/products
          </a>{" "}
          to start receiving orders.
        </p>
      </div>
    );
  }

  const orders = await db.order.findMany({
    where: { storeId: store.id },
    include: { items: { include: { product: true } } },
    orderBy: { createdAt: "desc" },
    take: 50,
  });

  return (
    <div className="space-y-4">
      <h1 className="text-xl font-bold">Orders</h1>
      {orders.map((o) => (
        <div key={o.id} className="border rounded p-3 text-sm">
          <div className="flex justify-between">
            <span>{o.id.slice(0, 8)}</span>
            <span>{o.status}</span>
            <span>{formatPrice(o.total)}</span>
          </div>
        </div>
      ))}
      {orders.length === 0 && <p className="text-sm">No orders yet.</p>}
    </div>
  );
}