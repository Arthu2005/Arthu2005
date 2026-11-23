import { useEffect } from "react";
import type { CategoryId } from "@/types/catalog";

/** Comandos globais da vitrine (header/menu → seção de produtos), tipados. */
export interface ShowcaseCommands {
  "pb:filter": CategoryId | "todas";
  "pb:search": undefined;
  "pb:favorites": undefined;
}

export function emit<K extends keyof ShowcaseCommands>(name: K, detail?: ShowcaseCommands[K]) {
  window.dispatchEvent(new CustomEvent(name, { detail }));
}

export function useCommand<K extends keyof ShowcaseCommands>(name: K, handler: (detail: ShowcaseCommands[K]) => void) {
  useEffect(() => {
    const listener = (e: Event) => handler((e as CustomEvent<ShowcaseCommands[K]>).detail);
    window.addEventListener(name, listener);
    return () => window.removeEventListener(name, listener);
  }, [name, handler]);
}
