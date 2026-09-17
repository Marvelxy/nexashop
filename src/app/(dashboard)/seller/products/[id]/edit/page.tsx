import { redirect, notFound } from "next/navigation";
import Link from "next/link";
import { db } from "@/lib/db";
import { currentUser } from "@/lib/permissions";
import { ProductForm } from "@/components/product-form";

export default async function EditProductPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const user = await currentUser();
  if (!user) redirect(`/login?callbackUrl=/seller/products/${id}/edit`);
  if (user.role !== "SELLER" && user.role !== "ADMIN") redirect("/become-seller");

  const product = await db.product.findUnique({
    where: { id },
    include: { store: true },
  });
  if (!product) notFound();
  if (user.role !== "ADMIN" && product.store.ownerId !== user.id) {
    redirect("/seller/products");
  }

  const categories = await db.category.findMany({ orderBy: { name: "asc" } });

  return (
    <div className="mx-auto max-w-xl space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold">Edit product</h1>
        <Link
          href={user.role === "ADMIN" ? "/admin/products" : "/seller/products"}
          className="text-sm underline"
        >
          Back to products
        </Link>
      </div>

      <ProductForm
        categories={categories}
        product={{
          id: product.id,
          name: product.name,
          description: product.description,
          price: product.price / 100,
          stock: product.stock,
          images: Array.isArray(product.images)
            ? (product.images as string[])
            : [],
          categoryId: product.categoryId,
        }}
      />
    </div>
  );
}