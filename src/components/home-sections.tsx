import Link from "next/link";

type CategoryWithCount = {
  id: string;
  name: string;
  slug: string;
  _count?: { products: number };
};

const CATEGORY_EMOJI: Record<string, string> = {
  electronics: "🎧",
  fashion: "👕",
  home: "🏠",
  beauty: "💄",
  sports: "⚽",
  books: "📚",
  toys: "🧸",
};

function emojiFor(slug: string, name: string) {
  if (CATEGORY_EMOJI[slug]) return CATEGORY_EMOJI[slug];
  const lower = name.toLowerCase();
  if (lower.includes("elect")) return "🎧";
  if (lower.includes("cloth") || lower.includes("fashion")) return "👕";
  if (lower.includes("home") || lower.includes("kitchen")) return "🏠";
  if (lower.includes("beaut")) return "💄";
  if (lower.includes("sport")) return "⚽";
  if (lower.includes("book")) return "📚";
  if (lower.includes("toy") || lower.includes("game")) return "🧸";
  return "🛍️";
}

export function HomeHero({
  productCount,
  storeCount,
  categoryCount,
}: {
  productCount: number;
  storeCount: number;
  categoryCount: number;
}) {
  return (
    <section className="relative overflow-hidden rounded-3xl bg-neutral-950 text-white">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(60rem_30rem_at_20%_-10%,#3b3b3b,transparent),radial-gradient(40rem_24rem_at_90%_110%,#262626,transparent)]"
      />
      <div className="relative grid gap-8 p-8 sm:p-12 lg:grid-cols-[1.1fr_0.9fr] lg:items-center">
        <div className="space-y-5">
          {/*<p className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-3 py-1 text-xs font-medium text-neutral-200">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
            Multi-vendor marketplace · open source
          </p>
          */}
          <h1 className="text-4xl font-extrabold leading-[1.05] tracking-tight sm:text-5xl">
            Discover unique finds from independent sellers.
          </h1>
          <p className="max-w-md text-neutral-300">
            Shop curated products across categories — secure Stripe checkout,
            buyer protection, and new arrivals daily.
          </p>
          <div className="flex flex-wrap gap-3 pt-1">
            <a
              href="#new-arrivals"
              className="rounded-full bg-white px-5 py-2.5 text-sm font-semibold text-neutral-900 transition hover:bg-neutral-200"
            >
              Shop new arrivals
            </a>
            <Link
              href="/become-seller"
              className="rounded-full border border-white/20 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-white/10"
            >
              Become a seller
            </Link>
          </div>
          <dl className="flex gap-8 pt-4 text-sm">
            <div>
              <dt className="text-neutral-400">Products</dt>
              <dd className="text-xl font-bold">{productCount}</dd>
            </div>
            <div>
              <dt className="text-neutral-400">Sellers</dt>
              <dd className="text-xl font-bold">{storeCount}</dd>
            </div>
            <div>
              <dt className="text-neutral-400">Categories</dt>
              <dd className="text-xl font-bold">{categoryCount}</dd>
            </div>
          </dl>
        </div>
        <div className="hidden grid-cols-2 gap-3 lg:grid" aria-hidden>
          <div className="space-y-3 pt-8">
            <div className="rounded-2xl bg-gradient-to-br from-amber-200 to-orange-300 p-5 text-neutral-900">
              <p className="text-3xl">🎧</p>
              <p className="mt-2 text-sm font-bold">Electronics</p>
              <p className="text-xs opacity-70">Top rated picks</p>
            </div>
            <div className="rounded-2xl bg-white/10 p-5 backdrop-blur">
              <p className="text-3xl">🚚</p>
              <p className="mt-2 text-sm font-bold">Fast checkout</p>
              <p className="text-xs text-neutral-300">Powered by Stripe</p>
            </div>
          </div>
          <div className="space-y-3">
            <div className="rounded-2xl bg-white/10 p-5 backdrop-blur">
              <p className="text-3xl">🏠</p>
              <p className="mt-2 text-sm font-bold">Home & living</p>
              <p className="text-xs text-neutral-300">Small-batch sellers</p>
            </div>
            <div className="rounded-2xl bg-gradient-to-br from-emerald-200 to-teal-300 p-5 text-neutral-900">
              <p className="text-3xl">✨</p>
              <p className="mt-2 text-sm font-bold">New daily</p>
              <p className="text-xs opacity-70">Fresh drops</p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

export function CategoryShowcase({
  categories,
  activeCat,
}: {
  categories: CategoryWithCount[];
  activeCat: string;
}) {
  if (categories.length === 0) return null;
  return (
    <section aria-label="Shop by category" className="space-y-3">
      <div className="flex items-end justify-between">
        <h2 className="text-lg font-bold tracking-tight">Shop by category</h2>
        <Link href="/" className="text-sm font-medium text-neutral-500 hover:text-neutral-900">
          View all
        </Link>
      </div>
      <div className="flex gap-3 overflow-x-auto pb-1">
        <Link
          href="/"
          className={`flex shrink-0 items-center gap-2 rounded-full border px-4 py-2 text-sm font-medium transition ${
            !activeCat
              ? "border-neutral-900 bg-neutral-900 text-white"
              : "border-neutral-200 bg-white hover:border-neutral-400"
          }`}
        >
          🛒 All
        </Link>
        {categories.map((c) => {
          const active = activeCat === c.slug;
          return (
            <Link
              key={c.id}
              href={`/?cat=${c.slug}`}
              className={`flex shrink-0 items-center gap-2 rounded-full border px-4 py-2 text-sm font-medium transition ${
                active
                  ? "border-neutral-900 bg-neutral-900 text-white"
                  : "border-neutral-200 bg-white hover:border-neutral-400"
              }`}
            >
              <span>{emojiFor(c.slug, c.name)}</span>
              {c.name}
              {typeof c._count?.products === "number" && (
                <span
                  className={`rounded-full px-1.5 text-xs ${active ? "bg-white/20" : "bg-neutral-100 text-neutral-500"}`}
                >
                  {c._count.products}
                </span>
              )}
            </Link>
          );
        })}
      </div>
    </section>
  );
}

export function ValueProps() {
  const items = [
    {
      icon: "🔒",
      title: "Secure Stripe checkout",
      text: "Encrypted payments with instant order confirmation.",
    },
    {
      icon: "🏪",
      title: "Independent sellers",
      text: "Every purchase supports a vetted small business.",
    },
    {
      icon: "↩️",
      title: "Buyer protection",
      text: "Track orders end-to-end with seller + admin support.",
    },
  ];
  return (
    <section className="grid gap-3 sm:grid-cols-3">
      {items.map((i) => (
        <div key={i.title} className="rounded-2xl border border-neutral-200 bg-white p-5">
          <p className="text-2xl">{i.icon}</p>
          <h3 className="mt-2 font-semibold">{i.title}</h3>
          <p className="mt-1 text-sm text-neutral-500">{i.text}</p>
        </div>
      ))}
    </section>
  );
}

export function SellerCTA() {
  return (
    <section className="flex flex-col items-start justify-between gap-4 rounded-3xl border border-neutral-200 bg-gradient-to-br from-neutral-50 to-neutral-100 p-8 sm:flex-row sm:items-center">
      <div>
        <h2 className="text-xl font-bold tracking-tight">Sell on NexaShop</h2>
        <p className="mt-1 text-sm text-neutral-600">
          Open your store in minutes. Low fees, Stripe payouts, built-in analytics.
        </p>
      </div>
      <Link
        href="/become-seller"
        className="shrink-0 rounded-full bg-neutral-900 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-neutral-700"
      >
        Start selling →
      </Link>
    </section>
  );
}
