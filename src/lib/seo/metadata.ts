import "server-only";
import type { Metadata } from "next";
import { env } from "@/lib/env";
import { getAllSettings, getPage, img, s } from "@/lib/content/queries";

/** Builds per-page metadata from the page's editable "seo" section, with sensible fallbacks. */
export async function pageMetadata(page: string, fallback: { title: string; description?: string; path: string }): Promise<Metadata> {
  const [{ seo: seoDefaults }, sections] = await Promise.all([getAllSettings(), getPage(page)]);
  const seo = sections.seo;
  const title = s(seo, "title") || fallback.title;
  const description = s(seo, "description") || fallback.description || s(seoDefaults, "defaultDescription");
  const image = img(seo, "image").src || img(seoDefaults, "ogImage").src;
  return {
    title,
    description,
    alternates: { canonical: fallback.path },
    openGraph: { title, description, url: fallback.path, type: "website", locale: "pt_BR", siteName: "PETROLUB", ...(image ? { images: [{ url: image }] } : {}) },
    twitter: { card: image ? "summary_large_image" : "summary", title, description },
  };
}

export const siteUrl = () => env.APP_URL.replace(/\/$/, "");
