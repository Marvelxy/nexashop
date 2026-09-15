import { db } from "@/lib/db";
import { ProductCard } from "@/components/product-card";

export const revalidate = 60; // ISR: revalidate homepage every 60s

export default async function HomePage() {
  const products = await db.product.findMany({
    where: { isPublished: true, store: { isApproved: true } },
    include: { store: true, category: true },
    orderBy: { createdAt: "desc" },
    take: 12,
  });

  return (
    <div className="space-y-6">
      <section>
        <h1 className="text-3xl font-bold">Multi-vendor marketplace</h1>
        <p className="text-neutral-600">Week 1: catalog + auth. Week 2: cart + Stripe.</p>
      </section>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {products.map((p) => (
          <ProductCard key={p.id} product={p} />
        ))}
        {products.length === 0 && (
          <p className="text-sm text-neutral-500">
            No products yet. Run <code>npm run db:seed</code>.
          </p>
        )}
      </div>
    </div>
  );
}
