/* eslint-disable @next/next/no-img-element */
import { cn } from "@/lib/cn";
import type { ImageValue } from "@/lib/content/fields";

/**
 * Provisional typographic wordmark. When an official logo is uploaded in
 * Admin › Configurações › Identidade it replaces this automatically.
 */
export function Logo({ logo, className, inverted = false }: { logo?: ImageValue; className?: string; inverted?: boolean }) {
  if (logo?.src) return <img src={logo.src} alt={logo.alt || "PETROLUB"} className={cn("h-8 w-auto", className)} />;
  return (
    <span className={cn("inline-flex items-center gap-2", inverted ? "text-white" : "text-ink", className)}>
      <svg viewBox="0 0 24 30" className="h-7 w-auto" aria-hidden="true">
        <defs>
          <linearGradient id="ptl-drop" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0" stopColor={inverted ? "#ffffff" : "#0a8539"} />
            <stop offset="1" stopColor={inverted ? "#d8f3b0" : "#0a3d22"} />
          </linearGradient>
        </defs>
        <path d="M12 1C12 1 2 13.2 2 19.4 2 25 6.5 29 12 29s10-4 10-9.6C22 13.2 12 1 12 1Z" fill="url(#ptl-drop)" />
        <path d="M7.2 19.5c.3 2.7 2.2 4.6 4.8 5" stroke="var(--color-lime)" strokeWidth="2" strokeLinecap="round" fill="none" />
      </svg>
      <span className="font-display text-[1.15rem] font-extrabold tracking-[-0.02em]">PETROLUB</span>
      <span className="sr-only">— página inicial</span>
    </span>
  );
}
