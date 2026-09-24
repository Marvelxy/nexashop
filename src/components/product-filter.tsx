import Link from "next/link";

type Category = { id: string; name: string; slug: string };

export function ProductFilter({
  q,
  cat,
  sort,
  categories,
}: {
  q: string;
  cat: string;
  sort: string;
  categories: Category[];
}) {
  return (
    <form
      method="GET"
      action="/"
      className="flex w-full flex-wrap items-end gap-3 rounded-2xl border border-neutral-200 bg-white/90 p-4 shadow-sm backdrop-blur"
    >
      <label className="min-w-0 flex-1 basis-56 text-xs font-semibold uppercase tracking-wider text-neutral-500">
        Search
        <span className="relative mt-1.5 block">
          <span className="pointer-events-none absolute inset-y-0 left-3 flex items-center text-neutral-400">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden><circle cx="11" cy="11" r="8" /><path d="m21 21-4.3-4.3" /></svg>
          </span>
          <input
            name="q"
            type="search"
            defaultValue={q}
            placeholder="Headphones, sneakers, candles…"
            className="w-full rounded-full border border-neutral-200 bg-neutral-50 py-2 pl-9 pr-3 text-sm font-normal normal-case tracking-normal text-neutral-900 placeholder:text-neutral-400 focus:border-neutral-900 focus:bg-white focus:outline-none"
          />
        </span>
      </label>
      <label className="text-xs font-semibold uppercase tracking-wider text-neutral-500">
        Category
        <select
          name="cat"
          defaultValue={cat}
          className="mt-1.5 block rounded-full border border-neutral-200 bg-neutral-50 px-3 py-2 text-sm font-normal normal-case tracking-normal text-neutral-900 focus:border-neutral-900 focus:outline-none"
        >
          <option value="">All categories</option>
          {categories.map((c) => (
            <option key={c.id} value={c.slug}>
              {c.name}
            </option>
          ))}
        </select>
      </label>
      <label className="text-xs font-semibold uppercase tracking-wider text-neutral-500">
        Sort
        <select
          name="sort"
          defaultValue={sort}
          className="mt-1.5 block rounded-full border border-neutral-200 bg-neutral-50 px-3 py-2 text-sm font-normal normal-case tracking-normal text-neutral-900 focus:border-neutral-900 focus:outline-none"
        >
          <option value="new">Newest</option>
          <option value="price-asc">Price: low to high</option>
          <option value="price-desc">Price: high to low</option>
        </select>
      </label>
      <div className="flex items-center gap-2">
        <button
          type="submit"
          className="rounded-full bg-neutral-900 px-5 py-2 text-sm font-medium text-white transition hover:bg-neutral-700"
        >
          Filter
        </button>
        {(q || cat || sort !== "new") && (
          <Link
            href="/"
            className="rounded-full border border-neutral-200 px-4 py-2 text-sm font-medium text-neutral-600 transition hover:bg-neutral-100"
          >
            Clear
          </Link>
        )}
      </div>
    </form>
  );
}
