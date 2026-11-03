import type { ReactNode } from "react";
import { FadeIn, SplitHeadline } from "./Reveal";
import { OilDrops } from "./OilDrops";

/** Editorial header for inner pages. Keeps the oil signature with lightweight CSS droplets (no WebGL). */
export function PageHero({ eyebrow, title, subtitle, children, aside }: { eyebrow?: string; title: string; subtitle?: string; children?: ReactNode; aside?: ReactNode }) {
  return (
    <section className="relative isolate overflow-hidden border-b border-line bg-paper pt-32 pb-16 md:pt-44 md:pb-24">
      <OilDrops />
      <div className="container-x relative grid gap-10 lg:grid-cols-12 lg:items-end">
        <div className="lg:col-span-8">
          {eyebrow && (
            <FadeIn>
              <p className="eyebrow">{eyebrow}</p>
            </FadeIn>
          )}
          <h1 className="mt-6 text-h1 font-semibold">
            <SplitHeadline text={title} delay={0.1} />
          </h1>
          {subtitle && (
            <FadeIn delay={0.4}>
              <p className="mt-6 max-w-2xl text-lg leading-relaxed text-steel md:text-xl">{subtitle}</p>
            </FadeIn>
          )}
          {children && <FadeIn delay={0.5} className="mt-8">{children}</FadeIn>}
        </div>
        {aside && <FadeIn delay={0.5} className="lg:col-span-4">{aside}</FadeIn>}
      </div>
    </section>
  );
}
