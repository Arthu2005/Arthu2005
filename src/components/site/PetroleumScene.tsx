"use client";

/* three.js materials/uniforms/geometries are intentionally mutated every frame inside useFrame (standard React Three Fiber pattern). */
/* eslint-disable react-hooks/immutability */

import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { ContactShadows, Environment, Lightformer } from "@react-three/drei";
import { DepthOfField, EffectComposer, N8AO } from "@react-three/postprocessing";
import { useEffect, useMemo, useRef, useState } from "react";
import * as THREE from "three";
import { dripOrigins, recycleGeometry, symbolBounds } from "./recycle-geometry";
import { RECYCLE_GREEN } from "./recycle-symbol";

/**
 * Hero sculpture: the client's recycling symbol in glossy institutional green, wrapped by crude oil.
 *  - symbol: Potrace-vectorised original artwork, extruded and bevelled (faithful geometry)
 *  - oil ring: a thick liquid band orbiting the symbol (passing behind and in front), flowing continuously
 *  - drips: oil filaments hanging from the lowest edges, growing a bulb that detaches and falls
 *  - pool: an organic oil puddle at the base that ripples where each drop lands
 *  - suspended droplets around the composition
 * Studio Lightformers (no HDR download), contact shadows and, on capable devices, ambient occlusion + subtle depth of field.
 */

type Quality = "high" | "medium";

const LIME = new THREE.Color("#a6e22e");
const DEEP = "#0a3d22";
const SCALE = 0.92;
const B = symbolBounds();
const POOL_Y = B.minY * SCALE - 0.24;

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

const OIL_PARAMS: THREE.MeshPhysicalMaterialParameters = {
  color: new THREE.Color("#010101"),
  roughness: 0.035,
  metalness: 0.15,
  clearcoat: 1,
  clearcoatRoughness: 0.02,
  envMapIntensity: 1.8,
  specularIntensity: 1,
};

/** Physical oil material with a custom deformation (`displaced(vec2 st)` must return the object-space position). */
function makeOilMaterial(key: string, glsl: string, uniforms: Record<string, THREE.IUniform>, eps = 0.0025) {
  const mat = new THREE.MeshPhysicalMaterial({ ...OIL_PARAMS, side: THREE.DoubleSide });
  mat.onBeforeCompile = (shader) => {
    Object.assign(shader.uniforms, uniforms, { uRim: { value: LIME.clone() } });
    shader.vertexShader = shader.vertexShader
      .replace("#include <common>", `#include <common>\n${NOISE}\n${glsl}`)
      .replace(
        "#include <beginnormal_vertex>",
        /* glsl */ `
        vec3 sPos = displaced(uv);
        vec3 sdU = displaced(uv + vec2(${eps}, 0.0)) - displaced(uv - vec2(${eps}, 0.0));
        vec3 sdV = displaced(uv + vec2(0.0, ${eps})) - displaced(uv - vec2(0.0, ${eps}));
        vec3 objectNormal = normalize(cross(sdU, sdV) + vec3(1e-6));
        #ifdef USE_TANGENT
          vec3 objectTangent = vec3(tangent.xyz);
        #endif`,
      )
      .replace("#include <begin_vertex>", "vec3 transformed = sPos;");
    shader.fragmentShader = shader.fragmentShader.replace("#include <common>", "#include <common>\nuniform vec3 uRim;").replace(
      "#include <emissivemap_fragment>",
      /* glsl */ `#include <emissivemap_fragment>
      float fres = pow(1.0 - saturate(abs(dot(normalize(normal), normalize(vViewPosition)))), 5.0);
      totalEmissiveRadiance += uRim * fres * 0.07;`,
    );
  };
  mat.customProgramCacheKey = () => `petrolub-${key}`;
  return mat;
}

/* ------------------------------------------------------------------ */
/* Oil ring orbiting the symbol                                         */
/* ------------------------------------------------------------------ */

