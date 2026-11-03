import type { Metadata } from "next";
import { MapPin } from "lucide-react";
import { PageHero } from "@/components/site/PageHero";
import { SectionHeading } from "@/components/site/SectionHeading";
import { Reveal } from "@/components/site/Reveal";
import { Markdown } from "@/components/Markdown";
import { ImageSlot } from "@/components/site/ImageSlot";
import { Provisional } from "@/components/site/Provisional";
import { CompanyMetric } from "@/components/site/CompanyMetric";
import { TeamGallery } from "@/components/site/TeamGallery";
import { ButtonLink } from "@/components/ui/Button";
import { bool, getAllSettings, getItems, getPage, img, rep, s } from "@/lib/content/queries";
import { pageMetadata } from "@/lib/seo/metadata";

export const generateMetadata = (): Promise<Metadata> =>
  pageMetadata("empresa", { title: "A Empresa", description: "História, missão, estrutura e diferenciais da PETROLUB, referência em coleta e rerrefino de óleo lubrificante usado desde 1966.", path: "/empresa" });

const LOCATION_TYPES: Record<string, string> = { matriz: "Matriz e unidade de rerrefino", base: "Filial · armazenamento temporário", filial: "Filial" };

export default async function EmpresaPage() {
  const [p, settings, timeline, values, locations, metrics] = await Promise.all([
    getPage("empresa"),
    getAllSettings(),
    getItems("timeline"),
    getItems("values"),
    getItems("locations"),
    getItems("metrics"),
  ]);
  const marks = bool(settings.general, "showProvisionalMarkers");
  const { hero, history, purpose, leadership, structure, differentials, culture, commitments } = p;
  const purposeItems = [
    ["Missão", s(purpose, "mission")],
    ["Visão", s(purpose, "vision")],
    ["Propósito", s(purpose, "purpose")],
    ["Posicionamento", s(purpose, "positioning")],
  ].filter(([, v]) => v);

  return (
    <>
      <PageHero eyebrow={s(hero, "eyebrow")} title={s(hero, "title")} subtitle={s(hero, "subtitle")} />

      {/* História */}
      <section className="container-x py-24 md:py-32">
        <div className="grid gap-12 lg:grid-cols-12">
          <Reveal className="lg:col-span-5">
            <p className="eyebrow">{s(history, "eyebrow")}</p>
            <h2 className="mt-6 text-h2 font-semibold">{s(history, "title")}</h2>
            <Provisional show={marks && bool(history, "provisional")} className="mt-6" />
          </Reveal>
          <Reveal delay={0.1} className="lg:col-span-6 lg:col-start-7">
            <Markdown source={s(history, "body")} />
          </Reveal>
        </div>
        {timeline.length > 0 && (
          <ol className="relative mt-20 grid gap-10 border-t border-ink/15 pt-10 md:grid-cols-3 lg:grid-cols-4">
            {timeline.map((t, i) => (
              <Reveal as="li" key={t.id} delay={i * 0.06} className="relative">
                <span className="absolute -top-[2.85rem] left-0 h-3 w-3 rounded-full bg-lime ring-4 ring-paper" aria-hidden="true" />
                <p className="font-display text-4xl font-semibold tracking-tight">{s(t.data, "year")}</p>
                <h3 className="mt-3 font-semibold">{t.title}</h3>
                <p className="mt-2 text-[0.95rem] leading-relaxed text-steel">{s(t.data, "text")}</p>
                <Provisional show={marks && bool(t.data, "provisional")} className="mt-3" />
              </Reveal>
            ))}
          </ol>
        )}
      </section>

      {/* Missão, visão, valores */}
      <section className="on-dark bg-forest py-24 text-white md:py-32">
        <div className="container-x">
          <div className="flex flex-wrap items-center gap-3">
            <p className="eyebrow">Missão, visão e valores</p>
            <Provisional show={marks && bool(purpose, "provisional")} />
          </div>
          <dl className="mt-12 grid gap-px overflow-hidden rounded-[var(--radius-card)] bg-white/10 md:grid-cols-2">
            {purposeItems.map(([k, v], i) => (
              <Reveal key={k} delay={i * 0.06} className="bg-forest p-8 md:p-10">
                <dt className="text-sm uppercase tracking-[0.18em] text-white/45">{k}</dt>
                <dd className="mt-4 font-display text-2xl font-medium leading-snug tracking-tight text-white md:text-3xl">{v}</dd>
              </Reveal>
            ))}
          </dl>
          {values.length > 0 ? (
            <ul className="mt-16 grid gap-8 md:grid-cols-3">
              {values.map((v, i) => (
                <Reveal as="li" key={v.id} delay={i * 0.06} className="border-t border-white/15 pt-6">
                  <h3 className="text-xl font-semibold text-white">{v.title}</h3>
                  <p className="mt-3 text-white/60">{s(v.data, "text")}</p>
                </Reveal>
              ))}
            </ul>
          ) : (
            marks && <p className="mt-12 text-sm text-white/45">Os valores institucionais serão publicados após validação da PETROLUB.</p>
          )}
        </div>
      </section>

      {/* Liderança */}
      {s(leadership, "name") && (
        <section className="container-x py-24 md:py-32">
          <div className="grid items-center gap-10 lg:grid-cols-12">
            <Reveal className="lg:col-span-5">
              <ImageSlot image={img(leadership, "image")} className="aspect-[4/5] rounded-[var(--radius-card)]" label="Foto da liderança — pendente" />
            </Reveal>
            <Reveal delay={0.1} className="lg:col-span-6 lg:col-start-7">
              <p className="eyebrow">{s(leadership, "eyebrow")}</p>
              <h2 className="mt-6 text-h2 font-semibold">{s(leadership, "title")}</h2>
              <Provisional show={marks && bool(leadership, "provisional")} className="mt-5" />
              <div className="mt-10 border-l-2 border-lime pl-6">
                <p className="font-display text-3xl font-semibold tracking-tight">{s(leadership, "name")}</p>
                {s(leadership, "role") && <p className="mt-2 text-sm uppercase tracking-[0.18em] text-steel">{s(leadership, "role")}</p>}
              </div>
              {s(leadership, "body") && <Markdown source={s(leadership, "body")} className="mt-8" />}
            </Reveal>
          </div>
        </section>
      )}

      {/* Diferenciais */}
      <section className="container-x py-24 md:py-32">
        <SectionHeading eyebrow={s(differentials, "eyebrow")} title={s(differentials, "title")} />
        <ul className="mt-14 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {rep(differentials, "items").map((d, i) => (
            <Reveal as="li" key={i} delay={i * 0.06} className="rounded-[var(--radius-card)] border border-line bg-white p-7">
              <span className="font-mono text-sm text-steel">{String(i + 1).padStart(2, "0")}</span>
              <h3 className="mt-8 text-xl font-semibold">{s(d, "title")}</h3>
              <p className="mt-3 text-[0.95rem] leading-relaxed text-steel">{s(d, "text")}</p>
            </Reveal>
          ))}
        </ul>
        {metrics.length > 0 && (
          <div className="mt-20 grid gap-10 sm:grid-cols-2 lg:grid-cols-4">
            {metrics.map((m, i) => (
              <CompanyMetric key={m.id} index={i} value={s(m.data, "value")} label={s(m.data, "label")} />
            ))}
          </div>
        )}
      </section>

      {/* Estrutura */}
      <section className="bg-paper-2 py-24 md:py-32">
        <div className="container-x">
          <SectionHeading eyebrow={s(structure, "eyebrow")} title={s(structure, "title")} />
          <Reveal className="mt-8 max-w-2xl">
            <Markdown source={s(structure, "body")} />
          </Reveal>
          <TeamGallery items={rep(structure, "photos")} landscape className="mt-12" />
          <ul className="mt-14 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {locations.map((l, i) => (
              <Reveal as="li" key={l.id} delay={i * 0.05} className={`rounded-[var(--radius-card)] p-7 ${s(l.data, "type") === "matriz" ? "on-dark brand-deep text-white md:col-span-2 lg:col-span-1 lg:row-span-2" : "border border-line bg-paper"}`}>
                <p className={`text-xs uppercase tracking-[0.18em] ${s(l.data, "type") === "matriz" ? "text-white/50" : "text-steel"}`}>{LOCATION_TYPES[s(l.data, "type")] ?? "Unidade"}</p>
                <h3 className="mt-4 flex items-center gap-2 text-2xl font-semibold">
                  <MapPin className={`h-5 w-5 ${s(l.data, "type") === "matriz" ? "text-lime" : "text-accent"}`} aria-hidden="true" />
                  {s(l.data, "city")} — {s(l.data, "state")}
                </h3>
                {(s(l.data, "since") || s(l.data, "coverage")) && (
                  <p className={`mt-3 text-[0.95rem] leading-relaxed ${s(l.data, "type") === "matriz" ? "text-white/80" : "text-ink"}`}>
                    {s(l.data, "since") && <span className="font-medium">Desde {s(l.data, "since")}. </span>}
                    {s(l.data, "coverage")}
                  </p>
                )}
                {s(l.data, "address") && <p className={`mt-3 text-[0.95rem] ${s(l.data, "type") === "matriz" ? "text-white/65" : "text-steel"}`}>{s(l.data, "address")}</p>}
                {(s(l.data, "phone") || s(l.data, "email")) && (
                  <p className={`mt-2 text-sm ${s(l.data, "type") === "matriz" ? "text-white/65" : "text-steel"}`}>
                    {s(l.data, "phone")}
                    {s(l.data, "phone") && s(l.data, "email") && <br />}
                    {s(l.data, "email") && (
                      <a href={`mailto:${s(l.data, "email")}`} className="underline decoration-current/30 underline-offset-2 hover:decoration-current">
                        {s(l.data, "email")}
                      </a>
                    )}
                  </p>
                )}
                <Provisional show={marks && bool(l.data, "provisional")} className="mt-4" label="Dados a confirmar" />
              </Reveal>
            ))}
          </ul>
        </div>
      </section>

      {/* Cultura */}
      <section className="container-x py-24 md:py-32">
        <div className="grid items-center gap-10 lg:grid-cols-12">
          <Reveal className="lg:col-span-6">
            <ImageSlot image={img(culture, "image")} className="aspect-[4/3] rounded-[var(--radius-card)]" label="Foto oficial da equipe — pendente" />
          </Reveal>
          <Reveal delay={0.1} className="lg:col-span-5 lg:col-start-8">
            <p className="eyebrow">{s(culture, "eyebrow")}</p>
            <h2 className="mt-6 text-h2 font-semibold">{s(culture, "title")}</h2>
            <Provisional show={marks && bool(culture, "provisional")} className="mt-5" />
            <Markdown source={s(culture, "body")} className="mt-6" />
          </Reveal>
        </div>
      </section>

      {/* Compromissos */}
      <section className="container-x pb-24 md:pb-32">
        <div className="flex flex-wrap items-center gap-3">
          <SectionHeading eyebrow={s(commitments, "eyebrow")} title={s(commitments, "title")} />
        </div>
        <Provisional show={marks && bool(commitments, "provisional")} className="mt-6" />
        <ul className="mt-10 grid gap-5 md:grid-cols-3">
          {rep(commitments, "items").map((c, i) => (
            <Reveal as="li" key={i} delay={i * 0.06} className="border-t-2 border-ink pt-6">
              <h3 className="text-xl font-semibold">{s(c, "audience")}</h3>
              <p className="mt-3 text-steel">{s(c, "text")}</p>
            </Reveal>
          ))}
        </ul>
        <div className="mt-16 flex flex-wrap gap-3">
          <ButtonLink href="/solucoes" arrow>
            Conheça nossas soluções
          </ButtonLink>
          <ButtonLink href="/carreiras" variant="secondary">
            Trabalhe na PETROLUB
          </ButtonLink>
        </div>
      </section>
    </>
  );
}
