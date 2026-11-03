import { asc, count, eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { applications, pipelineStages } from "@/lib/db/schema";
import { requirePage } from "@/lib/auth/session";
import { AdminHeader, Card, inputCls } from "@/components/admin/ui";
import { ActionForm, AdminButton } from "@/components/admin/ActionForm";
import { deleteStage, moveStageOrder, saveStage } from "@/lib/actions/admin/inbox";

export const metadata = { title: "Etapas do processo" };

export default async function StagesAdmin() {
  await requirePage("pipeline.configure");
  const stages = await db
    .select({ s: pipelineStages, n: count(applications.id) })
    .from(pipelineStages)
    .leftJoin(applications, eq(applications.stageId, pipelineStages.id))
    .groupBy(pipelineStages.id)
    .orderBy(asc(pipelineStages.sortOrder));
  return (
    <>
      <AdminHeader title="Etapas do processo seletivo" description="Etapas usadas no quadro Kanban e no histórico das candidaturas. Novas candidaturas entram na primeira etapa." />
      <div className="space-y-3">
        {stages.map(({ s, n }, i) => (
          <Card key={s.id}>
            <div className="flex flex-wrap items-end gap-3">
              <ActionForm action={saveStage} className="flex flex-1 flex-wrap items-end gap-3">
                <>
                  <>
                    <input type="hidden" name="id" value={s.id} />
                    <div className="min-w-48 flex-1">
                      <label className="mb-1 block text-xs text-steel" htmlFor={`l-${s.id}`}>
                        Nome
                      </label>
                      <input id={`l-${s.id}`} name="label" defaultValue={s.label} className={inputCls} />
                    </div>
                    <div>
                      <label className="mb-1 block text-xs text-steel" htmlFor={`c-${s.id}`}>
                        Cor
                      </label>
                      <input id={`c-${s.id}`} type="color" name="color" defaultValue={s.color} className="h-9 w-14 rounded-lg border border-line" />
                    </div>
                    <label className="flex h-9 items-center gap-2 text-sm">
                      <input type="checkbox" name="isTerminal" defaultChecked={s.isTerminal} /> Etapa final
                    </label>
                    <AdminButton variant="secondary">
                      Salvar
                    </AdminButton>
                  </>
                </>
              </ActionForm>
              <span className="h-9 py-2 text-xs text-steel">{n} candidatura(s)</span>
              <ActionForm action={moveStageOrder} showMessage={false}>
                <input type="hidden" name="id" value={s.id} />
                <input type="hidden" name="dir" value="up" />
                <AdminButton variant="ghost" disabled={i === 0} aria-label={`Mover ${s.label} para cima`}>
                  ↑
                </AdminButton>
              </ActionForm>
              <ActionForm action={moveStageOrder} showMessage={false}>
                <input type="hidden" name="id" value={s.id} />
                <input type="hidden" name="dir" value="down" />
                <AdminButton variant="ghost" disabled={i === stages.length - 1} aria-label={`Mover ${s.label} para baixo`}>
                  ↓
                </AdminButton>
              </ActionForm>
              <ActionForm action={deleteStage} confirm={`Excluir a etapa “${s.label}”?`}>
                <input type="hidden" name="id" value={s.id} />
                <AdminButton variant="danger" disabled={n > 0}>
                  Excluir
                </AdminButton>
              </ActionForm>
            </div>
          </Card>
        ))}
      </div>
      <Card title="Nova etapa" className="mt-6">
        <ActionForm action={saveStage} className="flex flex-wrap items-end gap-3">
          <>
            <>
              <input name="label" placeholder="Ex.: Teste prático" className={`${inputCls} max-w-xs`} aria-label="Nome da nova etapa" />
              <input type="color" name="color" defaultValue="#5a645e" className="h-9 w-14 rounded-lg border border-line" aria-label="Cor" />
              <AdminButton>Adicionar</AdminButton>
            </>
          </>
        </ActionForm>
      </Card>
    </>
  );
}