const RING = /* glsl */ `
uniform float uTime;
const float TX = 0.42; const float TZ = -0.22;
vec3 tilt(vec3 p){
  p = vec3(p.x, p.y * cos(TX) - p.z * sin(TX), p.y * sin(TX) + p.z * cos(TX));
  return vec3(p.x * cos(TZ) - p.y * sin(TZ), p.x * sin(TZ) + p.y * cos(TZ), p.z);
}
vec3 curve(float u, float t){
  float a = -0.6 + u * 4.7 + t * 0.11;
  float R = 1.36 + 0.07 * sin(a * 2.0 + t * 0.5);
  vec3 p = vec3(cos(a) * R, sin(a * 3.0 + t * 0.6) * 0.05, sin(a) * R * 0.78);
  return tilt(p);
}
vec3 displaced(vec2 st){
  float u = clamp(st.x, 0.0, 1.0);
  float th = st.y * 6.2831853;
  float t = uTime;
  vec3 c = curve(u, t);
  vec3 T = normalize(curve(u + 0.003, t) - c + vec3(1e-5));
  vec3 up = tilt(vec3(0.0, 1.0, 0.0));
  vec3 N = normalize(cross(T, up));
  vec3 Bn = normalize(cross(N, T));
  // thin tail -> body -> rounded head, with pulses travelling along the flow
  float w = (0.015 + 0.15 * smoothstep(0.0, 0.45, u)) * (1.0 - smoothstep(0.9, 1.0, u));
  w *= 1.0 + 0.18 * sin(u * 14.0 - t * 1.8);
  float side = cos(th);
  float edge = smoothstep(0.6, 1.0, abs(side));
  w *= 1.0 + edge * 0.18 * snoise(vec3(u * 26.0 - t * 1.2, side * 2.0, t * 0.3));
  float thick = 0.025 + w * 0.32;
  vec3 p = c + N * side * w + Bn * (sin(th) * thick - side * side * w * 0.18);
  vec3 nrm = normalize(N * side + Bn * sin(th) + vec3(1e-5));
  p += nrm * (snoise(vec3(u * 9.0 - t * 1.0, th * 0.6, t * 0.2)) * 0.012 + snoise(vec3(u * 22.0 - t * 1.7, th, 0.0)) * 0.004);
  return p;
}
`;

function OilRing({ quality, time }: { quality: Quality; time: React.MutableRefObject<number> }) {
  const uniforms = useMemo(() => ({ uTime: { value: 0 } }), []);
  const mat = useMemo(() => makeOilMaterial("ring", RING, uniforms), [uniforms]);
  const geo = useMemo(() => new THREE.PlaneGeometry(1, 1, quality === "high" ? 380 : 200, quality === "high" ? 36 : 22), [quality]);
  useEffect(() => () => (geo.dispose(), mat.dispose()), [geo, mat]);
  useFrame(() => {
    uniforms.uTime.value = time.current;
  });
  return <mesh geometry={geo} material={mat} frustumCulled={false} />;
}

/* ------------------------------------------------------------------ */
/* Pool at the base, rippling where drops land                          */
/* ------------------------------------------------------------------ */

const POOL = /* glsl */ `
uniform float uTime;
uniform vec4 uImpacts[4];   // x, y (pool plane), start time, strength
float outline(float a, float t){
  return 1.0 + 0.09 * snoise(vec3(cos(a) * 1.4, sin(a) * 1.4, t * 0.04)) + 0.035 * sin(a * 5.0 + t * 0.15);
}
float heightAt(vec2 q, float rho, float t){
  float h = 0.045 * pow(max(1.0 - rho * rho, 0.0), 0.35);       // meniscus dome
  h += snoise(vec3(q * 2.2, t * 0.12)) * 0.004 * (1.0 - rho);     // slow surface drift
  for (int i = 0; i < 4; i++) {
    vec4 im = uImpacts[i];
    float age = t - im.z;
    if (age < 0.0 || age > 4.0) continue;
    float d = distance(q, im.xy);
    float front = age * 0.42;
    float env = exp(-age * 1.1) * exp(-d * 2.2) * smoothstep(front + 0.05, front - 0.25, d);
    h += sin(d * 34.0 - age * 10.0) * env * 0.009 * im.w;
  }
  return h * smoothstep(1.0, 0.94, rho);
}
vec3 displaced(vec2 st){
  // polar grid: st.x = radius (0..1), st.y = angle (0..1)
  float t = uTime;
  float a = st.y * 6.2831853;
  float rho = clamp(st.x, 0.0, 1.0);
  float r = rho * outline(a, t);
  vec2 q = vec2(cos(a), sin(a)) * r;
  return vec3(q, heightAt(q, rho, t));
}
`;

