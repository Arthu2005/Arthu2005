import { notFound } from "next/navigation";
import { requirePage } from "@/lib/auth/session";
import { AdminHeader } from "@/components/admin/ui";
import { ContentEditor } from "@/components/admin/ContentEditor";
import { Badge } from "@/components/ui/Badge";
import { getPageDef } from "@/lib/content/sections";
import { REVIEW_FIELDS } from "@/lib/content/fields";
import { getPage } from "@/lib/content/queries";
import { saveSection } from "@/lib/actions/admin/content";

export const metadata = { title: "Editar página" };

export default async function EditPage({ params }: { params: Promise<{ page: string }> }) {
  await requirePage("content.manage");
  const { page } = await params;
  const def = getPageDef(page);
  if (!def) notFound();
  const data = await getPage(page);
  return (
    <>
      <AdminHeader
        title={def.label}
        back={{ href: "/admin/conteudo", label: "Páginas" }}
        actions={
          <a href={def.path} target="_blank" className="inline-flex h-9 items-center rounded-lg border border-line bg-white px-3.5 text-sm font-medium hover:border-ink/40">
            Ver página ↗
          </a>
        }
      />
      <div className="space-y-4">
        {def.sections.map((sec, i) => (
          <details key={sec.key} open={i === 0} className="group rounded-2xl border border-line bg-white">
            <summary className="flex cursor-pointer list-none items-center justify-between gap-4 px-5 py-4 [&::-webkit-details-marker]:hidden">
              <span>
                <span className="font-semibold">{sec.label}</span>
                {sec.description && <span className="block text-xs text-steel">{sec.description}</span>}
              </span>
              <span className="flex items-center gap-2">
                {data[sec.key]?.provisional === true && <Badge tone="warn">provisório</Badge>}
                <span className="text-steel transition-transform group-open:rotate-180" aria-hidden="true">
                  ▾
                </span>
              </span>
            </summary>
            <div className="border-t border-line p-5">
              <ContentEditor
                action={saveSection}
                fields={sec.fields}
                reviewFields={sec.key === "seo" ? [] : REVIEW_FIELDS}
                initial={data[sec.key] ?? {}}
                hidden={{ page, key: sec.key }}
                submitLabel="Salvar e publicar seção"
                idPrefix={`${page}-${sec.key}`}
              />
            </div>
          </details>
        ))}
      </div>
    </>
  );
}
