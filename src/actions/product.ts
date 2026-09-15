"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { requireSeller } from "@/lib/permissions";

const schema = z.object({
  name: z.string().min(3).max(100),
  description: z.string().min(10),
  price: z.coerce.number().int().min(100),
  stock: z.coerce.number().int().min(0),
  categoryId: z.string().optional(),
});

function slugify(s: string) {
  return s.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
}

export async function createProduct(formData: FormData) {
  const { user } = await requireSeller();
  const parsed = schema.parse(Object.fromEntries(formData));
  const store = await db.store.findUnique({ where: { ownerId: user.id } });
  if (!store) throw new Error("No store");

  const slug = `${slugify(parsed.name)}-${Date.now().toString(36)}`;
  await db.product.create({
    data: { ...parsed, slug, storeId: store.id, images: [] },
  });
  revalidatePath("/seller/products");
}

export async function togglePublish(productId: string) {
  const { user } = await requireSeller();
  const product = await db.product.findUnique({
    where: { id: productId },
    include: { store: true },
  });
  if (!product || product.store.ownerId !== user.id) throw new Error("Not yours");
  await db.product.update({
    where: { id: productId },
    data: { isPublished: !product.isPublished },
  });
  revalidatePath("/seller/products");
  revalidatePath("/");
}
