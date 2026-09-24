import { db } from "@/lib/db";
import Link from "next/link";
import { ProductCard } from "@/components/product-card";
import { ProductFilter } from "@/components/product-filter";
import {
  CategoryShowcase,
  HomeHero,
  SellerCTA,
  ValueProps,
} from "@/components/home-sections";
import { currentUser } from "@/lib/permissions";

export default async function HomePage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; cat?: string; sort?: string }>;
}) {
  const { q = "", cat = "", sort = "new" } = await searchParams;
  const user = await currentUser();

  const [categories, productCount, storeCount, products] = await Promise.all([
    db.category.findMany({
      orderBy: { name: "asc" },
      include: {
        _count: {
          select: {
            products: {
              where: { isPublished: true, store: { isApproved: true } },
            },
          },
        },
      },
    }),
    db.product.count({
      where: { isPublished: true, store: { isApproved: true } },
    }),
    db.store.count({ where: { isApproved: true } }),
    db.product.findMany({
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
    }),
  ]);

  const filtering = Boolean(q || cat || sort !== "new");
  const newArrivals = filtering ? [] : products.slice(0, 8);
  const restProducts = filtering ? products : products.slice(8);

  return (
    <div className="space-y-8 pb-8">
      {!filtering ? (
        <>
          <HomeHero
            productCount={productCount}
            storeCount={storeCount}
            categoryCount={categories.length}
          />
          <CategoryShowcase categories={categories} activeCat={cat} />

          <section id="new-arrivals" className="space-y-4 scroll-mt-20">
            <div className="flex items-end justify-between">
              <div>
                <p className="text-xs font-semibold uppercase tracking-widest text-neutral-500">
                  Fresh drops
                </p>
                <h2 className="text-2xl font-extrabold tracking-tight">
                  New arrivals
                </h2>
              </div>
              <p className="text-sm text-neutral-500">
                {newArrivals.length > 0
                  ? `Latest ${newArrivals.length} products`
                  : "Check back soon"}
              </p>
            </div>
            {newArrivals.length > 0 ? (
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
                {newArrivals.map((p) => (
                  <ProductCard
                    key={p.id}
                    product={p}
                    canEdit={
                      user?.role === "ADMIN" ||
                      (user?.role === "SELLER" &&
                        p.store.ownerId === user.id)
                    }
                  />
                ))}
              </div>
            ) : (
              <div className="rounded-2xl border border-dashed p-8 text-center text-sm text-neutral-500">
                No products yet. Run <code>npm run db:seed</code>.
              </div>
            )}
          </section>
        </>
      ) : (
        <CategoryShowcase categories={categories} activeCat={cat} />
      )}

      <section className="space-y-4">
        <div className="flex items-end justify-between">
          <h2 className="text-lg font-bold tracking-tight">
            {filtering ? (
              <>
                {products.length} result{products.length === 1 ? "" : "s"}
                {q ? ` for “${q}”` : ""}
                {cat ? ` in ${cat}` : ""}
              </>
            ) : (
              "Explore the marketplace"
            )}
          </h2>
        </div>
        <ProductFilter q={q} cat={cat} sort={sort} categories={categories} />
        {restProducts.length > 0 || (filtering && products.length > 0) ? (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {(filtering ? products : restProducts).map((p) => (
              <ProductCard
                key={p.id}
                product={p}
                canEdit={
                  user?.role === "ADMIN" ||
                  (user?.role === "SELLER" && p.store.ownerId === user.id)
                }
              />
            ))}
          </div>
        ) : filtering ? (
          <div className="rounded-2xl border border-dashed p-8 text-center">
            <p className="font-medium">No products match your filters.</p>
            <Link href="/" className="mt-2 inline-block text-sm text-neutral-500 underline">
              Clear filters
            </Link>
          </div>
        ) : restProducts.length === 0 && newArrivals.length === 0 ? null : null}
      </section>

      <ValueProps />
      <SellerCTA />
    </div>
  );
}
