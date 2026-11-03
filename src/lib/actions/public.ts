"use server";

import { and, asc, eq, sql } from "drizzle-orm";
import { db } from "@/lib/db";
import { applicationEvents, applications, contactMessages, jobs, pipelineStages, talentPool } from "@/lib/db/schema";
import { applicationSchema, contactSchema, CONTACT_TOPICS, flattenErrors, talentSchema, type FieldErrors, type FormState } from "@/lib/validation/forms";
import { checkSpam } from "@/lib/spam";
import { rateLimit } from "@/lib/rate-limit";
import { clientIpHash } from "@/lib/request";
import { protocolCode } from "@/lib/crypto";
import { addMonths } from "@/lib/labels";
import { getSettings } from "@/lib/content/queries";
import { deleteFile, saveUpload, UploadError } from "@/lib/storage/files";
import { RESUME_KINDS } from "@/lib/storage/sniff";
import { jobAvailability } from "@/lib/careers/availability";
import { countApplications } from "@/lib/careers/queries";
import { emailConfigured, sendMail } from "@/lib/email";
import { env } from "@/lib/env";

const HOUR = 60 * 60 * 1000;

function values(form: FormData, keys: string[]) {
  return Object.fromEntries(keys.map((k) => [k, String(form.get(k) ?? "")]));
}

function fail(message: string, fieldErrors?: FieldErrors, vals?: Record<string, string>): FormState {
  return { status: "error", message, fieldErrors, values: vals };
}

function isUniqueViolation(err: unknown) {
  const e = err as { code?: string; cause?: { code?: string } };
  return e?.code === "23505" || e?.cause?.code === "23505";
}

/* ------------------------------------------------------------------ */
/* Job application                                                     */
/* ------------------------------------------------------------------ */

