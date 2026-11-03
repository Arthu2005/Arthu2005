import "server-only";
import { and, desc, eq, gte, ilike, lte, or, type SQL } from "drizzle-orm";
import { db } from "@/lib/db";
import { applications, jobs, pipelineStages } from "@/lib/db/schema";

export type AppFilters = { vaga?: string; etapa?: string; de?: string; ate?: string; q?: string };

export function parseAppFilters(sp: Record<string, string | string[] | undefined>): AppFilters {
  const one = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v)?.trim().slice(0, 100) || undefined;
  const date = (v?: string) => (v && /^\d{4}-\d{2}-\d{2}$/.test(v) ? v : undefined);
  const uuid = (v?: string) => (v && /^[0-9a-f-]{36}$/i.test(v) ? v : undefined);
  return { vaga: uuid(one(sp.vaga)), etapa: one(sp.etapa) && /^\d+$/.test(one(sp.etapa)!) ? one(sp.etapa) : undefined, de: date(one(sp.de)), ate: date(one(sp.ate)), q: one(sp.q) };
}

export function appWhere(f: AppFilters) {
  const w: SQL[] = [];
  if (f.vaga) w.push(eq(applications.jobId, f.vaga));
  if (f.etapa) w.push(eq(applications.stageId, Number(f.etapa)));
  if (f.de) w.push(gte(applications.createdAt, new Date(`${f.de}T00:00:00-03:00`)));
  if (f.ate) w.push(lte(applications.createdAt, new Date(`${f.ate}T23:59:59-03:00`)));
  if (f.q) {
    const t = `%${f.q.replace(/[\\%_]/g, (m) => `\\${m}`)}%`;
    w.push(or(ilike(applications.fullName, t), ilike(applications.email, t), ilike(applications.protocol, t), ilike(applications.city, t))!);
  }
  return w.length ? and(...w) : undefined;
}

export async function listApplications(f: AppFilters, limit = 500) {
  return db
    .select({
      id: applications.id,
      protocol: applications.protocol,
      fullName: applications.fullName,
      email: applications.email,
      phone: applications.phone,
      city: applications.city,
      state: applications.state,
      createdAt: applications.createdAt,
      isDemo: applications.isDemo,
      stageId: applications.stageId,
      stageLabel: pipelineStages.label,
      stageColor: pipelineStages.color,
      jobId: jobs.id,
      jobTitle: jobs.title,
      linkedinUrl: applications.linkedinUrl,
      answers: applications.answers,
      resumeFileId: applications.resumeFileId,
    })
    .from(applications)
    .innerJoin(jobs, eq(jobs.id, applications.jobId))
    .innerJoin(pipelineStages, eq(pipelineStages.id, applications.stageId))
    .where(appWhere(f))
    .orderBy(desc(applications.createdAt))
    .limit(limit);
}
