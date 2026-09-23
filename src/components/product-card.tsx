import Link from "next/link";
import { Pencil1Icon } from "@radix-ui/react-icons";
import { formatPrice } from "@/lib/permissions";
import { QuickAddButton } from "@/components/add-to-cart-form";
import { StockBadge, isOutOfStock } from "@/components/stock-badge";

type Product = {
  id: string;
  slug: string;
  name: string;
  price: number;
  stock: number;
  images?: unknown;
  store: { name: string };
};

export function ProductCard({
  product,
  canEdit,
}: {
  product: Product;
  canEdit?: boolean;
}) {
  const images = Array.isArray(product.images) ? product.images : [];
  const image = images[0] as string | undefined;
  const outOfStock = isOutOfStock(product.stock ?? 0);

  return (
    <div className="border rounded p-4 space-y-2 block hover:shadow relative">
      {canEdit && (
        <Link
          href={`/seller/products/${product.id}/edit`}
          aria-label="Edit product"
          className="absolute top-2 right-2 z-10 rounded bg-neutral-900 p-1.5 text-white"
        >
          <Pencil1Icon className="h-4 w-4" />
        </Link>
      )}
      <Link
        href={`/products/${product.slug}`}
        className="relative block aspect-square bg-neutral-100 rounded overflow-hidden"
      >
        {image ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={image}
            alt={product.name}
            className={`h-full w-full object-cover ${outOfStock ? "grayscale opacity-60" : ""}`}
          />
        ) : null}
        {outOfStock && (
          <span className="absolute inset-x-0 bottom-0 bg-neutral-900/80 py-1 text-center text-xs font-medium text-white">
            Out of stock
          </span>
        )}
      </Link>
      <p className="text-xs text-neutral-500">{product.store.name}</p>
      <h3 className="font-medium">
        <Link href={`/products/${product.slug}`}>{product.name}</Link>
      </h3>
      <div className="flex items-center justify-between">
        <p>{formatPrice(product.price)}</p>
        <StockBadge stock={product.stock ?? 0} />
      </div>
      <QuickAddButton productId={product.id} disabled={outOfStock} />
    </div>
  );
}