export async function submitApplication(_prev: FormState, form: FormData): Promise<FormState> {
  const baseKeys = ["fullName", "email", "phone", "city", "state", "linkedinUrl", "portfolioUrl"];
  const jobId = String(form.get("jobId") ?? "");
  const [job] = /^[0-9a-f-]{36}$/i.test(jobId) ? await db.select().from(jobs).where(eq(jobs.id, jobId)).limit(1) : [];
  const qKeys = (job?.questions ?? []).map((q) => `q_${q.id}`);
  const vals = values(form, [...baseKeys, ...qKeys]);

  const spam = await checkSpam(form);
  if (spam) return fail(spam, undefined, vals);
  if (!job) return fail("Vaga não encontrada.");
  if (job.applicationMode === "external") return fail("As candidaturas para esta vaga são recebidas pelo portal externo indicado na página.");

  const availability = jobAvailability(job, await countApplications(job.id));
  if (!availability.open) return fail(availability.message);

  const ipHash = await clientIpHash();
  if (!(await rateLimit("apply", ipHash, 10, HOUR))) return fail("Muitas tentativas em pouco tempo. Aguarde alguns minutos e tente novamente.", undefined, vals);

  const parsed = applicationSchema.safeParse({ ...vals, consent: form.get("consent") ?? undefined });
  const fieldErrors: FieldErrors = parsed.success ? {} : flattenErrors(parsed.error);

  // job-specific questions
  const answers: { questionId: string; label: string; answer: string }[] = [];
  for (const q of job.questions ?? []) {
    const raw = String(form.get(`q_${q.id}`) ?? "").trim().slice(0, 3000);
    if (q.required && !raw) fieldErrors[`q_${q.id}`] = "Resposta obrigatória.";
    if (raw && q.type === "select" && !(q.options ?? []).includes(raw)) fieldErrors[`q_${q.id}`] = "Selecione uma opção válida.";
    if (raw && q.type === "yesno" && !["Sim", "Não"].includes(raw)) fieldErrors[`q_${q.id}`] = "Selecione Sim ou Não.";
    answers.push({ questionId: q.id, label: q.label, answer: raw });
  }

  const resume = form.get("resume");
  if (!(resume instanceof File) || resume.size === 0) fieldErrors.resume = "Anexe seu currículo (PDF, DOC ou DOCX).";

  if (!parsed.success || Object.keys(fieldErrors).length) {
    return fail("Revise os campos destacados.", fieldErrors, vals);
  }
  const data = parsed.data;

  // duplicate rule: one application per e-mail per job
  const [dup] = await db
    .select({ id: applications.id })
    .from(applications)
    .where(and(eq(applications.jobId, job.id), sql`lower(${applications.email}) = ${data.email}`))
    .limit(1);
  if (dup) return fail("Já recebemos uma candidatura com este e-mail para esta vaga. Você pode se candidatar a outras vagas.", { email: "E-mail já utilizado nesta vaga." }, vals);

  let fileId: string | null = null;
  try {
    const saved = await saveUpload(resume as File, { kinds: RESUME_KINDS, purpose: "resume", visibility: "private" });
    fileId = saved.id;
  } catch (err) {
    if (err instanceof UploadError) return fail(err.message, { resume: err.message }, vals);
    console.error("[apply] upload", err);
    return fail("Não foi possível salvar o currículo. Tente novamente.", undefined, vals);
  }

  const [privacy, careers] = await Promise.all([getSettings("privacy"), getSettings("careers")]);
  const [firstStage] = await db.select().from(pipelineStages).orderBy(asc(pipelineStages.sortOrder)).limit(1);
  const protocol = protocolCode("PTL");
  try {
    const [created] = await db
      .insert(applications)
      .values({
        protocol,
        jobId: job.id,
        stageId: firstStage!.id,
        fullName: data.fullName,
        email: data.email,
        phone: data.phone,
        city: data.city,
        state: data.state,
        linkedinUrl: data.linkedinUrl ?? null,
        portfolioUrl: data.portfolioUrl ?? null,
        answers,
        resumeFileId: fileId,
        consentPrivacy: true,
        consentVersion: String(privacy.consentVersion ?? "v1"),
        consentAt: new Date(),
        ipHash,
        retentionUntil: addMonths(new Date(), Number(privacy.applicationRetentionMonths) || 12),
      })
      .returning({ id: applications.id });
    await db.insert(applicationEvents).values({ applicationId: created!.id, type: "created", toStage: firstStage!.label });
  } catch (err) {
    if (fileId) await deleteFile(fileId);
    if (isUniqueViolation(err)) return fail("Já recebemos uma candidatura com este e-mail para esta vaga.", { email: "E-mail já utilizado nesta vaga." }, vals);
    console.error("[apply] insert", err);
    return fail("Não foi possível registrar sua candidatura agora. Tente novamente em instantes.", undefined, vals);
  }

  if (emailConfigured()) {
    if (careers.sendConfirmationEmail) {
      await sendMail({
        to: data.email,
        subject: `Candidatura recebida — ${job.title}`,
        text: `Olá, ${data.fullName.split(" ")[0]}!\n\nRecebemos sua candidatura para a vaga "${job.title}" na PETROLUB.\nProtocolo: ${protocol}\n\nSe o seu perfil avançar no processo seletivo, entraremos em contato pelos dados informados.\n\nPolítica de privacidade: ${env.APP_URL}/privacidade\n\nPETROLUB`,
      });
    }
    if (careers.notifyRecruiters && env.RECRUITING_NOTIFY_EMAIL) {
      await sendMail({
        to: env.RECRUITING_NOTIFY_EMAIL,
        subject: `Nova candidatura: ${job.title}`,
        text: `Nova candidatura recebida para "${job.title}" (protocolo ${protocol}).\nAcesse o painel: ${env.APP_URL}/admin/candidaturas\n\n(Por segurança, dados pessoais não são enviados por e-mail.)`,
      });
    }
  }

  return { status: "success", protocol };
}

/* ------------------------------------------------------------------ */
/* Talent pool                                                         */
/* ------------------------------------------------------------------ */

