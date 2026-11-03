import Link from "next/link";
import { notFound } from "next/navigation";
import { count, eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { applications, jobs } from "@/lib/db/schema";
import { requirePage } from "@/lib/auth/session";
import { AdminHeader, Card } from "@/components/admin/ui";
import { JobEditor } from "@/components/admin/JobEditor";
import { JobStatusControls } from "@/components/admin/JobStatusControls";
import { Badge } from "@/components/ui/Badge";
import { JOB_STATUS_LABELS, STATUS_TONE, formatDateTime } from "@/lib/labels";
import { jobAvailability } from "@/lib/careers/availability";
import { selectDistinct } from "../_departments";

export const metadata = { title: "Editar vaga" };

export default async function EditJob({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ criada?: string; duplicada?: string }> }) {
  await requirePage("jobs.manage");
  const [{ id }, sp] = await Promise.all([params, searchParams]);
  if (!/^[0-9a-f-]{36}$/i.test(id)) notFound();
  const [job] = await db.select().from(jobs).where(eq(jobs.id, id)).limit(1);
  if (!job) notFound();
  const [[c], departments] = await Promise.all([db.select({ n: count() }).from(applications).where(eq(applications.jobId, id)), selectDistinct()]);
  const n = c?.n ?? 0;
  const availability = jobAvailability(job, n);
  return (
    <>
      <AdminHeader
        title={job.title}
        back={{ href: "/admin/vagas", label: "Vagas" }}
        description={
          <span className="flex flex-wrap items-center gap-2">
            <Badge tone={STATUS_TONE[job.status]}>{JOB_STATUS_LABELS[job.status]}</Badge>
            {job.isDemo && <Badge tone="warn">Dados de demonstração</Badge>}
            {!availability.open && job.status === "published" && <Badge tone="warn">{availability.message}</Badge>}
            <span>Atualizada em {formatDateTime(job.updatedAt)}</span>
          </span>
        }
        actions={
          <>
            <Link href={`/carreiras/vagas/${job.slug}?preview=1`} target="_blank" className="inline-flex h-9 items-center rounded-lg border border-line bg-white px-3.5 text-sm font-medium hover:border-ink/40">
              Pré-visualizar ↗
            </Link>
            <Link href={`/admin/candidaturas?vaga=${job.id}`} className="inline-flex h-9 items-center rounded-lg border border-line bg-white px-3.5 text-sm font-medium hover:border-ink/40">
              {n} candidatura{n === 1 ? "" : "s"}
            </Link>
          </>
        }
      />
      {(sp.criada || sp.duplicada) && (
        <p role="status" className="mb-6 rounded-xl bg-ok/10 p-3 text-sm text-ok">
          {sp.criada ? "Vaga criada." : "Cópia criada como rascunho. Revise e publique quando estiver pronta."}
        </p>
      )}
      <div className="grid gap-6 2xl:grid-cols-[1fr_16rem]">
        <JobEditor job={job} departments={departments} />
        <Card title="Status da vaga" className="2xl:self-start">
          <JobStatusControls job={job} applicationCount={n} />
        </Card>
      </div>
    </>
  );
}
