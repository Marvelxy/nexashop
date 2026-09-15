"use server";

import { z } from "zod";
import { db } from "@/lib/db";
import { requireUser } from "@/lib/permissions";

const schema = z.object({
  productId: z.string(),
  rating: z.coerce.number().min(1).max(5),
  comment: z.string().max(1000).optional(),
});

export async function upsertReview(formData: FormData) {
  const { user } = await requireUser();
  const userId = user.id;
  const parsed = schema.parse(Object.fromEntries(formData));

  // Only buyers who paid can review - simplified: must have PAID order containing product
  const paid = await db.order.findFirst({
    where: {
      buyerId: userId,
      status: { in: ["PAID", "SHIPPED", "DELIVERED"] },
      items: { some: { productId: parsed.productId } },
    },
  });
  if (!paid) throw new Error("Buy first to review");

  await db.review.upsert({
    where: { productId_userId: { productId: parsed.productId, userId } },
    update: { rating: parsed.rating, comment: parsed.comment },
    create: { ...parsed, userId },
  });
}
