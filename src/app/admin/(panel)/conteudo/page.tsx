import Link from "next/link";
import { db } from "@/lib/db";
import { contentSections } from "@/lib/db/schema";
import { requirePage } from "@/lib/auth/session";
import { AdminHeader } from "@/components/admin/ui";
import { Badge } from "@/components/ui/Badge";
import { PAGES } from "@/lib/content/sections";
import { formatDateTime } from "@/lib/labels";

export const metadata = { title: "Páginas" };

export default async function ContentIndex() {
  await requirePage("content.manage");
  const rows = await db.select().from(contentSections);
  return (
    <>
      <AdminHeader title="Páginas do site" description="Edite textos, imagens, chamadas e SEO de cada página. Conteúdos marcados como provisórios exibem um selo no site até serem validados." />
      <ul className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {PAGES.map((p) => {
          const secs = rows.filter((r) => r.page === p.page);
          const provisional = secs.filter((r) => r.data.provisional === true).length;
          const last = secs.reduce<Date | null>((a, r) => (!a || r.updatedAt > a ? r.updatedAt : a), null);
          return (
            <li key={p.page}>
              <Link href={`/admin/conteudo/${p.page}`} className="block h-full rounded-2xl border border-line bg-white p-5 transition-colors hover:border-ink/30">
                <p className="font-semibold">{p.label}</p>
                <p className="mt-1 font-mono text-xs text-steel">{p.path}</p>
                <p className="mt-4 flex flex-wrap items-center gap-2 text-xs text-steel">
                  {p.sections.length} seções
                  {provisional > 0 && <Badge tone="warn">{provisional} provisória(s)</Badge>}
                  {last && <span>· atualizado {formatDateTime(last)}</span>}
                </p>
              </Link>
            </li>
          );
        })}
      </ul>
    </>
  );
}
