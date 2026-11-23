import { AnimatePresence, motion, useDragControls, useReducedMotion, type PanInfo } from "motion/react";
import { useEffect, useId, useRef, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { useLockBodyScroll } from "@/hooks/useLockBodyScroll";
import { useMediaQuery } from "@/hooks/useMediaQuery";
import { cn } from "@/lib/cn";
import { DURATION, EASE_EDITORIAL } from "@/lib/motion";

const FOCUSABLE = 'a[href],button:not([disabled]),input:not([disabled]),select:not([disabled]),textarea:not([disabled]),[tabindex]:not([tabindex="-1"])';

interface DialogProps {
  open: boolean;
  onClose: () => void;
  /** Título acessível (pode ser visualmente oculto). */
  title: string;
  description?: string;
  children: ReactNode;
  className?: string;
  /** "sheet" vira gaveta inferior no mobile e painel central no desktop; "drawer" ocupa a tela toda no mobile. */
  variant?: "sheet" | "fullscreen";
  hideTitle?: boolean;
}

/**
 * Modal acessível: foco preso, Esc fecha, foco devolvido ao gatilho, conteúdo de fundo `inert`.
 * No mobile, a gaveta pode ser fechada arrastando para baixo.
 */
export function Dialog({ open, onClose, title, description, children, className, variant = "sheet", hideTitle }: DialogProps) {
  const titleId = useId();
  const descId = useId();
  const panelRef = useRef<HTMLDivElement>(null);
  const reduce = useReducedMotion();
  const dragControls = useDragControls();
  const isDesktop = useMediaQuery("(min-width: 768px)");
  const isSheet = variant === "sheet" && !isDesktop;
  useLockBodyScroll(open);

  useEffect(() => {
    if (!open) return;
    const previouslyFocused = document.activeElement as HTMLElement | null;
    const app = document.getElementById("root");
    app?.setAttribute("inert", "");

    const frame = requestAnimationFrame(() => {
      const panel = panelRef.current;
      const visible = (el: HTMLElement) => el.offsetParent !== null;
      const first =
        [...(panel?.querySelectorAll<HTMLElement>("[data-autofocus]") ?? [])].find(visible) ??
        [...(panel?.querySelectorAll<HTMLElement>(FOCUSABLE) ?? [])].find(visible);
      (first ?? panel)?.focus({ preventScroll: true });
    });

    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        onClose();
        return;
      }
      if (e.key !== "Tab" || !panelRef.current) return;
      const items = [...panelRef.current.querySelectorAll<HTMLElement>(FOCUSABLE)].filter((el) => el.offsetParent !== null);
      if (items.length === 0) return;
      const first = items[0]!;
      const last = items[items.length - 1]!;
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    };
    document.addEventListener("keydown", onKey);
    return () => {
      cancelAnimationFrame(frame);
      document.removeEventListener("keydown", onKey);
      app?.removeAttribute("inert");
      previouslyFocused?.focus?.({ preventScroll: true });
    };
  }, [open, onClose]);

  const onDragEnd = (_: unknown, info: PanInfo) => {
    if (info.offset.y > 120 || info.velocity.y > 600) onClose();
  };

  const panelMotion = reduce
    ? { initial: { opacity: 0 }, animate: { opacity: 1 }, exit: { opacity: 0 } }
    : isSheet
      ? { initial: { y: "100%" }, animate: { y: 0 }, exit: { y: "100%" } }
      : variant === "fullscreen"
        ? { initial: { opacity: 0, y: -12 }, animate: { opacity: 1, y: 0 }, exit: { opacity: 0, y: -12 } }
        : { initial: { opacity: 0, y: 24, scale: 0.98 }, animate: { opacity: 1, y: 0, scale: 1 }, exit: { opacity: 0, y: 16, scale: 0.985 } };

  return createPortal(
    <AnimatePresence>
      {open && (
        <div className={cn("fixed inset-0 z-[80] flex", isSheet ? "items-end" : variant === "fullscreen" ? "items-stretch" : "items-center justify-center p-6 lg:p-10")}>
          <motion.div
            aria-hidden
            className="absolute inset-0 bg-overlay backdrop-blur-[3px]"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: DURATION.ui }}
            onClick={onClose}
          />
          <motion.div
            ref={panelRef}
            role="dialog"
            aria-modal="true"
            aria-labelledby={titleId}
            aria-describedby={description ? descId : undefined}
            tabIndex={-1}
            {...panelMotion}
            transition={{ duration: reduce ? 0.2 : DURATION.scene * 0.75, ease: EASE_EDITORIAL }}
            drag={isSheet && !reduce ? "y" : false}
            dragConstraints={{ top: 0, bottom: 0 }}
            dragElastic={{ top: 0, bottom: 0.6 }}
            dragListener={false}
            dragControls={dragControls}
            onDragEnd={onDragEnd}
            className={cn(
              "relative flex w-full flex-col bg-canvas text-ink shadow-2xl outline-none",
              isSheet ? "max-h-[92svh] rounded-t-[1.75rem]" : variant === "fullscreen" ? "h-full" : "max-h-[min(52rem,calc(100svh-5rem))] max-w-6xl overflow-hidden rounded-[1.5rem]",
              className,
            )}
          >
            {isSheet && (
              <div aria-hidden className="flex h-7 shrink-0 cursor-grab touch-none items-center justify-center active:cursor-grabbing" onPointerDown={(e) => dragControls.start(e)}>
                <span className="h-1 w-10 rounded-full bg-line" />
              </div>
            )}
            <h2 id={titleId} className={hideTitle ? "sr-only" : "font-display text-display-md"}>
              {title}
            </h2>
            {description && (
              <p id={descId} className="sr-only">
                {description}
              </p>
            )}
            {children}
          </motion.div>
        </div>
      )}
    </AnimatePresence>,
    document.body,
  );
}
