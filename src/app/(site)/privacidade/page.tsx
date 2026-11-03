import type { Metadata } from "next";
import { PageHero } from "@/components/site/PageHero";
import { Markdown } from "@/components/Markdown";
import { Provisional } from "@/components/site/Provisional";
import { bool, getAllSettings, getPage, s } from "@/lib/content/queries";
import { formatDate } from "@/lib/labels";

export const metadata: Metadata = { title: "Política de privacidade", alternates: { canonical: "/privacidade" } };

export default async function PrivacidadePage() {
  const [p, { privacy, general }] = await Promise.all([getPage("legal"), getAllSettings()]);
  const sec = p.privacy;
  return (
    <>
      <PageHero eyebrow="LGPD" title={s(sec, "title") || "Política de privacidade"} subtitle={s(sec, "updatedAt") ? `Última atualização: ${formatDate(s(sec, "updatedAt"))} · versão ${s(privacy, "consentVersion")}` : undefined} />
      <section className="container-x py-16 md:py-24">
        <div className="mx-auto max-w-3xl">
          <Provisional show={bool(general, "showProvisionalMarkers") && bool(sec, "provisional")} label="Minuta em revisão jurídica" className="mb-8" />
          <Markdown source={s(sec, "body")} />
          <div className="mt-12 rounded-2xl border border-line bg-white p-6">
            <h2 className="text-lg font-semibold">Encarregado pelo tratamento de dados (DPO)</h2>
            <p className="mt-2 text-steel">
              {s(privacy, "dpoName") || "Nome a ser informado pela PETROLUB"}
              {s(privacy, "dpoEmail") ? (
                <>
                  {" · "}
                  <a href={`mailto:${s(privacy, "dpoEmail")}`} className="font-medium text-ink underline decoration-accent underline-offset-4">
                    {s(privacy, "dpoEmail")}
                  </a>
                </>
              ) : (
                " · e-mail a ser informado"
              )}
            </p>
          </div>
        </div>
      </section>
    </>
  );
}
