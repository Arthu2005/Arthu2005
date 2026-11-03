"use client";

/* three.js materials/uniforms are intentionally mutated every frame inside useFrame (standard React Three Fiber pattern). */
/* eslint-disable react-hooks/immutability */

import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { Environment, Lightformer } from "@react-three/drei";
import { useEffect, useMemo, useRef, useState } from "react";
import * as THREE from "three";

/**
 * "A força do petróleo em movimento" — a swirling splash of crude oil.
 *
 * The splash is a thick liquid ribbon swept along an animated spiral (closed elliptical cross-section),
 * built entirely in the vertex shader:
 *  - thin tail → wide sheet → curling crown at the head
 *  - liquid flowing along the ribbon (noise advected along the stream), edges breaking into fingers
 *  - the whole stream slowly twists, breathes and turns by itself (no interaction needed)
 *  - droplets keep detaching from the edges and flying off under gravity (instanced)
 *  - the surface reaches gently toward the cursor when there is one
 * Material: black clear-coated PBR in a Lightformer studio (no HDR download) with subtle green/lime strips
 * and a lime fresnel rim for the PETROLUB identity.
 */

type Quality = "high" | "medium";

const LIME = new THREE.Color("#a6e22e");
const DEEP = "#0a3d22";

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

/** Centerline of the stream (JS twin of the GLSL `curve`, used to emit droplets from the sheet). */
function curveJS(u: number, t: number, out = new THREE.Vector3()) {
  const a = -1.15 - u * 4.35 + Math.sin(t * 0.33) * 0.16 + Math.sin(t * 0.21 + u * 3.0) * 0.08;
  const R = 0.55 + 0.62 * u + Math.sin(t * 0.4 + u * 2.0) * 0.04;
  return out.set(Math.cos(a) * R * 1.25, Math.sin(a) * R * 0.92 + (u - 0.45) * 0.55, Math.sin(u * Math.PI + t * 0.25) * 0.42 - 0.1);
}
const widthJS = (u: number) => (0.02 + 0.38 * THREE.MathUtils.smoothstep(u, 0, 0.72) + 0.14 * THREE.MathUtils.smoothstep(u, 0.78, 0.9)) * (1 - THREE.MathUtils.smoothstep(u, 0.93, 1));

const STREAM = /* glsl */ `
uniform float uTime;
uniform vec3  uPointer;
uniform float uPointerAmt;

vec3 curve(float u, float t){
  float a = -1.15 - u * 4.35 + sin(t * 0.33) * 0.16 + sin(t * 0.21 + u * 3.0) * 0.08;
  float R = 0.55 + 0.62 * u + sin(t * 0.4 + u * 2.0) * 0.04;
  return vec3(cos(a) * R * 1.25, sin(a) * R * 0.92 + (u - 0.45) * 0.55, sin(u * 3.14159265 + t * 0.25) * 0.42 - 0.1);
}

// half-width of the sheet: thin tail, wide body, curling crown, closed head
float widthAt(float u, float t){
  float w = 0.02 + 0.38 * smoothstep(0.0, 0.72, u);
  w += 0.14 * smoothstep(0.78, 0.9, u);
  w *= 1.0 - smoothstep(0.93, 1.0, u);
  w *= 1.0 + 0.12 * sin(u * 9.0 - t * 1.4);   // pulses travelling along the stream
  return w;
}

vec3 streamPos(float u, float th){
  float t = uTime;
  vec3 c  = curve(u, t);
  vec3 c2 = curve(u + 0.004, t);
  vec3 T  = normalize(c2 - c + vec3(1e-5));
  vec3 N  = normalize(cross(T, vec3(0.0, 0.0, 1.0)));   // broad face of the sheet looks at the camera
  vec3 B  = normalize(cross(N, T));

  float w = widthAt(u, t);
  float side = cos(th);
  // edges break up into liquid fingers advected along the flow
  float edge = smoothstep(0.55, 1.0, abs(side));
  float fingers = snoise(vec3(u * 22.0 - t * 1.1, side * 2.0, t * 0.3));
  w *= 1.0 + edge * (0.22 * fingers + 0.08);

  float thick = 0.035 + w * 0.16;
  // the sheet cups across its width, more at the crown
  float cup = (0.25 + 0.6 * smoothstep(0.7, 0.95, u)) * w;
  vec3 p = c + N * side * w + B * (sin(th) * thick + side * side * cup);

  // flowing surface ripples
  vec3 nrm = normalize(N * side + B * sin(th) + vec3(1e-5));
  float flow = snoise(vec3(u * 7.0 - t * 0.9, th * 0.7, t * 0.25)) * 0.022
             + snoise(vec3(u * 16.0 - t * 1.6, th, 0.0)) * 0.008;
  p += nrm * flow * (0.4 + w);

  // reach toward the pointer
  float facing = max(dot(normalize(p), uPointer), 0.0);
  p += nrm * pow(facing, 8.0) * uPointerAmt * 0.12;
  return p;
}
`;

