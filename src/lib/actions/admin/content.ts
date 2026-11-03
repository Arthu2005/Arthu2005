"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { and, asc, desc, eq, inArray, ne } from "drizzle-orm";
import { db } from "@/lib/db";
import { applications, contentItems, contentSections, files, jobs, settings, talentPool } from "@/lib/db/schema";
import { audit } from "@/lib/audit";
import { coerceObject, missingRequired, REVIEW_FIELDS } from "@/lib/content/fields";
import { getSectionDef } from "@/lib/content/sections";
import { getCollectionDef } from "@/lib/content/collections";
import { getSettingsDef } from "@/lib/content/settings";
import { slugify } from "@/lib/labels";
import { deleteFile, saveUpload, UploadError } from "@/lib/storage/files";
import { DOCUMENT_KINDS, IMAGE_KINDS } from "@/lib/storage/sniff";
import { runRetention } from "@/lib/retention";
import { guarded, str } from "./_guard";
import type { ActionResult } from "@/lib/actions/types";

function parseJson(form: FormData) {
  try {
    return JSON.parse(String(form.get("data") ?? "{}"));
  } catch {
    return null;
  }
}

const revalidateSite = () => revalidatePath("/", "layout");

/* Sections --------------------------------------------------------------- */
export async function saveSection(_prev: ActionResult, form: FormData): Promise<ActionResult> {
  return guarded("content.manage", async (user) => {
    const page = str(form, "page", 40);
    const key = str(form, "key", 60);
    const def = getSectionDef(page, key);
    if (!def) return { ok: false, message: "Seção desconhecida." };
    const raw = parseJson(form);
    if (!raw) return { ok: false, message: "Dados inválidos." };
    const data = coerceObject([...def.fields, ...REVIEW_FIELDS], raw);
    const missing = missingRequired(def.fields, data);
    if (missing.length) return { ok: false, message: `Preencha: ${missing.join(", ")}.` };
    await db
      .insert(contentSections)
      .values({ page, key, data, updatedBy: user.id })
      .onConflictDoUpdate({ target: [contentSections.page, contentSections.key], set: { data, updatedBy: user.id, updatedAt: new Date() } });
    await audit(user, "content.section_saved", "section", `${page}.${key}`);
    revalidateSite();
    return { ok: true, message: "Seção salva e publicada." };
  });
}

/* Collection items -------------------------------------------------------- */
export async function saveItem(_prev: ActionResult, form: FormData): Promise<ActionResult> {
  return guarded("content.manage", async (user) => {
    const collection = str(form, "collection", 40);
    const def = getCollectionDef(collection);
    if (!def) return { ok: false, message: "Coleção desconhecida." };
    const id = str(form, "id", 40) || null;
    const title = str(form, "title", 200);
    if (title.length < 2) return { ok: false, message: "Informe o título.", errors: { title: "Obrigatório" } };
    const status = str(form, "status", 12) === "published" ? "published" : "draft";
    const raw = parseJson(form);
    if (!raw) return { ok: false, message: "Dados inválidos." };
    const data = coerceObject([...def.fields, ...REVIEW_FIELDS], raw);
    if (status === "published") {
      const missing = missingRequired(def.fields, data);
      if (missing.length) return { ok: false, message: `Para publicar, preencha: ${missing.join(", ")}.` };
    }
    let slug = slugify(str(form, "slug", 160) || title) || `item-${Date.now()}`;
    for (let i = 2; ; i++) {
      const [clash] = await db
        .select({ id: contentItems.id })
        .from(contentItems)
        .where(and(eq(contentItems.collection, collection), eq(contentItems.slug, slug), id ? ne(contentItems.id, id) : undefined))
        .limit(1);
      if (!clash) break;
      slug = `${slugify(title)}-${i}`;
    }
    if (id) {
      const res = await db.update(contentItems).set({ title, slug, status, data, updatedBy: user.id, updatedAt: new Date() }).where(and(eq(contentItems.id, id), eq(contentItems.collection, collection))).returning({ id: contentItems.id });
      if (!res.length) return { ok: false, message: "Item não encontrado." };
      await audit(user, "content.item_updated", collection, id, { title, status });
      revalidateSite();
      return { ok: true, message: status === "published" ? "Item salvo e publicado." : "Item salvo como rascunho." };
    }
    const [last] = await db.select({ o: contentItems.sortOrder }).from(contentItems).where(eq(contentItems.collection, collection)).orderBy(desc(contentItems.sortOrder)).limit(1);
    const [created] = await db.insert(contentItems).values({ collection, title, slug, status, data, sortOrder: (last?.o ?? 0) + 1, updatedBy: user.id }).returning({ id: contentItems.id });
    await audit(user, "content.item_created", collection, created!.id, { title, status });
    revalidateSite();
    redirect(`/admin/colecoes/${collection}/${created!.id}?criado=1`);
  });
}

