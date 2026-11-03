import { asc } from "drizzle-orm";
import { db } from "@/lib/db";
import { users } from "@/lib/db/schema";
import { requirePage } from "@/lib/auth/session";
import { ROLE_LABELS, PERMISSIONS } from "@/lib/auth/rbac";
import { AdminHeader, Card, Table, inputCls, labelCls } from "@/components/admin/ui";
import { ActionForm, AdminButton } from "@/components/admin/ActionForm";
import { createUser, resetUserPassword, updateUser } from "@/lib/actions/admin/users";
import { formatDateTime } from "@/lib/labels";

export const metadata = { title: "Usuários" };

const PERMISSION_LABELS: Record<string, string> = {
  "jobs.manage": "Vagas",
  "applications.view": "Ver candidaturas",
  "applications.manage": "Gerir candidaturas",
  "applications.export": "Exportar",
  "resumes.download": "Baixar currículos",
  "applications.delete": "Excluir candidaturas",
  "talent.manage": "Banco de talentos",
  "pipeline.configure": "Etapas",
  "contact.manage": "Mensagens",
  "content.manage": "Conteúdo",
  "media.manage": "Mídia",
  "settings.manage": "Configurações",
  "users.manage": "Usuários",
  "audit.view": "Auditoria",
};

export default async function UsersPage() {
  const me = await requirePage("users.manage");
  const rows = await db.select().from(users).orderBy(asc(users.name));
  return (
    <>
      <AdminHeader title="Usuários e permissões" description="Permissões aplicadas no servidor em todas as páginas, ações e downloads." />
      <Card title="Novo usuário" className="mb-6">
        <ActionForm action={createUser} className="grid gap-3 md:grid-cols-[1fr_1fr_12rem_auto] md:items-end">
          <>
            <>
              <div>
                <label htmlFor="u-name" className={labelCls}>
                  Nome
                </label>
                <input id="u-name" name="name" required className={inputCls} />
              </div>
              <div>
                <label htmlFor="u-email" className={labelCls}>
                  E-mail
                </label>
                <input id="u-email" name="email" type="email" required className={inputCls} />
              </div>
              <div>
                <label htmlFor="u-role" className={labelCls}>
                  Perfil
                </label>
                <select id="u-role" name="role" defaultValue="editor" className={inputCls}>
                  {Object.entries(ROLE_LABELS).map(([k, v]) => (
                    <option key={k} value={k}>
                      {v}
                    </option>
                  ))}
                </select>
              </div>
              <AdminButton>Criar</AdminButton>
            </>
          </>
        </ActionForm>
      </Card>
      <Table>
        <thead>
          <tr>
            <th>Usuário</th>
            <th>Perfil e status</th>
            <th>Último acesso</th>
            <th>Senha</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((u) => (
            <tr key={u.id}>
              <td>
                <p className="font-medium">
                  {u.name} {u.id === me.id && <span className="text-xs text-steel">(você)</span>}
                </p>
                <p className="text-xs text-steel">{u.email}</p>
              </td>
              <td>
                <ActionForm action={updateUser} className="flex flex-wrap items-center gap-2">
                  <>
                    <>
                      <input type="hidden" name="id" value={u.id} />
                      <select name="role" defaultValue={u.role} className={`${inputCls} w-44`} aria-label={`Perfil de ${u.name}`}>
                        {Object.entries(ROLE_LABELS).map(([k, v]) => (
                          <option key={k} value={k}>
                            {v}
                          </option>
                        ))}
                      </select>
                      <label className="flex items-center gap-1.5 text-xs">
                        <input type="checkbox" name="active" defaultChecked={u.active} /> Ativo
                      </label>
                      <AdminButton variant="secondary">
                        Salvar
                      </AdminButton>
                    </>
                  </>
                </ActionForm>
              </td>
              <td className="whitespace-nowrap text-steel">{u.lastLoginAt ? formatDateTime(u.lastLoginAt) : "—"}</td>
              <td>
                <ActionForm action={resetUserPassword} confirm={`Gerar nova senha temporária para ${u.name}? As sessões ativas serão encerradas.`}>
                  <>
                    <>
                      <input type="hidden" name="id" value={u.id} />
                      <AdminButton variant="ghost">
                        Redefinir
                      </AdminButton>
                    </>
                  </>
                </ActionForm>
              </td>
            </tr>
          ))}
        </tbody>
      </Table>
      <Card title="Matriz de permissões" className="mt-8">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[520px] text-sm">
            <thead>
              <tr className="text-left text-xs uppercase tracking-wider text-steel">
                <th className="py-2">Permissão</th>
                {Object.values(ROLE_LABELS).map((r) => (
                  <th key={r} className="py-2">
                    {r}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {Object.entries(PERMISSIONS)
                .filter(([k]) => PERMISSION_LABELS[k])
                .map(([k, roles]) => (
                  <tr key={k} className="border-t border-line">
                    <td className="py-2">{PERMISSION_LABELS[k]}</td>
                    {(["admin", "recruiter", "editor"] as const).map((r) => (
                      <td key={r} className="py-2">
                        {(roles as readonly string[]).includes(r) ? "✓" : "—"}
                      </td>
                    ))}
                  </tr>
                ))}
            </tbody>
          </table>
        </div>
      </Card>
    </>
  );
}
