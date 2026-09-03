import { useFrame } from "@react-three/fiber";
import { useEffect, useMemo, useRef } from "react";
import * as THREE from "three";
import { DURATION, VIS } from "./constants";
import { EPOCHS, epochProgress } from "./epochs";
import {
  diamondLattice,
  EDGES4,
  EDGES5,
  FCC_NEIGHBORS,
  galaxyDisk,
  glowTexture,
  pointsOnS3,
  project4to3,
  rotate4D,
  SIMPLEX3,
  simplex4Projected,
  vacuumHalo,
  type Vec3,
  type Vec4,
} from "./geometry";
import { useSim } from "./store";

const tmpColor = new THREE.Color();

function useGlow() {
  const tex = useMemo(() => glowTexture(), []);
  useEffect(() => () => tex.dispose(), [tex]);
  return tex;
}

function weight(time: number, start: number, end: number): number {
  if (time < start || time > end) return 0;
  const fade = 1.2;
  const a = Math.min(1, (time - start) / fade);
  const b = Math.min(1, (end - time) / fade);
  return Math.min(a, b);
}

export function SimClock() {
  useFrame((_, raw) => {
    const dt = Math.min(raw, 0.1);
    useSim.getState().advance(dt);
  });
  return null;
}

export function CameraRig() {
  const dummy = useMemo(() => new THREE.Vector3(), []);
  const look = useMemo(() => new THREE.Vector3(), []);
  useFrame(({ camera }, raw) => {
    const dt = Math.min(raw, 0.1);
    const { autoCamera, epochIndex, intro } = useSim.getState();
    if (!autoCamera && !intro) return;
    const e = EPOCHS[epochIndex] ?? EPOCHS[0];
    dummy.set(...e.camera.pos);
    look.set(...e.camera.target);
    const k = 1 - Math.exp(-1.35 * dt);
    camera.position.lerp(dummy, k);
    camera.lookAt(look);
  });
  return null;
}

export function VoidField() {
  const glow = useGlow();
  const count = 700;
  const pts = useMemo(() => pointsOnS3(count, 11), []);
  const geo = useMemo(() => {
    const g = new THREE.BufferGeometry();
    g.setAttribute("position", new THREE.BufferAttribute(new Float32Array(count * 3), 3));
    return g;
  }, [count]);
  const mat = useMemo(
    () =>
      new THREE.PointsMaterial({
        map: glow,
        size: 0.055,
        transparent: true,
        depthWrite: false,
        blending: THREE.AdditiveBlending,
        color: VIS.node,
        opacity: 0.55,
        sizeAttenuation: true,
      }),
    [glow],
  );
  useEffect(
    () => () => {
      geo.dispose();
      mat.dispose();
    },
    [geo, mat],
  );
  useFrame(({ clock }) => {
    const t = clock.elapsedTime;
    const { time } = useSim.getState();
    const pos = geo.attributes.position as THREE.BufferAttribute;
    const arr = pos.array as Float32Array;
    const radius = 6.4;
    for (let i = 0; i < count; i++) {
      const r = rotate4D(pts[i], t * 0.15);
      const p = project4to3(r, 2.6);
      arr[i * 3] = p[0] * radius;
      arr[i * 3 + 1] = p[1] * radius;
      arr[i * 3 + 2] = p[2] * radius;
    }
    pos.needsUpdate = true;
    const w = Math.max(0.12, weight(time, 0, 32) + 0.08);
    mat.opacity = w * 0.7;
    mat.size = 0.04 + w * 0.03;
  });
  return <points geometry={geo} material={mat} frustumCulled={false} />;
}

