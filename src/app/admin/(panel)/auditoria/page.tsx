import Link from "next/link";
import { count, desc, ilike } from "drizzle-orm";
import { db } from "@/lib/db";
import { auditLogs } from "@/lib/db/schema";
import { requirePage } from "@/lib/auth/session";
import { AdminHeader, Table, inputCls } from "@/components/admin/ui";
import { formatDateTime } from "@/lib/labels";

export const metadata = { title: "Auditoria" };
const PAGE = 100;

export default async function AuditPage({ searchParams }: { searchParams: Promise<{ p?: string; acao?: string }> }) {
  await requirePage("audit.view");
  const sp = await searchParams;
  const page = Math.max(1, Number(sp.p) || 1);
  const where = sp.acao ? ilike(auditLogs.action, `%${sp.acao.slice(0, 60).replace(/[\\%_]/g, (m) => `\\${m}`)}%`) : undefined;
  const [rows, [total]] = await Promise.all([
    db.select().from(auditLogs).where(where).orderBy(desc(auditLogs.createdAt)).limit(PAGE).offset((page - 1) * PAGE),
    db.select({ n: count() }).from(auditLogs).where(where),
  ]);
  const pages = Math.max(1, Math.ceil((total?.n ?? 0) / PAGE));
  return (
    <>
      <AdminHeader title="Registro de auditoria" description="Ações administrativas relevantes: logins, alterações de conteúdo e vagas, acesso a candidaturas, downloads e exportações." />
      <form className="mb-4 flex gap-2" role="search">
        <input name="acao" defaultValue={sp.acao} placeholder="Filtrar por ação (ex.: file.downloaded, job.)" className={`${inputCls} max-w-sm`} aria-label="Filtrar por ação" />
        <button className="h-9 rounded-lg bg-accent px-4 text-sm text-white">Filtrar</button>
      </form>
      <Table>
        <thead>
          <tr>
            <th>Quando</th>
            <th>Usuário</th>
            <th>Ação</th>
            <th>Registro</th>
            <th>Detalhes</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => (
            <tr key={r.id}>
              <td className="whitespace-nowrap text-steel">{formatDateTime(r.createdAt)}</td>
              <td>{r.userEmail ?? "—"}</td>
              <td className="font-mono text-xs">{r.action}</td>
              <td className="font-mono text-xs">{r.entityType ? `${r.entityType}:${r.entityId ?? ""}` : "—"}</td>
              <td className="max-w-xs truncate font-mono text-xs text-steel">{r.details ? JSON.stringify(r.details) : ""}</td>
            </tr>
          ))}
        </tbody>
      </Table>
      <nav className="mt-4 flex gap-2 text-sm" aria-label="Paginação">
        {page > 1 && <Link href={`?p=${page - 1}${sp.acao ? `&acao=${encodeURIComponent(sp.acao)}` : ""}`} className="rounded-lg border border-line bg-white px-3 py-1.5">← Anterior</Link>}
        <span className="px-2 py-1.5 text-steel">
          Página {page} de {pages}
        </span>
        {page < pages && <Link href={`?p=${page + 1}${sp.acao ? `&acao=${encodeURIComponent(sp.acao)}` : ""}`} className="rounded-lg border border-line bg-white px-3 py-1.5">Próxima →</Link>}
      </nav>
    </>
  );
}
