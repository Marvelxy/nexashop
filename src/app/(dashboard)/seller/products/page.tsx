import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { currentUser } from "@/lib/permissions";
import { createStore } from "@/actions/store";

export default async function SellerProductsPage() {
  const user = await currentUser();
  if (!user) redirect("/login?callbackUrl=/seller/products");
  if (user.role !== "SELLER" && user.role !== "ADMIN") redirect("/become-seller");

  const store = await db.store.findUnique({
    where: { ownerId: user.id },
    include: { products: { orderBy: { createdAt: "desc" } } },
  });

  if (!store) {
    return (
      <div className="mx-auto max-w-lg space-y-6">
        <h1 className="text-xl font-bold">Set up your store</h1>
        <p className="text-sm text-neutral-600">Create your store to start listing products.</p>
        <form action={createStore} className="space-y-3 rounded border p-4">
          <label className="block text-sm">
            Store name
            <input
              name="name"
              type="text"
              required
              minLength={3}
              maxLength={60}
              className="mt-1 w-full rounded border px-3 py-2"
            />
          </label>
          <label className="block text-sm">
            Description
            <textarea
              name="description"
              rows={3}
              maxLength={300}
              className="mt-1 w-full rounded border px-3 py-2"
            />
          </label>
          <button type="submit" className="w-full rounded bg-neutral-900 py-2 text-white">
            Create store
          </button>
        </form>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <h1 className="text-xl font-bold">{store.name} — Products</h1>

      {!store.isApproved && (
        <p className="rounded border border-amber-300 bg-amber-50 p-3 text-sm text-amber-800">
          Your store is pending admin approval and won&apos;t appear on the
          marketplace yet.
        </p>
      )}

      <ul className="divide-y border rounded">
        {store.products.map((p) => (
          <li key={p.id} className="p-3 flex justify-between text-sm">
            <span>{p.name}</span>
            <span>{p.isPublished ? "Live" : "Draft"} — {p.stock} in stock</span>
          </li>
        ))}
        {store.products.length === 0 && (
          <li className="p-3 text-sm text-neutral-500">No products yet.</li>
        )}
      </ul>
    </div>
  );
}