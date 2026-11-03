import type { Metadata } from "next";
import { PageHero } from "@/components/site/PageHero";
import { TalentPoolForm } from "@/components/careers/TalentPoolForm";
import { getSettings, list } from "@/lib/content/queries";
import { issueFormToken } from "@/lib/spam";
import { uploadMaxBytes } from "@/lib/env";

export const metadata: Metadata = {
  title: "Banco de talentos",
  description: "Cadastre seu currículo no banco de talentos da PETROLUB e seja considerado para oportunidades futuras.",
  alternates: { canonical: "/carreiras/banco-de-talentos" },
};

export default async function TalentPage() {
  const [careers, privacy] = await Promise.all([getSettings("careers"), getSettings("privacy")]);
  return (
    <>
      <PageHero eyebrow="Trabalhe conosco" title="Banco de talentos" subtitle="Não encontrou a vaga ideal agora? Deixe seu currículo e indique as áreas em que gostaria de atuar." />
      <section className="container-x grid gap-14 py-16 md:py-24 lg:grid-cols-12">
        <div className="space-y-8 lg:col-span-4">
          <div>
            <h2 className="text-h3 font-semibold">Como funciona</h2>
            <ol className="mt-6 space-y-5">
              {[
                "Você informa seus dados, áreas de interesse e anexa o currículo.",
                "Quando surgir uma oportunidade compatível, a equipe de recrutamento poderá entrar em contato.",
                `Seus dados ficam guardados por até ${Number(privacy.talentRetentionMonths) || 24} meses. Um novo envio com o mesmo e-mail atualiza o cadastro.`,
              ].map((t, i) => (
                <li key={i} className="flex gap-4">
                  <span className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-accent-deep font-mono text-sm text-white">{i + 1}</span>
                  <p className="text-steel">{t}</p>
                </li>
              ))}
            </ol>
          </div>
          <p className="rounded-2xl bg-paper-2 p-5 text-sm text-steel">
            O banco de talentos é independente das candidaturas a vagas. Para participar de um processo específico, candidate-se diretamente na página da vaga.
          </p>
        </div>
        <div className="rounded-[var(--radius-card)] border border-line bg-white p-6 md:p-10 lg:col-span-7 lg:col-start-6">
          <TalentPoolForm areas={list(careers, "areas")} token={issueFormToken()} maxMb={Math.round(uploadMaxBytes / 1024 / 1024)} retentionMonths={Number(privacy.talentRetentionMonths) || 24} turnstileSiteKey={process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY || undefined} />
        </div>
      </section>
    </>
  );
}
