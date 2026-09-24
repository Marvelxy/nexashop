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
    <form action={formAction} className="flex flex-wrap items-center gap-2">
      <input type="hidden" name="productId" value={productId} />
      <span className="flex items-center rounded-full border border-neutral-200 bg-white">
        <input
          name="qty"
          type="number"
          min={0}
          max={Math.min(max, 99)}
          defaultValue={qty}
          aria-label="Quantity"
          className="w-16 bg-transparent px-3 py-1.5 text-center text-sm focus:outline-none"
        />
      </span>
      <button
        type="submit"
        disabled={pending}
        className="rounded-full border border-neutral-200 px-3.5 py-1.5 text-xs font-medium transition hover:border-neutral-900 disabled:opacity-50"
      >
        {pending ? "Saving…" : "Update"}
      </button>
      {state.error && <span className="w-full text-xs text-red-600">{state.error}</span>}
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
        aria-label="Remove item"
        className="rounded-full p-1.5 text-neutral-400 transition hover:bg-red-50 hover:text-red-600 disabled:opacity-50"
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
          <path d="M3 6h18" /><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6" /><path d="M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
        </svg>
      </button>
    </form>
  );
}
