import { cn } from "@/lib/cn";

/**
 * Marks content not yet validated by PETROLUB. Rendered only when the global
 * "showProvisionalMarkers" setting is on and the content has provisional=true.
 */
export function Provisional({ show, className, label = "Conteúdo provisório" }: { show: boolean; className?: string; label?: string }) {
  if (!show) return null;
  return (
    <span
      className={cn("inline-flex items-center gap-1.5 rounded-full border border-dashed border-accent/70 bg-accent/10 px-2.5 py-1 text-[0.7rem] font-medium uppercase tracking-wider text-accent-ink", className)}
      title="Aguardando validação da PETROLUB"
    >
      <span className="h-1.5 w-1.5 rounded-full bg-accent" aria-hidden="true" />
      {label}
    </span>
  );
}
