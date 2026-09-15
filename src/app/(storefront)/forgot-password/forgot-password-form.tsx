"use client";

import { useActionState } from "react";
import Link from "next/link";
import { requestPasswordReset, type AuthState } from "@/actions/auth";

const initialState: AuthState = {};

export function ForgotPasswordForm() {
  const [state, formAction, pending] = useActionState(requestPasswordReset, initialState);

  return (
    <div className="mx-auto max-w-md space-y-6">
      <h1 className="text-2xl font-bold">Reset your password</h1>
      <p className="text-sm text-neutral-600">
        Enter the email on your account and we&apos;ll send you a reset link.
      </p>

      {state.success && (
        <p className="rounded border border-green-300 bg-green-50 p-3 text-sm text-green-800">
          {state.success}
        </p>
      )}
      {state.error && (
        <p className="rounded border border-red-300 bg-red-50 p-3 text-sm text-red-800">
          {state.error}
        </p>
      )}

      <form action={formAction} className="space-y-3 rounded border p-4">
        <label className="block text-sm">
          Email
          <input
            name="email"
            type="email"
            autoComplete="email"
            required
            className="mt-1 w-full rounded border px-3 py-2"
          />
        </label>
        <button
          type="submit"
          disabled={pending}
          className="w-full rounded bg-neutral-900 py-2 text-white disabled:opacity-50"
        >
          {pending ? "Sending…" : "Send reset link"}
        </button>
      </form>

      <p className="text-sm">
        Remembered it?{" "}
        <Link href="/login" className="underline">
          Sign in
        </Link>
      </p>
    </div>
  );
}