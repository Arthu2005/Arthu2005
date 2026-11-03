import Link from "next/link";
import type { Metadata } from "next";
import { ArrowUpRight, Check } from "lucide-react";
import { HeroSection } from "@/components/site/HeroSection";
import { NatureSection } from "@/components/site/NatureSection";
import { SectionHeading } from "@/components/site/SectionHeading";
import { Reveal } from "@/components/site/Reveal";
import { Markdown } from "@/components/Markdown";
import { ImageSlot } from "@/components/site/ImageSlot";
import { Provisional } from "@/components/site/Provisional";
import { SolutionCard } from "@/components/site/SolutionCard";
import { CompanyMetric } from "@/components/site/CompanyMetric";
import { JobCard } from "@/components/careers/JobCard";
import { ButtonLink } from "@/components/ui/Button";
import { bool, getAllSettings, getItems, getPage, img, list, rep, s } from "@/lib/content/queries";
import { getFeaturedJobs } from "@/lib/careers/queries";
import { pageMetadata } from "@/lib/seo/metadata";

export async function generateMetadata(): Promise<Metadata> {
  const meta = await pageMetadata("home", { title: "", path: "/" });
  // home uses the default (non-templated) title
  return { ...meta, title: meta.title ? { absolute: String(meta.title) } : undefined };
}

