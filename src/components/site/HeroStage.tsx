"use client";

import dynamic from "next/dynamic";
import Image from "next/image";
import { Component, useEffect, useRef, useState, type ReactNode } from "react";
import { useReducedMotion } from "motion/react";

const MobiusScene = dynamic(() => import("./MobiusScene"), { ssr: false });

export type HeroVideo = {
  /** WebM VP9 with alpha channel (Chrome, Edge, Firefox, Android). */
  webm?: string;
  /** MP4 HEVC with alpha channel (Safari on macOS and iOS). */
  mp4?: string;
  /** Still frame shown before the video plays, for reduced motion and as fallback. */
  poster?: string;
};

type Mode = "pending" | "video" | "webgl-high" | "webgl-medium" | "static";

const DEFAULT_POSTER = "/images/oil-poster.webp";

type Nav = Navigator & { connection?: { saveData?: boolean; effectiveType?: string }; deviceMemory?: number };

function lowData(nav: Nav) {
  return !!nav.connection?.saveData || /(^|-)2g$/.test(nav.connection?.effectiveType ?? "");
}

/**
 * Picks the video file this browser can play WITH transparency, or null.
 * Apple browsers only show alpha from HEVC; the others only from VP9 WebM
 * (Chrome may claim HEVC support but renders its alpha as black).
 */
function pickVideo(v: HeroVideo): string | null {
  const probe = document.createElement("video");
  const apple = /Apple/.test(navigator.vendor);
  if (apple) return v.mp4 && probe.canPlayType('video/mp4; codecs="hvc1"') ? v.mp4 : null;
  return v.webm && probe.canPlayType('video/webm; codecs="vp09.00.10.08"') ? v.webm : null;
}

function detect3d(): Mode {
  try {
    const c = document.createElement("canvas");
    const gl = (c.getContext("webgl2") || c.getContext("webgl")) as WebGLRenderingContext | null;
    if (!gl) return "static";
    // Without a real GPU the CPU would draw every frame and the whole page would freeze: keep the poster.
    const info = gl.getExtension("WEBGL_debug_renderer_info");
    const renderer = info ? String(gl.getParameter(info.UNMASKED_RENDERER_WEBGL)) : "";
    gl.getExtension("WEBGL_lose_context")?.loseContext();
    if (/swiftshader|llvmpipe|software|basic render/i.test(renderer)) return "static";
  } catch {
    return "static";
  }
  const nav = navigator as Nav;
  const cores = nav.hardwareConcurrency ?? 4;
  const mem = nav.deviceMemory ?? 4;
  const small = window.matchMedia("(max-width: 767px)").matches;
  // weak devices still get the live scene, at the lighter quality tier
  if (small || cores <= 4 || mem <= 4) return "webgl-medium";
  return "webgl-high";
}

const INTERACTIONS = ["pointermove", "pointerdown", "touchstart", "wheel", "scroll", "keydown"] as const;

/** Calls `cb` once, on the visitor's first sign of activity. Returns a function that cancels the wait. */
function onFirstInteraction(cb: () => void) {
  const off = () => INTERACTIONS.forEach((e) => window.removeEventListener(e, go));
  const go = () => {
    off();
    cb();
  };
  INTERACTIONS.forEach((e) => window.addEventListener(e, go, { passive: true }));
  return off;
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

/** Looping transparent video, paused while off screen or in a background tab to save battery. */
function HeroVideoPlayer({ src, poster, onReady, onError }: { src: string; poster: string; onReady: () => void; onError: () => void }) {
  const ref = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    const v = ref.current;
    if (!v) return;
    let visible = true;
    const sync = () => {
      if (visible && document.visibilityState === "visible") v.play().catch(() => {});
      else v.pause();
    };
    const io = new IntersectionObserver(([e]) => {
      visible = !!e?.isIntersecting;
      sync();
    });
    io.observe(v);
    document.addEventListener("visibilitychange", sync);
    return () => {
      io.disconnect();
      document.removeEventListener("visibilitychange", sync);
    };
  }, []);

  return (
    <video
      ref={ref}
      className="absolute inset-0 h-full w-full object-contain"
      src={src}
      poster={poster}
      autoPlay
      muted
      loop
      playsInline
      preload="auto"
      disablePictureInPicture
      aria-hidden="true"
      tabIndex={-1}
      onPlaying={onReady}
      onError={onError}
    />
  );
}

