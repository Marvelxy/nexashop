import { afterEach, describe, expect, it, vi } from "vitest";
import {
  CURRENCY_COOKIE_NAME,
  currencyFromAcceptLanguage,
  currencyFromLocale,
  resolveDisplayCurrency,
} from "@/lib/currency";

afterEach(() => {
  vi.unstubAllEnvs();
});

describe("currencyFromLocale", () => {
  it("maps region tags to currencies", () => {
    expect(currencyFromLocale("en-US")).toBe("USD");
    expect(currencyFromLocale("en-GB")).toBe("GBP");
    expect(currencyFromLocale("en-NG")).toBe("NGN");
    expect(currencyFromLocale("de-DE")).toBe("EUR");
    expect(currencyFromLocale("fr-FR")).toBe("EUR");
  });

  it("falls back to language when the region is unmapped", () => {
    expect(currencyFromLocale("pt-BR")).toBe("EUR"); // BR unmapped, pt -> EUR
    expect(currencyFromLocale("en-CA")).toBe("USD"); // CA unmapped, en -> USD
  });

  it("falls back to language when there is no region", () => {
    expect(currencyFromLocale("de")).toBe("EUR");
    expect(currencyFromLocale("fr")).toBe("EUR");
    expect(currencyFromLocale("en")).toBe("USD");
    expect(currencyFromLocale("yo")).toBe("NGN");
    expect(currencyFromLocale("ha")).toBe("NGN");
    expect(currencyFromLocale("ig")).toBe("NGN");
  });

  it("handles underscores and casing", () => {
    expect(currencyFromLocale("de_DE")).toBe("EUR");
    expect(currencyFromLocale("EN-gb")).toBe("GBP");
  });

  it("returns null for unknown or unsupported locales", () => {
    expect(currencyFromLocale("xx-YY")).toBeNull();
    expect(currencyFromLocale("ja-JP")).toBeNull(); // JPY not supported
    expect(currencyFromLocale("da-DK")).toBeNull(); // DKK not supported
    expect(currencyFromLocale("")).toBeNull();
    expect(currencyFromLocale(null)).toBeNull();
    expect(currencyFromLocale(undefined)).toBeNull();
  });
});

describe("currencyFromAcceptLanguage", () => {
  it("picks the first supported range", () => {
    expect(currencyFromAcceptLanguage("de-DE,de;q=0.9,en;q=0.8")).toBe("EUR");
    expect(currencyFromAcceptLanguage("en-US,en;q=0.9")).toBe("USD");
    expect(currencyFromAcceptLanguage("en-NG,en;q=0.9")).toBe("NGN");
  });

  it("honours q-values over position", () => {
    expect(currencyFromAcceptLanguage("en;q=0.5, de;q=0.9")).toBe("EUR");
  });

  it("skips unsupported ranges and wildcards", () => {
    expect(currencyFromAcceptLanguage("xx-YY, fr-FR;q=0.8")).toBe("EUR");
    expect(currencyFromAcceptLanguage("*;q=0.1, en-GB;q=0.9")).toBe("GBP");
  });

  it("returns null when nothing matches", () => {
    expect(currencyFromAcceptLanguage("")).toBeNull();
    expect(currencyFromAcceptLanguage(null)).toBeNull();
    expect(currencyFromAcceptLanguage("xx")).toBeNull();
  });
});

describe("resolveDisplayCurrency", () => {
  it("prefers a valid cookie (case-insensitive)", () => {
    expect(
      resolveDisplayCurrency({
        cookie: "eur",
        acceptLanguage: "ja-JP",
        defaultCurrency: "USD",
      }),
    ).toBe("EUR");
  });

  it("falls back to Accept-Language for missing/invalid cookies", () => {
    expect(
      resolveDisplayCurrency({
        acceptLanguage: "en-NG",
        defaultCurrency: "USD",
      }),
    ).toBe("NGN");
    expect(
      resolveDisplayCurrency({
        cookie: "XX",
        acceptLanguage: "en-GB",
        defaultCurrency: "USD",
      }),
    ).toBe("GBP");
  });

  it("falls back to the shop default last", () => {
    expect(resolveDisplayCurrency({ defaultCurrency: "USD" })).toBe("USD");
    expect(
      resolveDisplayCurrency({
        cookie: "bogus",
        acceptLanguage: "bogus",
        defaultCurrency: "GBP",
      }),
    ).toBe("GBP");
  });

  it("reads the env default when no override is given", () => {
    vi.stubEnv("NEXT_PUBLIC_DEFAULT_CURRENCY", "EUR");
    expect(resolveDisplayCurrency({})).toBe("EUR");
    expect(resolveDisplayCurrency()).toBe("EUR");
  });
});

describe("CURRENCY_COOKIE_NAME", () => {
  it("is a stable non-empty cookie name", () => {
    expect(CURRENCY_COOKIE_NAME).toBe("nexashop_currency");
  });
});
