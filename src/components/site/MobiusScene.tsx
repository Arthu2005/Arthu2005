"use client";

/* three.js materials/uniforms are intentionally mutated every frame inside useFrame (standard React Three Fiber pattern). */
/* eslint-disable react-hooks/immutability */

import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { ContactShadows, Environment, Lightformer } from "@react-three/drei";
import { useEffect, useMemo, useRef, useState } from "react";
import * as THREE from "three";

/**
 * Hero sculpture: "o ciclo infinito do óleo".
 * The recycling symbol was born from the Möbius strip (one surface, no beginning and no end). Here it is a thick
 * liquid Möbius band: black crude/used oil that, as it flows along the loop, turns into clean translucent green
 * (the re-refined base oil) and back again — forever. The surface ripples like a liquid and the colour boundary
 * travels with the flow. Droplets of both phases orbit the loop.
 * Everything is procedural and computed on the GPU (no model download); studio Lightformers, no post-processing.
 */

type Quality = "high" | "medium";

const LIME = new THREE.Color("#a6e22e");
const OIL = new THREE.Color("#020302");
const GREEN = new THREE.Color("#0e6a26");
const GLOW = new THREE.Color("#2bb04e");
const DEEP = "#0a3d22";
const FLOOR_Y = -1.55;

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

/*
 * Thick Möbius band. st.x = position along the loop (0..1), st.y = angle around the elliptical cross-section (0..1).
 * The cross-section turns half a revolution per lap (the Möbius twist); an ellipse is symmetric under that turn, so
 * the surface closes seamlessly. Every modulation is a function of the undeformed position, so there is no seam.
 */
const MOBIUS = /* glsl */ `
uniform float uTime;
const float TAU = 6.2831853;
const float R = 1.22;
vec3 basePoint(float u, float th, float t, out float flowMix){
  float phi = u * 0.5;
  vec3 radial = vec3(cos(u), sin(u), 0.0);
  vec3 up = vec3(0.0, 0.0, 1.0);
  vec3 e1 = cos(phi) * radial + sin(phi) * up;
  vec3 e2 = -sin(phi) * radial + cos(phi) * up;
  // liquid "pulses": the band swells and thins as the oil flows around the loop
  float flow = u - t * 0.22;
  float a = 0.56 * (1.0 + 0.10 * sin(flow * 3.0) + 0.05 * sin(flow * 5.0 + 1.3));
  float b = 0.105 * (1.0 + 0.2 * sin(flow * 3.0 + 0.8));
  flowMix = smoothstep(-0.55, 0.15, cos(u - t * 0.16));
  return R * radial + e1 * (a * cos(th)) + e2 * (b * sin(th));
}
vec3 displaced(vec2 st){
  float u = st.x * TAU;
  float th = st.y * TAU;
  float t = uTime;
  float m;
  vec3 p = basePoint(u, th, t, m);
  // surface ripples flowing along the loop: rotate the noise field around the ring axis over time
  float ang = -t * 0.12;
  vec3 q = vec3(p.x * cos(ang) - p.y * sin(ang), p.x * sin(ang) + p.y * cos(ang), p.z);
  vec3 c = vec3(cos(u), sin(u), 0.0) * R;
  vec3 out_ = normalize(p - c + vec3(1e-5));
  // ripples scaled by the local thickness so the two faces of the band never cross
  float rip = (snoise(q * 1.4 + vec3(0.0, 0.0, t * 0.16)) * 0.008 + snoise(q * 3.0 + vec3(t * 0.22)) * 0.002) * (0.4 + 0.6 * abs(cos(th)));
  return p + out_ * rip;
}
`;

