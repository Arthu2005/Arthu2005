import "server-only";
import { z } from "zod";

const bool = (def: boolean) =>
  z
    .string()
    .optional()
    .transform((v) => (v === undefined || v === "" ? def : ["1", "true", "yes"].includes(v.toLowerCase())));

/*
 * Platform-aware defaults (Vercel): the database URL may come from the Neon/Supabase integration
 * (POSTGRES_URL), the public URL from the project domain, uploads must fit the 4.5 MB request cap and
 * only /tmp is writable (ephemeral — use STORAGE_DRIVER=s3 in production).
 */
const onVercel = Boolean(process.env.VERCEL);
const dbUrl = process.env.DATABASE_URL || process.env.POSTGRES_URL || "";
const pooled = /-pooler\.|:6543\b|pgbouncer=true/.test(dbUrl);
const vercelUrl = process.env.VERCEL_PROJECT_PRODUCTION_URL || process.env.VERCEL_URL;

const schema = z.object({
  NODE_ENV: z.enum(["development", "production", "test"]).default("development"),
  DATABASE_URL: z.string().min(1, "DATABASE_URL é obrigatória (ou conecte um banco Postgres ao projeto na Vercel)").default(dbUrl),
  DATABASE_POOL_MAX: z.coerce.number().int().positive().default(onVercel ? 2 : 10),
  DATABASE_PREPARE: bool(!pooled),
  APP_URL: z.string().url().default(vercelUrl ? `https://${vercelUrl}` : "http://localhost:3000"),
  APP_SECRET: z.string().min(32, "APP_SECRET deve ter pelo menos 32 caracteres"),
  STORAGE_DRIVER: z.enum(["local", "s3"]).default("local"),
  STORAGE_LOCAL_DIR: z.string().default(onVercel ? "/tmp/petrolub-storage" : "./storage"),
  S3_ENDPOINT: z.string().optional(),
  S3_REGION: z.string().default("us-east-1"),
  S3_BUCKET: z.string().optional(),
  S3_ACCESS_KEY_ID: z.string().optional(),
  S3_SECRET_ACCESS_KEY: z.string().optional(),
  S3_FORCE_PATH_STYLE: bool(true),
  UPLOAD_MAX_MB: z.coerce.number().positive().max(20).default(onVercel ? 4 : 5),
  SMTP_HOST: z.string().optional(),
  SMTP_PORT: z.coerce.number().int().default(587),
  SMTP_SECURE: bool(false),
  SMTP_USER: z.string().optional(),
  SMTP_PASS: z.string().optional(),
  SMTP_FROM: z.string().optional(),
  RECRUITING_NOTIFY_EMAIL: z.string().optional(),
  CONTACT_NOTIFY_EMAIL: z.string().optional(),
  TURNSTILE_SECRET_KEY: z.string().optional(),
  NEXT_PUBLIC_TURNSTILE_SITE_KEY: z.string().optional(),
  COOKIE_SECURE: bool(process.env.NODE_ENV === "production"),
});

function load() {
  const parsed = schema.safeParse(process.env);
  if (!parsed.success) {
    const issues = parsed.error.issues.map((i) => `  - ${i.path.join(".")}: ${i.message}`).join("\n");
    throw new Error(`Variáveis de ambiente inválidas:\n${issues}\nConsulte .env.example e docs/IMPLANTACAO.md.`);
  }
  return parsed.data;
}

export const env = load();
export const uploadMaxBytes = env.UPLOAD_MAX_MB * 1024 * 1024;
