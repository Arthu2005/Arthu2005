import { notFound } from "next/navigation";
import { eq } from "drizzle-orm";
import { Download } from "lucide-react";
import { db } from "@/lib/db";
import { files, talentPool } from "@/lib/db/schema";
import { requirePage } from "@/lib/auth/session";
import { can } from "@/lib/auth/rbac";
import { AdminHeader, Card, inputCls, labelCls } from "@/components/admin/ui";
import { ActionForm, AdminButton } from "@/components/admin/ActionForm";
import { deleteTalent, updateTalent } from "@/lib/actions/admin/inbox";
import { TALENT_STATUS_LABELS, formatDate, formatDateTime } from "@/lib/labels";
import { audit } from "@/lib/audit";

export const metadata = { title: "Cadastro do banco de talentos" };

export default async function TalentDetail({ params }: { params: Promise<{ id: string }> }) {
  const user = await requirePage("talent.manage");
  const { id } = await params;
  if (!/^[0-9a-f-]{36}$/i.test(id)) notFound();
  const [row] = await db.select({ t: talentPool, f: files }).from(talentPool).leftJoin(files, eq(files.id, talentPool.resumeFileId)).where(eq(talentPool.id, id)).limit(1);
  if (!row) notFound();
  const { t, f } = row;
  await audit(user, "talent.viewed", "talent", id);
  return (
    <>
      <AdminHeader title={t.fullName} back={{ href: "/admin/banco-de-talentos", label: "Banco de talentos" }} description={`${t.protocol} · cadastrado em ${formatDateTime(t.createdAt)}`} />
      <div className="grid gap-6 xl:grid-cols-[1fr_22rem]">
        <Card title="Dados">
          <dl className="grid gap-4 text-sm sm:grid-cols-2">
            {[
              ["E-mail", t.email],
              ["Telefone", t.phone],
              ["Local", `${t.city}/${t.state}`],
              ["Áreas", t.areas.join(", ")],
              ["LinkedIn", t.linkedinUrl ?? "—"],
              ["Consentimento", `${formatDateTime(t.consentAt)} (versão ${t.consentVersion})`],
              ["Retenção até", formatDate(t.retentionUntil)],
            ].map(([k, v]) => (
              <div key={k}>
                <dt className="text-xs uppercase tracking-wider text-steel">{k}</dt>
                <dd className="mt-1 break-words">{v}</dd>
              </div>
            ))}
          </dl>
          {t.experience && (
            <div className="mt-6 border-t border-line pt-5">
              <h3 className="text-xs uppercase tracking-wider text-steel">Experiência</h3>
              <p className="mt-2 whitespace-pre-line text-sm">{t.experience}</p>
            </div>
          )}
          {f && can(user.role, "resumes.download") && (
            <a href={`/api/admin/arquivos/${f.id}`} className="mt-6 inline-flex h-10 items-center gap-2 rounded-lg bg-accent px-4 text-sm font-medium text-white">
              <Download className="h-4 w-4" aria-hidden="true" /> Baixar currículo
            </a>
          )}
        </Card>
        <div className="space-y-6">
          <Card title="Acompanhamento">
            <ActionForm action={updateTalent}>
              <>
                <div className="space-y-3">
                  <input type="hidden" name="id" value={t.id} />
                  <div>
                    <label className={labelCls} htmlFor="status">
                      Status
                    </label>
                    <select id="status" name="status" defaultValue={t.status} className={inputCls}>
                      {Object.entries(TALENT_STATUS_LABELS).map(([k, v]) => (
                        <option key={k} value={k}>
                          {v}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className={labelCls} htmlFor="notes">
                      Observações internas
                    </label>
                    <textarea id="notes" name="internalNotes" rows={5} defaultValue={t.internalNotes ?? ""} className={inputCls} />
                  </div>
                  <AdminButton>Salvar</AdminButton>
                </div>
              </>
            </ActionForm>
          </Card>
          <Card title="Exclusão (LGPD)">
            <ActionForm action={deleteTalent} confirm="Excluir definitivamente este cadastro e o currículo?">
              <>
                <>
                  <input type="hidden" name="id" value={t.id} />
                  <AdminButton variant="danger" className="w-full">
                    Excluir cadastro
                  </AdminButton>
                </>
              </>
            </ActionForm>
          </Card>
        </div>
      </div>
    </>
  );
}
