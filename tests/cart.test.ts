import { describe, expect, it, vi } from "vitest";

vi.mock("next/headers", () => ({
  cookies: vi.fn(),
}));

vi.mock("next/cache", () => ({
  revalidatePath: vi.fn(),
}));

import {
  CART_MAX_QTY_PER_ITEM,
  parseCart,
  serializeCart,
} from "@/lib/cart";

describe("parseCart", () => {
  it("returns [] for missing input", () => {
    expect(parseCart(undefined)).toEqual([]);
    expect(parseCart(null)).toEqual([]);
    expect(parseCart("")).toEqual([]);
  });

  it("returns [] for invalid JSON or non-arrays", () => {
    expect(parseCart("not-json")).toEqual([]);
    expect(parseCart('{"productId":"a"}')).toEqual([]);
    expect(parseCart('"hello"')).toEqual([]);
    expect(parseCart("42")).toEqual([]);
  });

  it("parses valid lines", () => {
    expect(
      parseCart(JSON.stringify([{ productId: "a", qty: 2 }])),
    ).toEqual([{ productId: "a", qty: 2 }]);
  });

  it("floors fractional quantities", () => {
    expect(parseCart(JSON.stringify([{ productId: "a", qty: 2.9 }]))).toEqual([
      { productId: "a", qty: 2 },
    ]);
  });

  it("drops lines with missing/empty ids or qty < 1", () => {
    const raw = JSON.stringify([
      { productId: "", qty: 2 },
      { qty: 2 },
      { productId: "a" },
      { productId: "b", qty: 0 },
      { productId: "c", qty: -3 },
      { productId: "d", qty: "2" },
      { productId: "ok", qty: 1 },
    ]);
    expect(parseCart(raw)).toEqual([{ productId: "ok", qty: 1 }]);
  });

  it("caps quantities at CART_MAX_QTY_PER_ITEM", () => {
    expect(
      parseCart(JSON.stringify([{ productId: "a", qty: 9999 }])),
    ).toEqual([{ productId: "a", qty: CART_MAX_QTY_PER_ITEM }]);
  });

  it("merges duplicate product ids and caps the merged total", () => {
    const raw = JSON.stringify([
      { productId: "a", qty: 60 },
      { productId: "b", qty: 1 },
      { productId: "a", qty: 60 },
    ]);
    expect(parseCart(raw)).toEqual([
      { productId: "a", qty: CART_MAX_QTY_PER_ITEM },
      { productId: "b", qty: 1 },
    ]);
  });

  it("keeps first-seen order when merging", () => {
    const raw = JSON.stringify([
      { productId: "b", qty: 1 },
      { productId: "a", qty: 2 },
      { productId: "b", qty: 3 },
    ]);
    expect(parseCart(raw)).toEqual([
      { productId: "b", qty: 4 },
      { productId: "a", qty: 2 },
    ]);
  });
});

describe("serializeCart", () => {
  it("round-trips through parseCart", () => {
    const lines = [
      { productId: "a", qty: 2 },
      { productId: "b", qty: 1 },
    ];
    expect(parseCart(serializeCart(lines))).toEqual(lines);
  });

  it("serializes an empty cart to an empty array", () => {
    expect(serializeCart([])).toBe("[]");
    expect(parseCart(serializeCart([]))).toEqual([]);
  });
});

describe("CART_MAX_QTY_PER_ITEM", () => {
  it("is a sane positive cap", () => {
    expect(CART_MAX_QTY_PER_ITEM).toBeGreaterThan(0);
    expect(CART_MAX_QTY_PER_ITEM).toBeLessThanOrEqual(999);
  });
});
