import { db } from "@/lib/db";
import { ProductCard } from "@/components/product-card";
import { currentUser } from "@/lib/permissions";

export default async function SearchPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; cat?: string; sort?: string }>;
}) {
  const { q = "", cat = "", sort = "new" } = await searchParams;
  const user = await currentUser();

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

  return (
    <div className="space-y-4">
      <h1 className="text-xl font-bold">Search{q ? `: ${q}` : ""}</h1>
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
      </div>
    </div>
  );
}
