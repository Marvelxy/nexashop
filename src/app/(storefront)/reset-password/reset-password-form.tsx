"use client";

import { useActionState } from "react";
import Link from "next/link";
import { resetPassword, type AuthState } from "@/actions/auth";

const initialState: AuthState = {};

export function ResetPasswordForm({ token }: { token: string }) {
  const [state, formAction, pending] = useActionState(resetPassword, initialState);

  return (
    <div className="mx-auto max-w-md space-y-6">
      <h1 className="text-2xl font-bold">Choose a new password</h1>

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
        <input type="hidden" name="token" value={token} />
        <label className="block text-sm">
          New password
          <input
            name="password"
            type="password"
            autoComplete="new-password"
            required
            minLength={8}
            className="mt-1 w-full rounded border px-3 py-2"
          />
        </label>
        <button
          type="submit"
          disabled={pending}
          className="w-full rounded bg-neutral-900 py-2 text-white disabled:opacity-50"
        >
          {pending ? "Updating…" : "Set new password"}
        </button>
      </form>

      {state.error && !state.success && (
        <p className="text-sm">
          Request a new one:{" "}
          <Link href="/forgot-password" className="underline">
            send another reset link
          </Link>
        </p>
      )}
    </div>
  );
}