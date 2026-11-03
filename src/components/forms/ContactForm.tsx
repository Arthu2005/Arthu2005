"use client";

import Link from "next/link";
import { useActionState } from "react";
import { submitContact } from "@/lib/actions/public";
import { CONTACT_TOPICS, type FormState } from "@/lib/validation/forms";
import { ConsentCheckbox, FormAlert, SelectField, SpamGuard, TextArea, TextField } from "./fields";
import { SubmitButton } from "./SubmitButton";
import { SuccessPanel } from "./SuccessPanel";

export function ContactForm({ token, defaultTopic, defaultMessage, turnstileSiteKey }: { token: string; defaultTopic?: string; defaultMessage?: string; turnstileSiteKey?: string }) {
  const [state, action, pending] = useActionState<FormState, FormData>(submitContact, { status: "idle" });
  if (state.status === "success") {
    return (
      <SuccessPanel title="Mensagem recebida!" protocol={state.protocol}>
        <p>Obrigado pelo contato. Nossa equipe responderá pelo e-mail informado.</p>
      </SuccessPanel>
    );
  }
  const v = state.status === "error" ? (state.values ?? {}) : {};
  const e = state.status === "error" ? (state.fieldErrors ?? {}) : {};
  return (
    <form action={action} className="relative space-y-6" noValidate>
      <SpamGuard token={token} turnstileSiteKey={turnstileSiteKey} />
      {state.status === "error" && <FormAlert message={state.message} />}
      <SelectField name="topic" label="Assunto" required options={CONTACT_TOPICS.map((t) => ({ value: t.value, label: t.label }))} defaultValue={v.topic ?? defaultTopic} error={e.topic} />
      <div className="grid gap-6 sm:grid-cols-2">
        <TextField name="name" label="Nome" required autoComplete="name" defaultValue={v.name} error={e.name} />
        <TextField name="company" label="Empresa" autoComplete="organization" defaultValue={v.company} error={e.company} />
      </div>
      <div className="grid gap-6 sm:grid-cols-2">
        <TextField name="email" label="E-mail" type="email" inputMode="email" required autoComplete="email" defaultValue={v.email} error={e.email} />
        <TextField name="phone" label="Telefone" type="tel" inputMode="tel" autoComplete="tel" defaultValue={v.phone} error={e.phone} />
      </div>
      <TextArea name="message" label="Mensagem" required defaultValue={v.message ?? defaultMessage} error={e.message} maxLength={4000} rows={6} />
      <ConsentCheckbox error={e.consent}>
        Li e concordo com a{" "}
        <Link href="/privacidade" target="_blank" className="font-medium underline decoration-accent underline-offset-4">
          Política de privacidade
        </Link>{" "}
        e autorizo o uso dos meus dados para resposta a esta solicitação.
      </ConsentCheckbox>
      <SubmitButton pending={pending}>Enviar mensagem</SubmitButton>
    </form>
  );
}
