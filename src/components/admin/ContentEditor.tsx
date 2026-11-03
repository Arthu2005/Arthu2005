"use client";

/* eslint-disable @next/next/no-img-element */
import { useActionState, useEffect, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { ArrowDown, ArrowUp, FileText, ImageIcon, Plus, Trash2, Upload, X } from "lucide-react";
import { emptyObject, emptyValue, type Field, type FileValue, type ImageValue } from "@/lib/content/fields";
import { listMedia, uploadMedia } from "@/lib/actions/admin/content";
import type { ActionResult } from "@/lib/actions/types";
import { AdminButton, ResultMessage } from "./ActionForm";
import { inputCls, labelCls } from "./ui";

type Data = Record<string, unknown>;
type MediaItem = { id: string; src: string; name: string; alt: string | null; mime: string };

/* ----------------------------------------------------------------------------
 * Media picker (modal): choose from the library or upload a new file inline.
 * ------------------------------------------------------------------------- */
export function MediaPicker({ kind, onPick, onClose }: { kind: "image" | "document"; onPick: (m: MediaItem) => void; onClose: () => void }) {
  const [items, setItems] = useState<MediaItem[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [uploading, startUpload] = useTransition();
  useEffect(() => {
    listMedia(kind).then((r) => (r?.ok ? setItems((r.data?.items as MediaItem[]) ?? []) : setError(r?.message ?? "Erro ao carregar.")));
  }, [kind]);
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [onClose]);

  return (
    <div className="fixed inset-0 z-[80] flex items-center justify-center p-4" role="dialog" aria-modal="true" aria-label="Biblioteca de mídia">
      <button className="absolute inset-0 bg-black/50" onClick={onClose} aria-label="Fechar" />
      <div className="relative flex max-h-[85vh] w-full max-w-3xl flex-col overflow-hidden rounded-2xl bg-white shadow-2xl">
        <header className="flex items-center justify-between border-b border-line px-5 py-4">
          <h2 className="font-semibold">{kind === "image" ? "Escolher imagem" : "Escolher documento (PDF)"}</h2>
          <button onClick={onClose} className="rounded-lg p-1.5 hover:bg-ink/5" aria-label="Fechar">
            <X className="h-5 w-5" />
          </button>
        </header>
        <div className="border-b border-line px-5 py-4">
          <label className="inline-flex cursor-pointer items-center gap-2 rounded-lg border border-dashed border-ink/25 px-4 py-2 text-sm font-medium hover:border-ink/50">
            <Upload className="h-4 w-4" /> {uploading ? "Enviando…" : "Enviar novo arquivo"}
            <input
              type="file"
              className="sr-only"
              accept={kind === "image" ? "image/jpeg,image/png,image/webp,image/avif" : "application/pdf"}
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (!f) return;
                const fd = new FormData();
                fd.set("file", f);
                startUpload(async () => {
                  const r = await uploadMedia(null, fd);
                  if (r?.ok && r.data) onPick(r.data as unknown as MediaItem);
                  else setError(r?.message ?? "Falha no envio.");
                });
              }}
            />
          </label>
          <p className="mt-2 text-xs text-steel">{kind === "image" ? "JPG, PNG, WEBP ou AVIF até 15 MB. Prefira imagens otimizadas (até ~400 KB)." : "PDF até 15 MB."}</p>
          {error && <p className="mt-2 text-sm text-signal">{error}</p>}
        </div>
        <div className="overflow-y-auto p-5">
          {items === null ? (
            <div className="grid grid-cols-3 gap-3 sm:grid-cols-4">
              {Array.from({ length: 8 }).map((_, i) => (
                <div key={i} className="skeleton aspect-square rounded-xl" />
              ))}
            </div>
          ) : items.length === 0 ? (
            <p className="py-8 text-center text-sm text-steel">Nenhum arquivo na biblioteca.</p>
          ) : (
            <ul className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              {items.map((m) => (
                <li key={m.id}>
                  <button type="button" onClick={() => onPick(m)} className="group block w-full overflow-hidden rounded-xl border border-line text-left hover:border-ink">
                    {kind === "image" ? (
                      <img src={m.src} alt={m.alt ?? ""} className="aspect-square w-full object-cover" loading="lazy" />
                    ) : (
                      <span className="flex aspect-square items-center justify-center bg-paper">
                        <FileText className="h-8 w-8 text-steel" />
                      </span>
                    )}
                    <span className="block truncate px-2 py-1.5 text-xs">{m.name}</span>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}

/* ----------------------------------------------------------------------------
 * Generic field renderer
 * ------------------------------------------------------------------------- */
function FieldInput({ field, value, onChange, idPrefix }: { field: Field; value: unknown; onChange: (v: unknown) => void; idPrefix: string }) {
  const id = `${idPrefix}-${field.name}`;
  const [picker, setPicker] = useState(false);
  const label = (
    <label htmlFor={id} className={labelCls}>
      {field.label}
      {field.required && <span className="text-signal"> *</span>}
    </label>
  );
  const help = field.help && <p className="mt-1 text-xs text-steel">{field.help}</p>;

  switch (field.type) {
    case "text":
    case "url":
    case "date":
    case "color":
      return (
        <div>
          {label}
          <div className="flex gap-2">
            {field.type === "color" && <input type="color" value={(value as string) || "#000000"} onChange={(e) => onChange(e.target.value)} className="h-[38px] w-12 rounded-lg border border-line" aria-label={`${field.label} (seletor)`} />}
            <input
              id={id}
              type={field.type === "date" ? "date" : field.type === "url" ? "text" : "text"}
              inputMode={field.type === "url" ? "url" : undefined}
              value={(value as string) ?? ""}
              maxLength={field.max}
              onChange={(e) => onChange(e.target.value)}
              className={inputCls}
              placeholder={field.type === "url" ? "https://… ou /caminho" : undefined}
            />
          </div>
          {help}
        </div>
      );
    case "number":
      return (
        <div>
          {label}
          <input id={id} type="number" value={(value as number) ?? ""} onChange={(e) => onChange(e.target.value === "" ? null : Number(e.target.value))} className={inputCls} />
          {help}
        </div>
      );
    case "textarea":
    case "markdown":
      return (
        <div>
          {label}
          <textarea id={id} rows={field.type === "markdown" ? 8 : 3} value={(value as string) ?? ""} maxLength={field.max} onChange={(e) => onChange(e.target.value)} className={`${inputCls} ${field.type === "markdown" ? "font-mono text-[0.82rem]" : ""}`} />
          {field.type === "markdown" && <p className="mt-1 text-xs text-steel">Formatação: **negrito**, *itálico*, [link](https://…), listas com “- ”, títulos com “### ”. Separe parágrafos com uma linha em branco.</p>}
          {help}
        </div>
      );
    case "boolean":
      return (
        <div>
          <label className="flex items-start gap-2 text-sm">
            <input id={id} type="checkbox" checked={value === true} onChange={(e) => onChange(e.target.checked)} className="mt-0.5" />
            <span>
              <span className="font-medium">{field.label}</span>
              {field.help && <span className="block text-xs text-steel">{field.help}</span>}
            </span>
          </label>
        </div>
      );
    case "select":
      return (
        <div>
          {label}
          <select id={id} value={(value as string) ?? ""} onChange={(e) => onChange(e.target.value)} className={inputCls}>
            {field.options.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
          {help}
        </div>
      );
    case "list":
      return (
        <div>
          {label}
          <textarea id={id} rows={4} value={((value as string[]) ?? []).join("\n")} onChange={(e) => onChange(e.target.value.split("\n"))} className={inputCls} />
          {help ?? <p className="mt-1 text-xs text-steel">Um item por linha.</p>}
        </div>
      );
    case "image": {
      const v = (value as ImageValue) ?? { src: "", alt: "" };
      return (
        <div>
          <span className={labelCls}>{field.label}</span>
          <div className="flex flex-wrap items-start gap-4 rounded-xl border border-line p-3">
            {v.src ? <img src={v.src} alt="" className="h-24 w-32 rounded-lg object-cover" /> : <span className="flex h-24 w-32 items-center justify-center rounded-lg bg-paper text-steel"><ImageIcon className="h-6 w-6" /></span>}
            <div className="min-w-56 flex-1 space-y-2">
              <div className="flex flex-wrap gap-2">
                <AdminButton type="button" variant="secondary" onClick={() => setPicker(true)}>
                  {v.src ? "Trocar imagem" : "Escolher imagem"}
                </AdminButton>
                {v.src && (
                  <AdminButton type="button" variant="ghost" onClick={() => onChange({ src: "", alt: "" })}>
                    Remover
                  </AdminButton>
                )}
              </div>
              <input aria-label={`${field.label}: texto alternativo`} placeholder="Texto alternativo (descreva a imagem)" value={v.alt} onChange={(e) => onChange({ ...v, alt: e.target.value })} className={inputCls} />
            </div>
          </div>
          {help}
          {picker && (
            <MediaPicker
              kind="image"
              onClose={() => setPicker(false)}
              onPick={(m) => {
                onChange({ src: m.src, alt: v.alt || m.alt || "" });
                setPicker(false);
              }}
            />
          )}
        </div>
      );
    }
    case "file": {
      const v = (value as FileValue) ?? { src: "", name: "" };
      return (
        <div>
          <span className={labelCls}>{field.label}</span>
          <div className="flex flex-wrap items-center gap-2 rounded-xl border border-line p-3 text-sm">
            {v.src ? (
              <a href={v.src} target="_blank" className="inline-flex items-center gap-1.5 underline" rel="noreferrer">
                <FileText className="h-4 w-4" /> {v.name || "Documento"}
              </a>
            ) : (
              <span className="text-steel">Nenhum arquivo</span>
            )}
            <AdminButton type="button" variant="secondary" onClick={() => setPicker(true)}>
              {v.src ? "Trocar" : "Escolher PDF"}
            </AdminButton>
            {v.src && (
              <AdminButton type="button" variant="ghost" onClick={() => onChange({ src: "", name: "" })}>
                Remover
              </AdminButton>
            )}
          </div>
          {picker && (
            <MediaPicker
              kind="document"
              onClose={() => setPicker(false)}
              onPick={(m) => {
                onChange({ src: m.src, name: m.name });
                setPicker(false);
              }}
            />
          )}
        </div>
      );
    }
    case "repeater": {
      const arr = (value as Data[]) ?? [];
      const set = (next: Data[]) => onChange(next);
      return (
        <fieldset className="rounded-xl border border-line p-3">
          <legend className="px-1 text-sm font-medium">{field.label}</legend>
          {help}
          <ol className="mt-2 space-y-3">
            {arr.map((item, i) => (
              <li key={i} className="rounded-lg bg-paper p-3">
                <div className="mb-2 flex items-center justify-between">
                  <span className="text-xs font-semibold uppercase tracking-wider text-steel">
                    {field.itemLabel ?? "Item"} {i + 1}
                  </span>
                  <span className="flex gap-1">
                    <AdminButton type="button" variant="ghost" disabled={i === 0} onClick={() => set(arr.map((x, j) => (j === i - 1 ? arr[i]! : j === i ? arr[i - 1]! : x)))} aria-label="Mover para cima">
                      <ArrowUp className="h-3.5 w-3.5" />
                    </AdminButton>
                    <AdminButton type="button" variant="ghost" disabled={i === arr.length - 1} onClick={() => set(arr.map((x, j) => (j === i + 1 ? arr[i]! : j === i ? arr[i + 1]! : x)))} aria-label="Mover para baixo">
                      <ArrowDown className="h-3.5 w-3.5" />
                    </AdminButton>
                    <AdminButton type="button" variant="ghost" onClick={() => set(arr.filter((_, j) => j !== i))} aria-label="Remover item">
                      <Trash2 className="h-3.5 w-3.5 text-signal" />
                    </AdminButton>
                  </span>
                </div>
                <div className="grid gap-3 md:grid-cols-2">
                  {field.fields.map((sub) => (
                    <div key={sub.name} className={sub.type === "textarea" || sub.type === "markdown" || sub.type === "file" ? "md:col-span-2" : undefined}>
                      <FieldInput field={sub} idPrefix={`${id}-${i}`} value={item[sub.name] ?? emptyValue(sub)} onChange={(v) => set(arr.map((x, j) => (j === i ? { ...x, [sub.name]: v } : x)))} />
                    </div>
                  ))}
                </div>
              </li>
            ))}
          </ol>
          <AdminButton type="button" variant="secondary" className="mt-3" onClick={() => set([...arr, emptyObject(field.fields)])}>
            <Plus className="h-4 w-4" /> Adicionar {(field.itemLabel ?? "item").toLowerCase()}
          </AdminButton>
        </fieldset>
      );
    }
  }
}

export function FieldsEditor({ fields, data, onChange, idPrefix }: { fields: Field[]; data: Data; onChange: (d: Data) => void; idPrefix: string }) {
  return (
    <div className="grid gap-4 md:grid-cols-2">
      {fields.map((f) => (
        <div key={f.name} className={["textarea", "markdown", "repeater", "image", "list", "file"].includes(f.type) || f.name === "title" ? "md:col-span-2" : undefined}>
          <FieldInput field={f} idPrefix={idPrefix} value={data[f.name] ?? emptyValue(f)} onChange={(v) => onChange({ ...data, [f.name]: v })} />
        </div>
      ))}
    </div>
  );
}

/**
 * Self-contained editor: renders fields from a schema, keeps state as JSON and submits to a server action.
 * Extra hidden inputs (page/key/collection/id…) identify the record.
 */
export function ContentEditor({
  action,
  fields,
  reviewFields = [],
  initial,
  hidden,
  submitLabel = "Salvar",
  children,
  idPrefix,
}: {
  action: (prev: ActionResult, form: FormData) => Promise<ActionResult>;
  fields: Field[];
  reviewFields?: Field[];
  initial: Data;
  hidden: Record<string, string>;
  submitLabel?: string;
  children?: React.ReactNode;
  idPrefix: string;
}) {
  const [data, setData] = useState<Data>(initial);
  const [result, run, pending] = useActionState(action, null);
  const [dirty, setDirty] = useState(false);
  const [seen, setSeen] = useState<ActionResult>(null);
  const router = useRouter();
  if (result !== seen) {
    setSeen(result);
    if (result?.ok) setDirty(false);
  }
  useEffect(() => {
    if (result?.ok) router.refresh();
  }, [result, router]);
  useEffect(() => {
    if (!dirty) return;
    const h = (e: BeforeUnloadEvent) => e.preventDefault();
    window.addEventListener("beforeunload", h);
    return () => window.removeEventListener("beforeunload", h);
  }, [dirty]);
  const update = (d: Data) => {
    setData(d);
    setDirty(true);
  };
  return (
    <form action={run} className="space-y-5">
      {Object.entries(hidden).map(([k, v]) => (
        <input key={k} type="hidden" name={k} value={v} />
      ))}
      <input type="hidden" name="data" value={JSON.stringify(data)} />
      {children}
      <FieldsEditor fields={fields} data={data} onChange={update} idPrefix={idPrefix} />
      {reviewFields.length > 0 && (
        <details className="rounded-xl border border-dashed border-line p-3">
          <summary className="cursor-pointer text-sm font-medium text-steel">Revisão e fonte (uso interno)</summary>
          <div className="mt-3">
            <FieldsEditor fields={reviewFields} data={data} onChange={update} idPrefix={`${idPrefix}-r`} />
          </div>
        </details>
      )}
      <div className="flex flex-wrap items-center gap-3">
        <AdminButton pending={pending}>{submitLabel}</AdminButton>
        {dirty && <span className="text-xs text-accent-ink">Alterações não salvas</span>}
      </div>
      <ResultMessage result={result} />
    </form>
  );
}
