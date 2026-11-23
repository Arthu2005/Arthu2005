import { motion, useReducedMotion, type HTMLMotionProps } from "motion/react";
import { EASE_EDITORIAL, DURATION } from "@/lib/motion";

interface RevealProps extends HTMLMotionProps<"div"> {
  delay?: number;
  /** Deslocamento vertical inicial em px. */
  y?: number;
}

/** Entrada suave no scroll (uma vez). Com movimento reduzido, apenas opacidade. */
export function Reveal({ delay = 0, y = 28, children, ...rest }: RevealProps) {
  const reduce = useReducedMotion();
  return (
    <motion.div
      initial={{ opacity: 0, y: reduce ? 0 : y }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "0px 0px -12% 0px" }}
      transition={{ duration: reduce ? 0.2 : DURATION.scene, ease: EASE_EDITORIAL, delay }}
      {...rest}
    >
      {children}
    </motion.div>
  );
}

/** Revela um título linha a linha com máscara. */
export function RevealLines({ lines, className, italicIndex, delay = 0, as: Tag = "h2", id }: { lines: string[]; className?: string; /** Linha exibida em itálico (acento editorial). */ italicIndex?: number; delay?: number; as?: "h1" | "h2" | "h3" | "p"; id?: string }) {
  const reduce = useReducedMotion();
  return (
    <Tag className={className} id={id}>
      <span className="sr-only">{lines.join(" ")}</span>
      {lines.map((line, i) => (
        <span key={line} aria-hidden className="block overflow-hidden pb-[0.08em]">
          <motion.span
            className={i === italicIndex ? "block italic" : "block"}
            initial={{ y: reduce ? 0 : "105%", opacity: reduce ? 0 : 1 }}
            whileInView={{ y: "0%", opacity: 1 }}
            viewport={{ once: true, margin: "0px 0px -10% 0px" }}
            transition={{ duration: reduce ? 0.2 : DURATION.sceneLong, ease: EASE_EDITORIAL, delay: delay + i * 0.09 }}
          >
            {line}
          </motion.span>
        </span>
      ))}
    </Tag>
  );
}
