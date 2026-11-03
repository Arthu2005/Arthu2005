import { z } from "zod";

export const UFS = ["AC","AL","AP","AM","BA","CE","DF","ES","GO","MA","MT","MS","MG","PA","PB","PR","PE","PI","RJ","RN","RS","RO","RR","SC","SP","SE","TO"] as const;

const name = z.string().trim().min(3, "Informe seu nome completo.").max(160, "Nome muito longo.").refine((v) => v.includes(" "), "Informe nome e sobrenome.");
const email = z.string().trim().toLowerCase().max(254).email("Informe um e-mail válido.");
const phone = z
  .string()
  .trim()
  .max(30)
  .refine((v) => {
    const d = v.replace(/\D/g, "");
    return d.length >= 10 && d.length <= 13;
  }, "Informe um telefone com DDD.");
const optionalUrl = z
  .string()
  .trim()
  .max(500)
  .optional()
  .transform((v) => (v ? v : undefined))
  .refine((v) => !v || /^https?:\/\/[^\s]+\.[^\s]+/i.test(v), "Informe um link completo, começando com https://");
const city = z.string().trim().min(2, "Informe a cidade.").max(120);
const uf = z.enum(UFS, { message: "Selecione o estado." });
const checked = (msg: string) => z.literal("on", { message: msg });

export const applicationSchema = z.object({
  fullName: name,
  email,
  phone,
  city,
  state: uf,
  linkedinUrl: optionalUrl,
  portfolioUrl: optionalUrl,
  consent: checked("É necessário aceitar o aviso de privacidade para enviar a candidatura."),
});

export const talentSchema = z.object({
  fullName: name,
  email,
  phone,
  city,
  state: uf,
  linkedinUrl: optionalUrl,
  experience: z.string().trim().max(3000).optional(),
  areas: z.array(z.string().trim().max(120)).min(1, "Selecione pelo menos uma área de interesse.").max(10),
  consent: checked("É necessário autorizar o uso dos dados para o banco de talentos."),
});

export const CONTACT_TOPICS = [
  { value: "coleta", label: "Solicitar coleta de óleo usado" },
  { value: "comercial", label: "Comercial / óleo básico rerrefinado" },
  { value: "documentacao", label: "Documentação (CCO, CDF, MTR)" },
  { value: "carreiras", label: "Carreiras" },
  { value: "imprensa", label: "Imprensa" },
  { value: "outros", label: "Outros assuntos" },
] as const;

export const contactSchema = z.object({
  name: z.string().trim().min(2, "Informe seu nome.").max(160),
  email,
  phone: z
    .string()
    .trim()
    .max(30)
    .optional()
    .refine((v) => !v || v.replace(/\D/g, "").length >= 10, "Informe um telefone com DDD."),
  company: z.string().trim().max(160).optional(),
  topic: z.enum(CONTACT_TOPICS.map((t) => t.value) as [string, ...string[]], { message: "Selecione o assunto." }),
  message: z.string().trim().min(10, "Escreva uma mensagem com pelo menos 10 caracteres.").max(4000, "Mensagem muito longa."),
  consent: checked("É necessário aceitar o aviso de privacidade."),
});

export type FieldErrors = Record<string, string>;

export function flattenErrors(error: z.ZodError): FieldErrors {
  const out: FieldErrors = {};
  for (const issue of error.issues) {
    const k = String(issue.path[0] ?? "form");
    if (!out[k]) out[k] = issue.message;
  }
  return out;
}

export type FormState =
  | { status: "idle" }
  | { status: "error"; message: string; fieldErrors?: FieldErrors; values?: Record<string, string> }
  | { status: "success"; protocol: string; message?: string };
