import type { Metadata } from "next";
import { FileText, ExternalLink } from "lucide-react";
import { PageHero } from "@/components/site/PageHero";
import { Reveal } from "@/components/site/Reveal";
import { Markdown } from "@/components/Markdown";
import { Provisional } from "@/components/site/Provisional";
import { bool, file, getAllSettings, getItems, getPage, s, type PublicItem } from "@/lib/content/queries";
import { formatDate } from "@/lib/labels";
import { pageMetadata } from "@/lib/seo/metadata";

export const generateMetadata = (): Promise<Metadata> =>
  pageMetadata("sustentabilidade", { title: "Sustentabilidade e qualidade", description: "Logística reversa do óleo lubrificante usado, autorizações, políticas e indicadores publicados pela PETROLUB.", path: "/sustentabilidade" });

const GROUPS: { kind: string; title: string }[] = [
  { kind: "indicator", title: "Indicadores oficiais" },
  { kind: "policy", title: "Políticas e compromissos" },
  { kind: "license", title: "Licenças e autorizações" },
  { kind: "certification", title: "Certificações verificadas" },
  { kind: "program", title: "Programas internos" },
  { kind: "document", title: "Documentos institucionais" },
  { kind: "news", title: "Notícias e iniciativas" },
];

function ItemCard({ item, marks }: { item: PublicItem; marks: boolean }) {
  const d = item.data;
  const doc = file(d, "file");
  return (
    <article className="flex h-full flex-col rounded-[var(--radius-card)] border border-line bg-white p-7">
      {s(d, "value") && <p className="font-display text-5xl font-semibold tracking-tight">{s(d, "value")}</p>}
      <h3 className={`${s(d, "value") ? "mt-4" : ""} text-xl font-semibold`}>{item.title}</h3>
      {s(d, "date") && <p className="mt-1 text-sm text-steel">{formatDate(s(d, "date"))}</p>}
      <p className="mt-3 text-[0.95rem] leading-relaxed text-steel">{s(d, "summary")}</p>
      {s(d, "body") && <Markdown source={s(d, "body")} className="mt-4 text-[0.95rem]" />}
      <div className="mt-auto flex flex-wrap items-center gap-3 pt-6">
        {doc.src && (
          <a href={doc.src} className="inline-flex items-center gap-2 text-sm font-medium underline decoration-accent underline-offset-4" download>
            <FileText className="h-4 w-4" aria-hidden="true" /> {doc.name || "Baixar documento"}
          </a>
        )}
        {s(d, "link") && (
          <a href={s(d, "link")} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 text-sm font-medium underline decoration-accent underline-offset-4">
            <ExternalLink className="h-4 w-4" aria-hidden="true" /> Saiba mais<span className="sr-only"> (abre em nova aba)</span>
          </a>
        )}
        <Provisional show={marks && bool(d, "provisional")} label="Documento a anexar" />
      </div>
    </article>
  );
}

export default async function SustentabilidadePage() {
  const [p, settings, items] = await Promise.all([getPage("sustentabilidade"), getAllSettings(), getItems("sustainability")]);
  const marks = bool(settings.general, "showProvisionalMarkers");
  return (
    <>
      <PageHero eyebrow={s(p.hero, "eyebrow")} title={s(p.hero, "title")} subtitle={s(p.hero, "subtitle")} />
      <section className="container-x py-20 md:py-28">
        <div className="grid gap-10 lg:grid-cols-12">
          <Reveal className="lg:col-span-5">
            <p className="eyebrow">{s(p.intro, "eyebrow")}</p>
            <h2 className="mt-6 text-h2 font-semibold">{s(p.intro, "title")}</h2>
          </Reveal>
          <Reveal delay={0.1} className="lg:col-span-6 lg:col-start-7">
            <Markdown source={s(p.intro, "body")} />
          </Reveal>
        </div>
      </section>
      {GROUPS.map((g) => {
        const list = items.filter((i) => s(i.data, "kind") === g.kind);
        if (!list.length) return null;
        return (
          <section key={g.kind} className="container-x pb-20 md:pb-24" aria-labelledby={`g-${g.kind}`}>
            <h2 id={`g-${g.kind}`} className="border-t border-ink pt-6 text-h3 font-semibold">
              {g.title}
            </h2>
            <ul className="mt-8 grid gap-5 md:grid-cols-2 lg:grid-cols-3">
              {list.map((item, i) => (
                <Reveal as="li" key={item.id} delay={i * 0.05}>
                  <ItemCard item={item} marks={marks} />
                </Reveal>
              ))}
            </ul>
          </section>
        );
      })}
    </>
  );
}
