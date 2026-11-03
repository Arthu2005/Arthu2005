import type { Metadata } from "next";
import { Mail, MapPin, Phone, MessageCircle } from "lucide-react";
import { PageHero } from "@/components/site/PageHero";
import { ContactForm } from "@/components/forms/ContactForm";
import { Faq } from "@/components/site/Faq";
import { getAllSettings, getItems, getPage, rep, s } from "@/lib/content/queries";
import { CONTACT_TOPICS } from "@/lib/validation/forms";
import { issueFormToken } from "@/lib/spam";
import { pageMetadata } from "@/lib/seo/metadata";

export const generateMetadata = (): Promise<Metadata> =>
  pageMetadata("contato", { title: "Contato", description: "Fale com a PETROLUB: solicitação de coleta de óleo usado, informações comerciais, documentação e carreiras.", path: "/contato" });

type Props = { searchParams: Promise<{ assunto?: string; ref?: string }> };

export default async function ContatoPage({ searchParams }: Props) {
  const sp = await searchParams;
  const [p, { contact, social }, faqs] = await Promise.all([getPage("contato"), getAllSettings(), getItems("faqs")]);
  const topic = CONTACT_TOPICS.some((t) => t.value === sp.assunto) ? sp.assunto : undefined;
  const ref = sp.ref?.replace(/[^a-z0-9-]/g, "").slice(0, 80);
  const tel = (v: string) => `tel:${v.replace(/[^\d+]/g, "")}`;
  const whatsapp = s(contact, "whatsapp").replace(/\D/g, "");
  const map = s(contact, "mapEmbedUrl");
  const safeMap = /^https:\/\/(www\.)?(google\.com\/maps\/embed|maps\.google\.com|www\.openstreetmap\.org\/export\/embed)/.test(map) ? map : "";

  const channels = [
    s(contact, "phoneTollFree") && { icon: Phone, label: "Coleta (0800)", value: s(contact, "phoneTollFree"), href: tel(s(contact, "phoneTollFree")) },
    s(contact, "phone") && { icon: Phone, label: "Telefone", value: s(contact, "phone"), href: tel(s(contact, "phone")) },
    s(contact, "email") && { icon: Mail, label: "E-mail", value: s(contact, "email"), href: `mailto:${s(contact, "email")}` },
    whatsapp && { icon: MessageCircle, label: "WhatsApp", value: `+${whatsapp}`, href: `https://wa.me/${whatsapp}` },
  ].filter(Boolean) as { icon: typeof Phone; label: string; value: string; href: string }[];

  return (
    <>
      <PageHero eyebrow={s(p.hero, "eyebrow")} title={s(p.hero, "title")} subtitle={s(p.hero, "subtitle")} />
      <section className="container-x grid gap-14 py-16 md:py-24 lg:grid-cols-12">
        <div className="space-y-10 lg:col-span-5">
          <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-1">
            {channels.map((c) => (
              <li key={c.label}>
                <a href={c.href} className="group flex items-center gap-4 rounded-2xl border border-line bg-white p-5 transition-colors hover:border-ink/30" {...(c.href.startsWith("http") ? { target: "_blank", rel: "noopener noreferrer" } : {})}>
                  <span className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-accent-deep text-white transition-colors group-hover:bg-accent">
                    <c.icon className="h-5 w-5" aria-hidden="true" />
                  </span>
                  <span>
                    <span className="block text-xs uppercase tracking-[0.14em] text-steel">{c.label}</span>
                    <span className="block font-medium">{c.value}</span>
                  </span>
                </a>
              </li>
            ))}
          </ul>
          {s(contact, "address") && (
            <div className="flex gap-4">
              <MapPin className="mt-1 h-5 w-5 shrink-0 text-accent" aria-hidden="true" />
              <address className="whitespace-pre-line not-italic text-ink-2">{s(contact, "address")}</address>
            </div>
          )}
          {s(contact, "hours") && <p className="text-sm text-steel">Atendimento: {s(contact, "hours")}</p>}
          {rep(contact, "regional").length > 0 && (
            <div>
              <h2 className="text-sm font-semibold uppercase tracking-[0.16em] text-steel">Contatos comerciais regionais</h2>
              <dl className="mt-4 divide-y divide-line border-y border-line">
                {rep(contact, "regional").map((r, i) => (
                  <div key={i} className="flex flex-wrap items-center justify-between gap-2 py-3 text-sm">
                    <dt className="font-medium">{s(r, "region")}</dt>
                    <dd className="text-steel">
                      {s(r, "email") && (
                        <a href={`mailto:${s(r, "email")}`} className="hover:text-ink hover:underline">
                          {s(r, "email")}
                        </a>
                      )}
                      {s(r, "phone") && <span className="ml-3">{s(r, "phone")}</span>}
                    </dd>
                  </div>
                ))}
              </dl>
            </div>
          )}
          <div className="flex flex-wrap gap-3 text-sm">
            {s(social, "instagram") && (
              <a href={s(social, "instagram")} target="_blank" rel="noopener noreferrer" className="rounded-full border border-line bg-white px-4 py-2 font-medium hover:border-ink/30">
                Instagram ↗<span className="sr-only"> (abre em nova aba)</span>
              </a>
            )}
            {s(social, "linkedin") && (
              <a href={s(social, "linkedin")} target="_blank" rel="noopener noreferrer" className="rounded-full border border-line bg-white px-4 py-2 font-medium hover:border-ink/30">
                LinkedIn ↗<span className="sr-only"> (abre em nova aba)</span>
              </a>
            )}
          </div>
        </div>
        <div className="rounded-[var(--radius-card)] border border-line bg-white p-6 md:p-10 lg:col-span-7">
          <h2 className="mb-8 text-h3 font-semibold">Envie uma mensagem</h2>
          <ContactForm
            token={issueFormToken()}
            defaultTopic={topic}
            defaultMessage={ref ? `Gostaria de mais informações sobre: ${ref.replace(/-/g, " ")}.` : undefined}
            turnstileSiteKey={process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY || undefined}
          />
        </div>
      </section>
      {safeMap && (
        <section className="container-x pb-20">
          <iframe src={safeMap} title="Mapa de localização da PETROLUB" className="h-[420px] w-full rounded-[var(--radius-card)] border border-line grayscale" loading="lazy" referrerPolicy="no-referrer-when-downgrade" />
        </section>
      )}
      <Faq items={faqs.filter((f) => s(f.data, "scope") === "contato")} />
    </>
  );
}
