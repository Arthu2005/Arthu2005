/** Configuração central da marca. Troque aqui links, contatos e textos institucionais. */

const INSTAGRAM_URL = "https://www.instagram.com/paullaboutiq?fqnt=cDdwazZmdzcwNDNj";

function sanitizePhone(raw: string | undefined): string | null {
  if (!raw) return null;
  const digits = raw.replace(/\D/g, "");
  // DDI + DDD + número: entre 12 e 13 dígitos para Brasil; aceita 10–15 para outros países.
  return digits.length >= 10 && digits.length <= 15 ? digits : null;
}

export const BRAND = {
  name: "Paulla Boutiq",
  shortName: "Paulla",
  tagline: "Curadoria de moda autoral",
  instagram: {
    handle: "@paullaboutiq",
    url: INSTAGRAM_URL,
  },
  whatsappNumber: sanitizePhone(import.meta.env.VITE_WHATSAPP_NUMBER),
  newsletterEndpoint: import.meta.env.VITE_NEWSLETTER_ENDPOINT?.trim() || null,
  catalogUrl: import.meta.env.VITE_CATALOG_URL?.trim() || null,
  service: {
    // Ajuste com os horários e canais oficiais da boutique.
    hours: "Atendimento personalizado pelo Direct do Instagram",
    note: "Reservas, provas e ajustes combinados com a Paulla.",
  },
} as const;

export const NAV_LINKS = [
  { href: "#vitrine", label: "Vitrine" },
  { href: "#destaques", label: "Destaques" },
  { href: "#manifesto", label: "Manifesto" },
  { href: "#atendimento", label: "Atendimento" },
] as const;
