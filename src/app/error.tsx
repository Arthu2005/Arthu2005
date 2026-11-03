"use client";

import Link from "next/link";
import { useEffect } from "react";
import { buttonClass } from "@/components/ui/Button";

const RELOAD_KEY = "ptl-error-reload";

/** A tab opened before a new deploy asks for files that no longer exist: only a full reload fixes it. */
function isStaleBuild(error: Error) {
  return /ChunkLoadError|Loading (CSS )?chunk|dynamically imported module|Failed to fetch|server action/i.test(`${error.name} ${error.message}`);
}

export default function GlobalError({ error }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    console.error(error);
    if (!isStaleBuild(error)) return;
    try {
      // reload automatically, at most once every 30 s, so it never loops if the error survives the reload
      const last = Number(sessionStorage.getItem(RELOAD_KEY) ?? 0);
      if (Date.now() - last < 30_000) return;
      sessionStorage.setItem(RELOAD_KEY, String(Date.now()));
    } catch {
      return;
    }
    window.location.reload();
  }, [error]);

  const retry = () => {
    try {
      sessionStorage.removeItem(RELOAD_KEY);
    } catch {}
    // full reload (not just re-render): also recovers from a stale tab after a new deploy
    window.location.reload();
  };

  return (
    <main className="flex min-h-[100svh] items-center bg-paper">
      <div className="container-x">
        <p className="eyebrow">Algo deu errado</p>
        <h1 className="mt-6 max-w-2xl text-h1 font-semibold">Não foi possível carregar esta página.</h1>
        <p className="mt-6 max-w-lg text-lg text-steel">Tente novamente em instantes. Se o problema persistir, entre em contato conosco.</p>
        <p className="mt-3 max-w-lg font-mono text-xs text-steel">
          {error.digest ? `Código: ${error.digest}` : `Detalhe: ${(error.message || error.name || "erro no navegador").slice(0, 160)}`}
        </p>
        <div className="mt-10 flex flex-wrap gap-3">
          <button type="button" onClick={retry} className={buttonClass("primary", "lg")}>
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
