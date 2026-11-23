import { useEffect } from "react";

/** Trava a rolagem do body (modais/menu) compensando a largura da barra de rolagem. */
export function useLockBodyScroll(active: boolean) {
  useEffect(() => {
    if (!active) return;
    const { body, documentElement } = document;
    const scrollbar = window.innerWidth - documentElement.clientWidth;
    const prev = { overflow: body.style.overflow, paddingRight: body.style.paddingRight };
    body.style.overflow = "hidden";
    if (scrollbar > 0) body.style.paddingRight = `${scrollbar}px`;
    return () => {
      body.style.overflow = prev.overflow;
      body.style.paddingRight = prev.paddingRight;
    };
  }, [active]);
}
