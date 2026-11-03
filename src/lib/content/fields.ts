/**
 * Field DSL shared by the admin editor (renders forms) and the server (validates/coerces input).
 * Pure module: safe to import from client and server.
 */

export type ImageValue = { src: string; alt: string };
export type FileValue = { src: string; name: string };

type Base = { name: string; label: string; help?: string; required?: boolean; max?: number };

export type Field =
  | (Base & { type: "text" | "textarea" | "markdown" | "url" | "color" | "date" })
  | (Base & { type: "number" })
  | (Base & { type: "boolean" })
  | (Base & { type: "list" })
  | (Base & { type: "image" })
  | (Base & { type: "file" })
  | (Base & { type: "select"; options: { value: string; label: string }[] })
  | (Base & { type: "repeater"; fields: Field[]; itemLabel?: string });

/** Fields appended to every section / collection item. Never rendered publicly. */
export const REVIEW_FIELDS: Field[] = [
  {
    name: "provisional",
    label: "Conteúdo provisório",
    type: "boolean",
    help: "Marque enquanto o texto/imagem não for validado pela PETROLUB. O site exibe um selo “provisório” quando a opção global estiver ativa.",
  },
  {
    name: "source",
    label: "Fonte / observação interna",
    type: "textarea",
    help: "Uso interno: de onde veio a informação e quando foi verificada. Não é exibido no site.",
  },
];

const SAFE_URL = /^(https?:\/\/|mailto:|tel:|\/(?!\/)|#)/i;

export function isSafeUrl(v: string) {
  return SAFE_URL.test(v.trim());
}

function str(v: unknown, max: number) {
  if (typeof v !== "string") return "";
  return v.replace(/\u0000/g, "").trim().slice(0, max);
}

function coerceField(f: Field, raw: unknown): unknown {
  switch (f.type) {
    case "text":
      return str(raw, f.max ?? 300);
    case "textarea":
      return str(raw, f.max ?? 2000);
    case "markdown":
      return str(raw, f.max ?? 20000);
    case "date":
      return /^\d{4}-\d{2}-\d{2}$/.test(str(raw, 10)) ? str(raw, 10) : "";
    case "color": {
      const s = str(raw, 7);
      return /^#[0-9a-f]{6}$/i.test(s) ? s : "";
    }
    case "url": {
      const s = str(raw, 1000);
      return s && isSafeUrl(s) ? s : "";
    }
    case "number": {
      const n = Number(raw);
      return Number.isFinite(n) ? n : null;
    }
    case "boolean":
      return raw === true || raw === "true" || raw === "on" || raw === 1;
    case "list":
      return (Array.isArray(raw) ? raw : typeof raw === "string" ? raw.split("\n") : [])
        .map((x) => str(x, f.max ?? 500))
        .filter(Boolean)
        .slice(0, 100);
    case "select": {
      const s = str(raw, 100);
      return f.options.some((o) => o.value === s) ? s : (f.options[0]?.value ?? "");
    }
    case "image": {
      const o = (raw && typeof raw === "object" ? raw : {}) as Record<string, unknown>;
      const src = str(o.src, 1000);
      return { src: src && isSafeUrl(src) ? src : "", alt: str(o.alt, 300) } satisfies ImageValue;
    }
    case "file": {
      const o = (raw && typeof raw === "object" ? raw : {}) as Record<string, unknown>;
      const src = str(o.src, 1000);
      return { src: src && isSafeUrl(src) ? src : "", name: str(o.name, 200) } satisfies FileValue;
    }
    case "repeater":
      return (Array.isArray(raw) ? raw : []).slice(0, 100).map((item) => coerceObject(f.fields, item));
  }
}

export function coerceObject(fields: Field[], raw: unknown): Record<string, unknown> {
  const src = (raw && typeof raw === "object" ? raw : {}) as Record<string, unknown>;
  const out: Record<string, unknown> = {};
  for (const f of fields) out[f.name] = coerceField(f, src[f.name]);
  return out;
}

export function missingRequired(fields: Field[], data: Record<string, unknown>): string[] {
  return fields
    .filter((f) => f.required)
    .filter((f) => {
      const v = data[f.name];
      if (f.type === "image" || f.type === "file") return !(v as ImageValue)?.src;
      if (Array.isArray(v)) return v.length === 0;
      return v === "" || v === null || v === undefined;
    })
    .map((f) => f.label);
}

export function emptyValue(f: Field): unknown {
  switch (f.type) {
    case "number":
      return null;
    case "boolean":
      return false;
    case "list":
    case "repeater":
      return [];
    case "image":
      return { src: "", alt: "" };
    case "file":
      return { src: "", name: "" };
    case "select":
      return f.options[0]?.value ?? "";
    default:
      return "";
  }
}

export function emptyObject(fields: Field[]) {
  return Object.fromEntries(fields.map((f) => [f.name, emptyValue(f)]));
}
