import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { currentUser } from "@/lib/permissions";
import { approveStore, removeStore } from "@/actions/admin";
import { EmptyState, PageHeader, Stat, Tabs } from "@/components/dashboard-ui";

export default async function AdminStoresPage() {
  const user = await currentUser();
  if (!user) redirect("/login?callbackUrl=/admin/stores");
  if (user.role !== "ADMIN") redirect("/login?callbackUrl=/admin/stores");

  const stores = await db.store.findMany({
    include: { owner: true, _count: { select: { products: true, orders: true } } },
    orderBy: { createdAt: "desc" },
  });

  const pending = stores.filter((s) => !s.isApproved).length;

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Admin"
        title="Stores"
        subtitle={`${stores.length} total · ${pending} pending approval`}
      />
      <Tabs
        items={[
          { href: "/admin/stores", label: "Stores", active: true },
          { href: "/admin/products", label: "Products" },
          { href: "/admin/orders", label: "Orders" },
        ]}
      />
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-3">
        <Stat label="Total stores" value={String(stores.length)} />
        <Stat label="Pending" value={String(pending)} sub="Needs review" />
        <Stat label="Approved" value={String(stores.length - pending)} sub="Live on marketplace" />
      </div>
      {stores.length === 0 ? (
        <EmptyState icon="🏪" title="No stores yet" text="Stores appear here once sellers sign up." />
      ) : (
        <ul className="space-y-3">
          {stores.map((s) => (
            <li key={s.id} className="rounded-2xl border border-neutral-200 bg-white p-4">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="flex items-center gap-3">
                  <span aria-hidden className="flex h-10 w-10 items-center justify-center rounded-xl bg-neutral-900 text-sm font-extrabold text-white">
                    {(s.name[0] ?? "S").toUpperCase()}
                  </span>
                  <div>
                    <p className="font-semibold">{s.name}</p>
                    <p className="text-xs text-neutral-500">
                      {s.owner.name ?? s.owner.email} · {s._count.products} products · {s._count.orders} orders
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {s.isApproved ? (
                    <span className="rounded-full bg-emerald-100 px-2.5 py-1 text-xs font-semibold text-emerald-800">Approved</span>
                  ) : (
                    <span className="rounded-full bg-amber-100 px-2.5 py-1 text-xs font-semibold text-amber-800">Pending</span>
                  )}
                  {!s.isApproved && (
                    <form action={async (formData) => {
                      "use server";
                      await approveStore(formData.get("id") as string);
                    }}>
                      <input type="hidden" name="id" value={s.id} />
                      <button type="submit" className="rounded-full bg-emerald-600 px-4 py-1.5 text-xs font-semibold text-white transition hover:bg-emerald-500">
                        Approve
                      </button>
                    </form>
                  )}
                  <form action={async (formData) => {
                    "use server";
                    await removeStore(formData.get("id") as string);
                  }}>
                    <input type="hidden" name="id" value={s.id} />
                    <button type="submit" className="rounded-full border border-red-200 px-4 py-1.5 text-xs font-medium text-red-600 transition hover:bg-red-50">
                      Remove
                    </button>
                  </form>
                </div>
              </div>
              {s.description && <p className="mt-2 text-sm text-neutral-600">{s.description}</p>}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
