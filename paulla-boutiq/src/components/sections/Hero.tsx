import { motion, useReducedMotion, useScroll, useTransform } from "motion/react";
import { useRef } from "react";
import { ButtonLink } from "@/components/ui/Button";
import { IconArrowRight, IconInstagram } from "@/components/ui/Icons";
import { Media } from "@/components/ui/Media";
import { BRAND } from "@/config/brand";
import { HERO_MEDIA } from "@/data/catalog";
import { EASE_EDITORIAL } from "@/lib/motion";

const TITLE = ["A arte de", "escolher pouco", "e bem."];

export function Hero() {
  const ref = useRef<HTMLElement>(null);
  const reduce = useReducedMotion();
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start start", "end start"] });

  // Paralaxe sutil: a mídia desce mais devagar que a página e aproxima levemente.
  const mediaY = useTransform(scrollYProgress, [0, 1], ["0%", reduce ? "0%" : "18%"]);
  const mediaScale = useTransform(scrollYProgress, [0, 1], [1.04, reduce ? 1.04 : 1.14]);
  const contentY = useTransform(scrollYProgress, [0, 1], ["0%", reduce ? "0%" : "-22%"]);
  const contentOpacity = useTransform(scrollYProgress, [0, 0.65], [1, 0]);
  const veil = useTransform(scrollYProgress, [0, 1], [0, 0.45]);

  const enter = (delay: number) => ({
    initial: { opacity: 0, y: reduce ? 0 : 18 },
    animate: { opacity: 1, y: 0 },
    transition: { duration: 0.9, ease: EASE_EDITORIAL, delay },
  });

  return (
    <section id="inicio" ref={ref} aria-labelledby="hero-title" className="relative isolate h-[100svh] min-h-[36rem] overflow-hidden bg-[#1c1714] text-[#f7f3ee]">
      <motion.div className="absolute inset-0 -z-10 will-change-transform" style={{ y: mediaY, scale: mediaScale }}>
        <Media asset={HERO_MEDIA} ratio="h-full w-full" priority sizes="100vw" artScale="lg" artLayout="items-start justify-center pt-[13svh] md:items-center md:justify-end md:pt-0 md:pr-[9%]" />
      </motion.div>
      {/* Véus para legibilidade do texto sobre qualquer fotografia */}
      <div aria-hidden className="absolute inset-0 -z-10 bg-[linear-gradient(180deg,rgb(20_17_16/0.55)_0%,rgb(20_17_16/0.05)_32%,rgb(20_17_16/0.15)_55%,rgb(20_17_16/0.78)_100%)]" />
      <motion.div aria-hidden className="absolute inset-0 -z-10 bg-[#141110]" style={{ opacity: veil }} />

      <motion.div style={{ y: contentY, opacity: contentOpacity }} className="container-editorial flex h-full flex-col justify-end pb-[max(2.5rem,env(safe-area-inset-bottom))] md:pb-16">
        <motion.p {...enter(0.15)} className="eyebrow mb-5 flex items-center gap-3 md:mb-7">
          <span aria-hidden className="h-px w-10 bg-current" />
          Curadoria · Coleção da estação
        </motion.p>

        <h1 id="hero-title" className="font-display text-display-xl font-normal tracking-[-0.025em]">
          <span className="sr-only">{TITLE.join(" ")}</span>
          {TITLE.map((line, i) => (
            <span key={line} aria-hidden className="block overflow-hidden pb-[0.06em]">
              <motion.span
                className={i === 1 ? "block italic" : "block"}
                initial={{ y: reduce ? 0 : "108%", opacity: reduce ? 0 : 1 }}
                animate={{ y: "0%", opacity: 1 }}
                transition={{ duration: 1.05, ease: EASE_EDITORIAL, delay: 0.25 + i * 0.11 }}
              >
                {line}
              </motion.span>
            </span>
          ))}
        </h1>

        <div className="mt-8 flex flex-col gap-8 md:mt-10 md:flex-row md:items-end md:justify-between">
          <motion.p {...enter(0.7)} className="max-w-[34ch] text-[clamp(1rem,0.92rem+0.35vw,1.2rem)] leading-relaxed text-[#f7f3ee]/85">
            Peças selecionadas uma a uma pela Paulla — alfaiataria fluida, tecidos nobres e acessórios em tiragens pequenas.
          </motion.p>
          <motion.div {...enter(0.85)} className="flex flex-col gap-3 sm:flex-row">
            <ButtonLink href="#vitrine" variant="inverse" size="lg" icon={<IconArrowRight size={18} />}>
              Explorar vitrine
            </ButtonLink>
            <ButtonLink
              href={BRAND.instagram.url}
              external
              size="lg"
              variant="outline-light"
              icon={<IconInstagram size={18} />}
              iconMotion={false}
            >
              {BRAND.instagram.handle}
            </ButtonLink>
          </motion.div>
        </div>
      </motion.div>

    </section>
  );
}
