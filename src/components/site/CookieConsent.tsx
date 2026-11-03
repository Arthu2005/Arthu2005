"use client";

import Link from "next/link";
import Script from "next/script";
import { useEffect, useState, useSyncExternalStore } from "react";
import { buttonClass } from "@/components/ui/Button";

const COOKIE = "ptl_consent";
type Choice = "all" | "essential";

function readChoice(): Choice | null {
  const m = document.cookie.match(/(?:^|; )ptl_consent=(all|essential)/);
  return (m?.[1] as Choice) ?? null;
}
function writeChoice(c: Choice) {
  const secure = location.protocol === "https:" ? "; Secure" : "";
  document.cookie = `${COOKIE}=${c}; Path=/; Max-Age=${60 * 60 * 24 * 180}; SameSite=Lax${secure}`;
}

/**
 * LGPD cookie notice. Only essential cookies are used by default; optional analytics
 * (GA4, if NEXT_PUBLIC_GA_ID is configured) loads ONLY after explicit consent.
 */
const EVENT = "ptl:consent-changed";
function subscribe(cb: () => void) {
  window.addEventListener(EVENT, cb);
  return () => window.removeEventListener(EVENT, cb);
}
const serverSnapshot = () => "ssr" as const;

export function CookieConsent({ gaId }: { gaId?: string }) {
  const stored = useSyncExternalStore(subscribe, () => readChoice() ?? "none", serverSnapshot);
  const choice: Choice | null = stored === "all" || stored === "essential" ? stored : null;
  const [forced, setForced] = useState(false);
  const open = stored !== "ssr" && (choice === null || forced);

  useEffect(() => {
    const reopen = () => setForced(true);
    window.addEventListener("ptl:cookie-preferences", reopen);
    return () => window.removeEventListener("ptl:cookie-preferences", reopen);
  }, []);

  const decide = (c: Choice) => {
    const previous = choice;
    writeChoice(c);
    setForced(false);
    window.dispatchEvent(new Event(EVENT));
    if (c === "essential" && previous === "all") location.reload(); // unload analytics already running
  };

  return (
    <>
      {gaId && choice === "all" && (
        <>
          <Script src={`https://www.googletagmanager.com/gtag/js?id=${encodeURIComponent(gaId)}`} strategy="afterInteractive" />
          <Script id="ga4" strategy="afterInteractive">
            {`window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments);}gtag('js',new Date());gtag('config',${JSON.stringify(gaId)},{anonymize_ip:true});`}
          </Script>
        </>
      )}
      {open && (
        <div role="region" aria-label="Aviso de cookies" className="fixed inset-x-3 bottom-3 z-[60] mx-auto max-w-md rounded-2xl sm:inset-x-auto sm:right-6 sm:mx-0 border border-line bg-white/95 p-5 shadow-[0_20px_60px_-20px_rgb(0_0_0/0.35)] backdrop-blur sm:bottom-6">
          <p className="text-sm leading-relaxed text-ink-2">
            Usamos cookies essenciais para o funcionamento do site.{" "}
            {gaId ? "Com sua permissão, também usamos cookies de medição de audiência. " : ""}
            Saiba mais na{" "}
            <Link href="/privacidade" className="font-medium text-ink underline decoration-accent underline-offset-4">
              Política de privacidade
            </Link>
            .
          </p>
          <div className="mt-4 flex flex-wrap gap-2">
            {gaId ? (
              <>
                <button type="button" className={buttonClass("primary", "sm")} onClick={() => decide("all")}>
                  Aceitar todos
                </button>
                <button type="button" className={buttonClass("secondary", "sm")} onClick={() => decide("essential")}>
                  Somente essenciais
                </button>
              </>
            ) : (
              <button type="button" className={buttonClass("primary", "sm")} onClick={() => decide("essential")}>
                Entendi
              </button>
            )}
          </div>
        </div>
      )}
    </>
  );
}

export function CookiePreferencesButton({ className }: { className?: string }) {
  return (
    <button type="button" className={className} onClick={() => window.dispatchEvent(new Event("ptl:cookie-preferences"))}>
      Preferências de cookies
    </button>
  );
}
