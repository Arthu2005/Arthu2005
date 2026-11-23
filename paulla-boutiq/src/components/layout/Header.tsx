import { motion, useReducedMotion } from "motion/react";
import { useState } from "react";
import { Logo } from "@/components/brand/Logo";
import { IconHeart, IconInstagram, IconMenu, IconSearch } from "@/components/ui/Icons";
import { ThemeToggle } from "@/components/ui/ThemeToggle";
import { BRAND, NAV_LINKS } from "@/config/brand";
import { useScrollDirection } from "@/hooks/useScrollDirection";
import { cn } from "@/lib/cn";
import { EASE_EDITORIAL } from "@/lib/motion";
import { MobileMenu } from "./MobileMenu";

interface HeaderProps {
  favoritesCount: number;
  onSearch: () => void;
  onShowFavorites: () => void;
}

/** Header que recolhe ao descer e reaparece ao subir; ganha fundo e borda após o topo. */
export function Header({ favoritesCount, onSearch, onShowFavorites }: HeaderProps) {
  const { direction, atTop } = useScrollDirection();
  const [menuOpen, setMenuOpen] = useState(false);
  const reduce = useReducedMotion();
  const hidden = direction === "down" && !atTop && !menuOpen;

  return (
    <>
      <motion.header
        initial={false}
        animate={{ y: hidden && !reduce ? "-100%" : "0%" }}
        transition={{ duration: 0.5, ease: EASE_EDITORIAL }}
        className={cn(
          "fixed inset-x-0 top-0 z-50 transition-[background-color,border-color,color,backdrop-filter] duration-500 ease-editorial",
          atTop ? "border-b border-transparent text-[#f7f3ee]" : "border-b border-line/70 bg-canvas/85 text-ink backdrop-blur-xl",
        )}
      >
        <div className="container-editorial grid h-16 grid-cols-[1fr_auto_1fr] items-center md:h-20">
          {/* Esquerda: menu (mobile) / navegação (desktop) */}
          <div className="flex items-center">
            <button
              type="button"
              onClick={() => setMenuOpen(true)}
              aria-label="Abrir menu"
              aria-expanded={menuOpen}
              aria-controls="mobile-menu"
              className="-ml-2.5 grid size-11 place-items-center rounded-full transition-colors hover:bg-current/10 active:scale-95 lg:hidden"
            >
              <IconMenu size={22} />
            </button>
            <nav aria-label="Principal" className="hidden lg:block">
              <ul className="flex items-center gap-8">
                {NAV_LINKS.map((l) => (
                  <li key={l.href}>
                    <a href={l.href} className="eyebrow link-underline py-2">
                      {l.label}
                    </a>
                  </li>
                ))}
              </ul>
            </nav>
          </div>

          <a href="#inicio" className="rounded-sm" aria-label="Paulla Boutiq — voltar ao início">
            <Logo size="sm" labelled={false} />
          </a>

          {/* Direita: ações */}
          <div className="flex items-center justify-end gap-0.5 md:gap-1">
            <button type="button" onClick={onSearch} aria-label="Buscar peças" className="grid size-11 place-items-center rounded-full transition-colors hover:bg-current/10 active:scale-95">
              <IconSearch />
            </button>
            <button
              type="button"
              onClick={onShowFavorites}
              aria-label={`Favoritos (${favoritesCount})`}
              className="relative grid size-11 place-items-center rounded-full transition-colors hover:bg-current/10 active:scale-95"
            >
              <IconHeart filled={favoritesCount > 0} />
              {favoritesCount > 0 && (
                <motion.span
                  key={favoritesCount}
                  initial={{ scale: 0.4 }}
                  animate={{ scale: 1 }}
                  transition={{ type: "spring", stiffness: 520, damping: 22 }}
                  aria-hidden
                  className="absolute top-1.5 right-1.5 grid min-w-4 place-items-center rounded-full bg-accent px-1 text-[0.6rem] leading-4 font-semibold text-on-accent"
                >
                  {favoritesCount}
                </motion.span>
              )}
            </button>
            <ThemeToggle className="hidden hover:bg-current/10 sm:grid" />
            <a
              href={BRAND.instagram.url}
              target="_blank"
              rel="noopener noreferrer"
              aria-label={`Instagram ${BRAND.instagram.handle} (abre em nova aba)`}
              className="hidden size-11 place-items-center rounded-full transition-colors hover:bg-current/10 active:scale-95 md:grid"
            >
              <IconInstagram />
            </a>
          </div>
        </div>
      </motion.header>

      <MobileMenu
        open={menuOpen}
        onClose={() => setMenuOpen(false)}
        onSearch={() => {
          setMenuOpen(false);
          onSearch();
        }}
      />
    </>
  );
}
