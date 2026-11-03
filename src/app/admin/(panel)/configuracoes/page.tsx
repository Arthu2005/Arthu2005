import { count, eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { applications, jobs } from "@/lib/db/schema";
import { requirePage } from "@/lib/auth/session";
import { AdminHeader, Card } from "@/components/admin/ui";
import { ContentEditor } from "@/components/admin/ContentEditor";
import { ActionForm, AdminButton } from "@/components/admin/ActionForm";
import { SETTINGS } from "@/lib/content/settings";
import { getSettings } from "@/lib/content/queries";
import { purgeDemoData, runRetentionNow, saveSettings } from "@/lib/actions/admin/content";
import { emailConfigured } from "@/lib/email";
import { env } from "@/lib/env";

export const metadata = { title: "Configurações" };

export default async function SettingsPage() {
  await requirePage("settings.manage");
  const values = await Promise.all(SETTINGS.map((s) => getSettings(s.key)));
  const [[demoJobs], [demoApps]] = await Promise.all([
    db.select({ n: count() }).from(jobs).where(eq(jobs.isDemo, true)),
    db.select({ n: count() }).from(applications).where(eq(applications.isDemo, true)),
  ]);
  return (
    <>
      <AdminHeader title="Configurações" description="Identidade, contatos, redes, SEO, LGPD e recrutamento." />
      <div className="mb-6 grid gap-4 md:grid-cols-3">
        <Card title="E-mail transacional">
          <p className="text-sm">{emailConfigured() ? "✅ SMTP configurado." : "⚠️ SMTP não configurado: confirmações por e-mail não serão enviadas (os envios continuam sendo registrados)."}</p>
        </Card>
        <Card title="Armazenamento">
          <p className="text-sm">
            Driver: <strong>{env.STORAGE_DRIVER}</strong>. Currículos ficam em área privada, acessível apenas pelo painel.
          </p>
        </Card>
        <Card title="Antispam">
          <p className="text-sm">Honeypot + tempo mínimo + limite por IP ativos. Turnstile: {env.TURNSTILE_SECRET_KEY ? "ativo" : "não configurado (opcional)"}.</p>
        </Card>
      </div>
      <div className="space-y-4">
        {SETTINGS.map((s, i) => (
          <details key={s.key} open={i === 0} className="group rounded-2xl border border-line bg-white">
            <summary className="flex cursor-pointer list-none items-center justify-between px-5 py-4 font-semibold [&::-webkit-details-marker]:hidden">
              <span>
                {s.label}
                {s.description && <span className="block text-xs font-normal text-steel">{s.description}</span>}
              </span>
              <span className="text-steel group-open:rotate-180" aria-hidden="true">
                ▾
              </span>
            </summary>
            <div className="border-t border-line p-5">
              <ContentEditor action={saveSettings} fields={s.fields} initial={values[i]!} hidden={{ key: s.key }} idPrefix={`set-${s.key}`} />
            </div>
          </details>
        ))}
      </div>
      <div className="mt-8 grid gap-4 md:grid-cols-2">
        <Card title="Retenção de dados (LGPD)">
          <p className="mb-4 text-sm text-steel">Remove definitivamente candidaturas, cadastros e mensagens cujo prazo de retenção expirou, incluindo os currículos. Agende também o comando <code>npm run retention:run</code> diariamente no servidor.</p>
          <ActionForm action={runRetentionNow} confirm="Executar a exclusão de dados vencidos agora?">
            <AdminButton>Executar retenção agora</AdminButton>
          </ActionForm>
        </Card>
        <Card title="Dados de demonstração">
          <p className="mb-4 text-sm text-steel">
            Existem <strong>{demoJobs?.n ?? 0}</strong> vaga(s) e <strong>{demoApps?.n ?? 0}</strong> candidatura(s) de demonstração (identificadas com o selo “demo”). Remova-as antes do lançamento.
          </p>
          <ActionForm action={purgeDemoData} confirm="Remover todos os dados de demonstração?">
            <>
              <AdminButton variant="danger" disabled={!demoJobs?.n && !demoApps?.n}>
                Remover dados de demonstração
              </AdminButton>
            </>
          </ActionForm>
        </Card>
      </div>
    </>
  );
}