export async function deleteItem(_prev: ActionResult, form: FormData): Promise<ActionResult> {
  return guarded("content.manage", async (user) => {
    const id = str(form, "id", 40);
    const [item] = await db.select().from(contentItems).where(eq(contentItems.id, id)).limit(1);
    if (!item) return { ok: false, message: "Item não encontrado." };
    await db.delete(contentItems).where(eq(contentItems.id, id));
    await audit(user, "content.item_deleted", item.collection, id, { title: item.title });
    revalidateSite();
    redirect(`/admin/colecoes/${item.collection}?excluido=1`);
  });
}

export async function moveItem(_prev: ActionResult, form: FormData): Promise<ActionResult> {
  return guarded("content.manage", async () => {
    const id = str(form, "id", 40);
    const dir = str(form, "dir", 4) === "up" ? -1 : 1;
    const [item] = await db.select().from(contentItems).where(eq(contentItems.id, id)).limit(1);
    if (!item) return { ok: false, message: "Item não encontrado." };
    const all = await db.select({ id: contentItems.id }).from(contentItems).where(eq(contentItems.collection, item.collection)).orderBy(asc(contentItems.sortOrder), asc(contentItems.title));
    const i = all.findIndex((x) => x.id === id);
    const j = i + dir;
    if (j < 0 || j >= all.length) return { ok: false, message: "" };
    [all[i], all[j]] = [all[j]!, all[i]!];
    for (const [k, x] of all.entries()) await db.update(contentItems).set({ sortOrder: k }).where(eq(contentItems.id, x.id));
    revalidateSite();
    return { ok: true, message: "" };
  });
}

/* Settings ----------------------------------------------------------------- */
export async function saveSettings(_prev: ActionResult, form: FormData): Promise<ActionResult> {
  return guarded("settings.manage", async (user) => {
    const key = str(form, "key", 60);
    const def = getSettingsDef(key);
    if (!def) return { ok: false, message: "Configuração desconhecida." };
    const raw = parseJson(form);
    if (!raw) return { ok: false, message: "Dados inválidos." };
    const value = coerceObject(def.fields, raw);
    const missing = missingRequired(def.fields, value);
    if (missing.length) return { ok: false, message: `Preencha: ${missing.join(", ")}.` };
    await db.insert(settings).values({ key, value, updatedBy: user.id }).onConflictDoUpdate({ target: settings.key, set: { value, updatedBy: user.id, updatedAt: new Date() } });
    await audit(user, "settings.saved", "settings", key);
    revalidateSite();
    return { ok: true, message: "Configurações salvas." };
  });
}