export function FiveCell() {
  const glow = useGlow();
  const group = useRef<THREE.Group>(null);
  const posAttr = useRef<THREE.BufferAttribute>(null);
  const facePos = useRef<THREE.BufferAttribute>(null);
  const nodePos = useRef<THREE.BufferAttribute>(null);
  const faceMat = useRef<THREE.MeshBasicMaterial>(null);
  const lineMat = useRef<THREE.LineBasicMaterial>(null);
  const pointMat = useRef<THREE.PointsMaterial>(null);

  const lineGeo = useMemo(() => {
    const g = new THREE.BufferGeometry();
    g.setAttribute("position", new THREE.BufferAttribute(new Float32Array(EDGES5.length * 2 * 3), 3));
    return g;
  }, []);
  const facesGeo = useMemo(() => {
    const g = new THREE.BufferGeometry();
    // 10 triangular faces of the 4-simplex skeleton (all triplets among 5 verts is C(5,3)=10)
    g.setAttribute("position", new THREE.BufferAttribute(new Float32Array(10 * 3 * 3), 3));
    return g;
  }, []);
  const nodeGeo = useMemo(() => {
    const g = new THREE.BufferGeometry();
    g.setAttribute("position", new THREE.BufferAttribute(new Float32Array(5 * 3), 3));
    g.setAttribute("color", new THREE.BufferAttribute(new Float32Array(5 * 3), 3));
    return g;
  }, []);

  useEffect(() => {
    posAttr.current = lineGeo.getAttribute("position") as THREE.BufferAttribute;
    facePos.current = facesGeo.getAttribute("position") as THREE.BufferAttribute;
    nodePos.current = nodeGeo.getAttribute("position") as THREE.BufferAttribute;
    return () => {
      lineGeo.dispose();
      facesGeo.dispose();
      nodeGeo.dispose();
    };
  }, [lineGeo, facesGeo, nodeGeo]);

  const triplets = useMemo(() => {
    const t: [number, number, number][] = [];
    for (let i = 0; i < 5; i++)
      for (let j = i + 1; j < 5; j++)
        for (let k = j + 1; k < 5; k++) t.push([i, j, k]);
    return t;
  }, []);

  useFrame(({ clock }) => {
    const { time, epochIndex } = useSim.getState();
    const vis = weight(time, 0, 42);
    if (vis <= 0.001) {
      if (group.current) group.current.visible = false;
      return;
    }
    if (group.current) group.current.visible = true;

    const rotT = clock.elapsedTime * 0.35;
    let verts = simplex4Projected(rotT, 1.75);

    const p1 = epochProgress(time, 1);
    if (epochIndex >= 1) {
      const rest = SIMPLEX3.map((v) => [v[0] * 1.55, v[1] * 1.55, v[2] * 1.55] as Vec3);
      const lostDir = verts[4];
      const far: Vec3 = [lostDir[0] * 3.4, lostDir[1] * 3.4, lostDir[2] * 3.4];
      const k = epochIndex === 1 ? p1 : 1;
      verts = verts.map((v, i) => {
        if (i < 4) {
          const t = rest[i];
          return [
            v[0] + (t[0] - v[0]) * k,
            v[1] + (t[1] - v[1]) * k,
            v[2] + (t[2] - v[2]) * k,
          ] as Vec3;
        }
        return [
          v[0] + (far[0] - v[0]) * k,
          v[1] + (far[1] - v[1]) * k,
          v[2] + (far[2] - v[2]) * k,
        ] as Vec3;
      });
    }

    const la = posAttr.current;
    if (la) {
      const arr = la.array as Float32Array;
      EDGES5.forEach(([a, b], i) => {
        const o = i * 6;
        arr[o] = verts[a][0];
        arr[o + 1] = verts[a][1];
        arr[o + 2] = verts[a][2];
        arr[o + 3] = verts[b][0];
        arr[o + 4] = verts[b][1];
        arr[o + 5] = verts[b][2];
      });
      la.needsUpdate = true;
    }

    const fa = facePos.current;
    if (fa) {
      const arr = fa.array as Float32Array;
      triplets.forEach((tri, i) => {
        const o = i * 9;
        for (let k = 0; k < 3; k++) {
          arr[o + k * 3] = verts[tri[k]][0];
          arr[o + k * 3 + 1] = verts[tri[k]][1];
          arr[o + k * 3 + 2] = verts[tri[k]][2];
        }
      });
      fa.needsUpdate = true;
    }

    const na = nodePos.current;
    const ca = nodeGeo.getAttribute("color") as THREE.BufferAttribute;
    if (na && ca) {
      const arr = na.array as Float32Array;
      const col = ca.array as Float32Array;
      const lostFade = epochIndex <= 1 ? 1 - (epochIndex === 1 ? p1 : 0) * 0.85 : 0.08;
      for (let i = 0; i < 5; i++) {
        arr[i * 3] = verts[i][0];
        arr[i * 3 + 1] = verts[i][1];
        arr[i * 3 + 2] = verts[i][2];
        const c = i === 4 ? tmpColor.setHex(VIS.lost) : tmpColor.setHex(VIS.node);
        col[i * 3] = c.r;
        col[i * 3 + 1] = c.g;
        col[i * 3 + 2] = c.b;
      }
      na.needsUpdate = true;
      ca.needsUpdate = true;
      if (pointMat.current) {
        pointMat.current.opacity = vis * (0.55 + lostFade * 0.35);
      }
    }

    if (lineMat.current) lineMat.current.opacity = vis * 0.82;
    if (faceMat.current) faceMat.current.opacity = vis * 0.07;
  });

  return (
    <group ref={group}>
      <lineSegments geometry={lineGeo} frustumCulled={false}>
        <lineBasicMaterial
          ref={lineMat}
          color={VIS.edge}
          transparent
          opacity={0.8}
          blending={THREE.AdditiveBlending}
          depthWrite={false}
        />
      </lineSegments>
      <mesh geometry={facesGeo} frustumCulled={false}>
        <meshBasicMaterial
          ref={faceMat}
          color={VIS.face}
          transparent
          opacity={0.07}
          side={THREE.DoubleSide}
          depthWrite={false}
        />
      </mesh>
      <points geometry={nodeGeo} frustumCulled={false}>
        <pointsMaterial
          ref={pointMat}
          map={glow}
          size={0.18}
          transparent
          depthWrite={false}
          vertexColors
          blending={THREE.AdditiveBlending}
          sizeAttenuation
        />
      </points>
    </group>
  );
}

