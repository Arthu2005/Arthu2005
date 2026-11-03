import Link from "next/link";
import { notFound } from "next/navigation";
import { asc, desc, eq } from "drizzle-orm";
import { Download, ExternalLink } from "lucide-react";
import { db } from "@/lib/db";
import { applicationEvents, applicationNotes, applications, files, jobs, pipelineStages } from "@/lib/db/schema";
import { requirePage } from "@/lib/auth/session";
import { can } from "@/lib/auth/rbac";
import { AdminHeader, Card, inputCls, labelCls } from "@/components/admin/ui";
import { ActionForm, AdminButton } from "@/components/admin/ActionForm";
import { Badge } from "@/components/ui/Badge";
import { addApplicationNote, deleteApplication, updateApplicationStage } from "@/lib/actions/admin/applications";
import { formatDate, formatDateTime } from "@/lib/labels";
import { audit } from "@/lib/audit";

export const metadata = { title: "Candidatura" };

const EVENT_LABELS: Record<string, string> = { created: "Candidatura recebida", stage_changed: "Etapa alterada", note_added: "Observação adicionada", resume_downloaded: "Currículo baixado" };

export default async function ApplicationDetail({ params }: { params: Promise<{ id: string }> }) {
  const user = await requirePage("applications.view");
  const { id } = await params;
  if (!/^[0-9a-f-]{36}$/i.test(id)) notFound();
  const [row] = await db
    .select({ app: applications, job: jobs, file: files })
    .from(applications)
    .innerJoin(jobs, eq(jobs.id, applications.jobId))
    .leftJoin(files, eq(files.id, applications.resumeFileId))
    .where(eq(applications.id, id))
    .limit(1);
  if (!row) notFound();
  const { app, job, file } = row;
  const [stages, notes, events] = await Promise.all([
    db.select().from(pipelineStages).orderBy(asc(pipelineStages.sortOrder)),
    db.select().from(applicationNotes).where(eq(applicationNotes.applicationId, id)).orderBy(desc(applicationNotes.createdAt)),
    db.select().from(applicationEvents).where(eq(applicationEvents.applicationId, id)).orderBy(desc(applicationEvents.createdAt)),
  ]);
  await audit(user, "application.viewed", "application", id);
  const manage = can(user.role, "applications.manage");
  const stage = stages.find((s) => s.id === app.stageId);

  return (
    <>
      <AdminHeader
        title={app.fullName}
        back={{ href: "/admin/candidaturas", label: "Candidaturas" }}
        description={
          <span className="flex flex-wrap items-center gap-2">
            <span className="font-mono">{app.protocol}</span>·
            <Link href={`/admin/vagas/${job.id}`} className="underline">
              {job.title}
            </Link>
            · recebida em {formatDateTime(app.createdAt)}
            {app.isDemo && <Badge tone="warn">demonstração</Badge>}
          </span>
        }
      />
      <div className="grid gap-6 xl:grid-cols-[1fr_24rem]">
        <div className="space-y-6">
          <Card title="Dados do candidato">
            <dl className="grid gap-4 text-sm sm:grid-cols-2">
              {[
                ["E-mail", <a key="e" href={`mailto:${app.email}`} className="underline">{app.email}</a>],
                ["Telefone", <a key="t" href={`tel:${app.phone.replace(/[^\d+]/g, "")}`} className="underline">{app.phone}</a>],
                ["Cidade", `${app.city}/${app.state}`],
                ["LinkedIn", app.linkedinUrl ? <a key="l" href={app.linkedinUrl} target="_blank" rel="noopener noreferrer nofollow" className="inline-flex items-center gap-1 underline">Abrir <ExternalLink className="h-3 w-3" /></a> : "—"],
                ["Portfólio", app.portfolioUrl ? <a key="p" href={app.portfolioUrl} target="_blank" rel="noopener noreferrer nofollow" className="inline-flex items-center gap-1 underline">Abrir <ExternalLink className="h-3 w-3" /></a> : "—"],
                ["Consentimento", `Aceito em ${formatDateTime(app.consentAt)} (versão ${app.consentVersion})`],
                ["Retenção até", formatDate(app.retentionUntil)],
              ].map(([k, v]) => (
                <div key={String(k)}>
                  <dt className="text-xs uppercase tracking-wider text-steel">{k}</dt>
                  <dd className="mt-1">{v}</dd>
                </div>
              ))}
            </dl>
            <div className="mt-6 border-t border-line pt-5">
              {file ? (
                can(user.role, "resumes.download") ? (
                  <a href={`/api/admin/arquivos/${file.id}`} className="inline-flex h-10 items-center gap-2 rounded-lg bg-accent px-4 text-sm font-medium text-white">
                    <Download className="h-4 w-4" aria-hidden="true" /> Baixar currículo ({file.originalName}, {(file.size / 1024).toFixed(0)} KB)
                  </a>
                ) : (
                  <p className="text-sm text-steel">Sem permissão para baixar currículos.</p>
                )
              ) : (
                <p className="text-sm text-steel">Nenhum currículo anexado.</p>
              )}
              <p className="mt-2 text-xs text-steel">Cada download é registrado na auditoria.</p>
            </div>
          </Card>
          {app.answers.length > 0 && (
            <Card title="Respostas às perguntas da vaga">
              <dl className="space-y-4 text-sm">
                {app.answers.map((a) => (
                  <div key={a.questionId}>
                    <dt className="font-medium">{a.label}</dt>
                    <dd className="mt-1 whitespace-pre-line text-ink-2">{a.answer || "—"}</dd>
                  </div>
                ))}
              </dl>
            </Card>
          )}
          <Card title="Observações internas">
            {manage && (
              <ActionForm action={addApplicationNote} className="mb-6">
                <>
                  <>
                    <input type="hidden" name="id" value={app.id} />
                    <label htmlFor="note" className={labelCls}>
                      Nova observação (visível apenas para a equipe)
                    </label>
                    <textarea id="note" name="body" rows={3} className={inputCls} required />
                    <AdminButton className="mt-2">
                      Registrar observação
                    </AdminButton>
                  </>
                </>
              </ActionForm>
            )}
            {notes.length ? (
              <ul className="space-y-4">
                {notes.map((n) => (
                  <li key={n.id} className="rounded-xl bg-paper p-4 text-sm">
                    <p className="whitespace-pre-line">{n.body}</p>
                    <p className="mt-2 text-xs text-steel">
                      {n.authorName ?? "—"} · {formatDateTime(n.createdAt)}
                    </p>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-sm text-steel">Nenhuma observação.</p>
            )}
          </Card>
        </div>
        <div className="space-y-6">
          <Card title="Etapa do processo">
            <p className="mb-4 flex items-center gap-2 text-sm">
              <span className="h-2.5 w-2.5 rounded-full" style={{ background: stage?.color }} aria-hidden="true" /> Atual: <strong>{stage?.label}</strong>
            </p>
            {manage && (
              <ActionForm action={updateApplicationStage}>
                <>
                  <>
                    <input type="hidden" name="id" value={app.id} />
                    <label htmlFor="stage" className={labelCls}>
                      Mover para
                    </label>
                    <select id="stage" name="stageId" defaultValue={app.stageId} className={inputCls}>
                      {stages.map((s) => (
                        <option key={s.id} value={s.id}>
                          {s.label}
                        </option>
                      ))}
                    </select>
                    <AdminButton className="mt-3 w-full">
                      Atualizar etapa
                    </AdminButton>
                  </>
                </>
              </ActionForm>
            )}
          </Card>
          <Card title="Histórico">
            <ol className="space-y-3 text-sm">
              {events.map((ev) => (
                <li key={ev.id} className="border-l-2 border-line pl-3">
                  <p className="font-medium">
                    {EVENT_LABELS[ev.type] ?? ev.type}
                    {ev.type === "stage_changed" && (
                      <span className="font-normal text-steel">
                        {" "}
                        {ev.fromStage} → {ev.toStage}
                      </span>
                    )}
                  </p>
                  <p className="text-xs text-steel">
                    {formatDateTime(ev.createdAt)}
                    {ev.userName ? ` · ${ev.userName}` : ""}
                  </p>
                </li>
              ))}
            </ol>
          </Card>
          {can(user.role, "applications.delete") && (
            <Card title="Exclusão (LGPD)">
              <p className="mb-3 text-sm text-steel">Use para atender pedidos de exclusão do titular. Remove os dados e o currículo definitivamente.</p>
              <ActionForm action={deleteApplication} confirm="Excluir definitivamente esta candidatura e o currículo? Esta ação não pode ser desfeita.">
                <>
                  <>
                    <input type="hidden" name="id" value={app.id} />
                    <label htmlFor="reason" className={labelCls}>
                      Motivo (registrado na auditoria)
                    </label>
                    <input id="reason" name="reason" className={inputCls} placeholder="Ex.: solicitação do titular em 03/11" />
                    <AdminButton variant="danger" className="mt-3 w-full">
                      Excluir candidatura
                    </AdminButton>
                  </>
                </>
              </ActionForm>
            </Card>
          )}
        </div>
      </div>
    </>
  );
}
