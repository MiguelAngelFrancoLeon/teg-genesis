import * as THREE from "three";

/** Regular n-simplex: n+1 vertices in R^n, circumradius 1. */
export function regularSimplex(dimension: number): number[][] {
  const n = dimension + 1;
  const raw: number[][] = [];
  for (let i = 0; i < n; i++) {
    const v = new Array(n).fill(0);
    v[i] = 1;
    raw.push(v);
  }
  const c = 1 / n;
  const centered = raw.map((v) => v.map((x) => x - c));
  const basis: number[][] = [];
  for (let i = 0; i < dimension; i++) {
    const b = new Array(n).fill(0);
    b[i] = 1;
    b[n - 1] = -1;
    for (const prev of basis) {
      const dot = b.reduce((s, x, k) => s + x * prev[k], 0);
      for (let k = 0; k < n; k++) b[k] -= dot * prev[k];
    }
    const norm = Math.sqrt(b.reduce((s, x) => s + x * x, 0)) || 1;
    basis.push(b.map((x) => x / norm));
  }
  const verts = centered.map((v) =>
    basis.map((b) => v.reduce((s, x, k) => s + x * b[k], 0)),
  );
  const r =
    Math.sqrt(verts[0].reduce((s, x) => s + x * x, 0)) || 1;
  return verts.map((v) => v.map((x) => x / r));
}

export const SIMPLEX4 = regularSimplex(4);
export const SIMPLEX3 = regularSimplex(3);

export type Vec4 = [number, number, number, number];
export type Vec3 = [number, number, number];

export function rotate4D(p: Vec4, t: number): Vec4 {
  const c1 = Math.cos(t * 0.37);
  const s1 = Math.sin(t * 0.37);
  const c2 = Math.cos(t * 0.23);
  const s2 = Math.sin(t * 0.23);
  let [x, y, z, w] = p;
  const x1 = x * c1 - w * s1;
  const w1 = x * s1 + w * c1;
  const z1 = z * c2 - w1 * s2;
  const w2 = z * s2 + w1 * c2;
  const c3 = Math.cos(t * 0.17);
  const s3 = Math.sin(t * 0.17);
  const y1 = y * c3 - w2 * s3;
  const w3 = y * s3 + w2 * c3;
  return [x1, y1, z1, w3];
}

export function project4to3(p: Vec4, dist = 2.4): Vec3 {
  const f = dist / (dist - p[3] * 0.55);
  return [p[0] * f, p[1] * f, p[2] * f];
}

export function simplex4Projected(t: number, radius = 1.6): Vec3[] {
  return SIMPLEX4.map((v) => {
    const r = rotate4D(v as Vec4, t);
    const p = project4to3(r);
    return [p[0] * radius, p[1] * radius, p[2] * radius] as Vec3;
  });
}

/** Combinations C(n,2) edge list. */
export function completeEdges(count: number): [number, number][] {
  const e: [number, number][] = [];
  for (let i = 0; i < count; i++) {
    for (let j = i + 1; j < count; j++) e.push([i, j]);
  }
  return e;
}

export const EDGES5 = completeEdges(5);
export const EDGES4 = completeEdges(4);

/** Diamond cubic (tetrahedral coordination z = 4). */
export function diamondLattice(
  cells: number,
  scale: number,
): { nodes: Vec3[]; edges: [number, number][] } {
  const basis: Vec3[] = [
    [0, 0, 0],
    [0.5, 0.5, 0],
    [0.5, 0, 0.5],
    [0, 0.5, 0.5],
    [0.25, 0.25, 0.25],
    [0.75, 0.75, 0.25],
    [0.75, 0.25, 0.75],
    [0.25, 0.75, 0.75],
  ];
  const nodes: Vec3[] = [];
  const key = new Map<string, number>();
  const round = (x: number) => Math.round(x * 1000) / 1000;
  for (let i = 0; i < cells; i++) {
    for (let j = 0; j < cells; j++) {
      for (let k = 0; k < cells; k++) {
        for (const b of basis) {
          const p: Vec3 = [
            (i + b[0] - cells / 2) * scale,
            (j + b[1] - cells / 2) * scale,
            (k + b[2] - cells / 2) * scale,
          ];
          const id = `${round(p[0])}|${round(p[1])}|${round(p[2])}`;
          if (!key.has(id)) {
            key.set(id, nodes.length);
            nodes.push(p);
          }
        }
      }
    }
  }
  const nn = (Math.sqrt(3) / 4) * scale;
  const lo = nn * 0.92;
  const hi = nn * 1.08;
  const edges: [number, number][] = [];
  const buckets = new Map<string, number[]>();
  const cellSize = nn * 1.2;
  const bkey = (p: Vec3) =>
    `${Math.floor(p[0] / cellSize)}|${Math.floor(p[1] / cellSize)}|${Math.floor(p[2] / cellSize)}`;
  nodes.forEach((p, idx) => {
    const k = bkey(p);
    const arr = buckets.get(k);
    if (arr) arr.push(idx);
    else buckets.set(k, [idx]);
  });
  const seen = new Set<string>();
  for (let a = 0; a < nodes.length; a++) {
    const pa = nodes[a];
    const bx = Math.floor(pa[0] / cellSize);
    const by = Math.floor(pa[1] / cellSize);
    const bz = Math.floor(pa[2] / cellSize);
    for (let dx = -1; dx <= 1; dx++) {
      for (let dy = -1; dy <= 1; dy++) {
        for (let dz = -1; dz <= 1; dz++) {
          const neigh = buckets.get(`${bx + dx}|${by + dy}|${bz + dz}`);
          if (!neigh) continue;
          for (const b of neigh) {
            if (b <= a) continue;
            const pb = nodes[b];
            const d = Math.hypot(pa[0] - pb[0], pa[1] - pb[1], pa[2] - pb[2]);
            if (d >= lo && d <= hi) {
              const id = `${a}-${b}`;
              if (!seen.has(id)) {
                seen.add(id);
                edges.push([a, b]);
              }
            }
          }
        }
      }
    }
  }
  return { nodes, edges };
}

