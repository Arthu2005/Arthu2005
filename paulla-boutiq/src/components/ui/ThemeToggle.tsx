import { AnimatePresence, motion } from "motion/react";
import { useTheme } from "@/hooks/useTheme";
import { cn } from "@/lib/cn";
import { microTransition } from "@/lib/motion";
import { IconMoon, IconSun } from "./Icons";

export function ThemeToggle({ className }: { className?: string }) {
  const { theme, toggle } = useTheme();
  const dark = theme === "dark";
  return (
    <button
      type="button"
      onClick={toggle}
      aria-pressed={dark}
      aria-label={dark ? "Usar tema claro" : "Usar tema escuro"}
      title={dark ? "Tema claro" : "Tema escuro"}
      className={cn("relative grid size-11 place-items-center rounded-full transition-colors duration-200 hover:bg-ink/8 active:scale-95", className)}
    >
      <AnimatePresence mode="wait" initial={false}>
        <motion.span key={theme} initial={{ opacity: 0, rotate: -40, scale: 0.8 }} animate={{ opacity: 1, rotate: 0, scale: 1 }} exit={{ opacity: 0, rotate: 40, scale: 0.8 }} transition={microTransition}>
          {dark ? <IconSun /> : <IconMoon />}
        </motion.span>
      </AnimatePresence>
    </button>
  );
}
