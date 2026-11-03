"use client";

import Script from "next/script";
import { useId, useRef, useState, type ReactNode } from "react";
import { AlertCircle, CheckCircle2, FileUp, X } from "lucide-react";
import { cn } from "@/lib/cn";

type Common = { name: string; label: string; error?: string; help?: string; required?: boolean; className?: string };

function ErrorText({ id, error }: { id: string; error?: string }) {
  if (!error) return null;
  return (
    <p id={id} className="field-error">
      <AlertCircle className="h-4 w-4 shrink-0" aria-hidden="true" />
      {error}
    </p>
  );
}

function Label({ htmlFor, label, required }: { htmlFor: string; label: string; required?: boolean }) {
  return (
    <label htmlFor={htmlFor} className="field-label">
      {label}
      {required ? <span className="text-signal" aria-hidden="true"> *</span> : <span className="font-normal text-steel"> (opcional)</span>}
    </label>
  );
}

export function TextField({
  name,
  label,
  error,
  help,
  required,
  className,
  type = "text",
  defaultValue,
  autoComplete,
  inputMode,
  placeholder,
  maxLength,
}: Common & { type?: string; defaultValue?: string; autoComplete?: string; inputMode?: "text" | "email" | "tel" | "url" | "numeric"; placeholder?: string; maxLength?: number }) {
  const id = useId();
  return (
    <div className={className}>
      <Label htmlFor={id} label={label} required={required} />
      <input
        id={id}
        name={name}
        type={type}
        defaultValue={defaultValue}
        required={required}
        autoComplete={autoComplete}
        inputMode={inputMode}
        placeholder={placeholder}
        maxLength={maxLength}
        aria-invalid={error ? true : undefined}
        aria-describedby={cn(error && `${id}-e`, help && `${id}-h`) || undefined}
        className="field-input"
      />
      {help && !error && (
        <p id={`${id}-h`} className="field-help">
          {help}
        </p>
      )}
      <ErrorText id={`${id}-e`} error={error} />
    </div>
  );
}

export function TextArea({ name, label, error, help, required, className, defaultValue, rows = 5, maxLength }: Common & { defaultValue?: string; rows?: number; maxLength?: number }) {
  const id = useId();
  const [count, setCount] = useState(defaultValue?.length ?? 0);
  return (
    <div className={className}>
      <Label htmlFor={id} label={label} required={required} />
      <textarea
        id={id}
        name={name}
        rows={rows}
        defaultValue={defaultValue}
        required={required}
        maxLength={maxLength}
        onChange={(e) => setCount(e.target.value.length)}
        aria-invalid={error ? true : undefined}
        aria-describedby={cn(error && `${id}-e`, help && `${id}-h`) || undefined}
        className="field-input resize-y"
      />
      <div className="flex justify-between gap-4">
        {help && !error ? (
          <p id={`${id}-h`} className="field-help">
            {help}
          </p>
        ) : (
          <span />
        )}
        {maxLength && <p className="field-help tabular-nums">{count}/{maxLength}</p>}
      </div>
      <ErrorText id={`${id}-e`} error={error} />
    </div>
  );
}

export function SelectField({ name, label, error, help, required, className, defaultValue, options, placeholder = "Selecione" }: Common & { defaultValue?: string; options: { value: string; label: string }[]; placeholder?: string }) {
  const id = useId();
  return (
    <div className={className}>
      <Label htmlFor={id} label={label} required={required} />
      <select
        id={id}
        name={name}
        defaultValue={defaultValue ?? ""}
        required={required}
        aria-invalid={error ? true : undefined}
        aria-describedby={cn(error && `${id}-e`, help && `${id}-h`) || undefined}
        className="field-input appearance-none bg-[url('data:image/svg+xml;utf8,<svg xmlns=%22http://www.w3.org/2000/svg%22 width=%2212%22 height=%2212%22 viewBox=%220 0 24 24%22 fill=%22none%22 stroke=%22%230b0b0c%22 stroke-width=%222%22><path d=%22m6 9 6 6 6-6%22/></svg>')] bg-[length:14px] bg-[right_1rem_center] bg-no-repeat pr-10"
      >
        <option value="" disabled>
          {placeholder}
        </option>
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
      {help && !error && (
        <p id={`${id}-h`} className="field-help">
          {help}
        </p>
      )}
      <ErrorText id={`${id}-e`} error={error} />
    </div>
  );
}

