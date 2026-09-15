"use server";

import { revalidatePath } from "next/cache";
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