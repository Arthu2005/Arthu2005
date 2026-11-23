import { AnimatePresence, motion, useMotionValueEvent, useReducedMotion, useScroll, useSpring, useTransform } from "motion/react";
import { useRef, useState } from "react";
import { IconArrowRight } from "@/components/ui/Icons";
import { Media } from "@/components/ui/Media";
import { RevealLines } from "@/components/ui/Reveal";
import { HIGHLIGHTS } from "@/data/catalog";
import { cn } from "@/lib/cn";
import { EASE_EDITORIAL } from "@/lib/motion";

interface HighlightsProps {
  onOpenProduct: (id: string) => void;
}

/**
 * Scrollytelling pinado: a seção é alta (um "passo" por destaque) e o palco fica fixo
 * enquanto o progresso da rolagem troca a peça em foco e suas informações.
 */
export function Highlights({ onOpenProduct }: HighlightsProps) {
  const trackRef = useRef<HTMLDivElement>(null);
  const reduce = useReducedMotion();
  const [active, setActive] = useState(0);
  const total = HIGHLIGHTS.length;

  const { scrollYProgress } = useScroll({ target: trackRef, offset: ["start start", "end end"] });
  const progress = useSpring(scrollYProgress, { stiffness: 140, damping: 30, restDelta: 0.001 });
  const stageScale = useTransform(scrollYProgress, [0, 1], reduce ? [1, 1] : [1, 0.94]);

  useMotionValueEvent(scrollYProgress, "change", (v) => {
    const next = Math.min(total - 1, Math.max(0, Math.floor(v * total * 0.9999)));
    setActive((cur) => (cur === next ? cur : next));
  });

  /** Leva a rolagem até o passo i (navegação por teclado/clique nos marcadores). */
  const goTo = (i: number) => {
    const el = trackRef.current;
    if (!el) return;
    const top = el.getBoundingClientRect().top + window.scrollY;
    const step = (el.offsetHeight - window.innerHeight) / total;
    window.scrollTo({ top: top + step * i + step * 0.5, behavior: reduce ? "auto" : "smooth" });
  };

  const item = HIGHLIGHTS[active]!;

  return (
    <section id="destaques" aria-labelledby="destaques-title" className="relative bg-canvas">
      <div className="container-editorial pt-24 pb-10 md:pt-36 md:pb-16">
        <div className="grid gap-6 md:grid-cols-[1fr_auto] md:items-end">
          <div>
            <p className="eyebrow text-accent">Bastidores da curadoria</p>
            <RevealLines id="destaques-title" lines={["Do tecido", "ao detalhe"]} className="mt-4 font-display text-display-lg tracking-[-0.02em]" italicIndex={1} />
          </div>
          <p className="max-w-[38ch] text-ink-soft">Role para acompanhar o que faz uma peça entrar — ou não — na arara da Paulla Boutiq.</p>
        </div>
      </div>

      {/* Trilho alto: cada destaque ocupa um "passo" de rolagem */}
      <div ref={trackRef} className="relative" style={{ height: `calc(${total} * 85svh + 100svh)` }}>
        <div className="sticky top-0 flex h-[100svh] items-center overflow-hidden">
          <div className="container-editorial grid h-full grid-rows-[minmax(0,1fr)_auto] gap-5 pt-[4.5rem] pb-5 md:grid-cols-[minmax(0,1.1fr)_minmax(0,1fr)] md:grid-rows-1 md:items-center md:gap-12 md:py-24 lg:gap-20">
            {/* Palco de mídia */}
            <motion.div style={{ scale: stageScale }} className="relative h-full min-h-0 overflow-hidden rounded-[1.25rem] md:h-[min(78svh,46rem)] md:rounded-[1.75rem]">
              {HIGHLIGHTS.map((h, i) => (
                <motion.div
                  key={h.id}
                  aria-hidden={i !== active}
                  className="absolute inset-0"
                  initial={false}
                  animate={{ opacity: i === active ? 1 : 0, scale: reduce ? 1 : i === active ? 1 : 1.08 }}
                  transition={{ duration: reduce ? 0.2 : 0.9, ease: EASE_EDITORIAL }}
                >
                  <Media asset={h.media} ratio="h-full w-full" artScale="lg" sizes="(min-width: 768px) 55vw, 100vw" />
                </motion.div>
              ))}

              {/* Contador sobre a mídia */}
              <div className="absolute top-4 left-4 flex items-center gap-2 rounded-full bg-canvas/80 px-3 py-1.5 text-xs font-medium tabular-nums backdrop-blur md:top-6 md:left-6">
                <span aria-hidden>{String(active + 1).padStart(2, "0")}</span>
                <span aria-hidden className="text-ink-soft">/ {String(total).padStart(2, "0")}</span>
              </div>
            </motion.div>

            {/* Informações sincronizadas */}
            <div className="relative flex min-h-0 flex-col md:h-[min(78svh,46rem)] md:justify-between">
              {/* Indicador de progresso */}
              <div className="flex items-center gap-4">
                <div className="relative h-px flex-1 overflow-hidden bg-line" aria-hidden>
                  <motion.div className="absolute inset-0 origin-left bg-ink" style={{ scaleX: progress }} />
                </div>
                <ol className="flex gap-1" aria-label="Destaques">
                  {HIGHLIGHTS.map((h, i) => (
                    <li key={h.id}>
                      <button
                        type="button"
                        onClick={() => goTo(i)}
                        aria-current={i === active ? "step" : undefined}
                        aria-label={`${i + 1}. ${h.title}`}
                        className="group grid size-11 place-items-center rounded-full"
                      >
                        <span className={cn("block size-2 rounded-full transition-all duration-300 ease-editorial group-hover:scale-125", i === active ? "scale-125 bg-accent" : "bg-line group-hover:bg-ink-soft")} />
                      </button>
                    </li>
                  ))}
                </ol>
              </div>

              <div className="relative mt-4 min-h-[15.5rem] md:mt-0 md:min-h-0" aria-live="polite">
                <AnimatePresence mode="wait" initial={false}>
                  <motion.article
                    key={item.id}
                    initial={{ opacity: 0, y: reduce ? 0 : 24 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: reduce ? 0 : -16 }}
                    transition={{ duration: reduce ? 0.15 : 0.55, ease: EASE_EDITORIAL }}
                  >
                    <p className="eyebrow text-accent">{item.kicker}</p>
                    <h3 className="mt-3 font-display text-[clamp(1.6rem,1.1rem+2.2vw,3rem)] leading-[1.05] tracking-[-0.015em]">{item.title}</h3>
                    <p className="mt-3 line-clamp-3 max-w-[46ch] text-ink-soft md:mt-5 md:line-clamp-none md:text-lg">{item.text}</p>
                    <dl className="mt-4 hidden grid-cols-2 gap-4 border-t border-line pt-4 sm:grid md:mt-8 md:pt-6">
                      {item.specs.map((s) => (
                        <div key={s.label}>
                          <dt className="eyebrow text-ink-soft">{s.label}</dt>
                          <dd className="mt-1.5 font-display text-lg italic">{s.value}</dd>
                        </div>
                      ))}
                    </dl>
                    {item.productId && (
                      <button
                        type="button"
                        onClick={() => onOpenProduct(item.productId!)}
                        className="group mt-4 inline-flex min-h-11 items-center gap-3 text-sm font-medium tracking-[0.14em] uppercase md:mt-8"
                      >
                        <span className="link-underline">Ver a peça</span>
                        <IconArrowRight size={18} className="transition-transform duration-300 ease-editorial group-hover:translate-x-1" />
                      </button>
                    )}
                  </motion.article>
                </AnimatePresence>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
