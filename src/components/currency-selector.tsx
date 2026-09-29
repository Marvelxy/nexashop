"use client";

import { useEffect, useRef, useTransition } from "react";
import { useRouter } from "next/navigation";
import { setCurrencyPreference } from "@/actions/currency";
import {
  CURRENCY_COOKIE_NAME,
  currencyFromLocale,
  getCurrencyOptions,
} from "@/lib/currency";

/**
 * Buyer-facing currency dropdown.
 *
 * - Manual choice persists via the `nexashop_currency` cookie (server action,
 *   works without JS through the surrounding form).
 * - On first visit (no cookie yet) the browser locale is auto-detected and
 *   persisted, so prices match the shopper without any clicks.
 */
export function CurrencySelector({
  value,
  className,
}: {
  value: string;
  className?: string;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const autoTried = useRef(false);

  useEffect(() => {
    if (autoTried.current) return;
    autoTried.current = true;
    const hasCookie = document.cookie
      .split(";")
      .some((c) => c.trim().startsWith(`${CURRENCY_COOKIE_NAME}=`));
    if (hasCookie) return;
    const detected =
      typeof navigator !== "undefined"
        ? currencyFromLocale(navigator.language)
        : null;
    if (detected && detected !== value) {
      startTransition(async () => {
        await setCurrencyPreference(detected);
        router.refresh();
      });
    }
  }, [value, router]);

  const options = getCurrencyOptions();

  return (
    <form
      action={async (formData: FormData) => {
        startTransition(async () => {
          await setCurrencyPreference(formData);
          router.refresh();
        });
      }}
      className="inline-flex items-center"
    >
      <label htmlFor="currency-selector" className="sr-only">
        Display currency
      </label>
      <select
        key={value}
        id="currency-selector"
        name="currency"
        defaultValue={value}
        disabled={pending}
        onChange={(e) => e.currentTarget.form?.requestSubmit()}
        aria-label="Display currency"
        className={
          className ??
          "cursor-pointer rounded-full border border-neutral-700 bg-neutral-950 px-2 py-1 text-xs text-neutral-200 transition hover:border-neutral-500 hover:text-white disabled:opacity-50"
        }
      >
        {options.map((o) => (
          <option key={o.code} value={o.code}>
            {o.code} ({o.symbol})
          </option>
        ))}
      </select>
    </form>
  );
}
