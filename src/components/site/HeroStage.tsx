"use client";

import dynamic from "next/dynamic";
import { useEffect, useState } from "react";
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
  if (cores <= 2 || mem <= 2) return "static";
  if (small || cores <= 4 || mem <= 4) return "webgl-medium";
  return "webgl-high";
}

/**
 * Chooses how to present the oil: real-time WebGL (two quality tiers) or a static pre-rendered poster
 * for low-power devices, data-saver and browsers without WebGL. Reduced-motion users get a still frame.
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
        <PetroleumScene accent={accent} reducedMotion={reduced} quality={mode === "webgl-high" ? "high" : "medium"} />
      )}
    </div>
  );
}
