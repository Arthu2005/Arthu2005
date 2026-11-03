/**
 * Creates (or resets) an administrator account.
 * Usage: npm run admin:create -- --email pessoa@empresa.com --name "Nome" [--role admin|recruiter|editor]
 * The password is read from ADMIN_PASSWORD or generated randomly and printed ONCE.
 */
import "./_env";
import { randomBytes } from "node:crypto";
import { sql } from "drizzle-orm";

const { db } = await import("@/lib/db");
const { users } = await import("@/lib/db/schema");
const { hashPassword, passwordPolicyError } = await import("@/lib/auth/password");

const arg = (n: string) => {
  const i = process.argv.indexOf(`--${n}`);
  return i > -1 ? process.argv[i + 1] : undefined;
};
const email = arg("email")?.toLowerCase();
const name = arg("name") ?? "Administrador";
const role = (arg("role") ?? "admin") as "admin" | "recruiter" | "editor";
if (!email || !email.includes("@")) {
  console.error("Informe --email");
  process.exit(1);
}
if (!["admin", "recruiter", "editor"].includes(role)) {
  console.error("--role deve ser admin, recruiter ou editor");
  process.exit(1);
}
const generated = !process.env.ADMIN_PASSWORD;
const password = process.env.ADMIN_PASSWORD ?? `${randomBytes(12).toString("base64url")}9a`;
const policy = passwordPolicyError(password);
if (policy) {
  console.error(policy);
  process.exit(1);
}
const passwordHash = await hashPassword(password);
const [existing] = await db.select({ id: users.id }).from(users).where(sql`lower(${users.email}) = ${email}`).limit(1);
if (existing) {
  await db.update(users).set({ passwordHash, role, name, active: true, mustChangePassword: generated, updatedAt: new Date() }).where(sql`${users.id} = ${existing.id}`);
} else {
  await db.insert(users).values({ email, name, role, passwordHash, mustChangePassword: generated });
}
console.log(`✓ Usuário ${email} (${role}) pronto.`);
if (generated) console.log(`  Senha temporária (troca obrigatória no primeiro acesso): ${password}`);
process.exit(0);
