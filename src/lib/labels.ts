import type { JobStatus, WorkModel } from "@/lib/db/schema";

export const WORK_MODEL_LABELS: Record<WorkModel, string> = { presencial: "Presencial", hibrido: "Híbrido", remoto: "Remoto" };
export const JOB_STATUS_LABELS: Record<JobStatus, string> = {
  draft: "Rascunho",
  published: "Publicada",
  paused: "Inscrições pausadas",
  closed: "Encerrada",
  archived: "Arquivada",
};
export const STATUS_TONE: Record<JobStatus, "ok" | "neutral" | "warn" | "danger" | "info"> = { published: "ok", draft: "neutral", paused: "warn", closed: "danger", archived: "neutral" };
export const CONTRACT_TYPES = ["CLT", "PJ", "Estágio", "Jovem Aprendiz", "Temporário", "Trainee"] as const;
export const INBOX_STATUS_LABELS = { novo: "Nova", em_andamento: "Em andamento", respondido: "Respondida", arquivado: "Arquivada" } as const;
export const TALENT_STATUS_LABELS = { novo: "Novo", em_analise: "Em análise", contatado: "Contatado", arquivado: "Arquivado" } as const;

export function formatDate(d: Date | string | null | undefined, opts: Intl.DateTimeFormatOptions = { dateStyle: "medium" }) {
  if (!d) return "—";
  const date = typeof d === "string" ? new Date(d.length === 10 ? `${d}T12:00:00` : d) : d;
  return new Intl.DateTimeFormat("pt-BR", { timeZone: "America/Sao_Paulo", ...opts }).format(date);
}

export function formatDateTime(d: Date | string | null | undefined) {
  return formatDate(d, { dateStyle: "short", timeStyle: "short" });
}

export function slugify(input: string) {
  return input
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 120);
}

export function daysAgo(n: number) {
  return new Date(Date.now() - n * 86400000);
}

export function addMonths(date: Date, months: number) {
  const d = new Date(date);
  d.setMonth(d.getMonth() + months);
  return d.toISOString().slice(0, 10);
}
