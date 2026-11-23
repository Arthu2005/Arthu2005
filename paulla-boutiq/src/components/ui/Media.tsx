import { useState } from "react";
import { cn } from "@/lib/cn";
import type { MediaAsset } from "@/types/catalog";
import { Silhouette } from "./Silhouette";

interface MediaProps {
  asset: MediaAsset;
  /** Classe de proporção (ex.: "aspect-[3/4]"). Evita layout shift. Use "" quando o pai define a altura. */
  ratio?: string;
  className?: string;
  imgClassName?: string;
  /** true para mídia acima da dobra (LCP). */
  priority?: boolean;
  sizes?: string;
  /** Escala da ilustração do placeholder. */
  artScale?: "sm" | "md" | "lg";
  /** Classes de alinhamento da ilustração no placeholder (ex.: deslocar para a direita no hero). */
  artLayout?: string;
}

/**
 * Mídia com proporção fixa, skeleton enquanto carrega e fallback de direção de arte
 * quando não há `src` ou a imagem falha.
 */
export function Media({ asset, ratio = "aspect-[3/4]", className, imgClassName, priority, sizes, artScale = "md", artLayout }: MediaProps) {
  const [status, setStatus] = useState<"loading" | "loaded" | "error">(asset.src ? "loading" : "error");
  const showArt = !asset.src || status === "error";

  return (
    <div className={cn("relative overflow-hidden bg-surface", ratio, className)}>
      {showArt ? (
        <ArtPlaceholder asset={asset} scale={artScale} layout={artLayout} />
      ) : (
        <>
          {status === "loading" && (
            <div aria-hidden className="absolute inset-0 animate-shimmer bg-[linear-gradient(100deg,var(--c-surface)_30%,var(--c-surface-2)_50%,var(--c-surface)_70%)] bg-[length:200%_100%]" />
          )}
          <img
            src={asset.src}
            srcSet={asset.srcSet}
            sizes={sizes}
            alt={asset.alt}
            loading={priority ? "eager" : "lazy"}
            fetchPriority={priority ? "high" : "auto"}
            decoding="async"
            onLoad={() => setStatus("loaded")}
            onError={() => setStatus("error")}
            style={{ objectPosition: asset.focal }}
            className={cn("absolute inset-0 h-full w-full object-cover transition-opacity duration-700 ease-editorial", status === "loaded" ? "opacity-100" : "opacity-0", imgClassName)}
          />
        </>
      )}
    </div>
  );
}

function ArtPlaceholder({ asset, scale, layout }: { asset: MediaAsset; scale: "sm" | "md" | "lg"; layout?: string }) {
  const [light, mid, deep] = asset.art.tones;
  return (
    <div
      role="img"
      aria-label={asset.alt}
      className={cn("grain absolute inset-0 flex", layout ?? "items-center justify-center")}
      style={{
        color: asset.art.ink ?? "rgb(28 23 20 / 0.5)",
        background: `radial-gradient(120% 80% at 30% 18%, ${light} 0%, transparent 60%), linear-gradient(165deg, ${light} 0%, ${mid} 58%, ${deep} 100%)`,
      }}
    >
      {/* Luz de estúdio */}
      <div aria-hidden className="absolute inset-x-[12%] bottom-[6%] h-[10%] rounded-[50%] bg-black/10 blur-xl" />
      <Silhouette
        id={asset.art.silhouette}
        className={cn("relative h-auto drop-shadow-[0_1px_0_rgba(255,255,255,0.25)]", { sm: "w-[46%]", md: "w-[58%]", lg: "w-[min(42%,22rem)]" }[scale])}
      />
      <span aria-hidden className="absolute bottom-3 left-3 font-display text-[0.7rem] italic">
        PB
      </span>
    </div>
  );
}
