import { afterEach, describe, expect, it, vi } from "vitest";
import {
  __clearFxCache,
  buildFxUrl,
  convertShopMinorToDisplay,
  getFxRates,
  parseFxPayload,
  rebaseRatesToShop,
  type FxRates,
} from "@/lib/fx";

afterEach(() => {
  __clearFxCache();
  vi.unstubAllGlobals();
  vi.unstubAllEnvs();
});

const NGN_RATES: FxRates = {
  base: "NGN",
  date: "2026-09-28",
  rates: { NGN: 1, USD: 0.00075, EUR: 0.00066, GBP: 0.00057 },
};

describe("buildFxUrl", () => {
  it("points at the per-base currency-api file", () => {
    expect(buildFxUrl("NGN")).toBe(
      "https://cdn.jsdelivr.net/npm/@fawazahmed0/currency-api@latest/v1/currencies/ngn.json",
    );
    expect(buildFxUrl("usd")).toContain("/usd.json");
  });

  it("honours the FX_API_BASE_URL override", () => {
    expect(buildFxUrl("NGN", "https://fx.example.com/rates/")).toBe(
      "https://fx.example.com/rates/ngn.json",
    );
  });
});

describe("parseFxPayload", () => {
  it("normalizes the currency-api shape", () => {
    const parsed = parseFxPayload(
      { date: "2026-09-28", ngn: { usd: 0.00075, eur: 0.00066, ngn: 1 } },
      "NGN",
    );
    expect(parsed).toEqual({
      base: "NGN",
      date: "2026-09-28",
      rates: { USD: 0.00075, EUR: 0.00066, NGN: 1 },
    });
  });

  it("drops non-numeric entries and pins the base to 1", () => {
    const parsed = parseFxPayload(
      { ngn: { usd: 0.00075, bogus: "x", neg: -1 } },
      "ngn",
    );
    expect(parsed?.rates).toEqual({ USD: 0.00075, NGN: 1 });
  });

  it("returns null for bad shapes", () => {
    expect(parseFxPayload(null, "NGN")).toBeNull();
    expect(parseFxPayload({ date: "x" }, "NGN")).toBeNull();
    expect(parseFxPayload({ ngn: {} }, "NGN")).toBeNull();
    expect(parseFxPayload({ usd: { eur: 1 } }, "NGN")).toBeNull();
  });
});

describe("rebaseRatesToShop", () => {
  it("cross-converts USD-quoted rates to shop-quoted rates", () => {
    const usd: FxRates = {
      base: "USD",
      rates: { USD: 1, NGN: 1330, EUR: 0.88 },
    };
    const rebased = rebaseRatesToShop(usd, "NGN");
    expect(rebased?.base).toBe("NGN");
    expect(rebased?.rates.NGN).toBeCloseTo(1);
    expect(rebased?.rates.USD).toBeCloseTo(1 / 1330);
    expect(rebased?.rates.EUR).toBeCloseTo(0.88 / 1330);
  });

  it("returns null when the shop rate is missing", () => {
    expect(
      rebaseRatesToShop({ base: "USD", rates: { USD: 1 } }, "NGN"),
    ).toBeNull();
  });
});

describe("convertShopMinorToDisplay", () => {
  it("is identity for same currency", () => {
    expect(convertShopMinorToDisplay(199900, "NGN", NGN_RATES)).toBe(199900);
  });

  it("converts NGN kobo -> USD cents", () => {
    // ₦1999.00 * 0.00075 = $1.49925 -> 150c
    expect(convertShopMinorToDisplay(199900, "USD", NGN_RATES)).toBe(150);
  });

  it("converts NGN kobo -> EUR cents", () => {
    // ₦1999.00 * 0.00066 = €1.31934 -> 132c
    expect(convertShopMinorToDisplay(199900, "EUR", NGN_RATES)).toBe(132);
  });

  it("throws when the rate is missing", () => {
    expect(() =>
      convertShopMinorToDisplay(100, "GBP", {
        base: "NGN",
        rates: { NGN: 1 },
      }),
    ).toThrow("No FX rate for GBP");
  });
});

describe("getFxRates", () => {
  function mockFetch(handler: (url: string) => unknown) {
    vi.stubGlobal(
      "fetch",
      vi.fn(async (url: string) => {
        const body = handler(url);
        if (body == null) {
          return { ok: false, status: 404 } as Response;
        }
        return {
          ok: true,
          json: async () => body,
        } as Response;
      }),
    );
  }

  it("fetches and parses the shop-base file", async () => {
    mockFetch((url) =>
      url.endsWith("/ngn.json")
        ? { date: "2026-09-28", ngn: { usd: 0.00075, ngn: 1 } }
        : null,
    );
    const rates = await getFxRates("NGN");
    expect(rates).toEqual({
      base: "NGN",
      date: "2026-09-28",
      rates: { USD: 0.00075, NGN: 1 },
    });
  });

  it("caches within the TTL (one fetch for two calls)", async () => {
    const spy = vi.fn(async () => ({
      ok: true,
      json: async () => ({ ngn: { usd: 0.00075 } }),
    }));
    vi.stubGlobal("fetch", spy);
    await getFxRates("NGN");
    await getFxRates("NGN");
    expect(spy).toHaveBeenCalledTimes(1);
  });

  it("falls back to the USD file when the shop file is missing", async () => {
    mockFetch((url) =>
      url.endsWith("/usd.json")
        ? { date: "2026-09-28", usd: { ngn: 1330, usd: 1, eur: 0.88 } }
        : null,
    );
    const rates = await getFxRates("NGN");
    expect(rates?.base).toBe("NGN");
    expect(rates?.rates.NGN).toBeCloseTo(1);
    expect(rates?.rates.EUR).toBeCloseTo(0.88 / 1330);
  });

  it("returns null when the API is unreachable", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => {
        throw new Error("network down");
      }),
    );
    expect(await getFxRates("NGN")).toBeNull();
  });
});
