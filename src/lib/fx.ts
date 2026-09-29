/**
 * Live FX conversion for display prices.
 *
 * Rates come from fawazahmed0/currency-api (open source, MIT-licensed data
 * aggregation; free keyless CDN, updated daily):
 *   https://github.com/fawazahmed0/currency-api
 *   https://cdn.jsdelivr.net/npm/@fawazahmed0/currency-api@latest/v1/currencies/<base>.json
 *
 * Payload shape: `{ "date": "2026-09-28", "<base>": { "usd": 0.00075, ... } }`
 * where each value is target units per 1 base unit.
 *
 * Display only — orders and Stripe charges always use shop-minor units.
 */

import { getCurrencyDecimals, getDefaultCurrency } from "./currency";

export type FxRates = {
  /** Shop currency the rates are quoted per (uppercase ISO code). */
  base: string;
  date?: string;
  /** Target units per 1 base unit, keyed by uppercase ISO code. */
  rates: Record<string, number>;
};

const DEFAULT_FX_API_BASE_URL =
  "https://cdn.jsdelivr.net/npm/@fawazahmed0/currency-api@latest/v1/currencies";

const FX_TIMEOUT_MS = 5_000;
const FX_TTL_MS = 12 * 60 * 60 * 1_000; // 12 hours

function fxApiBaseUrl(): string {
  const override =
    typeof process !== "undefined"
      ? process.env?.FX_API_BASE_URL?.trim()
      : undefined;
  return (override || DEFAULT_FX_API_BASE_URL).replace(/\/+$/, "");
}

let cached: { at: number; rates: FxRates } | null = null;

/** Test hook: drop the in-memory rates cache. */
export function __clearFxCache(): void {
  cached = null;
}

/** `https://…/v1/currencies/ngn.json` */
export function buildFxUrl(base: string, apiBase = fxApiBaseUrl()): string {
  return `${apiBase.replace(/\/+$/, "")}/${base.trim().toLowerCase()}.json`;
}

/** Normalize one API payload into per-base rates. Null on bad shape. */
export function parseFxPayload(payload: unknown, base: string): FxRates | null {
  if (!payload || typeof payload !== "object") return null;
  const record = payload as Record<string, unknown>;
  const table = record[base.trim().toLowerCase()];
  if (!table || typeof table !== "object") return null;
  const rates: Record<string, number> = {};
  for (const [code, value] of Object.entries(
    table as Record<string, unknown>,
  )) {
    if (typeof value === "number" && Number.isFinite(value) && value > 0) {
      rates[code.toUpperCase()] = value;
    }
  }
  if (Object.keys(rates).length === 0) return null;
  const upper = base.trim().toUpperCase();
  if (!rates[upper]) rates[upper] = 1;
  return {
    base: upper,
    date: typeof record.date === "string" ? record.date : undefined,
    rates,
  };
}

async function fetchJson(url: string): Promise<unknown | null> {
  try {
    const res = await fetch(url, { signal: AbortSignal.timeout(FX_TIMEOUT_MS) });
    if (!res.ok) return null;
    return (await res.json()) as unknown;
  } catch {
    return null;
  }
}

/** Rebase USD-quoted rates to shop-quoted rates. Null when impossible. */
export function rebaseRatesToShop(
  usdRates: FxRates,
  shop: string,
): FxRates | null {
  const upper = shop.toUpperCase();
  const perUsd = usdRates.rates[upper];
  if (!Number.isFinite(perUsd) || (perUsd as number) <= 0) return null;
  const rates: Record<string, number> = {};
  for (const [code, value] of Object.entries(usdRates.rates)) {
    rates[code] = value / (perUsd as number);
  }
  return { base: upper, date: usdRates.date, rates };
}

/**
 * Rates per 1 shop-default unit, cached in-memory for 12h.
 * Falls back to the USD file (cross-converted) when the shop-base file
 * is missing. Null when the API is unreachable — callers must degrade
 * gracefully to unconverted display.
 */
export async function getFxRates(
  shopDefault?: string | null,
): Promise<FxRates | null> {
  const shop = (shopDefault ?? getDefaultCurrency()).trim().toUpperCase();
  const now = Date.now();
  if (cached && cached.rates.base === shop && now - cached.at < FX_TTL_MS) {
    return cached.rates;
  }

  const direct = parseFxPayload(await fetchJson(buildFxUrl(shop)), shop);
  if (direct) {
    cached = { at: now, rates: direct };
    return direct;
  }

  if (shop !== "USD") {
    const usd = parseFxPayload(await fetchJson(buildFxUrl("USD")), "USD");
    const rebased = usd ? rebaseRatesToShop(usd, shop) : null;
    if (rebased) {
      cached = { at: now, rates: rebased };
      return rebased;
    }
  }
  return null;
}

/**
 * Convert shop-minor units -> display-minor units (pure).
 * Rounds to the display currency's decimals. Throws when no rate exists.
 */
export function convertShopMinorToDisplay(
  shopMinor: number,
  display: string,
  rates: FxRates,
): number {
  const to = display.trim().toUpperCase();
  if (rates.base.toUpperCase() === to) return Math.round(shopMinor);
  const rate = rates.rates[to];
  if (!Number.isFinite(rate) || rate <= 0) {
    throw new Error(`No FX rate for ${to}`);
  }
  const fromMajor = shopMinor / 10 ** getCurrencyDecimals(rates.base);
  const toMajor = fromMajor * rate;
  return Math.round(toMajor * 10 ** getCurrencyDecimals(to));
}
