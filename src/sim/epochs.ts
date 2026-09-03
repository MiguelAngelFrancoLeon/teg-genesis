export type Epoch = {
  id: string;
  t0: number;
  t1: number;
  index: number;
  kicker: string;
  title: string;
  formula: string;
  body: string;
  camera: { pos: [number, number, number]; target: [number, number, number] };
};

export const EPOCHS: Epoch[] = [
  {
    id: "h",
    t0: 0,
    t1: 14,
    index: 0,
    kicker: "Campo cuaterniónico",
    title: "El 5-celda en ℍ",
    formula: "ℋ ≅ S³  ·  {3,3,3}",
    body: "El vacío fundamental es un campo cuaterniónico sobre ℍ, topológicamente S³. Aún no hay ℝ³: hay un 4-símplice — el 5-celda — esperando proyectarse. Toda la física observada emerge de π: ℍ → ℝ³.",
    camera: { pos: [0.4, 1.4, 7.2], target: [0, 0, 0] },
  },
  {
    id: "pi",
    t0: 14,
    t1: 28,
    index: 1,
    kicker: "Proyección",
    title: "π: ℍ → ℝ³",
    formula: "ΔS = ln 2",
    body: "El 5-celda se proyecta. Cuatro vértices forman el tetraedro; el quinto se pierde. Ese vértice carga un bit holográfico — ΔS = ln 2 — que en escalas galácticas se manifiesta como Ω_DM.",
    camera: { pos: [2.2, 1.6, 6.4], target: [0, 0.2, 0] },
  },
  {
    id: "msp",
    t0: 28,
    t1: 40,
    index: 2,
    kicker: "Principio simplicial mínimo",
    title: "El vacío elige z = 4",
    formula: "z_fund = 4",
    body: "El 3-símplice es el único complejo que maximiza la densidad de entropía holográfica entre los sólidos platónicos. La rigidez de Regge (determinantes de Cayley–Menger) lo convierte en teorema, no en hipótesis ajustable.",
    camera: { pos: [0.2, 0.8, 4.6], target: [0, 0, 0] },
  },
  {
    id: "net",
    t0: 40,
    t1: 56,
    index: 3,
    kicker: "Red de vacío",
    title: "Coordinación tetraédrica",
    formula: "N_bits = log₂(2z) = 3",
    body: "Cada nodo se enlaza con exactamente cuatro vecinos. N_bits = 3, igual a dim(ℝ³). La dualidad de orientación en cada arista — holonomías SU(2) — duplica la información del grafo y fija D_V = ln 8.",
    camera: { pos: [3.4, 2.8, 6.8], target: [0, 0, 0] },
  },
  {
    id: "frust",
    t0: 56,
    t1: 70,
    index: 4,
    kicker: "Frustración geométrica",
    title: "z_fund frente a z_pack",
    formula: "σ_UV = 0.3263",
    body: "La materia puede empacar hasta z_pack = 12 (kissing number). El vacío permanece en z = 4. La brecha produce rugosidad ultravioleta σ_UV = 2 ln(12/8) / ln 12, origen geométrico de σ_eff.",
    camera: { pos: [2.6, 2.2, 5.4], target: [0, 0, 0] },
  },
  {
    id: "holo",
    t0: 70,
    t1: 84,
    index: 5,
    kicker: "Entropía holográfica",
    title: "Un bit por proyección",
    formula: "D_V − D_A = ln 2",
    body: "Entropía de superficie D_A = ln 4. Entropía de volumen D_V = ln 8. Su diferencia es exactamente un bit. Φ_F = 3 − ln 8 ≈ 0.9206 es la codimensión holográfica del vacío.",
    camera: { pos: [0, 0.6, 9.5], target: [0, 0, 0] },
  },
  {
    id: "grav",
    t0: 84,
    t1: 98,
    index: 6,
    kicker: "Gravedad emergente",
    title: "La información curva la red",
    formula: "σ_eff = σ_UV / 3 ≈ 0.1088",
    body: "No hay gravitón fundamental: la geodésica es el gradiente de entropía del vacío tetraédrico. σ_eff corrige V(r) a escalas galácticas. La masa del vacío no es una partícula, es geometría.",
    camera: { pos: [4.5, 2.4, 8.2], target: [0, 0, 0] },
  },
  {
    id: "cosmos",
    t0: 98,
    t1: 112,
    index: 7,
    kicker: "Universo observado",
    title: "Sin materia oscura particulada",
    formula: "Ω_DM = 2 ln(3/2) / 3 ≈ 0.2703",
    body: "M_vac(r) = ln 2 · M_b · (r/r_max)³. Ω_DM sale de la frustración geométrica. La galaxia rota porque el vacío tetraédrico tiene masa de información — no porque falte un halo de partículas.",
    camera: { pos: [0, 7.4, 14.5], target: [0, 0, 0] },
  },
];

export function epochAt(time: number): number {
  for (let i = EPOCHS.length - 1; i >= 0; i--) {
    if (time >= EPOCHS[i].t0) return i;
  }
  return 0;
}

export function epochProgress(time: number, index: number): number {
  const e = EPOCHS[index];
  const span = e.t1 - e.t0;
  if (span <= 0) return 1;
  return Math.min(1, Math.max(0, (time - e.t0) / span));
}