export function PrimeTetra() {
  const glow = useGlow();
  const group = useRef<THREE.Group>(null);
  const verts = useMemo(
    () => SIMPLEX3.map((v) => new THREE.Vector3(v[0] * 1.55, v[1] * 1.55, v[2] * 1.55)),
    [],
  );
  const lineGeo = useMemo(() => {
    const g = new THREE.BufferGeometry();
    const arr = new Float32Array(EDGES4.length * 6);
    EDGES4.forEach(([a, b], i) => {
      const o = i * 6;
      arr[o] = verts[a].x;
      arr[o + 1] = verts[a].y;
      arr[o + 2] = verts[a].z;
      arr[o + 3] = verts[b].x;
      arr[o + 4] = verts[b].y;
      arr[o + 5] = verts[b].z;
    });
    g.setAttribute("position", new THREE.BufferAttribute(arr, 3));
    return g;
  }, [verts]);
  const faceGeo = useMemo(() => {
    const g = new THREE.BufferGeometry();
    const faces: [number, number, number][] = [
      [0, 1, 2],
      [0, 1, 3],
      [0, 2, 3],
      [1, 2, 3],
    ];
    const arr = new Float32Array(faces.length * 9);
    faces.forEach((f, i) => {
      const o = i * 9;
      for (let k = 0; k < 3; k++) {
        arr[o + k * 3] = verts[f[k]].x;
        arr[o + k * 3 + 1] = verts[f[k]].y;
        arr[o + k * 3 + 2] = verts[f[k]].z;
      }
    });
    g.setAttribute("position", new THREE.BufferAttribute(arr, 3));
    g.computeVertexNormals();
    return g;
  }, [verts]);
  const nodeGeo = useMemo(() => {
    const g = new THREE.BufferGeometry();
    const arr = new Float32Array(12);
    verts.forEach((v, i) => {
      arr[i * 3] = v.x;
      arr[i * 3 + 1] = v.y;
      arr[i * 3 + 2] = v.z;
    });
    g.setAttribute("position", new THREE.BufferAttribute(arr, 3));
    return g;
  }, [verts]);

  const lineMat = useRef<THREE.LineBasicMaterial>(null);
  const faceMat = useRef<THREE.MeshBasicMaterial>(null);
  const pointMat = useRef<THREE.PointsMaterial>(null);

  useEffect(
    () => () => {
      lineGeo.dispose();
      faceGeo.dispose();
      nodeGeo.dispose();
    },
    [lineGeo, faceGeo, nodeGeo],
  );

  useFrame(({ clock }) => {
    const { time } = useSim.getState();
    const vis = weight(time, 22, 58);
    if (group.current) {
      group.current.visible = vis > 0.02;
      group.current.rotation.y = clock.elapsedTime * 0.12;
    }
    if (lineMat.current) lineMat.current.opacity = vis * 0.95;
    if (faceMat.current) faceMat.current.opacity = vis * 0.11;
    if (pointMat.current) pointMat.current.opacity = vis;
  });

  return (
    <group ref={group}>
      <lineSegments geometry={lineGeo}>
        <lineBasicMaterial ref={lineMat} color={VIS.edge} transparent depthWrite={false} />
      </lineSegments>
      <mesh geometry={faceGeo}>
        <meshBasicMaterial
          ref={faceMat}
          color={VIS.face}
          transparent
          opacity={0.1}
          side={THREE.DoubleSide}
          depthWrite={false}
        />
      </mesh>
      <points geometry={nodeGeo}>
        <pointsMaterial
          ref={pointMat}
          map={glow}
          size={0.16}
          transparent
          depthWrite={false}
          color={VIS.node}
          blending={THREE.AdditiveBlending}
          sizeAttenuation
        />
      </points>
    </group>
  );
}

