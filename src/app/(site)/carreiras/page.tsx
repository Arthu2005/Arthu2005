import type { Metadata } from "next";
import { Quote } from "lucide-react";
import { PageHero } from "@/components/site/PageHero";
import { SectionHeading } from "@/components/site/SectionHeading";
import { Reveal } from "@/components/site/Reveal";
import { Markdown } from "@/components/Markdown";
import { ImageSlot } from "@/components/site/ImageSlot";
import { Provisional } from "@/components/site/Provisional";
import { Faq } from "@/components/site/Faq";
import { JobCard } from "@/components/careers/JobCard";
import { ButtonLink } from "@/components/ui/Button";
import { VideoEmbed } from "@/components/site/VideoEmbed";
import { TeamGallery } from "@/components/site/TeamGallery";
import { bool, getAllSettings, getItems, getPage, img, list, rep, s } from "@/lib/content/queries";
import { countOpenJobs, getFeaturedJobs } from "@/lib/careers/queries";
import { pageMetadata } from "@/lib/seo/metadata";

export const generateMetadata = (): Promise<Metadata> =>
  pageMetadata("carreiras", { title: "Carreiras", description: "Trabalhe na PETROLUB: conheça a cultura, as áreas de atuação e as vagas abertas.", path: "/carreiras" });

