import { motion, useReducedMotion } from "motion/react";
import { Logo } from "@/components/brand/Logo";
import { Dialog } from "@/components/ui/Dialog";
import { IconArrowRight, IconClose, IconInstagram, IconSearch } from "@/components/ui/Icons";
import { ThemeToggle } from "@/components/ui/ThemeToggle";
import { BRAND, NAV_LINKS } from "@/config/brand";
import { CATEGORIES } from "@/data/catalog";
import { emit } from "@/lib/events";
import { EASE_EDITORIAL } from "@/lib/motion";
import type { CategoryId } from "@/types/catalog";

interface MobileMenuProps {
  open: boolean;
  onClose: () => void;
  onSearch: () => void;
}

/** Menu em tela cheia com entrada escalonada (stagger). */
export function MobileMenu({ open, onClose, onSearch }: MobileMenuProps) {
  const reduce = useReducedMotion();
  const item = (i: number) => ({
    initial: { opacity: 0, y: reduce ? 0 : 22 },
    animate: { opacity: 1, y: 0 },
    transition: { duration: 0.6, ease: EASE_EDITORIAL, delay: reduce ? 0 : 0.12 + i * 0.06 },
  });

  const goToCategory = (id: CategoryId | "todas") => {
    onClose();
    // Aguarda o menu fechar (foco devolvido) antes de rolar até a vitrine.
    window.setTimeout(() => emit("pb:filter", id), 60);
  };

  return (
    <Dialog open={open} onClose={onClose} title="Menu" hideTitle variant="fullscreen" className="overflow-y-auto">
      <div id="mobile-menu" className="flex min-h-full flex-col px-4 pt-3 pb-[max(1.5rem,env(safe-area-inset-bottom))] sm:px-8">
        <div className="flex h-12 items-center justify-between">
          <Logo size="sm" />
          <button type="button" onClick={onClose} aria-label="Fechar menu" data-autofocus className="-mr-2.5 grid size-11 place-items-center rounded-full transition-colors hover:bg-surface-2 active:scale-95">
            <IconClose size={22} />
          </button>
        </div>

        <nav aria-label="Menu principal" className="mt-10">
          <ul className="space-y-1">
            {NAV_LINKS.map((l, i) => (
              <motion.li key={l.href} {...item(i)}>
                <a href={l.href} onClick={onClose} className="group flex min-h-14 items-baseline gap-4 border-b border-line py-3">
                  <span className="eyebrow text-ink-soft">0{i + 1}</span>
                  <span className="font-display text-[clamp(2rem,1.4rem+3vw,3rem)] leading-none italic transition-transform duration-300 ease-editorial group-hover:translate-x-2">
                    {l.label}
                  </span>
                </a>
              </motion.li>
            ))}
          </ul>
        </nav>

        <motion.div {...item(NAV_LINKS.length)} className="mt-10">
          <p className="eyebrow text-ink-soft">Categorias</p>
          <ul className="mt-4 flex flex-wrap gap-2">
            {CATEGORIES.filter((c) => c.id !== "todas").map((c) => (
              <li key={c.id}>
                <button
                  type="button"
                  onClick={() => goToCategory(c.id)}
                  className="min-h-11 rounded-full border border-line px-5 text-sm transition-colors duration-200 hover:border-ink hover:bg-ink hover:text-canvas"
                >
                  {c.label}
                </button>
              </li>
            ))}
          </ul>
        </motion.div>

        <motion.div {...item(NAV_LINKS.length + 1)} className="mt-auto flex flex-col gap-3 pt-10">
          <button type="button" onClick={onSearch} className="flex min-h-12 items-center gap-3 rounded-full bg-surface px-5 text-left text-ink-soft transition-colors hover:bg-surface-2">
            <IconSearch />
            <span>Buscar peças, tecidos, cores…</span>
          </button>
          <div className="flex items-center justify-between gap-3">
            <a
              href={BRAND.instagram.url}
              target="_blank"
              rel="noopener noreferrer"
              className="group flex min-h-12 flex-1 items-center justify-between gap-3 rounded-full bg-ink px-5 text-canvas transition-colors hover:bg-accent hover:text-on-accent"
            >
              <span className="flex items-center gap-3">
                <IconInstagram />
                <span className="text-sm">{BRAND.instagram.handle}</span>
              </span>
              <IconArrowRight className="transition-transform duration-300 group-hover:translate-x-1" />
              <span className="sr-only">(abre em nova aba)</span>
            </a>
            <ThemeToggle className="border border-line" />
          </div>
        </motion.div>
      </div>
    </Dialog>
  );
}
