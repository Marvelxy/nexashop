import { describe, expect, it, vi } from "vitest";
import { formatDisplayPrice } from "@/lib/currency-preference";
import { CURRENCY_COOKIE_NAME } from "@/lib/currency";

vi.mock("next/headers", () => ({
  cookies: vi.fn(async () => ({
    get: (name: string) =>
      name === CURRENCY_COOKIE_NAME ? { value: "EUR" } : undefined,
  })),
  headers: vi.fn(async () => ({
    get: () => "en-US",
  })),
}));

// Single end-to-end case in this file: getDisplayCurrency() is request-cached.
describe("formatDisplayPrice", () => {
  it("converts shop NGN kobo to display EUR with live rates", async () => {
    // Pin the locale: the repo .env sets NEXT_PUBLIC_DEFAULT_LOCALE (loaded
    // by Vite), which would otherwise change the expected rendering.
    vi.stubEnv("NEXT_PUBLIC_DEFAULT_LOCALE", "");
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => ({
        ok: true,
        json: async () => ({
          date: "2026-09-28",
          ngn: { eur: 0.00066, usd: 0.00075, ngn: 1 },
        }),
      })),
    );
    // ₦1999.00 * 0.00066 = €1.31934 -> 132c -> de-DE "1,32 €"
    await expect(formatDisplayPrice(199900)).resolves.toBe("1,32 €");
  });
});
