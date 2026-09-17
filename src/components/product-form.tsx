"use client";

import { useActionState, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  createProduct,
  updateProduct,
  type ProductState,
} from "@/actions/product";

type Category = { id: string; name: string };

type Product = {
  id: string;
  name: string;
  description: string;
  price: number;
  stock: number;
  images: string[];
  categoryId: string | null;
};

const initialState: ProductState = {};

export function ProductForm({
  product,
  categories,
}: {
  product?: Product;
  categories: Category[];
}) {
  const isEdit = Boolean(product);
  const [state, formAction, pending] = useActionState(
    isEdit ? updateProduct : createProduct,
    initialState,
  );
  const router = useRouter();
  const [images, setImages] = useState<string[]>(product?.images ?? []);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string>();

  useEffect(() => {
    if (state.success) {
      router.push("/seller/products");
    }
  }, [state.success, router]);

  function removeImage(url: string) {
    setImages((prev) => prev.filter((u) => u !== url));
  }

  async function handleFileChange(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;

    setUploading(true);
    setUploadError(undefined);

    try {
      const formData = new FormData();
      formData.append("file", file);

      const res = await fetch("/api/upload", { method: "POST", body: formData });

      if (!res.ok) {
        const data = (await res.json().catch(() => ({}))) as {
          error?: string;
        };
        throw new Error(data.error ?? "Upload failed");
      }

      const data = (await res.json()) as { url: string };
      setImages((prev) => [...prev, data.url]);
    } catch (err) {
      setUploadError(err instanceof Error ? err.message : "Upload failed");
    } finally {
      setUploading(false);
      event.target.value = "";
    }
  }

  return (
    <form action={formAction} className="space-y-4 rounded border p-4">
      {state.error && (
        <p className="rounded border border-red-300 bg-red-50 p-3 text-sm text-red-800">
          {state.error}
        </p>
      )}
      {state.success && (
        <p className="rounded border border-green-300 bg-green-50 p-3 text-sm text-green-800">
          {state.success}
        </p>
      )}

      {isEdit && <input type="hidden" name="id" value={product!.id} />}
      <input type="hidden" name="images" value={JSON.stringify(images)} />

      <label className="block text-sm">
        Name
        <input
          name="name"
          type="text"
          required
          minLength={3}
          maxLength={100}
          defaultValue={product?.name}
          className="mt-1 w-full rounded border px-3 py-2"
        />
      </label>

      <label className="block text-sm">
        Description
        <textarea
          name="description"
          rows={4}
          required
          minLength={10}
          defaultValue={product?.description}
          className="mt-1 w-full rounded border px-3 py-2"
        />
      </label>

      <div className="grid grid-cols-2 gap-4">
        <label className="block text-sm">
          Price ($)
          <input
            name="price"
            type="number"
            step="0.01"
            min="1"
            required
            placeholder="0.00"
            defaultValue={product ? product.price / 100 : undefined}
            className="mt-1 w-full rounded border px-3 py-2"
          />
        </label>

        <label className="block text-sm">
          Stock
          <input
            name="stock"
            type="number"
            min="0"
            required
            defaultValue={product?.stock ?? 0}
            className="mt-1 w-full rounded border px-3 py-2"
          />
        </label>
      </div>

      {categories.length > 0 && (
        <label className="block text-sm">
          Category
          <select
            name="categoryId"
            defaultValue={product?.categoryId ?? ""}
            className="mt-1 w-full rounded border px-3 py-2"
          >
            <option value="">None</option>
            {categories.map((cat) => (
              <option key={cat.id} value={cat.id}>
                {cat.name}
              </option>
            ))}
          </select>
        </label>
      )}

      <div className="space-y-2">
        <span className="block text-sm">Images</span>
        {images.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {images.map((url) => (
              <div key={url} className="relative h-24 w-24">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={url}
                  alt=""
                  className="h-24 w-24 rounded border object-cover"
                />
                <button
                  type="button"
                  onClick={() => removeImage(url)}
                  className="absolute -top-2 -right-2 grid h-6 w-6 place-items-center rounded-full bg-red-600 text-xs leading-none text-white"
                >
                  ×
                </button>
              </div>
            ))}
          </div>
        )}
        <label className="inline-flex cursor-pointer items-center gap-2 rounded border border-neutral-300 px-3 py-2 text-sm text-neutral-700 hover:bg-neutral-50">
          <input
            type="file"
            accept="image/jpeg,image/png,image/webp,image/gif,image/avif"
            disabled={uploading}
            onChange={handleFileChange}
            className="sr-only"
          />
          {uploading ? "Uploading…" : "Upload image"}
        </label>
        {uploadError && <p className="text-sm text-red-600">{uploadError}</p>}
      </div>

      <button
        type="submit"
        disabled={pending}
        className="w-full rounded bg-neutral-900 py-2 text-white disabled:opacity-50"
      >
        {pending
          ? isEdit
            ? "Saving…"
            : "Creating…"
          : isEdit
            ? "Save changes"
            : "Create product"}
      </button>
    </form>
  );
}