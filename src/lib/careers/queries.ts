import "server-only";
import { cache } from "react";
import { and, count, desc, eq, ilike, inArray, or, sql, type SQL } from "drizzle-orm";
import { db } from "@/lib/db";
import { applications, jobs, type Job } from "@/lib/db/schema";

export const PUBLIC_STATUSES = ["published", "paused", "closed"] as const;

export type JobFilters = { q?: string; area?: string; local?: string; modelo?: string; contrato?: string; page?: number };

export const PAGE_SIZE = 9;

function escapeLike(v: string) {
  return v.replace(/[\\%_]/g, (m) => `\\${m}`);
}

/** Public job list: published first, then paused/closed ones are not listed (only reachable by URL). */
export async function listPublicJobs(f: JobFilters) {
  const where: SQL[] = [eq(jobs.status, "published")];
  if (f.q) {
    const term = `%${escapeLike(f.q.slice(0, 80))}%`;
    where.push(or(ilike(jobs.title, term), ilike(jobs.summary, term), ilike(jobs.department, term), ilike(jobs.description, term))!);
  }
  if (f.area) where.push(eq(jobs.department, f.area));
  if (f.local) {
    const [city, uf] = f.local.split("|");
    if (city && uf) where.push(and(eq(jobs.city, city), eq(jobs.state, uf))!);
  }
  if (f.modelo && ["presencial", "hibrido", "remoto"].includes(f.modelo)) where.push(eq(jobs.workModel, f.modelo as Job["workModel"]));
  if (f.contrato) where.push(eq(jobs.contractType, f.contrato));
  const page = Math.max(1, Math.min(200, f.page ?? 1));
  const cond = and(...where);
  const [rows, [total]] = await Promise.all([
    db
      .select()
      .from(jobs)
      .where(cond)
      .orderBy(desc(jobs.featured), desc(jobs.publishedAt))
      .limit(PAGE_SIZE)
      .offset((page - 1) * PAGE_SIZE),
    db.select({ n: count() }).from(jobs).where(cond),
  ]);
  return { jobs: rows, total: total?.n ?? 0, page, pages: Math.max(1, Math.ceil((total?.n ?? 0) / PAGE_SIZE)) };
}

/** Distinct values for the filter dropdowns (only from published jobs). */
export const getJobFacets = cache(async () => {
  const rows = await db
    .select({ department: jobs.department, city: jobs.city, state: jobs.state, contractType: jobs.contractType, workModel: jobs.workModel })
    .from(jobs)
    .where(eq(jobs.status, "published"));
  const uniq = (a: string[]) => [...new Set(a)].sort((x, y) => x.localeCompare(y, "pt-BR"));
  return {
    areas: uniq(rows.map((r) => r.department)),
    locations: uniq(rows.map((r) => `${r.city}|${r.state}`)),
    contracts: uniq(rows.map((r) => r.contractType)),
    models: uniq(rows.map((r) => r.workModel)),
  };
});

export const getFeaturedJobs = cache(async (limit = 3) => {
  return db.select().from(jobs).where(eq(jobs.status, "published")).orderBy(desc(jobs.featured), desc(jobs.publishedAt)).limit(limit);
});

export const getPublicJobBySlug = cache(async (slug: string) => {
  const [job] = await db
    .select()
    .from(jobs)
    .where(and(eq(jobs.slug, slug), inArray(jobs.status, [...PUBLIC_STATUSES])))
    .limit(1);
  return job ?? null;
});

export async function countApplications(jobId: string) {
  const [r] = await db.select({ n: count() }).from(applications).where(eq(applications.jobId, jobId));
  return r?.n ?? 0;
}

export async function countOpenJobs() {
  const [r] = await db.select({ n: count() }).from(jobs).where(eq(jobs.status, "published"));
  return r?.n ?? 0;
}

export { sql };
