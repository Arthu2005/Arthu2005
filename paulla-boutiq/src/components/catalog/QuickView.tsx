import { motion, useReducedMotion } from "motion/react";
import { useEffect, useId, useRef, useState } from "react";
import { ButtonLink } from "@/components/ui/Button";
import { Dialog } from "@/components/ui/Dialog";
import { IconArrowRight, IconClose, IconHeart, IconInstagram, IconWhatsApp } from "@/components/ui/Icons";
import { Media } from "@/components/ui/Media";
import { BRAND } from "@/config/brand";
import { CATEGORY_LABEL } from "@/data/catalog";
import { cn } from "@/lib/cn";
import { formatPrice, interestLink } from "@/lib/contact";
import type { Product } from "@/types/catalog";
import { AVAILABILITY_LABEL } from "./ProductCard";

interface QuickViewProps {
  product: Product | null;
  onClose: () => void;
  favorite: boolean;
  onToggleFavorite: (id: string) => void;
}

export function QuickView({ product, onClose, favorite, onToggleFavorite }: QuickViewProps) {
  // Mantém o último produto durante a animação de saída.
  const lastRef = useRef<Product | null>(product);
  if (product) lastRef.current = product;
  const p = product ?? lastRef.current;

  return (
    <Dialog open={!!product} onClose={onClose} title={p ? p.name : "Detalhes da peça"} hideTitle description={p?.shortDescription} className="md:w-[min(72rem,100%)]">
      {p && <QuickViewBody key={p.id} product={p} onClose={onClose} favorite={favorite} onToggleFavorite={onToggleFavorite} />}
    </Dialog>
  );
}

