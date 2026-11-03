"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { applicationEvents, applicationNotes, applications, pipelineStages } from "@/lib/db/schema";
import { audit } from "@/lib/audit";
import { deleteFile } from "@/lib/storage/files";
import { guarded, str } from "./_guard";
import type { ActionResult } from "@/lib/actions/types";

async function moveStage(userId: string, userName: string, id: string, stageId: number) {
  const [app] = await db.select().from(applications).where(eq(applications.id, id)).limit(1);
  const [to] = await db.select().from(pipelineStages).where(eq(pipelineStages.id, stageId)).limit(1);
  if (!app || !to) return null;
  if (app.stageId === stageId) return { app, to, from: to };
  const [from] = await db.select().from(pipelineStages).where(eq(pipelineStages.id, app.stageId)).limit(1);
  await db.update(applications).set({ stageId, updatedAt: new Date() }).where(eq(applications.id, id));
  await db.insert(applicationEvents).values({ applicationId: id, userId, userName, type: "stage_changed", fromStage: from?.label ?? null, toStage: to.label });
  return { app, to, from };
}

export async function updateApplicationStage(_prev: ActionResult, form: FormData): Promise<ActionResult> {
  return guarded("applications.manage", async (user) => {
    const id = str(form, "id", 40);
    const stageId = Number(str(form, "stageId", 10));
    const r = await moveStage(user.id, user.name, id, stageId);
    if (!r) return { ok: false, message: "Candidatura ou etapa não encontrada." };
    await audit(user, "application.stage_changed", "application", id, { from: r.from?.label, to: r.to.label });
    revalidatePath("/admin/candidaturas");
    return { ok: true, message: `Etapa alterada para “${r.to.label}”.` };
  });
}

/** Used by the Kanban drag & drop (called directly, not via a form). */
export async function moveApplication(id: string, stageId: number): Promise<ActionResult> {
  return guarded("applications.manage", async (user) => {
    if (typeof id !== "string" || !Number.isInteger(stageId)) return { ok: false, message: "Dados inválidos." };
    const r = await moveStage(user.id, user.name, id, stageId);
    if (!r) return { ok: false, message: "Candidatura ou etapa não encontrada." };
    await audit(user, "application.stage_changed", "application", id, { from: r.from?.label, to: r.to.label, via: "kanban" });
    return { ok: true, message: `Movida para “${r.to.label}”.` };
  });
}

export async function addApplicationNote(_prev: ActionResult, form: FormData): Promise<ActionResult> {
  return guarded("applications.manage", async (user) => {
    const id = str(form, "id", 40);
    const body = str(form, "body", 5000);
    if (body.length < 2) return { ok: false, message: "Escreva a observação." };
    const [app] = await db.select({ id: applications.id }).from(applications).where(eq(applications.id, id)).limit(1);
    if (!app) return { ok: false, message: "Candidatura não encontrada." };
    await db.insert(applicationNotes).values({ applicationId: id, authorId: user.id, authorName: user.name, body });
    await db.insert(applicationEvents).values({ applicationId: id, userId: user.id, userName: user.name, type: "note_added" });
    await audit(user, "application.note_added", "application", id);
    return { ok: true, message: "Observação registrada." };
  });
}

export async function deleteApplication(_prev: ActionResult, form: FormData): Promise<ActionResult> {
  return guarded("applications.delete", async (user) => {
    const id = str(form, "id", 40);
    const [app] = await db.select().from(applications).where(eq(applications.id, id)).limit(1);
    if (!app) return { ok: false, message: "Candidatura não encontrada." };
    await db.delete(applications).where(eq(applications.id, id));
    if (app.resumeFileId) await deleteFile(app.resumeFileId);
    await audit(user, "application.deleted", "application", id, { protocol: app.protocol, reason: str(form, "reason", 300) || null });
    redirect("/admin/candidaturas?excluida=1");
  });
}
