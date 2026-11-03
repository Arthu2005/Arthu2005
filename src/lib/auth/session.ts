import "server-only";
import { cache } from "react";
import { cookies } from "next/headers";
import { redirect, forbidden } from "next/navigation";
import { and, eq, gt, lt } from "drizzle-orm";
import { db } from "@/lib/db";
import { sessions, users, type Role, type User } from "@/lib/db/schema";
import { env } from "@/lib/env";
import { randomToken, sha256 } from "@/lib/crypto";
import { clientIpHash, userAgent } from "@/lib/request";
import { can, type Permission } from "./rbac";

export const SESSION_COOKIE = "ptl_session";
const SESSION_TTL_MS = 1000 * 60 * 60 * 12; // 12h
const RENEW_THRESHOLD_MS = 1000 * 60 * 60 * 2;

export type SessionUser = Pick<User, "id" | "email" | "name" | "role" | "mustChangePassword">;

export async function createSession(userId: string) {
  const token = randomToken(32);
  const expiresAt = new Date(Date.now() + SESSION_TTL_MS);
  await db.insert(sessions).values({
    id: sha256(token),
    userId,
    expiresAt,
    ipHash: await clientIpHash(),
    userAgent: await userAgent(),
  });
  // Opportunistic cleanup of expired sessions.
  await db.delete(sessions).where(lt(sessions.expiresAt, new Date()));
  const jar = await cookies();
  jar.set(SESSION_COOKIE, token, {
    httpOnly: true,
    secure: env.COOKIE_SECURE,
    sameSite: "lax",
    path: "/",
    expires: expiresAt,
  });
}

export async function destroySession() {
  const jar = await cookies();
  const token = jar.get(SESSION_COOKIE)?.value;
  if (token) await db.delete(sessions).where(eq(sessions.id, sha256(token)));
  jar.delete(SESSION_COOKIE);
}

export async function destroyAllSessionsFor(userId: string) {
  await db.delete(sessions).where(eq(sessions.userId, userId));
}

/** Validates the session cookie against the database. Cached per request. */
export const getSessionUser = cache(async (): Promise<SessionUser | null> => {
  const jar = await cookies();
  const token = jar.get(SESSION_COOKIE)?.value;
  if (!token || token.length > 100) return null;
  const id = sha256(token);
  const rows = await db
    .select({
      id: users.id,
      email: users.email,
      name: users.name,
      role: users.role,
      active: users.active,
      mustChangePassword: users.mustChangePassword,
      expiresAt: sessions.expiresAt,
    })
    .from(sessions)
    .innerJoin(users, eq(users.id, sessions.userId))
    .where(and(eq(sessions.id, id), gt(sessions.expiresAt, new Date())))
    .limit(1);
  const row = rows[0];
  if (!row || !row.active) return null;
  if (row.expiresAt.getTime() - Date.now() < RENEW_THRESHOLD_MS) {
    const expiresAt = new Date(Date.now() + SESSION_TTL_MS);
    await db.update(sessions).set({ expiresAt }).where(eq(sessions.id, id));
    try {
      jar.set(SESSION_COOKIE, token, { httpOnly: true, secure: env.COOKIE_SECURE, sameSite: "lax", path: "/", expires: expiresAt });
    } catch {
      // cookies() is read-only while rendering Server Components; renewal happens on the next action.
    }
  }
  return { id: row.id, email: row.email, name: row.name, role: row.role as Role, mustChangePassword: row.mustChangePassword };
});

/** For pages: redirects to login when there is no session, 403 when the role lacks permission. */
export async function requirePage(permission?: Permission): Promise<SessionUser> {
  const user = await getSessionUser();
  if (!user) redirect("/admin/login");
  if (permission && !can(user.role, permission)) forbidden();
  return user;
}

export class AuthError extends Error {
  constructor(public code: "unauthenticated" | "forbidden") {
    super(code === "unauthenticated" ? "Sessão expirada. Entre novamente." : "Você não tem permissão para esta ação.");
  }
}

/** For server actions / route handlers: throws AuthError (never trust the UI alone). */
export async function requirePermission(permission: Permission): Promise<SessionUser> {
  const user = await getSessionUser();
  if (!user) throw new AuthError("unauthenticated");
  if (!can(user.role, permission)) throw new AuthError("forbidden");
  return user;
}