function makeMobiusMaterial(uniforms: Record<string, THREE.IUniform>, eps = 0.0016) {
  const mat = new THREE.MeshPhysicalMaterial({
    color: 0xffffff,
    roughness: 0.05,
    metalness: 0.12,
    clearcoat: 1,
    clearcoatRoughness: 0.03,
    envMapIntensity: 1.7,
    specularIntensity: 1,
    side: THREE.DoubleSide,
  });
  mat.onBeforeCompile = (shader) => {
    Object.assign(shader.uniforms, uniforms, {
      uOil: { value: OIL.clone() },
      uGreen: { value: GREEN.clone() },
      uGlow: { value: GLOW.clone() },
      uRim: { value: LIME.clone() },
    });
    shader.vertexShader = shader.vertexShader
      .replace("#include <common>", `#include <common>\n${NOISE}\n${MOBIUS}\nvarying float vMix;`)
      .replace(
        "#include <beginnormal_vertex>",
        /* glsl */ `
        vec3 sPos = displaced(uv);
        float mixTmp; basePoint(uv.x * TAU, uv.y * TAU, uTime, mixTmp); vMix = mixTmp;
        vec3 sdU = displaced(uv + vec2(${eps}, 0.0)) - displaced(uv - vec2(${eps}, 0.0));
        vec3 sdV = displaced(uv + vec2(0.0, ${eps * 4})) - displaced(uv - vec2(0.0, ${eps * 4}));
        vec3 objectNormal = -normalize(cross(sdU, sdV) + vec3(1e-6));
        #ifdef USE_TANGENT
          vec3 objectTangent = vec3(tangent.xyz);
        #endif`,
      )
      .replace("#include <begin_vertex>", "vec3 transformed = sPos;");
    shader.fragmentShader = shader.fragmentShader
      .replace("#include <common>", "#include <common>\nuniform vec3 uOil; uniform vec3 uGreen; uniform vec3 uGlow; uniform vec3 uRim;\nvarying float vMix;")
      .replace("#include <color_fragment>", "#include <color_fragment>\n diffuseColor.rgb = mix(uOil, uGreen, vMix);")
      .replace("#include <roughnessmap_fragment>", "#include <roughnessmap_fragment>\n roughnessFactor = mix(0.035, 0.07, vMix);")
      .replace("#include <lights_physical_fragment>", "#include <lights_physical_fragment>\n material.clearcoat *= mix(1.0, 0.8, vMix);")
      .replace(
        "#include <emissivemap_fragment>",
        /* glsl */ `#include <emissivemap_fragment>
        float ndv = saturate(abs(dot(normalize(normal), normalize(vViewPosition))));
        float fres = pow(1.0 - ndv, 4.0);
        // clean oil glows faintly from within (translucent look); crude oil only catches a thin lime rim
        // clean oil: lit from within where the liquid is "thick" (facing the camera), darker towards the edges
        totalEmissiveRadiance += uGlow * vMix * (0.28 + 0.95 * pow(ndv, 2.0)) + uRim * fres * mix(0.04, 0.22, vMix);`,
      );
  };
  mat.customProgramCacheKey = () => "petrolub-mobius";
  return mat;
}

function MobiusBand({ quality, time }: { quality: Quality; time: React.MutableRefObject<number> }) {
  const uniforms = useMemo(() => ({ uTime: { value: 0 } }), []);
  const mat = useMemo(() => makeMobiusMaterial(uniforms), [uniforms]);
  const geo = useMemo(() => new THREE.PlaneGeometry(1, 1, quality === "high" ? 420 : 240, quality === "high" ? 48 : 32), [quality]);
  useEffect(() => () => (geo.dispose(), mat.dispose()), [geo, mat]);
  useFrame(() => {
    uniforms.uTime.value = time.current;
  });
  return <mesh geometry={geo} material={mat} frustumCulled={false} />;
}

/* Droplets of crude (black) and re-refined (green) oil orbiting the loop. */
function Droplets({ count, time, green }: { count: number; time: React.MutableRefObject<number>; green: boolean }) {
  const mesh = useRef<THREE.InstancedMesh>(null);
  const geo = useMemo(() => new THREE.SphereGeometry(1, 32, 24), []);
  const mat = useMemo(
    () =>
      new THREE.MeshPhysicalMaterial({
        color: green ? GREEN : OIL,
        emissive: green ? GREEN : new THREE.Color(0),
        emissiveIntensity: green ? 0.7 : 0,
        roughness: 0.04,
        metalness: 0.1,
        clearcoat: 1,
        clearcoatRoughness: 0.03,
        envMapIntensity: 1.8,
      }),
    [green],
  );
  const seeds = useMemo(
    () =>
      Array.from({ length: count }, (_, i) => {
        const k = i + (green ? 0.5 : 0);
        return { a: (k / count) * Math.PI * 2 + (green ? 0.4 : 0), r: 1.75 + ((k * 0.37) % 0.55), z: (((k * 0.61) % 1) - 0.5) * 0.9, s: 0.028 + ((k * 0.29) % 0.04), w: 0.6 + ((k * 0.43) % 0.7) };
      }),
    [count, green],
  );
  const tmp = useMemo(() => ({ m: new THREE.Matrix4(), v: new THREE.Vector3(), q: new THREE.Quaternion(), s: new THREE.Vector3() }), []);
  useEffect(() => () => (geo.dispose(), mat.dispose()), [geo, mat]);
  useFrame(() => {
    const t = time.current;
    seeds.forEach((d, i) => {
      const a = d.a + t * 0.07 * d.w;
      tmp.v.set(Math.cos(a) * d.r, Math.sin(a) * d.r * 0.82, d.z + Math.sin(t * 0.7 * d.w + i) * 0.08);
      const wob = 1 + Math.sin(t * 2.2 * d.w + i) * 0.07;
      tmp.s.set(d.s * wob, (d.s / wob) * 1.05, d.s * wob);
      tmp.m.compose(tmp.v, tmp.q, tmp.s);
      mesh.current?.setMatrixAt(i, tmp.m);
    });
    if (mesh.current) mesh.current.instanceMatrix.needsUpdate = true;
  });
  return <instancedMesh ref={mesh} args={[geo, mat, count]} frustumCulled={false} />;
}

