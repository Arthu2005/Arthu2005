import Link from "next/link";
import { ArrowUpRight, Briefcase, MapPin } from "lucide-react";
import type { Job } from "@/lib/db/schema";
import { WORK_MODEL_LABELS, formatDate } from "@/lib/labels";
import { Badge } from "@/components/ui/Badge";

export function JobCard({ job, headingLevel = "h3" }: { job: Job; headingLevel?: "h2" | "h3" }) {
  const H = headingLevel;
  return (
    <article className="group relative flex h-full flex-col rounded-[var(--radius-card)] border border-line bg-white p-6 transition-[transform,box-shadow,border-color] duration-500 ease-[cubic-bezier(.16,1,.3,1)] hover:-translate-y-1 hover:border-ink/25 hover:shadow-[0_30px_60px_-30px_rgb(0_0_0/0.35)] md:p-7">
      <div className="flex flex-wrap items-center gap-2">
        <Badge tone="neutral">{job.department}</Badge>
        {job.isDemo && <Badge tone="warn">Demonstração</Badge>}
        {job.featured && !job.isDemo && <Badge tone="accent">Destaque</Badge>}
      </div>
      <H className="mt-5 text-h3 font-semibold text-ink">
        <Link href={`/carreiras/vagas/${job.slug}`} className="after:absolute after:inset-0 after:rounded-[var(--radius-card)] focus-visible:outline-none">
          {job.title}
        </Link>
      </H>
      {job.summary && <p className="mt-3 line-clamp-3 text-[0.95rem] leading-relaxed text-steel">{job.summary}</p>}
      <dl className="mt-auto grid gap-2 pt-6 text-sm text-ink-2">
        <div className="flex items-center gap-2">
          <dt className="sr-only">Local</dt>
          <MapPin className="h-4 w-4 text-steel" aria-hidden="true" />
          <dd>
            {job.city} — {job.state} · {WORK_MODEL_LABELS[job.workModel]}
          </dd>
        </div>
        <div className="flex items-center gap-2">
          <dt className="sr-only">Contratação</dt>
          <Briefcase className="h-4 w-4 text-steel" aria-hidden="true" />
          <dd>{job.contractType}</dd>
        </div>
      </dl>
      <div className="mt-6 flex items-center justify-between border-t border-line pt-4 text-sm">
        <span className="text-steel">Publicada em {formatDate(job.publishedAt ?? job.createdAt)}</span>
        <span className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-accent text-white transition-[transform,background-color] duration-500 group-hover:rotate-45 group-hover:bg-accent-deep" aria-hidden="true">
          <ArrowUpRight className="h-4 w-4" />
        </span>
      </div>
    </article>
  );
}
