import type { ReactNode } from "react";
import Link from "next/link";
import { cn } from "@/lib/cn";

export function AdminHeader({ title, description, actions, back }: { title: string; description?: ReactNode; actions?: ReactNode; back?: { href: string; label: string } }) {
  return (
    <div className="mb-8 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
      <div>
        {back && (
          <Link href={back.href} className="mb-3 inline-block text-sm text-steel hover:text-ink">
            ← {back.label}
          </Link>
        )}
        <h1 className="font-display text-2xl font-semibold tracking-tight md:text-3xl">{title}</h1>
        {description && <div className="mt-1.5 max-w-3xl text-sm text-steel">{description}</div>}
      </div>
      {actions && <div className="flex flex-wrap gap-2">{actions}</div>}
    </div>
  );
}

export function Card({ children, className, title, actions }: { children: ReactNode; className?: string; title?: string; actions?: ReactNode }) {
  return (
    <section className={cn("rounded-2xl border border-line bg-white", className)}>
      {(title || actions) && (
        <header className="flex items-center justify-between gap-4 border-b border-line px-5 py-4">
          {title && <h2 className="font-semibold">{title}</h2>}
          {actions}
        </header>
      )}
      <div className="p-5">{children}</div>
    </section>
  );
}

export function Empty({ title, children }: { title: string; children?: ReactNode }) {
  return (
    <div className="rounded-2xl border border-dashed border-ink/20 bg-white px-6 py-14 text-center">
      <p className="font-medium">{title}</p>
      {children && <div className="mx-auto mt-2 max-w-md text-sm text-steel">{children}</div>}
    </div>
  );
}

export function Table({ children }: { children: ReactNode }) {
  return (
    <div className="overflow-x-auto rounded-2xl border border-line bg-white">
      <table className="w-full min-w-[640px] text-left text-sm [&_td]:border-t [&_td]:border-line [&_td]:px-4 [&_td]:py-3 [&_td]:align-middle [&_th]:bg-paper [&_th]:px-4 [&_th]:py-3 [&_th]:text-xs [&_th]:font-semibold [&_th]:uppercase [&_th]:tracking-wider [&_th]:text-steel [&_tr:hover_td]:bg-paper/60">
        {children}
      </table>
    </div>
  );
}

export function Stat({ label, value, hint, href }: { label: string; value: ReactNode; hint?: string; href?: string }) {
  const inner = (
    <>
      <p className="text-xs font-semibold uppercase tracking-wider text-steel">{label}</p>
      <p className="mt-3 font-display text-4xl font-semibold tabular-nums tracking-tight">{value}</p>
      {hint && <p className="mt-1 text-xs text-steel">{hint}</p>}
    </>
  );
  return href ? (
    <Link href={href} className="block rounded-2xl border border-line bg-white p-5 transition-colors hover:border-ink/30">
      {inner}
    </Link>
  ) : (
    <div className="rounded-2xl border border-line bg-white p-5">{inner}</div>
  );
}

export const inputCls = "block w-full rounded-lg border border-line bg-white px-3 py-2 text-sm text-ink transition focus:border-ink focus:outline-none focus:ring-4 focus:ring-accent/20 aria-[invalid=true]:border-signal";
export const labelCls = "mb-1 block text-sm font-medium";
