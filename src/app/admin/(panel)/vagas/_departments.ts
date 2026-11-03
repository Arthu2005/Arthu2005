import "server-only";
import { db } from "@/lib/db";
import { jobs } from "@/lib/db/schema";
import { getSettings, list } from "@/lib/content/queries";

export async function selectDistinct() {
  const [rows, careers] = await Promise.all([db.selectDistinct({ d: jobs.department }).from(jobs), getSettings("careers")]);
  return [...new Set([...list(careers, "areas"), ...rows.map((r) => r.d)])].sort((a, b) => a.localeCompare(b, "pt-BR"));
}
