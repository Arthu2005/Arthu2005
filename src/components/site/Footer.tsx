import Link from "next/link";
import { s, rep, type Bag } from "@/lib/content/queries";
import { Logo } from "./Logo";
import { NAV } from "./nav";
import { CookiePreferencesButton } from "./CookieConsent";
import type { ImageValue } from "@/lib/content/fields";

function Social({ href, label }: { href: string; label: string }) {
  if (!href) return null;
  return (
    <li>
      <a href={href} target="_blank" rel="noopener noreferrer" className="group inline-flex items-center gap-2 text-white/70 transition-colors hover:text-white">
        {label}
        <span aria-hidden="true" className="transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5">↗</span>
        <span className="sr-only"> (abre em nova aba)</span>
      </a>
    </li>
  );
}

export function Footer({ general, contact, social, footer }: { general: Bag; contact: Bag; social: Bag; footer: Bag }) {
  const year = new Date().getFullYear();
  const tel = (v: string) => `tel:${v.replace(/[^\d+]/g, "")}`;
  return (
    <footer className="on-dark relative overflow-hidden bg-forest text-white">
      <div className="container-x pt-20 pb-10 md:pt-28">
        <div className="grid gap-12 md:grid-cols-12">
          <div className="md:col-span-5">
            <Logo logo={general.logo as ImageValue} inverted />
            <p className="mt-6 max-w-sm text-lg leading-relaxed text-white/60">{s(footer, "tagline")}</p>
          </div>
          <nav className="md:col-span-2" aria-label="Rodapé">
            <p className="mb-4 text-xs uppercase tracking-[0.18em] text-white/40">Site</p>
            <ul className="space-y-2.5">
              {NAV.map((n) => (
                <li key={n.href}>
                  <Link href={n.href} className="text-white/70 transition-colors hover:text-white">
                    {n.label}
                  </Link>
                </li>
              ))}
              <li>
                <Link href="/carreiras/vagas" className="text-white/70 transition-colors hover:text-white">
                  Vagas abertas
                </Link>
              </li>
            </ul>
          </nav>
          <div className="md:col-span-3">
            <p className="mb-4 text-xs uppercase tracking-[0.18em] text-white/40">Contato</p>
            <address className="space-y-2.5 not-italic text-white/70">
              {s(contact, "phoneTollFree") && (
                <p>
                  <a href={tel(s(contact, "phoneTollFree"))} className="hover:text-white">
                    {s(contact, "phoneTollFree")}
                  </a>{" "}
                  <span className="text-white/40">· coleta</span>
                </p>
              )}
              {s(contact, "phone") && (
                <p>
                  <a href={tel(s(contact, "phone"))} className="hover:text-white">
                    {s(contact, "phone")}
                  </a>
                </p>
              )}
              {s(contact, "email") && (
                <p>
                  <a href={`mailto:${s(contact, "email")}`} className="hover:text-white">
                    {s(contact, "email")}
                  </a>
                </p>
              )}
              {s(contact, "address") && <p className="whitespace-pre-line text-sm text-white/50">{s(contact, "address")}</p>}
            </address>
          </div>
          <div className="md:col-span-2">
            <p className="mb-4 text-xs uppercase tracking-[0.18em] text-white/40">Canais</p>
            <ul className="space-y-2.5">
              <Social href={s(social, "instagram")} label="Instagram" />
              <Social href={s(social, "linkedin")} label="LinkedIn" />
              <Social href={s(social, "facebook")} label="Facebook" />
              <Social href={s(social, "youtube")} label="YouTube" />
              <Social href={s(social, "solides")} label="Portal Sólides" />
            </ul>
          </div>
        </div>

        <p className="pointer-events-none mt-20 select-none font-display text-[19vw] font-extrabold leading-[0.8] tracking-[-0.06em] text-white/[0.04] md:text-[16vw]" aria-hidden="true">
          PETROLUB
        </p>

        <div className="mt-6 flex flex-col gap-4 border-t border-white/10 pt-6 text-sm text-white/45 md:flex-row md:items-center md:justify-between">
          <p>
            © {year} {s(general, "legalName") || "PETROLUB"}
            {s(general, "cnpj") ? ` · CNPJ ${s(general, "cnpj")}` : ""}
            {s(footer, "legal") ? ` · ${s(footer, "legal")}` : ""}
          </p>
          <ul className="flex flex-wrap gap-x-5 gap-y-2">
            <li>
              <Link href="/privacidade" className="hover:text-white">
                Política de privacidade
              </Link>
            </li>
            <li>
              <CookiePreferencesButton className="hover:text-white" />
            </li>
            <li>
              <Link href="/carreiras/banco-de-talentos" className="hover:text-white">
                Banco de talentos
              </Link>
            </li>
          </ul>
        </div>
        {rep(contact, "regional").length > 0 && <span className="sr-only">Contatos regionais disponíveis na página de contato.</span>}
      </div>
    </footer>
  );
}
