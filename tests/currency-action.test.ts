import { beforeEach, describe, expect, it, vi } from "vitest";
import { setCurrencyPreference } from "@/actions/currency";
import { CURRENCY_COOKIE_NAME } from "@/lib/currency";

vi.mock("next/headers", () => ({
  cookies: vi.fn(),
}));

vi.mock("next/cache", () => ({
  revalidatePath: vi.fn(),
}));

function form(currency: string) {
  const f = new FormData();
  f.set("currency", currency);
  return f;
}

describe("setCurrencyPreference", () => {
  beforeEach(async () => {
    const { cookies } = await import("next/headers");
    vi.mocked(cookies).mockReset();
  });

  it("persists a valid code from a string argument", async () => {
    const set = vi.fn();
    const { cookies } = await import("next/headers");
    vi.mocked(cookies).mockResolvedValue({ set } as never);

    const res = await setCurrencyPreference("eur");
    expect(res).toEqual({ success: "EUR" });
    expect(set).toHaveBeenCalledWith(
      CURRENCY_COOKIE_NAME,
      "EUR",
      expect.objectContaining({ path: "/", sameSite: "lax" }),
    );
  });

  it("persists a valid code from FormData", async () => {
    const set = vi.fn();
    const { cookies } = await import("next/headers");
    vi.mocked(cookies).mockResolvedValue({ set } as never);

    const res = await setCurrencyPreference(form("NGN"));
    expect(res).toEqual({ success: "NGN" });
    expect(set).toHaveBeenCalledWith(
      CURRENCY_COOKIE_NAME,
      "NGN",
      expect.objectContaining({ path: "/" }),
    );
  });

  it("rejects unsupported codes without touching the cookie", async () => {
    const set = vi.fn();
    const { cookies } = await import("next/headers");
    vi.mocked(cookies).mockResolvedValue({ set } as never);

    expect(await setCurrencyPreference("XX")).toEqual({
      error: expect.stringContaining("Unsupported currency"),
    });
    expect(await setCurrencyPreference(form(""))).toEqual({
      error: expect.stringContaining("Unsupported currency"),
    });
    expect(set).not.toHaveBeenCalled();
  });

  it("revalidates the layout after saving", async () => {
    const { cookies } = await import("next/headers");
    vi.mocked(cookies).mockResolvedValue({ set: vi.fn() } as never);
    const { revalidatePath } = await import("next/cache");

    await setCurrencyPreference("GBP");
    expect(vi.mocked(revalidatePath)).toHaveBeenCalledWith("/", "layout");
  });
});
