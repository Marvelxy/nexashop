import Link from "next/link";
import { redirect } from "next/navigation";
import { getDetailedCart } from "@/lib/cart";
import { currentUser, formatPrice } from "@/lib/permissions";
import { isStripeConfigured } from "@/lib/stripe";
import { CheckoutForm } from "@/components/checkout-form";

export default async function CheckoutPage() {
  const user = await currentUser();
  if (!user) redirect("/login?callbackUrl=/checkout");

  const { lines, subtotal, count } = await getDetailedCart();
  if (lines.length === 0) redirect("/cart");

  const byStore = new Map<string, typeof lines>();
  for (const line of lines) {
    const arr = byStore.get(line.product.store.name) ?? [];
    arr.push(line);
    byStore.set(line.product.store.name, arr);
  }

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <h1 className="text-xl font-bold">Checkout ({count} items)</h1>

      <div className="space-y-4 rounded border p-4">
        {[...byStore.entries()].map(([storeName, storeLines]) => (
          <div key={storeName} className="space-y-2">
            <p className="text-xs font-medium uppercase text-neutral-500">
              Sold by {storeName}
            </p>
            <ul className="divide-y">
              {storeLines.map(({ product, qty }) => (
                <li key={product.id} className="flex justify-between py-2 text-sm">
                  <span>
                    {product.name} × {qty}
                  </span>
                  <span>{formatPrice(product.price * qty)}</span>
                </li>
              ))}
            </ul>
          </div>
        ))}
        <div className="flex justify-between border-t pt-3 font-medium">
          <span>Total</span>
          <span>{formatPrice(subtotal)}</span>
        </div>
        <p className="text-xs text-neutral-500">
          Ordering as {user.email}. One order is created per seller.
        </p>
      </div>

      <CheckoutForm stripeConfigured={isStripeConfigured()} />

      <Link href="/cart" className="block text-center text-sm text-neutral-600 underline">
        Back to cart
      </Link>
    </div>
  );
}
