import { AnimatePresence, motion } from "motion/react";
import { useId, useRef, useState, type FormEvent } from "react";
import { Button } from "@/components/ui/Button";
import { IconArrowRight, IconCheck } from "@/components/ui/Icons";
import { BRAND } from "@/config/brand";
import { cn } from "@/lib/cn";
import { microTransition } from "@/lib/motion";

type Status = { kind: "idle" } | { kind: "invalid"; message: string } | { kind: "submitting" } | { kind: "success"; message: string } | { kind: "error"; message: string } | { kind: "unavailable" };

// Validação pragmática (o servidor deve revalidar).
const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

function validate(raw: string): string | null {
  const email = raw.trim();
  if (!email) return "Informe seu e-mail.";
  if (email.length > 254) return "E-mail muito longo.";
  if (!EMAIL.test(email)) return "Confira o e-mail — parece incompleto.";
  return null;
}

export function Newsletter() {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<Status>({ kind: "idle" });
  const inputRef = useRef<HTMLInputElement>(null);
  const id = useId();
  const errorId = `${id}-error`;
  const statusId = `${id}-status`;

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (status.kind === "submitting") return;
    // Honeypot: bots preenchem campos ocultos.
    if ((new FormData(e.currentTarget).get("company") as string | null)?.trim()) return;

    const error = validate(email);
    if (error) {
      setStatus({ kind: "invalid", message: error });
      inputRef.current?.focus();
      return;
    }

    const clean = email.trim().toLowerCase();

    if (BRAND.newsletterEndpoint) {
      setStatus({ kind: "submitting" });
      try {
        const res = await fetch(BRAND.newsletterEndpoint, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email: clean, source: "vitrine" }),
          signal: AbortSignal.timeout(10000),
        });
        if (!res.ok) throw new Error(String(res.status));
        setStatus({ kind: "success", message: "Pronto! Você vai receber as novidades em primeira mão." });
        setEmail("");
      } catch {
        setStatus({ kind: "error", message: "Não conseguimos concluir agora. Tente de novo em instantes." });
      }
      return;
    }

    if (BRAND.whatsappNumber) {
      const text = encodeURIComponent(`Olá, Paulla! Quero receber as novidades da boutique. Meu e-mail: ${clean}`);
      window.open(`https://wa.me/${BRAND.whatsappNumber}?text=${text}`, "_blank", "noopener,noreferrer");
      setStatus({ kind: "success", message: "Abrimos o WhatsApp com sua mensagem — é só enviar." });
      return;
    }

    setStatus({ kind: "unavailable" });
  }

  const invalid = status.kind === "invalid";

  return (
    <form onSubmit={onSubmit} noValidate aria-describedby={statusId} className="w-full">
      <label htmlFor={id} className="eyebrow block text-ink-soft">
        Assine as novidades
      </label>
      <div className={cn("mt-3 flex items-center gap-2 rounded-full border bg-canvas p-1.5 pl-5 transition-colors duration-200 focus-within:border-ink", invalid ? "border-accent" : "border-line hover:border-ink-soft")}>
        <input
          ref={inputRef}
          id={id}
          type="email"
          name="email"
          inputMode="email"
          autoComplete="email"
          placeholder="seu@email.com"
          value={email}
          onChange={(e) => {
            setEmail(e.target.value);
            if (status.kind !== "idle" && status.kind !== "submitting") setStatus({ kind: "idle" });
          }}
          aria-invalid={invalid}
          aria-describedby={invalid ? errorId : undefined}
          className="min-w-0 flex-1 bg-transparent py-2 text-[16px] placeholder:text-ink-soft/80 focus:outline-none md:text-sm"
        />
        {/* Honeypot */}
        <input type="text" name="company" tabIndex={-1} autoComplete="off" aria-hidden className="hidden" />
        <Button type="submit" disabled={status.kind === "submitting"} aria-label="Assinar novidades" className="px-4 md:px-6" icon={status.kind === "submitting" ? <Spinner /> : <IconArrowRight size={16} />}>
          <span className="hidden sm:inline">{status.kind === "submitting" ? "Enviando" : "Assinar"}</span>
        </Button>
      </div>

      <div id={statusId} aria-live="polite" className="mt-3 min-h-6 text-sm">
        <AnimatePresence mode="wait" initial={false}>
          {invalid && (
            <motion.p key="invalid" id={errorId} initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={microTransition} className="text-accent">
              {status.message}
            </motion.p>
          )}
          {status.kind === "success" && (
            <motion.p key="ok" initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={microTransition} className="flex items-center gap-2">
              <IconCheck size={16} className="text-accent" /> {status.message}
            </motion.p>
          )}
          {status.kind === "error" && (
            <motion.p key="err" role="alert" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={microTransition} className="text-accent">
              {status.message}
            </motion.p>
          )}
          {status.kind === "unavailable" && (
            <motion.p key="na" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={microTransition} className="text-ink-soft">
              A lista por e-mail abre em breve. Enquanto isso, ative as notificações em{" "}
              <a href={BRAND.instagram.url} target="_blank" rel="noopener noreferrer" className="text-ink underline underline-offset-4">
                {BRAND.instagram.handle}
              </a>
              .
            </motion.p>
          )}
        </AnimatePresence>
      </div>
    </form>
  );
}

function Spinner() {
  return <span aria-hidden className="block size-4 animate-spin rounded-full border-2 border-current border-r-transparent" />;
}
