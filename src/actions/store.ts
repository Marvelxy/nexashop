"use server";

import { z } from "zod";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { currentUser } from "@/lib/permissions";

const schema = z.object({
  name: z.string().trim().min(3).max(60),
  description: z.string().trim().max(300).optional(),
});

function slugify(s: string) {
  return s.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
}

export async function createStore(formData: FormData) {
  const user = await currentUser();
  if (!user) throw new Error("Sign in required");

  const existing = await db.store.findUnique({ where: { ownerId: user.id } });
  if (existing) redirect("/seller/products");

  const parsed = schema.parse(Object.fromEntries(formData));
  const slug = `${slugify(parsed.name)}-${Date.now().toString(36)}`;

  await db.store.create({
    data: {
      name: parsed.name,
      description: parsed.description,
      slug,
      ownerId: user.id,
      isApproved: false,
    },
  });

  if (user.role === "BUYER") {
    await db.user.update({ where: { id: user.id }, data: { role: "SELLER" } });
  }

  revalidatePath("/seller/products");
  revalidatePath("/");
  redirect("/seller/products");
}