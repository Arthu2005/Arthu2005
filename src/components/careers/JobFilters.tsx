"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useEffect, useRef, useState, useTransition } from "react";
import { Search, SlidersHorizontal, X } from "lucide-react";
import { cn } from "@/lib/cn";
import { Spinner } from "@/components/ui/Button";

type Facets = { areas: string[]; locations: string[]; contracts: string[]; models: string[] };
const MODEL_LABELS: Record<string, string> = { presencial: "Presencial", hibrido: "Híbrido", remoto: "Remoto" };

/**
 * Works without JavaScript (plain GET form). With JS, filters update the URL instantly
 * (debounced search), keeping results shareable and the back button meaningful.
 */
export function JobFilters({ facets, total }: { facets: Facets; total: number }) {
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();
  const [pending, start] = useTransition();
  const [q, setQ] = useState(params.get("q") ?? "");
  const [open, setOpen] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const update = (key: string, value: string) => {
    const next = new URLSearchParams(params.toString());
    if (value) next.set(key, value);
    else next.delete(key);
    next.delete("pagina");
    start(() => router.replace(`${pathname}${next.size ? `?${next}` : ""}`, { scroll: false }));
  };

  useEffect(() => () => {
    if (timer.current) clearTimeout(timer.current);
  }, []);

  const active = ["area", "local", "modelo", "contrato"].filter((k) => params.get(k)).length + (params.get("q") ? 1 : 0);

  const select = (name: string, label: string, options: { value: string; label: string }[]) => (
    <div>
      <label htmlFor={`f-${name}`} className="mb-1.5 block text-xs font-semibold uppercase tracking-[0.14em] text-steel">
        {label}
      </label>
      <select
        id={`f-${name}`}
        name={name}
        value={params.get(name) ?? ""}
        onChange={(e) => update(name, e.target.value)}
        className="field-input appearance-none bg-[url('data:image/svg+xml;utf8,<svg xmlns=%22http://www.w3.org/2000/svg%22 width=%2212%22 height=%2212%22 viewBox=%220 0 24 24%22 fill=%22none%22 stroke=%22%230b0b0c%22 stroke-width=%222%22><path d=%22m6 9 6 6 6-6%22/></svg>')] bg-[length:14px] bg-[right_1rem_center] bg-no-repeat py-2.5 pr-10"
      >
        <option value="">Todas</option>
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
    </div>
  );

  return (
    <form
      action={pathname}
      method="get"
      role="search"
      aria-label="Filtrar vagas"
      onSubmit={(e) => {
        e.preventDefault();
        update("q", q.trim());
      }}
      className="rounded-[var(--radius-card)] border border-line bg-white p-4 md:p-5"
    >
      <div className="flex gap-2">
        <div className="relative flex-1">
          <label htmlFor="f-q" className="sr-only">
            Buscar por palavra-chave
          </label>
          <Search className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-steel" aria-hidden="true" />
          <input
            id="f-q"
            name="q"
            type="search"
            value={q}
            placeholder="Cargo, área ou palavra-chave"
            onChange={(e) => {
              const val = e.target.value;
              setQ(val);
              if (timer.current) clearTimeout(timer.current);
              timer.current = setTimeout(() => update("q", val.trim()), 350);
            }}
            className="field-input pl-12"
            autoComplete="off"
          />
        </div>
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          aria-expanded={open}
          aria-controls="job-filter-panel"
          className="inline-flex h-[50px] items-center gap-2 rounded-xl border border-line px-4 text-sm font-medium md:hidden"
        >
          <SlidersHorizontal className="h-4 w-4" aria-hidden="true" />
          Filtros{active ? ` (${active})` : ""}
        </button>
      </div>
      <div id="job-filter-panel" className={cn("mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-4", open ? "grid" : "hidden md:grid")}>
        {select("area", "Área", facets.areas.map((a) => ({ value: a, label: a })))}
        {select(
          "local",
          "Localização",
          facets.locations.map((l) => {
            const [c, u] = l.split("|");
            return { value: l, label: `${c} — ${u}` };
          }),
        )}
        {select("modelo", "Modelo", facets.models.map((m) => ({ value: m, label: MODEL_LABELS[m] ?? m })))}
        {select("contrato", "Contratação", facets.contracts.map((c) => ({ value: c, label: c })))}
      </div>
      <noscript>
        <button type="submit" className="mt-4 rounded-full bg-accent px-5 py-2 text-white">
          Filtrar
        </button>
      </noscript>
      <div className="mt-4 flex min-h-6 items-center justify-between gap-4 text-sm">
        <p aria-live="polite" className="flex items-center gap-2 text-steel">
          {pending ? (
            <>
              <Spinner className="h-3.5 w-3.5" /> Atualizando…
            </>
          ) : (
            <>
              <strong className="text-ink">{total}</strong> {total === 1 ? "vaga encontrada" : "vagas encontradas"}
            </>
          )}
        </p>
        {active > 0 && (
          <button
            type="button"
            className="inline-flex items-center gap-1 font-medium text-ink hover:underline"
            onClick={() => {
              setQ("");
              start(() => router.replace(pathname, { scroll: false }));
            }}
          >
            <X className="h-4 w-4" aria-hidden="true" /> Limpar filtros
          </button>
        )}
      </div>
    </form>
  );
}