export async function submitTalent(_prev: FormState, form: FormData): Promise<FormState> {
  const vals = values(form, ["fullName", "email", "phone", "city", "state", "linkedinUrl", "experience"]);
  const spam = await checkSpam(form);
  if (spam) return fail(spam, undefined, vals);
  const ipHash = await clientIpHash();
  if (!(await rateLimit("talent", ipHash, 6, HOUR))) return fail("Muitas tentativas em pouco tempo. Aguarde alguns minutos.", undefined, vals);

  const careers = await getSettings("careers");
  const allowedAreas = (careers.areas as string[]) ?? [];
  const areas = form.getAll("areas").map(String).filter((a) => allowedAreas.includes(a));
  const parsed = talentSchema.safeParse({ ...vals, areas, consent: form.get("consent") ?? undefined });
  const fieldErrors: FieldErrors = parsed.success ? {} : flattenErrors(parsed.error);
  const resume = form.get("resume");
  if (!(resume instanceof File) || resume.size === 0) fieldErrors.resume = "Anexe seu currículo (PDF, DOC ou DOCX).";
  if (!parsed.success || Object.keys(fieldErrors).length) return fail("Revise os campos destacados.", fieldErrors, { ...vals, areas: areas.join("|") });
  const data = parsed.data;

  let fileId: string;
  try {
    fileId = (await saveUpload(resume as File, { kinds: RESUME_KINDS, purpose: "resume", visibility: "private" })).id;
  } catch (err) {
    if (err instanceof UploadError) return fail(err.message, { resume: err.message }, vals);
    return fail("Não foi possível salvar o currículo. Tente novamente.", undefined, vals);
  }

  const privacy = await getSettings("privacy");
  const retentionUntil = addMonths(new Date(), Number(privacy.talentRetentionMonths) || 24);
  const consentVersion = String(privacy.consentVersion ?? "v1");
  const [existing] = await db.select().from(talentPool).where(sql`lower(${talentPool.email}) = ${data.email}`).limit(1);
  try {
    if (existing) {
      // Same person updating their registration: replace data and resume, renew consent and retention.
      await db
        .update(talentPool)
        .set({
          fullName: data.fullName,
          phone: data.phone,
          city: data.city,
          state: data.state,
          areas: data.areas,
          experience: data.experience ?? null,
          linkedinUrl: data.linkedinUrl ?? null,
          resumeFileId: fileId,
          consentTalentPool: true,
          consentVersion,
          consentAt: new Date(),
          retentionUntil,
          ipHash,
          updatedAt: new Date(),
        })
        .where(eq(talentPool.id, existing.id));
      if (existing.resumeFileId) await deleteFile(existing.resumeFileId);
      return { status: "success", protocol: existing.protocol, message: "Seu cadastro foi atualizado." };
    }
    const protocol = protocolCode("BT");
    await db.insert(talentPool).values({
      protocol,
      fullName: data.fullName,
      email: data.email,
      phone: data.phone,
      city: data.city,
      state: data.state,
      areas: data.areas,
      experience: data.experience ?? null,
      linkedinUrl: data.linkedinUrl ?? null,
      resumeFileId: fileId,
      consentTalentPool: true,
      consentVersion,
      consentAt: new Date(),
      ipHash,
      retentionUntil,
    });
    if (emailConfigured() && (await getSettings("careers")).sendConfirmationEmail) {
      await sendMail({
        to: data.email,
        subject: "Cadastro no banco de talentos — PETROLUB",
        text: `Olá, ${data.fullName.split(" ")[0]}!\n\nSeu currículo foi incluído no banco de talentos da PETROLUB.\nProtocolo: ${protocol}\n\nVocê pode solicitar a exclusão dos seus dados a qualquer momento. Detalhes: ${env.APP_URL}/privacidade\n\nPETROLUB`,
      });
    }
    return { status: "success", protocol };
  } catch (err) {
    await deleteFile(fileId);
    console.error("[talent]", err);
    return fail("Não foi possível concluir o cadastro agora. Tente novamente.", undefined, vals);
  }
}

/* ------------------------------------------------------------------ */
/* Contact                                                             */
/* ------------------------------------------------------------------ */

export async function submitContact(_prev: FormState, form: FormData): Promise<FormState> {
  const vals = values(form, ["name", "email", "phone", "company", "topic", "message"]);
  const spam = await checkSpam(form);
  if (spam) return fail(spam, undefined, vals);
  const ipHash = await clientIpHash();
  if (!(await rateLimit("contact", ipHash, 6, HOUR))) return fail("Muitas mensagens em pouco tempo. Aguarde alguns minutos.", undefined, vals);
  const parsed = contactSchema.safeParse({ ...vals, phone: vals.phone || undefined, company: vals.company || undefined, consent: form.get("consent") ?? undefined });
  if (!parsed.success) return fail("Revise os campos destacados.", flattenErrors(parsed.error), vals);
  const data = parsed.data;
  const privacy = await getSettings("privacy");
  const protocol = protocolCode("CT");
  await db.insert(contactMessages).values({
    protocol,
    name: data.name,
    email: data.email,
    phone: data.phone ?? null,
    company: data.company ?? null,
    topic: data.topic,
    message: data.message,
    consentPrivacy: true,
    ipHash,
    retentionUntil: addMonths(new Date(), Number(privacy.contactRetentionMonths) || 24),
  });
  if (emailConfigured() && env.CONTACT_NOTIFY_EMAIL) {
    const topic = CONTACT_TOPICS.find((t) => t.value === data.topic)?.label ?? data.topic;
    await sendMail({
      to: env.CONTACT_NOTIFY_EMAIL,
      replyTo: data.email,
      subject: `[Site] ${topic} — ${data.name}`,
      text: `Protocolo: ${protocol}\nAssunto: ${topic}\nNome: ${data.name}\nE-mail: ${data.email}\nTelefone: ${data.phone ?? "—"}\nEmpresa: ${data.company ?? "—"}\n\n${data.message}\n\nPainel: ${env.APP_URL}/admin/mensagens`,
    });
  }
  return { status: "success", protocol };
}
