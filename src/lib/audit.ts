import "server-only";
import { db } from "@/lib/db";
import { auditLogs } from "@/lib/db/schema";
import { clientIpHash } from "@/lib/request";
import type { SessionUser } from "@/lib/auth/session";

export async function audit(
  user: SessionUser | null,
  action: string,
  entityType?: string | null,
  entityId?: string | number | null,
  details?: Record<string, unknown>,
) {
  try {
    await db.insert(auditLogs).values({
      userId: user?.id ?? null,
      userEmail: user?.email ?? null,
      action,
      entityType: entityType ?? null,
      entityId: entityId != null ? String(entityId) : null,
      details: details ?? null,
      ipHash: await clientIpHash(),
    });
  } catch (err) {
    console.error("[audit] falha ao registrar", action, err);
  }
}