function makeStreamMaterial() {
  const uniforms = {
    uTime: { value: 0 },
    uPointer: { value: new THREE.Vector3(0, 0, 1) },
    uPointerAmt: { value: 0 },
    uRim: { value: LIME.clone() },
    uRimAmt: { value: 0.1 },
  };
  const mat = new THREE.MeshPhysicalMaterial({
    color: new THREE.Color("#010201"),
    roughness: 0.06,
    metalness: 0.2,
    clearcoat: 1,
    clearcoatRoughness: 0.03,
    envMapIntensity: 1.7,
    side: THREE.DoubleSide,
  });
  mat.onBeforeCompile = (shader) => {
    Object.assign(shader.uniforms, uniforms);
    shader.vertexShader = shader.vertexShader
      .replace("#include <common>", `#include <common>\n${NOISE}\n${STREAM}`)
      .replace(
        "#include <beginnormal_vertex>",
        /* glsl */ `
        float su = uv.x;
        float sth = uv.y * 6.2831853;
        vec3 sPos = streamPos(su, sth);
        vec3 sdU = streamPos(min(su + 0.0025, 1.0), sth) - streamPos(max(su - 0.0025, 0.0), sth);
        vec3 sdT = streamPos(su, sth + 0.02) - streamPos(su, sth - 0.02);
        vec3 objectNormal = normalize(cross(sdU, sdT) + vec3(1e-6));
        #ifdef USE_TANGENT
          vec3 objectTangent = vec3(tangent.xyz);
        #endif
        `,
      )
      .replace("#include <begin_vertex>", "vec3 transformed = sPos;");
    shader.fragmentShader = shader.fragmentShader
      .replace("#include <common>", "#include <common>\nuniform vec3 uRim;\nuniform float uRimAmt;")
      .replace(
        "#include <emissivemap_fragment>",
        /* glsl */ `#include <emissivemap_fragment>
        float fres = pow(1.0 - saturate(abs(dot(normalize(normal), normalize(vViewPosition)))), 4.5);
        totalEmissiveRadiance += uRim * fres * uRimAmt;`,
      );
  };
  mat.customProgramCacheKey = () => "petrolub-oil-stream";
  return { mat, uniforms };
}

type Droplet = { pos: THREE.Vector3; vel: THREE.Vector3; life: number; max: number; size: number };

const UP = new THREE.Vector3(0, 1, 0);
const Z = new THREE.Vector3(0, 0, 1);

