import "server-only";
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "./schema";
import { env } from "@/lib/env";

declare global {
  var __petrolubSql: ReturnType<typeof postgres> | undefined;
}

function createClient() {
  return postgres(env.DATABASE_URL, {
    max: env.DATABASE_POOL_MAX,
    // Supabase / PgBouncer transaction pooling does not support prepared statements.
    prepare: env.DATABASE_PREPARE,
    onnotice: () => {},
  });
}

const client = globalThis.__petrolubSql ?? createClient();
if (process.env.NODE_ENV !== "production") globalThis.__petrolubSql = client;

export const db = drizzle(client, { schema });
export { schema };
