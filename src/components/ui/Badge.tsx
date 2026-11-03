import type { ReactNode } from "react";
import { cn } from "@/lib/cn";

export function Badge({ children, tone = "neutral", className }: { children: ReactNode; tone?: "neutral" | "accent" | "dark" | "ok" | "warn" | "danger" | "info"; className?: string }) {
  const tones = {
    neutral: "bg-ink/[0.06] text-ink-2",
    accent: "bg-accent/10 text-accent-ink",
    dark: "bg-accent-deep text-white",
    ok: "bg-accent/10 text-accent-ink",
    warn: "bg-lime/30 text-accent-deep",
    danger: "bg-red-600/10 text-red-800",
    info: "bg-graphite/[0.07] text-graphite",
  };
  return <span className={cn("inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium", tones[tone], className)}>{children}</span>;
}
