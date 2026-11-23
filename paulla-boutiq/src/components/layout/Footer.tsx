import { Logo } from "@/components/brand/Logo";
import { IconArrowRight, IconInstagram, IconWhatsApp } from "@/components/ui/Icons";
import { Reveal } from "@/components/ui/Reveal";
import { BRAND, NAV_LINKS } from "@/config/brand";
import { interestLink } from "@/lib/contact";
import { Newsletter } from "./Newsletter";

export function Footer() {
  const contact = interestLink();
  const year = new Date().getFullYear();

  return (
    <footer id="atendimento" aria-labelledby="footer-title" className="border-t border-line bg-canvas pt-20 pb-[max(2rem,env(safe-area-inset-bottom))] md:pt-28">
      <h2 id="footer-title" className="sr-only">
        Atendimento e informações
      </h2>
      <div className="container-editorial">
        <Reveal className="flex flex-col items-center text-center">
          <Logo size="lg" />
          <p className="mt-6 max-w-[40ch] text-ink-soft">{BRAND.tagline}. Peças escolhidas uma a uma, para vestir por muito tempo.</p>
        </Reveal>

        <div className="mt-16 grid gap-12 border-t border-line pt-12 md:mt-24 md:grid-cols-12 md:gap-8">
          <nav aria-label="Rodapé" className="md:col-span-3">
            <p className="eyebrow text-ink-soft">Navegue</p>
            <ul className="mt-4 space-y-1">
              {NAV_LINKS.map((l) => (
                <li key={l.href}>
                  <a href={l.href} className="link-underline inline-flex min-h-11 items-center font-display text-xl">
                    {l.label}
                  </a>
                </li>
              ))}
            </ul>
          </nav>

          <div className="md:col-span-4">
            <p className="eyebrow text-ink-soft">Atendimento</p>
            <p className="mt-4 text-ink-soft">{BRAND.service.hours}.</p>
            <p className="text-ink-soft">{BRAND.service.note}</p>
            <a
              href={contact.href}
              target="_blank"
              rel="noopener noreferrer"
              className="group mt-5 inline-flex min-h-11 items-center gap-3 font-medium"
            >
              {contact.channel === "whatsapp" ? <IconWhatsApp /> : <IconInstagram />}
              <span className="link-underline">{contact.channel === "whatsapp" ? "Falar pelo WhatsApp" : "Falar pelo Direct"}</span>
              <IconArrowRight size={16} className="transition-transform duration-300 group-hover:translate-x-1" />
              <span className="sr-only">(abre em nova aba)</span>
            </a>
          </div>

          <div className="md:col-span-5">
            <Newsletter />
          </div>
        </div>

        {/* Destaque do Instagram */}
        <a
          href={BRAND.instagram.url}
          target="_blank"
          rel="noopener noreferrer"
          className="group mt-14 flex items-center justify-between gap-4 border-y border-line py-6 transition-colors duration-300 hover:text-accent md:mt-20 md:py-8"
        >
          <span className="flex items-center gap-4">
            <IconInstagram size={28} />
            <span className="font-display text-[clamp(1.6rem,1rem+3vw,3.5rem)] leading-none italic">{BRAND.instagram.handle}</span>
          </span>
          <span className="grid size-12 shrink-0 place-items-center rounded-full border border-current transition-transform duration-300 ease-editorial group-hover:-rotate-45 md:size-16">
            <IconArrowRight />
          </span>
          <span className="sr-only">Seguir no Instagram (abre em nova aba)</span>
        </a>

        <div className="mt-8 flex flex-col gap-2 text-xs text-ink-soft sm:flex-row sm:items-center sm:justify-between">
          <p>© {year} {BRAND.name}. Todos os direitos reservados.</p>
          <a href="#inicio" className="link-underline inline-flex min-h-11 items-center self-start sm:self-auto">
            Voltar ao topo ↑
          </a>
        </div>
      </div>
    </footer>
  );
}
