import { cn } from "@/lib/cn";

interface LogoProps {
  className?: string;
  size?: "sm" | "md" | "lg";
  /** Quando false, o logo é decorativo (o link/contexto ao redor já tem nome acessível). */
  labelled?: boolean;
}

/**
 * Wordmark tipográfico provisório da Paulla Boutiq.
 * Para usar o logo oficial, troque o conteúdo por <img src="/media/marca/logo.svg" alt="Paulla Boutiq" />
 * (ou cole o SVG inline usando fill="currentColor" para herdar o tema).
 */
export function Logo({ className, size = "md", labelled = true }: LogoProps) {
  const sizes = {
    sm: { main: "text-[1.35rem]", sub: "text-[0.5rem] tracking-[0.62em]" },
    md: { main: "text-[1.65rem] md:text-[1.85rem]", sub: "text-[0.55rem] tracking-[0.66em]" },
    lg: { main: "text-[clamp(2.75rem,2rem+5vw,5.5rem)]", sub: "text-[clamp(0.7rem,0.6rem+0.6vw,1.05rem)] tracking-[0.7em]" },
  }[size];

  return (
    <span
      className={cn("inline-flex flex-col items-center leading-none select-none", className)}
      role={labelled ? "img" : undefined}
      aria-label={labelled ? "Paulla Boutiq" : undefined}
      aria-hidden={labelled ? undefined : true}
    >
      <span className={cn("font-display font-medium italic tracking-[-0.01em]", sizes.main)} aria-hidden>
        Paulla
      </span>
      <span className={cn("mt-1 pl-[0.66em] font-sans font-medium uppercase", sizes.sub)} aria-hidden>
        Boutiq
      </span>
    </span>
  );
}
