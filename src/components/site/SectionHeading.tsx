import type { ReactNode } from "react";
import { cn } from "@/lib/cn";
import { Reveal } from "./Reveal";

export function SectionHeading({
  eyebrow,
  title,
  subtitle,
  aside,
  className,
  as: H = "h2",
  dark = false,
}: {
  eyebrow?: string;
  title: string;
  subtitle?: string;
  aside?: ReactNode;
  className?: string;
  as?: "h1" | "h2";
  dark?: boolean;
}) {
  return (
    <div className={cn("grid gap-6 md:grid-cols-12 md:items-end", className)}>
      <Reveal className="md:col-span-8">
        {eyebrow && <p className="eyebrow mb-5">{eyebrow}</p>}
        <H className={cn(H === "h1" ? "text-h1" : "text-h2", "font-semibold", dark ? "text-white" : "text-ink")}>{title}</H>
        {subtitle && <p className={cn("mt-5 max-w-2xl text-lg leading-relaxed", dark ? "text-white/65" : "text-steel")}>{subtitle}</p>}
      </Reveal>
      {aside && <Reveal className="md:col-span-4 md:justify-self-end" delay={0.1}>{aside}</Reveal>}
    </div>
  );
}