function Sculpture({ quality, speed }: { quality: Quality; speed: number }) {
  const time = useRef(0);
  // on phones the stage is a short, wide strip between the text and the buttons: give the loop more room
  const narrow = useThree((st) => st.size.width < 640);
  const spin = useRef<THREE.Group>(null);
  useFrame((_, delta) => {
    const dt = Math.min(delta, 0.05) * speed;
    time.current += dt;
    // the loop slowly turns around its own axis, so the twist is always seen from a new angle
    if (spin.current) spin.current.rotation.z += dt * 0.09;
  });
  return (
    <group rotation={[-0.62, 0.32, 0.12]} scale={narrow ? 0.95 : 0.78}>
      <group ref={spin}>
        <MobiusBand quality={quality} time={time} />
        <Droplets count={quality === "high" ? 7 : 5} time={time} green={false} />
        <Droplets count={quality === "high" ? 5 : 3} time={time} green />
      </group>
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
    // gentle float + subtle rotation following the cursor
    g.rotation.y = THREE.MathUtils.damp(g.rotation.y, Math.sin(t * 0.18) * 0.18 + pointer.x * 0.35, 2.2, delta);
    g.rotation.x = THREE.MathUtils.damp(g.rotation.x, -pointer.y * 0.18, 2.2, delta);
    g.position.y = Math.sin(t * 0.5) * 0.05;
  });
  return <group ref={group}>{children}</group>;
}

function Studio({ accent }: { accent: string }) {
  return (
    <Environment resolution={512} frames={1}>
      <color attach="background" args={["#030604"]} />
      <Lightformer form="rect" intensity={2.8} position={[0, 5, 2]} rotation-x={Math.PI / 2} scale={[10, 2.4, 1]} />
      <Lightformer form="rect" intensity={2.4} position={[-3.6, 1.6, 4]} rotation-y={-0.65} scale={[1.2, 3.4, 1]} />
      <Lightformer form="rect" intensity={1.8} position={[3.8, 1.2, 3.5]} rotation-y={0.7} scale={[1, 3, 1]} />
      <Lightformer form="ring" intensity={2.2} position={[0, 0, 6]} scale={2.2} />
      <Lightformer form="rect" color="#f2ffe6" intensity={2} position={[-5, 0.3, 0]} rotation-y={Math.PI / 2} scale={[24, 0.16, 1]} />
      <Lightformer form="rect" color={LIME.getStyle()} intensity={0.35} position={[5, -0.4, 0]} rotation-y={-Math.PI / 2} scale={[24, 0.08, 1]} />
      <Lightformer form="rect" color={accent} intensity={0.3} position={[0, -5, 2]} rotation-x={-Math.PI / 2} scale={[10, 0.6, 1]} />
      <Lightformer form="rect" color={DEEP} intensity={0.5} position={[3, 3, -4]} scale={[6, 3, 1]} />
    </Environment>
  );
}

export default function MobiusScene({ accent = "#1c782b", reducedMotion = false, quality = "high" }: { accent?: string; reducedMotion?: boolean; quality?: Quality }) {
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
        camera={{ position: [0, 0.2, 6.4], fov: 32 }}
        gl={{ antialias: true, alpha: true, powerPreference: "high-performance", premultipliedAlpha: false }}
        onCreated={({ gl, camera }) => {
          gl.toneMapping = THREE.ACESFilmicToneMapping;
          gl.toneMappingExposure = 1.05;
          camera.lookAt(0, -0.05, 0);
          requestAnimationFrame(() => setReady(true));
        }}
      >
        <Studio accent={accent} />
        <Rig speed={speed}>
          <Sculpture quality={quality} speed={speed} />
        </Rig>
        <ContactShadows position={[0, FLOOR_Y, 0]} scale={7} blur={2.8} opacity={0.28} far={3.2} resolution={512} color="#0b120e" />
      </Canvas>
    </div>
  );
}
