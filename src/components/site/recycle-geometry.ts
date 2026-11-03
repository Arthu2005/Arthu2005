import * as THREE from "three";
import { RECYCLE_SUBPATHS } from "./recycle-symbol";

/** Pure geometry helpers (no DOM): used by the hero scene and by scripts/export-recycle-glb.ts. */

export const SYMBOL_DEPTH = 0.26;
const BEVEL = { thickness: 0.05, size: 0.035 };

export function recycleShapes(): THREE.Shape[] {
  return RECYCLE_SUBPATHS.map((p) => {
    const s = new THREE.Shape();
    s.moveTo(p[0]!, p[1]!);
    for (let i = 2; i + 5 < p.length; i += 6) s.bezierCurveTo(p[i]!, p[i + 1]!, p[i + 2]!, p[i + 3]!, p[i + 4]!, p[i + 5]!);
    s.closePath();
    return s;
  });
}

/** Extruded, bevelled symbol centred on z = 0 (front face at +z). */
export function recycleGeometry(quality: "high" | "medium" | "export" = "high") {
  const geo = new THREE.ExtrudeGeometry(recycleShapes(), {
    depth: SYMBOL_DEPTH,
    curveSegments: quality === "high" ? 8 : quality === "export" ? 5 : 5,
    bevelEnabled: true,
    bevelThickness: BEVEL.thickness,
    bevelSize: BEVEL.size,
    bevelSegments: quality === "high" ? 7 : quality === "export" ? 5 : 4,
  });
  geo.translate(0, 0, -SYMBOL_DEPTH / 2);
  geo.computeVertexNormals();
  return geo;
}

export const SYMBOL_FRONT_Z = SYMBOL_DEPTH / 2 + BEVEL.thickness;

/** Lowest points of the lower pieces: where oil drips hang from (symbol space). */
export function dripOrigins(count = 3) {
  const lows = RECYCLE_SUBPATHS.map((p) => {
    let best = { x: 0, y: Infinity };
    for (let i = 0; i < p.length; i += 2) if (p[i + 1]! < best.y) best = { x: p[i]!, y: p[i + 1]! };
    return best;
  }).sort((a, b) => a.y - b.y);
  return lows.slice(0, count).map((l) => new THREE.Vector3(l.x, l.y - BEVEL.size * 0.5, 0));
}

/** Vertical bounds of the symbol (symbol space, before scaling). */
export function symbolBounds() {
  let minY = Infinity;
  let maxY = -Infinity;
  for (const p of RECYCLE_SUBPATHS) for (let i = 1; i < p.length; i += 2) {
    minY = Math.min(minY, p[i]!);
    maxY = Math.max(maxY, p[i]!);
  }
  return { minY: minY - BEVEL.size, maxY: maxY + BEVEL.size };
}
