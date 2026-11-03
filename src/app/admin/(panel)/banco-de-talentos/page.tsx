import Link from "next/link";
import { and, desc, eq, ilike, or, sql, type SQL } from "drizzle-orm";
import { db } from "@/lib/db";
import { talentPool } from "@/lib/db/schema";
import { requirePage } from "@/lib/auth/session";
import { AdminHeader, Empty, Table, inputCls, labelCls } from "@/components/admin/ui";
import { Badge } from "@/components/ui/Badge";
import { getSettings, list } from "@/lib/content/queries";
import { TALENT_STATUS_LABELS, formatDate } from "@/lib/labels";

export const metadata = { title: "Banco de talentos" };

export default async function TalentAdmin({ searchParams }: { searchParams: Promise<{ q?: string; area?: string; status?: string; excluido?: string }> }) {
  await requirePage("talent.manage");
  const sp = await searchParams;
  const careers = await getSettings("careers");
  const w: SQL[] = [];
  if (sp.q) {
    const t = `%${sp.q.slice(0, 80).replace(/[\\%_]/g, (m) => `\\${m}`)}%`;
    w.push(or(ilike(talentPool.fullName, t), ilike(talentPool.email, t), ilike(talentPool.city, t), ilike(talentPool.experience, t))!);
  }
  if (sp.area) w.push(sql`${talentPool.areas} @> ${JSON.stringify([sp.area.slice(0, 120)])}::jsonb`);
  if (sp.status && sp.status in TALENT_STATUS_LABELS) w.push(eq(talentPool.status, sp.status as "novo"));
  const rows = await db.select().from(talentPool).where(w.length ? and(...w) : undefined).orderBy(desc(talentPool.updatedAt)).limit(500);
  return (
    <>
      <AdminHeader title="Banco de talentos" description="Fluxo independente das candidaturas a vagas. Os cadastros são excluídos automaticamente ao fim do prazo de retenção." />
      {sp.excluido && <p role="status" className="mb-4 text-sm text-ok">Cadastro excluído.</p>}
      <form className="mb-6 grid gap-3 rounded-2xl border border-line bg-white p-4 sm:grid-cols-4" role="search">
        <div className="sm:col-span-2">
          <label className={labelCls} htmlFor="q">
            Buscar
          </label>
          <input id="q" name="q" defaultValue={sp.q} className={inputCls} placeholder="Nome, e-mail, cidade ou experiência" />
        </div>
        <div>
          <label className={labelCls} htmlFor="area">
            Área
          </label>
          <select id="area" name="area" defaultValue={sp.area ?? ""} className={inputCls}>
            <option value="">Todas</option>
            {list(careers, "areas").map((a) => (
              <option key={a}>{a}</option>
            ))}
          </select>
        </div>
        <div>
          <label className={labelCls} htmlFor="status">
            Status
          </label>
          <select id="status" name="status" defaultValue={sp.status ?? ""} className={inputCls}>
            <option value="">Todos</option>
            {Object.entries(TALENT_STATUS_LABELS).map(([k, v]) => (
              <option key={k} value={k}>
                {v}
              </option>
            ))}
          </select>
        </div>
        <div className="sm:col-span-4">
          <button className="h-9 rounded-lg bg-accent px-4 text-sm font-medium text-white">Filtrar</button>
        </div>
      </form>
      {rows.length ? (
        <Table>
          <thead>
            <tr>
              <th>Nome</th>
              <th>Áreas</th>
              <th>Local</th>
              <th>Status</th>
              <th>Atualizado</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.id}>
                <td>
                  <Link href={`/admin/banco-de-talentos/${r.id}`} className="font-medium hover:underline">
                    {r.fullName}
                  </Link>
                  <div className="text-xs text-steel">{r.email}</div>
                </td>
                <td className="max-w-xs text-xs">{r.areas.join(", ")}</td>
                <td className="whitespace-nowrap">
                  {r.city}/{r.state}
                </td>
                <td>
                  <Badge>{TALENT_STATUS_LABELS[r.status]}</Badge>
                </td>
                <td className="whitespace-nowrap text-steel">{formatDate(r.updatedAt)}</td>
              </tr>
            ))}
          </tbody>
        </Table>
      ) : (
        <Empty title="Nenhum cadastro encontrado." />
      )}
    </>
  );
}