function OilPool({ quality, time, impacts }: { quality: Quality; time: React.MutableRefObject<number>; impacts: React.MutableRefObject<THREE.Vector4[]> }) {
  const uniforms = useMemo(() => ({ uTime: { value: 0 }, uImpacts: { value: [0, 1, 2, 3].map(() => new THREE.Vector4(0, 0, -100, 0)) } }), []);
  const mat = useMemo(() => makeOilMaterial("pool", POOL, uniforms, 0.004), [uniforms]);
  // plane whose uv.x = radius, uv.y = angle
  const geo = useMemo(() => new THREE.PlaneGeometry(1, 1, quality === "high" ? 64 : 36, quality === "high" ? 200 : 110), [quality]);
  useEffect(() => () => (geo.dispose(), mat.dispose()), [geo, mat]);
  useFrame(() => {
    uniforms.uTime.value = time.current;
    impacts.current.forEach((v, i) => uniforms.uImpacts.value[i]!.copy(v));
  });
  return <mesh geometry={geo} material={mat} position={[0, POOL_Y, 0.05]} rotation={[-Math.PI / 2, 0, 0]} scale={[1.22, 0.62, 1]} frustumCulled={false} />;
}

/* ------------------------------------------------------------------ */
/* Drips hanging from the symbol + falling drops                        */
/* ------------------------------------------------------------------ */

const DRIP_PTS = 28;
const DRIP_SEG = 22;

function dripProfile(L: number, bulb: number, film: number) {
  const pts: THREE.Vector2[] = [];
  const neck = DRIP_PTS - 10;
  for (let i = 0; i < neck; i++) {
    const s = i / (neck - 1);
    const r = film * (1 - s) ** 0.6 + bulb * 0.55 * THREE.MathUtils.smoothstep(s, 0.55, 1) + 0.004;
    pts.push(new THREE.Vector2(r, -s * L));
  }
  for (let i = 1; i <= DRIP_PTS - neck; i++) {
    const a = (i / (DRIP_PTS - neck)) * (Math.PI / 2);
    pts.push(new THREE.Vector2(Math.max(Math.cos(a) * bulb, 0.0005), -L - Math.sin(a) * bulb * 1.15));
  }
  return pts;
}

function writeLathe(geo: THREE.BufferGeometry, pts: THREE.Vector2[]) {
  const pos = geo.attributes.position as THREE.BufferAttribute;
  let k = 0;
  for (let i = 0; i <= DRIP_SEG; i++) {
    const phi = (i / DRIP_SEG) * Math.PI * 2;
    const sin = Math.sin(phi);
    const cos = Math.cos(phi);
    for (const p of pts) pos.setXYZ(k++, p.x * sin, p.y, p.x * cos);
  }
  pos.needsUpdate = true;
  geo.computeVertexNormals();
}

type Fall = { active: boolean; pos: THREE.Vector3; v: number; r: number };

function Drips({ time, impacts, speed }: { time: React.MutableRefObject<number>; impacts: React.MutableRefObject<THREE.Vector4[]>; speed: number }) {
  const origins = useMemo(() => dripOrigins(3).map((o) => o.multiplyScalar(SCALE)), []);
  const mat = useMemo(() => new THREE.MeshPhysicalMaterial(OIL_PARAMS), []);
  const geos = useMemo(() => origins.map(() => new THREE.LatheGeometry(dripProfile(0.1, 0.03, 0.03), DRIP_SEG)), [origins]);
  const dropGeo = useMemo(() => new THREE.IcosahedronGeometry(1, 3), []);
  const falls = useRef<Fall[]>(origins.map(() => ({ active: false, pos: new THREE.Vector3(), v: 0, r: 0 })));
  const fallMeshes = useRef<(THREE.Mesh | null)[]>([]);
  const nextImpact = useRef(0);
  const periods = [5.6, 7.1, 6.3];
  const offsets = [0.2, 2.9, 4.6];
  useEffect(() => () => (geos.forEach((g) => g.dispose()), dropGeo.dispose(), mat.dispose()), [geos, dropGeo, mat]);

  useFrame((_, delta) => {
    const t = time.current;
    const dt = Math.min(delta, 0.05) * speed;
    origins.forEach((o, i) => {
      const P = periods[i]!;
      const local = t + offsets[i]!;
      const ph = (local % P) / P;
      const cycle = Math.floor(local / P);
      const grow = ph ** 1.8;
      const L = 0.05 + grow * (0.22 + i * 0.04);
      const bulb = 0.028 + grow * 0.03;
      writeLathe(geos[i]!, dripProfile(L, bulb, 0.032));
      const f = falls.current[i]!;
      // detach near the end of the cycle
      if (ph > 0.985 && !f.active && (f as Fall & { cycle?: number }).cycle !== cycle) {
        Object.assign(f, { active: true, v: 0.2, r: bulb * 0.9, cycle });
        f.pos.set(o.x, o.y - L - bulb, o.z);
      }
      if (f.active) {
        f.v += 4.2 * dt;
        f.pos.y -= f.v * dt;
        if (f.pos.y <= POOL_Y + 0.05) {
          f.active = false;
          const slot = nextImpact.current++ % 4;
          // world -> pool plane coordinates (mesh rotated -90° on X, scaled 1.22 × 0.62)
          impacts.current[slot] = new THREE.Vector4(f.pos.x / 1.22, -(f.pos.z - 0.05) / 0.62, t, 1);
        }
      }
      const m = fallMeshes.current[i];
      if (m) {
        m.visible = f.active;
        if (f.active) {
          m.position.copy(f.pos);
          const st = 1 + Math.min(f.v * 0.12, 0.5);
          m.scale.set(f.r / Math.sqrt(st), f.r * st, f.r / Math.sqrt(st));
        }
      }
    });
  });

  return (
    <>
      {origins.map((o, i) => (
        <mesh key={i} geometry={geos[i]} material={mat} position={[o.x, o.y + 0.015, o.z]} />
      ))}
      {origins.map((_, i) => (
        <mesh
          key={`f${i}`}
          ref={(el) => {
            fallMeshes.current[i] = el;
          }}
          geometry={dropGeo}
          material={mat}
          visible={false}
        />
      ))}
    </>
  );
}

