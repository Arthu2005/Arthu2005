import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { eq } from "drizzle-orm";
import { ArrowLeft, Briefcase, CalendarDays, Clock, MapPin, Building2, Lock } from "lucide-react";
import { db } from "@/lib/db";
import { jobs, type Job } from "@/lib/db/schema";
import { Markdown } from "@/components/Markdown";
import { ApplicationForm } from "@/components/careers/ApplicationForm";
import { Badge } from "@/components/ui/Badge";
import { ButtonLink } from "@/components/ui/Button";
import { FadeIn } from "@/components/site/Reveal";
import { OilDrops } from "@/components/site/OilDrops";
import { getPublicJobBySlug, countApplications } from "@/lib/careers/queries";
import { jobAvailability } from "@/lib/careers/availability";
import { getSessionUser } from "@/lib/auth/session";
import { can } from "@/lib/auth/rbac";
import { issueFormToken } from "@/lib/spam";
import { uploadMaxBytes } from "@/lib/env";
import { JOB_STATUS_LABELS, WORK_MODEL_LABELS, formatDate } from "@/lib/labels";
import { siteUrl } from "@/lib/seo/metadata";
import { getSettings, s } from "@/lib/content/queries";

type Props = { params: Promise<{ slug: string }>; searchParams: Promise<{ preview?: string }> };

/** Admins/recruiters can preview drafts with ?preview=1 (checked server-side). */
async function loadJob(slug: string, preview: boolean): Promise<{ job: Job | null; isPreview: boolean }> {
  if (preview) {
    const user = await getSessionUser();
    if (user && can(user.role, "jobs.manage")) {
      const [job] = await db.select().from(jobs).where(eq(jobs.slug, slug)).limit(1);
      return { job: job ?? null, isPreview: true };
    }
  }
  return { job: await getPublicJobBySlug(slug), isPreview: false };
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const job = await getPublicJobBySlug((await params).slug);
  if (!job) return { title: "Vaga não encontrada", robots: { index: false } };
  return {
    title: job.seoTitle || `${job.title} — ${job.city}/${job.state}`,
    description: job.seoDescription || job.summary || `Vaga de ${job.title} na PETROLUB em ${job.city}/${job.state}.`,
    alternates: { canonical: `/carreiras/vagas/${job.slug}` },
    robots: job.status !== "published" || job.isDemo ? { index: false } : undefined,
    openGraph: { title: job.title, description: job.summary, type: "website" },
  };
}

function ListSection({ title, items }: { title: string; items: string[] }) {
  if (!items?.length) return null;
  return (
    <section className="border-t border-line pt-8">
      <h2 className="text-h3 font-semibold">{title}</h2>
      <ul className="mt-5 space-y-3">
        {items.map((x, i) => (
          <li key={i} className="flex gap-3 text-[1.04rem] leading-relaxed text-ink-2">
            <span className="mt-2.5 h-1.5 w-1.5 shrink-0 rounded-full bg-gradient-to-br from-lime to-accent" aria-hidden="true" />
            {x}
          </li>
        ))}
      </ul>
    </section>
  );
}

const EMPLOYMENT: Record<string, string> = { CLT: "FULL_TIME", PJ: "CONTRACTOR", Estágio: "INTERN", "Jovem Aprendiz": "INTERN", Temporário: "TEMPORARY", Trainee: "FULL_TIME" };

