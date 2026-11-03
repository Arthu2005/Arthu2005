import { notFound } from "next/navigation";
import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { contactMessages } from "@/lib/db/schema";
import { requirePage } from "@/lib/auth/session";
import { AdminHeader, Card, inputCls, labelCls } from "@/components/admin/ui";
import { ActionForm, AdminButton } from "@/components/admin/ActionForm";
import { deleteMessage, updateMessage } from "@/lib/actions/admin/inbox";
import { CONTACT_TOPICS } from "@/lib/validation/forms";
import { INBOX_STATUS_LABELS, formatDateTime } from "@/lib/labels";

export const metadata = { title: "Mensagem" };

export default async function MessageDetail({ params }: { params: Promise<{ id: string }> }) {
  await requirePage("contact.manage");
  const { id } = await params;
  if (!/^[0-9a-f-]{36}$/i.test(id)) notFound();
  const [m] = await db.select().from(contactMessages).where(eq(contactMessages.id, id)).limit(1);
  if (!m) notFound();
  const topic = CONTACT_TOPICS.find((t) => t.value === m.topic)?.label ?? m.topic;
  return (
    <>
      <AdminHeader title={topic} back={{ href: "/admin/mensagens", label: "Mensagens" }} description={`${m.protocol} · ${formatDateTime(m.createdAt)}`} />
      <div className="grid gap-6 xl:grid-cols-[1fr_22rem]">
        <Card title={`De: ${m.name}`}>
          <p className="text-sm text-steel">
            <a href={`mailto:${m.email}?subject=${encodeURIComponent(`Re: ${topic} (${m.protocol})`)}`} className="underline">
              {m.email}
            </a>
            {m.phone ? ` · ${m.phone}` : ""}
            {m.company ? ` · ${m.company}` : ""}
          </p>
          <p className="mt-5 whitespace-pre-line leading-relaxed">{m.message}</p>
        </Card>
        <div className="space-y-6">
          <Card title="Atendimento">
            <ActionForm action={updateMessage}>
              <>
                <div className="space-y-3">
                  <input type="hidden" name="id" value={m.id} />
                  <div>
                    <label htmlFor="status" className={labelCls}>
                      Status
                    </label>
                    <select id="status" name="status" defaultValue={m.status} className={inputCls}>
                      {Object.entries(INBOX_STATUS_LABELS).map(([k, v]) => (
                        <option key={k} value={k}>
                          {v}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label htmlFor="notes" className={labelCls}>
                      Observações internas
                    </label>
                    <textarea id="notes" name="internalNotes" rows={4} defaultValue={m.internalNotes ?? ""} className={inputCls} />
                  </div>
                  <AdminButton>Salvar</AdminButton>
                </div>
              </>
            </ActionForm>
          </Card>
          <ActionForm action={deleteMessage} confirm="Excluir definitivamente esta mensagem?">
            <>
              <>
                <input type="hidden" name="id" value={m.id} />
                <AdminButton variant="danger" className="w-full">
                  Excluir mensagem
                </AdminButton>
              </>
            </>
          </ActionForm>
        </div>
      </div>
    </>
  );
}
