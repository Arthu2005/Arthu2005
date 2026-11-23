/**
 * Contratos de dados da vitrine.
 * Toda informação exibida vem destes tipos — um catálogo remoto (VITE_CATALOG_URL)
 * precisa respeitar o mesmo formato e é validado em runtime por lib/catalog.ts.
 */

export const CATEGORY_IDS = ["vestidos", "alfaiataria", "camisaria", "trico", "acessorios"] as const;
export type CategoryId = (typeof CATEGORY_IDS)[number];

export const STYLE_IDS = ["essencial", "noite", "resort"] as const;
export type StyleId = (typeof STYLE_IDS)[number];

export const SILHOUETTES = ["dress", "gown", "blazer", "top", "trousers", "skirt", "bag", "jewel", "knit", "shoe", "vest"] as const;
export type Silhouette = (typeof SILHOUETTES)[number];

export type Availability = "disponivel" | "ultimas" | "sob-encomenda";
export type Badge = "Peça única" | "Edição limitada" | "Curadoria" | "Novo";

/** Direção de arte usada quando a fotografia real ainda não foi enviada ou falhou ao carregar. */
export interface ArtDirection {
  /** Três tons do tecido/cenário, do mais claro ao mais profundo. */
  tones: readonly [string, string, string];
  silhouette: Silhouette;
  /** Cor do traço da ilustração (padrão: tinta suave). */
  ink?: string;
}

export interface MediaAsset {
  /** Caminho da fotografia (ex.: /media/produtos/aurora-1.jpg). Opcional: sem ele, a arte é exibida. */
  src?: string;
  /** srcset opcional para imagens responsivas. */
  srcSet?: string;
  alt: string;
  /** object-position da foto (ex.: "50% 20%"). */
  focal?: string;
  art: ArtDirection;
}

export interface ColorOption {
  name: string;
  hex: string;
}

export interface Product {
  id: string;
  name: string;
  category: CategoryId;
  styles: readonly StyleId[];
  badge?: Badge;
  /** Valor em centavos. null/ausente = "Valor sob consulta". */
  priceCents?: number | null;
  availability: Availability;
  shortDescription: string;
  description: string;
  /** Composição, caimento e cuidados. */
  details: readonly string[];
  sizes: readonly string[];
  colors: readonly ColorOption[];
  media: {
    primary: MediaAsset;
    detail: MediaAsset;
  };
}

export interface Highlight {
  id: string;
  kicker: string;
  title: string;
  text: string;
  specs: readonly { label: string; value: string }[];
  productId?: string;
  media: MediaAsset;
}

export type LoadState<T> =
  | { status: "loading" }
  | { status: "error"; error: string; fallback: T }
  | { status: "ready"; data: T; source: "remote" | "local" };
