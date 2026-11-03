"use client";

import Link from "next/link";
import { useActionState } from "react";
import type { JobQuestion } from "@/lib/db/schema";
import { submitApplication } from "@/lib/actions/public";
import { UFS, type FormState } from "@/lib/validation/forms";
import { ConsentCheckbox, FileField, FormAlert, RadioGroup, SelectField, SpamGuard, TextArea, TextField } from "@/components/forms/fields";
import { SubmitButton } from "@/components/forms/SubmitButton";
import { SuccessPanel } from "@/components/forms/SuccessPanel";

const UF_OPTIONS = UFS.map((u) => ({ value: u, label: u }));

export function ApplicationForm({ jobId, jobTitle, questions, token, maxMb, turnstileSiteKey }: { jobId: string; jobTitle: string; questions: JobQuestion[]; token: string; maxMb: number; turnstileSiteKey?: string }) {
  const [state, action, pending] = useActionState<FormState, FormData>(submitApplication, { status: "idle" });

  if (state.status === "success") {
    return (
      <SuccessPanel title="Candidatura enviada!" protocol={state.protocol}>
        <p>
          Recebemos sua candidatura para <strong>{jobTitle}</strong>. Se o seu perfil avançar, a equipe de recrutamento entrará em contato pelo e-mail ou telefone informados.
        </p>
        <p className="mt-4">
          <Link href="/carreiras/vagas" className="font-medium underline decoration-accent underline-offset-4">
            Ver outras vagas
          </Link>
        </p>
      </SuccessPanel>
    );
  }

  const v = state.status === "error" ? (state.values ?? {}) : {};
  const e = state.status === "error" ? (state.fieldErrors ?? {}) : {};

  return (
    <form action={action} className="relative space-y-6" noValidate aria-describedby="form-required-note">
      <input type="hidden" name="jobId" value={jobId} />
      <SpamGuard token={token} turnstileSiteKey={turnstileSiteKey} />
      <p id="form-required-note" className="text-sm text-steel">
        Campos com <span className="text-signal">*</span> são obrigatórios.
      </p>
      {state.status === "error" && <FormAlert message={state.message} />}

      <TextField name="fullName" label="Nome completo" required autoComplete="name" defaultValue={v.fullName} error={e.fullName} maxLength={160} />
      <div className="grid gap-6 sm:grid-cols-2">
        <TextField name="email" label="E-mail" type="email" inputMode="email" required autoComplete="email" defaultValue={v.email} error={e.email} />
        <TextField name="phone" label="Telefone / WhatsApp" type="tel" inputMode="tel" required autoComplete="tel" placeholder="(31) 99999-9999" defaultValue={v.phone} error={e.phone} />
      </div>
      <div className="grid gap-6 sm:grid-cols-[1fr_8rem]">
        <TextField name="city" label="Cidade" required autoComplete="address-level2" defaultValue={v.city} error={e.city} />
        <SelectField name="state" label="UF" required options={UF_OPTIONS} defaultValue={v.state} error={e.state} placeholder="UF" />
      </div>
      <FileField name="resume" label="Currículo" required maxMb={maxMb} error={e.resume} />
      <div className="grid gap-6 sm:grid-cols-2">
        <TextField name="linkedinUrl" label="LinkedIn" type="url" inputMode="url" placeholder="https://linkedin.com/in/…" defaultValue={v.linkedinUrl} error={e.linkedinUrl} />
        <TextField name="portfolioUrl" label="Portfólio ou site" type="url" inputMode="url" placeholder="https://" defaultValue={v.portfolioUrl} error={e.portfolioUrl} />
      </div>

      {questions.length > 0 && (
        <fieldset className="space-y-6 rounded-2xl border border-line bg-paper p-5 md:p-6">
          <legend className="px-2 text-sm font-semibold uppercase tracking-[0.14em] text-steel">Perguntas da vaga</legend>
          {questions.map((q) => {
            const n = `q_${q.id}`;
            if (q.type === "textarea") return <TextArea key={q.id} name={n} label={q.label} required={q.required} defaultValue={v[n]} error={e[n]} maxLength={3000} rows={4} />;
            if (q.type === "yesno") return <RadioGroup key={q.id} name={n} label={q.label} required={q.required} options={["Sim", "Não"]} defaultValue={v[n]} error={e[n]} />;
            if (q.type === "select") return <SelectField key={q.id} name={n} label={q.label} required={q.required} options={(q.options ?? []).map((o) => ({ value: o, label: o }))} defaultValue={v[n]} error={e[n]} />;
            return <TextField key={q.id} name={n} label={q.label} required={q.required} defaultValue={v[n]} error={e[n]} maxLength={500} />;
          })}
        </fieldset>
      )}

      <ConsentCheckbox error={e.consent}>
        Li e concordo com a{" "}
        <Link href="/privacidade" target="_blank" className="font-medium underline decoration-accent underline-offset-4">
          Política de privacidade
        </Link>{" "}
        e autorizo o tratamento dos meus dados para fins deste processo seletivo.
      </ConsentCheckbox>

      <SubmitButton pending={pending} pendingLabel="Enviando candidatura…">
        Enviar candidatura
      </SubmitButton>
    </form>
  );
}
