import "server-only";
import { and, count, eq, gt, lt } from "drizzle-orm";
import { db } from "@/lib/db";
import { rateEvents } from "@/lib/db/schema";

/**
 * Sliding window limiter persisted in Postgres (works across instances/serverless).
 * Returns true when the action is allowed (and records it).
 */
export async function rateLimit(bucket: string, key: string | null, limit: number, windowMs: number): Promise<boolean> {
  const k = key ?? "anonymous";
  const since = new Date(Date.now() - windowMs);
  const [row] = await db
    .select({ n: count() })
    .from(rateEvents)
    .where(and(eq(rateEvents.bucket, bucket), eq(rateEvents.key, k), gt(rateEvents.createdAt, since)));
  if ((row?.n ?? 0) >= limit) return false;
  await db.insert(rateEvents).values({ bucket, key: k });
  if (Math.random() < 0.02) {
    await db.delete(rateEvents).where(lt(rateEvents.createdAt, new Date(Date.now() - 1000 * 60 * 60 * 24)));
  }
  return true;
}

export async function clearRateLimit(bucket: string, key: string) {
  await db.delete(rateEvents).where(and(eq(rateEvents.bucket, bucket), eq(rateEvents.key, key)));
}
