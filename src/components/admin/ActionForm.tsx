"use client";

import { useActionState, useEffect, useRef, type ReactNode } from "react";
import { useFormStatus } from "react-dom";
import { useRouter } from "next/navigation";
import { AlertCircle, CheckCircle2 } from "lucide-react";
import type { ActionResult } from "@/lib/actions/types";
import { cn } from "@/lib/cn";

/** Wraps a server action form: pending state, inline result message, optional confirm and refresh. */
export function ActionForm({
  action,
  children,
  className,
  confirm,
  refresh = true,
  showMessage = true,
  id,
}: {
  action: (prev: ActionResult, form: FormData) => Promise<ActionResult>;
  children: ReactNode | ((state: { pending: boolean; result: ActionResult }) => ReactNode);
  className?: string;
  confirm?: string;
  refresh?: boolean;
  showMessage?: boolean;
  id?: string;
}) {
  const [result, run, pending] = useActionState(action, null);
  const router = useRouter();
  const last = useRef<ActionResult>(null);
  useEffect(() => {
    if (result && result !== last.current) {
      last.current = result;
      if (result.ok && refresh) router.refresh();
    }
  }, [result, refresh, router]);
  return (
    <form
      id={id}
      action={run}
      className={className}
      onSubmit={(e) => {
        if (confirm && !window.confirm(confirm)) e.preventDefault();
      }}
    >
      {typeof children === "function" ? children({ pending, result }) : children}
      {showMessage && result?.message && <ResultMessage result={result} />}
    </form>
  );
}

export function ResultMessage({ result, className }: { result: ActionResult; className?: string }) {
  if (!result?.message) return null;
  return (
    <p role={result.ok ? "status" : "alert"} className={cn("mt-3 flex items-center gap-2 text-sm", result.ok ? "text-ok" : "text-signal", className)}>
      {result.ok ? <CheckCircle2 className="h-4 w-4" aria-hidden="true" /> : <AlertCircle className="h-4 w-4" aria-hidden="true" />}
      {result.message}
    </p>
  );
}

export function AdminButton({ children, variant = "primary", pending: pendingProp, className, ...rest }: { variant?: "primary" | "secondary" | "danger" | "ghost" | "accent"; pending?: boolean } & React.ComponentProps<"button">) {
  const status = useFormStatus();
  const pending = pendingProp ?? (rest.type !== "button" && status.pending);
  const v = {
    primary: "bg-accent text-white hover:bg-accent-deep",
    accent: "bg-accent-deep text-white hover:bg-accent",
    secondary: "border border-line bg-white hover:border-ink/40",
    danger: "border border-signal/30 bg-white text-signal hover:bg-signal hover:text-white",
    ghost: "hover:bg-ink/5",
  }[variant];
  return (
    <button disabled={pending || rest.disabled} className={cn("inline-flex h-9 items-center justify-center gap-2 rounded-lg px-3.5 text-sm font-medium transition-colors disabled:opacity-50", v, className)} {...rest}>
      {pending && <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-current border-r-transparent" aria-hidden="true" />}
      {children}
    </button>
  );
}
