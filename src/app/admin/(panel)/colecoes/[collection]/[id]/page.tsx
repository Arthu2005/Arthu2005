import { notFound } from "next/navigation";
import { and, eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { contentItems } from "@/lib/db/schema";
import { requirePage } from "@/lib/auth/session";
import { AdminHeader, Card, inputCls, labelCls } from "@/components/admin/ui";
import { ContentEditor } from "@/components/admin/ContentEditor";
import { ActionForm, AdminButton } from "@/components/admin/ActionForm";
import { getCollectionDef } from "@/lib/content/collections";
import { emptyObject, REVIEW_FIELDS } from "@/lib/content/fields";
import { deleteItem, saveItem } from "@/lib/actions/admin/content";

export const metadata = { title: "Editar item" };

export default async function ItemPage({ params, searchParams }: { params: Promise<{ collection: string; id: string }>; searchParams: Promise<{ criado?: string }> }) {
  await requirePage("content.manage");
  const [{ collection, id }, sp] = await Promise.all([params, searchParams]);
  const def = getCollectionDef(collection);
  if (!def) notFound();
  const isNew = id === "novo";
  if (!isNew && !/^[0-9a-f-]{36}$/i.test(id)) notFound();
  const [item] = isNew ? [] : await db.select().from(contentItems).where(and(eq(contentItems.id, id), eq(contentItems.collection, collection))).limit(1);
  if (!isNew && !item) notFound();
  return (
    <>
      <AdminHeader
        title={item?.title ?? `Novo(a) ${def.singular}`}
        back={{ href: `/admin/colecoes/${collection}`, label: def.label }}
        actions={
          item && def.hasPage && item.status === "published" ? (
            <a href={`/solucoes/${item.slug}`} target="_blank" className="inline-flex h-9 items-center rounded-lg border border-line bg-white px-3.5 text-sm font-medium">
              Ver no site ↗
            </a>
          ) : undefined
        }
      />
      {sp.criado && <p role="status" className="mb-4 text-sm text-ok">Item criado.</p>}
      <Card>
        <ContentEditor
          action={saveItem}
          fields={def.fields}
          reviewFields={REVIEW_FIELDS}
          initial={item?.data ?? { ...emptyObject(def.fields), provisional: false }}
          hidden={{ collection, ...(item ? { id: item.id } : {}) }}
          idPrefix={`item-${collection}`}
        >
          <div className="grid gap-4 md:grid-cols-[1fr_14rem_12rem]">
            <div>
              <label htmlFor="title" className={labelCls}>
                {collection === "testimonials" ? "Nome da pessoa" : collection === "faqs" ? "Pergunta" : "Título"} <span className="text-signal">*</span>
              </label>
              <input id="title" name="title" defaultValue={item?.title ?? ""} required className={inputCls} />
            </div>
            <div>
              <label htmlFor="slug" className={labelCls}>
                Identificador (slug)
              </label>
              <input id="slug" name="slug" defaultValue={item?.slug ?? ""} placeholder="gerado automaticamente" className={inputCls} />
            </div>
            <div>
              <label htmlFor="status" className={labelCls}>
                Status
              </label>
              <select id="status" name="status" defaultValue={item?.status ?? "draft"} className={inputCls}>
                <option value="draft">Rascunho</option>
                <option value="published">Publicado</option>
              </select>
            </div>
          </div>
        </ContentEditor>
      </Card>
      {item && (
        <ActionForm action={deleteItem} confirm="Excluir este item definitivamente?" className="mt-6">
          <input type="hidden" name="id" value={item.id} />
          <AdminButton variant="danger">Excluir item</AdminButton>
        </ActionForm>
      )}
    </>
  );
}