/** FCC 12-neighbors offsets (z_pack), in diamond conventional units. */
export const FCC_NEIGHBORS: Vec3[] = [
  [0.5, 0.5, 0],
  [0.5, -0.5, 0],
  [-0.5, 0.5, 0],
  [-0.5, -0.5, 0],
  [0.5, 0, 0.5],
  [0.5, 0, -0.5],
  [-0.5, 0, 0.5],
  [-0.5, 0, -0.5],
  [0, 0.5, 0.5],
  [0, 0.5, -0.5],
  [0, -0.5, 0.5],
  [0, -0.5, -0.5],
];

export function pointsOnS3(count: number, seed = 1): Vec4[] {
  const pts: Vec4[] = [];
  let s = seed;
  const rnd = () => {
    s = (s * 16807) % 2147483647;
    return (s - 1) / 2147483646;
  };
  for (let i = 0; i < count; i++) {
    // Gaussian via Box-Muller in 4D, then normalize → uniform on S³
    const g: number[] = [];
    for (let k = 0; k < 4; k++) {
      const u = Math.max(1e-9, rnd());
      const v = rnd();
      g.push(Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v));
    }
    const n = Math.hypot(g[0], g[1], g[2], g[3]) || 1;
    pts.push([g[0] / n, g[1] / n, g[2] / n, g[3] / n]);
  }
  return pts;
}

export function glowTexture(): THREE.CanvasTexture {
  const c = document.createElement("canvas");
  c.width = 64;
  c.height = 64;
  const g = c.getContext("2d");
  if (!g) return new THREE.CanvasTexture(c);
  const grd = g.createRadialGradient(32, 32, 0, 32, 32, 32);
  grd.addColorStop(0, "rgba(255,255,255,1)");
  grd.addColorStop(0.22, "rgba(220,228,235,0.55)");
  grd.addColorStop(0.55, "rgba(140,155,168,0.12)");
  grd.addColorStop(1, "rgba(0,0,0,0)");
  g.fillStyle = grd;
  g.fillRect(0, 0, 64, 64);
  const tex = new THREE.CanvasTexture(c);
  tex.needsUpdate = true;
  return tex;
}

export function galaxyDisk(count: number, seed = 3): Float32Array {
  let s = seed;
  const rnd = () => {
    s = (s * 48271) % 2147483647;
    return (s - 1) / 2147483646;
  };
  const arr = new Float32Array(count * 3);
  for (let i = 0; i < count; i++) {
    const u = rnd();
    const r = 0.4 + 7.2 * Math.pow(u, 0.65);
    const arm = i % 2;
    const theta = r * 0.62 + arm * Math.PI + (rnd() - 0.5) * 0.38;
    const y = (rnd() - 0.5) * 0.28 * Math.exp(-r / 4.5);
    arr[i * 3] = Math.cos(theta) * r;
    arr[i * 3 + 1] = y;
    arr[i * 3 + 2] = Math.sin(theta) * r;
  }
  return arr;
}

export function vacuumHalo(count: number, seed = 9): Float32Array {
  let s = seed;
  const rnd = () => {
    s = (s * 69621) % 2147483647;
    return (s - 1) / 2147483646;
  };
  const arr = new Float32Array(count * 3);
  for (let i = 0; i < count; i++) {
    const u = rnd();
    const r = 8.5 * Math.cbrt(u);
    const z = rnd() * 2 - 1;
    const phi = rnd() * Math.PI * 2;
    const rho = Math.sqrt(Math.max(0, 1 - z * z));
    arr[i * 3] = r * rho * Math.cos(phi);
    arr[i * 3 + 1] = r * z * 0.72;
    arr[i * 3 + 2] = r * rho * Math.sin(phi);
  }
  return arr;
}
