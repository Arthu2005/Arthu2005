import type { Metadata } from "next";
import { PageHero } from "@/components/site/PageHero";
import { SolutionCard, CATEGORY_LABELS } from "@/components/site/SolutionCard";
import { SolutionsGrid } from "@/components/site/SolutionsGrid";
import { Faq } from "@/components/site/Faq";
import { Reveal } from "@/components/site/Reveal";
import { ButtonLink } from "@/components/ui/Button";
import { bool, getAllSettings, getItems, getPage, s } from "@/lib/content/queries";
import { pageMetadata } from "@/lib/seo/metadata";

export const generateMetadata = (): Promise<Metadata> =>
  pageMetadata("solucoes", { title: "Soluções e produtos", description: "Coleta de óleo lubrificante usado, rerrefino, óleo básico rerrefinado Grupo I e documentação ambiental (CCO, CDF, MTR).", path: "/solucoes" });

export default async function SolucoesPage() {
  const [p, settings, solutions, faqs] = await Promise.all([getPage("solucoes"), getAllSettings(), getItems("solutions"), getItems("faqs")]);
  const marks = bool(settings.general, "showProvisionalMarkers");
  const categories = [...new Set(solutions.map((x) => s(x.data, "category")))].map((c) => ({ value: c, label: CATEGORY_LABELS[c] ?? c }));
  return (
    <>
      <PageHero eyebrow={s(p.hero, "eyebrow")} title={s(p.hero, "title")} subtitle={s(p.hero, "subtitle")} />
      <section className="container-x py-20 md:py-28">
        {solutions.length ? (
          <SolutionsGrid categories={categories} cards={solutions.map((item, i) => ({ id: item.id, category: s(item.data, "category"), node: <SolutionCard item={item} index={i} showMarkers={marks} /> }))} />
        ) : (
          <p className="text-steel">As soluções serão publicadas em breve.</p>
        )}
      </section>
      <Faq items={faqs.filter((f) => s(f.data, "scope") === "solucoes")} />
      <section className="container-x pb-24 md:pb-32">
        <Reveal className="on-dark rounded-[calc(var(--radius-card)*1.6)] brand-deep px-6 py-14 text-white md:px-14 md:py-20">
          <p className="eyebrow">{s(p.cta, "eyebrow")}</p>
          <h2 className="mt-5 max-w-2xl text-h2 font-semibold text-white">{s(p.cta, "title")}</h2>
          <p className="mt-5 max-w-xl text-lg text-white/70">{s(p.cta, "body")}</p>
          <ButtonLink href={s(p.cta, "linkHref") || "/contato"} variant="light" size="lg" className="mt-10" arrow>
            {s(p.cta, "linkLabel") || "Entrar em contato"}
          </ButtonLink>
        </Reveal>
      </section>
    </>
  );
}
