import Link from "next/link";
import type { ComponentProps, ReactNode } from "react";
import { ArrowUpRight } from "lucide-react";
import { cn } from "@/lib/cn";

type Variant = "primary" | "secondary" | "ghost" | "light" | "accent";
type Size = "md" | "lg" | "sm";

const base =
  "group/btn relative inline-flex items-center justify-center gap-2 rounded-full font-medium tracking-[-0.01em] transition-[background-color,color,border-color,transform,box-shadow] duration-300 ease-[cubic-bezier(.16,1,.3,1)] active:scale-[0.97] disabled:pointer-events-none disabled:opacity-50 select-none";
const variants: Record<Variant, string> = {
  primary: "bg-accent text-white hover:bg-accent-deep hover:shadow-[0_12px_30px_-12px_rgb(10_133_57/0.7)]",
  accent: "bg-accent text-white ring-1 ring-lime/0 hover:bg-accent-deep hover:ring-lime/60 hover:shadow-[0_12px_30px_-12px_rgb(166_226_46/0.6)]",
  secondary: "border border-ink/15 bg-white/60 text-ink backdrop-blur hover:border-accent hover:bg-white hover:text-accent-deep",
  ghost: "text-ink hover:bg-ink/5",
  light: "bg-white text-accent-deep hover:bg-lime hover:text-ink",
};
const sizes: Record<Size, string> = {
  sm: "h-9 px-4 text-sm",
  md: "h-11 px-5 text-[0.95rem]",
  lg: "h-14 px-7 text-base",
};

export function buttonClass(variant: Variant = "primary", size: Size = "md", className?: string) {
  return cn(base, variants[variant], sizes[size], className);
}

function Arrow() {
  return (
    <span className="relative -mr-1 inline-flex h-5 w-5 items-center justify-center overflow-hidden" aria-hidden="true">
      <ArrowUpRight className="h-4 w-4 transition-transform duration-500 ease-[cubic-bezier(.16,1,.3,1)] group-hover/btn:-translate-y-5 group-hover/btn:translate-x-5" />
      <ArrowUpRight className="absolute h-4 w-4 -translate-x-5 translate-y-5 transition-transform duration-500 ease-[cubic-bezier(.16,1,.3,1)] group-hover/btn:translate-x-0 group-hover/btn:translate-y-0" />
    </span>
  );
}

export function ButtonLink({
  href,
  children,
  variant,
  size,
  className,
  arrow = false,
  ...rest
}: { href: string; children: ReactNode; variant?: Variant; size?: Size; className?: string; arrow?: boolean } & Omit<ComponentProps<typeof Link>, "href" | "className">) {
  const external = /^https?:\/\//.test(href);
  if (external) {
    return (
      <a href={href} target="_blank" rel="noopener noreferrer" className={buttonClass(variant, size, className)}>
        {children}
        {arrow && <Arrow />}
        <span className="sr-only"> (abre em nova aba)</span>
      </a>
    );
  }
  return (
    <Link href={href} className={buttonClass(variant, size, className)} {...rest}>
      {children}
      {arrow && <Arrow />}
    </Link>
  );
}

export function Button({ variant, size, className, children, ...rest }: { variant?: Variant; size?: Size } & ComponentProps<"button">) {
  return (
    <button className={buttonClass(variant, size, className)} {...rest}>
      {children}
    </button>
  );
}

export function Spinner({ className }: { className?: string }) {
  return (
    <span className={cn("inline-block h-4 w-4 animate-spin rounded-full border-2 border-current border-r-transparent", className)} role="status" aria-label="Carregando" />
  );
}
