import Link from "next/link";
import { count } from "drizzle-orm";
import { db } from "@/lib/db";
import { contentItems } from "@/lib/db/schema";
import { requirePage } from "@/lib/auth/session";
import { AdminHeader } from "@/components/admin/ui";
import { COLLECTIONS } from "@/lib/content/collections";

export const metadata = { title: "Coleções" };

export default async function CollectionsIndex() {
  await requirePage("content.manage");
  const counts = await db.select({ c: contentItems.collection, n: count() }).from(contentItems).groupBy(contentItems.collection);
  return (
    <>
      <AdminHeader title="Coleções" description="Conteúdos repetíveis usados em várias páginas: soluções, indicadores, depoimentos, perguntas frequentes e mais." />
      <ul className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {COLLECTIONS.map((c) => (
          <li key={c.key}>
            <Link href={`/admin/colecoes/${c.key}`} className="block h-full rounded-2xl border border-line bg-white p-5 transition-colors hover:border-ink/30">
              <p className="flex items-center justify-between font-semibold">
                {c.label}
                <span className="rounded-full bg-paper-2 px-2 text-xs tabular-nums">{counts.find((x) => x.c === c.key)?.n ?? 0}</span>
              </p>
              <p className="mt-2 text-sm text-steel">{c.description}</p>
            </Link>
          </li>
        ))}
      </ul>
    </>
  );
}
