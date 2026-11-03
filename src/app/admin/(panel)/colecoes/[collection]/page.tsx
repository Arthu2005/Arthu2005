import Link from "next/link";
import { notFound } from "next/navigation";
import { asc, eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { contentItems } from "@/lib/db/schema";
import { requirePage } from "@/lib/auth/session";
import { AdminHeader, Empty, Table } from "@/components/admin/ui";
import { ActionForm, AdminButton } from "@/components/admin/ActionForm";
import { Badge } from "@/components/ui/Badge";
import { getCollectionDef } from "@/lib/content/collections";
import { moveItem } from "@/lib/actions/admin/content";
import { formatDate } from "@/lib/labels";

export const metadata = { title: "Coleção" };

export default async function CollectionPage({ params, searchParams }: { params: Promise<{ collection: string }>; searchParams: Promise<{ excluido?: string }> }) {
  await requirePage("content.manage");
  const [{ collection }, sp] = await Promise.all([params, searchParams]);
  const def = getCollectionDef(collection);
  if (!def) notFound();
  const items = await db.select().from(contentItems).where(eq(contentItems.collection, collection)).orderBy(asc(contentItems.sortOrder), asc(contentItems.title));
  return (
    <>
      <AdminHeader
        title={def.label}
        description={def.description}
        back={{ href: "/admin/colecoes", label: "Coleções" }}
        actions={
          <Link href={`/admin/colecoes/${collection}/novo`} className="inline-flex h-9 items-center rounded-lg bg-accent px-3.5 text-sm font-medium text-white">
            + Adicionar {def.singular}
          </Link>
        }
      />
      {sp.excluido && <p role="status" className="mb-4 text-sm text-ok">Item excluído.</p>}
      {items.length ? (
        <Table>
          <thead>
            <tr>
              <th className="w-24">Ordem</th>
              <th>Título</th>
              <th>Status</th>
              <th>Atualizado</th>
            </tr>
          </thead>
          <tbody>
            {items.map((it, i) => (
              <tr key={it.id}>
                <td>
                  <div className="flex gap-1">
                    <ActionForm action={moveItem} showMessage={false}>
                      <input type="hidden" name="id" value={it.id} />
                      <input type="hidden" name="dir" value="up" />
                      <AdminButton variant="ghost" disabled={i === 0} aria-label={`Subir ${it.title}`}>
                        ↑
                      </AdminButton>
                    </ActionForm>
                    <ActionForm action={moveItem} showMessage={false}>
                      <input type="hidden" name="id" value={it.id} />
                      <input type="hidden" name="dir" value="down" />
                      <AdminButton variant="ghost" disabled={i === items.length - 1} aria-label={`Descer ${it.title}`}>
                        ↓
                      </AdminButton>
                    </ActionForm>
                  </div>
                </td>
                <td>
                  <Link href={`/admin/colecoes/${collection}/${it.id}`} className="font-medium hover:underline">
                    {it.title}
                  </Link>
                  {it.data.provisional === true && <Badge tone="warn" className="ml-2">provisório</Badge>}
                </td>
                <td>
                  <Badge tone={it.status === "published" ? "ok" : "neutral"}>{it.status === "published" ? "Publicado" : "Rascunho"}</Badge>
                </td>
                <td className="text-steel">{formatDate(it.updatedAt)}</td>
              </tr>
            ))}
          </tbody>
        </Table>
      ) : (
        <Empty title="Nenhum item cadastrado." />
      )}
    </>
  );
}
