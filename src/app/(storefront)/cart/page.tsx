import Link from "next/link";
import { getDetailedCart } from "@/lib/cart";
import { formatPrice } from "@/lib/permissions";
import {
  CartQtyForm,
  CartRemoveButton,
} from "@/components/cart-line-controls";

export default async function CartPage() {
  const { lines, subtotal, count } = await getDetailedCart();

  if (lines.length === 0) {
    return (
      <div className="space-y-4">
        <h1 className="text-xl font-bold">Cart</h1>
        <p className="text-sm text-neutral-600">
          Your cart is empty.{" "}
          <Link href="/" className="underline">
            Continue shopping
          </Link>
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <h1 className="text-xl font-bold">Cart ({count} items)</h1>

      <ul className="divide-y rounded border">
        {lines.map(({ product, qty }) => {
          const image = product.images[0];
          return (
            <li key={product.id} className="flex gap-4 p-4">
              <Link
                href={`/products/${product.slug}`}
                className="h-20 w-20 shrink-0 overflow-hidden rounded bg-neutral-100"
              >
                {image ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={image}
                    alt={product.name}
                    className="h-full w-full object-cover"
                  />
                ) : null}
              </Link>
              <div className="flex flex-1 flex-col gap-1">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className="text-xs text-neutral-500">
                      {product.store.name}
                    </p>
                    <Link
                      href={`/products/${product.slug}`}
                      className="font-medium hover:underline"
                    >
                      {product.name}
                    </Link>
                  </div>
                  <CartRemoveButton productId={product.id} />
                </div>
                <p className="text-sm">{formatPrice(product.price)} each</p>
                {product.stock < 1 && (
                  <p className="text-xs font-medium text-red-600">
                    Out of stock — remove it or wait for restock.
                  </p>
                )}
                {product.stock >= 1 && qty > product.stock && (
                  <p className="text-xs font-medium text-amber-600">
                    Only {product.stock} available — lower the quantity.
                  </p>
                )}
                <div className="flex items-center justify-between">
                  <CartQtyForm
                    productId={product.id}
                    qty={qty}
                    max={Math.max(product.stock, qty)}
                  />
                  <p className="text-sm font-medium">
                    {formatPrice(product.price * qty)}
                  </p>
                </div>
                {!product.isPublished && (
                  <p className="text-xs text-amber-600">
                    This product is no longer available.
                  </p>
                )}
              </div>
            </li>
          );
        })}
      </ul>

      <div className="flex items-center justify-between rounded border p-4">
        <p className="font-medium">Subtotal</p>
        <p className="text-lg font-bold">{formatPrice(subtotal)}</p>
      </div>

      <div className="flex gap-2">
        <Link
          href="/"
          className="rounded border px-4 py-2 text-sm hover:bg-neutral-50"
        >
          Continue shopping
        </Link>
        <Link
          href="/checkout"
          className="rounded bg-neutral-900 px-4 py-2 text-sm text-white"
        >
          Proceed to checkout
        </Link>
      </div>
    </div>
  );
}
