import { redirect } from "next/navigation";
import Link from "next/link";
import { db } from "@/lib/db";
import { currentUser, formatPrice } from "@/lib/permissions";
import { createStore } from "@/actions/store";
import { togglePublish } from "@/actions/product";
import { EmptyState, LiveBadge, PageHeader, Stat, Tabs } from "@/components/dashboard-ui";

function firstImage(images: unknown): string | undefined {
  return Array.isArray(images) ? (images[0] as string | undefined) : undefined;
}

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
      <div className="mx-auto max-w-lg space-y-6 py-6">
        <PageHeader
          eyebrow="Seller"
          title="Set up your store"
          subtitle="Create your store to start listing products on the marketplace."
        />
        <form action={createStore} className="space-y-4 rounded-3xl border border-neutral-200 bg-white p-6 shadow-sm">
          <label className="block text-sm font-medium">
            Store name
            <input
              name="name"
              type="text"
              required
              minLength={3}
              maxLength={60}
              placeholder="Acme Goods"
              className="mt-1.5 w-full rounded-xl border border-neutral-200 bg-neutral-50 px-3 py-2.5 font-normal focus:border-neutral-900 focus:bg-white focus:outline-none"
            />
          </label>
          <label className="block text-sm font-medium">
            Description
            <textarea
              name="description"
              rows={3}
              maxLength={300}
              placeholder="What do you sell?"
              className="mt-1.5 w-full rounded-xl border border-neutral-200 bg-neutral-50 px-3 py-2.5 font-normal focus:border-neutral-900 focus:bg-white focus:outline-none"
            />
          </label>
          <button type="submit" className="w-full rounded-full bg-neutral-900 py-2.5 text-sm font-semibold text-white transition hover:bg-neutral-700">
            Create store
          </button>
        </form>
      </div>
    );
  }

  const live = store.products.filter((p) => p.isPublished).length;
  const drafts = store.products.length - live;
  const units = store.products.reduce((s, p) => s + p.stock, 0);
  const inventoryValue = store.products.reduce((s, p) => s + p.price * p.stock, 0);

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Seller dashboard"
        title={store.name}
        subtitle={store.isApproved ? "Manage your catalog, stock and visibility." : "Your store is under review."}
        actions={
          <>
            <Link href="/seller/orders" className="rounded-full border border-neutral-200 bg-white px-4 py-2 text-sm font-medium transition hover:border-neutral-900">
              Orders
            </Link>
            <Link href="/seller/products/new" className="rounded-full bg-neutral-900 px-4 py-2 text-sm font-semibold text-white transition hover:bg-neutral-700">
              + Add product
            </Link>
          </>
        }
      />

      <Tabs
        items={[
          { href: "/seller/products", label: "Products", active: true },
          { href: "/seller/orders", label: "Orders" },
        ]}
      />

      {!store.isApproved && (
        <p className="rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
          <span className="font-semibold">Pending approval.</span> Your store won&apos;t appear on the marketplace until an admin approves it.
        </p>
      )}

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Stat label="Products" value={String(store.products.length)} sub={`${live} live · ${drafts} drafts`} />
        <Stat label="Live" value={String(live)} sub="Visible on marketplace" />
        <Stat label="Units in stock" value={String(units)} sub="Across all products" />
        <Stat label="Inventory value" value={formatPrice(inventoryValue)} sub="Retail value" />
      </div>

      {store.products.length === 0 ? (
        <EmptyState
          icon="📦"
          title="No products yet"
          text="Add your first product to start selling. It takes less than a minute."
          action={
            <Link href="/seller/products/new" className="rounded-full bg-neutral-900 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-neutral-700">
              Add product
            </Link>
          }
        />
      ) : (
        <ul className="grid gap-3 sm:grid-cols-2">
          {store.products.map((p) => {
            const image = firstImage(p.images);
            return (
              <li key={p.id} className="flex gap-4 rounded-2xl border border-neutral-200 bg-white p-4 transition hover:shadow-lg hover:shadow-neutral-900/5">
                <Link href={`/seller/products/${p.id}/edit`} className="h-20 w-20 shrink-0 overflow-hidden rounded-xl bg-gradient-to-br from-neutral-100 to-neutral-200">
                  {image ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={image} alt={p.name} className="h-full w-full object-cover" />
                  ) : (
                    <span className="flex h-full w-full items-center justify-center text-2xl">🛍️</span>
                  )}
                </Link>
                <div className="min-w-0 flex-1">
                  <div className="flex items-start justify-between gap-2">
                    <p className="truncate font-semibold">{p.name}</p>
                    <LiveBadge live={p.isPublished} />
                  </div>
                  <p className="mt-0.5 text-sm text-neutral-500">
                    {formatPrice(p.price)} · {p.stock} in stock
                  </p>
                  <div className="mt-2.5 flex flex-wrap gap-2">
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
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
