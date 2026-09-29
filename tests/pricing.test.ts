import { afterEach, describe, expect, it, vi } from "vitest";
import { formatPrice as formatPriceViaPermissions } from "@/lib/permissions";
import {
  formatPrice,
  fromMinorUnits,
  getFreeShippingThresholdCents,
  getStripeCurrency,
  parsePriceToCents,
  toMinorUnits,
} from "@/lib/currency";

afterEach(() => {
  vi.unstubAllEnvs();
});

describe("permissions.formatPrice backwards compatibility", () => {
  it("matches the currency module for the legacy signature", () => {
    vi.stubEnv("NEXT_PUBLIC_DEFAULT_LOCALE", "en-US");
    expect(formatPriceViaPermissions(1999, "USD")).toBe(formatPrice(1999, "USD"));
    expect(formatPriceViaPermissions(1999, "EUR")).toBe(formatPrice(1999, "EUR"));
    expect(formatPriceViaPermissions(5000)).toBe(formatPrice(5000));
  });

  it("accepts an options object with locale", () => {
    expect(
      formatPriceViaPermissions(1999, { currency: "EUR", locale: "de-DE" }),
    ).toBe(formatPrice(1999, { currency: "EUR", locale: "de-DE" }));
  });
});

describe("seller price input -> storage -> display round-trip", () => {
  it("USD: '19.99' -> 1999 -> '$19.99'", () => {
    vi.stubEnv("NEXT_PUBLIC_DEFAULT_CURRENCY", "USD");
    vi.stubEnv("NEXT_PUBLIC_DEFAULT_LOCALE", "en-US");
    const stored = parsePriceToCents("19.99", "USD");
    expect(stored).toBe(1999);
    expect(formatPrice(stored, "USD", "en-US")).toBe("$19.99");
    expect(fromMinorUnits(stored, "USD")).toBeCloseTo(19.99);
  });

  it("NGN: '5000' -> 500000 minor units", () => {
    const stored = toMinorUnits(5000, "NGN");
    expect(stored).toBe(500000);
    expect(formatPrice(stored, "NGN", "en-NG")).toContain("5,000");
  });
});

describe("order totals", () => {
  it("sums line totals in minor units and formats the result", () => {
    vi.stubEnv("NEXT_PUBLIC_DEFAULT_LOCALE", "en-US");
    const lines = [
      { price: 1999, qty: 2 },
      { price: 500, qty: 1 },
    ];
    const total = lines.reduce((s, l) => s + l.price * l.qty, 0);
    expect(total).toBe(4498);
    expect(formatPrice(total, "USD", "en-US")).toBe("$44.98");
  });
});

describe("free-shipping progress", () => {
  it("computes remaining + progress like the cart page", () => {
    vi.stubEnv("NEXT_PUBLIC_FREE_SHIPPING_THRESHOLD_CENTS", "5000");
    vi.stubEnv("NEXT_PUBLIC_DEFAULT_LOCALE", "en-US");
    const threshold = getFreeShippingThresholdCents();
    const subtotal = 3000;
    const remaining = Math.max(0, threshold - subtotal);
    const progress = Math.min(100, Math.round((subtotal / threshold) * 100));
    expect(remaining).toBe(2000);
    expect(progress).toBe(60);
    expect(formatPrice(remaining, "USD", "en-US")).toBe("$20.00");
  });

  it("unlocks free shipping at the threshold", () => {
    const threshold = getFreeShippingThresholdCents();
    expect(Math.max(0, threshold - 5000)).toBe(0);
  });
});

describe("stripe wiring", () => {
  it("produces a lowercase currency for Stripe line items", () => {
    vi.stubEnv("NEXT_PUBLIC_DEFAULT_CURRENCY", "EUR");
    expect(getStripeCurrency()).toBe("eur");
    expect(getStripeCurrency("GBP")).toBe("gbp");
  });
});
