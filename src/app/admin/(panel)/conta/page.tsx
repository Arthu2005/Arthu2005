import { requirePage } from "@/lib/auth/session";
import { ROLE_LABELS } from "@/lib/auth/rbac";
import { AdminHeader, Card } from "@/components/admin/ui";
import { PasswordForm } from "./PasswordForm";

export const metadata = { title: "Minha conta" };

export default async function ContaPage({ searchParams }: { searchParams: Promise<{ trocar?: string }> }) {
  const user = await requirePage();
  const { trocar } = await searchParams;
  return (
    <>
      <AdminHeader title="Minha conta" description={`${user.name} · ${user.email} · ${ROLE_LABELS[user.role]}`} />
      {(trocar || user.mustChangePassword) && (
        <p role="alert" className="mb-6 rounded-xl border border-lime bg-lime/15 p-4 text-sm text-accent-deep">
          Por segurança, defina uma nova senha antes de continuar.
        </p>
      )}
      <Card title="Alterar senha" className="max-w-xl">
        <PasswordForm />
      </Card>
    </>
  );
}
