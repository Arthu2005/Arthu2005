"use client";

import { useEffect, useRef, type ReactNode } from "react";
import { motion, useReducedMotion } from "motion/react";
import { Check } from "lucide-react";

export function SuccessPanel({ title, protocol, children }: { title: string; protocol: string; children?: ReactNode }) {
  const ref = useRef<HTMLHeadingElement>(null);
  const reduced = useReducedMotion();
  useEffect(() => ref.current?.focus(), []);
  return (
    <motion.div
      initial={reduced ? false : { opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
      className="rounded-[var(--radius-card)] border border-line bg-white p-8 md:p-10"
      role="status"
    >
      <motion.span
        initial={reduced ? false : { scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ type: "spring", stiffness: 260, damping: 18, delay: 0.15 }}
        className="inline-flex h-14 w-14 items-center justify-center rounded-full bg-accent text-white"
        aria-hidden="true"
      >
        <Check className="h-7 w-7" />
      </motion.span>
      <h2 ref={ref} tabIndex={-1} className="mt-6 text-h3 font-semibold outline-none">
        {title}
      </h2>
      <p className="mt-4 text-steel">Guarde o seu número de protocolo:</p>
      <p className="mt-2 inline-block rounded-xl bg-paper-2 px-4 py-2 font-mono text-lg font-semibold tracking-wider">{protocol}</p>
      {children && <div className="mt-6 text-[0.98rem] leading-relaxed text-ink-2">{children}</div>}
    </motion.div>
  );
}
