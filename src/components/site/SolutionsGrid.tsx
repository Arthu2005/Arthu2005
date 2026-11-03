"use client";

import { useState, type ReactNode } from "react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { cn } from "@/lib/cn";

/** Client-side category filter for the (small) solutions catalogue. Cards are rendered on the server. */
export function SolutionsGrid({ categories, cards }: { categories: { value: string; label: string }[]; cards: { id: string; category: string; node: ReactNode }[] }) {
  const [active, setActive] = useState("all");
  const reduced = useReducedMotion();
  const shown = cards.filter((c) => active === "all" || c.category === active);
  return (
    <div>
      {categories.length > 1 && (
        <div className="flex flex-wrap gap-2" role="group" aria-label="Filtrar por categoria">
          {[{ value: "all", label: "Todas" }, ...categories].map((c) => (
            <button
              key={c.value}
              type="button"
              aria-pressed={active === c.value}
              onClick={() => setActive(c.value)}
              className={cn(
                "h-10 rounded-full border px-4 text-sm font-medium transition-colors",
                active === c.value ? "border-accent-deep bg-accent-deep text-white" : "border-ink/15 bg-white text-ink hover:border-accent",
              )}
            >
              {c.label}
            </button>
          ))}
        </div>
      )}
      <p className="sr-only" aria-live="polite">
        {shown.length} {shown.length === 1 ? "item" : "itens"}
      </p>
      <motion.ul layout={!reduced} className="mt-10 grid gap-5 md:grid-cols-2 lg:grid-cols-3">
        <AnimatePresence mode="popLayout">
          {shown.map((c) => (
            <motion.li
              key={c.id}
              layout={!reduced}
              initial={reduced ? false : { opacity: 0, scale: 0.97 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={reduced ? undefined : { opacity: 0, scale: 0.97 }}
              transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
            >
              {c.node}
            </motion.li>
          ))}
        </AnimatePresence>
      </motion.ul>
    </div>
  );
}
