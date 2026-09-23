"use client";

import { useActionState, useState } from "react";
import { addToCart, type CartState } from "@/actions/cart";

const initialState: CartState = {};

export function AddToCartForm({
  productId,
  stock,
}: {
  productId: string;
  stock: number;
}) {
  const [state, formAction, pending] = useActionState(addToCart, initialState);
  const [qty, setQty] = useState(1);
  const outOfStock = stock < 1;

  return (
    <form action={formAction} className="space-y-2">
      <input type="hidden" name="productId" value={productId} />
      <div className="flex items-center gap-2">
        <label className="text-sm">
          Qty
          <input
            name="qty"
            type="number"
            min={1}
            max={Math.min(stock, 99)}
            value={qty}
            onChange={(e) => setQty(Math.max(1, Number(e.target.value) || 1))}
            disabled={outOfStock || pending}
            className="ml-2 w-20 rounded border px-2 py-1"
          />
        </label>
        <button
          type="submit"
          disabled={outOfStock || pending}
          className="rounded bg-neutral-900 px-4 py-2 text-sm text-white disabled:opacity-50"
        >
          {outOfStock ? "Out of stock" : pending ? "Adding…" : "Add to cart"}
        </button>
      </div>
      {state.error && <p className="text-sm text-red-600">{state.error}</p>}
      {state.success && <p className="text-sm text-green-700">{state.success}</p>}
    </form>
  );
}

export function QuickAddButton({
  productId,
  disabled,
}: {
  productId: string;
  disabled?: boolean;
}) {
  const [state, formAction, pending] = useActionState(addToCart, initialState);

  return (
    <form action={formAction}>
      <input type="hidden" name="productId" value={productId} />
      <input type="hidden" name="qty" value="1" />
      <button
        type="submit"
        disabled={disabled || pending}
        aria-label="Add to cart"
        className="w-full rounded border px-3 py-1.5 text-sm hover:bg-neutral-50 disabled:opacity-50"
      >
        {pending ? "Adding…" : "Add to cart"}
      </button>
      {state.error && <p className="mt-1 text-xs text-red-600">{state.error}</p>}
    </form>
  );
}
