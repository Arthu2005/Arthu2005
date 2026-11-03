import type { Job } from "@/lib/db/schema";

export type Availability =
  | { open: true }
  | { open: false; reason: "draft" | "paused" | "closed" | "archived" | "deadline" | "limit"; message: string };

/** Single source of truth for "can someone apply to this job right now?" (used by UI and server). */
export function jobAvailability(job: Pick<Job, "status" | "deadline" | "maxApplications">, applicationCount: number, now = new Date()): Availability {
  switch (job.status) {
    case "draft":
      return { open: false, reason: "draft", message: "Esta vaga ainda não foi publicada." };
    case "paused":
      return { open: false, reason: "paused", message: "As inscrições para esta vaga estão temporariamente pausadas." };
    case "closed":
      return { open: false, reason: "closed", message: "Esta vaga foi encerrada e não recebe mais candidaturas." };
    case "archived":
      return { open: false, reason: "archived", message: "Esta vaga não está mais disponível." };
  }
  if (job.deadline) {
    // deadline is inclusive until 23:59:59 in Brasília time
    const end = new Date(`${job.deadline}T23:59:59-03:00`);
    if (now > end) return { open: false, reason: "deadline", message: "O prazo de inscrição desta vaga terminou." };
  }
  if (job.maxApplications && applicationCount >= job.maxApplications) {
    return { open: false, reason: "limit", message: "Esta vaga atingiu o limite de inscrições." };
  }
  return { open: true };
}
