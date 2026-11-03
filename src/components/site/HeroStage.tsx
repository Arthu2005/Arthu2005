"use client";

import dynamic from "next/dynamic";
import { Component, useEffect, useState, type ReactNode } from "react";
import { useReducedMotion } from "motion/react";

const PetroleumScene = dynamic(() => import("./PetroleumScene"), { ssr: false });

type Mode = "pending" | "webgl-high" | "webgl-medium" | "static";

function detect(): Mode {
  if (typeof window === "undefined") return "pending";
  const nav = navigator as Navigator & { connection?: { saveData?: boolean; effectiveType?: string }; deviceMemory?: number };
  if (nav.connection?.saveData || /(^|-)2g$/.test(nav.connection?.effectiveType ?? "")) return "static";
  try {
    const c = document.createElement("canvas");
    const gl = c.getContext("webgl2") || c.getContext("webgl");
    if (!gl) return "static";
  } catch {
    return "static";
  }
  const cores = nav.hardwareConcurrency ?? 4;
  const mem = nav.deviceMemory ?? 4;
  const small = window.matchMedia("(max-width: 767px)").matches;
  // weak devices still get the live scene, at the lighter quality tier
  if (small || cores <= 4 || mem <= 4) return "webgl-medium";
  return "webgl-high";
}

/**
 * Contains any failure of the 3D scene (GPU/driver errors, lost context, a chunk that failed to load) so it
 * never takes the whole page down: the hero simply falls back to the static poster.
 */
class SceneBoundary extends Component<{ onError: () => void; children: ReactNode }, { failed: boolean }> {
  state = { failed: false };
  static getDerivedStateFromError() {
    return { failed: true };
  }
  componentDidCatch(error: unknown) {
    console.warn("Hero 3D desativado, exibindo imagem estática:", error);
    this.props.onError();
  }
  render() {
    return this.state.failed ? null : this.props.children;
  }
}

/**
 * Chooses how to present the oil: real-time WebGL (two quality tiers), or a static pre-rendered poster only
 * when WebGL is unavailable or data-saver is on. Reduced-motion users get a slower, gentler animation.
 */
export function HeroStage({ accent }: { accent: string }) {
  const reduced = useReducedMotion() ?? false;
  const [mode, setMode] = useState<Mode>("pending");

  useEffect(() => {
    // defer the heavy scene until the browser is idle so text (LCP) paints first
    const run = () => setMode(detect());
    const w = window as Window & { requestIdleCallback?: (cb: () => void, o?: { timeout: number }) => number };
    if (w.requestIdleCallback) w.requestIdleCallback(run, { timeout: 1200 });
    else setTimeout(run, 300);
  }, []);

  return (
    <div className="pointer-events-none absolute inset-0 lg:pointer-events-auto">
      {/* Poster: always rendered underneath, visible until WebGL fades in (and as the static fallback). */}
      <div
        className="absolute inset-0 bg-[url('/images/oil-poster.webp')] bg-contain bg-center bg-no-repeat transition-opacity duration-700"
        style={{ opacity: mode === "pending" || mode === "static" ? 1 : 0.0001 }}
        aria-hidden="true"
      />
      {(mode === "webgl-high" || mode === "webgl-medium") && (
        <SceneBoundary onError={() => setMode("static")}>
          <PetroleumScene accent={accent} reducedMotion={reduced} quality={mode === "webgl-high" ? "high" : "medium"} />
        </SceneBoundary>
      )}
    </div>
  );
}
