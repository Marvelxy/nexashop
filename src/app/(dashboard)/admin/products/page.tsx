import { redirect } from "next/navigation";
import Link from "next/link";
import { db } from "@/lib/db";
import { currentUser, formatPrice } from "@/lib/permissions";
import { togglePublish } from "@/actions/product";
import { EmptyState, LiveBadge, PageHeader, Stat, Tabs } from "@/components/dashboard-ui";

export default async function AdminProductsPage() {
  const user = await currentUser();
  if (!user) redirect("/login?callbackUrl=/admin/products");
  if (user.role !== "ADMIN") redirect("/login?callbackUrl=/admin/products");

  const products = await db.product.findMany({
    include: { store: { select: { name: true } } },
    orderBy: { createdAt: "desc" },
  });

  const live = products.filter((p) => p.isPublished).length;

  return (
    <div className="space-y-6">
      <PageHeader eyebrow="Admin" title="Products" subtitle={`${products.length} total · ${live} live`} />
      <Tabs
        items={[
          { href: "/admin/stores", label: "Stores" },
          { href: "/admin/products", label: "Products", active: true },
          { href: "/admin/orders", label: "Orders" },
        ]}
      />
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-3">
        <Stat label="Products" value={String(products.length)} />
        <Stat label="Live" value={String(live)} sub="Visible to buyers" />
        <Stat label="Drafts" value={String(products.length - live)} sub="Hidden" />
      </div>
      {products.length === 0 ? (
        <EmptyState icon="📦" title="No products yet" text="Products appear here once sellers list them." />
      ) : (
        <ul className="divide-y divide-neutral-100 rounded-2xl border border-neutral-200 bg-white">
          {products.map((p) => (
            <li key={p.id} className="flex flex-wrap items-center justify-between gap-3 p-4">
              <div className="min-w-0">
                <p className="truncate font-semibold">{p.name}</p>
                <p className="text-xs text-neutral-500">{p.store.name} · {formatPrice(p.price)} · {p.stock} in stock</p>
              </div>
              <div className="flex items-center gap-2">
                <LiveBadge live={p.isPublished} />
                <Link href={`/seller/products/${p.id}/edit`} className="rounded-full border border-neutral-200 px-3.5 py-1.5 text-xs font-medium transition hover:border-neutral-900">
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
                        ? "rounded-full border border-neutral-200 px-3.5 py-1.5 text-xs font-medium transition hover:border-neutral-900"
                        : "rounded-full bg-emerald-600 px-3.5 py-1.5 text-xs font-semibold text-white transition hover:bg-emerald-500"
                    }
                  >
                    {p.isPublished ? "Unpublish" : "Publish"}
                  </button>
                </form>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
