import { motion, useReducedMotion } from "motion/react";
import { memo, useState } from "react";
import { IconHeart, IconPlus } from "@/components/ui/Icons";
import { Media } from "@/components/ui/Media";
import { CATEGORY_LABEL } from "@/data/catalog";
import { cn } from "@/lib/cn";
import { formatPrice } from "@/lib/contact";
import type { Availability, Product } from "@/types/catalog";

export const AVAILABILITY_LABEL: Record<Availability, string> = {
  disponivel: "Disponível",
  ultimas: "Últimas unidades",
  "sob-encomenda": "Sob encomenda",
};

interface ProductCardProps {
  product: Product;
  favorite: boolean;
  onToggleFavorite: (id: string) => void;
  onOpen: (id: string) => void;
}

/**
 * Card editorial. Desktop: troca para a imagem de detalhe no hover/foco.
 * Toque: o botão "ver detalhe" alterna as imagens sem abrir a peça.
 */
export const ProductCard = memo(function ProductCard({ product, favorite, onToggleFavorite, onOpen }: ProductCardProps) {
  const [showDetail, setShowDetail] = useState(false);
  const reduce = useReducedMotion();
  const titleId = `card-${product.id}`;

  return (
    <article aria-labelledby={titleId} className="group/card relative flex flex-col">
      <div className="relative overflow-hidden rounded-[1.1rem] bg-surface">
        {/* Imagem principal e de detalhe sobrepostas */}
        <div className="relative aspect-[3/4]">
          <Media
            asset={product.media.primary}
            ratio="h-full w-full"
            sizes="(min-width: 1024px) 30vw, (min-width: 640px) 45vw, 92vw"
            className="absolute! inset-0 transition-transform duration-[900ms] ease-editorial group-hover/card:scale-[1.035]"
          />
          <div
            className={cn(
              "absolute inset-0 transition-opacity duration-500 ease-editorial",
              showDetail ? "opacity-100" : "opacity-0 [@media(hover:hover)]:group-hover/card:opacity-100 [@media(hover:hover)]:group-focus-within/card:opacity-100",
            )}
          >
            <Media asset={product.media.detail} ratio="h-full w-full" sizes="(min-width: 1024px) 30vw, (min-width: 640px) 45vw, 92vw" />
          </div>
        </div>

        {/* Botão principal: área inteira do card abre o Quick View */}
        <button
          type="button"
          onClick={() => onOpen(product.id)}
          className="absolute inset-0 z-10 rounded-[1.1rem] focus-visible:outline-offset-[-4px]"
          aria-label={`Ver detalhes: ${product.name}`}
        />

        {product.badge && (
          <span className="pointer-events-none absolute top-3 left-3 z-20 rounded-full bg-canvas/90 px-3 py-1.5 text-[0.65rem] font-medium tracking-[0.16em] text-ink uppercase backdrop-blur">
            {product.badge}
          </span>
        )}

        <motion.button
          type="button"
          onClick={() => onToggleFavorite(product.id)}
          aria-pressed={favorite}
          aria-label={favorite ? `Remover ${product.name} dos favoritos` : `Salvar ${product.name} nos favoritos`}
          whileTap={reduce ? undefined : { scale: 0.85 }}
          className={cn(
            "absolute top-2 right-2 z-20 grid size-11 place-items-center rounded-full bg-canvas/85 backdrop-blur transition-colors duration-200 hover:bg-canvas",
            favorite ? "text-accent" : "text-ink",
          )}
        >
          <motion.span key={String(favorite)} initial={reduce || !favorite ? false : { scale: 0.5 }} animate={{ scale: 1 }} transition={{ type: "spring", stiffness: 600, damping: 18 }}>
            <IconHeart filled={favorite} size={19} />
          </motion.span>
        </motion.button>

        {/* Alternar imagem (útil no toque; também acessível via teclado) */}
        <button
          type="button"
          onClick={() => setShowDetail((v) => !v)}
          aria-pressed={showDetail}
          aria-label={showDetail ? `Mostrar look de ${product.name}` : `Mostrar detalhe de ${product.name}`}
          className="absolute right-2 bottom-2 z-20 flex min-h-11 items-center gap-2 rounded-full bg-canvas/85 px-4 text-[0.65rem] font-medium tracking-[0.16em] uppercase backdrop-blur transition-colors hover:bg-canvas [@media(hover:hover)]:pointer-events-none [@media(hover:hover)]:opacity-0 [@media(hover:hover)]:focus-visible:pointer-events-auto [@media(hover:hover)]:focus-visible:opacity-100"
        >
          <IconPlus size={14} className={cn("transition-transform duration-300 ease-editorial", showDetail && "rotate-45")} />
          {showDetail ? "Look" : "Detalhe"}
        </button>
      </div>

      <div className="mt-4 flex items-start justify-between gap-4 px-0.5">
        <div className="min-w-0">
          <p className="eyebrow text-ink-soft">{CATEGORY_LABEL[product.category]}</p>
          <h3 id={titleId} className="mt-1.5 font-display text-[1.45rem] leading-tight">
            {product.name}
          </h3>
          <p className="mt-1 line-clamp-2 text-sm text-ink-soft">{product.shortDescription}</p>
        </div>
        <div className="shrink-0 text-right">
          <p className="text-sm font-medium">{formatPrice(product.priceCents)}</p>
          <p className={cn("mt-1 text-xs", product.availability === "ultimas" ? "text-accent" : "text-ink-soft")}>{AVAILABILITY_LABEL[product.availability]}</p>
        </div>
      </div>
    </article>
  );
});

export function ProductCardSkeleton() {
  return (
    <div aria-hidden className="flex flex-col">
      <div className="aspect-[3/4] animate-shimmer rounded-[1.1rem] bg-[linear-gradient(100deg,var(--c-surface)_30%,var(--c-surface-2)_50%,var(--c-surface)_70%)] bg-[length:200%_100%]" />
      <div className="mt-4 h-3 w-20 rounded bg-surface-2" />
      <div className="mt-3 h-5 w-40 rounded bg-surface-2" />
      <div className="mt-2 h-3 w-56 rounded bg-surface" />
    </div>
  );
}