/* ------------------------------------------------------------------ */
/* Suspended droplets                                                    */
/* ------------------------------------------------------------------ */

function Droplets({ count, time }: { count: number; time: React.MutableRefObject<number> }) {
  const mesh = useRef<THREE.InstancedMesh>(null);
  const mat = useMemo(() => new THREE.MeshPhysicalMaterial(OIL_PARAMS), []);
  const geo = useMemo(() => new THREE.IcosahedronGeometry(1, 4), []);
  const seeds = useMemo(
    () =>
      Array.from({ length: count }, (_, i) => ({
        a: (i / count) * Math.PI * 2 + (i % 3) * 0.4,
        r: 1.55 + ((i * 37) % 10) / 18,
        y: -0.7 + ((i * 53) % 14) / 9,
        z: ((i * 29) % 10) / 10 - 0.5,
        s: 0.018 + (((i * 71) % 10) / 10) ** 2 * 0.045,
        w: 0.6 + ((i * 17) % 7) / 10,
      })),
    [count],
  );
  const m4 = useMemo(() => new THREE.Matrix4(), []);
  const q = useMemo(() => new THREE.Quaternion(), []);
  const v = useMemo(() => new THREE.Vector3(), []);
  const sc = useMemo(() => new THREE.Vector3(), []);
  useEffect(() => () => (geo.dispose(), mat.dispose()), [geo, mat]);
  useFrame(() => {
    const t = time.current;
    seeds.forEach((d, i) => {
      const a = d.a + t * 0.05 * d.w;
      v.set(Math.cos(a) * d.r, d.y + Math.sin(t * 0.6 * d.w + i) * 0.06, Math.sin(a) * d.r * 0.5 + d.z);
      const wob = 1 + Math.sin(t * 2.1 * d.w + i) * 0.06;
      sc.set(d.s * wob, (d.s / wob) * 1.04, d.s * wob);
      m4.compose(v, q, sc);
      mesh.current?.setMatrixAt(i, m4);
    });
    if (mesh.current) mesh.current.instanceMatrix.needsUpdate = true;
  });
  return <instancedMesh ref={mesh} args={[geo, mat, count]} frustumCulled={false} />;
}

/* ------------------------------------------------------------------ */
/* Composition                                                          */
/* ------------------------------------------------------------------ */

function Sculpture({ quality, speed }: { quality: Quality; speed: number }) {
  const time = useRef(0);
  const impacts = useRef<THREE.Vector4[]>([0, 1, 2, 3].map(() => new THREE.Vector4(0, 0, -100, 0)));
  const symbolGeo = useMemo(() => recycleGeometry(quality), [quality]);
  const symbolMat = useMemo(
    () =>
      new THREE.MeshPhysicalMaterial({
        color: new THREE.Color(RECYCLE_GREEN),
        roughness: 0.16,
        metalness: 0.05,
        clearcoat: 1,
        clearcoatRoughness: 0.06,
        sheen: 0.3,
        sheenColor: new THREE.Color("#7cc62b"),
        envMapIntensity: 1.25,
      }),
    [],
  );
  useEffect(() => () => (symbolGeo.dispose(), symbolMat.dispose()), [symbolGeo, symbolMat]);
  useFrame((_, delta) => {
    time.current += Math.min(delta, 0.05) * speed;
  });
  return (
    <group>
      <mesh geometry={symbolGeo} material={symbolMat} scale={SCALE} castShadow />
      <OilRing quality={quality} time={time} />
      <Drips time={time} impacts={impacts} speed={speed} />
      <OilPool quality={quality} time={time} impacts={impacts} />
      <Droplets count={quality === "high" ? 11 : 7} time={time} />
    </group>
  );
}

