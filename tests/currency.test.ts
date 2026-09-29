import { afterEach, describe, expect, it, vi } from "vitest";
import {
  formatMajorAmount,
  formatPrice,
  fromMinorUnits,
  getCurrencyDecimals,
  getCurrencyLocale,
  getCurrencyOptions,
  getCurrencySymbol,
  getDefaultCurrency,
  getFreeShippingThresholdCents,
  getStripeCurrency,
  isSupportedCurrency,
  normalizeCurrencyCode,
  parsePriceToCents,
  toMinorUnits,
} from "@/lib/currency";

afterEach(() => {
  vi.unstubAllEnvs();
});

describe("getDefaultCurrency", () => {
  it("defaults to NGN", () => {
    vi.stubEnv("NEXT_PUBLIC_DEFAULT_CURRENCY", "");
    vi.stubEnv("NEXT_PUBLIC_CURRENCY", "");
    expect(getDefaultCurrency()).toBe("NGN");
  });

  it("reads NEXT_PUBLIC_DEFAULT_CURRENCY (case-insensitive)", () => {
    vi.stubEnv("NEXT_PUBLIC_DEFAULT_CURRENCY", "eur");
    expect(getDefaultCurrency()).toBe("EUR");
  });

  it("falls back to NGN for invalid codes", () => {
    vi.stubEnv("NEXT_PUBLIC_DEFAULT_CURRENCY", "XX");
    vi.stubEnv("NEXT_PUBLIC_CURRENCY", "not-a-currency!!!");
    expect(getDefaultCurrency()).toBe("NGN");
  });
});

describe("normalizeCurrencyCode", () => {
  it("uppercases and trims", () => {
    expect(normalizeCurrencyCode("  usd ")).toBe("USD");
    expect(normalizeCurrencyCode("ngn")).toBe("NGN");
  });

  it("falls back to default for null/invalid input", () => {
    vi.stubEnv("NEXT_PUBLIC_DEFAULT_CURRENCY", "GBP");
    expect(normalizeCurrencyCode(null)).toBe("GBP");
    expect(normalizeCurrencyCode("")).toBe("GBP");
    expect(normalizeCurrencyCode("US")).toBe("GBP");
    expect(normalizeCurrencyCode("1234")).toBe("GBP");
  });
});

describe("isSupportedCurrency", () => {
  it("accepts the supported set case-insensitively", () => {
    expect(isSupportedCurrency("NGN")).toBe(true);
    expect(isSupportedCurrency("USD")).toBe(true);
    expect(isSupportedCurrency("eur")).toBe(true);
    expect(isSupportedCurrency("gbp")).toBe(true);
  });

  it("rejects garbage", () => {
    expect(isSupportedCurrency("")).toBe(false);
    expect(isSupportedCurrency("US")).toBe(false);
    expect(isSupportedCurrency("XXX1")).toBe(false);
    expect(isSupportedCurrency(null)).toBe(false);
  });
});

describe("getCurrencyDecimals", () => {
  it("returns 2 for every supported currency (NGN, USD, GBP, EUR)", () => {
    expect(getCurrencyDecimals("NGN")).toBe(2);
    expect(getCurrencyDecimals("USD")).toBe(2);
    expect(getCurrencyDecimals("GBP")).toBe(2);
    expect(getCurrencyDecimals("EUR")).toBe(2);
  });
});

describe("formatPrice", () => {
  it("formats USD cents in en-US by default", () => {
    vi.stubEnv("NEXT_PUBLIC_DEFAULT_LOCALE", "en-US");
    expect(formatPrice(1999, "USD")).toBe("$19.99");
    expect(formatPrice(0, "USD")).toBe("$0.00");
    expect(formatPrice(5000, "USD")).toBe("$50.00");
  });

  it("supports the legacy (cents, currency) signature", () => {
    vi.stubEnv("NEXT_PUBLIC_DEFAULT_LOCALE", "en-US");
    // en-US rendering of EUR uses a dot, not a comma
    expect(formatPrice(1999, "EUR")).toBe("€19.99");
  });

  it("supports an options object with explicit locale", () => {
    expect(
      formatPrice(1999, { currency: "USD", locale: "en-US" }),
    ).toBe("$19.99");
    expect(
      formatPrice(1999, { currency: "EUR", locale: "de-DE" }),
    ).toContain("19,99");
  });

  it("formats EUR in a German locale", () => {
    const out = formatPrice(1999, "EUR", "de-DE");
    expect(out).toContain("19,99");
    expect(out).toContain("€");
  });

  it("formats GBP in en-GB", () => {
    expect(formatPrice(1999, "GBP", "en-GB")).toBe("£19.99");
  });

  it("formats NGN in en-NG", () => {
    expect(formatPrice(199900, "NGN", "en-NG")).toBe("₦1,999.00");
  });

  it("uses the default currency when none is given", () => {
    vi.stubEnv("NEXT_PUBLIC_DEFAULT_CURRENCY", "USD");
    vi.stubEnv("NEXT_PUBLIC_DEFAULT_LOCALE", "en-US");
    expect(formatPrice(1999)).toBe("$19.99");
  });

  it("falls back gracefully for invalid currency input", () => {
    vi.stubEnv("NEXT_PUBLIC_DEFAULT_CURRENCY", "USD");
    vi.stubEnv("NEXT_PUBLIC_DEFAULT_LOCALE", "en-US");
    expect(formatPrice(1999, "!!")).toBe("$19.99");
  });
});

