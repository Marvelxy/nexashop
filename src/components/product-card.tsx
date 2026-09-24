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
    <article className="group relative flex flex-col overflow-hidden rounded-2xl border border-neutral-200 bg-white transition duration-200 hover:-translate-y-0.5 hover:shadow-xl hover:shadow-neutral-900/5">
      {canEdit && (
        <Link
          href={`/seller/products/${product.id}/edit`}
          aria-label="Edit product"
          className="absolute right-3 top-3 z-10 rounded-full bg-neutral-900/90 p-2 text-white backdrop-blur transition hover:bg-neutral-900"
        >
          <Pencil1Icon className="h-4 w-4" />
        </Link>
      )}
      <Link
        href={`/products/${product.slug}`}
        className="relative block aspect-[4/3] overflow-hidden bg-gradient-to-br from-neutral-100 to-neutral-200"
      >
        {image ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={image}
            alt={product.name}
            loading="lazy"
            className={`h-full w-full object-cover transition duration-300 group-hover:scale-105 ${outOfStock ? "grayscale opacity-60" : ""}`}
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-4xl">
            🛍️
          </div>
        )}
        <div className="absolute left-3 top-3 flex gap-2">
          {outOfStock ? (
            <span className="rounded-full bg-neutral-900/90 px-2.5 py-1 text-xs font-medium text-white backdrop-blur">
              Out of stock
            </span>
          ) : (
            <StockBadge stock={product.stock ?? 0} />
          )}
        </div>
      </Link>
      <div className="flex flex-1 flex-col gap-1.5 p-4">
        <p className="text-[11px] font-semibold uppercase tracking-wider text-neutral-500">
          {product.store.name}
        </p>
        <h3 className="line-clamp-1 font-semibold leading-snug">
          <Link
            href={`/products/${product.slug}`}
            className="transition hover:underline"
          >
            {product.name}
          </Link>
        </h3>
        <div className="mt-auto flex items-center justify-between pt-2">
          <p className="text-lg font-bold tracking-tight">
            {formatPrice(product.price)}
          </p>
        </div>
        <div className="[&_button]:rounded-full [&_button]:bg-neutral-900 [&_button]:py-2 [&_button]:font-medium [&_button]:text-white [&_button]:transition [&_button]:hover:bg-neutral-700">
          <QuickAddButton productId={product.id} disabled={outOfStock} />
        </div>
      </div>
    </article>
  );
}
