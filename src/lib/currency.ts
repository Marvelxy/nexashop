/**
 * Shop-wide currency internationalization.
 *
 * Single default currency configured via env (no DB migration):
 *   NEXT_PUBLIC_DEFAULT_CURRENCY="NGN" (also accepts NEXT_PUBLIC_CURRENCY)
 *   NEXT_PUBLIC_DEFAULT_LOCALE="en-NG"  (optional; falls back per-currency)
 *   NEXT_PUBLIC_FREE_SHIPPING_THRESHOLD_CENTS="5000"
 *
 * Prices are stored as integer minor units (cents for USD/EUR/GBP,
 * whole units for zero-decimal currencies like JPY/KRW per Stripe).
 */

export const SUPPORTED_CURRENCIES = [
  "NGN",
  "USD",
  "GBP",
  "EUR",
] as const;

export type SupportedCurrency = (typeof SUPPORTED_CURRENCIES)[number];

/** Cookie storing the buyer's display-currency preference. */
export const CURRENCY_COOKIE_NAME = "nexashop_currency";

/** Currencies with no minor units (Stripe zero-decimal list). */
const ZERO_DECIMAL_CURRENCIES = new Set([
  "BIF",
  "CLP",
  "DJF",
  "GNF",
  "JPY",
  "KMF",
  "KRW",
  "MGA",
  "PYG",
  "RWF",
  "UGX",
  "VND",
  "VUV",
  "XAF",
  "XOF",
  "XPF",
]);

/** Sensible default display locale per currency. */
const CURRENCY_TO_LOCALE: Record<string, string> = {
  NGN: "en-NG",
  USD: "en-US",
  GBP: "en-GB",
  EUR: "de-DE",
};

const FALLBACK_CURRENCY = "NGN";
const FALLBACK_LOCALE = "en-NG";

function readEnv(key: string): string | undefined {
  try {
    const v =
      (typeof process !== "undefined" ? process.env?.[key] : undefined) ??
      (typeof import.meta !== "undefined"
        ? (import.meta as unknown as { env?: Record<string, string> }).env?.[key]
        : undefined);
    return typeof v === "string" && v.length > 0 ? v : undefined;
  } catch {
    return undefined;
  }
}

function isValidIsoCode(code: string): boolean {
  return /^[A-Z]{3}$/.test(code);
}

function isIntlCurrencySupported(code: string): boolean {
  try {
    new Intl.NumberFormat(FALLBACK_LOCALE, {
      style: "currency",
      currency: code,
    });
    return true;
  } catch {
    return false;
  }
}

/** Normalize any input to a valid ISO 4217 code, falling back to default. */
export function normalizeCurrencyCode(code?: string | null): string {
  const fallbackRaw =
    readEnv("NEXT_PUBLIC_DEFAULT_CURRENCY") ??
    readEnv("NEXT_PUBLIC_CURRENCY") ??
    FALLBACK_CURRENCY;
  const fallback = fallbackRaw.trim().toUpperCase();
  const safeFallback =
    isValidIsoCode(fallback) && isIntlCurrencySupported(fallback)
      ? fallback
      : FALLBACK_CURRENCY;

  if (code == null) return safeFallback;
  const normalized = String(code).trim().toUpperCase();
  if (!isValidIsoCode(normalized)) return safeFallback;
  if (!isIntlCurrencySupported(normalized)) return safeFallback;
  return normalized;
}

/** Shop-wide default currency (env-configurable). */
export function getDefaultCurrency(): string {
  return normalizeCurrencyCode(undefined);
}

export function isSupportedCurrency(code?: string | null): boolean {
  if (code == null) return false;
  const normalized = String(code).trim().toUpperCase();
  if (!isValidIsoCode(normalized)) return false;
  return (
    (SUPPORTED_CURRENCIES as readonly string[]).includes(normalized) ||
    isIntlCurrencySupported(normalized)
  );
}

/** 0 for zero-decimal currencies (JPY...), 2 for everything else. */
export function getCurrencyDecimals(currency?: string | null): 0 | 2 {
  const code = normalizeCurrencyCode(currency ?? getDefaultCurrency());
  return ZERO_DECIMAL_CURRENCIES.has(code) ? 0 : 2;
}

/** Resolve display locale: explicit > env > per-currency map > en-US. */
export function getCurrencyLocale(
  currency?: string | null,
  locale?: string | null,
): string {
  if (locale?.trim()) {
    try {
      new Intl.NumberFormat(locale.trim());
      return locale.trim();
    } catch {
      // fall through to defaults
    }
  }
  const envLocale = readEnv("NEXT_PUBLIC_DEFAULT_LOCALE")?.trim();
  if (envLocale) {
    try {
      new Intl.NumberFormat(envLocale);
      return envLocale;
    } catch {
      // fall through
    }
  }
  const code = normalizeCurrencyCode(currency ?? getDefaultCurrency());
  return CURRENCY_TO_LOCALE[code] ?? FALLBACK_LOCALE;
}

