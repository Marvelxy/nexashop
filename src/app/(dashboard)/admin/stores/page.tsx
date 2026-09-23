import { redirect } from "next/navigation";
import Link from "next/link";
import { db } from "@/lib/db";
import { currentUser } from "@/lib/permissions";
import { approveStore, removeStore } from "@/actions/admin";

export default async function AdminStoresPage() {
  const user = await currentUser();
  if (!user) redirect("/login?callbackUrl=/admin/stores");
  if (user.role !== "ADMIN") redirect("/login?callbackUrl=/admin/stores");

  const stores = await db.store.findMany({
    include: { owner: true, _count: { select: { products: true, orders: true } } },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold">Approve stores</h1>
        <div className="flex gap-3 text-sm">
          <Link href="/admin/orders" className="underline">
            Manage orders
          </Link>
          <Link href="/admin/products" className="underline">
            Manage products
          </Link>
        </div>
      </div>
      {stores.length === 0 && <p className="text-sm text-neutral-500">No stores yet.</p>}
      {stores.map((s) => (
        <div key={s.id} className="border rounded p-3 text-sm">
          <div className="flex justify-between items-start">
            <div>
              <p className="font-medium">{s.name}</p>
              <p className="text-neutral-600">
                Owner: {s.owner.name ?? s.owner.email} · {s._count.products} products · {s._count.orders} orders
              </p>
            </div>
            <div className="flex gap-2">
              {!s.isApproved && (
                <form action={async (formData) => {
                  "use server";
                  await approveStore(formData.get("id") as string);
                }}>
                  <input type="hidden" name="id" value={s.id} />
                  <button type="submit" className="rounded bg-green-600 px-3 py-1 text-xs text-white">
                    Approve
                  </button>
                </form>
              )}
              {s.isApproved && <span className="rounded bg-green-50 px-2 py-1 text-xs text-green-700">Approved</span>}
              <form action={async (formData) => {
                "use server";
                await removeStore(formData.get("id") as string);
              }}>
                <input type="hidden" name="id" value={s.id} />
                <button type="submit" className="rounded bg-red-600 px-3 py-1 text-xs text-white">
                  Remove
                </button>
              </form>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}