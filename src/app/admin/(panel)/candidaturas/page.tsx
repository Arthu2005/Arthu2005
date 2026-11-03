import Link from "next/link";
import { asc, desc } from "drizzle-orm";
import { db } from "@/lib/db";
import { jobs, pipelineStages } from "@/lib/db/schema";
import { requirePage } from "@/lib/auth/session";
import { can } from "@/lib/auth/rbac";
import { AdminHeader, Empty, Table, inputCls, labelCls } from "@/components/admin/ui";
import { ApplicationPipeline } from "@/components/admin/ApplicationPipeline";
import { Badge } from "@/components/ui/Badge";
import { listApplications, parseAppFilters } from "@/lib/careers/admin-queries";
import { formatDateTime } from "@/lib/labels";
import { cn } from "@/lib/cn";

export const metadata = { title: "Candidaturas" };

export default async function ApplicationsAdmin({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const user = await requirePage("applications.view");
  const sp = await searchParams;
  const f = parseAppFilters(sp);
  const view = sp.ver === "kanban" ? "kanban" : "lista";
  const [rows, stages, jobList] = await Promise.all([
    listApplications(f),
    db.select().from(pipelineStages).orderBy(asc(pipelineStages.sortOrder)),
    db.select({ id: jobs.id, title: jobs.title, status: jobs.status }).from(jobs).orderBy(desc(jobs.updatedAt)),
  ]);
  const qs = (extra: Record<string, string | undefined>) => {
    const p = new URLSearchParams(Object.entries({ vaga: f.vaga, etapa: f.etapa, de: f.de, ate: f.ate, q: f.q, ver: view === "kanban" ? "kanban" : undefined, ...extra }).filter(([, v]) => v) as [string, string][]);
    return p.size ? `?${p}` : "";
  };

  return (
    <>
      <AdminHeader
        title="Candidaturas"
        description="Dados pessoais protegidos: acesso restrito a recrutadores e administradores. Observações internas nunca são exibidas aos candidatos."
        actions={
          can(user.role, "applications.export") && (
            <a href={`/api/admin/export/candidaturas${qs({ ver: undefined })}`} className="inline-flex h-9 items-center rounded-lg border border-line bg-white px-3.5 text-sm font-medium hover:border-ink/40">
              Exportar CSV (filtro atual)
            </a>
          )
        }
      />
      {sp.excluida && <p role="status" className="mb-4 text-sm text-ok">Candidatura excluída definitivamente.</p>}
      <form className="mb-6 grid gap-3 rounded-2xl border border-line bg-white p-4 sm:grid-cols-2 lg:grid-cols-6" role="search" aria-label="Filtrar candidaturas">
        {view === "kanban" && <input type="hidden" name="ver" value="kanban" />}
        <div className="lg:col-span-2">
          <label className={labelCls} htmlFor="f-q">
            Buscar
          </label>
          <input id="f-q" name="q" defaultValue={f.q} placeholder="Nome, e-mail, protocolo, cidade" className={inputCls} />
        </div>
        <div>
          <label className={labelCls} htmlFor="f-vaga">
            Vaga
          </label>
          <select id="f-vaga" name="vaga" defaultValue={f.vaga ?? ""} className={inputCls}>
            <option value="">Todas</option>
            {jobList.map((j) => (
              <option key={j.id} value={j.id}>
                {j.title}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className={labelCls} htmlFor="f-etapa">
            Etapa
          </label>
          <select id="f-etapa" name="etapa" defaultValue={f.etapa ?? ""} className={inputCls}>
            <option value="">Todas</option>
            {stages.map((s) => (
              <option key={s.id} value={s.id}>
                {s.label}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className={labelCls} htmlFor="f-de">
            De
          </label>
          <input id="f-de" type="date" name="de" defaultValue={f.de} className={inputCls} />
        </div>
        <div>
          <label className={labelCls} htmlFor="f-ate">
            Até
          </label>
          <input id="f-ate" type="date" name="ate" defaultValue={f.ate} className={inputCls} />
        </div>
        <div className="flex items-end gap-2 sm:col-span-2 lg:col-span-6">
          <button className="h-9 rounded-lg bg-accent px-4 text-sm font-medium text-white">Filtrar</button>
          <Link href={`/admin/candidaturas${view === "kanban" ? "?ver=kanban" : ""}`} className="h-9 rounded-lg px-3 py-2 text-sm text-steel hover:text-ink">
            Limpar
          </Link>
          <div className="ml-auto flex rounded-lg border border-line p-0.5 text-sm" role="group" aria-label="Visualização">
            <Link href={`/admin/candidaturas${qs({ ver: undefined })}`} aria-current={view === "lista" ? "page" : undefined} className={cn("rounded-md px-3 py-1.5", view === "lista" && "bg-accent-deep text-white")}>
              Tabela
            </Link>
            <Link href={`/admin/candidaturas${qs({ ver: "kanban" })}`} aria-current={view === "kanban" ? "page" : undefined} className={cn("rounded-md px-3 py-1.5", view === "kanban" && "bg-accent-deep text-white")}>
              Kanban
            </Link>
          </div>
        </div>
      </form>

      <p className="mb-3 text-sm text-steel">
        {rows.length} candidatura{rows.length === 1 ? "" : "s"}
        {rows.length >= 500 && " (exibindo as 500 mais recentes; refine os filtros)"}
      </p>
      {rows.length === 0 ? (
        <Empty title="Nenhuma candidatura encontrada.">Ajuste os filtros ou aguarde novas inscrições.</Empty>
      ) : view === "kanban" ? (
        <ApplicationPipeline
          stages={stages.map((s) => ({ id: s.id, label: s.label, color: s.color }))}
          cards={rows.map((r) => ({ id: r.id, fullName: r.fullName, jobTitle: r.jobTitle, createdAt: r.createdAt.toISOString(), stageId: r.stageId, isDemo: r.isDemo }))}
          canEdit={can(user.role, "applications.manage")}
        />
      ) : (
        <Table>
          <thead>
            <tr>
              <th>Candidato</th>
              <th>Vaga</th>
              <th>Etapa</th>
              <th>Local</th>
              <th>Recebida</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.id}>
                <td>
                  <Link href={`/admin/candidaturas/${r.id}`} className="font-medium hover:underline">
                    {r.fullName}
                  </Link>
                  <div className="text-xs text-steel">
                    {r.protocol}
                    {r.isDemo && <Badge tone="warn" className="ml-2">demo</Badge>}
                  </div>
                </td>
                <td>{r.jobTitle}</td>
                <td>
                  <span className="inline-flex items-center gap-1.5">
                    <span className="h-2 w-2 rounded-full" style={{ background: r.stageColor }} aria-hidden="true" />
                    {r.stageLabel}
                  </span>
                </td>
                <td className="whitespace-nowrap">
                  {r.city}/{r.state}
                </td>
                <td className="whitespace-nowrap text-steel">{formatDateTime(r.createdAt)}</td>
              </tr>
            ))}
          </tbody>
        </Table>
      )}
    </>
  );
}
