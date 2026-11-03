import "server-only";
import { and, inArray, isNotNull, lt } from "drizzle-orm";
import { db } from "@/lib/db";
import { applications, contactMessages, talentPool } from "@/lib/db/schema";
import { deleteFile } from "@/lib/storage/files";

/**
 * LGPD retention: permanently removes personal data whose retention date has passed,
 * including the stored resume files. Run daily (cron) via `npm run retention:run`
 * or manually from Admin › Privacidade.
 */
export async function runRetention(today = new Date().toISOString().slice(0, 10)) {
  const expiredApps = await db
    .select({ id: applications.id, fileId: applications.resumeFileId })
    .from(applications)
    .where(lt(applications.retentionUntil, today));
  const expiredTalent = await db
    .select({ id: talentPool.id, fileId: talentPool.resumeFileId })
    .from(talentPool)
    .where(and(lt(talentPool.retentionUntil, today), isNotNull(talentPool.id)));

  if (expiredApps.length) await db.delete(applications).where(inArray(applications.id, expiredApps.map((a) => a.id)));
  if (expiredTalent.length) await db.delete(talentPool).where(inArray(talentPool.id, expiredTalent.map((a) => a.id)));
  for (const f of [...expiredApps, ...expiredTalent]) if (f.fileId) await deleteFile(f.fileId);

  const removedContacts = await db.delete(contactMessages).where(lt(contactMessages.retentionUntil, today)).returning({ id: contactMessages.id });

  return { applications: expiredApps.length, talentPool: expiredTalent.length, contactMessages: removedContacts.length };
}
