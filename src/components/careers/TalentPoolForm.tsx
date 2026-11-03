"use client";

import Link from "next/link";
import { useActionState } from "react";
import { submitTalent } from "@/lib/actions/public";
import { UFS, type FormState } from "@/lib/validation/forms";
import { CheckboxGroup, ConsentCheckbox, FileField, FormAlert, SelectField, SpamGuard, TextArea, TextField } from "@/components/forms/fields";
import { SubmitButton } from "@/components/forms/SubmitButton";
import { SuccessPanel } from "@/components/forms/SuccessPanel";

export function TalentPoolForm({ areas, token, maxMb, retentionMonths, turnstileSiteKey }: { areas: string[]; token: string; maxMb: number; retentionMonths: number; turnstileSiteKey?: string }) {
  const [state, action, pending] = useActionState<FormState, FormData>(submitTalent, { status: "idle" });
  if (state.status === "success") {
    return (
      <SuccessPanel title={state.message ?? "Cadastro realizado!"} protocol={state.protocol}>
        <p>Seu currículo está no nosso banco de talentos e será considerado em oportunidades compatíveis com as áreas de interesse informadas.</p>
      </SuccessPanel>
    );
  }
  const v = state.status === "error" ? (state.values ?? {}) : {};
  const e = state.status === "error" ? (state.fieldErrors ?? {}) : {};
  return (
    <form action={action} className="relative space-y-6" noValidate>
      <SpamGuard token={token} turnstileSiteKey={turnstileSiteKey} />
      <p className="text-sm text-steel">
        Campos com <span className="text-signal">*</span> são obrigatórios.
      </p>
      {state.status === "error" && <FormAlert message={state.message} />}
      <TextField name="fullName" label="Nome completo" required autoComplete="name" defaultValue={v.fullName} error={e.fullName} />
      <div className="grid gap-6 sm:grid-cols-2">
        <TextField name="email" label="E-mail" type="email" inputMode="email" required autoComplete="email" defaultValue={v.email} error={e.email} />
        <TextField name="phone" label="Telefone / WhatsApp" type="tel" inputMode="tel" required autoComplete="tel" placeholder="(31) 99999-9999" defaultValue={v.phone} error={e.phone} />
      </div>
      <div className="grid gap-6 sm:grid-cols-[1fr_8rem]">
        <TextField name="city" label="Cidade" required autoComplete="address-level2" defaultValue={v.city} error={e.city} />
        <SelectField name="state" label="UF" required options={UFS.map((u) => ({ value: u, label: u }))} defaultValue={v.state} error={e.state} placeholder="UF" />
      </div>
      <CheckboxGroup name="areas" label="Áreas de interesse" required options={areas} defaultValues={(v.areas ?? "").split("|")} error={e.areas} />
      <FileField name="resume" label="Currículo" required maxMb={maxMb} error={e.resume} />
      <TextField name="linkedinUrl" label="LinkedIn" type="url" inputMode="url" placeholder="https://linkedin.com/in/…" defaultValue={v.linkedinUrl} error={e.linkedinUrl} />
      <TextArea name="experience" label="Resumo da sua experiência" defaultValue={v.experience} error={e.experience} maxLength={3000} rows={5} />
      <ConsentCheckbox error={e.consent}>
        Autorizo a PETROLUB a manter meus dados e currículo no banco de talentos por até {retentionMonths} meses, para contato sobre oportunidades futuras, conforme a{" "}
        <Link href="/privacidade" target="_blank" className="font-medium underline decoration-accent underline-offset-4">
          Política de privacidade
        </Link>
        . Posso revogar este consentimento a qualquer momento.
      </ConsentCheckbox>
      <SubmitButton pending={pending}>Cadastrar currículo</SubmitButton>
    </form>
  );
}
