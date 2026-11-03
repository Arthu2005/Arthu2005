import "./_env";
import { drizzle } from "drizzle-orm/postgres-js";
import { migrate } from "drizzle-orm/postgres-js/migrator";
import postgres from "postgres";

const url = process.env.DATABASE_URL || process.env.POSTGRES_URL;
if (!url) throw new Error("DATABASE_URL não definida. Na Vercel, conecte um banco Postgres (Storage › Neon) ao projeto e faça um novo deploy.");
const client = postgres(url, { max: 1, onnotice: () => {} });
await migrate(drizzle(client), { migrationsFolder: "./drizzle" });
console.log("✓ Migrações aplicadas");
await client.end();