export function RadioGroup({ name, label, error, required, className, defaultValue, options }: Common & { defaultValue?: string; options: string[] }) {
  const id = useId();
  return (
    <fieldset className={className} aria-describedby={error ? `${id}-e` : undefined}>
      <legend className="field-label">
        {label}
        {required ? <span className="text-signal" aria-hidden="true"> *</span> : <span className="font-normal text-steel"> (opcional)</span>}
      </legend>
      <div className="flex flex-wrap gap-2">
        {options.map((o) => (
          <label key={o} className="relative">
            <input type="radio" name={name} value={o} defaultChecked={defaultValue === o} required={required} className="peer sr-only" />
            <span className="inline-flex h-11 cursor-pointer items-center rounded-full border border-ink/15 bg-white px-5 text-sm font-medium transition-colors peer-checked:border-accent-deep peer-checked:bg-accent-deep peer-checked:text-white peer-focus-visible:ring-4 peer-focus-visible:ring-accent/30">
              {o}
            </span>
          </label>
        ))}
      </div>
      <ErrorText id={`${id}-e`} error={error} />
    </fieldset>
  );
}

export function CheckboxGroup({ name, label, error, className, defaultValues = [], options, required }: Common & { defaultValues?: string[]; options: string[] }) {
  const id = useId();
  return (
    <fieldset className={className} aria-describedby={error ? `${id}-e` : undefined}>
      <legend className="field-label">
        {label}
        {required && <span className="text-signal" aria-hidden="true"> *</span>}
      </legend>
      <div className="flex flex-wrap gap-2">
        {options.map((o) => (
          <label key={o} className="relative">
            <input type="checkbox" name={name} value={o} defaultChecked={defaultValues.includes(o)} className="peer sr-only" />
            <span className="inline-flex min-h-11 cursor-pointer items-center rounded-full border border-ink/15 bg-white px-4 py-2 text-sm font-medium transition-colors peer-checked:border-accent-deep peer-checked:bg-accent-deep peer-checked:text-white peer-focus-visible:ring-4 peer-focus-visible:ring-accent/30">
              {o}
            </span>
          </label>
        ))}
      </div>
      <ErrorText id={`${id}-e`} error={error} />
    </fieldset>
  );
}

export function ConsentCheckbox({ name = "consent", error, children }: { name?: string; error?: string; children: ReactNode }) {
  const id = useId();
  return (
    <div>
      <div className="flex gap-3">
        <input
          id={id}
          type="checkbox"
          name={name}
          required
          aria-invalid={error ? true : undefined}
          aria-describedby={error ? `${id}-e` : undefined}
          className="mt-0.5 h-5 w-5 shrink-0 cursor-pointer rounded border-ink/30 accent-[var(--color-accent)]"
        />
        <label htmlFor={id} className="cursor-pointer text-sm leading-relaxed text-ink-2">
          {children}
        </label>
      </div>
      <ErrorText id={`${id}-e`} error={error} />
    </div>
  );
}

const ACCEPT_RESUME = ".pdf,.doc,.docx,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document";

