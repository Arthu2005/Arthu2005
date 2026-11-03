import { redirect } from "next/navigation";
import { headers } from "next/headers";
import { requirePage } from "@/lib/auth/session";
import { can, ROLE_LABELS, type Permission } from "@/lib/auth/rbac";
import { AdminSidebar, type NavItem } from "@/components/admin/AdminSidebar";

const NAV: (NavItem & { permission: Permission })[] = [
  { href: "/admin", label: "Visão geral", icon: "LayoutDashboard", group: "Geral", permission: "dashboard.view" },
  { href: "/admin/vagas", label: "Vagas", icon: "Briefcase", group: "Recrutamento", permission: "jobs.manage" },
  { href: "/admin/candidaturas", label: "Candidaturas", icon: "FolderKanban", group: "Recrutamento", permission: "applications.view" },
  { href: "/admin/banco-de-talentos", label: "Banco de talentos", icon: "UserSquare2", group: "Recrutamento", permission: "talent.manage" },
  { href: "/admin/etapas", label: "Etapas do processo", icon: "ListChecks", group: "Recrutamento", permission: "pipeline.configure" },
  { href: "/admin/mensagens", label: "Mensagens", icon: "Inbox", group: "Atendimento", permission: "contact.manage" },
  { href: "/admin/conteudo", label: "Páginas", icon: "FileText", group: "Conteúdo", permission: "content.manage" },
  { href: "/admin/colecoes", label: "Coleções", icon: "Layers", group: "Conteúdo", permission: "content.manage" },
  { href: "/admin/midia", label: "Mídia", icon: "ImageIcon", group: "Conteúdo", permission: "media.manage" },
  { href: "/admin/configuracoes", label: "Configurações", icon: "Settings", group: "Sistema", permission: "settings.manage" },
  { href: "/admin/usuarios", label: "Usuários", icon: "Users", group: "Sistema", permission: "users.manage" },
  { href: "/admin/auditoria", label: "Auditoria", icon: "Shield", group: "Sistema", permission: "audit.view" },
];

export default async function PanelLayout({ children }: { children: React.ReactNode }) {
  const user = await requirePage("dashboard.view");
  const path = (await headers()).get("x-pathname") ?? "";
  if (user.mustChangePassword && !path.startsWith("/admin/conta")) redirect("/admin/conta?trocar=1");
  const items = NAV.filter((n) => can(user.role, n.permission)).map(({ permission: _p, ...n }) => n);
  return (
    <div className="min-h-[100svh]">
      <AdminSidebar items={items} user={{ name: user.name, roleLabel: ROLE_LABELS[user.role] }} />
      <div className="lg:pl-64">
        <main id="conteudo" className="mx-auto max-w-[88rem] px-4 py-6 sm:px-6 md:py-10 lg:px-10">
          {children}
        </main>
      </div>
    </div>
  );
}
