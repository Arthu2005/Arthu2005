"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { count, eq, max } from "drizzle-orm";
import { db } from "@/lib/db";
import { applications, contactMessages, pipelineStages, talentPool } from "@/lib/db/schema";
import { audit } from "@/lib/audit";
import { deleteFile } from "@/lib/storage/files";
import { guarded, str } from "./_guard";
import type { ActionResult } from "@/lib/actions/types";

/* Talent pool ---------------------------------------------------------- */
export async function updateTalent(_prev: ActionResult, form: FormData): Promise<ActionResult> {
  return guarded("talent.manage", async (user) => {
    const id = str(form, "id", 40);
    const status = str(form, "status", 20);
    if (!["novo", "em_analise", "contatado", "arquivado"].includes(status)) return { ok: false, message: "Status inválido." };
    const res = await db
      .update(talentPool)
      .set({ status: status as "novo", internalNotes: str(form, "internalNotes", 5000) || null, updatedAt: new Date() })
      .where(eq(talentPool.id, id))
      .returning({ id: talentPool.id });
    if (!res.length) return { ok: false, message: "Cadastro não encontrado." };
    await audit(user, "talent.updated", "talent", id, { status });
    return { ok: true, message: "Cadastro atualizado." };
  });
}

export async function deleteTalent(_prev: ActionResult, form: FormData): Promise<ActionResult> {
  return guarded("talent.manage", async (user) => {
    const id = str(form, "id", 40);
    const [row] = await db.select().from(talentPool).where(eq(talentPool.id, id)).limit(1);
    if (!row) return { ok: false, message: "Cadastro não encontrado." };
    await db.delete(talentPool).where(eq(talentPool.id, id));
    if (row.resumeFileId) await deleteFile(row.resumeFileId);
    await audit(user, "talent.deleted", "talent", id, { protocol: row.protocol });
    redirect("/admin/banco-de-talentos?excluido=1");
  });
}

/* Contact messages ------------------------------------------------------ */
export async function updateMessage(_prev: ActionResult, form: FormData): Promise<ActionResult> {
  return guarded("contact.manage", async (user) => {
    const id = str(form, "id", 40);
    const status = str(form, "status", 20);
    if (!["novo", "em_andamento", "respondido", "arquivado"].includes(status)) return { ok: false, message: "Status inválido." };
    const res = await db
      .update(contactMessages)
      .set({ status: status as "novo", internalNotes: str(form, "internalNotes", 5000) || null, updatedAt: new Date() })
      .where(eq(contactMessages.id, id))
      .returning({ id: contactMessages.id });
    if (!res.length) return { ok: false, message: "Mensagem não encontrada." };
    await audit(user, "contact.updated", "contact", id, { status });
    return { ok: true, message: "Mensagem atualizada." };
  });
}

export async function deleteMessage(_prev: ActionResult, form: FormData): Promise<ActionResult> {
  return guarded("contact.manage", async (user) => {
    const id = str(form, "id", 40);
    await db.delete(contactMessages).where(eq(contactMessages.id, id));
    await audit(user, "contact.deleted", "contact", id);
    redirect("/admin/mensagens?excluida=1");
  });
}

/* Pipeline stages ------------------------------------------------------- */
export async function saveStage(_prev: ActionResult, form: FormData): Promise<ActionResult> {
  return guarded("pipeline.configure", async (user) => {
    const id = Number(str(form, "id", 10)) || null;
    const label = str(form, "label", 80);
    const color = /^#[0-9a-f]{6}$/i.test(str(form, "color", 7)) ? str(form, "color", 7) : "#5a645e";
    const isTerminal = form.get("isTerminal") === "on";
    if (label.length < 2) return { ok: false, message: "Informe o nome da etapa." };
    if (id) {
      await db.update(pipelineStages).set({ label, color, isTerminal }).where(eq(pipelineStages.id, id));
    } else {
      const [m] = await db.select({ m: max(pipelineStages.sortOrder) }).from(pipelineStages);
      await db.insert(pipelineStages).values({ key: `etapa-${Date.now().toString(36)}`, label, color, isTerminal, sortOrder: (m?.m ?? 0) + 1 });
    }
    await audit(user, id ? "pipeline.stage_updated" : "pipeline.stage_created", "stage", id, { label });
    revalidatePath("/admin/etapas");
    return { ok: true, message: "Etapa salva." };
  });
}

export async function moveStageOrder(_prev: ActionResult, form: FormData): Promise<ActionResult> {
  return guarded("pipeline.configure", async () => {
    const id = Number(str(form, "id", 10));
    const dir = str(form, "dir", 4) === "up" ? -1 : 1;
    const all = await db.select().from(pipelineStages).orderBy(pipelineStages.sortOrder);
    const i = all.findIndex((s) => s.id === id);
    const j = i + dir;
    if (i < 0 || j < 0 || j >= all.length) return { ok: false, message: "Não é possível mover." };
    [all[i], all[j]] = [all[j]!, all[i]!];
    for (const [k, s] of all.entries()) await db.update(pipelineStages).set({ sortOrder: k }).where(eq(pipelineStages.id, s.id));
    return { ok: true, message: "Ordem atualizada." };
  });
}

export async function deleteStage(_prev: ActionResult, form: FormData): Promise<ActionResult> {
  return guarded("pipeline.configure", async (user) => {
    const id = Number(str(form, "id", 10));
    const [c] = await db.select({ n: count() }).from(applications).where(eq(applications.stageId, id));
    if ((c?.n ?? 0) > 0) return { ok: false, message: "Há candidaturas nesta etapa. Mova-as antes de excluir." };
    const [total] = await db.select({ n: count() }).from(pipelineStages);
    if ((total?.n ?? 0) <= 2) return { ok: false, message: "Mantenha pelo menos duas etapas." };
    await db.delete(pipelineStages).where(eq(pipelineStages.id, id));
    await audit(user, "pipeline.stage_deleted", "stage", id);
    return { ok: true, message: "Etapa excluída." };
  });
}
