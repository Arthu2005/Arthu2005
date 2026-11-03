import { img, s, type Bag } from "@/lib/content/queries";
import { ButtonLink } from "@/components/ui/Button";
import { HeroStage } from "./HeroStage";
import { FadeIn, SplitHeadline } from "./Reveal";

function Curves() {
  return (
    <svg className="pointer-events-none absolute inset-0 h-full w-full" viewBox="0 0 1440 900" preserveAspectRatio="none" aria-hidden="true">
      <defs>
        <linearGradient id="ptl-curve" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0" stopColor="#0a3d22" stopOpacity="0.1" />
          <stop offset="0.55" stopColor="#0a8539" stopOpacity="0.22" />
          <stop offset="1" stopColor="#a6e22e" stopOpacity="0.45" />
        </linearGradient>
      </defs>
      {Array.from({ length: 7 }).map((_, i) => (
        <path
          key={i}
          d={`M-40 ${620 + i * 26} C 320 ${520 + i * 18}, 640 ${820 - i * 12}, 980 ${560 + i * 20} S 1380 ${360 + i * 24}, 1500 ${420 + i * 22}`}
          fill="none"
          stroke="url(#ptl-curve)"
          strokeWidth="1"
          pathLength={1}
          className="[stroke-dasharray:1] [stroke-dashoffset:1] motion-safe:animate-[ptl-draw_3.2s_cubic-bezier(.16,1,.3,1)_forwards] motion-reduce:[stroke-dashoffset:0]"
          style={{ animationDelay: `${0.4 + i * 0.12}s` }}
        />
      ))}
    </svg>
  );
}

function FloatingChip({ className, kicker, text, delay }: { className: string; kicker: string; text: string; delay: number }) {
  return (
    <FadeIn delay={delay} className={`absolute hidden rounded-2xl border border-white/60 bg-white/55 px-4 py-3 shadow-[0_20px_50px_-25px_rgb(0_0_0/0.45)] backdrop-blur-md md:block ${className}`}>
      <p className="text-[0.65rem] uppercase tracking-[0.18em] text-steel">{kicker}</p>
      <p className="mt-1 text-sm font-medium text-ink">{text}</p>
    </FadeIn>
  );
}

export function HeroSection({ hero, accent }: { hero: Bag; accent: string }) {
  return (
    <section className="relative isolate flex min-h-[100svh] flex-col overflow-hidden bg-paper" aria-labelledby="hero-title">
      <Curves />
      <div className="grain pointer-events-none absolute inset-0 opacity-50" aria-hidden="true" />

      <div className="container-x relative flex flex-1 flex-col pt-24 pb-10 md:pt-28 md:pb-14 lg:static lg:justify-center lg:pb-0 lg:pt-20">
        <div className="max-w-[44rem] xl:max-w-[50rem]">
          <FadeIn delay={0.1} className="relative z-10">
            <p className="eyebrow">{s(hero, "eyebrow")}</p>
          </FadeIn>
          <h1 id="hero-title" className="relative z-10 mt-5 text-display font-semibold text-ink md:mt-7">
            <SplitHeadline text={s(hero, "title")} delay={0.2} />
          </h1>
          <FadeIn delay={0.7} className="relative z-10">
            <p className="mt-6 max-w-xl text-lg leading-relaxed text-ink-2 md:mt-8 md:text-xl">{s(hero, "subtitle")}</p>
          </FadeIn>

          {/*
            Oil stage. A single instance for every layout: in the text flow on mobile and tablet (between the
            subtitle and the buttons), pulled out to the right half of the section on desktop (the container is
            static there, so the absolute box is positioned against the section).
          */}
          <div className="relative -mx-4 mt-4 h-[42svh] min-h-[280px] md:mx-0 md:h-[48svh] lg:absolute lg:inset-y-0 lg:right-[-6%] lg:mx-0 lg:mt-0 lg:h-full lg:min-h-0 lg:w-[64%]">
            <HeroStage accent={accent} video={{ webm: s(hero, "videoWebm"), mp4: s(hero, "videoMp4"), poster: img(hero, "poster").src }} />
            <FloatingChip className="left-[10%] top-[22%]" kicker="Desde" text="1966 no rerrefino" delay={1.4} />
            <FloatingChip className="bottom-[20%] right-[16%]" kicker="Produto" text="Óleo básico rerrefinado · Grupo I" delay={1.6} />
          </div>

          <FadeIn delay={0.85} className="relative z-10 mt-4 flex flex-col gap-3 sm:flex-row md:mt-6 lg:mt-10">
            {s(hero, "primaryHref") && (
              <ButtonLink href={s(hero, "primaryHref")} size="lg" arrow>
                {s(hero, "primaryLabel")}
              </ButtonLink>
            )}
            {s(hero, "secondaryHref") && (
              <ButtonLink href={s(hero, "secondaryHref")} variant="secondary" size="lg">
                {s(hero, "secondaryLabel")}
              </ButtonLink>
            )}
          </FadeIn>
        </div>
      </div>

      <div className="container-x relative hidden items-end justify-between pb-8 text-sm text-steel lg:flex">
        <p>{s(hero, "caption")}</p>
        <a href="#apresentacao" className="group inline-flex items-center gap-3 rounded-full">
          Role para explorar
          <span className="relative flex h-10 w-6 justify-center rounded-full border border-ink/25" aria-hidden="true">
            <span className="mt-2 h-2 w-1 rounded-full bg-accent motion-safe:animate-[ptl-drip_1.8s_ease-in-out_infinite]" />
          </span>
        </a>
      </div>
    </section>
  );
}
