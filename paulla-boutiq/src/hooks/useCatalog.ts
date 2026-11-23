import { useCallback, useEffect, useState } from "react";
import { BRAND } from "@/config/brand";
import { PRODUCTS } from "@/data/catalog";
import { CatalogError, fetchCatalog } from "@/lib/catalog";
import type { LoadState, Product } from "@/types/catalog";

/** Estado do catálogo com loading/error/ready. Em erro, expõe o catálogo local como fallback. */
export function useCatalog() {
  const [state, setState] = useState<LoadState<readonly Product[]>>(() =>
    BRAND.catalogUrl ? { status: "loading" } : { status: "ready", data: PRODUCTS, source: "local" },
  );
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    if (!BRAND.catalogUrl) return;
    const ctrl = new AbortController();
    setState({ status: "loading" });
    fetchCatalog(BRAND.catalogUrl, ctrl.signal)
      .then(({ data, source }) => setState({ status: "ready", data, source }))
      .catch((err: unknown) => {
        if (ctrl.signal.aborted) return;
        const message = err instanceof CatalogError ? err.message : "Algo saiu do lugar ao carregar a vitrine.";
        setState({ status: "error", error: message, fallback: PRODUCTS });
      });
    return () => ctrl.abort();
  }, [attempt]);

  const retry = useCallback(() => setAttempt((n) => n + 1), []);
  return { state, retry };
}
