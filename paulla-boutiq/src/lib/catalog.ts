import { PRODUCTS } from "@/data/catalog";
import { CATEGORY_IDS, SILHOUETTES, STYLE_IDS, type MediaAsset, type Product } from "@/types/catalog";

const isObj = (v: unknown): v is Record<string, unknown> => typeof v === "object" && v !== null && !Array.isArray(v);
const isStr = (v: unknown): v is string => typeof v === "string" && v.trim().length > 0;
const isStrArr = (v: unknown): v is string[] => Array.isArray(v) && v.every(isStr);
const HEX = /^#(?:[0-9a-f]{3}){1,2}$/i;

function isMedia(v: unknown): v is MediaAsset {
  if (!isObj(v) || !isStr(v.alt) || !isObj(v.art)) return false;
  const { tones, silhouette } = v.art;
  return (
    Array.isArray(tones) &&
    tones.length === 3 &&
    tones.every((t) => typeof t === "string" && HEX.test(t)) &&
    (SILHOUETTES as readonly unknown[]).includes(silhouette) &&
    (v.src === undefined || typeof v.src === "string")
  );
}

/** Valida um item vindo de fonte externa. Itens inválidos são descartados (sem derrubar a vitrine). */
export function isProduct(v: unknown): v is Product {
  if (!isObj(v)) return false;
  const media = v.media;
  return (
    isStr(v.id) &&
    isStr(v.name) &&
    (CATEGORY_IDS as readonly unknown[]).includes(v.category) &&
    Array.isArray(v.styles) &&
    v.styles.every((s) => (STYLE_IDS as readonly unknown[]).includes(s)) &&
    ["disponivel", "ultimas", "sob-encomenda"].includes(v.availability as string) &&
    isStr(v.shortDescription) &&
    isStr(v.description) &&
    isStrArr(v.details) &&
    isStrArr(v.sizes) &&
    Array.isArray(v.colors) &&
    v.colors.every((c) => isObj(c) && isStr(c.name) && typeof c.hex === "string" && HEX.test(c.hex)) &&
    (v.priceCents === undefined || v.priceCents === null || (typeof v.priceCents === "number" && v.priceCents >= 0)) &&
    isObj(media) &&
    isMedia(media.primary) &&
    isMedia(media.detail)
  );
}

export class CatalogError extends Error {}

/**
 * Carrega o catálogo remoto (se configurado) com timeout e validação.
 * Sem URL configurada, resolve imediatamente com o catálogo local.
 */
export async function fetchCatalog(url: string | null, signal?: AbortSignal, timeoutMs = 8000): Promise<{ data: readonly Product[]; source: "remote" | "local" }> {
  if (!url) return { data: PRODUCTS, source: "local" };

  const timeout = AbortSignal.timeout(timeoutMs);
  const combined = signal ? AbortSignal.any([signal, timeout]) : timeout;

  let res: Response;
  try {
    res = await fetch(url, { signal: combined, headers: { Accept: "application/json" } });
  } catch (err) {
    if (signal?.aborted) throw err;
    throw new CatalogError(timeout.aborted ? "O catálogo demorou para responder." : "Não foi possível conectar ao catálogo.");
  }
  if (!res.ok) throw new CatalogError(`O catálogo respondeu com erro (${res.status}).`);

  let json: unknown;
  try {
    json = await res.json();
  } catch {
    throw new CatalogError("O catálogo retornou um formato inválido.");
  }
  const list = Array.isArray(json) ? json : isObj(json) && Array.isArray(json.products) ? json.products : null;
  if (!list) throw new CatalogError("O catálogo retornou um formato inválido.");

  const seen = new Set<string>();
  const valid = list.filter((p): p is Product => {
    if (!isProduct(p) || seen.has(p.id)) return false;
    seen.add(p.id);
    return true;
  });
  if (import.meta.env.DEV && valid.length < list.length) {
    console.warn(`[catálogo] ${list.length - valid.length} item(ns) ignorado(s) por formato inválido.`);
  }
  return { data: valid, source: "remote" };
}

/** Normaliza texto para busca sem acentos/caixa. */
export const normalize = (s: string) =>
  s
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .toLowerCase()
    .trim();