export default async function CarreirasPage() {
  const [p, settings, jobs, openCount, values, benefits, testimonials, faqs] = await Promise.all([
    getPage("carreiras"),
    getAllSettings(),
    getFeaturedJobs(3),
    countOpenJobs(),
    getItems("values"),
    getItems("benefits"),
    getItems("testimonials"),
    getItems("faqs"),
  ]);
  const marks = bool(settings.general, "showProvisionalMarkers");
  const { hero, culture, gallery, development, areas, external, talent, video } = p;
  const galleryItems = rep(gallery, "items").filter((g) => img(g, "image").src);
  const approvedTestimonials = testimonials.filter((t) => bool(t.data, "consent"));

  return (
    <>
      <PageHero eyebrow={s(hero, "eyebrow")} title={s(hero, "title")} subtitle={s(hero, "subtitle")}>
        <div className="flex flex-wrap gap-3">
          <ButtonLink href="/carreiras/vagas" size="lg" arrow>
            {openCount > 0 ? `Ver ${openCount} ${openCount === 1 ? "vaga aberta" : "vagas abertas"}` : "Ver vagas"}
          </ButtonLink>
          <ButtonLink href="/carreiras/banco-de-talentos" variant="secondary" size="lg">
            Banco de talentos
          </ButtonLink>
        </div>
      </PageHero>

      <section className="container-x py-24 md:py-32">
        <div className="grid items-center gap-10 lg:grid-cols-12">
          <Reveal className="lg:col-span-6">
            <ImageSlot image={img(culture, "image")} className="aspect-[4/3] rounded-[var(--radius-card)]" label="Foto real da equipe — pendente" />
          </Reveal>
          <Reveal delay={0.1} className="lg:col-span-5 lg:col-start-8">
            <p className="eyebrow">{s(culture, "eyebrow")}</p>
            <h2 className="mt-6 text-h2 font-semibold">{s(culture, "title")}</h2>
            <Provisional show={marks && bool(culture, "provisional")} className="mt-5" />
            <Markdown source={s(culture, "body")} className="mt-6" />
          </Reveal>
        </div>
      </section>

      {galleryItems.length > 0 && (
        <section className="container-x pb-24 md:pb-32">
          <SectionHeading eyebrow={s(gallery, "eyebrow")} title={s(gallery, "title")} />
          <TeamGallery items={galleryItems} className="mt-12" />
        </section>
      )}

      {s(video, "url") && (
        <section className="container-x pb-24 md:pb-32" aria-labelledby="video-title">
          <div className="grid gap-10 lg:grid-cols-12 lg:items-center">
            <Reveal className="lg:col-span-4">
              <p className="eyebrow">{s(video, "eyebrow")}</p>
              <h2 id="video-title" className="mt-6 text-h2 font-semibold">
                {s(video, "title")}
              </h2>
              {s(video, "body") && <p className="mt-5 text-lg text-steel">{s(video, "body")}</p>}
            </Reveal>
            <Reveal delay={0.1} className="lg:col-span-8">
              <VideoEmbed url={s(video, "url")} title={s(video, "title") || "Vídeo institucional PETROLUB"} />
            </Reveal>
          </div>
        </section>
      )}

      {values.length > 0 && (
        <section className="container-x pb-24">
          <SectionHeading eyebrow="Valores" title="O que nos orienta." />
          <ul className="mt-12 grid gap-6 md:grid-cols-3">
            {values.map((v, i) => (
              <Reveal as="li" key={v.id} delay={i * 0.06} className="border-t-2 border-ink pt-6">
                <h3 className="text-xl font-semibold">{v.title}</h3>
                <p className="mt-3 text-steel">{s(v.data, "text")}</p>
              </Reveal>
            ))}
          </ul>
        </section>
      )}

      <section className="on-dark bg-forest py-24 text-white md:py-32">
        <div className="container-x grid gap-16 lg:grid-cols-2">
          <Reveal>
            <p className="eyebrow">{s(areas, "eyebrow")}</p>
            <h2 className="mt-6 text-h2 font-semibold text-white">{s(areas, "title")}</h2>
            <Provisional show={marks && bool(areas, "provisional")} className="mt-5" />
            <ul className="mt-10 divide-y divide-white/10 border-y border-white/10">
              {list(areas, "items").map((a, i) => (
                <li key={a} className="flex items-baseline gap-5 py-4 font-display text-xl font-medium tracking-tight md:text-2xl">
                  <span className="font-mono text-xs text-white/40">{String(i + 1).padStart(2, "0")}</span>
                  {a}
                </li>
              ))}
            </ul>
          </Reveal>
          <Reveal delay={0.1}>
            <p className="eyebrow">{s(development, "eyebrow")}</p>
            <h2 className="mt-6 text-h2 font-semibold text-white">{s(development, "title")}</h2>
            <Provisional show={marks && bool(development, "provisional")} className="mt-5" />
            <Markdown source={s(development, "body")} className="mt-6" />
            {benefits.length > 0 && (
              <div className="mt-12">
                <h3 className="text-sm font-semibold uppercase tracking-[0.16em] text-white/50">Benefícios</h3>
                <ul className="mt-5 grid gap-3 sm:grid-cols-2">
                  {benefits.map((b) => (
                    <li key={b.id} className="rounded-2xl border border-white/10 p-5">
                      <p className="font-medium text-white">{b.title}</p>
                      {s(b.data, "text") && <p className="mt-1 text-sm text-white/55">{s(b.data, "text")}</p>}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </Reveal>
        </div>
      </section>

      {approvedTestimonials.length > 0 && (
        <section className="container-x py-24">
          <SectionHeading eyebrow="Depoimentos" title="Quem vive a PETROLUB." />
          <ul className="mt-12 grid gap-5 md:grid-cols-2 lg:grid-cols-3">
            {approvedTestimonials.map((t, i) => (
              <Reveal as="li" key={t.id} delay={i * 0.06} className="flex flex-col rounded-[var(--radius-card)] border border-line bg-white p-7">
                <Quote className="h-6 w-6 text-accent" aria-hidden="true" />
                <blockquote className="mt-5 text-lg leading-relaxed">“{s(t.data, "quote")}”</blockquote>
                <div className="mt-auto flex items-center gap-3 pt-6">
                  {img(t.data, "photo").src ? (
                    <ImageSlot image={img(t.data, "photo")} className="h-14 w-14 shrink-0 rounded-full ring-2 ring-lime/60 ring-offset-2" />
                  ) : (
                    <span className="inline-flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-accent-deep font-display text-lg font-semibold text-lime" aria-hidden="true">
                      {t.title.split(" ").map((w) => w[0]).slice(0, 2).join("")}
                    </span>
                  )}
                  <p className="text-sm">
                    <span className="font-semibold">{t.title}</span>
                    <br />
                    <span className="text-steel">{s(t.data, "role")}</span>
                  </p>
                </div>
              </Reveal>
            ))}
          </ul>
        </section>
      )}

      <section className="container-x py-24 md:py-32">
        <SectionHeading
          eyebrow="Vagas em destaque"
          title="Oportunidades abertas"
          aside={
            <ButtonLink href="/carreiras/vagas" arrow>
              Consultar todas as oportunidades
            </ButtonLink>
          }
        />
        {jobs.length ? (
          <ul className="mt-12 grid gap-5 md:grid-cols-2 lg:grid-cols-3">
            {jobs.map((j, i) => (
              <Reveal as="li" key={j.id} delay={i * 0.07}>
                <JobCard job={j} />
              </Reveal>
            ))}
          </ul>
        ) : (
          <p className="mt-10 text-steel">Nenhuma vaga aberta neste momento.</p>
        )}
      </section>

      <section className="container-x grid gap-5 pb-24 md:grid-cols-2 md:pb-32">
        <Reveal className="flex flex-col rounded-[var(--radius-card)] brand-deep p-8 text-white md:p-12">
          <p className="eyebrow !text-white/60">{s(talent, "eyebrow")}</p>
          <h2 className="mt-5 text-h3 font-semibold text-white md:text-4xl">{s(talent, "title")}</h2>
          <p className="mt-4 text-white/70">{s(talent, "body")}</p>
          <ButtonLink href="/carreiras/banco-de-talentos" variant="light" className="mt-auto self-start" arrow>
            Cadastrar currículo
          </ButtonLink>
        </Reveal>
        {bool(external, "enabled") && s(external, "linkHref") && (
          <Reveal delay={0.08} className="flex flex-col rounded-[var(--radius-card)] border border-line bg-white p-8 md:p-12">
            <p className="eyebrow">{s(external, "eyebrow")}</p>
            <h2 className="mt-5 text-h3 font-semibold md:text-4xl">{s(external, "title")}</h2>
            <p className="mt-4 text-steel">{s(external, "body")}</p>
            <ButtonLink href={s(external, "linkHref")} variant="secondary" className="mt-8 self-start" arrow>
              {s(external, "linkLabel")}
            </ButtonLink>
          </Reveal>
        )}
      </section>
      <Faq items={faqs.filter((f) => s(f.data, "scope") === "carreiras")} title="Dúvidas sobre candidaturas" />
    </>
  );
}
