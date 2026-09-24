import Link from "next/link";
import type { HeaderCategory } from "./site-header";

export function SiteFooter({ categories }: { categories: HeaderCategory[] }) {
  const topCats = categories.slice(0, 5);
  return (
    <footer className="mt-12 border-t border-neutral-200 bg-neutral-50">
      <div className="mx-auto grid max-w-7xl gap-8 px-4 py-10 sm:grid-cols-2 lg:grid-cols-4">
        <div className="space-y-3">
          <Link href="/" className="flex items-center gap-2">
            <span aria-hidden className="flex h-8 w-8 items-center justify-center rounded-xl bg-neutral-900 text-sm font-extrabold text-white">
              N
            </span>
            <span className="text-lg font-extrabold tracking-tight">NexaShop</span>
          </Link>
          <p className="max-w-xs text-sm text-neutral-500">
            Open-source multi-vendor marketplace. Buy from independent sellers.
          </p>
        </div>
        <nav aria-label="Shop">
          <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-neutral-500">Shop</p>
          <ul className="space-y-2 text-sm">
            <li><Link href="/" className="transition hover:underline">All products</Link></li>
            {topCats.map((c) => (
              <li key={c.id}>
                <Link href={`/?cat=${c.slug}`} className="transition hover:underline">
                  {c.name}
                </Link>
              </li>
            ))}
            <li><Link href="/cart" className="transition hover:underline">Cart</Link></li>
          </ul>
        </nav>
        <nav aria-label="Sell">
          <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-neutral-500">Sell</p>
          <ul className="space-y-2 text-sm">
            <li><Link href="/become-seller" className="transition hover:underline">Become a seller</Link></li>
            <li><Link href="/seller/products" className="transition hover:underline">Seller dashboard</Link></li>
            <li><Link href="/seller/products/new" className="transition hover:underline">New product</Link></li>
          </ul>
        </nav>
        <nav aria-label="Account">
          <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-neutral-500">Account</p>
          <ul className="space-y-2 text-sm">
            <li><Link href="/orders" className="transition hover:underline">Orders</Link></li>
            <li><Link href="/login" className="transition hover:underline">Sign in</Link></li>
            <li><Link href="/register" className="transition hover:underline">Create account</Link></li>
          </ul>
        </nav>
      </div>
      <div className="border-t border-neutral-200">
        <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-2 px-4 py-4 text-xs text-neutral-500 sm:flex-row">
          <p>© 2026 NexaShop · MIT open source</p>
          <p>Built with Next.js 15 · Stripe payments</p>
        </div>
      </div>
    </footer>
  );
}
