import { redirect } from "next/navigation";
import Link from "next/link";
import { currentUser } from "@/lib/permissions";
import { createStore } from "@/actions/store";

export default async function BecomeSellerPage() {
  const user = await currentUser();
  if (!user) redirect("/login?callbackUrl=/become-seller");
  if (user.role === "SELLER" || user.role === "ADMIN") redirect("/seller/products");

  return (
    <div className="mx-auto max-w-md space-y-6">
      <h1 className="text-2xl font-bold">Become a seller</h1>
      <p className="text-sm text-neutral-600">
        Create your store. It goes live on the marketplace once an admin approves
        it. Until then you can manage products privately.
      </p>

      <form action={createStore} className="space-y-3 rounded border p-4">
        <label className="block text-sm">
          Store name
          <input
            name="name"
            type="text"
            required
            minLength={3}
            maxLength={60}
            className="mt-1 w-full rounded border px-3 py-2"
          />
        </label>
        <label className="block text-sm">
          Description
          <textarea
            name="description"
            rows={3}
            maxLength={300}
            className="mt-1 w-full rounded border px-3 py-2"
          />
        </label>
        <button type="submit" className="w-full rounded bg-neutral-900 py-2 text-white">
          Create my store
        </button>
      </form>

      <p className="text-sm">
        Changed your mind?{" "}
        <Link href="/" className="underline">
          Back to shopping
        </Link>
      </p>
    </div>
  );
}