"use server";

import { randomBytes } from "node:crypto";
import { revalidatePath } from "next/cache";
import { and, count, eq, ne, sql } from "drizzle-orm";
import { z } from "zod";
import { db } from "@/lib/db";
import { users, type Role } from "@/lib/db/schema";
import { hashPassword } from "@/lib/auth/password";
import { destroyAllSessionsFor } from "@/lib/auth/session";
import { audit } from "@/lib/audit";
import { guarded, str } from "./_guard";
import type { ActionResult } from "@/lib/actions/types";

const tempPassword = () => `${randomBytes(9).toString("base64url")}-${randomBytes(3).toString("hex")}7`;
const ROLES = ["admin", "recruiter", "editor"] as const;

async function otherActiveAdmins(excludeId: string) {
  const [r] = await db.select({ n: count() }).from(users).where(and(eq(users.role, "admin"), eq(users.active, true), ne(users.id, excludeId)));
  return r?.n ?? 0;
}

export async function createUser(_prev: ActionResult, form: FormData): Promise<ActionResult> {
  return guarded("users.manage", async (user) => {
    const parsed = z
      .object({ name: z.string().trim().min(3).max(160), email: z.string().trim().toLowerCase().email().max(254), role: z.enum(ROLES) })
      .safeParse({ name: str(form, "name"), email: str(form, "email"), role: str(form, "role") });
    if (!parsed.success) return { ok: false, message: "Informe nome, e-mail válido e perfil." };
    const [exists] = await db.select({ id: users.id }).from(users).where(sql`lower(${users.email}) = ${parsed.data.email}`).limit(1);
    if (exists) return { ok: false, message: "Já existe um usuário com este e-mail." };
    const password = tempPassword();
    const [created] = await db.insert(users).values({ ...parsed.data, passwordHash: await hashPassword(password), mustChangePassword: true }).returning({ id: users.id });
    await audit(user, "user.created", "user", created!.id, { email: parsed.data.email, role: parsed.data.role });
    revalidatePath("/admin/usuarios");
    return { ok: true, message: `Usuário criado. Senha temporária (exibida apenas uma vez — envie por canal seguro): ${password}` };
  });
}

export async function updateUser(_prev: ActionResult, form: FormData): Promise<ActionResult> {
  return guarded("users.manage", async (user) => {
    const id = str(form, "id", 40);
    const role = str(form, "role", 20) as Role;
    const active = form.get("active") === "on";
    if (!ROLES.includes(role as (typeof ROLES)[number])) return { ok: false, message: "Perfil inválido." };
    const [target] = await db.select().from(users).where(eq(users.id, id)).limit(1);
    if (!target) return { ok: false, message: "Usuário não encontrado." };
    if (target.role === "admin" && (role !== "admin" || !active) && (await otherActiveAdmins(id)) === 0) {
      return { ok: false, message: "É necessário manter pelo menos um administrador ativo." };
    }
    await db.update(users).set({ role, active, updatedAt: new Date() }).where(eq(users.id, id));
    if (!active || role !== target.role) await destroyAllSessionsFor(id);
    await audit(user, "user.updated", "user", id, { role, active, previousRole: target.role });
    revalidatePath("/admin/usuarios");
    return { ok: true, message: "Usuário atualizado." };
  });
}

export async function resetUserPassword(_prev: ActionResult, form: FormData): Promise<ActionResult> {
  return guarded("users.manage", async (user) => {
    const id = str(form, "id", 40);
    const [target] = await db.select().from(users).where(eq(users.id, id)).limit(1);
    if (!target) return { ok: false, message: "Usuário não encontrado." };
    const password = tempPassword();
    await db.update(users).set({ passwordHash: await hashPassword(password), mustChangePassword: true, updatedAt: new Date() }).where(eq(users.id, id));
    await destroyAllSessionsFor(id);
    await audit(user, "user.password_reset", "user", id);
    return { ok: true, message: `Nova senha temporária (exibida apenas uma vez): ${password}` };
  });
}
