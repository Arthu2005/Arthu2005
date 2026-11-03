"use client";

/* three.js materials/uniforms are intentionally mutated every frame inside useFrame (standard React Three Fiber pattern). */
/* eslint-disable react-hooks/immutability */

import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { Environment, Lightformer } from "@react-three/drei";
import { useEffect, useMemo, useRef, useState } from "react";
import * as THREE from "three";

/**
 * "A força do petróleo em movimento"
 *
 * One continuous drop of crude oil, deformed on the GPU:
 *  - teardrop silhouette with slow, viscous surface currents (layered simplex noise)
 *  - a drip cycle: the bottom sags, forms a neck, a droplet detaches and falls (stretching with speed)
 *    while the body recoils and wobbles
 *  - the surface reaches toward the cursor; without a cursor it follows a slow virtual one (always alive)
 * Material: black clear-coated PBR + studio Lightformers (no HDR download) with green/lime strips
 * and a lime fresnel rim for the PETROLUB identity.
 */

type Quality = "high" | "medium";

const LIME = new THREE.Color("#a6e22e");
const DEEP = "#0a3d22";
const CYCLE = 7.5; // seconds per drip

/* ------------------------------------------------------------------ */
/* GLSL                                                                 */
/* ------------------------------------------------------------------ */

// Ashima Arts 3D simplex noise (MIT)
const NOISE = /* glsl */ `
vec3 mod289(vec3 x){return x-floor(x*(1.0/289.0))*289.0;}
vec4 mod289(vec4 x){return x-floor(x*(1.0/289.0))*289.0;}
vec4 permute(vec4 x){return mod289(((x*34.0)+1.0)*x);}
vec4 taylorInvSqrt(vec4 r){return 1.79284291400159-0.85373472095314*r;}
float snoise(vec3 v){
  const vec2 C=vec2(1.0/6.0,1.0/3.0);const vec4 D=vec4(0.0,0.5,1.0,2.0);
  vec3 i=floor(v+dot(v,C.yyy));vec3 x0=v-i+dot(i,C.xxx);
  vec3 g=step(x0.yzx,x0.xyz);vec3 l=1.0-g;vec3 i1=min(g.xyz,l.zxy);vec3 i2=max(g.xyz,l.zxy);
  vec3 x1=x0-i1+C.xxx;vec3 x2=x0-i2+C.yyy;vec3 x3=x0-D.yyy;
  i=mod289(i);
  vec4 p=permute(permute(permute(i.z+vec4(0.0,i1.z,i2.z,1.0))+i.y+vec4(0.0,i1.y,i2.y,1.0))+i.x+vec4(0.0,i1.x,i2.x,1.0));
  float n_=0.142857142857;vec3 ns=n_*D.wyz-D.xzx;
  vec4 j=p-49.0*floor(p*ns.z*ns.z);vec4 x_=floor(j*ns.z);vec4 y_=floor(j-7.0*x_);
  vec4 x=x_*ns.x+ns.yyyy;vec4 y=y_*ns.x+ns.yyyy;vec4 h=1.0-abs(x)-abs(y);
  vec4 b0=vec4(x.xy,y.xy);vec4 b1=vec4(x.zw,y.zw);
  vec4 s0=floor(b0)*2.0+1.0;vec4 s1=floor(b1)*2.0+1.0;vec4 sh=-step(h,vec4(0.0));
  vec4 a0=b0.xzyw+s0.xzyw*sh.xxyy;vec4 a1=b1.xzyw+s1.xzyw*sh.zzww;
  vec3 p0=vec3(a0.xy,h.x);vec3 p1=vec3(a0.zw,h.y);vec3 p2=vec3(a1.xy,h.z);vec3 p3=vec3(a1.zw,h.w);
  vec4 norm=taylorInvSqrt(vec4(dot(p0,p0),dot(p1,p1),dot(p2,p2),dot(p3,p3)));
  p0*=norm.x;p1*=norm.y;p2*=norm.z;p3*=norm.w;
  vec4 m=max(0.6-vec4(dot(x0,x0),dot(x1,x1),dot(x2,x2),dot(x3,x3)),0.0);m=m*m;
  return 42.0*dot(m*m,vec4(dot(p0,x0),dot(p1,x1),dot(p2,x2),dot(p3,x3)));
}
`;

