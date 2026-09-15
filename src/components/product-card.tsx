import { formatPrice } from "@/lib/permissions";

type Product = {
  slug: string;
  name: string;
  price: number;
  store: { name: string };
};

export function ProductCard({ product }: { product: Product }) {
  return (
    <a href={`/products/${product.slug}`} className="border rounded p-4 space-y-2 block hover:shadow">
      <div className="aspect-square bg-neutral-100 rounded" />
      <p className="text-xs text-neutral-500">{product.store.name}</p>
      <h3 className="font-medium">{product.name}</h3>
      <p>{formatPrice(product.price)}</p>
    </a>
  );
}
