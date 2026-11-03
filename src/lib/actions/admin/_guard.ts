import "server-only";
import { AuthError, requirePermission, type SessionUser } from "@/lib/auth/session";
import type { Permission } from "@/lib/auth/rbac";
import type { ActionResult } from "@/lib/actions/types";

/**
 * Wraps an admin server action: enforces the permission on the server (never trusts the UI)
 * and converts auth/unexpected errors into a user-facing ActionResult.
 */
export async function guarded(permission: Permission, fn: (user: SessionUser) => Promise<ActionResult>): Promise<ActionResult> {
  let user: SessionUser;
  try {
    user = await requirePermission(permission);
  } catch (err) {
    if (err instanceof AuthError) return { ok: false, message: err.message };
    throw err;
  }
  try {
    return await fn(user);
  } catch (err) {
    // let Next.js redirects/notFound propagate
    if (err && typeof err === "object" && "digest" in err && String((err as { digest: unknown }).digest).startsWith("NEXT_")) throw err;
    console.error("[admin action]", err);
    return { ok: false, message: "Erro inesperado. Tente novamente." };
  }
}

export const str = (f: FormData, k: string, max = 500) => String(f.get(k) ?? "").trim().slice(0, max);
