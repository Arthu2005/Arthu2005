import Link from "next/link";
import { desc, eq, sql } from "drizzle-orm";
import { db } from "@/lib/db";
import { applications, jobs, type JobStatus } from "@/lib/db/schema";
import { requirePage } from "@/lib/auth/session";
import { AdminHeader, Empty, Table } from "@/components/admin/ui";
import { Badge } from "@/components/ui/Badge";
import { JOB_STATUS_LABELS, STATUS_TONE, formatDate } from "@/lib/labels";
import { cn } from "@/lib/cn";

export const metadata = { title: "Vagas" };

export default async function JobsAdmin({ searchParams }: { searchParams: Promise<{ status?: string; excluida?: string }> }) {
  await requirePage("jobs.manage");
  const { status, excluida } = await searchParams;
  const valid = ["draft", "published", "paused", "closed", "archived"].includes(status ?? "") ? (status as JobStatus) : undefined;
  const rows = await db
    .select({ job: jobs, n: sql<number>`count(${applications.id})::int` })
    .from(jobs)
    .leftJoin(applications, eq(applications.jobId, jobs.id))
    .where(valid ? eq(jobs.status, valid) : sql`${jobs.status} <> 'archived'`)
    .groupBy(jobs.id)
    .orderBy(desc(jobs.updatedAt));
  const tabs = [{ v: undefined, l: "Ativas" }, ...(["published", "draft", "paused", "closed", "archived"] as JobStatus[]).map((v) => ({ v, l: JOB_STATUS_LABELS[v] }))];

  return (
    <>
      <AdminHeader
        title="Vagas"
        description="Crie, publique, pause, encerre e arquive vagas. As alterações são refletidas no site imediatamente."
        actions={
          <Link href="/admin/vagas/nova" className="inline-flex h-9 items-center rounded-lg bg-accent px-3.5 text-sm font-medium text-white">
            + Nova vaga
          </Link>
        }
      />
      {excluida && <p role="status" className="mb-4 text-sm text-ok">Vaga excluída.</p>}
      <nav aria-label="Filtrar por status" className="mb-5 flex flex-wrap gap-1.5">
        {tabs.map((t) => (
          <Link key={t.l} href={t.v ? `/admin/vagas?status=${t.v}` : "/admin/vagas"} aria-current={valid === t.v ? "page" : undefined} className={cn("rounded-full px-3 py-1.5 text-sm", valid === t.v ? "bg-accent-deep text-white" : "bg-white text-ink-2 ring-1 ring-line hover:ring-accent")}>
            {t.l}
          </Link>
        ))}
      </nav>
      {rows.length ? (
        <Table>
          <thead>
            <tr>
              <th>Cargo</th>
              <th>Status</th>
              <th>Local</th>
              <th>Candidaturas</th>
              <th>Prazo</th>
              <th>Atualizada</th>
            </tr>
          </thead>
          <tbody>
            {rows.map(({ job, n }) => (
              <tr key={job.id}>
                <td>
                  <Link href={`/admin/vagas/${job.id}`} className="font-medium hover:underline">
                    {job.title}
                  </Link>
                  <div className="text-xs text-steel">
                    {job.department} · {job.contractType}
                    {job.isDemo && <Badge tone="warn" className="ml-2">demo</Badge>}
                    {job.applicationMode === "external" && <Badge tone="info" className="ml-2">externa</Badge>}
                  </div>
                </td>
                <td>
                  <Badge tone={STATUS_TONE[job.status]}>{JOB_STATUS_LABELS[job.status]}</Badge>
                </td>
                <td className="whitespace-nowrap">
                  {job.city}/{job.state}
                </td>
                <td>
                  <Link href={`/admin/candidaturas?vaga=${job.id}`} className="tabular-nums hover:underline">
                    {n}
                    {job.maxApplications ? ` / ${job.maxApplications}` : ""}
                  </Link>
                </td>
                <td className="whitespace-nowrap text-steel">{job.deadline ? formatDate(job.deadline) : "—"}</td>
                <td className="whitespace-nowrap text-steel">{formatDate(job.updatedAt)}</td>
              </tr>
            ))}
          </tbody>
        </Table>
      ) : (
        <Empty title="Nenhuma vaga neste filtro.">Use “Nova vaga” para cadastrar uma oportunidade.</Empty>
      )}
    </>
  );
}
