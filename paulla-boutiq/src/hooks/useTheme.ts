import { useCallback, useSyncExternalStore } from "react";

export type Theme = "light" | "dark";
const KEY = "pb-theme";

/* Store único: todos os botões de tema (header, menu) ficam sincronizados. */
const listeners = new Set<() => void>();

function current(): Theme {
  return document.documentElement.dataset.theme === "dark" ? "dark" : "light";
}

function apply(theme: Theme) {
  document.documentElement.dataset.theme = theme;
  document.querySelectorAll<HTMLMetaElement>('meta[name="theme-color"]').forEach((m) => {
    m.content = theme === "dark" ? "#141110" : "#F7F3EE";
  });
  listeners.forEach((l) => l());
}

let systemWatcher: MediaQueryList | null = null;
function subscribe(cb: () => void) {
  listeners.add(cb);
  if (!systemWatcher) {
    // Segue o sistema enquanto a pessoa não escolher manualmente.
    systemWatcher = window.matchMedia("(prefers-color-scheme: dark)");
    systemWatcher.addEventListener("change", (e) => {
      let saved: string | null = null;
      try {
        saved = localStorage.getItem(KEY);
      } catch {
        /* storage indisponível */
      }
      if (!saved) apply(e.matches ? "dark" : "light");
    });
  }
  return () => listeners.delete(cb);
}

export function useTheme() {
  const theme = useSyncExternalStore(subscribe, current, () => "light" as Theme);

  const toggle = useCallback(() => {
    const next: Theme = current() === "dark" ? "light" : "dark";
    try {
      localStorage.setItem(KEY, next);
    } catch {
      /* sem persistência — ainda funciona na sessão */
    }
    apply(next);
  }, []);

  return { theme, toggle };
}