describe("formatMajorAmount", () => {
  it("formats major units directly", () => {
    vi.stubEnv("NEXT_PUBLIC_DEFAULT_LOCALE", "en-US");
    expect(formatMajorAmount(19.99, "USD")).toBe("$19.99");
  });
});

describe("toMinorUnits / fromMinorUnits", () => {
  it("round-trips the supported currencies", () => {
    expect(toMinorUnits(19.99, "USD")).toBe(1999);
    expect(fromMinorUnits(1999, "USD")).toBeCloseTo(19.99);
    expect(toMinorUnits("5", "EUR")).toBe(500);
    expect(toMinorUnits(1999, "NGN")).toBe(199900);
    expect(fromMinorUnits(199900, "NGN")).toBe(1999);
  });

  it("throws on non-numeric input", () => {
    expect(() => toMinorUnits("abc", "USD")).toThrow("Invalid price amount");
    expect(() => toMinorUnits(NaN, "USD")).toThrow("Invalid price amount");
  });
});

describe("parsePriceToCents", () => {
  it("parses seller input strings", () => {
    expect(parsePriceToCents("19.99", "USD")).toBe(1999);
    expect(parsePriceToCents(5, "USD")).toBe(500);
    expect(parsePriceToCents("  10.5 ", "USD")).toBe(1050);
  });

  it("rejects zero/negative/garbage", () => {
    expect(() => parsePriceToCents("0", "USD")).toThrow();
    expect(() => parsePriceToCents("-5", "USD")).toThrow();
    expect(() => parsePriceToCents("abc", "USD")).toThrow();
  });
});

describe("getStripeCurrency", () => {
  it("lowercases for the Stripe API", () => {
    expect(getStripeCurrency("USD")).toBe("usd");
    expect(getStripeCurrency("EUR")).toBe("eur");
    expect(getStripeCurrency("NGN")).toBe("ngn");
    expect(getStripeCurrency("GBP")).toBe("gbp");
  });

  it("uses the configured default", () => {
    vi.stubEnv("NEXT_PUBLIC_DEFAULT_CURRENCY", "EUR");
    expect(getStripeCurrency()).toBe("eur");
  });
});

describe("getCurrencySymbol", () => {
  it("returns narrow symbols", () => {
    expect(getCurrencySymbol("NGN", "en-NG")).toBe("₦");
    expect(getCurrencySymbol("USD", "en-US")).toBe("$");
    expect(getCurrencySymbol("GBP", "en-GB")).toBe("£");
    expect(getCurrencySymbol("EUR", "de-DE")).toBe("€");
  });
});

describe("getCurrencyLocale", () => {
  it("prefers an explicit locale", () => {
    expect(getCurrencyLocale("USD", "fr-FR")).toBe("fr-FR");
  });

  it("maps currencies to sensible defaults", () => {
    vi.stubEnv("NEXT_PUBLIC_DEFAULT_LOCALE", "");
    expect(getCurrencyLocale("NGN")).toBe("en-NG");
    expect(getCurrencyLocale("USD")).toBe("en-US");
    expect(getCurrencyLocale("GBP")).toBe("en-GB");
    expect(getCurrencyLocale("EUR")).toBe("de-DE");
  });

  it("falls back for invalid locales", () => {
    vi.stubEnv("NEXT_PUBLIC_DEFAULT_LOCALE", "");
    expect(getCurrencyLocale("USD", "not-a-locale!!!")).toBe("en-US");
  });
});

describe("getCurrencyOptions", () => {
  it("lists exactly the supported set with symbol + locale", () => {
    vi.stubEnv("NEXT_PUBLIC_DEFAULT_LOCALE", "");
    // No explicit locale: each currency uses its own default (NGN -> en-NG -> ₦).
    // Note: under en-US, Intl renders NGN as "NGN" (code prefix), not "₦".
    const options = getCurrencyOptions();
    expect(options.map((o) => o.code).sort()).toEqual(
      ["EUR", "GBP", "NGN", "USD"].sort(),
    );
    expect(options.find((o) => o.code === "NGN")).toMatchObject({
      code: "NGN",
      symbol: "₦",
    });
    const usd = options.find((o) => o.code === "USD");
    expect(usd).toMatchObject({ code: "USD", symbol: "$" });
  });
});

describe("getFreeShippingThresholdCents", () => {
  it("defaults to 5000 minor units", () => {
    vi.stubEnv("NEXT_PUBLIC_FREE_SHIPPING_THRESHOLD_CENTS", "");
    expect(getFreeShippingThresholdCents()).toBe(5000);
  });

  it("reads env overrides", () => {
    vi.stubEnv("NEXT_PUBLIC_FREE_SHIPPING_THRESHOLD_CENTS", "7500");
    expect(getFreeShippingThresholdCents()).toBe(7500);
  });

  it("ignores invalid env values", () => {
    vi.stubEnv("NEXT_PUBLIC_FREE_SHIPPING_THRESHOLD_CENTS", "abc");
    expect(getFreeShippingThresholdCents()).toBe(5000);
  });
});
