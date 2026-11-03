"use client";

import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { Environment, Float, Lightformer, MarchingCube, MarchingCubes } from "@react-three/drei";
import { useEffect, useMemo, useRef, useState } from "react";
import * as THREE from "three";

/**
 * "A força do petróleo em movimento"
 * Viscous black oil built from metaballs (marching cubes) with a glossy clear-coated material.
 * Reflections come from local Lightformers (no HDR download). The mass slowly breathes,
 * merges and splits; satellite droplets float around; the whole group follows the cursor with inertia.
 */

type Quality = "high" | "medium";

const OIL = {
  color: new THREE.Color("#020202"),
  roughness: 0.05,
  metalness: 0.2,
  clearcoat: 1,
  clearcoatRoughness: 0.04,
  reflectivity: 1,
  envMapIntensity: 1.6,
};

function OilMaterial() {
  return <meshPhysicalMaterial {...OIL} />;
}

type Ball = { base: [number, number, number]; amp: [number, number, number]; speed: number; phase: number; strength: number };

function Blobs({ quality, animate }: { quality: Quality; animate: boolean }) {
  const refs = useRef<(THREE.Group | null)[]>([]);
  const pointerBall = useRef<THREE.Group>(null);
  const { pointer } = useThree();
  const balls = useMemo<Ball[]>(
    () => [
      { base: [0, 0, 0], amp: [0.05, 0.06, 0.04], speed: 0.3, phase: 0, strength: 0.85 },
      { base: [0.2, 0.12, 0.02], amp: [0.14, 0.1, 0.06], speed: 0.42, phase: 1.3, strength: 0.38 },
      { base: [-0.2, -0.08, 0.04], amp: [0.12, 0.14, 0.05], speed: 0.33, phase: 2.6, strength: 0.4 },
      { base: [0.08, -0.24, -0.03], amp: [0.1, 0.1, 0.08], speed: 0.46, phase: 4.1, strength: 0.28 },
      { base: [-0.08, 0.26, 0.0], amp: [0.14, 0.06, 0.06], speed: 0.38, phase: 5.2, strength: 0.24 },
      { base: [0.3, -0.16, 0.05], amp: [0.06, 0.16, 0.05], speed: 0.52, phase: 0.7, strength: 0.16 },
      { base: [-0.3, 0.18, -0.04], amp: [0.08, 0.12, 0.06], speed: 0.6, phase: 3.3, strength: 0.12 },
    ],
    [],
  );

  useFrame((state) => {
    const t = animate ? state.clock.elapsedTime : 1.2;
    balls.forEach((b, i) => {
      const m = refs.current[i];
      if (!m) return;
      m.position.set(
        b.base[0] + Math.sin(t * b.speed + b.phase) * b.amp[0],
        b.base[1] + Math.cos(t * b.speed * 0.9 + b.phase) * b.amp[1],
        b.base[2] + Math.sin(t * b.speed * 1.2 + b.phase * 0.5) * b.amp[2],
      );
    });
    if (pointerBall.current) {
      // a small blob that is gently pulled toward the cursor: the oil "reaches" for it
      const tx = THREE.MathUtils.clamp(pointer.x * 0.28, -0.3, 0.3);
      const ty = THREE.MathUtils.clamp(pointer.y * 0.28, -0.3, 0.3);
      pointerBall.current.position.x = THREE.MathUtils.lerp(pointerBall.current.position.x, tx, 0.04);
      pointerBall.current.position.y = THREE.MathUtils.lerp(pointerBall.current.position.y, ty, 0.04);
    }
  });

  return (
    <MarchingCubes resolution={quality === "high" ? 64 : 44} maxPolyCount={quality === "high" ? 30000 : 16000} enableUvs={false} enableColors={false} scale={3}>
      <OilMaterial />
      {balls.map((b, i) => (
        <MarchingCube
          key={i}
          ref={(el: THREE.Group | null) => {
            refs.current[i] = el;
          }}
          strength={b.strength}
          subtract={12}
          position={b.base}
        />
      ))}
      <MarchingCube ref={pointerBall} strength={0.26} subtract={12} position={[0.25, 0.25, 0.1]} />
    </MarchingCubes>
  );
}

function Droplets({ animate }: { animate: boolean }) {
  const drops = useMemo(
    () => [
      { p: [1.55, 0.95, -0.4], s: 0.14 },
      { p: [-1.2, -0.8, 0.3], s: 0.17 },
      { p: [1.2, -1.15, 0.5], s: 0.08 },
      { p: [-1.05, 1.15, -0.6], s: 0.1 },
      { p: [0.25, 1.5, -0.9], s: 0.06 },
      { p: [1.75, -0.2, -1.0], s: 0.045 },
    ],
    [],
  );
  return (
    <>
      {drops.map((d, i) => (
        <Float key={i} speed={animate ? 1 + (i % 3) * 0.35 : 0} rotationIntensity={0.4} floatIntensity={animate ? 0.9 : 0} floatingRange={[-0.12, 0.12]}>
          <mesh position={d.p as [number, number, number]} scale={[d.s, d.s * 1.08, d.s]}>
            <sphereGeometry args={[1, 48, 48]} />
            <OilMaterial />
          </mesh>
        </Float>
      ))}
    </>
  );
}

