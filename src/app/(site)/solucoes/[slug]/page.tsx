import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, Download } from "lucide-react";
import { PageHero } from "@/components/site/PageHero";
import { Markdown } from "@/components/Markdown";
import { ImageSlot } from "@/components/site/ImageSlot";
import { Provisional } from "@/components/site/Provisional";
import { CATEGORY_LABELS } from "@/components/site/SolutionCard";
import { ButtonLink } from "@/components/ui/Button";
import { bool, file, getAllSettings, getItemBySlug, img, list, rep, s } from "@/lib/content/queries";

type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const item = await getItemBySlug("solutions", (await params).slug);
  if (!item) return { title: "Solução não encontrada" };
  return { title: item.title, description: s(item.data, "summary"), alternates: { canonical: `/solucoes/${item.slug}` } };
}

function ListBlock({ title, items }: { title: string; items: string[] }) {
  if (!items.length) return null;
  return (
    <div className="border-t border-line pt-6">
      <h2 className="text-sm font-semibold uppercase tracking-[0.16em] text-steel">{title}</h2>
      <ul className="mt-4 space-y-2">
        {items.map((x) => (
          <li key={x} className="flex gap-3 text-[1.02rem]">
            <span className="mt-2.5 h-1.5 w-1.5 shrink-0 rounded-full bg-gradient-to-br from-lime to-accent" aria-hidden="true" />
            {x}
          </li>
        ))}
      </ul>
    </div>
  );
}

export default async function SolutionPage({ params }: Props) {
  const { slug } = await params;
  const [item, settings] = await Promise.all([getItemBySlug("solutions", slug), getAllSettings()]);
  if (!item) notFound();
  const d = item.data;
  const marks = bool(settings.general, "showProvisionalMarkers");
  const specs = rep(d, "specs").filter((x) => s(x, "label"));
  const docs = rep(d, "documents").filter((x) => file(x, "file").src);
  return (
    <>
      <PageHero eyebrow={CATEGORY_LABELS[s(d, "category")] ?? "Solução"} title={item.title} subtitle={s(d, "summary")}>
        <Link href="/solucoes" className="inline-flex items-center gap-2 text-sm font-medium text-steel hover:text-ink">
          <ArrowLeft className="h-4 w-4" aria-hidden="true" /> Todas as soluções
        </Link>
      </PageHero>
      <section className="container-x grid gap-14 py-20 md:py-28 lg:grid-cols-12">
        <div className="lg:col-span-7">
          <Provisional show={marks && bool(d, "provisional")} className="mb-6" />
          <Markdown source={s(d, "description")} />
          {specs.length > 0 && (
            <div className="mt-12">
              <h2 className="text-h3 font-semibold">Características técnicas</h2>
              <dl className="mt-6 divide-y divide-line border-y border-line">
                {specs.map((x, i) => (
                  <div key={i} className="grid grid-cols-2 gap-4 py-3.5 text-[0.98rem]">
                    <dt className="text-steel">{s(x, "label")}</dt>
                    <dd className="font-medium">{s(x, "value")}</dd>
                  </div>
                ))}
              </dl>
            </div>
          )}
        </div>
        <aside className="space-y-8 lg:col-span-4 lg:col-start-9">
          <ImageSlot image={img(d, "image")} className="aspect-[4/3] rounded-[var(--radius-card)]" label="Imagem pendente" />
          <ListBlock title="Aplicações" items={list(d, "applications")} />
          <ListBlock title="Segmentos atendidos" items={list(d, "segments")} />
          {docs.length > 0 && (
            <div className="border-t border-line pt-6">
              <h2 className="text-sm font-semibold uppercase tracking-[0.16em] text-steel">Documentos</h2>
              <ul className="mt-4 space-y-2">
                {docs.map((x, i) => (
                  <li key={i}>
                    <a href={file(x, "file").src} className="inline-flex items-center gap-2 font-medium underline decoration-accent underline-offset-4" download>
                      <Download className="h-4 w-4" aria-hidden="true" />
                      {s(x, "label") || file(x, "file").name}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          )}
          <div className="rounded-[var(--radius-card)] brand-deep p-7 text-white">
            <p className="text-lg font-medium">Quer saber mais sobre {item.title.toLowerCase()}?</p>
            <ButtonLink href={`/contato?assunto=${s(d, "category") === "produto" ? "comercial" : "coleta"}&ref=${encodeURIComponent(item.slug)}`} variant="accent" className="mt-6 w-full" arrow>
              Fale com um especialista
            </ButtonLink>
          </div>
        </aside>
      </section>
    </>
  );
}
