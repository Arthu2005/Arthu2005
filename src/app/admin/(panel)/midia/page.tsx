/* eslint-disable @next/next/no-img-element */
import { desc, eq, and, inArray } from "drizzle-orm";
import { FileText } from "lucide-react";
import { db } from "@/lib/db";
import { files } from "@/lib/db/schema";
import { requirePage } from "@/lib/auth/session";
import { AdminHeader, Card, Empty, inputCls, labelCls } from "@/components/admin/ui";
import { ActionForm, AdminButton } from "@/components/admin/ActionForm";
import { deleteMedia, uploadMedia } from "@/lib/actions/admin/content";
import { formatDate } from "@/lib/labels";
import { CopyButton } from "@/components/admin/CopyButton";

export const metadata = { title: "Mídia" };

export default async function MediaLibrary() {
  await requirePage("media.manage");
  const rows = await db.select().from(files).where(and(eq(files.visibility, "public"), inArray(files.purpose, ["media", "document"]))).orderBy(desc(files.createdAt)).limit(300);
  return (
    <>
      <AdminHeader title="Biblioteca de mídia" description="Imagens e documentos públicos usados no site. Currículos nunca aparecem aqui: ficam em armazenamento privado." />
      <Card title="Enviar arquivo" className="mb-6">
        <ActionForm action={uploadMedia} className="grid gap-3 md:grid-cols-[1fr_1fr_auto] md:items-end">
          <>
            <>
              <div>
                <label htmlFor="file" className={labelCls}>
                  Arquivo (JPG, PNG, WEBP, AVIF ou PDF · até 15 MB)
                </label>
                <input id="file" name="file" type="file" required accept="image/jpeg,image/png,image/webp,image/avif,application/pdf" className={inputCls} />
              </div>
              <div>
                <label htmlFor="alt" className={labelCls}>
                  Texto alternativo (imagens)
                </label>
                <input id="alt" name="alt" className={inputCls} placeholder="Descreva o conteúdo da imagem" />
              </div>
              <AdminButton>Enviar</AdminButton>
            </>
          </>
        </ActionForm>
      </Card>
      {rows.length ? (
        <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {rows.map((f) => (
            <li key={f.id} className="overflow-hidden rounded-2xl border border-line bg-white">
              {f.mimeType.startsWith("image/") ? (
                <img src={`/media/${f.id}`} alt={f.alt ?? ""} className="aspect-[4/3] w-full object-cover" loading="lazy" />
              ) : (
                <span className="flex aspect-[4/3] items-center justify-center bg-paper">
                  <FileText className="h-10 w-10 text-steel" aria-hidden="true" />
                </span>
              )}
              <div className="space-y-2 p-3 text-xs">
                <p className="truncate font-medium" title={f.originalName}>
                  {f.originalName}
                </p>
                <p className="text-steel">
                  {(f.size / 1024).toFixed(0)} KB · {formatDate(f.createdAt)}
                </p>
                <div className="flex gap-2">
                  <CopyButton text={`/media/${f.id}`} />
                  <ActionForm action={deleteMedia} confirm="Excluir este arquivo? Páginas que o utilizam ficarão sem a imagem." showMessage={false}>
                    <input type="hidden" name="id" value={f.id} />
                    <AdminButton variant="danger" className="h-7 px-2 text-xs">
                      Excluir
                    </AdminButton>
                  </ActionForm>
                </div>
              </div>
            </li>
          ))}
        </ul>
      ) : (
        <Empty title="Nenhum arquivo enviado." />
      )}
    </>
  );
}
