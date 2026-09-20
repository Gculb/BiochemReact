import { AA_MASS, DIWV_DESTAB, HALFLIFE, KD, PKA } from "./proteinViewerData.js";

export function calcBioInfo(seq) {
  if (!seq) return null;
  const s = seq.toUpperCase().replace(/[^ACDEFGHIKLMNPQRSTVWY]/g, "");
  if (!s.length) return null;
  const len = s.length;
  const arr = s.split("");
  const counts = {};
  for (const aa of arr) counts[aa] = (counts[aa] || 0) + 1;

  const mw = arr.reduce((sum, aa) => sum + (AA_MASS[aa] || 111), 0) - 18.02 * (len - 1);
  const gravy = arr.reduce((sum, aa) => sum + (KD[aa] || 0), 0) / len;
  const charge = pH => {
    let q = 1 / (1 + Math.pow(10, pH - PKA.Nterm)) - 1 / (1 + Math.pow(10, PKA.Cterm - pH));
    const pos = { H: PKA.H, K: PKA.K, R: PKA.R };
    const neg = { D: PKA.D, E: PKA.E, C: PKA.C, Y: PKA.Y };
    for (const [aa, pka] of Object.entries(pos)) q += (counts[aa] || 0) / (1 + Math.pow(10, pH - pka));
    for (const [aa, pka] of Object.entries(neg)) q -= (counts[aa] || 0) / (1 + Math.pow(10, pka - pH));
    return q;
  };
  let lo = 0, hi = 14;
  for (let i = 0; i < 150; i++) { const mid = (lo + hi) / 2; charge(mid) > 0 ? (lo = mid) : (hi = mid); }
  const pI = ((lo + hi) / 2).toFixed(2);
  const chargeAt7 = charge(7.0).toFixed(2);
  let destabCount = 0;
  for (let i = 0; i < len - 1; i++) if (DIWV_DESTAB.has(arr[i] + arr[i + 1])) destabCount++;
  const instabilityIdx = ((destabCount / (len - 1)) * 100).toFixed(1);
  const isStable = parseFloat(instabilityIdx) < 40;
  const aliphIdx = (((counts.A || 0) + 2.9 * (counts.V || 0) + 3.9 * ((counts.I || 0) + (counts.L || 0))) / len * 100).toFixed(1);
  const extCoeff = 5500 * (counts.W || 0) + 1490 * (counts.Y || 0) + 125 * (counts.C || 0);
  const absCoeff = extCoeff ? (extCoeff / mw).toFixed(3) : "0";
  const posCharged = (counts.R || 0) + (counts.K || 0) + (counts.H || 0);
  const negCharged = (counts.D || 0) + (counts.E || 0);
  const composition = Object.entries(counts).sort((a, b) => b[1] - a[1]).map(([aa, n]) => ({ aa, count: n, pct: ((n / len) * 100).toFixed(1) }));
  const nTerm = arr[0];
  const halflife = HALFLIFE[nTerm] || { mam: "?", yeast: "?", ecoli: "?" };
  const classes = {
    aromatic: (counts.F || 0) + (counts.W || 0) + (counts.Y || 0) + (counts.H || 0),
    nonpolar: (counts.G || 0) + (counts.A || 0) + (counts.V || 0) + (counts.L || 0) + (counts.I || 0) + (counts.P || 0) + (counts.M || 0),
    polar: (counts.S || 0) + (counts.T || 0) + (counts.C || 0) + (counts.N || 0) + (counts.Q || 0),
    charged: posCharged + negCharged,
  };
  return {
    mw: (mw / 1000).toFixed(2), mwRaw: mw, gravy: gravy.toFixed(3), pI, chargeAt7,
    instabilityIdx, isStable, aliphIdx, extCoeff: extCoeff.toLocaleString(), absCoeff,
    composition, classes, halflife, nTerm, posCharged, negCharged, len,
  };
}