function Rig({ children, speed }: { children: React.ReactNode; speed: number }) {
  const group = useRef<THREE.Group>(null);
  const { pointer } = useThree();
  const clock = useRef(0);
  useFrame((_, delta) => {
    const g = group.current;
    if (!g) return;
    clock.current += delta * speed;
    const t = clock.current;
    // continuous slow sway + subtle rotation following the cursor
    g.rotation.y = THREE.MathUtils.damp(g.rotation.y, Math.sin(t * 0.2) * 0.22 + pointer.x * 0.3, 2.2, delta);
    g.rotation.x = THREE.MathUtils.damp(g.rotation.x, -pointer.y * 0.12, 2.2, delta);
    g.position.y = Math.sin(t * 0.5) * 0.03;
  });
  return <group ref={group}>{children}</group>;
}

function Studio({ accent }: { accent: string }) {
  return (
    <Environment resolution={512} frames={1}>
      <color attach="background" args={["#030604"]} />
      <Lightformer form="rect" intensity={2.6} position={[0, 5, 2]} rotation-x={Math.PI / 2} scale={[10, 2.4, 1]} />
      <Lightformer form="rect" intensity={3} position={[-3.6, 1.6, 4]} rotation-y={-0.65} scale={[1.6, 3.4, 1]} />
      <Lightformer form="rect" intensity={1.6} position={[3.8, 1.2, 3.5]} rotation-y={0.7} scale={[1, 3, 1]} />
      <Lightformer form="rect" color="#f2ffe6" intensity={2} position={[-5, 0.3, 0]} rotation-y={Math.PI / 2} scale={[24, 0.16, 1]} />
      <Lightformer form="rect" color={LIME.getStyle()} intensity={1.1} position={[5, -0.4, 0]} rotation-y={-Math.PI / 2} scale={[24, 0.12, 1]} />
      <Lightformer form="rect" color={accent} intensity={0.8} position={[0, -5, 2]} rotation-x={-Math.PI / 2} scale={[10, 1.2, 1]} />
      <Lightformer form="rect" color={DEEP} intensity={0.5} position={[3, 3, -4]} scale={[6, 3, 1]} />
    </Environment>
  );
}

function CameraAim() {
  const { camera } = useThree();
  useEffect(() => {
    camera.lookAt(0, -0.18, 0);
  }, [camera]);
  return null;
}

export default function PetroleumScene({ accent = "#1c782b", reducedMotion = false, quality = "high" }: { accent?: string; reducedMotion?: boolean; quality?: Quality }) {
  const wrapper = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(true);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const el = wrapper.current;
    if (!el) return;
    const io = new IntersectionObserver(([e]) => setVisible(e?.isIntersecting ?? true), { rootMargin: "100px" });
    io.observe(el);
    return () => io.disconnect();
  }, []);

  // Always animated; reduced-motion users get a slower, gentler flow instead of a frozen frame.
  const speed = reducedMotion ? 0.35 : 1;

  return (
    <div ref={wrapper} className="absolute inset-0 transition-opacity duration-[1400ms] ease-out" style={{ opacity: ready ? 1 : 0 }} aria-hidden="true">
      <Canvas
        dpr={quality === "high" ? [1, 2] : [1, 1.4]}
        frameloop={visible ? "always" : "never"}
        camera={{ position: [0, 0.55, 6.6], fov: 32 }}
        gl={{ antialias: true, alpha: true, powerPreference: "high-performance", premultipliedAlpha: false }}
        onCreated={({ gl }) => {
          gl.toneMapping = THREE.ACESFilmicToneMapping;
          gl.toneMappingExposure = 1.05;
          requestAnimationFrame(() => setReady(true));
        }}
      >
        <CameraAim />
        <Studio accent={accent} />
        <Rig speed={speed}>
          <Sculpture quality={quality} speed={speed} />
        </Rig>
        <ContactShadows position={[0, POOL_Y - 0.03, 0]} scale={6} blur={2.6} opacity={0.32} far={3} resolution={512} color="#0b120e" />
        {quality === "high" && (
          <EffectComposer multisampling={4} enableNormalPass={false}>
            <N8AO aoRadius={0.5} intensity={1.6} distanceFalloff={0.6} halfRes />
            <DepthOfField target={[0, 0, 0.3]} focalLength={0.12} bokehScale={0.9} height={540} />
          </EffectComposer>
        )}
      </Canvas>
    </div>
  );
}
