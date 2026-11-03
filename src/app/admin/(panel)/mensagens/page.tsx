import Link from "next/link";
import { desc, eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { contactMessages } from "@/lib/db/schema";
import { requirePage } from "@/lib/auth/session";
import { AdminHeader, Empty, Table } from "@/components/admin/ui";
import { Badge } from "@/components/ui/Badge";
import { CONTACT_TOPICS } from "@/lib/validation/forms";
import { INBOX_STATUS_LABELS, formatDateTime } from "@/lib/labels";
import { cn } from "@/lib/cn";

export const metadata = { title: "Mensagens" };

export default async function MessagesAdmin({ searchParams }: { searchParams: Promise<{ status?: string; excluida?: string }> }) {
  await requirePage("contact.manage");
  const sp = await searchParams;
  const status = sp.status && sp.status in INBOX_STATUS_LABELS ? (sp.status as keyof typeof INBOX_STATUS_LABELS) : undefined;
  const rows = await db.select().from(contactMessages).where(status ? eq(contactMessages.status, status) : undefined).orderBy(desc(contactMessages.createdAt)).limit(500);
  return (
    <>
      <AdminHeader title="Mensagens de contato" description="Solicitações enviadas pelo formulário do site." />
      {sp.excluida && <p role="status" className="mb-4 text-sm text-ok">Mensagem excluída.</p>}
      <nav className="mb-5 flex flex-wrap gap-1.5" aria-label="Filtrar por status">
        {[["", "Todas"], ...Object.entries(INBOX_STATUS_LABELS)].map(([k, v]) => (
          <Link key={k} href={k ? `/admin/mensagens?status=${k}` : "/admin/mensagens"} aria-current={(status ?? "") === k ? "page" : undefined} className={cn("rounded-full px-3 py-1.5 text-sm", (status ?? "") === k ? "bg-accent-deep text-white" : "bg-white ring-1 ring-line")}>
            {v}
          </Link>
        ))}
      </nav>
      {rows.length ? (
        <Table>
          <thead>
            <tr>
              <th>Remetente</th>
              <th>Assunto</th>
              <th>Status</th>
              <th>Recebida</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((m) => (
              <tr key={m.id}>
                <td>
                  <Link href={`/admin/mensagens/${m.id}`} className="font-medium hover:underline">
                    {m.name}
                  </Link>
                  <div className="text-xs text-steel">
                    {m.email}
                    {m.company ? ` · ${m.company}` : ""}
                  </div>
                </td>
                <td>{CONTACT_TOPICS.find((t) => t.value === m.topic)?.label ?? m.topic}</td>
                <td>
                  <Badge tone={m.status === "novo" ? "accent" : "neutral"}>{INBOX_STATUS_LABELS[m.status]}</Badge>
                </td>
                <td className="whitespace-nowrap text-steel">{formatDateTime(m.createdAt)}</td>
              </tr>
            ))}
          </tbody>
        </Table>
      ) : (
        <Empty title="Nenhuma mensagem." />
      )}
    </>
  );
}
