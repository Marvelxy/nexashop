import type { Metadata } from "next";
import { SiteHeader, type HeaderUser } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { currentUser } from "@/lib/permissions";
import { getCartCount } from "@/lib/cart";
import { db } from "@/lib/db";
import "./globals.css";

export const metadata: Metadata = {
  title: "NexaShop - Open-source multi-vendor marketplace",
  description: "Buy from independent sellers. Built with Next.js 15.",
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const [user, categories, cartCount] = await Promise.all([
    currentUser(),
    db.category.findMany({ orderBy: { name: "asc" } }),
    getCartCount(),
  ]);

  const headerUser: HeaderUser | null = user
    ? {
        id: user.id,
        name: user.name,
        email: user.email,
        image: user.image,
        role: user.role,
      }
    : null;

  return (
    <html lang="en">
      <body
        className="min-h-screen bg-white text-neutral-900 antialiased"
        suppressHydrationWarning
      >
        <SiteHeader user={headerUser} categories={categories} cartCount={cartCount} />
        <main className="mx-auto max-w-7xl px-4 py-6">{children}</main>
        <SiteFooter categories={categories} />
      </body>
    </html>
  );
}
