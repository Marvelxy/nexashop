import { cache } from "react";
import { cookies, headers } from "next/headers";
import {
  CURRENCY_COOKIE_NAME,
  formatPrice,
  getDefaultCurrency,
  resolveDisplayCurrency,
} from "./currency";
import { convertShopMinorToDisplay, getFxRates } from "./fx";

/**
 * Buyer's display currency for this request (server-only):
 * `nexashop_currency` cookie > Accept-Language guess > shop default.
 *
 * Display only — Stripe charging always uses the shop default currency.
 * Cached per request.
 */
export const getDisplayCurrency = cache(async (): Promise<string> => {
  const [store, hdrs] = await Promise.all([cookies(), headers()]);
  return resolveDisplayCurrency({
    cookie: store.get(CURRENCY_COOKIE_NAME)?.value,
    acceptLanguage: hdrs.get("accept-language"),
    defaultCurrency: getDefaultCurrency(),
  });
});

/** True when the buyer is viewing prices in a non-shop currency. */
export async function isDisplayCurrencyOverridden(): Promise<boolean> {
  return (await getDisplayCurrency()) !== getDefaultCurrency();
}

/**
 * Format shop-minor units in the buyer's display currency with real FX
 * conversion (server-only). Skips the network when display === shop.
 * Degrades gracefully to unconverted display formatting when rates are
 * unavailable — never throws for FX reasons.
 */
export async function formatDisplayPrice(shopMinor: number): Promise<string> {
  const display = await getDisplayCurrency();
  const shop = getDefaultCurrency();
  if (display === shop) return formatPrice(shopMinor, shop);
  try {
    const fx = await getFxRates(shop);
    if (fx) {
      return formatPrice(
        convertShopMinorToDisplay(shopMinor, display, fx),
        display,
      );
    }
  } catch {
    // fall through to unconverted display
  }
  return formatPrice(shopMinor, display);
}
