import type { Field } from "./fields";

export type SettingsDef = { key: string; label: string; description?: string; fields: Field[]; defaults: Record<string, unknown> };

export const SETTINGS: SettingsDef[] = [
  {
    key: "general",
    label: "Identidade",
    fields: [
      { name: "siteName", label: "Nome do site", type: "text", required: true },
      { name: "legalName", label: "Razão social", type: "text" },
      { name: "cnpj", label: "CNPJ", type: "text" },
      { name: "accentColor", label: "Verde vibrante da marca (botões e elementos interativos)", type: "color", help: "Verde oficial da marca: #1c782b (portal de carreiras oficial)." },
      {
        name: "showProvisionalMarkers",
        label: "Exibir selos de “conteúdo provisório” no site",
        type: "boolean",
        help: "Mantenha ativo até que todo o conteúdo seja validado. Desative antes do lançamento oficial.",
      },
      { name: "logo", label: "Logotipo (substituição opcional)", type: "image", help: "Se vazio, o site usa o logotipo oficial já incluído (versão colorida e branca)." },
    ],
    defaults: {
      siteName: "PETROLUB",
      legalName: "PETROLUB Industrial de Lubrificantes Ltda.",
      cnpj: "",
      accentColor: "#1c782b",
      showProvisionalMarkers: true,
      logo: { src: "", alt: "PETROLUB" },
    },
  },
  {
    key: "contact",
    label: "Contato",
    fields: [
      { name: "phone", label: "Telefone principal", type: "text" },
      { name: "phoneTollFree", label: "0800 (coleta)", type: "text" },
      { name: "whatsapp", label: "WhatsApp oficial (somente números, com DDI)", type: "text", help: "Deixe vazio se não houver canal oficial." },
      { name: "email", label: "E-mail geral", type: "text" },
      { name: "address", label: "Endereço", type: "textarea" },
      { name: "hours", label: "Horário de atendimento", type: "text" },
      { name: "mapEmbedUrl", label: "URL de incorporação do mapa", type: "url", help: "Google Maps › Compartilhar › Incorporar mapa › copie apenas o endereço do atributo src." },
      {
        name: "regional",
        label: "Contatos regionais",
        type: "repeater",
        itemLabel: "Regional",
        fields: [
          { name: "region", label: "Região / UF", type: "text" },
          { name: "email", label: "E-mail", type: "text" },
          { name: "phone", label: "Telefone", type: "text" },
        ],
      },
    ],
    defaults: {
      phone: "+55 (31) 2106-2800",
      phoneTollFree: "0800 283 1145",
      whatsapp: "",
      email: "contato@petrolub.com.br",
      address: "Rod. Pres. Juscelino Kubitschek (BR-040), km 461 — Zona Rural\nSete Lagoas — MG · CEP 35701-970",
      hours: "",
      mapEmbedUrl: "",
      regional: [
        { region: "Espírito Santo", email: "comercial.es@petrolub.com.br", phone: "" },
        { region: "Rio de Janeiro", email: "comercial.rj@petrolub.com.br", phone: "" },
        { region: "Bahia", email: "comercial.ba@petrolub.com.br", phone: "" },
        { region: "Goiás", email: "comercial.go@petrolub.com.br", phone: "" },
        { region: "São Paulo", email: "comercial.sp@petrolub.com.br", phone: "" },
        { region: "Paraná", email: "comercial.pr@petrolub.com.br", phone: "" },
      ],
    },
  },
  {
    key: "social",
    label: "Redes e canais",
    fields: [
      { name: "instagram", label: "Instagram", type: "url" },
      { name: "linkedin", label: "LinkedIn", type: "url" },
      { name: "facebook", label: "Facebook", type: "url" },
      { name: "youtube", label: "YouTube", type: "url" },
      { name: "solides", label: "Portal de vagas Sólides", type: "url" },
    ],
    defaults: {
      instagram: "https://www.instagram.com/petrolub.industrial/",
      linkedin: "https://www.linkedin.com/company/petrolub-industrial-de-lubrificantes/",
      facebook: "https://www.facebook.com/petrolub.industrial1/",
      youtube: "",
      solides: "https://petrolub.vagas.solides.com.br/",
    },
  },
  {
    key: "footer",
    label: "Rodapé",
    fields: [
      { name: "tagline", label: "Frase do rodapé", type: "textarea" },
      { name: "legal", label: "Texto legal", type: "textarea" },
    ],
    defaults: {
      tagline: "Coleta e rerrefino de óleo lubrificante usado ou contaminado desde 1966.",
      legal: "",
    },
  },
  {
    key: "seo",
    label: "SEO padrão",
    fields: [
      { name: "titleTemplate", label: "Modelo de título (%s = título da página)", type: "text" },
      { name: "defaultTitle", label: "Título padrão", type: "text" },
      { name: "defaultDescription", label: "Descrição padrão", type: "textarea", max: 170 },
      { name: "ogImage", label: "Imagem padrão de compartilhamento", type: "image" },
    ],
    defaults: {
      titleTemplate: "%s · PETROLUB",
      defaultTitle: "PETROLUB — Coleta e rerrefino de óleo lubrificante usado",
      defaultDescription:
        "Desde 1966 na coleta e rerrefino de óleo lubrificante usado ou contaminado (OLUC). Logística reversa, óleo básico rerrefinado e carreiras na PETROLUB.",
      ogImage: { src: "", alt: "" },
    },
  },
  {
    key: "privacy",
    label: "Privacidade (LGPD)",
    description: "Regras de retenção e consentimento. Valores iniciais são sugestões e devem ser aprovados pelo jurídico/DPO.",
    fields: [
      { name: "dpoName", label: "Encarregado (DPO) — nome", type: "text" },
      { name: "dpoEmail", label: "Encarregado (DPO) — e-mail", type: "text" },
      { name: "consentVersion", label: "Versão do aviso de privacidade", type: "text", help: "Altere sempre que o texto da política mudar. A versão aceita é gravada em cada envio." },
      { name: "applicationRetentionMonths", label: "Retenção de candidaturas (meses)", type: "number" },
      { name: "talentRetentionMonths", label: "Retenção do banco de talentos (meses)", type: "number" },
      { name: "contactRetentionMonths", label: "Retenção de mensagens de contato (meses)", type: "number" },
    ],
    defaults: {
      dpoName: "",
      dpoEmail: "",
      consentVersion: "2026-11-v1",
      applicationRetentionMonths: 12,
      talentRetentionMonths: 24,
      contactRetentionMonths: 24,
    },
  },
  {
    key: "careers",
    label: "Recrutamento",
    fields: [
      { name: "sendConfirmationEmail", label: "Enviar e-mail de confirmação ao candidato (requer SMTP)", type: "boolean" },
      { name: "notifyRecruiters", label: "Notificar recrutadores a cada candidatura (requer SMTP)", type: "boolean" },
      {
        name: "areas",
        label: "Áreas de interesse do banco de talentos (uma por linha)",
        type: "list",
      },
    ],
    defaults: {
      sendConfirmationEmail: true,
      notifyRecruiters: true,
      areas: ["Logística e coleta", "Operação industrial", "Qualidade e laboratório", "Manutenção", "Comercial", "Administrativo e financeiro", "Saúde, segurança e meio ambiente", "Jovem aprendiz / estágio"],
    },
  },
];

export function getSettingsDef(key: string) {
  return SETTINGS.find((s) => s.key === key);
}
