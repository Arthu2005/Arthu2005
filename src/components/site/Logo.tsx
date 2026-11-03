/* eslint-disable @next/next/no-img-element */
import { cn } from "@/lib/cn";
import type { ImageValue } from "@/lib/content/fields";

/**
 * Official PETROLUB logo (from the company's own channels): full-colour version on light backgrounds,
 * white version on dark ones. A logo uploaded in Admin › Configurações › Identidade replaces the colour version.
 */
export function Logo({ logo, className, inverted = false }: { logo?: ImageValue; className?: string; inverted?: boolean }) {
  const src = inverted ? "/brand/logo-petrolub-white.webp" : logo?.src || "/brand/logo-petrolub.webp";
  return (
    <img
      src={src}
      alt={logo?.alt || "PETROLUB Industrial de Lubrificantes"}
      width={638}
      height={200}
      decoding="async"
      className={cn("h-9 w-auto md:h-10", className)}
    />
  );
}
