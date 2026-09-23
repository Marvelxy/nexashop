"use client";

import { useActionState } from "react";
import { updateOrderStatus, type OrderActionState } from "@/actions/admin";

const initialState: OrderActionState = {};

const STATUSES = [
  "PENDING",
  "PAID",
  "SHIPPED",
  "DELIVERED",
  "CANCELLED",
  "REFUNDED",
] as const;

export function OrderStatusForm({
  orderId,
  current,
}: {
  orderId: string;
  current: string;
}) {
  const [state, formAction, pending] = useActionState(updateOrderStatus, initialState);

  return (
    <form action={formAction} className="flex flex-wrap items-center gap-2">
      <input type="hidden" name="id" value={orderId} />
      <label className="text-sm">
        Status{" "}
        <select
          name="status"
          defaultValue={current}
          className="rounded border px-2 py-1 text-sm"
        >
          {STATUSES.map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </select>
      </label>
      <button
        type="submit"
        disabled={pending}
        className="rounded bg-neutral-900 px-3 py-1 text-sm text-white disabled:opacity-50"
      >
        {pending ? "Saving…" : "Update"}
      </button>
      {state.error && <span className="text-sm text-red-600">{state.error}</span>}
      {state.success && (
        <span className="text-sm text-green-700">{state.success}</span>
      )}
    </form>
  );
}
