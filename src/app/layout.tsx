import type { Metadata } from "next";
import Link from "next/link";
import { AuthNav } from "@/components/auth-nav";
import { CartCount } from "@/components/cart-count";
import { currentUser } from "@/lib/permissions";
import "./globals.css";

export const metadata: Metadata = {
  title: "NexaShop - Open-source multi-vendor marketplace",
  description: "Buy from independent sellers. Built with Next.js 15.",
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const user = await currentUser();

  return (
    <html lang="en">
      <body
        className="min-h-screen bg-white text-neutral-900 antialiased"
        suppressHydrationWarning
      >
        <header className="border-b">
          <nav className="mx-auto flex max-w-6xl items-center justify-between p-4">
            <Link href="/" className="font-bold text-lg">NexaShop</Link>
            <div className="flex gap-4 text-sm">
              <a href="/search">Search</a>
              <a href="/cart">
                <CartCount />
              </a>
              <a href="/seller/products">Sell</a>
              {user?.role === "ADMIN" && <a href="/admin/stores">Admin</a>}
              <AuthNav />
            </div>
          </nav>
        </header>
        <main className="mx-auto max-w-6xl p-4">{children}</main>
      </body>
    </html>
  );
}
