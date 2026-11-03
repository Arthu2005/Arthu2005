"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { Menu, X } from "lucide-react";
import { cn } from "@/lib/cn";
import { buttonClass } from "@/components/ui/Button";
import type { ImageValue } from "@/lib/content/fields";
import { Logo } from "./Logo";

import { NAV } from "./nav";

function NavigationMenu({ pathname, onNavigate, mobile = false }: { pathname: string; onNavigate?: () => void; mobile?: boolean }) {
  return (
    <ul className={cn(mobile ? "flex flex-col" : "flex items-center gap-1")}>
      {NAV.map((item, i) => {
        const active = pathname === item.href || pathname.startsWith(`${item.href}/`);
        return (
          <li key={item.href} className={mobile ? "border-b border-white/10" : undefined}>
            <Link
              href={item.href}
              onClick={onNavigate}
              aria-current={active ? "page" : undefined}
              className={cn(
                mobile
                  ? "flex items-baseline justify-between py-5 font-display text-[2rem] font-semibold tracking-tight text-white"
                  : "relative rounded-full px-3.5 py-2 text-[0.92rem] text-ink-2 transition-colors hover:text-ink",
                !mobile && active && "text-ink",
              )}
            >
              {mobile && <span className="text-xs font-normal tabular-nums text-white/40">0{i + 1}</span>}
              <span className={mobile ? "flex-1 pl-4" : undefined}>{item.label}</span>
              {!mobile && active && <span className="absolute inset-x-3.5 -bottom-0.5 h-0.5 rounded-full bg-gradient-to-r from-accent to-lime" aria-hidden="true" />}
            </Link>
          </li>
        );
      })}
    </ul>
  );
}

export function Header({ logo, top }: { logo?: ImageValue; top?: React.ReactNode }) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const reduced = useReducedMotion();
  const menuRef = useRef<HTMLDivElement>(null);
  const toggleRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // close on route change (state derived during render, as recommended by React)
  const [lastPath, setLastPath] = useState(pathname);
  if (lastPath !== pathname) {
    setLastPath(pathname);
    setOpen(false);
  }

  // mobile dialog: lock scroll, ESC to close, keep focus inside
  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const focusables = () => Array.from(menuRef.current?.querySelectorAll<HTMLElement>("a,button") ?? []);
    focusables()[0]?.focus();
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setOpen(false);
        toggleRef.current?.focus();
      }
      if (e.key === "Tab") {
        const f = focusables();
        if (!f.length) return;
        const first = f[0]!;
        const last = f[f.length - 1]!;
        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault();
          last.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault();
          first.focus();
        }
      }
    };
    document.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = prev;
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  return (
    <header className="fixed inset-x-0 top-0 z-50">
      {top}
      <div
        className={cn(
          "transition-[background-color,box-shadow,backdrop-filter] duration-500",
          scrolled ? "bg-paper/80 shadow-[0_1px_0_rgb(11_11_12/0.08)] backdrop-blur-xl" : "bg-transparent",
        )}
      >
        <nav className="container-x flex h-16 items-center justify-between gap-6 md:h-20" aria-label="Principal">
          <Link href="/" className="shrink-0 rounded-md" aria-label="PETROLUB — página inicial">
            <Logo logo={logo} />
          </Link>
          <div className="hidden lg:block">
            <NavigationMenu pathname={pathname} />
          </div>
          <div className="flex items-center gap-2">
            <Link href="/contato?assunto=comercial" className={buttonClass("accent", "sm", "max-sm:!hidden")}>
              Fale com um especialista
            </Link>
            <button
              ref={toggleRef}
              type="button"
              className="inline-flex h-11 w-11 items-center justify-center rounded-full border border-ink/15 bg-white/60 backdrop-blur lg:hidden"
              aria-expanded={open}
              aria-controls="mobile-menu"
              onClick={() => setOpen((v) => !v)}
            >
              <Menu className="h-5 w-5" aria-hidden="true" />
              <span className="sr-only">Abrir menu</span>
            </button>
          </div>
        </nav>
      </div>

      <AnimatePresence>
        {open && (
          <motion.div
            id="mobile-menu"
            ref={menuRef}
            role="dialog"
            aria-modal="true"
            aria-label="Menu"
            className="on-dark fixed inset-0 z-50 flex flex-col overflow-y-auto bg-forest px-4 pb-8 sm:px-6 lg:hidden"
            initial={reduced ? { opacity: 0 } : { clipPath: "inset(0 0 100% 0)" }}
            animate={reduced ? { opacity: 1 } : { clipPath: "inset(0 0 0% 0)" }}
            exit={reduced ? { opacity: 0 } : { clipPath: "inset(0 0 100% 0)" }}
            transition={{ duration: 0.6, ease: [0.76, 0, 0.24, 1] }}
          >
            <div className="flex h-16 items-center justify-between md:h-20">
              <Logo logo={logo} inverted />
              <button type="button" className="inline-flex h-11 w-11 items-center justify-center rounded-full border border-white/20 text-white" onClick={() => setOpen(false)}>
                <X className="h-5 w-5" aria-hidden="true" />
                <span className="sr-only">Fechar menu</span>
              </button>
            </div>
            <div className="mt-6">
              <NavigationMenu pathname={pathname} mobile onNavigate={() => setOpen(false)} />
            </div>
            <div className="mt-auto grid gap-3 pt-10">
              <Link href="/contato?assunto=comercial" className={buttonClass("accent", "lg")} onClick={() => setOpen(false)}>
                Fale com um especialista
              </Link>
              <Link href="/carreiras/vagas" className={buttonClass("light", "lg")} onClick={() => setOpen(false)}>
                Ver vagas abertas
              </Link>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}
