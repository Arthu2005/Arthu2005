import type { Transition, Variants } from "motion/react";

/** Curvas e durações do sistema de motion (espelham --ease-* do CSS). */
export const EASE_EDITORIAL = [0.22, 1, 0.36, 1] as const;
export const EASE_SILK = [0.65, 0, 0.35, 1] as const;

export const DURATION = {
  micro: 0.2, // 180–320ms: microinterações
  ui: 0.32,
  scene: 0.8, // 600–900ms: transições de cena
  sceneLong: 0.9,
} as const;

export const sceneTransition: Transition = { duration: DURATION.scene, ease: EASE_EDITORIAL };
export const microTransition: Transition = { duration: DURATION.micro, ease: EASE_EDITORIAL };

export const revealVariants: Variants = {
  hidden: { opacity: 0, y: 28 },
  visible: { opacity: 1, y: 0, transition: sceneTransition },
};

export const staggerParent = (stagger = 0.08, delay = 0): Variants => ({
  hidden: {},
  visible: { transition: { staggerChildren: stagger, delayChildren: delay } },
});