export type FormatPriceOptions = {
  currency?: string | null;
  locale?: string | null;
};

/**
 * Format an integer minor-units amount (cents, or whole units for
 * zero-decimal currencies) using Intl.NumberFormat.
 *
 * Backwards compatible: formatPrice(1999, "USD") and
 * formatPrice(1999, { currency: "EUR", locale: "de-DE" }) both work.
 */
export function formatPrice(
  minorUnits: number,
  currencyOrOptions?: string | FormatPriceOptions | null,
  locale?: string | null,
): string {
  const opts: FormatPriceOptions =
    typeof currencyOrOptions === "string" || currencyOrOptions == null
      ? { currency: currencyOrOptions, locale }
      : currencyOrOptions;

  const currency = normalizeCurrencyCode(
    opts.currency ?? getDefaultCurrency(),
  );
  const resolvedLocale = getCurrencyLocale(currency, opts.locale ?? locale);
  const decimals = getCurrencyDecimals(currency);
  const major = minorUnits / 10 ** decimals;

  try {
    return new Intl.NumberFormat(resolvedLocale, {
      style: "currency",
      currency,
    }).format(major);
  } catch {
    return new Intl.NumberFormat(FALLBACK_LOCALE, {
      style: "currency",
      currency: FALLBACK_CURRENCY,
    }).format(minorUnits / 100);
  }
}

/** Format a major-units amount (e.g. 19.99) directly. */
export function formatMajorAmount(
  major: number,
  currency?: string | null,
  locale?: string | null,
): string {
  const code = normalizeCurrencyCode(currency ?? getDefaultCurrency());
  return formatPrice(toMinorUnits(major, code), code, locale);
}

/** Convert major units (19.99) -> minor units (1999). Handles zero-decimal. */
export function toMinorUnits(
  major: number | string,
  currency?: string | null,
): number {
  const code = normalizeCurrencyCode(currency ?? getDefaultCurrency());
  const decimals = getCurrencyDecimals(code);
  const n = typeof major === "string" ? Number(major) : major;
  if (!Number.isFinite(n)) throw new Error("Invalid price amount");
  return Math.round(n * 10 ** decimals);
}

/** Convert minor units (1999) -> major units (19.99). Handles zero-decimal. */
export function fromMinorUnits(
  minorUnits: number,
  currency?: string | null,
): number {
  const code = normalizeCurrencyCode(currency ?? getDefaultCurrency());
  return minorUnits / 10 ** getCurrencyDecimals(code);
}

/**
 * Parse seller-typed price input ("19.99" / 19.99) into minor units.
 * Throws on non-finite, zero, or negative input.
 */
export function parsePriceToCents(
  input: string | number,
  currency?: string | null,
): number {
  const code = normalizeCurrencyCode(currency ?? getDefaultCurrency());
  const n = typeof input === "string" ? Number(input.trim()) : input;
  if (!Number.isFinite(n) || n <= 0) throw new Error("Invalid price amount");
  return toMinorUnits(n, code);
}

/** Lowercase code for Stripe API calls. */
export function getStripeCurrency(currency?: string | null): string {
  return normalizeCurrencyCode(
    currency ?? getDefaultCurrency(),
  ).toLowerCase();
}

/** Narrow currency symbol, e.g. "$", "€", "£", "¥". Falls back to code. */
export function getCurrencySymbol(
  currency?: string | null,
  locale?: string | null,
): string {
  const code = normalizeCurrencyCode(currency ?? getDefaultCurrency());
  const resolvedLocale = getCurrencyLocale(code, locale);
  try {
    const parts = new Intl.NumberFormat(resolvedLocale, {
      style: "currency",
      currency: code,
    }).formatToParts(0);
    return parts.find((p) => p.type === "currency")?.value ?? code;
  } catch {
    return code;
  }
}

/** Options list for a future currency selector UI. */
export function getCurrencyOptions(
  locale?: string | null,
): { code: string; symbol: string; locale: string; label: string }[] {
  return SUPPORTED_CURRENCIES.map((code) => {
    const symbol = getCurrencySymbol(code, locale);
    const l = getCurrencyLocale(code, locale);
    return {
      code,
      symbol,
      locale: l,
      label: `${code} (${symbol})`,
    };
  });
}

