/**
 * Constants of Tetrahedral Emergent Gravity (TEG)
 * Miguel Ángel Franco León — algebraic chain, zero fitted parameters.
 *
 * z_fund = 4 → D_eff = ln 8 → σ_UV → N_bits = 3 → σ_eff
 */

export const Z_FUND = 4;
export const Z_PACK = 12;

export const D_A = Math.log(Z_FUND); // ln 4 ≈ 1.386294
export const D_EFF = Math.log(2 * Z_FUND); // ln 8 ≈ 2.079442
export const D_V = D_EFF;
export const HOLOGRAPHIC_BIT = Math.LN2; // ln 2 ≈ 0.693147
export const N_BITS = Math.log2(2 * Z_FUND); // 3 exactly

/** UV roughness from geometric frustration z_pack vs z_fund. */
export const SIGMA_UV =
  (2 * Math.log(Z_PACK / (Z_PACK - Z_FUND))) / Math.log(Z_PACK);

export const SIGMA_EFF = SIGMA_UV / N_BITS;

/** Holographic codimension Φ_F = 3 − ln 8. */
export const PHI_F = 3 - D_EFF;

/** Surface entropy scale Φ = ln 4. */
export const PHI = D_A;

/** Dark-matter density from geometric frustration, not particles. */
export const OMEGA_DM = (2 * Math.log(3 / 2)) / 3;

/** Baryon density from quaternion projection (TEG reported value). */
export const OMEGA_B = 0.0516;

/** Jeans radius, kpc, H0 = 70 km/s/Mpc (TEG conjecture). */
export const R_JEANS_KPC = 0.6192;

export const R_REF_KPC = 1;
export const N0 = 1.5;

/** G in kpc · (km/s)² / M☉ */
export const G_ASTRO = 4.30091e-6;

export const VIS = {
  void: 0x07080b,
  edge: 0xd5dbe3,
  node: 0xe8eef2,
  face: 0x8b97a4,
  ghost: 0x4a5560,
  lost: 0xc5cdd6,
  halo: 0x7d8b99,
  disk: 0xcfd6de,
} as const;

export const DURATION = 112;

export function formatConst(value: number, digits = 4): string {
  return value.toFixed(digits);
}

export type CurvePoint = {
  r: number;
  vBar: number;
  vVac: number;
  vTot: number;
};

/**
 * Schematic SPARC-like exponential disk + TEG vacuum term.
 * V²_tot = V²_bar + V²_vac
 * M_vac(r) = ln 2 · M_b,tot · (r / r_max)³
 */
export function rotationCurve(n = 40): CurvePoint[] {
  const rMax = 30;
  const rD = 2.8;
  const mB = 4.5e10;
  const exponent = (D_EFF - 2) / 2;
  const pts: CurvePoint[] = [];
  for (let i = 1; i <= n; i++) {
    const r = (i / n) * rMax;
    const x = r / rD;
    const mEnc = mB * (1 - Math.exp(-x) * (1 + x));
    const F = 1 - Math.exp(-x / N0);
    const vBar2 =
      (G_ASTRO * mEnc) / r * PHI * (1 - SIGMA_EFF * F) * (r / R_REF_KPC) ** exponent;
    const mVac = HOLOGRAPHIC_BIT * mB * (r / rMax) ** 3;
    const vVac2 = (G_ASTRO * mVac) / r;
    pts.push({
      r: Number(r.toFixed(2)),
      vBar: Math.sqrt(Math.max(0, vBar2)),
      vVac: Math.sqrt(Math.max(0, vVac2)),
      vTot: Math.sqrt(Math.max(0, vBar2 + vVac2)),
    });
  }
  return pts;
}

export const CONST_ROWS: { symbol: string; value: string; note: string }[] = [
  { symbol: "z_fund", value: "4", note: "coordinación tetraédrica" },
  { symbol: "z_pack", value: "12", note: "kissing number en ℝ³" },
  { symbol: "D_eff", value: "ln 8 ≈ 2.0794", note: "dimensión espectral" },
  { symbol: "D_A", value: "ln 4 ≈ 1.3863", note: "entropía de superficie" },
  { symbol: "ΔS", value: "ln 2 ≈ 0.6931", note: "bit holográfico" },
  { symbol: "N_bits", value: "3", note: "log₂(2z) = dim(ℝ³)" },
  { symbol: "σ_UV", value: formatConst(SIGMA_UV), note: "rugosidad UV" },
  { symbol: "σ_eff", value: formatConst(SIGMA_EFF), note: "σ_UV / 3" },
  { symbol: "Φ_F", value: formatConst(PHI_F), note: "3 − ln 8" },
  { symbol: "Ω_DM", value: formatConst(OMEGA_DM), note: "2 ln(3/2) / 3" },
  { symbol: "Ω_b", value: "0.0516", note: "proyección cuaterniónica" },
  { symbol: "r_J", value: "0.6192 kpc", note: "radio de Jeans" },
];
