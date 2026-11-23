import { useEffect, useState } from "react";

/** Detecta direção da rolagem com limiar para evitar tremores. Usa rAF para não pesar no scroll. */
export function useScrollDirection(threshold = 8) {
  const [state, setState] = useState({ direction: "up" as "up" | "down", atTop: true });

  useEffect(() => {
    let last = window.scrollY;
    let ticking = false;
    const update = () => {
      const y = window.scrollY;
      const atTop = y < 24;
      if (Math.abs(y - last) >= threshold || atTop) {
        const direction = y > last && !atTop ? "down" : "up";
        setState((s) => (s.direction === direction && s.atTop === atTop ? s : { direction, atTop }));
        last = y;
      }
      ticking = false;
    };
    const onScroll = () => {
      if (!ticking) {
        ticking = true;
        requestAnimationFrame(update);
      }
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    update();
    return () => window.removeEventListener("scroll", onScroll);
  }, [threshold]);

  return state;
}