/* Media ---------------------------------------------------------------------- */
export async function uploadMedia(_prev: ActionResult, form: FormData): Promise<ActionResult> {
  return guarded("media.manage", async (user) => {
    const file = form.get("file");
    if (!(file instanceof File)) return { ok: false, message: "Selecione um arquivo." };
    const isPdf = file.name.toLowerCase().endsWith(".pdf");
    try {
      const saved = await saveUpload(file, {
        kinds: isPdf ? DOCUMENT_KINDS : IMAGE_KINDS,
        purpose: isPdf ? "document" : "media",
        visibility: "public",
        uploadedBy: user.id,
        alt: str(form, "alt", 300) || null,
        maxBytes: 15 * 1024 * 1024,
      });
      await audit(user, "media.uploaded", "file", saved.id, { name: saved.originalName });
      return { ok: true, message: "Arquivo enviado.", data: { id: saved.id, src: `/media/${saved.id}`, name: saved.originalName, alt: saved.alt ?? "", mime: saved.mimeType } };
    } catch (err) {
      if (err instanceof UploadError) return { ok: false, message: err.message };
      throw err;
    }
  });
}

export async function listMedia(kind: "image" | "document"): Promise<ActionResult> {
  return guarded("media.manage", async () => {
    const rows = await db
      .select({ id: files.id, name: files.originalName, alt: files.alt, mime: files.mimeType, size: files.size })
      .from(files)
      .where(and(eq(files.visibility, "public"), inArray(files.purpose, kind === "image" ? ["media"] : ["document"])))
      .orderBy(desc(files.createdAt))
      .limit(200);
    return { ok: true, message: "", data: { items: rows.map((r) => ({ ...r, src: `/media/${r.id}` })) } };
  });
}

export async function deleteMedia(_prev: ActionResult, form: FormData): Promise<ActionResult> {
  return guarded("media.manage", async (user) => {
    const id = str(form, "id", 40);
    const [f] = await db.select().from(files).where(and(eq(files.id, id), eq(files.visibility, "public"))).limit(1);
    if (!f) return { ok: false, message: "Arquivo não encontrado." };
    await deleteFile(id);
    await audit(user, "media.deleted", "file", id, { name: f.originalName });
    return { ok: true, message: "Arquivo excluído. Verifique se ele não era usado em alguma página." };
  });
}

/* Maintenance ------------------------------------------------------------------ */
export async function purgeDemoData(_prev: ActionResult): Promise<ActionResult> {
  return guarded("demo.purge", async (user) => {
    const demoApps = await db.select({ id: applications.id, f: applications.resumeFileId }).from(applications).where(eq(applications.isDemo, true));
    if (demoApps.length) await db.delete(applications).where(eq(applications.isDemo, true));
    for (const a of demoApps) if (a.f) await deleteFile(a.f);
    // demo jobs only if no real applications are attached
    const demoJobs = await db.select({ id: jobs.id }).from(jobs).where(eq(jobs.isDemo, true));
    let removedJobs = 0;
    for (const j of demoJobs) {
      const [real] = await db.select({ id: applications.id }).from(applications).where(eq(applications.jobId, j.id)).limit(1);
      if (!real) {
        await db.delete(jobs).where(eq(jobs.id, j.id));
        removedJobs++;
      } else {
        await db.update(jobs).set({ status: "archived" }).where(eq(jobs.id, j.id));
      }
    }
    await db.delete(talentPool).where(eq(talentPool.isDemo, true));
    await audit(user, "maintenance.demo_purged", null, null, { jobs: removedJobs, applications: demoApps.length });
    revalidateSite();
    return { ok: true, message: `Dados de demonstração removidos: ${removedJobs} vaga(s) e ${demoApps.length} candidatura(s).` };
  });
}

export async function runRetentionNow(_prev: ActionResult): Promise<ActionResult> {
  return guarded("retention.run", async (user) => {
    const r = await runRetention();
    await audit(user, "maintenance.retention_run", null, null, r);
    return { ok: true, message: `Retenção executada: ${r.applications} candidatura(s), ${r.talentPool} cadastro(s) e ${r.contactMessages} mensagem(ns) removidos.` };
  });
}