export function FileField({ name, label, error, help, required, className, maxMb, accept = ACCEPT_RESUME, extensions = ["pdf", "doc", "docx"] }: Common & { maxMb: number; accept?: string; extensions?: string[] }) {
  const id = useId();
  const input = useRef<HTMLInputElement>(null);
  const [file, setFile] = useState<File | null>(null);
  const [localError, setLocalError] = useState<string | null>(null);
  const [drag, setDrag] = useState(false);
  const shownError = localError ?? error;

  const validate = (f: File | null) => {
    setFile(f);
    if (!f) return setLocalError(null);
    const ext = f.name.split(".").pop()?.toLowerCase() ?? "";
    if (!extensions.includes(ext)) setLocalError(`Formato não permitido. Envie ${extensions.map((e) => e.toUpperCase()).join(", ")}.`);
    else if (f.size > maxMb * 1024 * 1024) setLocalError(`O arquivo tem ${(f.size / 1024 / 1024).toFixed(1)} MB. O limite é ${maxMb} MB.`);
    else setLocalError(null);
  };

  return (
    <div className={className}>
      <Label htmlFor={id} label={label} required={required} />
      <div
        onDragOver={(e) => {
          e.preventDefault();
          setDrag(true);
        }}
        onDragLeave={() => setDrag(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDrag(false);
          const f = e.dataTransfer.files?.[0];
          if (f && input.current) {
            const dt = new DataTransfer();
            dt.items.add(f);
            input.current.files = dt.files;
            validate(f);
          }
        }}
        className={cn(
          "relative flex flex-col items-center justify-center gap-2 rounded-2xl border-2 border-dashed px-6 py-8 text-center transition-colors",
          drag ? "border-accent bg-accent/5" : shownError ? "border-signal/60 bg-signal/5" : file ? "border-ok/50 bg-ok/5" : "border-ink/15 bg-white hover:border-ink/35",
        )}
      >
        {file && !shownError ? <CheckCircle2 className="h-7 w-7 text-ok" aria-hidden="true" /> : <FileUp className="h-7 w-7 text-steel" aria-hidden="true" />}
        <p className="text-sm">
          {file ? (
            <span className="font-medium">{file.name}</span>
          ) : (
            <>
              <span className="font-medium underline decoration-accent underline-offset-4">Escolha um arquivo</span> ou arraste aqui
            </>
          )}
        </p>
        <p className="text-xs text-steel">
          {extensions.map((e) => e.toUpperCase()).join(", ")} · até {maxMb} MB
        </p>
        <input
          ref={input}
          id={id}
          name={name}
          type="file"
          accept={accept}
          required={required}
          onChange={(e) => validate(e.target.files?.[0] ?? null)}
          aria-invalid={shownError ? true : undefined}
          aria-describedby={cn(shownError && `${id}-e`, help && `${id}-h`) || undefined}
          className="absolute inset-0 cursor-pointer opacity-0"
        />
        {file && (
          <button
            type="button"
            className="relative z-10 mt-1 inline-flex items-center gap-1 text-xs text-steel hover:text-ink"
            onClick={() => {
              if (input.current) input.current.value = "";
              validate(null);
            }}
          >
            <X className="h-3.5 w-3.5" aria-hidden="true" /> Remover arquivo
          </button>
        )}
      </div>
      {help && !shownError && (
        <p id={`${id}-h`} className="field-help">
          {help}
        </p>
      )}
      <ErrorText id={`${id}-e`} error={shownError ?? undefined} />
    </div>
  );
}

/** Anti-spam: hidden honeypot + signed render timestamp (+ optional Turnstile). */
export function SpamGuard({ token, turnstileSiteKey }: { token: string; turnstileSiteKey?: string }) {
  return (
    <>
      <input type="hidden" name="_t" value={token} />
      <div aria-hidden="true" className="absolute -left-[9999px] h-px w-px overflow-hidden">
        <label>
          Não preencha este campo
          <input type="text" name="website" tabIndex={-1} autoComplete="off" defaultValue="" />
        </label>
      </div>
      {turnstileSiteKey && (
        <>
          <Script src="https://challenges.cloudflare.com/turnstile/v0/api.js" async defer />
          <div className="cf-turnstile" data-sitekey={turnstileSiteKey} data-language="pt-br" />
        </>
      )}
    </>
  );
}

export function FormAlert({ message }: { message?: string }) {
  if (!message) return null;
  return (
    <div role="alert" className="flex items-start gap-3 rounded-2xl border border-signal/30 bg-signal/5 p-4 text-sm text-signal">
      <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
      <p>{message}</p>
    </div>
  );
}