export default async function HomePage() {
  const [p, settings, metrics, solutions, jobs] = await Promise.all([getPage("home"), getAllSettings(), getItems("metrics"), getItems("solutions"), getFeaturedJobs(3)]);
  const marks = bool(settings.general, "showProvisionalMarkers");
  const accent = s(settings.general, "accentColor") || "#1c782b";
  const featured = solutions.filter((x) => bool(x.data, "featured"));
  const shownSolutions = (featured.length ? featured : solutions).slice(0, 3);
  const { intro, process, compliance, sustainability, people, careers, contact } = p;

  return (
    <>
      <HeroSection hero={p.hero!} accent={accent} />

      {/* 2. Apresentação institucional ------------------------------------------------ */}
      <section id="apresentacao" className="container-x scroll-mt-24 py-24 md:py-36" aria-labelledby="intro-title">
        <div className="grid gap-12 lg:grid-cols-12 lg:gap-16">
          <div className="lg:col-span-7">
            <Reveal>
              <p className="eyebrow">{s(intro, "eyebrow")}</p>
              <h2 id="intro-title" className="mt-6 text-h2 font-semibold">
                {s(intro, "title")}
              </h2>
            </Reveal>
            <Reveal delay={0.1} className="mt-8 max-w-2xl">
              <Provisional show={marks && bool(intro, "provisional")} className="mb-4" />
              <Markdown source={s(intro, "body")} />
              {s(intro, "linkHref") && (
                <ButtonLink href={s(intro, "linkHref")} variant="secondary" className="mt-8" arrow>
                  {s(intro, "linkLabel")}
                </ButtonLink>
              )}
            </Reveal>
          </div>
          <Reveal delay={0.15} className="lg:col-span-5">
            <ImageSlot image={img(intro, "image")} className="aspect-[4/5] rounded-[var(--radius-card)]" label="Foto oficial da unidade — pendente" />
          </Reveal>
        </div>
      </section>

      {/* 2b. Compromisso com a natureza -------------------------------------------- */}
      {p.nature && <NatureSection data={p.nature} marks={marks} />}

      {/* 3. Indicadores ------------------------------------------------------------- */}
      {metrics.length > 0 && (
        <section className="on-dark relative overflow-hidden bg-forest py-24 text-white md:py-32">
          <div className="grain pointer-events-none absolute inset-0 opacity-40" aria-hidden="true" />
          <div className="container-x relative">
            <SectionHeading eyebrow={s(p.metrics, "eyebrow")} title={s(p.metrics, "title")} dark />
            <div className="mt-16 grid gap-10 sm:grid-cols-2 lg:grid-cols-4">
              {metrics.map((m, i) => (
                <CompanyMetric key={m.id} index={i} value={s(m.data, "value")} label={s(m.data, "label")} dark />
              ))}
            </div>
            {s(p.metrics, "note") && <p className="mt-12 text-sm text-white/40">{s(p.metrics, "note")}</p>}
          </div>
        </section>
      )}

      {/* 4/5. Soluções e produtos ------------------------------------------------------ */}
      <section className="container-x py-24 md:py-36">
        <SectionHeading
          eyebrow={s(p.solutions, "eyebrow")}
          title={s(p.solutions, "title")}
          subtitle={s(p.solutions, "subtitle")}
          aside={
            s(p.solutions, "linkHref") && (
              <ButtonLink href={s(p.solutions, "linkHref")} variant="secondary" arrow>
                {s(p.solutions, "linkLabel")}
              </ButtonLink>
            )
          }
        />
        <ul className="mt-14 grid gap-5 md:grid-cols-2 lg:grid-cols-3">
          {shownSolutions.map((item, i) => (
            <Reveal as="li" key={item.id} delay={i * 0.08}>
              <SolutionCard item={item} index={i} showMarkers={marks} />
            </Reveal>
          ))}
        </ul>
      </section>

      {/* 6. Processo / tecnologia ---------------------------------------------------- */}
      <section className="bg-paper-2 py-24 md:py-36">
        <div className="container-x">
          <SectionHeading eyebrow={s(process, "eyebrow")} title={s(process, "title")} subtitle={s(process, "subtitle")} />
          <ol className="mt-16 grid gap-px overflow-hidden rounded-[var(--radius-card)] border border-line bg-line md:grid-cols-2 lg:grid-cols-5">
            {rep(process, "steps").map((step, i) => (
              <Reveal as="li" key={i} delay={i * 0.07} className="group relative flex min-h-[15rem] flex-col bg-paper p-6 transition-colors duration-500 hover:bg-white md:p-7">
                <span className="font-mono text-sm tabular-nums text-steel">{String(i + 1).padStart(2, "0")}</span>
                <span className="mt-auto block h-0.5 w-10 rounded-full bg-gradient-to-r from-accent to-lime transition-[width] duration-700 group-hover:w-20" aria-hidden="true" />
                <h3 className="mt-5 text-lg font-semibold">{s(step, "title")}</h3>
                <p className="mt-2 text-[0.92rem] leading-relaxed text-steel">{s(step, "text")}</p>
              </Reveal>
            ))}
          </ol>
        </div>
      </section>

      {/* 6b. Qualidade e conformidade ---------------------------------------------------- */}
      <section className="container-x py-24 md:py-32" aria-labelledby="compliance-title">
        <div className="grid gap-10 lg:grid-cols-12">
          <Reveal className="lg:col-span-5">
            <p className="eyebrow">{s(compliance, "eyebrow")}</p>
            <h2 id="compliance-title" className="mt-6 text-h2 font-semibold">
              {s(compliance, "title")}
            </h2>
          </Reveal>
          <Reveal delay={0.1} className="lg:col-span-6 lg:col-start-7">
            <Markdown source={s(compliance, "body")} />
            <ul className="mt-8 flex flex-wrap gap-2.5">
              {list(compliance, "items").map((x) => (
                <li key={x} className="inline-flex items-center gap-2 rounded-full border border-ink/15 bg-white px-4 py-2 text-sm font-medium">
                  <Check className="h-4 w-4 text-accent" aria-hidden="true" /> {x}
                </li>
              ))}
            </ul>
          </Reveal>
        </div>
      </section>

      {/* 7. Sustentabilidade ---------------------------------------------------------- */}
      <section className="container-x pb-24 md:pb-36" aria-labelledby="sust-title">
        <Reveal className="on-dark relative overflow-hidden rounded-[calc(var(--radius-card)*1.6)] brand-deep px-6 py-16 text-white md:px-16 md:py-24">
          <div className="pointer-events-none absolute -right-24 -top-24 h-96 w-96 rounded-full bg-[radial-gradient(circle_at_35%_30%,#3d5246,#030805_60%)] opacity-90 shadow-[inset_-20px_-30px_60px_rgba(0,0,0,.8),inset_10px_12px_30px_rgba(166,226,46,.18)]" aria-hidden="true" />
          <div className="pointer-events-none absolute -right-6 top-40 h-24 w-24 rounded-full bg-[radial-gradient(circle_at_35%_30%,#4a6152,#030805_60%)] shadow-[inset_4px_5px_12px_rgba(166,226,46,.22)]" aria-hidden="true" />
          <div className="relative max-w-2xl">
            <p className="eyebrow">{s(sustainability, "eyebrow")}</p>
            <h2 id="sust-title" className="mt-6 text-h2 font-semibold text-white">
              {s(sustainability, "title")}
            </h2>
            <Markdown source={s(sustainability, "body")} className="mt-6 text-white/70" />
            {s(sustainability, "linkHref") && (
              <ButtonLink href={s(sustainability, "linkHref")} variant="light" className="mt-10" arrow>
                {s(sustainability, "linkLabel")}
              </ButtonLink>
            )}
          </div>
        </Reveal>
      </section>

      {/* 8. Cultura e pessoas ------------------------------------------------------- */}
      <section className="container-x pb-24 md:pb-36" aria-labelledby="people-title">
        <div className="grid items-center gap-10 lg:grid-cols-12">
          <Reveal className="lg:col-span-6">
            <ImageSlot image={img(people, "image")} className="aspect-[16/11] rounded-[var(--radius-card)]" label="Foto oficial da equipe — pendente" />
          </Reveal>
          <Reveal delay={0.1} className="lg:col-span-5 lg:col-start-8">
            <p className="eyebrow">{s(people, "eyebrow")}</p>
            <h2 id="people-title" className="mt-6 text-h2 font-semibold">
              {s(people, "title")}
            </h2>
            <Markdown source={s(people, "body")} className="mt-6" />
          </Reveal>
        </div>
      </section>

      {/* 9/10. Carreiras + prévia de vagas ---------------------------------------------- */}
      <section className="border-t border-line bg-white py-24 md:py-36" aria-labelledby="careers-title">
        <div className="container-x">
          <div className="grid gap-8 lg:grid-cols-12 lg:items-end">
            <Reveal className="lg:col-span-8">
              <p className="eyebrow">{s(careers, "eyebrow")}</p>
              <h2 id="careers-title" className="mt-6 text-h1 font-semibold">
                {s(careers, "title")}
              </h2>
              <p className="mt-6 max-w-xl text-lg text-steel">{s(careers, "body")}</p>
            </Reveal>
            <Reveal delay={0.1} className="flex flex-wrap gap-3 lg:col-span-4 lg:justify-end">
              <ButtonLink href={s(careers, "linkHref") || "/carreiras/vagas"} arrow>
                {s(careers, "linkLabel") || "Ver vagas"}
              </ButtonLink>
              <ButtonLink href="/carreiras" variant="secondary">
                Carreiras
              </ButtonLink>
            </Reveal>
          </div>
          {jobs.length > 0 ? (
            <ul className="mt-14 grid gap-5 md:grid-cols-2 lg:grid-cols-3">
              {jobs.map((job, i) => (
                <Reveal as="li" key={job.id} delay={i * 0.08}>
                  <JobCard job={job} />
                </Reveal>
              ))}
            </ul>
          ) : (
            <div className="mt-14 rounded-[var(--radius-card)] border border-dashed border-ink/20 p-10 text-center">
              <p className="text-lg font-medium">Nenhuma vaga aberta no momento.</p>
              <p className="mt-2 text-steel">
                Cadastre-se no{" "}
                <Link href="/carreiras/banco-de-talentos" className="font-medium text-ink underline decoration-accent underline-offset-4">
                  banco de talentos
                </Link>{" "}
                para ser lembrado em oportunidades futuras.
              </p>
            </div>
          )}
        </div>
      </section>

      {/* 11. Contato comercial ------------------------------------------------------- */}
      <section className="container-x py-24 md:py-32" aria-labelledby="contact-title">
        <Reveal className="grid gap-8 border-y border-ink py-14 md:grid-cols-12 md:items-center md:py-20">
          <div className="md:col-span-8">
            <p className="eyebrow">{s(contact, "eyebrow")}</p>
            <h2 id="contact-title" className="mt-5 text-h2 font-semibold">
              {s(contact, "title")}
            </h2>
            <p className="mt-5 max-w-xl text-lg text-steel">{s(contact, "body")}</p>
          </div>
          <div className="flex flex-col gap-3 md:col-span-4 md:items-end">
            <ButtonLink href={s(contact, "linkHref") || "/contato"} size="lg" arrow>
              {s(contact, "linkLabel") || "Fale conosco"}
            </ButtonLink>
            {s(settings.contact, "phoneTollFree") && (
              <a href={`tel:${s(settings.contact, "phoneTollFree").replace(/\D/g, "")}`} className="inline-flex items-center gap-1.5 text-sm text-steel hover:text-ink">
                ou ligue {s(settings.contact, "phoneTollFree")} <ArrowUpRight className="h-3.5 w-3.5" aria-hidden="true" />
              </a>
            )}
          </div>
        </Reveal>
      </section>
    </>
  );
}
