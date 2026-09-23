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
    <form method="GET" action="/" className="flex w-full flex-wrap items-end gap-3 rounded border p-3">
      <label className="min-w-0 flex-1 basis-48 text-sm">
        Search
        <input
          name="q"
          type="search"
          defaultValue={q}
          placeholder="Headphones…"
          className="mt-1 w-full rounded border px-2 py-1"
        />
      </label>
      <label className="text-sm">
        Category
        <select name="cat" defaultValue={cat} className="mt-1 block rounded border px-2 py-1">
          <option value="">All</option>
          {categories.map((c) => (
            <option key={c.id} value={c.slug}>
              {c.name}
            </option>
          ))}
        </select>
      </label>
      <label className="text-sm">
        Sort
        <select name="sort" defaultValue={sort} className="mt-1 block rounded border px-2 py-1">
          <option value="new">Newest</option>
          <option value="price-asc">Price: low to high</option>
          <option value="price-desc">Price: high to low</option>
        </select>
      </label>
      <button
        type="submit"
        className="rounded bg-neutral-900 px-3 py-1.5 text-sm text-white"
      >
        Filter
      </button>
      {(q || cat || sort !== "new") && (
        <Link href="/" className="text-sm text-neutral-600 rounded bg-neutral-900 px-3 py-1.5 text-sm text-white">
          Clear
        </Link>
      )}
    </form>
  );
}
