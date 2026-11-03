import { Droplets, Leaf, RefreshCcw, Sprout } from "lucide-react";
import { Markdown } from "@/components/Markdown";
import { ButtonLink } from "@/components/ui/Button";
import { bool, img, rep, s, type Bag } from "@/lib/content/queries";
import { ImageSlot } from "./ImageSlot";
import { Provisional } from "./Provisional";
import { Reveal } from "./Reveal";

const ICONS = { water: Droplets, soil: Sprout, cycle: RefreshCcw, leaf: Leaf } as const;

/** Home highlight: the environmental purpose of the business (oil kept out of soil and water, resource reused). */
export function NatureSection({ data, marks }: { data: Bag; marks: boolean }) {
  const pillars = rep(data, "pillars");
  return (
    <section className="relative isolate overflow-hidden py-24 md:py-36" aria-labelledby="nature-title">
      {/* soft natural light: lime glow fading into white, with flowing water lines */}
      <div className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(70%_60%_at_85%_15%,rgb(166_226_46/0.18),transparent_70%),radial-gradient(60%_50%_at_10%_90%,rgb(10_133_57/0.1),transparent_70%)]" aria-hidden="true" />
      <svg className="pointer-events-none absolute inset-x-0 bottom-0 -z-10 h-48 w-full" viewBox="0 0 1440 200" preserveAspectRatio="none" aria-hidden="true">
        {Array.from({ length: 5 }).map((_, i) => (
          <path
            key={i}
            d={`M0 ${120 + i * 14} C 240 ${80 + i * 10}, 480 ${170 - i * 6}, 720 ${120 + i * 8} S 1200 ${70 + i * 12}, 1440 ${110 + i * 10}`}
            fill="none"
            stroke={i % 2 ? "#a6e22e" : "#0a8539"}
            strokeOpacity={0.12 + i * 0.03}
            strokeWidth="1.2"
          />
        ))}
      </svg>
      <div className="container-x">
        <div className="grid gap-12 lg:grid-cols-12 lg:items-end">
          <Reveal className="lg:col-span-7">
            <p className="eyebrow">{s(data, "eyebrow")}</p>
            <h2 id="nature-title" className="mt-6 text-h1 font-semibold">
              {s(data, "title")}
            </h2>
            <Provisional show={marks && bool(data, "provisional")} className="mt-5" />
          </Reveal>
          <Reveal delay={0.1} className="lg:col-span-5">
            <Markdown source={s(data, "body")} />
            {s(data, "linkHref") && (
              <ButtonLink href={s(data, "linkHref")} variant="secondary" className="mt-8" arrow>
                {s(data, "linkLabel")}
              </ButtonLink>
            )}
          </Reveal>
        </div>

        <div className="mt-16 grid gap-5 lg:grid-cols-12">
          <ul className="grid gap-5 sm:grid-cols-3 lg:col-span-8">
            {pillars.map((p, i) => {
              const Icon = ICONS[s(p, "icon") as keyof typeof ICONS] ?? Leaf;
              return (
                <Reveal as="li" key={i} delay={i * 0.08} className="group relative flex flex-col overflow-hidden rounded-[var(--radius-card)] border border-accent/15 bg-white/80 p-7 backdrop-blur transition-[transform,box-shadow] duration-500 hover:-translate-y-1 hover:shadow-[0_30px_60px_-30px_rgb(10_61_34/0.45)]">
                  <span className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-accent-deep text-lime transition-transform duration-500 group-hover:scale-110" aria-hidden="true">
                    <Icon className="h-6 w-6" />
                  </span>
                  <h3 className="mt-8 text-xl font-semibold">{s(p, "title")}</h3>
                  <p className="mt-2 text-[0.95rem] leading-relaxed text-steel">{s(p, "text")}</p>
                  <span className="mt-auto block h-0.5 w-10 translate-y-4 rounded-full bg-gradient-to-r from-accent to-lime transition-[width] duration-700 group-hover:w-20" aria-hidden="true" />
                </Reveal>
              );
            })}
          </ul>
          <Reveal delay={0.2} className="lg:col-span-4">
            <ImageSlot image={img(data, "image")} className="h-full min-h-64 rounded-[var(--radius-card)]" label="Foto de natureza / operação — pendente" />
          </Reveal>
        </div>
      </div>
    </section>
  );
}