function Rig({ children, animate }: { children: React.ReactNode; animate: boolean }) {
  const group = useRef<THREE.Group>(null);
  const { pointer } = useThree();
  useFrame((state, delta) => {
    const g = group.current;
    if (!g) return;
    const t = state.clock.elapsedTime;
    const targetY = (animate ? Math.sin(t * 0.15) * 0.25 : 0) + pointer.x * 0.35;
    const targetX = (animate ? Math.cos(t * 0.12) * 0.08 : 0) - pointer.y * 0.2;
    g.rotation.y = THREE.MathUtils.damp(g.rotation.y, targetY, 2.2, delta);
    g.rotation.x = THREE.MathUtils.damp(g.rotation.x, targetX, 2.2, delta);
    // scroll parallax: sink slightly as the user scrolls past the hero
    const scroll = typeof window !== "undefined" ? Math.min(window.scrollY / window.innerHeight, 1) : 0;
    g.position.y = THREE.MathUtils.damp(g.position.y, -scroll * 0.8, 4, delta);
  });
  return <group ref={group}>{children}</group>;
}

const LIME = "#a6e22e";
const DEEP = "#0a3d22";

/**
 * Studio built from Lightformers (no HDR download). White key lights keep the oil readable as glossy black;
 * vibrant/lime strips add the subtle PETROLUB green reflections along the edges.
 */
function Studio({ accent }: { accent: string }) {
  return (
    <Environment resolution={256} frames={1}>
      <color attach="background" args={["#030806"]} />
      {/* soft key from above: the broad liquid highlight */}
      <Lightformer form="rect" intensity={2.1} position={[0, 5, 1]} rotation-x={Math.PI / 2} scale={[14, 1.6, 1]} />
      {/* crisp strip on the left, faintly green-tinted */}
      <Lightformer form="rect" color="#effee0" intensity={2.8} position={[-5, 0.6, 0]} rotation-y={Math.PI / 2} scale={[24, 0.22, 1]} />
      {/* lime strip on the right: green edge reflections */}
      <Lightformer form="rect" color={LIME} intensity={1.4} position={[5, -0.4, 0]} rotation-y={-Math.PI / 2} scale={[24, 0.14, 1]} />
      <Lightformer form="rect" intensity={1.1} position={[0, 1.5, 6]} scale={[8, 0.12, 1]} />
      {/* vibrant green bounce from below */}
      <Lightformer form="rect" color={accent} intensity={1.3} position={[-2, -5, 2]} rotation-x={-Math.PI / 2} scale={[10, 0.6, 1]} />
      {/* deep green fill and lime back rim */}
      <Lightformer form="rect" color={DEEP} intensity={1.2} position={[3, 3, -4]} scale={[10, 4, 1]} />
      <Lightformer form="rect" color={LIME} intensity={0.9} position={[-4, 3, -3]} scale={[6, 0.2, 1]} />
    </Environment>
  );
}

export default function PetroleumScene({ accent = "#0a8539", reducedMotion = false, quality = "high" }: { accent?: string; reducedMotion?: boolean; quality?: Quality }) {
  const wrapper = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(true);
  const [ready, setReady] = useState(false);

  // Stop rendering while the hero is off-screen (saves battery/CPU while reading the page).
  useEffect(() => {
    const el = wrapper.current;
    if (!el) return;
    const io = new IntersectionObserver(([e]) => setVisible(e?.isIntersecting ?? true), { rootMargin: "100px" });
    io.observe(el);
    return () => io.disconnect();
  }, []);

  const animate = !reducedMotion;

  return (
    <div ref={wrapper} className="absolute inset-0 transition-opacity duration-[1400ms] ease-out" style={{ opacity: ready ? 1 : 0 }} aria-hidden="true">
      <Canvas
        dpr={quality === "high" ? [1, 1.75] : [1, 1.25]}
        frameloop={visible ? (animate ? "always" : "demand") : "never"}
        camera={{ position: [0, 0, 8], fov: 32 }}
        gl={{ antialias: true, alpha: true, powerPreference: "high-performance" }}
        onCreated={({ gl }) => {
          gl.toneMapping = THREE.ACESFilmicToneMapping;
          gl.toneMappingExposure = 1.05;
          requestAnimationFrame(() => setReady(true));
        }}
      >
        <Studio accent={accent} />
        <Rig animate={animate}>
          <Blobs quality={quality} animate={animate} />
          <Droplets animate={animate} />
        </Rig>
      </Canvas>
    </div>
  );
}