const LATTICE = diamondLattice(3, 1.35);

export function VacuumNetwork() {
  const group = useRef<THREE.Group>(null);
  const { nodes, edges } = LATTICE;
  const order = useMemo(() => {
    const d = nodes.map((p, i) => ({ i, d: Math.hypot(p[0], p[1], p[2]) }));
    d.sort((a, b) => a.d - b.d);
    return d.map((x) => x.i);
  }, [nodes]);
  const rank = useMemo(() => {
    const r = new Array(nodes.length).fill(0);
    order.forEach((idx, k) => {
      r[idx] = k;
    });
    return r;
  }, [order, nodes.length]);

  const mesh = useRef<THREE.InstancedMesh>(null);
  const dummy = useMemo(() => new THREE.Object3D(), []);
  const lineGeo = useMemo(() => {
    const g = new THREE.BufferGeometry();
    const arr = new Float32Array(edges.length * 6);
    edges.forEach(([a, b], i) => {
      const o = i * 6;
      arr[o] = nodes[a][0];
      arr[o + 1] = nodes[a][1];
      arr[o + 2] = nodes[a][2];
      arr[o + 3] = nodes[b][0];
      arr[o + 4] = nodes[b][1];
      arr[o + 5] = nodes[b][2];
    });
    g.setAttribute("position", new THREE.BufferAttribute(arr, 3));
    return g;
  }, [nodes, edges]);
  const lineMat = useRef<THREE.LineBasicMaterial>(null);
  const nodeMat = useRef<THREE.MeshBasicMaterial>(null);

  useEffect(
    () => () => {
      lineGeo.dispose();
    },
    [lineGeo],
  );

  useFrame(({ clock }) => {
    const { time, epochIndex } = useSim.getState();
    const vis = weight(time, 38, DURATION);
    if (group.current) group.current.visible = vis > 0.02;
    if (vis <= 0.02) return;

    const growth =
      epochIndex <= 3 ? epochProgress(time, 3) : epochIndex >= 3 ? 1 : 0;
    const shown = Math.max(4, Math.floor(growth * nodes.length));
    const warp = epochIndex >= 6 ? epochProgress(time, 6) : 0;

    if (mesh.current) {
      for (let i = 0; i < nodes.length; i++) {
        const p = nodes[i];
        const r = Math.hypot(p[0], p[1], p[2]) || 1;
        const pull = warp * 0.28 * Math.exp(-r * 0.22);
        dummy.position.set(p[0] * (1 - pull), p[1] * (1 - pull), p[2] * (1 - pull));
        const live = rank[i] < shown;
        dummy.scale.setScalar(live ? 1 : 0.0001);
        dummy.updateMatrix();
        mesh.current.setMatrixAt(i, dummy.matrix);
      }
      mesh.current.instanceMatrix.needsUpdate = true;
      mesh.current.count = nodes.length;
    }
    if (lineMat.current) lineMat.current.opacity = vis * 0.28 * (0.35 + growth);
    if (nodeMat.current) nodeMat.current.opacity = vis * 0.85;
    if (group.current) group.current.rotation.y = clock.elapsedTime * 0.04;
  });

  return (
    <group ref={group}>
      <lineSegments geometry={lineGeo} frustumCulled={false}>
        <lineBasicMaterial
          ref={lineMat}
          color={VIS.edge}
          transparent
          opacity={0.25}
          depthWrite={false}
        />
      </lineSegments>
      <instancedMesh ref={mesh} args={[undefined, undefined, nodes.length]} frustumCulled={false}>
        <sphereGeometry args={[0.045, 8, 8]} />
        <meshBasicMaterial ref={nodeMat} color={VIS.node} transparent opacity={0.85} />
      </instancedMesh>
    </group>
  );
}

