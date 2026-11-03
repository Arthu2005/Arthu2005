import Link from "next/link";
import { count, desc, eq, gte, sql } from "drizzle-orm";
import { db } from "@/lib/db";
import { applications, contactMessages, jobs, pipelineStages, talentPool } from "@/lib/db/schema";
import { requirePage } from "@/lib/auth/session";
import { can } from "@/lib/auth/rbac";
import { AdminHeader, Card, Stat, Table } from "@/components/admin/ui";
import { Badge } from "@/components/ui/Badge";
import { daysAgo, formatDateTime } from "@/lib/labels";

export const metadata = { title: "Visão geral" };

export default async function Dashboard() {
  const user = await requirePage("dashboard.view");
  const recruiting = can(user.role, "applications.view");
  const contact = can(user.role, "contact.manage");
  const since = daysAgo(30);

  const [jobStats, [appsTotal], [apps30], byStage, byJob, recent, [msgsNew], [msgsTotal], [talentTotal]] = await Promise.all([
    db.select({ status: jobs.status, n: count() }).from(jobs).groupBy(jobs.status),
    db.select({ n: count() }).from(applications),
    db.select({ n: count() }).from(applications).where(gte(applications.createdAt, since)),
    db
      .select({ label: pipelineStages.label, color: pipelineStages.color, n: sql<number>`count(${applications.id})::int` })
      .from(pipelineStages)
      .leftJoin(applications, eq(applications.stageId, pipelineStages.id))
      .groupBy(pipelineStages.id)
      .orderBy(pipelineStages.sortOrder),
    db
      .select({ id: jobs.id, title: jobs.title, status: jobs.status, n: sql<number>`count(${applications.id})::int` })
      .from(jobs)
      .leftJoin(applications, eq(applications.jobId, jobs.id))
      .groupBy(jobs.id)
      .orderBy(desc(sql`count(${applications.id})`))
      .limit(8),
    db
      .select({ id: applications.id, name: applications.fullName, createdAt: applications.createdAt, job: jobs.title, stage: pipelineStages.label, isDemo: applications.isDemo })
      .from(applications)
      .innerJoin(jobs, eq(jobs.id, applications.jobId))
      .innerJoin(pipelineStages, eq(pipelineStages.id, applications.stageId))
      .orderBy(desc(applications.createdAt))
      .limit(6),
    db.select({ n: count() }).from(contactMessages).where(eq(contactMessages.status, "novo")),
    db.select({ n: count() }).from(contactMessages),
    db.select({ n: count() }).from(talentPool),
  ]);
  const js = (st: string) => jobStats.find((j) => j.status === st)?.n ?? 0;
  const totalJobs = jobStats.reduce((a, b) => a + b.n, 0);
  const maxStage = Math.max(1, ...byStage.map((s) => s.n));

  return (
    <>
      <AdminHeader title={`Olá, ${user.name.split(" ")[0]}`} description="Indicadores calculados em tempo real a partir do banco de dados." />
      {recruiting && (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <Stat label="Total de vagas" value={totalJobs} hint={`${js("draft")} rascunho(s) · ${js("paused")} pausada(s)`} href="/admin/vagas" />
          <Stat label="Vagas abertas" value={js("published")} href="/admin/vagas?status=published" />
          <Stat label="Vagas encerradas" value={js("closed")} hint={`${js("archived")} arquivada(s)`} href="/admin/vagas?status=closed" />
          <Stat label="Candidaturas" value={appsTotal?.n ?? 0} hint={`${apps30?.n ?? 0} nos últimos 30 dias`} href="/admin/candidaturas" />
        </div>
      )}
      <div className="mt-4 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {contact && <Stat label="Mensagens novas" value={msgsNew?.n ?? 0} hint={`${msgsTotal?.n ?? 0} no total`} href="/admin/mensagens" />}
        {recruiting && <Stat label="Banco de talentos" value={talentTotal?.n ?? 0} href="/admin/banco-de-talentos" />}
      </div>

      {recruiting && (
        <div className="mt-8 grid gap-6 xl:grid-cols-2">
          <Card title="Candidaturas por etapa">
            <ul className="space-y-3">
              {byStage.map((s) => (
                <li key={s.label}>
                  <div className="flex justify-between text-sm">
                    <span>{s.label}</span>
                    <span className="tabular-nums text-steel">{s.n}</span>
                  </div>
                  <div className="mt-1 h-2 overflow-hidden rounded-full bg-paper-2" aria-hidden="true">
                    <div className="h-full rounded-full" style={{ width: `${(s.n / maxStage) * 100}%`, background: s.color }} />
                  </div>
                </li>
              ))}
            </ul>
          </Card>
          <Card title="Candidaturas por vaga">
            {byJob.length ? (
              <ul className="divide-y divide-line">
                {byJob.map((j) => (
                  <li key={j.id} className="flex items-center justify-between gap-4 py-2.5 text-sm">
                    <Link href={`/admin/candidaturas?vaga=${j.id}`} className="truncate hover:underline">
                      {j.title}
                    </Link>
                    <span className="tabular-nums font-medium">{j.n}</span>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-sm text-steel">Nenhuma vaga cadastrada.</p>
            )}
          </Card>
          <Card title="Candidaturas recentes" className="xl:col-span-2" actions={<Link href="/admin/candidaturas" className="text-sm underline">Ver todas</Link>}>
            {recent.length ? (
              <Table>
                <thead>
                  <tr>
                    <th>Candidato</th>
                    <th>Vaga</th>
                    <th>Etapa</th>
                    <th>Recebida</th>
                  </tr>
                </thead>
                <tbody>
                  {recent.map((r) => (
                    <tr key={r.id}>
                      <td>
                        <Link href={`/admin/candidaturas/${r.id}`} className="font-medium hover:underline">
                          {r.name}
                        </Link>
                        {r.isDemo && <Badge tone="warn" className="ml-2">demo</Badge>}
                      </td>
                      <td>{r.job}</td>
                      <td>{r.stage}</td>
                      <td className="whitespace-nowrap text-steel">{formatDateTime(r.createdAt)}</td>
                    </tr>
                  ))}
                </tbody>
              </Table>
            ) : (
              <p className="text-sm text-steel">Ainda não há candidaturas.</p>
            )}
          </Card>
        </div>
      )}
      {!recruiting && (
        <Card title="Atalhos" className="mt-8">
          <div className="flex flex-wrap gap-3 text-sm">
            <Link href="/admin/conteudo" className="rounded-lg border border-line px-3 py-2 hover:border-ink/40">Editar páginas</Link>
            <Link href="/admin/colecoes" className="rounded-lg border border-line px-3 py-2 hover:border-ink/40">Coleções</Link>
            <Link href="/admin/midia" className="rounded-lg border border-line px-3 py-2 hover:border-ink/40">Biblioteca de mídia</Link>
          </div>
        </Card>
      )}
    </>
  );
}
