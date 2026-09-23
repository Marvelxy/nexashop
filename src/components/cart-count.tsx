import { getCartCount } from "@/lib/cart";

export async function CartCount() {
  const count = await getCartCount();
  if (count === 0) return <span>Cart</span>;
  return (
    <span>
      Cart{" "}
      <span
        aria-label={`${count} items in cart`}
        className="ml-1 rounded-full bg-neutral-900 px-2 py-0.5 text-xs text-white"
      >
        {count}
      </span>
    </span>
  );
}
