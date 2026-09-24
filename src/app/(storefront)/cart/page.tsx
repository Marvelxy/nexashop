import Link from "next/link";
import { getDetailedCart } from "@/lib/cart";
import { formatPrice } from "@/lib/permissions";
import {
  CartQtyForm,
  CartRemoveButton,
} from "@/components/cart-line-controls";
import { EmptyState, PageHeader } from "@/components/dashboard-ui";

const FREE_SHIPPING_THRESHOLD = 5000; // cents

export default async function CartPage() {
  const { lines, subtotal, count } = await getDetailedCart();

  if (lines.length === 0) {
    return (
      <div className="space-y-6">
        <PageHeader eyebrow="Cart" title="Your cart" subtitle="Review items before checkout." />
        <EmptyState
          icon="🛒"
          title="Your cart is empty"
          text="Discover unique finds from independent sellers."
          action={
            <>
              <Link href="/" className="rounded-full bg-neutral-900 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-neutral-700">
                Continue shopping
              </Link>
            </>
          }
        />
      </div>
    );
  }

  const remaining = Math.max(0, FREE_SHIPPING_THRESHOLD - subtotal);
  const progress = Math.min(100, Math.round((subtotal / FREE_SHIPPING_THRESHOLD) * 100));

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Cart"
        title={`Your cart (${count})`}
        subtitle="Secure Stripe checkout · buyer protection on every order."
        actions={
          <Link href="/" className="rounded-full border border-neutral-200 bg-white px-4 py-2 text-sm font-medium transition hover:border-neutral-900">
            Continue shopping
          </Link>
        }
      />

      <div className="rounded-2xl border border-neutral-200 bg-white p-4">
        {remaining > 0 ? (
          <p className="text-sm">Add <span className="font-bold">{formatPrice(remaining)}</span> more for free shipping</p>
        ) : (
          <p className="text-sm font-semibold text-emerald-700">🎉 You unlocked free shipping</p>
        )}
        <div className="mt-2 h-2 overflow-hidden rounded-full bg-neutral-100" role="progressbar" aria-valuenow={progress} aria-valuemin={0} aria-valuemax={100}>
          <div className="h-full rounded-full bg-neutral-900 transition-all" style={{ width: `${progress}%` }} />
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1.6fr_1fr]">
        <ul className="space-y-3">
          {lines.map(({ product, qty }) => {
            const image = product.images[0];
            const outOfStock = product.stock < 1;
            const overStock = !outOfStock && qty > product.stock;
            return (
              <li key={product.id} className="flex gap-4 rounded-2xl border border-neutral-200 bg-white p-4">
                <Link
                  href={`/products/${product.slug}`}
                  className="h-24 w-24 shrink-0 overflow-hidden rounded-xl bg-gradient-to-br from-neutral-100 to-neutral-200"
                >
                  {image ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={image} alt={product.name} className={`h-full w-full object-cover ${outOfStock ? "grayscale opacity-60" : ""}`} />
                  ) : (
                    <span className="flex h-full w-full items-center justify-center text-2xl">🛍️</span>
                  )}
                </Link>
                <div className="flex min-w-0 flex-1 flex-col gap-1">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <p className="text-[11px] font-semibold uppercase tracking-wider text-neutral-500">
                        {product.store.name}
                      </p>
                      <Link href={`/products/${product.slug}`} className="truncate font-semibold hover:underline">
                        {product.name}
                      </Link>
                    </div>
                    <CartRemoveButton productId={product.id} />
                  </div>
                  <p className="text-sm text-neutral-500">{formatPrice(product.price)} each</p>
                  {outOfStock && (
                    <p className="rounded-xl bg-red-50 px-3 py-1.5 text-xs font-medium text-red-700">
                      Out of stock — remove it or wait for restock.
                    </p>
                  )}
                  {overStock && (
                    <p className="rounded-xl bg-amber-50 px-3 py-1.5 text-xs font-medium text-amber-800">
                      Only {product.stock} available — lower the quantity.
                    </p>
                  )}
                  {!product.isPublished && (
                    <p className="text-xs text-amber-600">This product is no longer available.</p>
                  )}
                  <div className="mt-auto flex flex-wrap items-center justify-between gap-2 pt-2">
                    <CartQtyForm productId={product.id} qty={qty} max={Math.max(product.stock, qty)} />
                    <p className="font-bold">{formatPrice(product.price * qty)}</p>
                  </div>
                </div>
              </li>
            );
          })}
        </ul>

        <aside className="h-fit space-y-4 rounded-3xl border border-neutral-200 bg-white p-6 lg:sticky lg:top-32">
          <h2 className="font-bold">Order summary</h2>
          <dl className="space-y-2 text-sm">
            <div className="flex justify-between text-neutral-600">
              <dt>Items ({count})</dt>
              <dd>{formatPrice(subtotal)}</dd>
            </div>
            <div className="flex justify-between text-neutral-600">
              <dt>Shipping</dt>
              <dd>{remaining > 0 ? "Calculated at checkout" : "Free"}</dd>
            </div>
            <div className="flex justify-between border-t border-neutral-100 pt-3 text-base font-extrabold">
              <dt>Subtotal</dt>
              <dd>{formatPrice(subtotal)}</dd>
            </div>
          </dl>
          <Link href="/checkout" className="block rounded-full bg-neutral-900 py-3 text-center text-sm font-semibold text-white transition hover:bg-neutral-700">
            Proceed to checkout →
          </Link>
          <ul className="space-y-1.5 text-xs text-neutral-500">
            <li>🔒 Secure payments via Stripe</li>
            <li>↩️ Buyer protection included</li>
            <li>🚚 One order per seller</li>
          </ul>
        </aside>
      </div>
    </div>
  );
}
