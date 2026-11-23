import { MotionConfig } from "motion/react";
import { useCallback, useEffect, useMemo, useState } from "react";
import { QuickView } from "@/components/catalog/QuickView";
import { Footer } from "@/components/layout/Footer";
import { Header } from "@/components/layout/Header";
import { Hero } from "@/components/sections/Hero";
import { Highlights } from "@/components/sections/Highlights";
import { Manifesto } from "@/components/sections/Manifesto";
import { Showcase } from "@/components/sections/Showcase";
import { useCatalog } from "@/hooks/useCatalog";
import { useFavorites } from "@/hooks/useFavorites";
import { emit } from "@/lib/events";
import { PRODUCTS } from "@/data/catalog";

export default function App() {
  const { state, retry } = useCatalog();
  const { favorites, toggle: toggleFavorite } = useFavorites();
  const [openId, setOpenId] = useState<string | null>(null);

  const products = state.status === "ready" ? state.data : state.status === "error" ? state.fallback : PRODUCTS;
  const openProduct = useMemo(() => (openId ? (products.find((p) => p.id === openId) ?? PRODUCTS.find((p) => p.id === openId) ?? null) : null), [openId, products]);
  const closeQuickView = useCallback(() => setOpenId(null), []);

  // Links com âncora (ex.: /#vitrine) chegam antes da renderização: rola após montar.
  useEffect(() => {
    const id = decodeURIComponent(window.location.hash.slice(1));
    if (!id) return;
    const frame = requestAnimationFrame(() => document.getElementById(id)?.scrollIntoView({ behavior: "auto", block: "start" }));
    return () => cancelAnimationFrame(frame);
  }, []);

  return (
    <MotionConfig reducedMotion="user">
      <a
        href="#vitrine"
        className="fixed top-3 left-3 z-[100] -translate-y-24 rounded-full bg-ink px-5 py-3 text-sm text-canvas transition-transform focus-visible:translate-y-0"
      >
        Pular para a vitrine
      </a>

      <Header favoritesCount={favorites.size} onSearch={() => emit("pb:search")} onShowFavorites={() => emit("pb:favorites")} />

      <main>
        <Hero />
        <Highlights onOpenProduct={setOpenId} />
        <Showcase state={state} onRetry={retry} favorites={favorites} onToggleFavorite={toggleFavorite} onOpenProduct={setOpenId} />
        <Manifesto />
      </main>

      <Footer />

      <QuickView product={openProduct} onClose={closeQuickView} favorite={openProduct ? favorites.has(openProduct.id) : false} onToggleFavorite={toggleFavorite} />
    </MotionConfig>
  );
}
