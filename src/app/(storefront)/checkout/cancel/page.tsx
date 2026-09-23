import Link from "next/link";

export default function CheckoutCancelPage() {
  return (
    <div className="mx-auto max-w-2xl space-y-4">
      <h1 className="text-xl font-bold">Payment cancelled</h1>
      <p className="text-sm text-neutral-600">
        Your payment was cancelled. Your cart was kept — you can try again.
      </p>
      <div className="flex gap-2">
        <Link
          href="/cart"
          className="rounded bg-neutral-900 px-4 py-2 text-sm text-white"
        >
          Back to cart
        </Link>
        <Link
          href="/"
          className="rounded border px-4 py-2 text-sm hover:bg-neutral-50"
        >
          Continue shopping
        </Link>
      </div>
    </div>
  );
}