export default async function JobPage({ params, searchParams }: Props) {
  const [{ slug }, { preview }] = await Promise.all([params, searchParams]);
  const { job, isPreview } = await loadJob(slug, preview === "1");
  if (!job) notFound();
  const [count, general] = await Promise.all([countApplications(job.id), getSettings("general")]);
  const availability = jobAvailability(job, count);
  const facts = [
    { icon: Building2, label: "Área", value: job.department },
    { icon: MapPin, label: "Local", value: `${job.city} — ${job.state}` },
    { icon: Clock, label: "Modelo", value: WORK_MODEL_LABELS[job.workModel] },
    { icon: Briefcase, label: "Contratação", value: job.contractType },
    { icon: CalendarDays, label: "Publicada em", value: formatDate(job.publishedAt ?? job.createdAt) },
    ...(job.deadline ? [{ icon: CalendarDays, label: "Inscrições até", value: formatDate(job.deadline) }] : []),
  ];

  const jsonLd =
    job.status === "published" && !job.isDemo && !isPreview
      ? {
          "@context": "https://schema.org",
          "@type": "JobPosting",
          title: job.title,
          description: [job.summary, job.description].filter(Boolean).join("\n\n"),
          datePosted: (job.publishedAt ?? job.createdAt).toISOString(),
          ...(job.deadline ? { validThrough: `${job.deadline}T23:59:59-03:00` } : {}),
          employmentType: EMPLOYMENT[job.contractType] ?? "OTHER",
          hiringOrganization: { "@type": "Organization", name: s(general, "legalName") || "PETROLUB", sameAs: siteUrl() },
          jobLocation: { "@type": "Place", address: { "@type": "PostalAddress", addressLocality: job.city, addressRegion: job.state, addressCountry: "BR" } },
          ...(job.workModel === "remoto" ? { jobLocationType: "TELECOMMUTE" } : {}),
          directApply: job.applicationMode === "internal",
        }
      : null;

  return (
    <>
      {jsonLd && <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, "\\u003c") }} />}
      {isPreview && (
        <div className="fixed inset-x-0 bottom-0 z-[70] bg-lime px-4 py-2.5 text-center text-sm font-medium text-ink">
          Pré-visualização administrativa · status: {JOB_STATUS_LABELS[job.status]} ·{" "}
          <Link href={`/admin/vagas/${job.id}`} className="underline">
            voltar ao editor
          </Link>
        </div>
      )}
      <section className="relative isolate overflow-hidden border-b border-line pt-28 pb-14 md:pt-40 md:pb-20">
        <OilDrops />
        <div className="container-x">
          <Link href="/carreiras/vagas" className="inline-flex items-center gap-2 text-sm font-medium text-steel hover:text-ink">
            <ArrowLeft className="h-4 w-4" aria-hidden="true" /> Todas as vagas
          </Link>
          <FadeIn className="mt-8 flex flex-wrap gap-2">
            {job.isDemo && <Badge tone="warn">Vaga de demonstração — não é uma oportunidade real</Badge>}
            {!availability.open && <Badge tone="danger">{job.status === "published" ? "Inscrições encerradas" : JOB_STATUS_LABELS[job.status]}</Badge>}
            {availability.open && <Badge tone="ok">Inscrições abertas</Badge>}
          </FadeIn>
          <h1 className="mt-5 max-w-4xl text-h1 font-semibold">{job.title}</h1>
          {job.summary && <p className="mt-5 max-w-2xl text-lg text-steel">{job.summary}</p>}
          <dl className="mt-10 grid grid-cols-2 gap-x-6 gap-y-5 md:grid-cols-3 lg:grid-cols-6">
            {facts.map((f) => (
              <div key={f.label}>
                <dt className="flex items-center gap-1.5 text-xs uppercase tracking-[0.14em] text-steel">
                  <f.icon className="h-3.5 w-3.5" aria-hidden="true" /> {f.label}
                </dt>
                <dd className="mt-1.5 font-medium">{f.value}</dd>
              </div>
            ))}
          </dl>
          {availability.open && (
            <ButtonLink href="#candidatura" size="lg" className="mt-10" arrow>
              Candidatar-se
            </ButtonLink>
          )}
        </div>
      </section>

      <div className="container-x grid gap-14 py-16 md:py-24 lg:grid-cols-12">
        <article className="space-y-10 lg:col-span-7">
          {job.description && (
            <section>
              <h2 className="sr-only">Descrição</h2>
              <Markdown source={job.description} />
            </section>
          )}
          <ListSection title="Responsabilidades" items={job.responsibilities} />
          <ListSection title="Requisitos obrigatórios" items={job.requirements} />
          <ListSection title="Requisitos desejáveis" items={job.niceToHave} />
          <ListSection title="Benefícios" items={job.benefits} />
          {job.selectionSteps?.length > 0 && (
            <section className="border-t border-line pt-8">
              <h2 className="text-h3 font-semibold">Etapas do processo seletivo</h2>
              <ol className="mt-6 grid gap-3 sm:grid-cols-2">
                {job.selectionSteps.map((st, i) => (
                  <li key={i} className="flex items-center gap-4 rounded-2xl border border-line bg-white p-4">
                    <span className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-accent-deep font-mono text-sm text-white">{i + 1}</span>
                    {st}
                  </li>
                ))}
              </ol>
            </section>
          )}
        </article>

        <aside id="candidatura" className="scroll-mt-28 lg:col-span-5">
          <div className="lg:sticky lg:top-28">
            {!availability.open ? (
              <div className="rounded-[var(--radius-card)] border border-line bg-white p-8">
                <Lock className="h-6 w-6 text-steel" aria-hidden="true" />
                <h2 className="mt-5 text-h3 font-semibold">Candidaturas indisponíveis</h2>
                <p className="mt-3 text-steel">{availability.message}</p>
                <div className="mt-8 flex flex-wrap gap-3">
                  <ButtonLink href="/carreiras/vagas">Ver vagas abertas</ButtonLink>
                  <ButtonLink href="/carreiras/banco-de-talentos" variant="secondary">
                    Banco de talentos
                  </ButtonLink>
                </div>
              </div>
            ) : job.applicationMode === "external" && job.externalUrl ? (
              <div className="rounded-[var(--radius-card)] border border-line bg-white p-8">
                <h2 className="text-h3 font-semibold">Candidate-se</h2>
                <p className="mt-3 text-steel">As candidaturas para esta vaga são recebidas no nosso portal de recrutamento parceiro.</p>
                <ButtonLink href={job.externalUrl} size="lg" className="mt-8 w-full" arrow>
                  Candidatar-se no portal externo
                </ButtonLink>
              </div>
            ) : (
              <div className="rounded-[var(--radius-card)] border border-line bg-white p-6 md:p-8">
                <h2 className="text-h3 font-semibold">Candidatar-se</h2>
                <p className="mt-2 mb-8 text-sm text-steel">Leva poucos minutos. Seu currículo é armazenado de forma privada e acessado apenas pela equipe de recrutamento.</p>
                <ApplicationForm jobId={job.id} jobTitle={job.title} questions={job.questions ?? []} token={issueFormToken()} maxMb={Math.round(uploadMaxBytes / 1024 / 1024)} turnstileSiteKey={process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY || undefined} />
              </div>
            )}
          </div>
        </aside>
      </div>
    </>
  );
}
