import "server-only";
import { cache } from "react";
import { and, asc, eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { contentItems, contentSections, settings, type ContentItem } from "@/lib/db/schema";
import { getPageDef } from "./sections";
import { getSettingsDef } from "./settings";
import type { FileValue, ImageValue } from "./fields";

/* Loosely-typed content bag with convenient accessors for templates. */
export type Bag = Record<string, unknown>;

export const s = (b: Bag | undefined, k: string): string => (typeof b?.[k] === "string" ? (b[k] as string) : "");
export const list = (b: Bag | undefined, k: string): string[] => (Array.isArray(b?.[k]) ? (b![k] as string[]) : []);
export const img = (b: Bag | undefined, k: string): ImageValue => {
  const v = b?.[k] as ImageValue | undefined;
  return v && typeof v === "object" ? { src: v.src ?? "", alt: v.alt ?? "" } : { src: "", alt: "" };
};
export const file = (b: Bag | undefined, k: string): FileValue => {
  const v = b?.[k] as FileValue | undefined;
  return v && typeof v === "object" ? { src: v.src ?? "", name: v.name ?? "" } : { src: "", name: "" };
};
export const bool = (b: Bag | undefined, k: string) => b?.[k] === true;
export const rep = (b: Bag | undefined, k: string): Bag[] => (Array.isArray(b?.[k]) ? (b![k] as Bag[]) : []);

/** All sections of a page, DB values merged over code defaults. */
export const getPage = cache(async (page: string): Promise<Record<string, Bag>> => {
  const def = getPageDef(page);
  const rows = await db.select().from(contentSections).where(eq(contentSections.page, page));
  const out: Record<string, Bag> = {};
  for (const sec of def?.sections ?? []) {
    const row = rows.find((r) => r.key === sec.key);
    out[sec.key] = row ? { ...sec.defaults, ...row.data } : { ...sec.defaults };
  }
  return out;
});

export const getSettings = cache(async (key: string): Promise<Bag> => {
  const def = getSettingsDef(key);
  const [row] = await db.select().from(settings).where(eq(settings.key, key)).limit(1);
  return { ...(def?.defaults ?? {}), ...(row?.value ?? {}) };
});

export const getAllSettings = cache(async () => {
  const [general, contact, social, footer, seo, privacy, careers] = await Promise.all(
    ["general", "contact", "social", "footer", "seo", "privacy", "careers"].map((k) => getSettings(k)),
  );
  return { general, contact, social, footer, seo, privacy, careers };
});

export type PublicItem = Omit<ContentItem, "data"> & { data: Bag };

export const getItems = cache(async (collection: string): Promise<PublicItem[]> => {
  return db
    .select()
    .from(contentItems)
    .where(and(eq(contentItems.collection, collection), eq(contentItems.status, "published")))
    .orderBy(asc(contentItems.sortOrder), asc(contentItems.title));
});

export const getItemBySlug = cache(async (collection: string, slug: string): Promise<PublicItem | null> => {
  const [row] = await db
    .select()
    .from(contentItems)
    .where(and(eq(contentItems.collection, collection), eq(contentItems.slug, slug), eq(contentItems.status, "published")))
    .limit(1);
  return row ?? null;
});