function Splash({ quality, speed }: { quality: Quality; speed: number }) {
  const { pointer, size } = useThree();
  const stream = useMemo(() => makeStreamMaterial(), []);
  const dropMat = useMemo(
    () => new THREE.MeshPhysicalMaterial({ color: "#010201", roughness: 0.05, metalness: 0.2, clearcoat: 1, clearcoatRoughness: 0.03, envMapIntensity: 1.7 }),
    [],
  );
  // x = position along the stream, y = angle around the cross-section
  const geo = useMemo(() => new THREE.PlaneGeometry(1, 1, quality === "high" ? 420 : 220, quality === "high" ? 48 : 28), [quality]);
  const dropGeo = useMemo(() => new THREE.IcosahedronGeometry(1, 3), []);
  const COUNT = quality === "high" ? 34 : 18;
  const drops = useRef<THREE.InstancedMesh>(null);
  const sim = useRef({ clock: 0, idle: 10, last: new THREE.Vector2(9, 9), dir: new THREE.Vector3(0, 0, 1), reach: 0, particles: [] as Droplet[] });
  const tmp = useMemo(
    () => ({ m: new THREE.Matrix4(), q: new THREE.Quaternion(), s: new THREE.Vector3(), a: new THREE.Vector3(), b: new THREE.Vector3(), T: new THREE.Vector3(), N: new THREE.Vector3(), v: new THREE.Vector3(), target: new THREE.Vector3() }),
    [],
  );

  useEffect(
    () => () => {
      geo.dispose();
      dropGeo.dispose();
      stream.mat.dispose();
      dropMat.dispose();
    },
    [geo, dropGeo, stream, dropMat],
  );

  const spawn = (d: Droplet, t: number, initial = false) => {
    const u = 0.25 + Math.random() * 0.72;
    const c = curveJS(u, t, tmp.a);
    const c2 = curveJS(Math.min(u + 0.01, 1), t, tmp.b);
    const T = tmp.T.copy(c2).sub(c).normalize();
    const N = tmp.N.crossVectors(T, Z).normalize();
    const side = Math.random() < 0.5 ? -1 : 1;
    d.pos.copy(c).addScaledVector(N, side * widthJS(u) * 1.1);
    d.vel
      .copy(T)
      .multiplyScalar(0.5 + Math.random() * 0.6)
      .addScaledVector(N, side * (0.35 + Math.random() * 0.6));
    d.vel.x += (Math.random() - 0.5) * 0.2;
    d.vel.y += 0.15 + Math.random() * 0.35;
    d.vel.z += (Math.random() - 0.5) * 0.3;
    d.max = 1.4 + Math.random() * 1.8;
    d.life = initial ? Math.random() * d.max : 0;
    d.size = 0.012 + Math.pow(Math.random(), 2.2) * 0.05;
  };

  useFrame((_, delta) => {
    const s = sim.current;
    const dt = Math.min(delta, 0.05) * speed;
    s.clock += dt;
    const t = s.clock;

    // reach toward the cursor while it moves; otherwise a slow virtual one keeps the surface alive
    const moved = s.last.distanceToSquared(pointer) > 1e-6;
    s.last.copy(pointer);
    s.idle = moved ? 0 : s.idle + delta;
    if (s.idle > 2.5) tmp.target.set(Math.sin(t * 0.4) * 0.8, Math.cos(t * 0.27) * 0.6, 0.8);
    else tmp.target.set(pointer.x, pointer.y, 0.7);
    s.dir.lerp(tmp.target.normalize(), 0.05).normalize();
    s.reach = THREE.MathUtils.damp(s.reach, s.idle > 2.5 ? 0.5 : 1, 3, delta);

    stream.uniforms.uTime.value = t;
    stream.uniforms.uPointer.value.copy(s.dir);
    stream.uniforms.uPointerAmt.value = s.reach;

    const mesh = drops.current;
    if (!mesh) return;
    if (s.particles.length !== COUNT) {
      s.particles = Array.from({ length: COUNT }, () => {
        const d: Droplet = { pos: new THREE.Vector3(), vel: new THREE.Vector3(), life: 0, max: 1, size: 0.02 };
        spawn(d, t, true);
        return d;
      });
    }
    s.particles.forEach((d, i) => {
      d.life += dt;
      if (d.life > d.max) spawn(d, t);
      d.vel.y -= 1.6 * dt;
      d.vel.multiplyScalar(1 - 0.25 * dt);
      d.pos.addScaledVector(d.vel, dt);
      const k = d.life / d.max;
      const grow = Math.min(1, d.life * 6) * (1 - Math.pow(k, 4));
      const stretch = 1 + Math.min(d.vel.length() * 0.35, 0.9);
      tmp.q.setFromUnitVectors(UP, tmp.v.copy(d.vel).normalize());
      tmp.s.set(d.size * grow, d.size * grow * stretch, d.size * grow);
      tmp.m.compose(d.pos, tmp.q, tmp.s);
      mesh.setMatrixAt(i, tmp.m);
    });
    mesh.instanceMatrix.needsUpdate = true;
  });

  const scale = size.width < 768 ? 0.58 : 0.66;
  return (
    <group scale={scale} position={[0.05, -0.05, 0]} rotation={[0.08, -0.15, -0.12]}>
      <mesh geometry={geo} material={stream.mat} frustumCulled={false} />
      <instancedMesh ref={drops} args={[dropGeo, dropMat, COUNT]} frustumCulled={false} />
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
    // continuous, automatic motion: slow turn and float, plus light parallax with the pointer
    g.rotation.y = THREE.MathUtils.damp(g.rotation.y, Math.sin(t * 0.18) * 0.35 + pointer.x * 0.2, 2, delta);
    g.rotation.x = THREE.MathUtils.damp(g.rotation.x, Math.cos(t * 0.15) * 0.12 - pointer.y * 0.1, 2, delta);
    g.rotation.z = Math.sin(t * 0.11) * 0.06;
    g.position.y = Math.sin(t * 0.45) * 0.06;
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
      <Lightformer form="rect" intensity={2.4} position={[0, 5, 1.5]} rotation-x={Math.PI / 2} scale={[10, 2.2, 1]} />
      <Lightformer form="rect" intensity={2.6} position={[-3.5, 1.8, 4]} rotation-y={-0.6} scale={[1.4, 3, 1]} />
      <Lightformer form="rect" color="#effee0" intensity={2.2} position={[-5, 0.4, 0]} rotation-y={Math.PI / 2} scale={[24, 0.16, 1]} />
      <Lightformer form="rect" color={LIME.getStyle()} intensity={1.2} position={[5, -0.5, 0]} rotation-y={-Math.PI / 2} scale={[24, 0.12, 1]} />
      <Lightformer form="rect" color={accent} intensity={0.7} position={[0, -5, 2]} rotation-x={-Math.PI / 2} scale={[10, 1.2, 1]} />
      <Lightformer form="rect" color={DEEP} intensity={0.45} position={[3, 3, -4]} scale={[6, 3, 1]} />
      <Lightformer form="ring" intensity={1.2} position={[2.5, 2.2, 5]} scale={0.6} />
    </Environment>
  );
}

export default function PetroleumScene({ accent = "#1c782b", reducedMotion = false, quality = "high" }: { accent?: string; reducedMotion?: boolean; quality?: Quality }) {
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

  // Always animated; reduced-motion users get a slower, gentler flow instead of a frozen frame.
  const speed = reducedMotion ? 0.35 : 1;

  return (
    <div ref={wrapper} className="absolute inset-0 transition-opacity duration-[1400ms] ease-out" style={{ opacity: ready ? 1 : 0 }} aria-hidden="true">
      <Canvas
        dpr={quality === "high" ? [1, 2] : [1, 1.4]}
        frameloop={visible ? "always" : "never"}
        camera={{ position: [0, 0, 6.2], fov: 32 }}
        gl={{ antialias: true, alpha: true, powerPreference: "high-performance" }}
        onCreated={({ gl }) => {
          gl.toneMapping = THREE.ACESFilmicToneMapping;
          gl.toneMappingExposure = 1.05;
          requestAnimationFrame(() => setReady(true));
        }}
      >
        <Studio accent={accent} />
        <Rig speed={speed}>
          <Splash quality={quality} speed={speed} />
        </Rig>
      </Canvas>
    </div>
  );
}
