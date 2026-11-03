"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { BarChart3, Briefcase, FileText, FolderKanban, Image as ImageIcon, Inbox, LayoutDashboard, ListChecks, LogOut, Menu, Settings, Shield, Users, UserSquare2, X, Layers, KeyRound } from "lucide-react";
import { cn } from "@/lib/cn";
import { Logo } from "@/components/site/Logo";
import { logout } from "@/lib/actions/admin/auth";

const ICONS = { LayoutDashboard, Briefcase, FolderKanban, UserSquare2, Inbox, FileText, Layers, ImageIcon, Settings, Users, Shield, ListChecks, BarChart3, KeyRound };
export type NavItem = { href: string; label: string; icon: keyof typeof ICONS; group: string };

export function AdminSidebar({ items, user }: { items: NavItem[]; user: { name: string; roleLabel: string } }) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [lastPath, setLastPath] = useState(pathname);
  if (lastPath !== pathname) {
    setLastPath(pathname);
    setOpen(false);
  }
  const groups = [...new Set(items.map((i) => i.group))];

  const nav = (
    <nav aria-label="Painel" className="flex-1 space-y-6 overflow-y-auto px-3 py-5">
      {groups.map((g) => (
        <div key={g}>
          <p className="px-3 pb-2 text-[0.65rem] font-semibold uppercase tracking-[0.16em] text-white/35">{g}</p>
          <ul className="space-y-0.5">
            {items
              .filter((i) => i.group === g)
              .map((i) => {
                const Icon = ICONS[i.icon];
                const active = i.href === "/admin" ? pathname === "/admin" : pathname.startsWith(i.href);
                return (
                  <li key={i.href}>
                    <Link
                      href={i.href}
                      aria-current={active ? "page" : undefined}
                      className={cn("flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors", active ? "bg-lime/15 text-white shadow-[inset_2px_0_0_var(--color-lime)]" : "text-white/60 hover:bg-white/5 hover:text-white")}
                    >
                      <Icon className="h-4 w-4" aria-hidden="true" />
                      {i.label}
                    </Link>
                  </li>
                );
              })}
          </ul>
        </div>
      ))}
    </nav>
  );

  const footer = (
    <div className="border-t border-white/10 p-4">
      <p className="text-sm font-medium text-white">{user.name}</p>
      <p className="text-xs text-white/45">{user.roleLabel}</p>
      <div className="mt-3 flex gap-2">
        <Link href="/admin/conta" className="inline-flex h-8 items-center rounded-lg px-2.5 text-xs text-white/70 hover:bg-white/10 hover:text-white">
          Minha conta
        </Link>
        <form action={logout}>
          <button className="inline-flex h-8 items-center gap-1.5 rounded-lg px-2.5 text-xs text-white/70 hover:bg-white/10 hover:text-white">
            <LogOut className="h-3.5 w-3.5" aria-hidden="true" /> Sair
          </button>
        </form>
      </div>
    </div>
  );

  return (
    <>
      <div className="on-dark sticky top-0 z-40 flex h-14 items-center justify-between bg-forest px-4 lg:hidden">
        <Link href="/admin" aria-label="Painel PETROLUB">
          <Logo inverted />
        </Link>
        <button type="button" onClick={() => setOpen(true)} aria-expanded={open} aria-controls="admin-drawer" className="inline-flex h-10 w-10 items-center justify-center rounded-lg text-white">
          <Menu className="h-5 w-5" aria-hidden="true" />
          <span className="sr-only">Abrir menu</span>
        </button>
      </div>
      <aside className="on-dark fixed inset-y-0 left-0 hidden w-64 flex-col bg-forest lg:flex">
        <div className="flex h-16 items-center px-6">
          <Link href="/admin">
            <Logo inverted />
          </Link>
        </div>
        {nav}
        {footer}
      </aside>
      {open && (
        <div className="fixed inset-0 z-50 lg:hidden" role="dialog" aria-modal="true" aria-label="Menu do painel" id="admin-drawer">
          <button className="absolute inset-0 bg-black/40" onClick={() => setOpen(false)} aria-label="Fechar menu" />
          <aside className="on-dark absolute inset-y-0 left-0 flex w-72 max-w-[85vw] flex-col bg-forest">
            <div className="flex h-14 items-center justify-between px-4">
              <Logo inverted />
              <button type="button" onClick={() => setOpen(false)} className="inline-flex h-10 w-10 items-center justify-center rounded-lg text-white">
                <X className="h-5 w-5" aria-hidden="true" />
                <span className="sr-only">Fechar menu</span>
              </button>
            </div>
            {nav}
            {footer}
          </aside>
        </div>
      )}
    </>
  );
}
