"use client";

import { useActionState } from "react";
import { createCheckoutSession, type CheckoutState } from "@/actions/checkout";

const initialState: CheckoutState = {};

export function CheckoutForm({ stripeConfigured }: { stripeConfigured: boolean }) {
  const [state, formAction, pending] = useActionState(createCheckoutSession, initialState);

  return (
    <form action={formAction} className="space-y-3">
      {state.error && (
        <p className="rounded border border-red-300 bg-red-50 p-3 text-sm text-red-800">
          {state.error}
        </p>
      )}
      {!stripeConfigured && (
        <p className="rounded border border-amber-300 bg-amber-50 p-3 text-sm text-amber-800">
          Stripe is not configured — checking out will place a test order
          immediately without payment.
        </p>
      )}
      <button
        type="submit"
        disabled={pending}
        className="w-full rounded bg-neutral-900 py-2 text-white disabled:opacity-50"
      >
        {pending
          ? "Starting payment…"
          : stripeConfigured
            ? "Pay with Stripe"
            : "Place test order"}
      </button>
    </form>
  );
}
