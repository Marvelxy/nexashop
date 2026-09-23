"use client";

import { useActionState } from "react";
import {
  updateCartItem,
  removeFromCart,
  type CartState,
} from "@/actions/cart";

const initialState: CartState = {};

export function CartQtyForm({
  productId,
  qty,
  max,
}: {
  productId: string;
  qty: number;
  max: number;
}) {
  const [state, formAction, pending] = useActionState(
    updateCartItem,
    initialState,
  );

  return (
    <form action={formAction} className="flex items-center gap-2">
      <input type="hidden" name="productId" value={productId} />
      <input
        name="qty"
        type="number"
        min={0}
        max={Math.min(max, 99)}
        defaultValue={qty}
        aria-label="Quantity"
        className="w-20 rounded border px-2 py-1 text-sm"
      />
      <button
        type="submit"
        disabled={pending}
        className="rounded border px-3 py-1 text-sm hover:bg-neutral-50 disabled:opacity-50"
      >
        {pending ? "Saving…" : "Update"}
      </button>
      {state.error && <span className="text-xs text-red-600">{state.error}</span>}
    </form>
  );
}

export function CartRemoveButton({ productId }: { productId: string }) {
  const [, formAction, pending] = useActionState(removeFromCart, initialState);

  return (
    <form action={formAction}>
      <input type="hidden" name="productId" value={productId} />
      <button
        type="submit"
        disabled={pending}
        className="text-sm text-red-600 hover:underline disabled:opacity-50"
      >
        {pending ? "Removing…" : "Remove"}
      </button>
    </form>
  );
}
