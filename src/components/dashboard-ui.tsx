import Link from "next/link";
import type { ReactNode } from "react";

export function PageHeader({
  eyebrow,
  title,
  subtitle,
  actions,
}: {
  eyebrow?: string;
  title: string;
  subtitle?: string;
  actions?: ReactNode;
}) {
  return (
    <div className="flex flex-wrap items-end justify-between gap-4">
      <div className="space-y-1">
        {eyebrow && (
          <p className="text-xs font-semibold uppercase tracking-widest text-neutral-500">
            {eyebrow}
          </p>
        )}
        <h1 className="text-2xl font-extrabold tracking-tight sm:text-3xl">{title}</h1>
        {subtitle && <p className="max-w-xl text-sm text-neutral-500">{subtitle}</p>}
      </div>
      {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
    </div>
  );
}

export function Stat({ label, value, sub }: { label: string; value: string; sub?: string }) {
  return (
    <div className="rounded-2xl border border-neutral-200 bg-white p-4">
      <p className="text-xs font-semibold uppercase tracking-wider text-neutral-500">{label}</p>
      <p className="mt-1 text-2xl font-extrabold tracking-tight">{value}</p>
      {sub && <p className="mt-0.5 text-xs text-neutral-500">{sub}</p>}
    </div>
  );
}

const ORDER_STYLES: Record<string, string> = {
  PENDING: "bg-amber-100 text-amber-800",
  PAID: "bg-emerald-100 text-emerald-800",
  SHIPPED: "bg-blue-100 text-blue-800",
  DELIVERED: "bg-neutral-900 text-white",
  CANCELLED: "bg-neutral-100 text-neutral-500",
  REFUNDED: "bg-purple-100 text-purple-800",
};

export function OrderStatusBadge({ status }: { status: string }) {
  return (
    <span
      className={`inline-flex shrink-0 items-center rounded-full px-2.5 py-1 text-xs font-semibold ${ORDER_STYLES[status] ?? "bg-neutral-100 text-neutral-600"}`}
    >
      {status}
    </span>
  );
}

export function LiveBadge({ live }: { live: boolean }) {
  return live ? (
    <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-100 px-2.5 py-1 text-xs font-semibold text-emerald-800">
      <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" /> Live
    </span>
  ) : (
    <span className="inline-flex items-center gap-1.5 rounded-full bg-neutral-100 px-2.5 py-1 text-xs font-semibold text-neutral-500">
      <span className="h-1.5 w-1.5 rounded-full bg-neutral-400" /> Draft
    </span>
  );
}

export function EmptyState({
  icon,
  title,
  text,
  action,
}: {
  icon: string;
  title: string;
  text?: string;
  action?: ReactNode;
}) {
  return (
    <div className="rounded-3xl border border-dashed border-neutral-300 bg-neutral-50/50 px-6 py-12 text-center">
      <p className="text-4xl">{icon}</p>
      <h2 className="mt-3 font-bold">{title}</h2>
      {text && <p className="mx-auto mt-1 max-w-sm text-sm text-neutral-500">{text}</p>}
      {action && <div className="mt-4 flex justify-center gap-2">{action}</div>}
    </div>
  );
}

export function Tabs({ items }: { items: { href: string; label: string; active?: boolean }[] }) {
  return (
    <nav aria-label="Section" className="flex gap-1 overflow-x-auto rounded-full border border-neutral-200 bg-white p-1 text-sm font-medium">
      {items.map((t) => (
        <Link
          key={t.href + t.label}
          href={t.href}
          aria-current={t.active ? "page" : undefined}
          className={`shrink-0 rounded-full px-4 py-1.5 transition ${
            t.active ? "bg-neutral-900 text-white" : "text-neutral-600 hover:bg-neutral-100"
          }`}
        >
          {t.label}
        </Link>
      ))}
    </nav>
  );
}

export function Card({ children, className = "" }: { children: ReactNode; className?: string }) {
  return (
    <div className={`rounded-2xl border border-neutral-200 bg-white ${className}`}>
      {children}
    </div>
  );
}
