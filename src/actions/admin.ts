"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { db } from "@/lib/db";
import { requireAdmin } from "@/lib/permissions";

export async function approveStore(storeId: string) {
  await requireAdmin();
  await db.store.update({ where: { id: storeId }, data: { isApproved: true } });
  revalidatePath("/admin/stores");
  revalidatePath("/");
}

export async function removeStore(storeId: string) {
  await requireAdmin();
  await db.store.delete({ where: { id: storeId } });
  revalidatePath("/admin/stores");
  revalidatePath("/");
}

const orderStatuses = [
  "PENDING",
  "PAID",
  "SHIPPED",
  "DELIVERED",
  "CANCELLED",
  "REFUNDED",
] as const;

type OrderStatus = (typeof orderStatuses)[number];

const updateOrderSchema = z.object({
  id: z.string().min(1),
  status: z.enum(orderStatuses),
});

export type OrderActionState = { error?: string; success?: string };

const STOCK_DEDUCTED = ["PAID", "SHIPPED", "DELIVERED"] as const;
const STOCK_FREE = ["CANCELLED", "REFUNDED"] as const;

export async function updateOrderStatus(
  _prev: OrderActionState,
  formData: FormData,
): Promise<OrderActionState> {
  try {
    await requireAdmin();
  } catch {
    return { error: "Admin only" };
  }

  const parsed = updateOrderSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }
  const { id, status } = parsed.data;

  const order = await db.order.findUnique({
    where: { id },
    include: { items: true },
  });
  if (!order) return { error: "Order not found" };
  if (order.status === status) return { success: `Order already ${status}` };

  const hadStockDeducted = (STOCK_DEDUCTED as readonly string[]).includes(order.status);
  const needsRestore = (STOCK_FREE as readonly string[]).includes(status);
  const needsDeduct =
    (STOCK_DEDUCTED as readonly string[]).includes(status) && !hadStockDeducted;

  if (needsRestore && hadStockDeducted) {
    await db.$transaction([
      db.order.update({ where: { id }, data: { status: status as OrderStatus } }),
      ...order.items.map((item) =>
        db.product.update({
          where: { id: item.productId },
          data: { stock: { increment: item.quantity } },
        }),
      ),
    ]);
  } else if (needsDeduct) {
    // Guard against overselling when manually marking an unpaid order PAID.
    for (const item of order.items) {
      const product = await db.product.findUnique({ where: { id: item.productId } });
      if (!product || product.stock < item.quantity) {
        return { error: `Insufficient stock for ${product?.name ?? "an item"}` };
      }
    }
    await db.$transaction([
      db.order.update({ where: { id }, data: { status: status as OrderStatus } }),
      ...order.items.map((item) =>
        db.product.update({
          where: { id: item.productId },
          data: { stock: { decrement: item.quantity } },
        }),
      ),
    ]);
  } else {
    await db.order.update({ where: { id }, data: { status: status as OrderStatus } });
  }

  revalidatePath("/admin/orders");
  revalidatePath(`/admin/orders/${id}`);
  revalidatePath("/seller/orders");
  revalidatePath("/orders");
  return { success: `Order marked as ${status}` };
}