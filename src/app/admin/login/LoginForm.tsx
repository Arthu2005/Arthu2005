"use client";

import { useActionState } from "react";
import { login } from "@/lib/actions/admin/auth";
import { ResultMessage } from "@/components/admin/ActionForm";
import { Button, Spinner } from "@/components/ui/Button";

export function LoginForm({ next }: { next?: string }) {
  const [result, action, pending] = useActionState(login, null);
  return (
    <form action={action} className="mt-8 space-y-5">
      {next && <input type="hidden" name="next" value={next} />}
      <div>
        <label htmlFor="email" className="field-label">
          E-mail
        </label>
        <input id="email" name="email" type="email" autoComplete="username" required className="field-input" />
      </div>
      <div>
        <label htmlFor="password" className="field-label">
          Senha
        </label>
        <input id="password" name="password" type="password" autoComplete="current-password" required className="field-input" />
      </div>
      <Button type="submit" size="lg" className="w-full" disabled={pending}>
        {pending ? <Spinner /> : null} Entrar
      </Button>
      <ResultMessage result={result} />
    </form>
  );
}
