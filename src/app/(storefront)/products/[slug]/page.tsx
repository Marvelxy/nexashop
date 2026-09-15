import { db } from "@/lib/db";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { formatPrice } from "@/lib/permissions";

type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const product = await db.product.findUnique({ where: { slug } });
  if (!product) return { title: "Not found" };
  return {
    title: `${product.name} | NexaShop`,
    description: product.description.slice(0, 155),
  };
}

export default async function ProductPage({ params }: Props) {
  const { slug } = await params;
  const product = await db.product.findUnique({
    where: { slug },
    include: {
      store: true,
      category: true,
      reviews: { include: { user: true }, orderBy: { createdAt: "desc" }, take: 10 },
    },
  });
  if (!product || !product.isPublished || !product.store.isApproved) notFound();

  const avg =
    product.reviews.length > 0
      ? product.reviews.reduce((s, r) => s + r.rating, 0) / product.reviews.length
      : 0;

  return (
    <div className="grid md:grid-cols-2 gap-8">
      <div className="aspect-square bg-neutral-100 rounded flex items-center justify-center text-neutral-400">
        No image
      </div>
      <div className="space-y-4">
        <p className="text-sm text-neutral-500">{product.store.name}</p>
        <h1 className="text-2xl font-bold">{product.name}</h1>
        <p className="text-xl">{formatPrice(product.price)}</p>
        <p className="text-sm">Stock: {product.stock}</p>
        <p className="text-sm">Rating: {avg.toFixed(1)} ({product.reviews.length})</p>
        <p className="text-neutral-700">{product.description}</p>
      </div>
    </div>
  );
}
