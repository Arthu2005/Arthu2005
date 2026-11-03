"use client";

import { motion, type HTMLMotionProps } from "motion/react";
import { useSyncExternalStore, type ReactNode } from "react";

const REDUCED_QUERY = "(prefers-reduced-motion: reduce)";
const subscribeReduced = (cb: () => void) => {
  const mq = window.matchMedia(REDUCED_QUERY);
  mq.addEventListener("change", cb);
  return () => mq.removeEventListener("change", cb);
};

/**
 * prefers-reduced-motion, hydration-safe: the server and the first client render both assume "no preference",
 * then React re-renders with the real value. (motion's useReducedMotion returns the real value during hydration,
 * which made the server and client markup differ.)
 */
function useReduced() {
  return useSyncExternalStore(subscribeReduced, () => window.matchMedia(REDUCED_QUERY).matches, () => false);
}

/** Progressive reveal on scroll (fade + rise). Disabled for prefers-reduced-motion. */
export function Reveal({
  children,
  delay = 0,
  y = 28,
  className,
  as = "div",
  ...rest
}: { children: ReactNode; delay?: number; y?: number; className?: string; as?: "div" | "li" | "section" | "article" } & Omit<HTMLMotionProps<"div">, "children">) {
  const reduced = useReduced();
  const Comp = motion[as] as typeof motion.div;
  if (reduced) {
    const Static = as;
    return <Static className={className}>{children}</Static>;
  }
  return (
    <Comp
      className={className}
      initial={{ opacity: 0, y }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "0px 0px -12% 0px" }}
      transition={{ duration: 0.9, ease: [0.16, 1, 0.3, 1], delay }}
      {...rest}
    >
      {children}
    </Comp>
  );
}

/** Splits a headline into words that rise in sequence (cinematic hero entrance). */
export function SplitHeadline({ text, className, delay = 0 }: { text: string; className?: string; delay?: number }) {
  const reduced = useReduced();
  const words = text.split(" ");
  if (reduced) return <span className={className}>{text}</span>;
  return (
    <span className={className}>
      <span className="sr-only">{text}</span>
      {words.map((w, i) => (
        <span key={i} className="inline-block overflow-hidden pb-[0.08em] align-bottom" aria-hidden="true">
          <motion.span
            className="inline-block"
            initial={{ y: "110%" }}
            animate={{ y: "0%" }}
            transition={{ duration: 1.1, ease: [0.16, 1, 0.3, 1], delay: delay + i * 0.06 }}
          >
            {w}
            {i < words.length - 1 ? " " : ""}
          </motion.span>
        </span>
      ))}
    </span>
  );
}

export function FadeIn({ children, delay = 0, className }: { children: ReactNode; delay?: number; className?: string }) {
  const reduced = useReduced();
  if (reduced) return <div className={className}>{children}</div>;
  return (
    <motion.div className={className} initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.9, ease: [0.16, 1, 0.3, 1], delay }}>
      {children}
    </motion.div>
  );
}
