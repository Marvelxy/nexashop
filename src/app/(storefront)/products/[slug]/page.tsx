import { db } from "@/lib/db";
import { notFound } from "next/navigation";
import Link from "next/link";
import type { Metadata } from "next";
import { Pencil1Icon } from "@radix-ui/react-icons";
import { formatPrice, currentUser } from "@/lib/permissions";

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

  const user = await currentUser();
  const canEdit =
    user?.role === "ADMIN" ||
    (user?.role === "SELLER" && product.store.ownerId === user.id);

  const images = Array.isArray(product.images)
    ? (product.images as string[])
    : [];
  const image = images[0];

  const avg =
    product.reviews.length > 0
      ? product.reviews.reduce((s, r) => s + r.rating, 0) / product.reviews.length
      : 0;

  return (
    <div className="grid md:grid-cols-2 gap-8">
      <div>
        {image ? (
          <div className="space-y-2">
            <div className="aspect-square bg-neutral-100 rounded overflow-hidden">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={image}
                alt={product.name}
                className="h-full w-full object-cover"
              />
            </div>
            {images.slice(1).length > 0 && (
              <div className="flex gap-2">
                {images.slice(1).map((url) => (
                  <div key={url} className="h-20 w-20 rounded border overflow-hidden">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={url} alt={product.name} className="h-full w-full object-cover" />
                  </div>
                ))}
              </div>
            )}
          </div>
        ) : (
          <div className="aspect-square bg-neutral-100 rounded flex items-center justify-center text-neutral-400">
            No image
          </div>
        )}
      </div>
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <p className="text-sm text-neutral-500">{product.store.name}</p>
          {canEdit && (
            <Link
              href={`/seller/products/${product.id}/edit`}
              aria-label="Edit product"
              className="rounded bg-neutral-900 p-2 text-white"
            >
              <Pencil1Icon className="h-4 w-4" />
            </Link>
          )}
        </div>
        <h1 className="text-2xl font-bold">{product.name}</h1>
        <p className="text-xl">{formatPrice(product.price)}</p>
        <p className="text-sm">Stock: {product.stock}</p>
        <p className="text-sm">Rating: {avg.toFixed(1)} ({product.reviews.length})</p>
        <p className="text-neutral-700">{product.description}</p>
      </div>
    </div>
  );
}
