"use server";

import { redirect } from "next/navigation";
import { eq, sql } from "drizzle-orm";
import { db } from "@/lib/db";
import { users } from "@/lib/db/schema";
import { hashPassword, passwordPolicyError, verifyPassword } from "@/lib/auth/password";
import { createSession, destroyAllSessionsFor, destroySession, getSessionUser } from "@/lib/auth/session";
import { clearRateLimit, rateLimit } from "@/lib/rate-limit";
import { clientIpHash } from "@/lib/request";
import { audit } from "@/lib/audit";
import type { ActionResult } from "@/lib/actions/types";

const DUMMY_HASH = "scrypt$32768$8$1$AAAAAAAAAAAAAAAAAAAAAA==$" + "A".repeat(86) + "==";

export async function login(_prev: ActionResult, form: FormData): Promise<ActionResult> {
  const email = String(form.get("email") ?? "").trim().toLowerCase().slice(0, 254);
  const password = String(form.get("password") ?? "").slice(0, 200);
  if (!email || !password) return { ok: false, message: "Informe e-mail e senha." };

  const ip = (await clientIpHash()) ?? "anon";
  const okIp = await rateLimit("login-ip", ip, 20, 15 * 60 * 1000);
  const okAccount = await rateLimit("login-account", email, 8, 15 * 60 * 1000);
  if (!okIp || !okAccount) return { ok: false, message: "Muitas tentativas. Aguarde 15 minutos e tente novamente." };

  const [user] = await db.select().from(users).where(sql`lower(${users.email}) = ${email}`).limit(1);
  // constant-ish time: always run a hash verification
  const valid = await verifyPassword(password, user?.passwordHash ?? DUMMY_HASH);
  if (!user || !valid || !user.active) {
    await audit(null, "auth.login_failed", "user", user?.id ?? null, { email });
    return { ok: false, message: "E-mail ou senha inválidos." };
  }
  await clearRateLimit("login-account", email);
  await createSession(user.id);
  await db.update(users).set({ lastLoginAt: new Date() }).where(eq(users.id, user.id));
  await audit({ id: user.id, email: user.email, name: user.name, role: user.role, mustChangePassword: user.mustChangePassword }, "auth.login", "user", user.id);
  const next = String(form.get("next") ?? "");
  redirect(user.mustChangePassword ? "/admin/conta?trocar=1" : next.startsWith("/admin") && !next.startsWith("//") ? next : "/admin");
}

export async function logout() {
  const user = await getSessionUser();
  await destroySession();
  if (user) await audit(user, "auth.logout", "user", user.id);
  redirect("/admin/login");
}

export async function changeOwnPassword(_prev: ActionResult, form: FormData): Promise<ActionResult> {
  const user = await getSessionUser();
  if (!user) return { ok: false, message: "Sessão expirada." };
  const current = String(form.get("current") ?? "");
  const next = String(form.get("next") ?? "");
  const confirm = String(form.get("confirm") ?? "");
  const [row] = await db.select().from(users).where(eq(users.id, user.id)).limit(1);
  if (!row || !(await verifyPassword(current, row.passwordHash))) return { ok: false, message: "Senha atual incorreta.", errors: { current: "Senha atual incorreta." } };
  const policy = passwordPolicyError(next);
  if (policy) return { ok: false, message: policy, errors: { next: policy } };
  if (next !== confirm) return { ok: false, message: "As senhas não coincidem.", errors: { confirm: "As senhas não coincidem." } };
  if (next === current) return { ok: false, message: "A nova senha deve ser diferente da atual.", errors: { next: "Escolha uma senha diferente." } };
  await db.update(users).set({ passwordHash: await hashPassword(next), mustChangePassword: false, updatedAt: new Date() }).where(eq(users.id, user.id));
  await destroyAllSessionsFor(user.id);
  await createSession(user.id);
  await audit(user, "auth.password_changed", "user", user.id);
  return { ok: true, message: "Senha alterada com sucesso." };
}
