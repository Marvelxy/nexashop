import { redirect } from "next/navigation";
import Link from "next/link";
import { db } from "@/lib/db";
import { currentUser } from "@/lib/permissions";
import { ProductForm } from "@/components/product-form";

export default async function NewProductPage() {
  const user = await currentUser();
  if (!user) redirect("/login?callbackUrl=/seller/products/new");
  if (user.role !== "SELLER" && user.role !== "ADMIN") redirect("/become-seller");

  const store = await db.store.findUnique({ where: { ownerId: user.id } });
  if (!store) redirect("/seller/products");

  const categories = await db.category.findMany({ orderBy: { name: "asc" } });

  return (
    <div className="mx-auto max-w-xl space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold">Add product</h1>
        <Link href="/seller/products" className="text-sm underline">
          Back to products
        </Link>
      </div>

      <ProductForm categories={categories} />
    </div>
  );
}