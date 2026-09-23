import { db } from "@/lib/db";
import { ProductCard } from "@/components/product-card";
import { ProductFilter } from "@/components/product-filter";
import { currentUser } from "@/lib/permissions";

export default async function HomePage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; cat?: string; sort?: string }>;
}) {
  const { q = "", cat = "", sort = "new" } = await searchParams;
  const user = await currentUser();

  const categories = await db.category.findMany({ orderBy: { name: "asc" } });

  const products = await db.product.findMany({
    where: {
      isPublished: true,
      store: { isApproved: true },
      ...(q ? { name: { contains: q } } : {}),
      ...(cat ? { category: { slug: cat } } : {}),
    },
    include: { store: true, category: true },
    orderBy:
      sort === "price-asc"
        ? { price: "asc" }
        : sort === "price-desc"
          ? { price: "desc" }
          : { createdAt: "desc" },
    take: 24,
  });

  const filtering = Boolean(q || cat || sort !== "new");

  return (
    <div className="space-y-6">
      {/**
        <section>
          <h1 className="text-3xl font-bold">Multi-vendor marketplace</h1>
          <p className="text-neutral-600">Week 1: catalog + auth. Week 2: cart + Stripe.</p>
        </section>
      */}
      <ProductFilter q={q} cat={cat} sort={sort} categories={categories} />
      {filtering && (
        <p className="text-sm text-neutral-500">
          {products.length} result{products.length === 1 ? "" : "s"}
          {q ? ` for “${q}”` : ""}
        </p>
      )}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {products.map((p) => (
          <ProductCard
            key={p.id}
            product={p}
            canEdit={
              user?.role === "ADMIN" ||
              (user?.role === "SELLER" && p.store.ownerId === user.id)
            }
          />
        ))}
        {products.length === 0 && (
          <p className="text-sm text-neutral-500">
            {filtering ? (
              <>No products match your filters.</>
            ) : (
              <>
                No products yet. Run <code>npm run db:seed</code>.
              </>
            )}
          </p>
        )}
      </div>
    </div>
  );
}
