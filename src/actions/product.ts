"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { requireSeller } from "@/lib/permissions";

export type ProductState = { error?: string; success?: string };

const baseSchema = z.object({
  name: z.string().min(3).max(100),
  description: z.string().min(10),
  price: z.coerce.number().min(1).transform((v) => Math.round(v * 100)),
  stock: z.coerce.number().int().min(0),
  categoryId: z.string().optional().transform((v) => v || undefined),
  images: z
    .string()
    .optional()
    .transform((v) => {
      if (!v) return [] as string[];
      try {
        const parsed: unknown = JSON.parse(v);
        return Array.isArray(parsed)
          ? parsed.filter((u): u is string => typeof u === "string")
          : [];
      } catch {
        return [] as string[];
      }
    }),
});

const createSchema = baseSchema;
const updateSchema = baseSchema.extend({ id: z.string().min(1) });

function slugify(s: string) {
  return s.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
}

export async function createProduct(
  _prev: ProductState,
  formData: FormData,
): Promise<ProductState> {
  const parsed = createSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }

  let user;
  try {
    ({ user } = await requireSeller());
  } catch {
    return { error: "You must be a seller to add products" };
  }

  const store = await db.store.findUnique({ where: { ownerId: user.id } });
  if (!store) return { error: "No store found. Create a store first." };

  const slug = `${slugify(parsed.data.name)}-${Date.now().toString(36)}`;
  await db.product.create({
    data: { ...parsed.data, slug, storeId: store.id },
  });

  revalidatePath("/seller/products");
  revalidatePath("/admin/products");
  return { success: "Product created" };
}

export async function updateProduct(
  _prev: ProductState,
  formData: FormData,
): Promise<ProductState> {
  const parsed = updateSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }

  let user;
  try {
    ({ user } = await requireSeller());
  } catch {
    return { error: "You must be a seller to update products" };
  }

  const existing = await db.product.findUnique({
    where: { id: parsed.data.id },
    include: { store: true },
  });
  if (!existing) return { error: "Product not found" };
  if (user.role !== "ADMIN" && existing.store.ownerId !== user.id) {
    return { error: "You can only update your own products" };
  }

  const { id, ...data } = parsed.data;
  await db.product.update({ where: { id }, data });

  revalidatePath("/seller/products");
  revalidatePath("/admin/products");
  revalidatePath("/");
  return { success: "Product updated" };
}

export async function togglePublish(productId: string): Promise<ProductState> {
  let user;
  try {
    ({ user } = await requireSeller());
  } catch {
    return { error: "You must be a seller to publish products" };
  }

  const product = await db.product.findUnique({
    where: { id: productId },
    include: { store: true },
  });
  if (!product) return { error: "Product not found" };
  if (user.role !== "ADMIN" && product.store.ownerId !== user.id) {
    return { error: "You can only publish your own products" };
  }

  await db.product.update({
    where: { id: productId },
    data: { isPublished: !product.isPublished },
  });

  revalidatePath("/seller/products");
  revalidatePath("/admin/products");
  revalidatePath("/");
  return { success: product.isPublished ? "Product set to draft" : "Product published" };
}
