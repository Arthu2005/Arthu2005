import type { MetadataRoute } from "next";
import { and, eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { contentItems, jobs } from "@/lib/db/schema";
import { siteUrl } from "@/lib/seo/metadata";

export const dynamic = "force-dynamic";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = siteUrl();
  const staticPages = ["", "/empresa", "/solucoes", "/sustentabilidade", "/carreiras", "/carreiras/vagas", "/carreiras/banco-de-talentos", "/contato", "/privacidade"];
  const [openJobs, solutions] = await Promise.all([
    db.select({ slug: jobs.slug, updatedAt: jobs.updatedAt }).from(jobs).where(and(eq(jobs.status, "published"), eq(jobs.isDemo, false))),
    db.select({ slug: contentItems.slug, updatedAt: contentItems.updatedAt }).from(contentItems).where(and(eq(contentItems.collection, "solutions"), eq(contentItems.status, "published"))),
  ]);
  return [
    ...staticPages.map((p) => ({ url: `${base}${p}`, changeFrequency: "weekly" as const, priority: p === "" ? 1 : 0.7 })),
    ...solutions.map((s) => ({ url: `${base}/solucoes/${s.slug}`, lastModified: s.updatedAt, priority: 0.6 })),
    ...openJobs.map((j) => ({ url: `${base}/carreiras/vagas/${j.slug}`, lastModified: j.updatedAt, changeFrequency: "daily" as const, priority: 0.8 })),
  ];
}
