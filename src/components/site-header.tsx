import Link from "next/link";
import { signOut } from "@/lib/auth";
import { UserMenu } from "@/components/user-menu";

export type HeaderUser = {
  id: string;
  name?: string | null;
  email?: string | null;
  image?: string | null;
  role: "BUYER" | "SELLER" | "ADMIN";
};

export type HeaderCategory = {
  id: string;
  name: string;
  slug: string;
};

function SignOutButton({ mobile }: { mobile?: boolean }) {
  return (
    <form
      action={async () => {
        "use server";
        await signOut({ redirectTo: "/" });
      }}
      className={mobile ? "w-full" : ""}
    >
      <button
        type="submit"
        className={
          mobile
            ? "block w-full rounded-xl px-3 py-2.5 text-left text-sm text-red-600 transition hover:bg-red-50"
            : "block w-full rounded-lg px-3 py-2 text-left text-sm text-red-600 transition hover:bg-red-50"
        }
      >
        Sign out
      </button>
    </form>
  );
}

export function SiteHeader({
  user,
  categories,
  cartCount,
}: {
  user: HeaderUser | null;
  categories: HeaderCategory[];
  cartCount: number;
}) {
  return (
    <header className="sticky top-0 z-40">
      {/* Utility strip */}
      <div className="bg-neutral-950 text-neutral-200">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-1.5 text-xs">
          <p className="truncate">
            Free shipping over $50 · Secure Stripe checkout
          </p>
          <div className="hidden items-center gap-4 sm:flex">
            <Link href="/become-seller" className="transition hover:text-white">
              Become a seller
            </Link>
            {user && (
              <Link href="/orders" className="transition hover:text-white">
                Track order
              </Link>
            )}
            {user?.role === "ADMIN" && (
              <Link href="/admin/stores" className="transition hover:text-white">
                Admin
              </Link>
            )}
          </div>
        </div>
      </div>

      {/* Main bar */}
      <div className="border-b border-neutral-200 bg-white/85 backdrop-blur">
        <div className="mx-auto flex max-w-7xl items-center gap-3 px-4 py-3">
          {/* Mobile menu */}
          <details className="group relative md:hidden">
            <summary className="flex cursor-pointer list-none rounded-full border border-neutral-200 p-2 transition hover:bg-neutral-100 [&::-webkit-details-marker]:hidden" aria-label="Open menu">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden>
                <path d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </summary>
            <div className="absolute left-0 z-50 mt-2 w-[calc(100vw-2rem)] max-w-sm rounded-2xl border border-neutral-200 bg-white p-4 shadow-xl">
              <form method="GET" action="/" className="mb-3 md:hidden">
                <input
                  name="q"
                  type="search"
                  placeholder="Search products…"
                  aria-label="Search products"
                  className="w-full rounded-full border border-neutral-200 bg-neutral-50 px-4 py-2 text-sm focus:border-neutral-900 focus:outline-none"
                />
              </form>
              <p className="px-1 pb-2 text-xs font-semibold uppercase tracking-wider text-neutral-500">
                Categories
              </p>
              <div className="grid grid-cols-2 gap-2">
                <Link href="/" className="rounded-xl bg-neutral-100 px-3 py-2.5 text-sm font-medium">
                  All products
                </Link>
                {categories.slice(0, 7).map((c) => (
                  <Link
                    key={c.id}
                    href={`/?cat=${c.slug}`}
                    className="rounded-xl bg-neutral-100 px-3 py-2.5 text-sm font-medium"
                  >
                    {c.name}
                  </Link>
                ))}
              </div>
              <div className="mt-3 space-y-1 border-t pt-3">
                <Link href="/cart" className="block rounded-xl px-3 py-2.5 text-sm transition hover:bg-neutral-100">
                  Cart{cartCount > 0 ? ` (${cartCount})` : ""}
                </Link>
                {user ? (
                  <>
                    <Link href="/orders" className="block rounded-xl px-3 py-2.5 text-sm transition hover:bg-neutral-100">
                      Orders
                    </Link>
                    <Link href="/seller/products" className="block rounded-xl px-3 py-2.5 text-sm transition hover:bg-neutral-100">
                      Seller dashboard
                    </Link>
                    {user.role === "ADMIN" && (
                      <Link href="/admin/stores" className="block rounded-xl px-3 py-2.5 text-sm transition hover:bg-neutral-100">
                        Admin
                      </Link>
                    )}
                    <SignOutButton mobile />
                  </>
                ) : (
                  <>
                    <Link href="/login" className="block rounded-xl bg-neutral-900 px-3 py-2.5 text-center text-sm font-semibold text-white">
                      Sign in
                    </Link>
                    <Link href="/become-seller" className="block rounded-xl px-3 py-2.5 text-center text-sm font-medium">
                      Become a seller
                    </Link>
                  </>
                )}
              </div>
            </div>
          </details>

          {/* Logo */}
          <Link href="/" className="flex shrink-0 items-center gap-2">
            <span aria-hidden className="flex h-8 w-8 items-center justify-center rounded-xl bg-neutral-900 text-sm font-extrabold text-white">
              N
            </span>
            <span className="text-lg font-extrabold tracking-tight">
              NexaShop
            </span>
          </Link>

          {/* Desktop search */}
          <form method="GET" action="/" className="hidden flex-1 justify-center md:flex" role="search">
            <span className="relative block w-full max-w-xl">
              <span className="pointer-events-none absolute inset-y-0 left-4 flex items-center text-neutral-400">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden><circle cx="11" cy="11" r="8" /><path d="m21 21-4.3-4.3" /></svg>
              </span>
              <input
                name="q"
                type="search"
                placeholder="Search headphones, sneakers, candles…"
                aria-label="Search products"
                className="w-full rounded-full border border-neutral-200 bg-neutral-50 py-2 pl-10 pr-4 text-sm focus:border-neutral-900 focus:bg-white focus:outline-none"
              />
            </span>
          </form>

          <div className="ml-auto flex items-center gap-2 md:ml-0">
            <Link
              href="/seller/products"
              className="hidden rounded-full border border-neutral-200 px-4 py-2 text-sm font-medium transition hover:border-neutral-900 sm:block"
            >
              Sell
            </Link>
            <Link
              href="/cart"
              aria-label={cartCount > 0 ? `${cartCount} items in cart` : "Cart"}
              className="relative rounded-full border border-neutral-200 p-2.5 transition hover:border-neutral-900"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                <circle cx="8" cy="21" r="1" /><circle cx="19" cy="21" r="1" />
                <path d="M2.05 2.05h2l2.66 12.42a2 2 0 0 0 2 1.58h9.78a2 2 0 0 0 1.95-1.57l1.65-7.43H5.12" />
              </svg>
              {cartCount > 0 && (
                <span className="absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-neutral-900 px-1 text-[11px] font-bold text-white">
                  {cartCount > 99 ? "99+" : cartCount}
                </span>
              )}
            </Link>
            <span className="hidden md:block">
              {user ? (
                <UserMenu user={user} />
              ) : (
                <Link
                  href="/login"
                  className="block rounded-full bg-neutral-900 px-4 py-2 text-sm font-semibold text-white transition hover:bg-neutral-700"
                >
                  Sign in
                </Link>
              )}
            </span>
            {/* Mobile sign-in shortcut (menu holds full links) */}
            {!user && (
              <Link
                href="/login"
                className="rounded-full bg-neutral-900 px-4 py-2 text-sm font-semibold text-white md:hidden"
              >
                Sign in
              </Link>
            )}
          </div>
        </div>

        {/* Category row (desktop) */}
        {categories.length > 0 && (
          <nav aria-label="Categories" className="hidden border-t border-neutral-100 md:block">
            <div className="mx-auto flex max-w-7xl items-center gap-1 overflow-x-auto px-4 py-2">
              <Link
                href="/"
                className="shrink-0 rounded-full px-3 py-1.5 text-sm font-medium text-neutral-600 transition hover:bg-neutral-100 hover:text-neutral-900"
              >
                All
              </Link>
              {categories.map((c) => (
                <Link
                  key={c.id}
                  href={`/?cat=${c.slug}`}
                  className="shrink-0 rounded-full px-3 py-1.5 text-sm font-medium text-neutral-600 transition hover:bg-neutral-100 hover:text-neutral-900"
                >
                  {c.name}
                </Link>
              ))}
            </div>
          </nav>
        )}
      </div>
    </header>
  );
}
