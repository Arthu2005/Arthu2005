/**
 * Exports the hero sculpture as a GLB (public/models/petrolub-reciclagem-petroleo.glb):
 *  - "Simbolo_Reciclagem": the client's symbol (Potrace vector), extruded + bevelled, material PETROLUB_Verde
 *  - "Petroleo_Anel", "Petroleo_Poca", "Petroleo_Filete_*", "Petroleo_Gota_*": a still pose of the oil, material Petroleo
 * Materials are PBR (metallic-roughness + KHR_materials_clearcoat). This was the previous hero concept;
 * the site now uses the procedural Möbius loop in src/components/site/MobiusScene.tsx.
 *
 * Usage: npm run model:export
 */
import { mkdirSync } from "node:fs";
import * as THREE from "three";
import { SimplexNoise } from "three/examples/jsm/math/SimplexNoise.js";
import { Document, NodeIO } from "@gltf-transform/core";
import { KHRMaterialsClearcoat, KHRMeshQuantization } from "@gltf-transform/extensions";
import { dedup, prune, quantize, weld } from "@gltf-transform/functions";
import { dripOrigins, recycleGeometry, symbolBounds } from "../src/components/site/recycle-geometry";

const SCALE = 0.92;
const T = 2.4; // animation time captured in the still pose
const noise = new SimplexNoise({ random: mulberry32(7) });
const sn = (x: number, y: number, z: number) => noise.noise3d(x, y, z);

