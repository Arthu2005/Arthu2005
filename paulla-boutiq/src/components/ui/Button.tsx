import type { AnchorHTMLAttributes, ButtonHTMLAttributes, ReactNode } from "react";
import { cn } from "@/lib/cn";

type Variant = "solid" | "outline" | "ghost" | "inverse" | "outline-light";
type Size = "md" | "lg";

interface StyleProps {
  variant?: Variant;
  size?: Size;
  icon?: ReactNode;
  /** Ícone desliza levemente no hover (microinteração). */
  iconMotion?: boolean;
}

export function buttonClasses({ variant = "solid", size = "md" }: Pick<StyleProps, "variant" | "size">) {
  return cn(
    "group/btn relative inline-flex min-h-11 items-center justify-center gap-3 rounded-full font-sans font-medium uppercase tracking-[0.16em] whitespace-nowrap",
    "transition-[background-color,color,border-color,transform,box-shadow] duration-300 ease-editorial active:scale-[0.97]",
    "disabled:pointer-events-none disabled:opacity-50",
    size === "md" ? "px-6 text-[0.72rem]" : "min-h-13 px-8 text-[0.75rem]",
    {
      solid: "bg-ink text-canvas hover:bg-accent hover:text-on-accent",
      outline: "border border-current text-ink hover:bg-ink hover:text-canvas",
      ghost: "text-ink hover:bg-surface-2",
      inverse: "bg-[#f7f3ee] text-[#1c1714] hover:bg-white",
      /* Para uso sobre fotografia escura (hero) */
      "outline-light": "border border-[#f7f3ee]/60 text-[#f7f3ee] hover:border-[#f7f3ee] hover:bg-[#f7f3ee] hover:text-[#1c1714]",
    }[variant],
  );
}

function Inner({ children, icon, iconMotion = true }: { children: ReactNode } & StyleProps) {
  return (
    <>
      <span>{children}</span>
      {icon && <span className={cn("inline-flex transition-transform duration-300 ease-editorial", iconMotion && "group-hover/btn:translate-x-1 group-focus-visible/btn:translate-x-1")}>{icon}</span>}
    </>
  );
}

export function Button({ variant, size, icon, iconMotion, className, children, type = "button", ...rest }: ButtonHTMLAttributes<HTMLButtonElement> & StyleProps) {
  return (
    <button type={type} className={cn(buttonClasses({ variant, size }), className)} {...rest}>
      <Inner icon={icon} iconMotion={iconMotion}>
        {children}
      </Inner>
    </button>
  );
}

interface LinkProps extends AnchorHTMLAttributes<HTMLAnchorElement>, StyleProps {
  external?: boolean;
}

export function ButtonLink({ variant, size, icon, iconMotion, className, children, external, ...rest }: LinkProps) {
  return (
    <a className={cn(buttonClasses({ variant, size }), className)} {...(external ? { target: "_blank", rel: "noopener noreferrer" } : {})} {...rest}>
      <Inner icon={icon} iconMotion={iconMotion}>
        {children}
      </Inner>
      {external && <span className="sr-only"> (abre em nova aba)</span>}
    </a>
  );
}
