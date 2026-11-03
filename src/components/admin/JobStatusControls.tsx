"use client";

import type { Job } from "@/lib/db/schema";
import { deleteJob, duplicateJob, setJobStatus } from "@/lib/actions/admin/jobs";
import { ActionForm, AdminButton } from "./ActionForm";

export function JobStatusControls({ job, applicationCount }: { job: Job; applicationCount: number }) {
  const statusBtn = (status: Job["status"], label: string, variant: "secondary" | "danger" = "secondary", confirm?: string) => (
    <ActionForm action={setJobStatus} confirm={confirm} showMessage={false}>
      {({ pending }) => (
        <>
          <input type="hidden" name="id" value={job.id} />
          <input type="hidden" name="status" value={status} />
          <AdminButton variant={variant} pending={pending} className="w-full">
            {label}
          </AdminButton>
        </>
      )}
    </ActionForm>
  );
  return (
    <div className="grid gap-2">
      {job.status === "published" && statusBtn("paused", "Pausar inscrições")}
      {(job.status === "paused" || job.status === "closed") && statusBtn("published", "Reabrir inscrições")}
      {job.status !== "closed" && job.status !== "draft" && statusBtn("closed", "Encerrar vaga", "secondary", "Encerrar a vaga? Ela continuará acessível pelo link, mas sem receber candidaturas.")}
      {job.status !== "draft" && job.status !== "archived" && statusBtn("draft", "Mover para rascunho (retira do site)")}
      {job.status !== "archived" && statusBtn("archived", "Arquivar", "secondary", "Arquivar a vaga? Ela sai do site, mas o histórico de candidaturas é mantido.")}
      {job.status === "archived" && statusBtn("draft", "Desarquivar (como rascunho)")}
      <ActionForm action={duplicateJob} showMessage={false}>
        {({ pending }) => (
          <>
            <input type="hidden" name="id" value={job.id} />
            <AdminButton variant="secondary" pending={pending} className="w-full">
              Duplicar vaga
            </AdminButton>
          </>
        )}
      </ActionForm>
      <ActionForm action={deleteJob} confirm="Excluir definitivamente esta vaga? Esta ação não pode ser desfeita.">
        {({ pending }) => (
          <>
            <input type="hidden" name="id" value={job.id} />
            <AdminButton variant="danger" pending={pending} className="w-full" disabled={applicationCount > 0} title={applicationCount > 0 ? "Vagas com candidaturas não podem ser excluídas; use Arquivar." : undefined}>
              Excluir vaga
            </AdminButton>
          </>
        )}
      </ActionForm>
    </div>
  );
}