function QuickViewBody({ product, onClose, favorite, onToggleFavorite }: { product: Product; onClose: () => void; favorite: boolean; onToggleFavorite: (id: string) => void }) {
  const reduce = useReducedMotion();
  const [size, setSize] = useState<string | null>(product.sizes.length === 1 ? product.sizes[0]! : null);
  const [color, setColor] = useState(product.colors[0]?.name ?? null);
  const [slide, setSlide] = useState(0);
  const trackRef = useRef<HTMLDivElement>(null);
  const sizeGroup = useId();
  const colorGroup = useId();
  const contact = interestLink(product, size);
  const images = [product.media.primary, product.media.detail];

  // Sincroniza o indicador com o swipe nativo (scroll-snap).
  useEffect(() => {
    const el = trackRef.current;
    if (!el) return;
    const onScroll = () => setSlide(Math.round(el.scrollLeft / Math.max(1, el.clientWidth)));
    el.addEventListener("scroll", onScroll, { passive: true });
    return () => el.removeEventListener("scroll", onScroll);
  }, []);

  const goToSlide = (i: number) => {
    const el = trackRef.current;
    if (el) el.scrollTo({ left: i * el.clientWidth, behavior: reduce ? "auto" : "smooth" });
  };

  const stagger = (i: number) => ({
    initial: { opacity: 0, y: reduce ? 0 : 14 },
    animate: { opacity: 1, y: 0 },
    transition: { duration: 0.5, ease: [0.22, 1, 0.36, 1] as const, delay: reduce ? 0 : 0.12 + i * 0.05 },
  });

  return (
    <div className="grid min-h-0 flex-1 overflow-y-auto overscroll-contain md:grid-cols-[minmax(0,1.05fr)_minmax(0,1fr)] md:overflow-hidden">
      {/* Galeria com swipe */}
      <div className="relative bg-surface md:h-full md:min-h-0">
        <div
          ref={trackRef}
          className="no-scrollbar flex aspect-[4/5] snap-x snap-mandatory overflow-x-auto md:aspect-auto md:h-full"
          role="region"
          aria-roledescription="carrossel"
          aria-label={`Imagens de ${product.name}`}
          tabIndex={0}
          onKeyDown={(e) => {
            if (e.key === "ArrowRight") goToSlide(Math.min(images.length - 1, slide + 1));
            if (e.key === "ArrowLeft") goToSlide(Math.max(0, slide - 1));
          }}
        >
          {images.map((img, i) => (
            <div key={i} className="relative h-full w-full shrink-0 snap-center" role="group" aria-roledescription="slide" aria-label={`${i + 1} de ${images.length}`}>
              <Media asset={img} ratio="h-full w-full" artScale="md" sizes="(min-width: 768px) 50vw, 100vw" priority={i === 0} />
            </div>
          ))}
        </div>
        <div className="absolute bottom-3 left-1/2 flex -translate-x-1/2 gap-1 rounded-full bg-canvas/80 px-1 backdrop-blur">
          {images.map((img, i) => (
            <button
              key={i}
              type="button"
              onClick={() => goToSlide(i)}
              aria-label={`Ver imagem ${i + 1}: ${img.alt}`}
              aria-current={slide === i}
              className="grid size-9 place-items-center rounded-full"
            >
              <span className={cn("block h-1.5 rounded-full transition-all duration-300 ease-editorial", slide === i ? "w-5 bg-ink" : "w-1.5 bg-ink/30")} />
            </button>
          ))}
        </div>
      </div>

      {/* Informações */}
      <div className="flex min-h-0 flex-col md:overflow-y-auto">
        <div className="sticky top-0 z-10 hidden justify-end bg-canvas/90 p-3 backdrop-blur md:flex">
          <CloseButton onClose={onClose} />
        </div>
        <div className="flex flex-1 flex-col px-5 pt-6 pb-[max(1.5rem,env(safe-area-inset-bottom))] md:px-10 md:pt-2 md:pb-10">
          <motion.div {...stagger(0)} className="flex items-center gap-3">
            <p className="eyebrow text-ink-soft">{CATEGORY_LABEL[product.category]}</p>
            {product.badge && <span className="rounded-full bg-accent-soft px-2.5 py-1 text-[0.62rem] font-medium tracking-[0.16em] uppercase">{product.badge}</span>}
          </motion.div>
          <motion.p {...stagger(1)} aria-hidden className="mt-3 font-display text-[clamp(2rem,1.5rem+2vw,3.25rem)] leading-[1.02] tracking-[-0.015em]">
            {product.name}
          </motion.p>
          <motion.div {...stagger(2)} className="mt-3 flex items-baseline gap-3">
            <p className="text-lg font-medium">{formatPrice(product.priceCents)}</p>
            <p className={cn("text-sm", product.availability === "ultimas" ? "text-accent" : "text-ink-soft")}>· {AVAILABILITY_LABEL[product.availability]}</p>
          </motion.div>
          <motion.p {...stagger(3)} className="mt-5 text-ink-soft md:text-[1.05rem]">
            {product.description}
          </motion.p>

          {/* Cores */}
          {product.colors.length > 0 && (
            <motion.fieldset {...stagger(4)} className="mt-7">
              <legend className="eyebrow text-ink-soft">
                Cor: <span className="text-ink normal-case tracking-normal">{color}</span>
              </legend>
              <div className="mt-3 flex flex-wrap gap-2">
                {product.colors.map((c) => (
                  <label key={c.name} className="relative grid size-11 cursor-pointer place-items-center rounded-full">
                    <input type="radio" name={colorGroup} value={c.name} checked={color === c.name} onChange={() => setColor(c.name)} className="peer sr-only" />
                    <span className="pointer-events-none absolute inset-0 rounded-full border border-transparent transition-colors duration-200 peer-checked:border-ink peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-[var(--c-focus)]" />
                    <span className="size-7 rounded-full border border-black/10 shadow-inner" style={{ backgroundColor: c.hex }} />
                    <span className="sr-only">{c.name}</span>
                  </label>
                ))}
              </div>
            </motion.fieldset>
          )}

          {/* Tamanhos */}
          <motion.fieldset {...stagger(5)} className="mt-6">
            <legend className="eyebrow text-ink-soft">Tamanho {product.sizes.length > 1 && <span className="normal-case tracking-normal">(opcional)</span>}</legend>
            <div className="mt-3 flex flex-wrap gap-2">
              {product.sizes.map((s) => (
                <label key={s} className="cursor-pointer">
                  <input type="radio" name={sizeGroup} value={s} checked={size === s} onChange={() => setSize(s)} className="peer sr-only" />
                  <span className="grid min-h-11 min-w-11 place-items-center rounded-full border border-line px-4 text-sm transition-colors duration-200 peer-checked:border-ink peer-checked:bg-ink peer-checked:text-canvas peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-[var(--c-focus)] hover:border-ink-soft">
                    {s}
                  </span>
                </label>
              ))}
            </div>
          </motion.fieldset>

          <motion.details {...stagger(6)} className="group mt-7 border-y border-line" open>
            <summary className="flex min-h-12 cursor-pointer list-none items-center justify-between gap-4 py-3 text-sm font-medium [&::-webkit-details-marker]:hidden">
              Composição e caimento
              <span aria-hidden className="text-xl leading-none transition-transform duration-300 ease-editorial group-open:rotate-45">
                +
              </span>
            </summary>
            <ul className="space-y-1.5 pb-4 text-sm text-ink-soft">
              {product.details.map((d) => (
                <li key={d} className="flex gap-3">
                  <span aria-hidden className="mt-[0.6em] h-px w-3 shrink-0 bg-current" />
                  {d}
                </li>
              ))}
            </ul>
          </motion.details>

          <motion.div {...stagger(7)} className="mt-auto flex flex-col gap-3 pt-8">
            <div className="flex gap-2">
              <ButtonLink
                href={contact.href}
                external
                size="lg"
                className="flex-1"
                icon={contact.channel === "whatsapp" ? <IconWhatsApp size={18} /> : <IconArrowRight size={18} />}
                iconMotion={contact.channel !== "whatsapp"}
              >
                Tenho interesse
              </ButtonLink>
              <motion.button
                type="button"
                onClick={() => onToggleFavorite(product.id)}
                aria-pressed={favorite}
                aria-label={favorite ? "Remover dos favoritos" : "Salvar nos favoritos"}
                whileTap={reduce ? undefined : { scale: 0.9 }}
                className={cn("grid size-13 shrink-0 place-items-center rounded-full border transition-colors duration-200", favorite ? "border-accent bg-accent-soft text-accent" : "border-line hover:border-ink")}
              >
                <IconHeart filled={favorite} />
              </motion.button>
            </div>
            <p className="text-center text-xs text-ink-soft">
              {contact.channel === "whatsapp" ? "Abre o WhatsApp com a peça e o tamanho já preenchidos." : "Envie uma mensagem no Direct citando o nome da peça."}{" "}
              <a href={BRAND.instagram.url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 underline underline-offset-4 hover:text-ink">
                <IconInstagram size={13} /> Ver no Instagram<span className="sr-only"> (abre em nova aba)</span>
              </a>
            </p>
          </motion.div>
        </div>
      </div>

      {/* Fechar no mobile fica sobre a imagem */}
      <div className="absolute top-8 right-3 z-20 md:hidden">
        <CloseButton onClose={onClose} />
      </div>
    </div>
  );
}

function CloseButton({ onClose }: { onClose: () => void }) {
  return (
    <button
      type="button"
      onClick={onClose}
      data-autofocus
      aria-label="Fechar detalhes"
      className="grid size-11 place-items-center rounded-full bg-canvas/85 backdrop-blur transition-[background-color,transform] duration-200 hover:bg-surface-2 active:scale-95"
    >
      <IconClose />
    </button>
  );
}
