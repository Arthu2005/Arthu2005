import { motion, useReducedMotion, useScroll, useTransform, type MotionValue } from "motion/react";
import { useRef } from "react";
import { ButtonLink } from "@/components/ui/Button";
import { IconInstagram } from "@/components/ui/Icons";
import { Media } from "@/components/ui/Media";
import { Reveal } from "@/components/ui/Reveal";
import { BRAND } from "@/config/brand";
import { MANIFESTO_MEDIA } from "@/data/catalog";

const MANIFESTO =
  "A Paulla Boutiq nasceu de um gesto simples: escolher com calma. Cada peça é provada, observada em movimento e só chega à arara quando tem algo a dizer — sobre tecido, sobre caimento, sobre quem vai vestir.";

const PILLARS = [
  { title: "Curadoria pessoal", text: "Todas as peças passam pela prova e pelo olhar da Paulla antes de entrar na vitrine." },
  { title: "Tiragens pequenas", text: "Poucas unidades por modelo, para que o que você veste continue sendo seu." },
  { title: "Atendimento próximo", text: "Reservas, provas e ajustes com hora marcada, do jeito que cada cliente precisa." },
];

export function Manifesto() {
  const textRef = useRef<HTMLParagraphElement>(null);
  const mediaRef = useRef<HTMLDivElement>(null);
  const reduce = useReducedMotion();
  const { scrollYProgress } = useScroll({ target: textRef, offset: ["start 0.85", "end 0.45"] });
  const { scrollYProgress: mediaProgress } = useScroll({ target: mediaRef, offset: ["start end", "end start"] });
  const yA = useTransform(mediaProgress, [0, 1], reduce ? ["0%", "0%"] : ["8%", "-8%"]);
  const yB = useTransform(mediaProgress, [0, 1], reduce ? ["0%", "0%"] : ["-4%", "14%"]);

  const words = MANIFESTO.split(" ");

  return (
    <section id="manifesto" aria-labelledby="manifesto-title" className="relative overflow-hidden bg-surface py-24 md:py-40">
      <div className="container-editorial">
        <h2 id="manifesto-title" className="eyebrow text-accent">
          Manifesto
        </h2>

        {/* Texto que "acende" palavra a palavra com o scroll */}
        <p ref={textRef} className="mt-8 max-w-[22ch] font-display text-[clamp(1.85rem,1.1rem+3.4vw,4.4rem)] leading-[1.12] tracking-[-0.015em] md:max-w-[24ch]">
          {reduce ? (
            MANIFESTO
          ) : (
            <>
              <span className="sr-only">{MANIFESTO}</span>
              <span aria-hidden>
                {words.map((w, i) => (
                  <Word key={i} progress={scrollYProgress} range={[i / words.length, (i + 1) / words.length]} italic={w === "calma." || w === "dizer"}>
                    {w}
                  </Word>
                ))}
              </span>
            </>
          )}
        </p>

        <div ref={mediaRef} className="mt-16 grid grid-cols-12 gap-4 md:mt-28 md:gap-8">
          <motion.div style={{ y: yA }} className="col-span-7 md:col-span-5 md:col-start-2">
            <Media asset={MANIFESTO_MEDIA[0]!} ratio="aspect-[4/5]" className="rounded-[1.25rem]" sizes="(min-width: 768px) 40vw, 60vw" />
          </motion.div>
          <motion.div style={{ y: yB }} className="col-span-5 mt-20 md:col-span-4 md:col-start-8 md:mt-40">
            <Media asset={MANIFESTO_MEDIA[1]!} ratio="aspect-[3/4]" className="rounded-[1.25rem]" sizes="(min-width: 768px) 30vw, 40vw" />
          </motion.div>
        </div>

        <ul className="mt-20 grid gap-10 border-t border-line pt-10 md:mt-32 md:grid-cols-3 md:gap-12">
          {PILLARS.map((p, i) => (
            <li key={p.title}>
              <Reveal delay={i * 0.08}>
                <span className="font-display text-sm italic text-accent">0{i + 1}</span>
                <h3 className="mt-2 font-display text-2xl">{p.title}</h3>
                <p className="mt-2 max-w-[36ch] text-ink-soft">{p.text}</p>
              </Reveal>
            </li>
          ))}
        </ul>

        {/* Convite para o Instagram */}
        <Reveal className="mt-20 md:mt-32">
          <div className="relative overflow-hidden rounded-[1.75rem] bg-ink px-6 py-12 text-canvas md:px-14 md:py-16">
            <div aria-hidden className="pointer-events-none absolute -top-24 -right-24 size-72 rounded-full bg-accent/40 blur-3xl" />
            <div className="relative grid gap-8 md:grid-cols-[1fr_auto] md:items-end">
              <div>
                <p className="eyebrow opacity-70">Feed & stories</p>
                <p className="mt-4 max-w-[20ch] font-display text-[clamp(1.9rem,1.3rem+2.4vw,3.4rem)] leading-[1.05]">
                  Os bastidores e as novidades chegam primeiro <em>no Instagram</em>.
                </p>
                <p className="mt-4 max-w-[44ch] opacity-75">Provas, chegadas da semana e peças que saem antes de entrar na vitrine. Acompanhe {BRAND.instagram.handle}.</p>
              </div>
              <ButtonLink
                href={BRAND.instagram.url}
                external
                size="lg"
                className="bg-canvas text-ink hover:bg-accent hover:text-on-accent"
                icon={<IconInstagram size={18} />}
                iconMotion={false}
              >
                Seguir {BRAND.instagram.handle}
              </ButtonLink>
            </div>
          </div>
        </Reveal>
      </div>
    </section>
  );
}

function Word({ children, progress, range, italic }: { children: string; progress: MotionValue<number>; range: [number, number]; italic?: boolean }) {
  const opacity = useTransform(progress, range, [0.16, 1]);
  return (
    <>
      <motion.span style={{ opacity }} className={italic ? "italic text-accent" : undefined}>
        {children}
      </motion.span>{" "}
    </>
  );
}