export function generateUnfolded(atoms, seed = 42) {
  let rng = seed;
  const rand = () => { rng = (rng * 1664525 + 1013904223) & 0xffffffff; return (rng >>> 0) / 0xffffffff; };
  const randN = () => { const u = Math.max(1e-10, rand()), v = rand(); return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v); };
  const cx = atoms.reduce((s, a) => s + a[0], 0) / atoms.length;
  const cy = atoms.reduce((s, a) => s + a[1], 0) / atoms.length;
  const cz = atoms.reduce((s, a) => s + a[2], 0) / atoms.length;
  return atoms.map((a, i) => {
    const ss = a[3], dx = a[0] - cx, dy = a[1] - cy, dz = a[2] - cz;
    const dist = Math.sqrt(dx * dx + dy * dy + dz * dz) || 1;
    const rx = dx / dist, ry = dy / dist, rz = dz / dist;
    if (ss === 1) {
      const blow = 18 + rand() * 12;
      return [a[0] + rx * blow + randN() * 3, a[1] + ry * blow + randN() * 3, a[2] + rz * blow + randN() * 3 + (i % 2 === 0 ? 8 : -8)];
    }
    if (ss === 2) {
      const perp = [-rz, 0, rx], blow = 14 + rand() * 10, side = (rand() - 0.5) * 24;
      return [a[0] + rx * blow + perp[0] * side + randN() * 2, a[1] + ry * blow + randN() * 4, a[2] + rz * blow + perp[2] * side + randN() * 2];
    }
    return [a[0] + randN() * 20, a[1] + randN() * 20, a[2] + randN() * 20];
  });
}

export function parsePDB(text) {
  const ssMap = {}, atoms = [], lines = text.split("\n");
  lines.forEach(line => {
    const rec = line.slice(0, 6).trim();
    if (rec === "HELIX") {
      const chain = line[19] || " ", s = parseInt(line.slice(21, 25)), e = parseInt(line.slice(33, 37));
      for (let i = s; i <= e; i++) ssMap[`${chain}${i}`] = 1;
    } else if (rec === "SHEET") {
      const chain = line[21] || " ", s = parseInt(line.slice(22, 26)), e = parseInt(line.slice(33, 37));
      for (let i = s; i <= e; i++) ssMap[`${chain}${i}`] = 2;
    }
  });
  lines.forEach(line => {
    if (line.slice(0, 4) !== "ATOM" || line.slice(12, 16).trim() !== "CA") return;
    const chain = line[21] || " ", resSeq = parseInt(line.slice(22, 26));
    const x = parseFloat(line.slice(30, 38)), y = parseFloat(line.slice(38, 46)), z = parseFloat(line.slice(46, 54));
    const plddt = parseFloat(line.slice(60, 66)) || 0;
    if (isNaN(x) || isNaN(y) || isNaN(z)) return;
    const ss = ssMap[`${chain}${resSeq}`] ?? ssMap[`A${resSeq}`] ?? ssMap[` ${resSeq}`] ?? 0;
    atoms.push([x, y, z, ss, resSeq, plddt]);
  });
  return atoms;
}

export const countAtoms = text => text.split("\n").filter(line => line.startsWith("ATOM")).length;
export const buildResidueMap = atoms => {
  const map = {};
  atoms.forEach((atom, index) => { if (atom[4] != null) map[atom[4]] = index; });
  return map;
};
export function calcSSFraction(atoms) {
  if (!atoms.length) return null;
  const total = atoms.length, helix = atoms.filter(a => a[3] === 1).length, sheet = atoms.filter(a => a[3] === 2).length;
  return { helix: ((helix / total) * 100).toFixed(1), sheet: ((sheet / total) * 100).toFixed(1), coil: (((total - helix - sheet) / total) * 100).toFixed(1) };
}

