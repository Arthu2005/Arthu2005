"use client";

import Link from "next/link";
import { useEffect } from "react";
import { buttonClass } from "@/components/ui/Button";

export default function GlobalError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => console.error(error), [error]);
  return (
    <main className="flex min-h-[100svh] items-center bg-paper">
      <div className="container-x">
        <p className="eyebrow">Algo deu errado</p>
        <h1 className="mt-6 max-w-2xl text-h1 font-semibold">Não foi possível carregar esta página.</h1>
        <p className="mt-6 max-w-lg text-lg text-steel">Tente novamente em instantes. Se o problema persistir, entre em contato conosco.</p>
        {error.digest && <p className="mt-3 font-mono text-xs text-steel">Código: {error.digest}</p>}
        <div className="mt-10 flex flex-wrap gap-3">
          <button type="button" onClick={reset} className={buttonClass("primary", "lg")}>
            Tentar novamente
          </button>
          <Link href="/" className={buttonClass("secondary", "lg")}>
            Página inicial
          </Link>
        </div>
      </div>
    </main>
  );
}
