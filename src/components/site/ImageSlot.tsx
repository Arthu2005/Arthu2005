/* eslint-disable @next/next/no-img-element */
import Image from "next/image";
import { cn } from "@/lib/cn";
import type { ImageValue } from "@/lib/content/fields";

/**
 * Renders an editor-managed image or, when none was provided, a designed placeholder that is
 * clearly identified as pending (never a random stock photo presented as real).
 */
export function ImageSlot({
  image,
  className,
  label = "Foto oficial pendente",
  tone = "dark",
  priority = false,
  showLabel = true,
  sizes = "(min-width: 1024px) 50vw, 100vw",
}: {
  image?: ImageValue | null;
  className?: string;
  label?: string;
  tone?: "dark" | "light";
  priority?: boolean;
  showLabel?: boolean;
  /** Rendered width at each breakpoint: the browser uses it to download a file no larger than needed. */
  sizes?: string;
}) {
  if (image?.src) {
    // Files from this site are resized on demand; an external URL typed in the CMS is shown as is.
    const local = image.src.startsWith("/") && !image.src.startsWith("//") && !image.src.endsWith(".svg");
    return (
      <div className={cn("relative overflow-hidden bg-paper-2", className)}>
        {local ? (
          <Image src={image.src} alt={image.alt} fill sizes={sizes} preload={priority} className="object-cover" />
        ) : (
          <img src={image.src} alt={image.alt} loading={priority ? "eager" : "lazy"} decoding="async" className="absolute inset-0 h-full w-full object-cover" />
        )}
      </div>
    );
  }
  const dark = tone === "dark";
  return (
    <div className={cn("relative isolate overflow-hidden", dark ? "bg-graphite text-white/60" : "bg-paper-2 text-steel", className)} role="img" aria-label={`Imagem provisória: ${label}`}>
      <svg className="absolute inset-0 h-full w-full" viewBox="0 0 400 300" preserveAspectRatio="xMidYMid slice" aria-hidden="true">
        <defs>
          <radialGradient id="ptl-ph" cx="70%" cy="30%" r="80%">
            <stop offset="0" stopColor={dark ? "#24352b" : "#ffffff"} />
            <stop offset="1" stopColor={dark ? "#08110c" : "#e2ebe4"} />
          </radialGradient>
        </defs>
        <rect width="400" height="300" fill="url(#ptl-ph)" />
        {Array.from({ length: 9 }).map((_, i) => (
          <path
            key={i}
            d={`M-20 ${200 + i * 14} C 90 ${120 + i * 10}, 210 ${290 - i * 6}, 420 ${150 + i * 12}`}
            fill="none"
            stroke={dark ? "rgba(166,226,46,0.12)" : "rgba(10,61,34,0.09)"}
            strokeWidth="1"
          />
        ))}
        <ellipse cx="300" cy="90" rx="44" ry="48" fill="#020403" opacity="0.9" />
        <ellipse cx="288" cy="74" rx="12" ry="6" fill="#fff" opacity="0.35" />
        <path d="M262 108 q38 32 76 0" stroke="#a6e22e" strokeOpacity="0.45" strokeWidth="2" fill="none" />
      </svg>
      <div className="grain absolute inset-0 opacity-60" aria-hidden="true" />
      {showLabel && (
        <span className={cn("absolute bottom-3 left-3 rounded-full px-2.5 py-1 text-[0.65rem] font-medium uppercase tracking-wider backdrop-blur", dark ? "bg-black/40 text-white/70" : "bg-white/70 text-steel")}>
          {label}
        </span>
      )}
    </div>
  );
}
