import type { Metadata } from "next";
import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { PageHero } from "@/components/site/PageHero";
import { JobFilters } from "@/components/careers/JobFilters";
import { JobCard } from "@/components/careers/JobCard";
import { Reveal } from "@/components/site/Reveal";
import { ButtonLink } from "@/components/ui/Button";
import { getJobFacets, listPublicJobs } from "@/lib/careers/queries";
import { getSettings, s } from "@/lib/content/queries";
import { cn } from "@/lib/cn";

export const metadata: Metadata = {
  title: "Vagas abertas",
  description: "Pesquise e filtre as vagas abertas na PETROLUB por área, localização, modelo de trabalho e tipo de contratação.",
  alternates: { canonical: "/carreiras/vagas" },
};

type Props = { searchParams: Promise<Record<string, string | string[] | undefined>> };
const one = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v)?.slice(0, 120) || undefined;

export default async function VagasPage({ searchParams }: Props) {
  const sp = await searchParams;
  const filters = { q: one(sp.q), area: one(sp.area), local: one(sp.local), modelo: one(sp.modelo), contrato: one(sp.contrato), page: Number(one(sp.pagina)) || 1 };
  const [result, facets, social] = await Promise.all([listPublicJobs(filters), getJobFacets(), getSettings("social")]);
  const hasFilters = Boolean(filters.q || filters.area || filters.local || filters.modelo || filters.contrato);
  const pageHref = (n: number) => {
    const q = new URLSearchParams(Object.entries({ ...filters, page: undefined, pagina: n > 1 ? String(n) : undefined }).filter(([, v]) => v) as [string, string][]);
    return `/carreiras/vagas${q.size ? `?${q}` : ""}`;
  };

  return (
    <>
      <PageHero eyebrow="Portal de vagas" title="Encontre sua oportunidade." subtitle="Use a busca e os filtros para encontrar vagas por área, local, modelo de trabalho e tipo de contratação." />
      <section className="container-x py-12 md:py-16">
        <JobFilters facets={facets} total={result.total} />

        {result.jobs.length > 0 ? (
          <ul className="mt-10 grid gap-5 md:grid-cols-2 lg:grid-cols-3">
            {result.jobs.map((job, i) => (
              <Reveal as="li" key={job.id} delay={Math.min(i, 5) * 0.05} y={18}>
                <JobCard job={job} headingLevel="h2" />
              </Reveal>
            ))}
          </ul>
        ) : (
          <div className="mt-10 rounded-[var(--radius-card)] border border-dashed border-ink/20 bg-white px-6 py-16 text-center">
            <h2 className="text-h3 font-semibold">{hasFilters ? "Nenhuma vaga corresponde aos filtros." : "Nenhuma vaga aberta no momento."}</h2>
            <p className="mx-auto mt-3 max-w-md text-steel">
              {hasFilters ? "Tente remover alguns filtros ou buscar outro termo." : "Novas oportunidades são publicadas com frequência."} Você também pode deixar seu currículo no banco de talentos.
            </p>
            <div className="mt-8 flex flex-wrap justify-center gap-3">
              {hasFilters && (
                <ButtonLink href="/carreiras/vagas" variant="secondary">
                  Limpar filtros
                </ButtonLink>
              )}
              <ButtonLink href="/carreiras/banco-de-talentos">Banco de talentos</ButtonLink>
              {s(social, "solides") && (
                <ButtonLink href={s(social, "solides")} variant="ghost" arrow>
                  Portal Sólides
                </ButtonLink>
              )}
            </div>
          </div>
        )}

        {result.pages > 1 && (
          <nav aria-label="Paginação" className="mt-12 flex items-center justify-center gap-2">
            {result.page > 1 && (
              <Link href={pageHref(result.page - 1)} className="inline-flex h-11 items-center gap-1 rounded-full border border-line bg-white px-4 text-sm font-medium hover:border-ink/40">
                <ChevronLeft className="h-4 w-4" aria-hidden="true" /> Anterior
              </Link>
            )}
            {Array.from({ length: result.pages }, (_, i) => i + 1).map((n) => (
              <Link
                key={n}
                href={pageHref(n)}
                aria-current={n === result.page ? "page" : undefined}
                className={cn("inline-flex h-11 w-11 items-center justify-center rounded-full text-sm font-medium", n === result.page ? "bg-accent-deep text-white" : "border border-line bg-white hover:border-accent")}
              >
                {n}
              </Link>
            ))}
            {result.page < result.pages && (
              <Link href={pageHref(result.page + 1)} className="inline-flex h-11 items-center gap-1 rounded-full border border-line bg-white px-4 text-sm font-medium hover:border-ink/40">
                Próxima <ChevronRight className="h-4 w-4" aria-hidden="true" />
              </Link>
            )}
          </nav>
        )}
      </section>
    </>
  );
}