/** Free-shipping threshold in minor units (env-configurable). */
export function getFreeShippingThresholdCents(): number {
  const raw = readEnv("NEXT_PUBLIC_FREE_SHIPPING_THRESHOLD_CENTS");
  const n = raw != null ? Number(raw) : NaN;
  if (Number.isFinite(n) && n > 0) return Math.round(n);
  return 5000;
}

/** Region (ISO 3166) -> currency for auto-detection. */
const REGION_TO_CURRENCY: Record<string, string> = {
  NG: "NGN",
  US: "USD",
  GB: "GBP",
  // Eurozone + euroized regions
  DE: "EUR",
  FR: "EUR",
  ES: "EUR",
  IT: "EUR",
  NL: "EUR",
  BE: "EUR",
  AT: "EUR",
  IE: "EUR",
  PT: "EUR",
  GR: "EUR",
  FI: "EUR",
  SK: "EUR",
  SI: "EUR",
  EE: "EUR",
  LV: "EUR",
  LT: "EUR",
  CY: "EUR",
  MT: "EUR",
  LU: "EUR",
  HR: "EUR",
};

/** Language (ISO 639) -> currency fallback when the tag has no region. */
const LANGUAGE_TO_CURRENCY: Record<string, string> = {
  en: "USD",
  de: "EUR",
  fr: "EUR",
  es: "EUR",
  it: "EUR",
  nl: "EUR",
  pt: "EUR",
  el: "EUR",
  fi: "EUR",
  ga: "EUR",
  et: "EUR",
  lv: "EUR",
  lt: "EUR",
  sk: "EUR",
  sl: "EUR",
  mt: "EUR",
  ca: "EUR",
  eu: "EUR",
  gl: "EUR",
  // Nigerian languages
  yo: "NGN",
  ig: "NGN",
  ha: "NGN",
};

function supportedOnly(code: string | null): string | null {
  if (!code) return null;
  return (SUPPORTED_CURRENCIES as readonly string[]).includes(code)
    ? code
    : null;
}

/**
 * Guess a display currency from a BCP 47 locale tag
 * (e.g. "de-DE", "ja-JP", "en-GB", "fr").
 * Returns null when nothing maps to a supported currency.
 */
export function currencyFromLocale(locale?: string | null): string | null {
  if (!locale) return null;
  const tag = String(locale).trim().replace(/_/g, "-");
  if (!tag) return null;
  const parts = tag.split("-");
  const region = parts.length > 1 ? parts[parts.length - 1]?.toUpperCase() : undefined;
  if (region && REGION_TO_CURRENCY[region]) {
    return supportedOnly(REGION_TO_CURRENCY[region]);
  }
  const language = parts[0]?.toLowerCase();
  if (language && LANGUAGE_TO_CURRENCY[language]) {
    return supportedOnly(LANGUAGE_TO_CURRENCY[language]);
  }
  return null;
}

/**
 * Pick a display currency from an Accept-Language header value,
 * honouring q-values. Returns null when nothing matches.
 */
export function currencyFromAcceptLanguage(
  header?: string | null,
): string | null {
  if (!header) return null;
  const ranges = String(header)
    .split(",")
    .map((entry) => {
      const [tag, ...params] = entry.trim().split(";");
      let q = 1;
      for (const p of params) {
        const m = p.trim().match(/^q=([0-9.]+)$/);
        if (m) q = Number(m[1]);
      }
      return { tag: tag.trim(), q: Number.isFinite(q) ? q : 0 };
    })
    .filter((r) => r.tag && r.tag !== "*" && r.q > 0)
    .sort((a, b) => b.q - a.q);
  for (const r of ranges) {
    const code = currencyFromLocale(r.tag);
    if (code) return code;
  }
  return null;
}

export type ResolveDisplayCurrencyInput = {
  /** Raw cookie value (already extracted server-side). */
  cookie?: string | null;
  /** Raw Accept-Language header value. */
  acceptLanguage?: string | null;
  /** Shop default override (defaults to env). */
  defaultCurrency?: string | null;
};

/**
 * Resolve the buyer's display currency (pure, testable):
 * explicit cookie > Accept-Language guess > shop default.
 * Note: display only — charging still uses the shop default currency.
 */
export function resolveDisplayCurrency(
  input?: ResolveDisplayCurrencyInput,
): string {
  const fallback = normalizeCurrencyCode(
    input?.defaultCurrency ?? getDefaultCurrency(),
  );
  const cookieCode = input?.cookie?.trim().toUpperCase();
  if (
    cookieCode &&
    (SUPPORTED_CURRENCIES as readonly string[]).includes(cookieCode)
  ) {
    return cookieCode;
  }
  return (
    currencyFromAcceptLanguage(input?.acceptLanguage) ?? fallback
  );
}