export function FrustrationGhosts() {
  const geo = useMemo(() => {
    const g = new THREE.BufferGeometry();
    const seed = LATTICE.nodes.slice(0, 18);
    const pairs: number[] = [];
    for (const n of seed) {
      for (const d of FCC_NEIGHBORS) {
        pairs.push(n[0], n[1], n[2], n[0] + d[0] * 1.35, n[1] + d[1] * 1.35, n[2] + d[2] * 1.35);
      }
    }
    g.setAttribute("position", new THREE.BufferAttribute(new Float32Array(pairs), 3));
    return g;
  }, []);
  const mat = useRef<THREE.LineDashedMaterial>(null);
  const lines = useRef<THREE.LineSegments>(null);
  useEffect(() => {
    geo.computeBoundingSphere();
    return () => geo.dispose();
  }, [geo]);
  useFrame(() => {
    const { time } = useSim.getState();
    const vis = weight(time, 56, 74);
    if (lines.current) lines.current.visible = vis > 0.04;
    if (mat.current) mat.current.opacity = vis * 0.22;
  });
  return (
    <lineSegments
      ref={lines}
      geometry={geo}
      frustumCulled={false}
      onUpdate={(self) => self.computeLineDistances()}
    >
      <lineDashedMaterial
        ref={mat}
        color={VIS.ghost}
        dashSize={0.08}
        gapSize={0.07}
        transparent
        opacity={0.2}
        depthWrite={false}
      />
    </lineSegments>
  );
}

export function HolographicShells() {
  const group = useRef<THREE.Group>(null);
  useFrame(({ clock }) => {
    const { time } = useSim.getState();
    const vis = weight(time, 68, 90);
    if (group.current) {
      group.current.visible = vis > 0.03;
      group.current.rotation.y = clock.elapsedTime * 0.08;
      group.current.rotation.x = Math.sin(clock.elapsedTime * 0.12) * 0.12;
    }
    group.current?.children.forEach((ch, i) => {
      const m = (ch as THREE.Mesh).material as THREE.MeshBasicMaterial;
      if (m) m.opacity = vis * (i === 0 ? 0.22 : i === 1 ? 0.12 : 0.06);
    });
  });
  const radii = [1.7, 2.55, 3.5];
  return (
    <group ref={group}>
      {radii.map((r) => (
        <mesh key={r}>
          <icosahedronGeometry args={[r, 1]} />
          <meshBasicMaterial
            color={VIS.halo}
            wireframe
            transparent
            opacity={0.12}
            depthWrite={false}
          />
        </mesh>
      ))}
    </group>
  );
}

export function EmergentGalaxy() {
  const glow = useGlow();
  const diskGeo = useMemo(() => {
    const g = new THREE.BufferGeometry();
    g.setAttribute("position", new THREE.BufferAttribute(galaxyDisk(1600), 3));
    return g;
  }, []);
  const haloGeo = useMemo(() => {
    const g = new THREE.BufferGeometry();
    g.setAttribute("position", new THREE.BufferAttribute(vacuumHalo(900), 3));
    return g;
  }, []);
  const diskMat = useRef<THREE.PointsMaterial>(null);
  const haloMat = useRef<THREE.PointsMaterial>(null);
  const group = useRef<THREE.Group>(null);

  useEffect(
    () => () => {
      diskGeo.dispose();
      haloGeo.dispose();
    },
    [diskGeo, haloGeo],
  );

  useFrame(({ clock }) => {
    const { time } = useSim.getState();
    const vis = weight(time, 84, DURATION + 4);
    if (group.current) {
      group.current.visible = vis > 0.03;
      group.current.rotation.y = clock.elapsedTime * 0.05;
    }
    if (diskMat.current) diskMat.current.opacity = vis * 0.9;
    if (haloMat.current) haloMat.current.opacity = vis * 0.38;
  });

  return (
    <group ref={group}>
      <points geometry={diskGeo} frustumCulled={false}>
        <pointsMaterial
          ref={diskMat}
          map={glow}
          size={0.06}
          transparent
          depthWrite={false}
          color={VIS.disk}
          blending={THREE.AdditiveBlending}
          sizeAttenuation
        />
      </points>
      <points geometry={haloGeo} frustumCulled={false}>
        <pointsMaterial
          ref={haloMat}
          map={glow}
          size={0.09}
          transparent
          depthWrite={false}
          color={VIS.halo}
          blending={THREE.AdditiveBlending}
          sizeAttenuation
        />
      </points>
    </group>
  );
}
