"use client";

import { useActionState } from "react";
import { changeOwnPassword } from "@/lib/actions/admin/auth";
import { AdminButton, ResultMessage } from "@/components/admin/ActionForm";
import { inputCls, labelCls } from "@/components/admin/ui";

export function PasswordForm() {
  const [result, action, pending] = useActionState(changeOwnPassword, null);
  const field = (name: string, label: string, auto: string) => (
    <div>
      <label htmlFor={name} className={labelCls}>
        {label}
      </label>
      <input id={name} name={name} type="password" autoComplete={auto} required className={inputCls} aria-invalid={result?.errors?.[name] ? true : undefined} />
      {result?.errors?.[name] && <p className="mt-1 text-xs text-signal">{result.errors[name]}</p>}
    </div>
  );
  return (
    <form action={action} className="space-y-4">
      {field("current", "Senha atual", "current-password")}
      {field("next", "Nova senha (mín. 12 caracteres, letras e números)", "new-password")}
      {field("confirm", "Confirme a nova senha", "new-password")}
      <AdminButton pending={pending}>Salvar nova senha</AdminButton>
      <ResultMessage result={result} />
      {result?.ok && (
        <p className="text-sm">
          <a href="/admin" className="font-medium underline">
            Ir para o painel →
          </a>
        </p>
      )}
    </form>
  );
}