function mulberry32(a: number) {
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/* ---- oil ring (CPU port of the RING shader) ---- */
const TX = 0.42;
const TZ = -0.22;
const tilt = (p: THREE.Vector3) => {
  const y = p.y * Math.cos(TX) - p.z * Math.sin(TX);
  const z = p.y * Math.sin(TX) + p.z * Math.cos(TX);
  return new THREE.Vector3(p.x * Math.cos(TZ) - y * Math.sin(TZ), p.x * Math.sin(TZ) + y * Math.cos(TZ), z);
};
const curve = (u: number) => {
  const a = -0.6 + u * 4.7 + T * 0.11;
  const R = 1.36 + 0.07 * Math.sin(a * 2 + T * 0.5);
  return tilt(new THREE.Vector3(Math.cos(a) * R, Math.sin(a * 3 + T * 0.6) * 0.05, Math.sin(a) * R * 0.78));
};
const smooth = (e0: number, e1: number, x: number) => {
  const t = Math.min(1, Math.max(0, (x - e0) / (e1 - e0)));
  return t * t * (3 - 2 * t);
};
function ringPos(u: number, v: number) {
  const th = v * Math.PI * 2;
  const c = curve(u);
  const Tg = curve(u + 0.003).sub(c).normalize();
  const up = tilt(new THREE.Vector3(0, 1, 0));
  const N = new THREE.Vector3().crossVectors(Tg, up).normalize();
  const Bn = new THREE.Vector3().crossVectors(N, Tg).normalize();
  let w = (0.015 + 0.15 * smooth(0, 0.45, u)) * (1 - smooth(0.9, 1, u));
  w *= 1 + 0.18 * Math.sin(u * 14 - T * 1.8);
  const side = Math.cos(th);
  const edge = smooth(0.6, 1, Math.abs(side));
  w *= 1 + edge * 0.18 * sn(u * 26 - T * 1.2, side * 2, T * 0.3);
  const thick = 0.025 + w * 0.32;
  const p = c.clone().addScaledVector(N, side * w).addScaledVector(Bn, Math.sin(th) * thick - side * side * w * 0.18);
  const nrm = N.clone().multiplyScalar(side).addScaledVector(Bn, Math.sin(th)).normalize();
  return p.addScaledVector(nrm, sn(u * 9 - T, th * 0.6, T * 0.2) * 0.012);
}

/* ---- pool (CPU port of the POOL shader, no ripples) ---- */
const POOL_Y = symbolBounds().minY * SCALE - 0.24;
function poolPos(rhoIn: number, v: number) {
  const a = v * Math.PI * 2;
  const rho = Math.min(1, Math.max(0, rhoIn));
  const r = rho * (1 + 0.09 * sn(Math.cos(a) * 1.4, Math.sin(a) * 1.4, T * 0.04) + 0.035 * Math.sin(a * 5 + T * 0.15));
  const qx = Math.cos(a) * r;
  const qy = Math.sin(a) * r;
  const h = 0.045 * Math.max(1 - rho * rho, 0) ** 0.35 * smooth(1, 0.94, rho);
  // plane rotated -90° on X and scaled 1.22 × 0.62 (as in the scene)
  return new THREE.Vector3(qx * 1.22, POOL_Y + h, -qy * 0.62 + 0.05);
}

function parametric(fn: (u: number, v: number) => THREE.Vector3, nu: number, nv: number) {
  const pos: number[] = [];
  const idx: number[] = [];
  for (let j = 0; j <= nv; j++) for (let i = 0; i <= nu; i++) pos.push(...fn(i / nu, j / nv).toArray());
  for (let j = 0; j < nv; j++)
    for (let i = 0; i < nu; i++) {
      const a = j * (nu + 1) + i;
      const b = a + 1;
      const c = a + nu + 1;
      const d = c + 1;
      idx.push(a, c, b, b, c, d);
    }
  const g = new THREE.BufferGeometry();
  g.setAttribute("position", new THREE.Float32BufferAttribute(pos, 3));
  g.setIndex(idx);
  g.computeVertexNormals();
  return g;
}

function dripGeometry(L: number, bulb: number, film: number) {
  const pts: THREE.Vector2[] = [];
  const neck = 18;
  for (let i = 0; i < neck; i++) {
    const s = i / (neck - 1);
    pts.push(new THREE.Vector2(film * (1 - s) ** 0.6 + bulb * 0.55 * smooth(0.55, 1, s) + 0.004, -s * L));
  }
  for (let i = 1; i <= 10; i++) {
    const a = (i / 10) * (Math.PI / 2);
    pts.push(new THREE.Vector2(Math.max(Math.cos(a) * bulb, 0.0005), -L - Math.sin(a) * bulb * 1.15));
  }
  return new THREE.LatheGeometry(pts, 24);
}

/* ---- glTF document ---- */
const doc = new Document();
const buffer = doc.createBuffer();
const scene = doc.createScene("PETROLUB_Reciclagem_Petroleo");
const clearcoat = doc.createExtension(KHRMaterialsClearcoat);

const srgbToLinear = (hex: string) => new THREE.Color(hex).toArray() as [number, number, number]; // THREE.Color stores linear
const green = doc
  .createMaterial("PETROLUB_Verde")
  .setBaseColorFactor([...srgbToLinear("#156900"), 1])
  .setRoughnessFactor(0.16)
  .setMetallicFactor(0.05)
  .setExtension("KHR_materials_clearcoat", clearcoat.createClearcoat().setClearcoatFactor(1).setClearcoatRoughnessFactor(0.06));
const oil = doc
  .createMaterial("Petroleo")
  .setBaseColorFactor([...srgbToLinear("#010101"), 1])
  .setRoughnessFactor(0.035)
  .setMetallicFactor(0.15)
  .setDoubleSided(true)
  .setExtension("KHR_materials_clearcoat", clearcoat.createClearcoat().setClearcoatFactor(1).setClearcoatRoughnessFactor(0.02));

function addMesh(name: string, geo: THREE.BufferGeometry, material: typeof green, matrix?: THREE.Matrix4) {
  const g = geo.index ? geo : geo;
  if (matrix) g.applyMatrix4(matrix);
  const prim = doc
    .createPrimitive()
    .setMaterial(material)
    .setAttribute("POSITION", doc.createAccessor().setType("VEC3").setArray(new Float32Array(g.attributes.position!.array)).setBuffer(buffer))
    .setAttribute("NORMAL", doc.createAccessor().setType("VEC3").setArray(new Float32Array(g.attributes.normal!.array)).setBuffer(buffer));
  if (g.index) prim.setIndices(doc.createAccessor().setType("SCALAR").setArray(new Uint32Array(g.index.array)).setBuffer(buffer));
  scene.addChild(doc.createNode(name).setMesh(doc.createMesh(name).addPrimitive(prim)));
}

addMesh("Simbolo_Reciclagem", recycleGeometry("export"), green, new THREE.Matrix4().makeScale(SCALE, SCALE, SCALE));
addMesh("Petroleo_Anel", parametric(ringPos, 260, 28), oil);
addMesh("Petroleo_Poca", parametric(poolPos, 40, 160), oil);
dripOrigins(3).forEach((o, i) => {
  const p = o.multiplyScalar(SCALE);
  addMesh(`Petroleo_Filete_${i + 1}`, dripGeometry(0.16 + i * 0.05, 0.045, 0.032), oil, new THREE.Matrix4().makeTranslation(p.x, p.y + 0.015, p.z));
});
const drops: [number, number, number, number][] = [
  [1.55, 0.6, -0.3, 0.05],
  [-1.7, 0.2, 0.2, 0.035],
  [1.2, -0.55, 0.6, 0.028],
  [-1.25, 0.95, -0.4, 0.04],
  [0.4, 1.35, -0.5, 0.022],
];
drops.forEach(([x, y, z, r], i) => {
  addMesh(`Petroleo_Gota_${i + 1}`, new THREE.IcosahedronGeometry(1, 3), oil, new THREE.Matrix4().compose(new THREE.Vector3(x, y, z), new THREE.Quaternion(), new THREE.Vector3(r, r * 1.04, r)));
});

mkdirSync("public/models", { recursive: true });
await doc.transform(dedup(), weld(), quantize({ quantizeNormal: 10, quantizePosition: 14 }), prune());
const io = new NodeIO().registerExtensions([KHRMaterialsClearcoat, KHRMeshQuantization]);
await io.write("public/models/petrolub-reciclagem-petroleo.glb", doc);
console.log("✓ public/models/petrolub-reciclagem-petroleo.glb");
