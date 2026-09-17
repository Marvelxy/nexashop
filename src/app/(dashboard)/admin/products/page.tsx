import { redirect } from "next/navigation";
import Link from "next/link";
import { db } from "@/lib/db";
import { currentUser } from "@/lib/permissions";
import { togglePublish } from "@/actions/product";

export default async function AdminProductsPage() {
  const user = await currentUser();
  if (!user) redirect("/login?callbackUrl=/admin/products");
  if (user.role !== "ADMIN") redirect("/login?callbackUrl=/admin/products");

  const products = await db.product.findMany({
    include: { store: { select: { name: true } } },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold">Products</h1>
        <Link href="/admin/stores" className="text-sm underline">
          Manage stores
        </Link>
      </div>

      {products.length === 0 && <p className="text-sm text-neutral-500">No products yet.</p>}

      <ul className="divide-y border rounded">
        {products.map((p) => (
          <li key={p.id} className="p-3 flex justify-between items-center gap-4 text-sm">
            <div>
              <p className="font-medium">{p.name}</p>
              <p className="text-neutral-600">{p.store.name}</p>
            </div>
            <div className="flex items-center gap-3">
              <span>{p.isPublished ? "Live" : "Draft"}</span>
              <Link
                href={`/seller/products/${p.id}/edit`}
                className="rounded border border-neutral-300 px-3 py-1 text-xs"
              >
                Edit
              </Link>
              <form action={async (formData) => {
                "use server";
                await togglePublish(formData.get("id") as string);
              }}>
                <input type="hidden" name="id" value={p.id} />
                <button
                  type="submit"
                  className={
                    p.isPublished
                      ? "rounded border border-neutral-300 px-3 py-1 text-xs"
                      : "rounded bg-green-600 px-3 py-1 text-xs text-white"
                  }
                >
                  {p.isPublished ? "Unpublish" : "Publish"}
                </button>
              </form>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}