"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { and, count, eq, ne } from "drizzle-orm";
import { z } from "zod";
import { db } from "@/lib/db";
import { applications, jobs, type JobQuestion, type JobStatus } from "@/lib/db/schema";
import { audit } from "@/lib/audit";
import { slugify } from "@/lib/labels";
import { UFS } from "@/lib/validation/forms";
import { guarded, str } from "./_guard";
import type { ActionResult } from "@/lib/actions/types";

const lines = (v: string) =>
  v
    .split("\n")
    .map((l) => l.replace(/^\s*[-•*]\s*/, "").trim())
    .filter(Boolean)
    .slice(0, 60)
    .map((l) => l.slice(0, 500));

const questionSchema = z.object({
  id: z.string().regex(/^[a-z0-9]{1,12}$/),
  label: z.string().trim().min(2).max(300),
  type: z.enum(["text", "textarea", "yesno", "select"]),
  required: z.boolean(),
  options: z.array(z.string().trim().min(1).max(120)).max(30).optional(),
});

const jobSchema = z.object({
  title: z.string().trim().min(3, "Informe o cargo.").max(160),
  slug: z.string().trim().max(160).optional(),
  department: z.string().trim().min(2, "Informe a área.").max(120),
  city: z.string().trim().min(2, "Informe a cidade.").max(120),
  state: z.enum(UFS, { message: "Selecione a UF." }),
  workModel: z.enum(["presencial", "hibrido", "remoto"]),
  contractType: z.string().trim().min(2, "Informe o tipo de contratação.").max(40),
  summary: z.string().trim().max(400),
  description: z.string().trim().max(20000),
  applicationMode: z.enum(["internal", "external"]),
  externalUrl: z
    .string()
    .trim()
    .max(1000)
    .refine((v) => !v || /^https:\/\//.test(v), "Use um link https://"),
  deadline: z
    .string()
    .trim()
    .refine((v) => !v || /^\d{4}-\d{2}-\d{2}$/.test(v), "Data inválida"),
  maxApplications: z
    .string()
    .trim()
    .refine((v) => !v || (/^\d+$/.test(v) && Number(v) > 0 && Number(v) < 100000), "Informe um número inteiro positivo"),
  seoTitle: z.string().trim().max(160),
  seoDescription: z.string().trim().max(300),
});

async function uniqueSlug(base: string, excludeId?: string) {
  const root = slugify(base) || "vaga";
  let candidate = root;
  for (let i = 2; i < 200; i++) {
    const [row] = await db
      .select({ id: jobs.id })
      .from(jobs)
      .where(excludeId ? and(eq(jobs.slug, candidate), ne(jobs.id, excludeId)) : eq(jobs.slug, candidate))
      .limit(1);
    if (!row) return candidate;
    candidate = `${root}-${i}`;
  }
  return `${root}-${Date.now()}`;
}

function revalidateCareers(slug?: string) {
  revalidatePath("/", "layout");
  if (slug) revalidatePath(`/carreiras/vagas/${slug}`);
}

export async function saveJob(_prev: ActionResult, form: FormData): Promise<ActionResult> {
  return guarded("jobs.manage", async (user) => {
    const id = str(form, "id", 40) || undefined;
    const intent = str(form, "intent", 20); // save | draft | publish
    const raw = Object.fromEntries(
      ["title", "slug", "department", "city", "state", "workModel", "contractType", "summary", "description", "applicationMode", "externalUrl", "deadline", "maxApplications", "seoTitle", "seoDescription"].map((k) => [
        k,
        str(form, k, k === "description" ? 20000 : 1000),
      ]),
    );
    const parsed = jobSchema.safeParse(raw);
    if (!parsed.success) {
      const errors: Record<string, string> = {};
      for (const i of parsed.error.issues) errors[String(i.path[0])] ??= i.message;
      return { ok: false, message: "Revise os campos destacados.", errors };
    }
    const d = parsed.data;
    if (d.applicationMode === "external" && !d.externalUrl) return { ok: false, message: "Informe o link do portal externo.", errors: { externalUrl: "Obrigatório para candidatura externa." } };

    let questions: JobQuestion[] = [];
    try {
      const q = JSON.parse(str(form, "questions", 50000) || "[]");
      questions = z.array(questionSchema).max(20).parse(q);
      for (const qq of questions) if (qq.type === "select" && !(qq.options?.length)) throw new Error("select sem opções");
    } catch {
      return { ok: false, message: "Perguntas adicionais inválidas: revise rótulos e opções (perguntas de seleção precisam de opções)." };
    }

    const [existing] = id ? await db.select().from(jobs).where(eq(jobs.id, id)).limit(1) : [];
    if (id && !existing) return { ok: false, message: "Vaga não encontrada." };

    let status: JobStatus = existing?.status ?? "draft";
    if (intent === "draft") status = "draft";
    if (intent === "publish") status = "published";

    const values = {
      title: d.title,
      slug: await uniqueSlug(d.slug || d.title, id),
      department: d.department,
      city: d.city,
      state: d.state,
      workModel: d.workModel,
      contractType: d.contractType,
      summary: d.summary,
      description: d.description,
      responsibilities: lines(str(form, "responsibilities", 20000)),
      requirements: lines(str(form, "requirements", 20000)),
      niceToHave: lines(str(form, "niceToHave", 20000)),
      benefits: lines(str(form, "benefits", 20000)),
      selectionSteps: lines(str(form, "selectionSteps", 5000)),
      questions,
      status,
      applicationMode: d.applicationMode,
      externalUrl: d.externalUrl || null,
      deadline: d.deadline || null,
      maxApplications: d.maxApplications ? Number(d.maxApplications) : null,
      featured: form.get("featured") === "on",
      seoTitle: d.seoTitle || null,
      seoDescription: d.seoDescription || null,
      updatedBy: user.id,
      updatedAt: new Date(),
      ...(status === "published" && !existing?.publishedAt ? { publishedAt: new Date() } : {}),
    };

    let jobId = id;
    if (existing) {
      await db.update(jobs).set(values).where(eq(jobs.id, existing.id));
      await audit(user, intent === "publish" && existing.status !== "published" ? "job.published" : "job.updated", "job", existing.id, { title: d.title, status });
    } else {
      const [created] = await db.insert(jobs).values({ ...values, createdBy: user.id }).returning({ id: jobs.id });
      jobId = created!.id;
      await audit(user, "job.created", "job", jobId, { title: d.title, status });
    }
    revalidateCareers(values.slug);
    if (!existing) redirect(`/admin/vagas/${jobId}?criada=1`);
    return { ok: true, message: status === "published" ? "Vaga salva e publicada." : "Vaga salva." };
  });
}

const STATUS_MESSAGES: Record<JobStatus, string> = {
  draft: "Vaga movida para rascunho.",
  published: "Vaga publicada.",
  paused: "Inscrições pausadas.",
  closed: "Vaga encerrada.",
  archived: "Vaga arquivada.",
};

export async function setJobStatus(_prev: ActionResult, form: FormData): Promise<ActionResult> {
  return guarded("jobs.manage", async (user) => {
    const id = str(form, "id", 40);
    const status = str(form, "status", 20) as JobStatus;
    if (!["draft", "published", "paused", "closed", "archived"].includes(status)) return { ok: false, message: "Status inválido." };
    const [job] = await db.select().from(jobs).where(eq(jobs.id, id)).limit(1);
    if (!job) return { ok: false, message: "Vaga não encontrada." };
    await db
      .update(jobs)
      .set({
        status,
        updatedAt: new Date(),
        updatedBy: user.id,
        ...(status === "published" && !job.publishedAt ? { publishedAt: new Date() } : {}),
        ...(status === "closed" ? { closedAt: new Date() } : {}),
      })
      .where(eq(jobs.id, id));
    await audit(user, `job.status.${status}`, "job", id, { from: job.status, to: status });
    revalidateCareers(job.slug);
    return { ok: true, message: STATUS_MESSAGES[status] };
  });
}

export async function duplicateJob(_prev: ActionResult, form: FormData): Promise<ActionResult> {
  return guarded("jobs.manage", async (user) => {
    const id = str(form, "id", 40);
    const [job] = await db.select().from(jobs).where(eq(jobs.id, id)).limit(1);
    if (!job) return { ok: false, message: "Vaga não encontrada." };
    const { id: _id, createdAt: _c, updatedAt: _u, publishedAt: _p, closedAt: _cl, slug: _s, ...rest } = job;
    const [copy] = await db
      .insert(jobs)
      .values({ ...rest, title: `${job.title} (cópia)`, slug: await uniqueSlug(`${job.slug}-copia`), status: "draft", featured: false, createdBy: user.id, updatedBy: user.id })
      .returning({ id: jobs.id });
    await audit(user, "job.duplicated", "job", copy!.id, { from: id });
    redirect(`/admin/vagas/${copy!.id}?duplicada=1`);
  });
}

export async function deleteJob(_prev: ActionResult, form: FormData): Promise<ActionResult> {
  return guarded("jobs.manage", async (user) => {
    const id = str(form, "id", 40);
    const [job] = await db.select().from(jobs).where(eq(jobs.id, id)).limit(1);
    if (!job) return { ok: false, message: "Vaga não encontrada." };
    const [c] = await db.select({ n: count() }).from(applications).where(eq(applications.jobId, id));
    if ((c?.n ?? 0) > 0) return { ok: false, message: "Esta vaga possui candidaturas e não pode ser excluída. Use “Arquivar” para retirá-la do site preservando o histórico." };
    await db.delete(jobs).where(eq(jobs.id, id));
    await audit(user, "job.deleted", "job", id, { title: job.title });
    revalidateCareers(job.slug);
    redirect("/admin/vagas?excluida=1");
  });
}
