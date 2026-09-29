"use server";

import { revalidatePath } from "next/cache";
import { cookies } from "next/headers";
import {
  CURRENCY_COOKIE_NAME,
  SUPPORTED_CURRENCIES,
} from "@/lib/currency";

export type CurrencyState = { error?: string; success?: string };

function normalize(input: string): string {
  return input.trim().toUpperCase();
}

/**
 * Persist the buyer's display-currency preference.
 * Accepts a raw code (client call) or FormData (progressive-enhancement form).
 * Display only — Stripe charging always uses the shop default currency.
 */
export async function setCurrencyPreference(
  codeOrForm: string | FormData,
): Promise<CurrencyState> {
  const raw =
    typeof codeOrForm === "string"
      ? codeOrForm
      : String(codeOrForm.get("currency") ?? "");
  const code = normalize(raw);
  if (!(SUPPORTED_CURRENCIES as readonly string[]).includes(code)) {
    return { error: `Unsupported currency${raw ? `: ${raw}` : ""}` };
  }

  const store = await cookies();
  store.set(CURRENCY_COOKIE_NAME, code, {
    path: "/",
    maxAge: 60 * 60 * 24 * 365, // 1 year
    sameSite: "lax",
  });
  revalidatePath("/", "layout");
  return { success: code };
}