const DEFORM = /* glsl */ `
uniform float uTime;
uniform vec3  uPointer;     // direction (object space) the surface reaches for
uniform float uPointerAmt;
uniform float uDrip;        // 0..1 neck/sag growth before a drop detaches
uniform float uRecoil;      // wobble energy after detaching / on scroll
uniform float uShape;       // 1 = main teardrop body, 0 = free droplet
uniform float uAmp;         // overall surface turbulence

vec3 deform(vec3 p){
  vec3 n = normalize(p);
  float y = n.y;
  vec3 q = n;

  // teardrop: pointed, slightly leaning top
  float top = smoothstep(-0.35, 1.0, y) * uShape;
  q.xz *= 1.0 - pow(top, 3.2) * 0.6;
  q.y  *= 1.0 + pow(top, 2.2) * 0.34;
  q.x  += pow(top, 3.0) * 0.05;

  // gravity: heavy bottom, neck and hanging drop while uDrip grows
  float bottom = smoothstep(0.35, 1.0, -y) * uShape;
  float tip = smoothstep(0.82, 1.0, -y) * uShape;
  q.y  -= bottom * 0.10 + tip * uDrip * 0.62;
  q.xz *= 1.0 - smoothstep(0.6, 0.9, -y) * uShape * uDrip * 0.38 + tip * uDrip * 0.18;

  // viscous currents (slow, layered)
  float t = uTime;
  float w = snoise(n * 0.9 + vec3(0.0, t * 0.14, t * 0.05)) * 0.055
          + snoise(n * 1.9 + vec3(t * 0.18, -t * 0.1, 0.0)) * 0.018
          + snoise(n * 3.6 - vec3(0.0, t * 0.26, t * 0.16)) * 0.004;

  // reach toward the pointer
  float facing = max(dot(n, uPointer), 0.0);
  w += pow(facing, 6.0) * uPointerAmt * 0.2;

  // recoil jiggle travelling up the body
  w += sin(y * 7.0 - t * 9.0) * uRecoil * 0.035 * (0.5 + 0.5 * (1.0 - abs(y)));

  return q * (1.0 + w * uAmp);
}
`;

function makeOilMaterial(shape: number, amp: number) {
  const uniforms = {
    uTime: { value: 0 },
    uPointer: { value: new THREE.Vector3(0, 0, 1) },
    uPointerAmt: { value: 0 },
    uDrip: { value: 0 },
    uRecoil: { value: 0 },
    uShape: { value: shape },
    uAmp: { value: amp },
    uRim: { value: LIME.clone() },
    uRimAmt: { value: 0.09 },
  };
  const mat = new THREE.MeshPhysicalMaterial({
    color: new THREE.Color("#010201"),
    roughness: 0.035,
    metalness: 0.25,
    clearcoat: 1,
    clearcoatRoughness: 0.02,
    reflectivity: 1,
    envMapIntensity: 1.75,
    specularIntensity: 1,
  });
  mat.onBeforeCompile = (shader) => {
    Object.assign(shader.uniforms, uniforms);
    shader.vertexShader = shader.vertexShader
      .replace("#include <common>", `#include <common>\n${NOISE}\n${DEFORM}`)
      .replace(
        "#include <beginnormal_vertex>",
        /* glsl */ `
        vec3 dPos = deform(position);
        vec3 nrm = normalize(position);
        vec3 tng = normalize(cross(nrm, abs(nrm.y) < 0.99 ? vec3(0.0, 1.0, 0.0) : vec3(1.0, 0.0, 0.0)));
        vec3 btg = normalize(cross(nrm, tng));
        float eps = 0.0025;
        vec3 dA = deform(position + tng * eps);
        vec3 dB = deform(position + btg * eps);
        vec3 objectNormal = normalize(cross(dA - dPos, dB - dPos));
        if (dot(objectNormal, dPos) < 0.0) objectNormal = -objectNormal;
        #ifdef USE_TANGENT
          vec3 objectTangent = vec3(tangent.xyz);
        #endif
        `,
      )
      .replace("#include <begin_vertex>", "vec3 transformed = dPos;");
    shader.fragmentShader = shader.fragmentShader
      .replace("#include <common>", "#include <common>\nuniform vec3 uRim;\nuniform float uRimAmt;")
      .replace(
        "#include <emissivemap_fragment>",
        /* glsl */ `#include <emissivemap_fragment>
        float fres = pow(1.0 - saturate(dot(normalize(normal), normalize(vViewPosition))), 5.0);
        totalEmissiveRadiance += uRim * fres * uRimAmt;`,
      );
  };
  mat.customProgramCacheKey = () => `petrolub-oil-${shape}`;
  return { mat, uniforms };
}