export function buildFallback(pdb) {
  const PI = Math.PI, atoms = [];
  const helix = (len, ox, oy, oz, pd) => {
    for (let i = 0; i < len; i++) { const a = (pd + i * 100) * PI / 180; atoms.push([ox + 2.3 * Math.cos(a), oy + 2.3 * Math.sin(a), oz + i * 1.5, 1, null, 0]); }
    atoms.push([0,0,0,0,null,0],[0,0,0,0,null,0],[0,0,0,0,null,0]);
  };
  if (pdb === "1MBN" || pdb === "1HHO") [[16,0,0,0,0],[8,8,-5,28,45],[7,2,3,44,90],[6,-6,1,56,135],[9,-10,-4,67,180],[8,-4,-8,82,225],[7,4,-6,95,270],[5,8,2,108,315]].forEach(args => helix(...args));
  else if (pdb === "4INS") { helix(9,0,0,0,0); helix(10,10,0,0,0); for (let i = 0; i < 30; i++) { const a = i * 100 * PI / 180; atoms.push([2.3 * Math.cos(a), -12 + 2.3 * Math.sin(a), i * 1.5 - 5, 1, null, 0]); } }
  else if (pdb === "2POR") for (let s = 0; s < 16; s++) { const sa = s * (2 * PI / 16), cx = 10 * Math.cos(sa), cy = 10 * Math.sin(sa); for (let j = 0; j < 14; j++) { const jj = s % 2 === 0 ? j : 13 - j; atoms.push([cx + (j - 7) * 0.25 * Math.sin(sa), cy + (j - 7) * 0.25 * Math.cos(sa), jj * 3.4 - 24, 2, null, 0]); } }
  else if (pdb === "1TIM") for (let i = 0; i < 8; i++) { const ma = i * PI / 4, br = 7, cx = br * Math.cos(ma), cy = br * Math.sin(ma); for (let j = 0; j < 8; j++) atoms.push([cx - j * 0.25 * Math.cos(ma), cy - j * 0.25 * Math.sin(ma), j * 3.4, 2, null, 0]); const hcx = (br + 5) * Math.cos(ma + PI / 8), hcy = (br + 5) * Math.sin(ma + PI / 8); for (let j = 0; j < 12; j++) { const ha = j * 100 * PI / 180; atoms.push([hcx + 2.3 * Math.cos(ha), hcy + 2.3 * Math.sin(ha), j * 1.5 + 2, 1, null, 0]); } }
  else if (pdb === "1CAG") [0, 2 * PI / 3, 4 * PI / 3].forEach(off => { for (let i = 0; i < 60; i++) { const t = i / 59, ma = off + t * 6 * PI, sa = off + t * 20 * PI; atoms.push([(3 + 1.5 * Math.cos(sa)) * Math.cos(ma), (3 + 1.5 * Math.cos(sa)) * Math.sin(ma), i * 0.86 - 26, 1, null, 0]); } });
  else { for (let s = 0; s < 11; s++) { const sa = s * (2 * PI / 11), cx = 9 * Math.cos(sa), cy = 9 * Math.sin(sa); for (let j = 0; j < 15; j++) { const jj = s % 2 === 0 ? j : 14 - j; atoms.push([cx + (j - 7) * 0.2 * Math.sin(sa), cy + (j - 7) * 0.2 * Math.cos(sa), jj * 3.4 - 25, 2, null, 0]); } } helix(20,0,0,-15,0); }
  return atoms;
}

export const centroid = atoms => {
  const n = atoms.length || 1;
  return [atoms.reduce((s, a) => s + a[0], 0) / n, atoms.reduce((s, a) => s + a[1], 0) / n, atoms.reduce((s, a) => s + a[2], 0) / n];
};
export const maxR = (atoms, c) => Math.max(...atoms.map(([x, y, z]) => Math.sqrt((x - c[0]) ** 2 + (y - c[1]) ** 2 + (z - c[2]) ** 2)), 1);
export const rotY3 = ([x, y, z], a) => [Math.cos(a) * x + Math.sin(a) * z, y, -Math.sin(a) * x + Math.cos(a) * z];
export const rotX3 = ([x, y, z], a) => [x, Math.cos(a) * y - Math.sin(a) * z, Math.sin(a) * y + Math.cos(a) * z];
function catmullRom(p0, p1, p2, p3, t) { return p0.map((_, i) => 0.5 * ((2 * p1[i]) + (-p0[i] + p2[i]) * t + (2 * p0[i] - 5 * p1[i] + 4 * p2[i] - p3[i]) * t * t + (-p0[i] + 3 * p1[i] - 3 * p2[i] + p3[i]) * t * t * t)); }
export function spline(pts, steps = 5) {
  if (pts.length < 2) return pts;
  const out = [];
  for (let i = 0; i < pts.length - 1; i++) { const p0 = pts[Math.max(0, i - 1)], p1 = pts[i], p2 = pts[Math.min(pts.length - 1, i + 1)], p3 = pts[Math.min(pts.length - 1, i + 2)]; for (let s = 0; s < steps; s++) out.push(catmullRom(p0, p1, p2, p3, s / steps)); }
  out.push(pts[pts.length - 1]);
  return out;
}
export function hexRgba(hex, a) {
  const r = parseInt(hex.slice(1, 3), 16), g = parseInt(hex.slice(3, 5), 16), b = parseInt(hex.slice(5, 7), 16);
  return `rgba(${r},${g},${b},${a.toFixed(2)})`;
}