/**
 * Chooses how to present the hero visual, best first:
 *  1. a pre-rendered transparent video loop, when one is configured in the CMS and the browser can show its alpha;
 *  2. the real-time WebGL sculpture (two quality tiers), started on the visitor's first interaction;
 *  3. the static poster: no real GPU, data saver on, or anything above failed.
 * The poster is the first thing painted, so the three.js bundle and the render loop never delay the page: they
 * only load once someone is actually using it. Reduced-motion users get the poster instead of the video, or a
 * slower 3D animation.
 */
export function HeroStage({ accent, video }: { accent: string; video?: HeroVideo }) {
  const reduced = useReducedMotion() ?? false;
  const [mode, setMode] = useState<Mode>("pending");
  const [videoSrc, setVideoSrc] = useState<string | null>(null);
  const [videoReady, setVideoReady] = useState(false);
  const poster = video?.poster || DEFAULT_POSTER;
  const hasVideo = !!(video?.webm || video?.mp4);

  useEffect(() => {
    let cancelInteraction = () => {};
    // defer the video until the browser is idle, and the 3D until the first interaction, so the page paints first
    const run = () => {
      if (lowData(navigator as Nav)) return setMode("static");
      if (hasVideo) {
        if (reduced) return setMode("static");
        const src = pickVideo(video!);
        if (src) {
          setVideoSrc(src);
          return setMode("video");
        }
      }
      cancelInteraction = onFirstInteraction(() => setMode(detect3d()));
    };
    const w = window as Window & { requestIdleCallback?: (cb: () => void, o?: { timeout: number }) => number };
    const idle = w.requestIdleCallback ? w.requestIdleCallback(run, { timeout: 1200 }) : null;
    const timer = idle === null ? setTimeout(run, 300) : undefined;
    return () => {
      cancelInteraction();
      if (idle !== null) window.cancelIdleCallback?.(idle);
      clearTimeout(timer);
    };
  }, [hasVideo, reduced, video]);

  const showPoster = mode === "pending" || mode === "static" || (mode === "video" && !videoReady);

  return (
    <div className="pointer-events-none absolute inset-0 lg:pointer-events-auto">
      {/* Poster: always rendered underneath, visible until the video / WebGL fades in (and as the static fallback). */}
      <div className="absolute inset-0 transition-opacity duration-700" style={{ opacity: showPoster ? 1 : 0.0001 }} aria-hidden="true">
        {poster.startsWith("/") && !poster.startsWith("//") ? (
          <Image src={poster} alt="" fill preload sizes="(min-width: 1024px) 60vw, 100vw" className="object-contain" />
        ) : (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={poster} alt="" fetchPriority="high" className="absolute inset-0 h-full w-full object-contain" />
        )}
      </div>
      {mode === "video" && videoSrc && (
        <div className="absolute inset-0 transition-opacity duration-700" style={{ opacity: videoReady ? 1 : 0 }}>
          <HeroVideoPlayer
            src={videoSrc}
            poster={poster}
            onReady={() => setVideoReady(true)}
            onError={() => {
              console.warn("Vídeo do hero indisponível, usando o 3D.");
              setVideoSrc(null);
              setMode(detect3d());
            }}
          />
        </div>
      )}
      {(mode === "webgl-high" || mode === "webgl-medium") && (
        <SceneBoundary onError={() => setMode("static")}>
          <MobiusScene accent={accent} reducedMotion={reduced} quality={mode === "webgl-high" ? "high" : "medium"} />
        </SceneBoundary>
      )}
    </div>
  );
}