/* ------------------------------------------------------------------ */
/* Scene                                                                */
/* ------------------------------------------------------------------ */

type DropState = { active: boolean; y: number; v: number; x: number; born: number };

function OilDrop({ quality, animate }: { quality: Quality; animate: boolean }) {
  const body = useRef<THREE.Mesh>(null);
  const drops = useRef<(THREE.Mesh | null)[]>([]);
  const { pointer, size } = useThree();

  const main = useMemo(() => makeOilMaterial(1, 1), []);
  const small = useMemo(() => makeOilMaterial(0, 0.6), []);
  const geo = useMemo(() => new THREE.IcosahedronGeometry(1, quality === "high" ? 96 : 48), [quality]);
  const dropGeo = useMemo(() => new THREE.IcosahedronGeometry(1, quality === "high" ? 24 : 14), [quality]);

  const state = useRef({
    lastPointer: new THREE.Vector2(9, 9),
    idle: 10,
    reach: 0,
    recoil: 0,
    lastCycle: -1,
    scrollY: 0,
    dir: new THREE.Vector3(0, 0, 1),
    drops: [0, 1].map(() => ({ active: false, y: 0, v: 0, x: 0, born: 0 }) as DropState),
  });

  useEffect(() => () => {
    geo.dispose();
    dropGeo.dispose();
    main.mat.dispose();
    small.mat.dispose();
  }, [geo, dropGeo, main, small]);

  const SCALE = size.width < 768 ? 0.72 : 0.8;
  const TIP_Y = -(1.1 + 0.62) * SCALE + 0.15;

  useFrame((frame, delta) => {
    const s = state.current;
    const dt = Math.min(delta, 0.05);
    const t = animate ? frame.clock.elapsedTime : 2.4;

    // pointer activity → reach; when idle, a slow virtual pointer keeps the surface alive
    const moved = s.lastPointer.distanceToSquared(pointer) > 1e-6;
    s.lastPointer.copy(pointer);
    s.idle = moved ? 0 : s.idle + dt;
    const virtual = new THREE.Vector3(Math.sin(t * 0.37) * 0.9, Math.cos(t * 0.23) * 0.6, 0.75);
    const real = new THREE.Vector3(pointer.x * 1.2, pointer.y * 1.2, 0.7);
    const target = (s.idle > 2.5 ? virtual : real).normalize();
    // convert into the body's object space (it rotates slowly)
    if (body.current) target.applyQuaternion(body.current.quaternion.clone().invert());
    s.dir.lerp(target, 0.06).normalize();
    s.reach = THREE.MathUtils.damp(s.reach, animate ? (s.idle > 2.5 ? 0.55 : 1) : 0.4, 3, dt);

    // scroll jolts make it wobble
    const sy = typeof window !== "undefined" ? window.scrollY : 0;
    s.recoil += Math.min(Math.abs(sy - s.scrollY) / 400, 0.4);
    s.scrollY = sy;

    // drip cycle
    let drip = 0;
    if (animate) {
      const cyc = Math.floor(t / CYCLE);
      const ph = (t % CYCLE) / CYCLE;
      drip = ph < 0.78 ? Math.pow(ph / 0.78, 2.4) : Math.max(0, 1 - (ph - 0.78) * 14) * 0.9;
      if (ph >= 0.78 && s.lastCycle !== cyc) {
        s.lastCycle = cyc;
        s.recoil = Math.min(s.recoil + 1, 1.4);
        const d = s.drops.find((x) => !x.active) ?? s.drops[0]!;
        Object.assign(d, { active: true, y: TIP_Y - 0.05, v: 0.4, x: 0, born: t });
      }
    } else {
      drip = 0.35;
    }
    s.recoil = THREE.MathUtils.damp(s.recoil, 0, 1.6, dt);

    for (const u of [main.uniforms, small.uniforms]) u.uTime.value = t;
    main.uniforms.uPointer.value.copy(s.dir);
    main.uniforms.uPointerAmt.value = s.reach;
    main.uniforms.uDrip.value = drip;
    main.uniforms.uRecoil.value = s.recoil;

    if (body.current) {
      body.current.rotation.y = animate ? t * 0.08 : 0.4;
    }

    // falling droplets (stretched by velocity)
    s.drops.forEach((d, i) => {
      const m = drops.current[i];
      if (!m) return;
      if (!d.active) {
        m.visible = false;
        return;
      }
      d.v += 9.8 * 0.55 * dt;
      d.y -= d.v * dt;
      const age = t - d.born;
      const r = 0.13 * SCALE * Math.min(1, 0.6 + age * 3);
      m.visible = true;
      m.position.set(d.x, d.y, 0.05);
      m.scale.set(r / (1 + d.v * 0.05), r * (1 + d.v * 0.18), r / (1 + d.v * 0.05));
      if (d.y < -6) d.active = false;
    });
  });

  return (
    <group position={[0, 0.15, 0]}>
      <mesh ref={body} geometry={geo} material={main.mat} scale={SCALE} />
      {[0, 1].map((i) => (
        <mesh
          key={i}
          ref={(el) => {
            drops.current[i] = el;
          }}
          geometry={dropGeo}
          material={small.mat}
          visible={false}
        />
      ))}
    </group>
  );
}

