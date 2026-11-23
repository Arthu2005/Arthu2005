import { AnimatePresence, LayoutGroup, motion, useReducedMotion } from "motion/react";
import { useCallback, useDeferredValue, useId, useMemo, useRef, useState } from "react";
import { ProductCard, ProductCardSkeleton } from "@/components/catalog/ProductCard";
import { Button } from "@/components/ui/Button";
import { IconClose, IconHeart, IconRefresh, IconSearch } from "@/components/ui/Icons";
import { Reveal, RevealLines } from "@/components/ui/Reveal";
import { CATEGORIES, CATEGORY_LABEL, STYLES } from "@/data/catalog";
import { normalize } from "@/lib/catalog";
import { cn } from "@/lib/cn";
import { useCommand } from "@/lib/events";
import { EASE_EDITORIAL } from "@/lib/motion";
import type { CategoryId, LoadState, Product, StyleId } from "@/types/catalog";

interface ShowcaseProps {
  state: LoadState<readonly Product[]>;
  onRetry: () => void;
  favorites: Set<string>;
  onToggleFavorite: (id: string) => void;
  onOpenProduct: (id: string) => void;
}

type CategoryFilter = CategoryId | "todas";

export function Showcase({ state, onRetry, favorites, onToggleFavorite, onOpenProduct }: ShowcaseProps) {
  const sectionRef = useRef<HTMLElement>(null);
  const searchRef = useRef<HTMLInputElement>(null);
  const searchId = useId();
  const reduce = useReducedMotion();

  const [category, setCategory] = useState<CategoryFilter>("todas");
  const [styles, setStyles] = useState<Set<StyleId>>(new Set());
  const [onlyFavorites, setOnlyFavorites] = useState(false);
  const [query, setQuery] = useState("");
  const deferredQuery = useDeferredValue(query);

  const products = state.status === "ready" ? state.data : state.status === "error" ? state.fallback : [];

  const scrollIntoView = useCallback(() => {
    sectionRef.current?.scrollIntoView({ behavior: reduce ? "auto" : "smooth", block: "start" });
  }, [reduce]);

  // Comandos vindos do header/menu
  useCommand(
    "pb:filter",
    useCallback(
      (id) => {
        setCategory(id);
        setOnlyFavorites(false);
        scrollIntoView();
      },
      [scrollIntoView],
    ),
  );
  useCommand(
    "pb:search",
    useCallback(() => {
      scrollIntoView();
      // Foca após a rolagem iniciar, sem pular a página.
      window.setTimeout(() => searchRef.current?.focus({ preventScroll: true }), reduce ? 0 : 450);
    }, [scrollIntoView, reduce]),
  );
  useCommand(
    "pb:favorites",
    useCallback(() => {
      setOnlyFavorites(true);
      scrollIntoView();
    }, [scrollIntoView]),
  );

  const filtered = useMemo(() => {
    const q = normalize(deferredQuery);
    return products.filter((p) => {
      if (category !== "todas" && p.category !== category) return false;
      if (styles.size > 0 && !p.styles.some((s) => styles.has(s))) return false;
      if (onlyFavorites && !favorites.has(p.id)) return false;
      if (q) {
        const haystack = normalize([p.name, p.shortDescription, CATEGORY_LABEL[p.category], ...p.details, ...p.colors.map((c) => c.name)].join(" "));
        return q.split(/\s+/).every((term) => haystack.includes(term));
      }
      return true;
    });
  }, [products, category, styles, onlyFavorites, favorites, deferredQuery]);

  const counts = useMemo(() => {
    const map = new Map<CategoryFilter, number>([["todas", products.length]]);
    for (const p of products) map.set(p.category, (map.get(p.category) ?? 0) + 1);
    return map;
  }, [products]);

  const hasFilters = category !== "todas" || styles.size > 0 || onlyFavorites || query.trim() !== "";
  const clearAll = () => {
    setCategory("todas");
    setStyles(new Set());
    setOnlyFavorites(false);
    setQuery("");
  };
  const toggleStyle = (id: StyleId) =>
    setStyles((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });

  const loading = state.status === "loading";

  return (
    <section id="vitrine" ref={sectionRef} aria-labelledby="vitrine-title" className="scroll-mt-4 bg-canvas py-24 md:py-36">
      <div className="container-editorial">
        <div className="grid gap-6 md:grid-cols-[1fr_auto] md:items-end">
          <div>
            <p className="eyebrow text-accent">Vitrine</p>
            <RevealLines id="vitrine-title" lines={["Curadoria", "da estação"]} italicIndex={1} className="mt-4 font-display text-display-lg tracking-[-0.02em]" />
          </div>
          <Reveal>
            <p className="max-w-[40ch] text-ink-soft">Peças em tiragens pequenas. Salve suas favoritas e fale com a Paulla para reservar, provar ou ajustar.</p>
          </Reveal>
        </div>

        {/* Barra de filtros */}
        <div className="mt-10 md:mt-14">
          <div className="flex flex-col gap-3 md:gap-5">
            <div className="flex flex-col-reverse gap-3 md:flex-row md:items-center md:justify-between">
              <LayoutGroup id="categories">
                <div role="group" aria-label="Filtrar por categoria" className="no-scrollbar -mx-4 flex gap-1.5 overflow-x-auto px-4 md:mx-0 md:flex-wrap md:px-0">
                  {CATEGORIES.map((c) => {
                    const selected = category === c.id;
                    const count = counts.get(c.id) ?? 0;
                    return (
                      <button
                        key={c.id}
                        type="button"
                        aria-pressed={selected}
                        onClick={() => setCategory(c.id)}
                        className={cn(
                          "relative flex min-h-11 shrink-0 items-center gap-2 rounded-full px-4 text-sm transition-colors duration-200",
                          selected ? "text-canvas" : "text-ink hover:bg-surface-2",
                        )}
                      >
                        {selected && (
                          <motion.span layoutId="category-pill" className="absolute inset-0 -z-0 rounded-full bg-ink" transition={{ duration: reduce ? 0 : 0.45, ease: EASE_EDITORIAL }} />
                        )}
                        <span className="relative">{c.label}</span>
                        {!loading && <span className={cn("relative text-[0.7rem] tabular-nums", selected ? "text-canvas/70" : "text-ink-soft")}>{count}</span>}
                      </button>
                    );
                  })}
                </div>
              </LayoutGroup>

              <div className="relative md:w-72">
                <label htmlFor={searchId} className="sr-only">
                  Buscar na vitrine
                </label>
                <IconSearch className="pointer-events-none absolute top-1/2 left-4 -translate-y-1/2 text-ink-soft" size={18} />
                <input
                  ref={searchRef}
                  id={searchId}
                  type="search"
                  value={query}
                  onChange={(e) => setQuery(e.target.value.slice(0, 80))}
                  placeholder="Buscar peça, tecido, cor…"
                  autoComplete="off"
                  enterKeyHint="search"
                  className="h-11 w-full rounded-full border border-line bg-surface/60 pr-11 pl-11 text-[16px] transition-colors duration-200 placeholder:text-ink-soft/80 hover:border-ink-soft focus:border-ink focus:outline-none focus-visible:outline-2 md:text-sm [&::-webkit-search-cancel-button]:hidden"
                />
                {query && (
                  <button
                    type="button"
                    onClick={() => {
                      setQuery("");
                      searchRef.current?.focus();
                    }}
                    aria-label="Limpar busca"
                    className="absolute top-1/2 right-0 grid size-11 -translate-y-1/2 place-items-center rounded-full text-ink-soft hover:text-ink"
                  >
                    <IconClose size={16} />
                  </button>
                )}
              </div>
            </div>

            <div className="no-scrollbar -mx-4 flex items-center gap-2 overflow-x-auto px-4 md:mx-0 md:px-0">
              <span className="eyebrow shrink-0 pr-1 text-ink-soft" id="style-filter-label">
                Estilo
              </span>
              <div role="group" aria-labelledby="style-filter-label" className="flex gap-1.5">
                {STYLES.map((s) => {
                  const on = styles.has(s.id);
                  return (
                    <button
                      key={s.id}
                      type="button"
                      aria-pressed={on}
                      onClick={() => toggleStyle(s.id)}
                      className={cn(
                        "min-h-11 shrink-0 rounded-full border px-4 text-sm transition-colors duration-200",
                        on ? "border-accent bg-accent-soft text-ink" : "border-line text-ink-soft hover:border-ink-soft hover:text-ink",
                      )}
                    >
                      {s.label}
                    </button>
                  );
                })}
              </div>
              <span aria-hidden className="mx-1 h-5 w-px shrink-0 bg-line" />
              <button
                type="button"
                aria-pressed={onlyFavorites}
                onClick={() => setOnlyFavorites((v) => !v)}
                className={cn(
                  "flex min-h-11 shrink-0 items-center gap-2 rounded-full border px-4 text-sm transition-colors duration-200",
                  onlyFavorites ? "border-accent bg-accent-soft text-ink" : "border-line text-ink-soft hover:border-ink-soft hover:text-ink",
                )}
              >
                <IconHeart size={16} filled={onlyFavorites} />
                Favoritos <span className="tabular-nums">({favorites.size})</span>
              </button>
              {hasFilters && (
                <button type="button" onClick={clearAll} className="link-underline ml-1 min-h-11 shrink-0 px-2 text-sm text-ink-soft hover:text-ink">
                  Limpar filtros
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Status para leitores de tela */}
        <p className="sr-only" role="status" aria-live="polite">
          {loading ? "Carregando a vitrine…" : `${filtered.length} ${filtered.length === 1 ? "peça encontrada" : "peças encontradas"}`}
        </p>

        {state.status === "error" && (
          <div role="alert" className="mt-8 flex flex-col gap-3 rounded-2xl border border-line bg-surface p-4 text-sm sm:flex-row sm:items-center sm:justify-between md:p-5">
            <p>
              <strong className="font-medium">{state.error}</strong> <span className="text-ink-soft">Mostrando a seleção salva neste site.</span>
            </p>
            <Button variant="outline" onClick={onRetry} icon={<IconRefresh size={16} />} iconMotion={false}>
              Tentar de novo
            </Button>
          </div>
        )}

        {/* Grid */}
        <div className="mt-8 md:mt-12">
          {loading ? (
            <div className="grid grid-cols-1 gap-x-6 gap-y-12 sm:grid-cols-2 lg:grid-cols-3 lg:gap-x-8 lg:gap-y-16">
              {Array.from({ length: 6 }, (_, i) => (
                <ProductCardSkeleton key={i} />
              ))}
            </div>
          ) : filtered.length === 0 ? (
            <EmptyState onlyFavorites={onlyFavorites} hasProducts={products.length > 0} onClear={clearAll} />
          ) : (
            <motion.ul layout={!reduce} className="grid grid-cols-1 gap-x-6 gap-y-12 sm:grid-cols-2 lg:grid-cols-3 lg:gap-x-8 lg:gap-y-16 lg:pb-12">
              <AnimatePresence mode="popLayout" initial={false}>
                {filtered.map((p, i) => (
                  <motion.li
                    key={p.id}
                    layout={!reduce}
                    initial={{ opacity: 0, y: reduce ? 0 : 24 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true, margin: "0px 0px -8% 0px" }}
                    exit={{ opacity: 0, scale: reduce ? 1 : 0.96, transition: { duration: 0.25 } }}
                    transition={{ duration: 0.7, ease: EASE_EDITORIAL, delay: reduce ? 0 : (i % 3) * 0.08 }}
                  >
                    {/* A coluna central desce levemente no desktop: ritmo editorial */}
                    <div className={cn("transition-transform duration-700 ease-editorial", i % 3 === 1 && "lg:translate-y-12")}>
                      <ProductCard product={p} favorite={favorites.has(p.id)} onToggleFavorite={onToggleFavorite} onOpen={onOpenProduct} />
                    </div>
                  </motion.li>
                ))}
              </AnimatePresence>
            </motion.ul>
          )}
        </div>
      </div>
    </section>
  );
}

function EmptyState({ onlyFavorites, hasProducts, onClear }: { onlyFavorites: boolean; hasProducts: boolean; onClear: () => void }) {
  const [title, text] = !hasProducts
    ? ["A vitrine está sendo renovada", "Novas peças chegam em breve. Acompanhe os lançamentos pelo Instagram."]
    : onlyFavorites
      ? ["Nenhuma favorita por aqui", "Toque no coração das peças que você gostar para reuni-las neste filtro."]
      : ["Nenhuma peça com esses filtros", "Tente outra combinação ou limpe os filtros para ver toda a curadoria."];
  return (
    <div className="flex flex-col items-center rounded-[1.5rem] border border-dashed border-line px-6 py-16 text-center md:py-24">
      <span aria-hidden className="font-display text-5xl italic text-accent">
        ∅
      </span>
      <h3 className="mt-4 font-display text-2xl md:text-3xl">{title}</h3>
      <p className="mt-2 max-w-[42ch] text-ink-soft">{text}</p>
      {hasProducts && (
        <Button variant="outline" className="mt-6" onClick={onClear}>
          Ver todas as peças
        </Button>
      )}
    </div>
  );
}
