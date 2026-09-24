"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { signOutAction } from "@/actions/auth";

export type UserMenuUser = {
  id: string;
  name?: string | null;
  email?: string | null;
  image?: string | null;
  role: "BUYER" | "SELLER" | "ADMIN";
};

function initials(user: UserMenuUser) {
  const src = user.name?.trim() || user.email?.trim() || "N";
  const parts = src.split(/\s+/);
  if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
  return src.slice(0, 2).toUpperCase();
}

export function UserMenu({ user }: { user: UserMenuUser }) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const node = rootRef.current;
    function onPointerDown(e: MouseEvent | TouchEvent) {
      if (node && !node.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    function onFocusOut(e: FocusEvent) {
      if (node && !node.contains(e.relatedTarget as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", onPointerDown);
    document.addEventListener("touchstart", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    node?.addEventListener("focusout", onFocusOut);
    return () => {
      document.removeEventListener("mousedown", onPointerDown);
      document.removeEventListener("touchstart", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
      node?.removeEventListener("focusout", onFocusOut);
    };
  }, [open ]);

  return (
    <div ref={rootRef} className="relative">
      <button
        type="button"
        aria-haspopup="menu"
        aria-expanded={open}
        onClick={() => setOpen((v) => !v)}
        className="flex items-center gap-2 rounded-full border border-neutral-200 bg-white py-1 pl-1 pr-2.5 transition hover:border-neutral-400"
      >
        <span
          aria-hidden
          className="flex h-7 w-7 items-center justify-center rounded-full bg-neutral-900 text-[11px] font-bold text-white"
        >
          {initials(user)}
        </span>
        <span className="hidden max-w-24 truncate text-sm font-medium lg:block">
          {user.name ?? user.email ?? "Account"}
        </span>
        <svg
          width="14"
          height="14"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden
          className={`text-neutral-500 transition ${open ? "rotate-180" : ""}`}
        >
          <path d="m6 9 6 6 6-6" />
        </svg>
      </button>
      {open && (
        <div
          role="menu"
          className="absolute right-0 z-50 mt-2 w-52 overflow-hidden rounded-2xl border border-neutral-200 bg-white p-1.5 shadow-xl shadow-neutral-900/10"
        >
          <p className="truncate px-3 py-2 text-xs text-neutral-500">
            {user.email ?? user.name ?? "Signed in"}
          </p>
          <Link
            href="/orders"
            role="menuitem"
            onClick={() => setOpen(false)}
            className="block rounded-lg px-3 py-2 text-sm transition hover:bg-neutral-100"
          >
            Orders
          </Link>
          <Link
            href="/cart"
            role="menuitem"
            onClick={() => setOpen(false)}
            className="block rounded-lg px-3 py-2 text-sm transition hover:bg-neutral-100"
          >
            Cart
          </Link>
          <Link
            href="/seller/products"
            role="menuitem"
            onClick={() => setOpen(false)}
            className="block rounded-lg px-3 py-2 text-sm transition hover:bg-neutral-100"
          >
            Seller dashboard
          </Link>
          {user.role === "ADMIN" && (
            <Link
              href="/admin/stores"
              role="menuitem"
              onClick={() => setOpen(false)}
              className="block rounded-lg px-3 py-2 text-sm transition hover:bg-neutral-100"
            >
              Admin
            </Link>
          )}
          <div className="my-1 border-t" />
          <form action={signOutAction}>
            <button
              type="submit"
              role="menuitem"
              className="block w-full rounded-lg px-3 py-2 text-left text-sm text-red-600 transition hover:bg-red-50"
            >
              Sign out
            </button>
          </form>
        </div>
      )}
    </div>
  );
}