function Rig({ children, animate }: { children: React.ReactNode; animate: boolean }) {
  const group = useRef<THREE.Group>(null);
  const { pointer } = useThree();
  useFrame((state, delta) => {
    const g = group.current;
    if (!g) return;
    const t = state.clock.elapsedTime;
    g.rotation.y = THREE.MathUtils.damp(g.rotation.y, pointer.x * 0.25, 2, delta);
    g.rotation.x = THREE.MathUtils.damp(g.rotation.x, -pointer.y * 0.12, 2, delta);
    g.position.y = THREE.MathUtils.damp(g.position.y, animate ? Math.sin(t * 0.5) * 0.05 : 0, 2, delta);
    const scroll = typeof window !== "undefined" ? Math.min(window.scrollY / window.innerHeight, 1) : 0;
    g.position.y -= scroll * 0.02;
  });
  return <group ref={group}>{children}</group>;
}

/**
 * Studio built from Lightformers (no HDR download). White key lights keep the oil readable as glossy black;
 * vibrant/lime strips add the subtle PETROLUB green reflections along the edges.
 */
function Studio({ accent }: { accent: string }) {
  return (
    <Environment resolution={512} frames={1}>
      <color attach="background" args={["#020503"]} />
      {/* broad soft key from above: the big liquid highlight */}
      <Lightformer form="rect" intensity={2.4} position={[0, 5, 1.5]} rotation-x={Math.PI / 2} scale={[10, 2.2, 1]} />
      {/* window-like key in front-left: crisp curved reflection */}
      <Lightformer form="rect" intensity={2.4} position={[-3.5, 1.8, 4]} rotation-y={-0.6} scale={[1.4, 3, 1]} />
      {/* thin strips: viscous edge lines */}
      <Lightformer form="rect" color="#effee0" intensity={2.2} position={[-5, 0.4, 0]} rotation-y={Math.PI / 2} scale={[24, 0.16, 1]} />
      <Lightformer form="rect" color={LIME.getStyle()} intensity={1.2} position={[5, -0.5, 0]} rotation-y={-Math.PI / 2} scale={[24, 0.12, 1]} />
      {/* vibrant green bounce from below + deep green fill */}
      <Lightformer form="rect" color={accent} intensity={0.7} position={[0, -5, 2]} rotation-x={-Math.PI / 2} scale={[10, 1.2, 1]} />
      <Lightformer form="rect" color={DEEP} intensity={0.45} position={[3, 3, -4]} scale={[6, 3, 1]} />
      <Lightformer form="ring" intensity={1.2} position={[2.5, 2.2, 5]} scale={0.6} />
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
        dpr={quality === "high" ? [1, 2] : [1, 1.4]}
        frameloop={visible ? (animate ? "always" : "demand") : "never"}
        camera={{ position: [0, 0, 6.2], fov: 32 }}
        gl={{ antialias: true, alpha: true, powerPreference: "high-performance" }}
        onCreated={({ gl }) => {
          gl.toneMapping = THREE.ACESFilmicToneMapping;
          gl.toneMappingExposure = 1.05;
          requestAnimationFrame(() => setReady(true));
        }}
      >
        <Studio accent={accent} />
        <Rig animate={animate}>
          <OilDrop quality={quality} animate={animate} />
        </Rig>
      </Canvas>
    </div>
  );
}
