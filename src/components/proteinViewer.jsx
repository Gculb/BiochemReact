import React, { useEffect, useRef, useState, useCallback } from "react";
import "./proteinViewer.css";

// ─── API endpoints ────────────────────────────────────────────────────────────
const RCSB_META   = (id) => `https://data.rcsb.org/rest/v1/core/entry/${id}`;
const RCSB_ENTITY = (id) => `https://data.rcsb.org/rest/v1/core/polymer_entity/${id}/1`;
const RCSB_PDB    = (id) => `https://files.rcsb.org/download/${id}.pdb`;
const UNIPROT_SEARCH = (pdb) =>
  `https://rest.uniprot.org/uniprotkb/search?query=database(PDB):${pdb}&format=json` +
  `&fields=id,protein_name,gene_names,organism_name,cc_function,ft_domain,sequence,` +
  `cc_disease,keyword,cc_subcellular_location,cc_cofactor,ft_active_site,ft_binding,ft_site&size=1`;
// AlphaFold EBI — returns array; element 0 has pdbUrl
const AF_API = (uniprotAcc) =>
  `https://alphafold.ebi.ac.uk/api/prediction/${uniprotAcc}`;

// ─── Static data ──────────────────────────────────────────────────────────────
const PROTEINS = {
  "1MBN": { label: "Myoglobin",        class: "All-α",       bio: "Oxygen storage in muscle" },
  "4INS": { label: "Insulin",          class: "α + α",       bio: "Blood glucose regulation" },
  "1TIM": { label: "TIM Barrel",       class: "(β/α)₈",      bio: "Triosephosphate isomerase" },
  "2POR": { label: "Porin",            class: "All-β barrel", bio: "Outer membrane channel" },
  "3NIR": { label: "GFP",             class: "β-barrel",    bio: "Green fluorescent protein" },
  "1HHO": { label: "Hemoglobin",       class: "All-α",       bio: "O₂ transport (α₂β₂ tetramer)" },
  "1CAG": { label: "Collagen",         class: "Triple helix", bio: "Extracellular matrix structure" },
  "6LU7": { label: "SARS-CoV-2 Mpro", class: "α/β mixed",   bio: "Main protease, key drug target" },
  "5XNL": { label: "p53 DBD",         class: "β-sandwich",  bio: "Tumor suppressor DNA-binding domain", tier: "advanced" },
  "1UBQ": { label: "Ubiquitin",        class: "α+β",         bio: "Protein degradation tag" },
};

const WARN_THRESHOLD  = 5000;
const BLOCK_THRESHOLD = 20000;

// Secondary structure colors (used in RCSB mode)
const SS_COLOR = { 0: "#7f8896", 1: "#79a8ca", 2: "#c8a35b" };
const SS_WIDTH = { 0: 2,  1: 5.5, 2: 4 };

// AlphaFold pLDDT confidence color ramp
function plddtColor(v) {
  if (v >= 90) return "#5f8f7b"; // very high – muted teal
  if (v >= 70) return "#6f90b0"; // confident – muted blue
  if (v >= 50) return "#b89257"; // low – muted amber
  return "#a97878";              // very low – muted rose
}

// Active site type → color
const SITE_COLORS = {
  "Active site": "#d7c06a",
  "Binding site": "#87aec0",
  "Site":         "#b28ab8",
  default:        "#c8a35b",
};

// ─── Biochemical lookup tables (unchanged) ────────────────────────────────────
const AA_MASS = {
  A:89.09,R:174.20,N:132.12,D:133.10,C:121.16,E:147.13,Q:146.15,G:75.03,
  H:155.16,I:131.17,L:131.17,K:146.19,M:149.20,F:165.19,P:115.13,S:105.09,
  T:119.12,W:204.23,Y:181.19,V:117.15,
};
const KD = {
  A:1.8,R:-4.5,N:-3.5,D:-3.5,C:2.5,E:-3.5,Q:-3.5,G:-0.4,H:-3.2,
  I:4.5,L:3.8,K:-3.9,M:1.9,F:2.8,P:-1.6,S:-0.8,T:-0.7,W:-0.9,Y:-1.3,V:4.2,
};
const PKA = {
  D:3.65,E:4.25,C:8.18,Y:10.07,H:6.00,K:10.53,R:12.48,Nterm:8.00,Cterm:3.10,
};
const DIWV_DESTAB = new Set([
  "WW","WC","WM","WH","WF","WR","WK","WQ","WP","WS","WN","WT","WA","WD","WE","WG","WI","WL","WV","WY",
  "CK","CM","CS","CT","CH","CR","CC","CQ","CP","CN","CA","CD","CE","CF","CG","CI","CL","CV","CY","CW",
  "MK","ML","MM","MR","MS","MN","MC","MA","MD","ME","MF","MG","MH","MI","MP","MQ","MT","MV","MY","MW",
  "FK","FM","FR","FY","FW","FC","FH","FN","FD","FE","FG","FI","FL","FP","FQ","FS","FT","FA","FV",
  "YK","YM","YR","YC","YD","YE","YF","YG","YH","YI","YL","YN","YP","YQ","YS","YT","YA","YV","YW",
  "IK","IM","IR","IC","ID","IE","IF","IG","IH","IL","IN","IP","IQ","IS","IT","IA","IV","IW","IY",
  "LK","LR","LC","LD","LE","LF","LG","LH","LI","LM","LN","LP","LQ","LS","LT","LA","LV","LW","LY",
  "RK","RR","RM","RC","RD","RE","RF","RG","RH","RI","RL","RN","RP","RQ","RS","RT","RA","RV","RW","RY",
  "KK","KR","KM","KC","KD","KE","KF","KG","KH","KI","KL","KN","KP","KQ","KS","KT","KA","KV","KW","KY",
  "SS","ST","SD","SE","SF","SG","SH","SI","SK","SL","SM","SN","SP","SQ","SR","SA","SV","SW","SY",
]);
const HALFLIFE = {
  A:{mam:"4.4h",yeast:">20h",ecoli:">10h"}, R:{mam:"1h",yeast:"2min",ecoli:"2min"},
  N:{mam:"1.4h",yeast:"3min",ecoli:">10h"}, D:{mam:"1.1h",yeast:"3min",ecoli:"1.1h"},
  C:{mam:"1.2h",yeast:">20h",ecoli:">10h"}, E:{mam:"1h",yeast:"30min",ecoli:"1h"},
  Q:{mam:"0.8h",yeast:"10min",ecoli:">10h"}, G:{mam:"30h",yeast:">20h",ecoli:">10h"},
  H:{mam:"3.5h",yeast:"10min",ecoli:">10h"}, I:{mam:"20h",yeast:"30min",ecoli:">10h"},
  L:{mam:"5.5h",yeast:"3min",ecoli:"2min"}, K:{mam:"1.3h",yeast:"3min",ecoli:"2min"},
  M:{mam:"30h",yeast:">20h",ecoli:">10h"}, F:{mam:"1.1h",yeast:"3min",ecoli:"2min"},
  P:{mam:">20h",yeast:">20h",ecoli:"?"}, S:{mam:"1.9h",yeast:">20h",ecoli:">10h"},
  T:{mam:"7.2h",yeast:">20h",ecoli:">10h"}, W:{mam:"2.8h",yeast:"3min",ecoli:"2min"},
  Y:{mam:"2.8h",yeast:"10min",ecoli:"2min"}, V:{mam:"100h",yeast:">20h",ecoli:">10h"},
};

// ─── Biochemical calculations (unchanged) ─────────────────────────────────────
function calcBioInfo(seq) {
  if (!seq) return null;
  const s   = seq.toUpperCase().replace(/[^ACDEFGHIKLMNPQRSTVWY]/g, "");
  if (!s.length) return null;
  const len  = s.length;
  const arr  = s.split("");
  const counts = {};
  for (const aa of arr) counts[aa] = (counts[aa] || 0) + 1;

  const mw    = arr.reduce((sum, aa) => sum + (AA_MASS[aa] || 111), 0) - 18.02 * (len - 1);
  const gravy = arr.reduce((sum, aa) => sum + (KD[aa] || 0), 0) / len;

  const charge = (pH) => {
    let q = 1 / (1 + Math.pow(10, pH - PKA.Nterm)) - 1 / (1 + Math.pow(10, PKA.Cterm - pH));
    const pos = { H: PKA.H, K: PKA.K, R: PKA.R };
    const neg = { D: PKA.D, E: PKA.E, C: PKA.C, Y: PKA.Y };
    for (const [aa, pka] of Object.entries(pos)) q += (counts[aa] || 0) / (1 + Math.pow(10, pH - pka));
    for (const [aa, pka] of Object.entries(neg)) q -= (counts[aa] || 0) / (1 + Math.pow(10, pka - pH));
    return q;
  };
  let lo = 0, hi = 14;
  for (let i = 0; i < 150; i++) { const mid = (lo + hi) / 2; charge(mid) > 0 ? (lo = mid) : (hi = mid); }
  const pI        = ((lo + hi) / 2).toFixed(2);
  const chargeAt7 = charge(7.0).toFixed(2);

  let destabCount = 0;
  for (let i = 0; i < len - 1; i++) if (DIWV_DESTAB.has(arr[i] + arr[i + 1])) destabCount++;
  const instabilityIdx = ((destabCount / (len - 1)) * 100).toFixed(1);
  const isStable       = parseFloat(instabilityIdx) < 40;
  const aliphIdx       = (((counts.A || 0) + 2.9 * (counts.V || 0) + 3.9 * ((counts.I || 0) + (counts.L || 0))) / len * 100).toFixed(1);
  const extCoeff       = 5500 * (counts.W || 0) + 1490 * (counts.Y || 0) + 125 * (counts.C || 0);
  const absCoeff       = extCoeff ? (extCoeff / mw).toFixed(3) : "0";
  const posCharged     = (counts.R || 0) + (counts.K || 0) + (counts.H || 0);
  const negCharged     = (counts.D || 0) + (counts.E || 0);
  const composition    = Object.entries(counts).sort((a, b) => b[1] - a[1]).map(([aa, n]) => ({ aa, count: n, pct: ((n / len) * 100).toFixed(1) }));
  const nTerm          = arr[0];
  const halflife       = HALFLIFE[nTerm] || { mam: "?", yeast: "?", ecoli: "?" };
  const classes = {
    aromatic: (counts.F||0)+(counts.W||0)+(counts.Y||0)+(counts.H||0),
    nonpolar: (counts.G||0)+(counts.A||0)+(counts.V||0)+(counts.L||0)+(counts.I||0)+(counts.P||0)+(counts.M||0),
    polar:    (counts.S||0)+(counts.T||0)+(counts.C||0)+(counts.N||0)+(counts.Q||0),
    charged:  posCharged + negCharged,
  };
  return {
    mw: (mw / 1000).toFixed(2), mwRaw: mw,
    gravy: gravy.toFixed(3), pI, chargeAt7,
    instabilityIdx, isStable, aliphIdx,
    extCoeff: extCoeff.toLocaleString(), absCoeff,
    composition, classes, halflife, nTerm,
    posCharged, negCharged, len,
  };
}

// ─── Fold/unfold: generate denatured positions ────────────────────────────────
/**
 * Build a "denatured" position array that mirrors the native atoms array.
 * Strategy is SS-aware:
 *   Helix (ss=1): expand radially outward from chain centroid + add vertical drift
 *   Sheet (ss=2): fan outward perpendicular to the local strand direction
 *   Coil  (ss=0): simple Gaussian diffusion
 *
 * Returns an array of [x,y,z] (no ss/resSeq — those come from native).
 */
function generateUnfolded(atoms, seed = 42) {
  // Seeded pseudo-random so the animation is deterministic per protein load
  let rng = seed;
  const rand = () => {
    rng = (rng * 1664525 + 1013904223) & 0xffffffff;
    return (rng >>> 0) / 0xffffffff;
  };
  const randN = () => {
    // Box-Muller
    const u = Math.max(1e-10, rand()), v = rand();
    return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v);
  };

  const cx = atoms.reduce((s, a) => s + a[0], 0) / atoms.length;
  const cy = atoms.reduce((s, a) => s + a[1], 0) / atoms.length;
  const cz = atoms.reduce((s, a) => s + a[2], 0) / atoms.length;

  return atoms.map((a, i) => {
    const ss   = a[3];
    const dx   = a[0] - cx, dy = a[1] - cy, dz = a[2] - cz;
    const dist = Math.sqrt(dx * dx + dy * dy + dz * dz) || 1;
    // Radial unit vector from centroid
    const rx = dx / dist, ry = dy / dist, rz = dz / dist;

    if (ss === 1) {
      // Helices: shoot outward + drift up/down
      const blow = 18 + rand() * 12;
      return [
        a[0] + rx * blow + randN() * 3,
        a[1] + ry * blow + randN() * 3,
        a[2] + rz * blow + randN() * 3 + (i % 2 === 0 ? 8 : -8),
      ];
    } else if (ss === 2) {
      // Sheets: fan sideways (perpendicular in XZ plane)
      const perp = [-rz, 0, rx];
      const blow = 14 + rand() * 10;
      const side = (rand() - 0.5) * 24;
      return [
        a[0] + rx * blow + perp[0] * side + randN() * 2,
        a[1] + ry * blow + randN() * 4,
        a[2] + rz * blow + perp[2] * side + randN() * 2,
      ];
    } else {
      // Coils: pure diffusion, wider spread
      const spread = 20;
      return [
        a[0] + randN() * spread,
        a[1] + randN() * spread,
        a[2] + randN() * spread,
      ];
    }
  });
}

// ─── Linear interpolation helper ─────────────────────────────────────────────
const lerp = (a, b, t) => a + (b - a) * t;

// ─── PDB parsers ─────────────────────────────────────────────────────────────
/**
 * Parses a PDB text.
 * Atom tuple: [x, y, z, ss, resSeq, plddt]
 *   ss     — 0=coil, 1=helix, 2=sheet
 *   resSeq — integer residue sequence number (for active-site mapping)
 *   plddt  — B-factor field value (AlphaFold stores confidence here)
 */
function parsePDB(text) {
  const ssMap = {}, atoms = [], lines = text.split("\n");
  lines.forEach(line => {
    const rec = line.slice(0, 6).trim();
    if (rec === "HELIX") {
      // Col 19 (0-indexed) = init chain ID; cols 21-24 = init seq num; cols 31-34 = end chain; 33-36 = end seq num
      const chain = line[19] || " ";
      const s = parseInt(line.slice(21, 25)), e = parseInt(line.slice(33, 37));
      for (let i = s; i <= e; i++) ssMap[`${chain}${i}`] = 1;
    } else if (rec === "SHEET") {
      // Col 21 = strand chain ID; cols 22-25 = init seq; col 32 = end chain; 33-36 = end seq
      const chain = line[21] || " ";
      const s = parseInt(line.slice(22, 26)), e = parseInt(line.slice(33, 37));
      for (let i = s; i <= e; i++) ssMap[`${chain}${i}`] = 2;
    }
  });
  lines.forEach(line => {
    if (line.slice(0, 4) !== "ATOM") return;
    if (line.slice(12, 16).trim() !== "CA") return;
    const chain  = line[21] || " ";
    const resSeq = parseInt(line.slice(22, 26));
    const x      = parseFloat(line.slice(30, 38));
    const y      = parseFloat(line.slice(38, 46));
    const z      = parseFloat(line.slice(46, 54));
    const plddt  = parseFloat(line.slice(60, 66)) || 0; // B-factor column
    if (isNaN(x) || isNaN(y) || isNaN(z)) return;
    // Try exact chain match first, fall back to any chain match for single-chain proteins
    const ss = ssMap[`${chain}${resSeq}`] ?? ssMap[`A${resSeq}`] ?? ssMap[` ${resSeq}`] ?? 0;
    atoms.push([x, y, z, ss, resSeq, plddt]);
  });
  return atoms;
}

const countAtoms = (text) => text.split("\n").filter(l => l.startsWith("ATOM")).length;

/** Build residue-sequence → atom-index lookup from a parsed atom array */
function buildResidueMap(atoms) {
  const map = {};
  atoms.forEach((a, i) => { if (a[4] != null) map[a[4]] = i; });
  return map;
}

function calcSSFraction(atoms) {
  if (!atoms.length) return null;
  const total  = atoms.length;
  const helix  = atoms.filter(a => a[3] === 1).length;
  const sheet  = atoms.filter(a => a[3] === 2).length;
  return {
    helix: ((helix / total) * 100).toFixed(1),
    sheet: ((sheet / total) * 100).toFixed(1),
    coil:  (((total - helix - sheet) / total) * 100).toFixed(1),
  };
}

/**
 * Fallback geometry for when PDB fetch fails.
 * Pad atom tuples with null resSeq and 0 plddt so downstream code is safe.
 */
function buildFallback(pdb) {
  const PI = Math.PI, atoms = [];
  const helix = (len, ox, oy, oz, pd) => {
    for (let i = 0; i < len; i++) {
      const a = (pd + i * 100) * PI / 180;
      atoms.push([ox + 2.3 * Math.cos(a), oy + 2.3 * Math.sin(a), oz + i * 1.5, 1, null, 0]);
    }
    atoms.push([0,0,0,0,null,0],[0,0,0,0,null,0],[0,0,0,0,null,0]);
  };
  if (pdb === "1MBN" || pdb === "1HHO") {
    [[16,0,0,0,0],[8,8,-5,28,45],[7,2,3,44,90],[6,-6,1,56,135],[9,-10,-4,67,180],[8,-4,-8,82,225],[7,4,-6,95,270],[5,8,2,108,315]].forEach(([l,ox,oy,oz,p]) => helix(l,ox,oy,oz,p));
  } else if (pdb === "4INS") {
    helix(9,0,0,0,0); helix(10,10,0,0,0);
    for (let i = 0; i < 30; i++) { const a = i * 100 * PI / 180; atoms.push([2.3 * Math.cos(a), -12 + 2.3 * Math.sin(a), i * 1.5 - 5, 1, null, 0]); }
  } else if (pdb === "2POR") {
    for (let s = 0; s < 16; s++) { const sa = s * (2 * PI / 16), cx = 10 * Math.cos(sa), cy = 10 * Math.sin(sa); for (let j = 0; j < 14; j++) { const jj = s % 2 === 0 ? j : 13 - j; atoms.push([cx + (j - 7) * 0.25 * Math.sin(sa), cy + (j - 7) * 0.25 * Math.cos(sa), jj * 3.4 - 24, 2, null, 0]); } }
  } else if (pdb === "1TIM") {
    for (let i = 0; i < 8; i++) { const ma = i * PI / 4, br = 7, cx = br * Math.cos(ma), cy = br * Math.sin(ma); for (let j = 0; j < 8; j++) atoms.push([cx - j * 0.25 * Math.cos(ma), cy - j * 0.25 * Math.sin(ma), j * 3.4, 2, null, 0]); const hcx = (br + 5) * Math.cos(ma + PI / 8), hcy = (br + 5) * Math.sin(ma + PI / 8); for (let j = 0; j < 12; j++) { const ha = j * 100 * PI / 180; atoms.push([hcx + 2.3 * Math.cos(ha), hcy + 2.3 * Math.sin(ha), j * 1.5 + 2, 1, null, 0]); } }
  } else if (pdb === "1CAG") {
    [0, 2 * PI / 3, 4 * PI / 3].forEach(off => { for (let i = 0; i < 60; i++) { const t = i / 59, ma = off + t * 6 * PI, sa = off + t * 20 * PI; atoms.push([(3 + 1.5 * Math.cos(sa)) * Math.cos(ma), (3 + 1.5 * Math.cos(sa)) * Math.sin(ma), i * 0.86 - 26, 1, null, 0]); } });
  } else {
    for (let s = 0; s < 11; s++) { const sa = s * (2 * PI / 11), cx = 9 * Math.cos(sa), cy = 9 * Math.sin(sa); for (let j = 0; j < 15; j++) { const jj = s % 2 === 0 ? j : 14 - j; atoms.push([cx + (j - 7) * 0.2 * Math.sin(sa), cy + (j - 7) * 0.2 * Math.cos(sa), jj * 3.4 - 25, 2, null, 0]); } } helix(20,0,0,-15,0);
  }
  return atoms;
}

// ─── 3-D math ─────────────────────────────────────────────────────────────────
const centroid = (atoms) => {
  const n = atoms.length || 1;
  return [
    atoms.reduce((s, a) => s + a[0], 0) / n,
    atoms.reduce((s, a) => s + a[1], 0) / n,
    atoms.reduce((s, a) => s + a[2], 0) / n,
  ];
};
const maxR      = (atoms, c) => Math.max(...atoms.map(([x, y, z]) => Math.sqrt((x - c[0]) ** 2 + (y - c[1]) ** 2 + (z - c[2]) ** 2)), 1);
const rotY3     = ([x, y, z], a) => [Math.cos(a) * x + Math.sin(a) * z, y, -Math.sin(a) * x + Math.cos(a) * z];
const rotX3     = ([x, y, z], a) => [x, Math.cos(a) * y - Math.sin(a) * z, Math.sin(a) * y + Math.cos(a) * z];
function catmullRom(p0, p1, p2, p3, t) { return p0.map((_, i) => 0.5 * ((2 * p1[i]) + (-p0[i] + p2[i]) * t + (2 * p0[i] - 5 * p1[i] + 4 * p2[i] - p3[i]) * t * t + (-p0[i] + 3 * p1[i] - 3 * p2[i] + p3[i]) * t * t * t)); }
function spline(pts, steps = 5) {
  if (pts.length < 2) return pts;
  const out = [];
  for (let i = 0; i < pts.length - 1; i++) {
    const p0 = pts[Math.max(0, i - 1)], p1 = pts[i],
          p2 = pts[Math.min(pts.length - 1, i + 1)],
          p3 = pts[Math.min(pts.length - 1, i + 2)];
    for (let s = 0; s < steps; s++) out.push(catmullRom(p0, p1, p2, p3, s / steps));
  }
  out.push(pts[pts.length - 1]);
  return out;
}
function hexRgba(hex, a) {
  const r = parseInt(hex.slice(1, 3), 16), g = parseInt(hex.slice(3, 5), 16), b = parseInt(hex.slice(5, 7), 16);
  return `rgba(${r},${g},${b},${a.toFixed(2)})`;
}

// ─── Sub-components (BioInfoPanel sub-components — unchanged) ─────────────────
const AA_COLORS = {
  A:"#82a993",R:"#c88c8c",N:"#8eb4c7",D:"#c88c8c",C:"#d1bf78",E:"#c88c8c",
  Q:"#8eb4c7",G:"#8d98a4",H:"#a189bc",I:"#82a993",L:"#82a993",K:"#c88c8c",
  M:"#d1bf78",F:"#b694bf",P:"#8eb4c7",S:"#7397b8",T:"#7397b8",W:"#b694bf",
  Y:"#b694bf",V:"#82a993",
};

const MetricBar = ({ label, value, rawValue, max, color, note }) => {
  const pct = Math.min(100, Math.max(0, (rawValue / max) * 100));
  return (
    <div className="bio-metric">
      <div className="bio-metric-header">
        <span className="bio-metric-label">{label}</span>
        <span className="bio-metric-value">{value}</span>
      </div>
      <div className="bio-metric-track">
        <div className="bio-metric-fill" style={{ width: `${pct}%`, background: color }} />
      </div>
      {note && <div className="bio-metric-note">{note}</div>}
    </div>
  );
};

const StatGrid = ({ cells }) => (
  <div className="bio-stat-grid">
    {cells.map(({ label, value, unit, sub, accent }, i) => (
      <div key={i} className="bio-stat-cell">
        <div className="bio-stat-label">{label}</div>
        <div className="bio-stat-value" style={accent ? { color: accent } : {}}>
          {value}{unit && <span className="bio-stat-unit"> {unit}</span>}
        </div>
        {sub && <div className="bio-stat-sub">{sub}</div>}
      </div>
    ))}
  </div>
);

const CompositionChart = ({ composition }) => {
  const maxPct = Math.max(...composition.map(c => parseFloat(c.pct)));
  return (
    <div className="bio-comp-chart">
      {[...composition].sort((a, b) => b.pct - a.pct).map(({ aa, pct, count }) => (
        <div key={aa} className="bio-comp-row" title={`${aa}: ${count} residues (${pct}%)`}>
          <span className="bio-comp-aa" style={{ color: AA_COLORS[aa] || "#79a8ca" }}>{aa}</span>
          <div className="bio-comp-track">
            <div className="bio-comp-fill" style={{ width: `${(parseFloat(pct) / maxPct) * 100}%`, background: AA_COLORS[aa] || "#79a8ca" }} />
          </div>
          <span className="bio-comp-pct">{pct}%</span>
        </div>
      ))}
    </div>
  );
};

const ClassDonut = ({ classes, total }) => {
  const items = [
    { label: "Non-polar", val: classes.nonpolar, color: "#82a993" },
    { label: "Polar",     val: classes.polar,    color: "#79a8ca" },
    { label: "Charged",   val: classes.charged,  color: "#c88c8c" },
    { label: "Aromatic",  val: classes.aromatic, color: "#b694bf" },
  ];
  const R = 30, SW = 10, circ = 2 * Math.PI * R;
  let offset = 0;
  const segs = items.map(item => {
    const len = (item.val / total) * circ;
    const seg = { ...item, dasharray: `${len} ${circ - len}`, dashoffset: -offset };
    offset += len;
    return seg;
  });
  return (
    <div className="bio-class-wrap">
      <svg width="80" height="80" viewBox="0 0 80 80">
        <circle cx="40" cy="40" r={R} fill="none" stroke="#1a2536" strokeWidth={SW} />
        {segs.map((seg, i) => (
          <circle key={i} cx="40" cy="40" r={R} fill="none" stroke={seg.color}
            strokeWidth={SW} strokeDasharray={seg.dasharray} strokeDashoffset={seg.dashoffset} />
        ))}
      </svg>
      <div className="bio-class-legend">
        {items.map(({ label, val, color }) => (
          <div key={label} className="bio-class-row">
            <span style={{ background: color }} />
            <span>{label}</span>
            <strong>{((val / total) * 100).toFixed(0)}%</strong>
          </div>
        ))}
      </div>
    </div>
  );
};

const SSDonut = ({ ssFrac }) => {
  if (!ssFrac) return null;
  const h = parseFloat(ssFrac.helix), sh = parseFloat(ssFrac.sheet), c = parseFloat(ssFrac.coil);
  const R = 28, SW = 10, circ = 2 * Math.PI * R;
  const seg = v => (v / 100) * circ;
  const hS = seg(h), shS = seg(sh), cS = seg(c);
  return (
    <div className="bio-ss-donut">
      <svg width="72" height="72" viewBox="0 0 72 72">
        <circle cx="36" cy="36" r={R} fill="none" stroke="#1a2536" strokeWidth={SW} />
        <circle cx="36" cy="36" r={R} fill="none" stroke={SS_COLOR[0]} strokeWidth={SW} strokeDasharray={`${cS} ${circ - cS}`} strokeDashoffset={`${-(hS + shS)}`} />
        <circle cx="36" cy="36" r={R} fill="none" stroke={SS_COLOR[2]} strokeWidth={SW} strokeDasharray={`${shS} ${circ - shS}`} strokeDashoffset={`${-hS}`} />
        <circle cx="36" cy="36" r={R} fill="none" stroke={SS_COLOR[1]} strokeWidth={SW} strokeDasharray={`${hS} ${circ - hS}`} strokeDashoffset="0" />
        <text x="36" y="40" textAnchor="middle" fontSize="9" fill="#8eb4c7" fontFamily="'Segoe UI',sans-serif">{h}%</text>
        <text x="36" y="31" textAnchor="middle" fontSize="7" fill="#4a7fa5" fontFamily="'Segoe UI',sans-serif">α</text>
      </svg>
      <div className="bio-ss-legend">
        {[[SS_COLOR[1], "Helix", h], [SS_COLOR[2], "Sheet", sh], [SS_COLOR[0], "Coil", c]].map(([col, lbl, val]) => (
          <div key={lbl} className="bio-ss-leg-row"><span style={{ background: col }} />{val}% {lbl}</div>
        ))}
      </div>
    </div>
  );
};

// ─── NEW: Active Site Tooltip ─────────────────────────────────────────────────
const ActiveSiteTooltip = ({ site, onClose }) => {
  if (!site) return null;
  const color = SITE_COLORS[site.type] || SITE_COLORS.default;
  return (
    <div className="active-site-tooltip">
      <div className="ast-header">
        <span className="ast-dot" style={{ background: color }} />
        <span className="ast-type">{site.type}</span>
        <button className="ast-close" onClick={onClose}>✕</button>
      </div>
      {site.description && <div className="ast-desc">{site.description}</div>}
      <div className="ast-meta">
        {site.position != null && <span>Position: <strong>{site.position}</strong></span>}
        {site.ligand    && <span>Ligand: <strong>{site.ligand}</strong></span>}
      </div>
    </div>
  );
};

// ─── NEW: AlphaFold confidence legend ─────────────────────────────────────────
const PlddtLegend = () => (
  <div className="plddt-legend">
    {[
      { label: "Very high (>90)", color: "#5f8f7b" },
      { label: "Confident (70–90)", color: "#6f90b0" },
      { label: "Low (50–70)", color: "#b89257" },
      { label: "Very low (<50)", color: "#a97878" },
    ].map(({ label, color }) => (
      <div key={label} className="plddt-row">
        <span style={{ background: color }} />
        {label}
      </div>
    ))}
  </div>
);

// ─── BioInfoPanel ─────────────────────────────────────────────────────────────
function BioInfoPanel({ sequence, meta, currentPdb, uniprot, ssFrac, activeSites, onSiteClick }) {
  const calc = calcBioInfo(sequence);
  const [tab, setTab] = useState("physchem");
  const tabs = [
    { id: "physchem", label: "Physicochemical" },
    { id: "structure", label: "Structure" },
    { id: "function",  label: "Function" },
    { id: "domains",   label: "Domains" },
    { id: "sites",     label: `Sites${activeSites?.length ? ` (${activeSites.length})` : ""}` },
    { id: "comp",      label: "Composition" },
  ];

  return (
    <div className="bioinfo-panel">
      <h4>Bioinformatics Analysis</h4>
      <div className="bio-tabbar">
        {tabs.map(t => (
          <button key={t.id} className={`bio-tab${tab === t.id ? " bio-tab--active" : ""}`} onClick={() => setTab(t.id)}>
            {t.label}
          </button>
        ))}
      </div>

      {tab === "physchem" && (
        <div className="bio-content">
          {calc ? (
            <>
              <StatGrid cells={[
                { label: "Mol. Weight",    value: calc.mw,         unit: "kDa", sub: `${Math.round(calc.mwRaw).toLocaleString()} Da` },
                { label: "Length",         value: calc.len,        unit: "aa" },
                { label: "Isoelectric pt", value: calc.pI,         unit: "pH",
                  accent: parseFloat(calc.pI) > 7 ? "#c8a35b" : "#79a8ca",
                  sub: parseFloat(calc.pI) > 7 ? "Basic protein" : parseFloat(calc.pI) < 7 ? "Acidic protein" : "Neutral" },
                { label: "Charge at pH 7", value: (parseFloat(calc.chargeAt7) > 0 ? "+" : "") + calc.chargeAt7,
                  accent: parseFloat(calc.chargeAt7) > 0 ? "#c8a35b" : "#79a8ca" },
              ]} />
              <div className="bio-divider" />
              <MetricBar label="GRAVY Score (Kyte-Doolittle)" value={calc.gravy} rawValue={parseFloat(calc.gravy) + 4.5} max={9} color={parseFloat(calc.gravy) > 0 ? "#c8a35b" : "#79a8ca"} note={`${parseFloat(calc.gravy) > 0 ? "Hydrophobic" : "Hydrophilic"} overall tendency`} />
              <MetricBar label="Aliphatic Index (thermostability)" value={calc.aliphIdx} rawValue={parseFloat(calc.aliphIdx)} max={150} color="#82a993" note={`${parseFloat(calc.aliphIdx) > 80 ? "High thermostability" : parseFloat(calc.aliphIdx) > 50 ? "Moderate stability" : "Lower stability"} (Ikai 1980)`} />
              <MetricBar label="Instability Index" value={calc.instabilityIdx} rawValue={parseFloat(calc.instabilityIdx)} max={100} color={calc.isStable ? "#82a993" : "#c88c8c"} note={`${calc.isStable ? "✓ Predicted stable in vitro" : "⚠ Predicted unstable"} (Guruprasad 1990, cutoff: 40)`} />
              <div className="bio-divider" />
              <StatGrid cells={[
                { label: "ε₂₈₀ reduced",   value: calc.extCoeff, unit: "M⁻¹cm⁻¹", sub: "Extinction coefficient" },
                { label: "A₂₈₀ (0.1%)",    value: calc.absCoeff, unit: "g⁻¹Lcm⁻¹", sub: "Absorbance (Pace 1995)" },
                { label: "+ Charged res.", value: calc.posCharged, sub: "Arg + Lys + His", accent: "#c8a35b" },
                { label: "− Charged res.", value: calc.negCharged, sub: "Asp + Glu",       accent: "#79a8ca" },
              ]} />
              <div className="bio-divider" />
              <div className="bio-sublabel">N-terminal half-life — {calc.nTerm}– (N-end rule)</div>
              <div className="bio-halflife-grid">
                <div className="bio-hl-cell"><span>Mammalian</span><strong>{calc.halflife.mam}</strong></div>
                <div className="bio-hl-cell"><span>Yeast</span><strong>{calc.halflife.yeast}</strong></div>
                <div className="bio-hl-cell"><span>E. coli</span><strong>{calc.halflife.ecoli}</strong></div>
              </div>
              <div className="bio-footnote">Bachmair &amp; Varshavsky 1986 / Varshavsky 1992</div>
              {uniprot?.accession && (
                <a href={`https://www.uniprot.org/uniprot/${uniprot.accession}`} target="_blank" rel="noreferrer" className="bio-uniprot-link">
                  ↗ UniProt {uniprot.accession}
                </a>
              )}
            </>
          ) : <div className="bio-empty">Select a protein to compute statistics.</div>}
        </div>
      )}

      {tab === "structure" && (
        <div className="bio-content">
          {ssFrac ? (
            <>
              <div className="bio-sublabel" style={{ marginBottom: "10px" }}>Secondary structure from Cα trace</div>
              <div className="bio-ss-row">
                <SSDonut ssFrac={ssFrac} />
                <div className="bio-ss-bars">
                  <MetricBar label="α-Helix"    value={`${ssFrac.helix}%`} rawValue={parseFloat(ssFrac.helix)} max={100} color={SS_COLOR[1]} />
                  <MetricBar label="β-Sheet"    value={`${ssFrac.sheet}%`} rawValue={parseFloat(ssFrac.sheet)} max={100} color={SS_COLOR[2]} />
                  <MetricBar label="Coil / Loop" value={`${ssFrac.coil}%`}  rawValue={parseFloat(ssFrac.coil)}  max={100} color={SS_COLOR[0]} />
                </div>
              </div>
              <div className="bio-divider" />
              <StatGrid cells={[
                { label: "Resolution", value: meta?.resolution ?? "—", unit: "Å",
                  accent: meta?.resolution ? parseFloat(meta.resolution) < 2 ? "#82a993" : parseFloat(meta.resolution) < 3 ? "#c8a35b" : "#c88c8c" : undefined,
                  sub: meta?.resolution ? parseFloat(meta.resolution) < 2 ? "High quality" : parseFloat(meta.resolution) < 3 ? "Good quality" : "Moderate quality" : undefined },
                { label: "Exp. method", value: meta?.method?.split(" ")?.[0] ?? "—" },
                { label: "Chains",      value: meta?.chains ?? "—" },
                { label: "Total atoms", value: meta?.atoms  ?? "—" },
              ]} />
              {meta?.deposited && <div className="bio-footnote" style={{ marginTop: "8px" }}>PDB deposited: {meta.deposited}</div>}
            </>
          ) : <div className="bio-empty">No structure data loaded.</div>}
        </div>
      )}

      {tab === "function" && (
        <div className="bio-content">
          {uniprot?.function
            ? <div className="bio-func-text">{uniprot.function}</div>
            : <div className="bio-empty">No UniProt function annotation available.</div>}
          {uniprot?.subcell?.length > 0 && (<><div className="bio-sublabel" style={{ marginTop: "12px" }}>Subcellular location</div><div className="bio-tag-cloud">{uniprot.subcell.map((s, i) => <span key={i} className="bio-tag bio-tag--cyan">{s}</span>)}</div></>)}
          {uniprot?.cofactors?.length > 0 && (<><div className="bio-sublabel" style={{ marginTop: "10px" }}>Cofactors</div><div className="bio-tag-cloud">{uniprot.cofactors.map((c, i) => <span key={i} className="bio-tag bio-tag--yellow">{c}</span>)}</div></>)}
          {uniprot?.diseases?.length > 0  && (<><div className="bio-sublabel" style={{ marginTop: "10px" }}>Disease associations</div><div className="bio-tag-cloud">{uniprot.diseases.map((d, i) => <span key={i} className="bio-tag bio-tag--red">{d}</span>)}</div></>)}
          {uniprot?.keywords?.length > 0  && (<><div className="bio-sublabel" style={{ marginTop: "10px" }}>Keywords</div><div className="bio-tag-cloud">{uniprot.keywords.slice(0, 12).map((k, i) => <span key={i} className="bio-tag bio-tag--blue">{k}</span>)}</div></>)}
          {!uniprot && <div className="bio-empty" style={{ marginTop: "10px" }}>No UniProt entry found for this PDB ID.</div>}
        </div>
      )}

      {tab === "domains" && (
        <div className="bio-content">
          {uniprot?.domains?.length > 0
            ? <div className="bio-domain-list">{uniprot.domains.map((d, i) => (
                <div key={i} className="bio-domain-item">
                  <div className="bio-domain-type">{d.type}</div>
                  <div className="bio-domain-desc">{d.description}</div>
                  {d.start != null && <div className="bio-domain-pos"><span>pos {d.start}–{d.end}</span><span className="bio-domain-len">{d.end - d.start + 1} aa</span></div>}
                </div>
              ))}</div>
            : <div className="bio-empty">No domain annotations found.</div>}
          {uniprot?.organism && (
            <div className="bio-organism-block">
              <div className="bio-sublabel">Source organism</div>
              <div className="bio-organism-name">{uniprot.organism}</div>
              {uniprot.gene && <div className="bio-gene">Gene: <strong>{uniprot.gene}</strong></div>}
            </div>
          )}
        </div>
      )}

      {/* ── NEW: Sites tab ── */}
      {tab === "sites" && (
        <div className="bio-content">
          {activeSites?.length > 0 ? (
            <>
              <div className="bio-sublabel" style={{ marginBottom: "8px" }}>
                Click a site to highlight it on the structure
              </div>
              <div className="bio-site-list">
                {activeSites.map((site, i) => {
                  const color = SITE_COLORS[site.type] || SITE_COLORS.default;
                  return (
                    <div key={i} className="bio-site-item" onClick={() => onSiteClick(site)}
                      style={{ borderLeft: `3px solid ${color}` }}>
                      <div className="bio-site-header">
                        <span className="bio-site-type" style={{ color }}>{site.type}</span>
                        {site.position != null && <span className="bio-site-pos">res. {site.position}</span>}
                      </div>
                      {site.description && <div className="bio-site-desc">{site.description}</div>}
                      {site.ligand      && <div className="bio-site-ligand">Ligand: {site.ligand}</div>}
                    </div>
                  );
                })}
              </div>
              <div className="bio-footnote" style={{ marginTop: "10px" }}>Source: UniProt feature annotations</div>
            </>
          ) : (
            <div className="bio-empty">No active site / binding site annotations found for this entry.</div>
          )}
        </div>
      )}

      {tab === "comp" && (
        <div className="bio-content">
          {calc ? (
            <>
              <div className="bio-sublabel" style={{ marginBottom: "8px" }}>AA class breakdown</div>
              <ClassDonut classes={calc.classes} total={calc.len} />
              <div className="bio-divider" />
              <div className="bio-sublabel" style={{ marginBottom: "6px" }}>Residue frequency — all 20 canonical AAs</div>
              <CompositionChart composition={calc.composition} />
            </>
          ) : <div className="bio-empty">Load a protein to see composition.</div>}
        </div>
      )}
    </div>
  );
}

// ─── Custom PDB search (unchanged) ───────────────────────────────────────────
function CustomSearch({ onLoad }) {
  const [query, setQuery] = useState(""), [searching, setSearching] = useState(false), [err, setErr] = useState("");
  const submit = async () => {
    const id = query.trim().toUpperCase();
    if (!id || id.length < 4) { setErr("Enter a valid 4-character PDB ID."); return; }
    setErr(""); setSearching(true);
    try {
      const [metaRes, pdbText] = await Promise.all([
        fetch(RCSB_META(id)),
        fetch(RCSB_PDB(id)).then(r => r.text()),
      ]);
      if (!metaRes.ok) { setErr(`PDB entry "${id}" not found.`); setSearching(false); return; }
      onLoad(id, countAtoms(pdbText), pdbText);
    } catch { setErr("Network error. Check the PDB ID and try again."); }
    setSearching(false);
  };
  return (
    <div className="mv-section">
      <h4>Custom PDB Search</h4>
      <div className="mv-form">
        <input className="mv-input" value={query} onChange={e => setQuery(e.target.value.slice(0, 4).toUpperCase())}
          onKeyDown={e => e.key === "Enter" && submit()} placeholder="e.g. 2HHB" maxLength={4} spellCheck={false}
          style={{ letterSpacing: "0.15em", textTransform: "uppercase" }} />
        <button className="mv-btn" onClick={submit} disabled={searching}>{searching ? "…" : "Load"}</button>
      </div>
      {err && <div style={{ color: "#ff7b8a", fontSize: "0.78rem", marginTop: "5px" }}>{err}</div>}
      <p style={{ opacity: 0.45, fontSize: "0.75rem", margin: "4px 0 0" }}>Any 4-character RCSB PDB identifier</p>
    </div>
  );
}

// ─── Main viewer ──────────────────────────────────────────────────────────────
const ProteinViewer = () => {
  const canvasRef  = useRef(null);
  const dragRef    = useRef({ on: false, lx: 0, ly: 0 });
  // Central mutable render state (avoids React re-render on every RAF tick)
  const stateRef   = useRef({
    rx: 0.3, ry: 0.4, zoom: 1,
    atoms: [],          // current display atoms (lerped)
    nativeAtoms: [],    // original folded positions
    unfoldedXYZ: [],    // denatured XYZ (same length as nativeAtoms)
    center: [0, 0, 0],
    radius: 1,
    foldT: 0,           // 0 = fully folded, 1 = fully unfolded
    alphaFoldMode: false,
    uniprotAcc: "",
    activeSiteProjections: [], // [{sx,sy,depth,site}] rebuilt each frame
  });

  // React state (drives UI re-renders)
  const [currentPdb,     setCurrentPdb]     = useState("1MBN");
  const [loading,        setLoading]        = useState(false);
  const [afLoading,      setAfLoading]      = useState(false);
  const [error,          setError]          = useState(null);
  const [meta,           setMeta]           = useState(null);
  const [sequence,       setSequence]       = useState("");
  const [autoRotate,     setAutoRotate]     = useState(true);
  const [savedViews,     setSavedViews]     = useState(() => JSON.parse(localStorage.getItem("pvViews") || "[]"));
  const [viewName,       setViewName]       = useState("");
  const [advancedPrompt, setAdvancedPrompt] = useState(null);
  const [sizeWarning,    setSizeWarning]    = useState(null);
  const [uniprot,        setUniprot]        = useState(null);
  const [uniprotAcc,     setUniprotAcc]     = useState("");
  const [ssFrac,         setSSFrac]         = useState(null);
  const [activeSites,    setActiveSites]    = useState([]);   // ← NEW
  const [selectedSite,   setSelectedSite]   = useState(null); // ← NEW
  const [foldT,          setFoldT]          = useState(0);    // ← NEW: slider mirror
  const [alphaFoldMode,  setAlphaFoldMode]  = useState(false);// ← NEW
  const [afError,        setAfError]        = useState(null); // ← NEW

  // ── Draw ────────────────────────────────────────────────────────────────────
  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d"), W = canvas.width, H = canvas.height;
    ctx.clearRect(0, 0, W, H);
    const { rx, ry, zoom, atoms, center, radius, foldT: t, alphaFoldMode: afMode, activeSiteProjections } = stateRef.current;
    if (!atoms.length) return;

    const scale = (Math.min(W, H) / 2.3) * zoom / radius;
    const cx = W / 2, cy = H / 2;

    const proj = ([ax, ay, az]) => {
      const [dx, dy, dz]  = [ax - center[0], ay - center[1], az - center[2]];
      const [x1, y1, z1]  = rotY3([dx, dy, dz], ry);
      const [x2, y2, z2]  = rotX3([x1, y1, z1], rx);
      const fov            = 1 + z2 / (radius * 5);
      return { sx: cx + x2 * scale * fov, sy: cy - y2 * scale * fov, depth: z2 };
    };

    // Segment the atom chain (large gaps = chain breaks)
    const segs = []; let seg = [];
    atoms.forEach((a, i) => {
      const prev = atoms[i - 1];
      if (prev) {
        const d = Math.sqrt((a[0]-prev[0])**2 + (a[1]-prev[1])**2 + (a[2]-prev[2])**2);
        if (d > 6) { if (seg.length > 1) segs.push([...seg]); seg = []; }
      }
      seg.push(a);
    });
    if (seg.length > 1) segs.push(seg);

    // Build draw list with depth for painter's sort
    const drawList = segs.map(rawSeg => {
      const pts3      = rawSeg.map(a => [a[0], a[1], a[2]]);
      const smooth    = spline(pts3, 5);
      const projected = smooth.map(p => proj(p));
      return {
        projected,
        ssArr:    rawSeg.map(a => a[3]),
        plddtArr: rawSeg.map(a => a[5] || 0),
        rawLen:   rawSeg.length,
        avgDepth: projected.reduce((s, p) => s + p.depth, 0) / projected.length,
      };
    });
    drawList.sort((a, b) => a.avgDepth - b.avgDepth);

    // ── Ribbon ────────────────────────────────────────────────────────────────
    drawList.forEach(({ projected, ssArr, plddtArr, rawLen }) => {
      if (projected.length < 2) return;
      for (let i = 1; i < projected.length; i++) {
        const segT    = (i - 1) / (projected.length - 1);
        const rawIdx  = Math.min(Math.floor(segT * (rawLen - 1)), ssArr.length - 1);
        const ss      = ssArr[rawIdx] || 0;
        const plddt   = plddtArr[rawIdx] || 0;
        const p0      = projected[i - 1], p1 = projected[i];
        const avgD    = (p0.depth + p1.depth) / 2;
        const fog     = Math.max(0, Math.min(1, (avgD / radius + 1) / 2));

        // At high foldT, coil everything to gray
        const ssForColor = t > 0.6 ? 0 : ss;
        const color       = afMode ? plddtColor(plddt) : SS_COLOR[ssForColor];
        const alpha       = 0.35 + fog * 0.65;
        const w           = SS_WIDTH[ss] * (0.65 + fog * 0.55);

        if (ss === 1 && t < 0.5) {
          ctx.beginPath(); ctx.moveTo(p0.sx, p0.sy); ctx.lineTo(p1.sx, p1.sy);
          ctx.strokeStyle = hexRgba("#a8d4ff", alpha * 0.25 * (1 - t * 2));
          ctx.lineWidth = w + 5; ctx.lineCap = "round"; ctx.stroke();
        }
        ctx.beginPath(); ctx.moveTo(p0.sx, p0.sy); ctx.lineTo(p1.sx, p1.sy);
        ctx.strokeStyle = hexRgba(color, alpha); ctx.lineWidth = w;
        ctx.lineCap = "round"; ctx.lineJoin = "round"; ctx.stroke();
      }
    });

    // ── Cα dots ───────────────────────────────────────────────────────────────
    const step = Math.max(1, Math.floor(atoms.length / 180));
    atoms.forEach(([ax, ay, az, ss, , plddt], i) => {
      if (i % step !== 0) return;
      const { sx, sy, depth } = proj([ax, ay, az]);
      const fog  = Math.max(0, Math.min(1, (depth / radius + 1) / 2));
      const ssV  = t > 0.6 ? 0 : ss;
      const color = afMode ? plddtColor(plddt || 0) : SS_COLOR[ssV];
      const r    = (ss === 1 ? 3.5 : ss === 2 ? 3 : 2) * (0.55 + fog * 0.5);
      ctx.beginPath(); ctx.arc(sx, sy, r, 0, Math.PI * 2);
      ctx.fillStyle = hexRgba(color, 0.45 + fog * 0.45); ctx.fill();
    });

    // ── Active site rings (projected, depth-sorted) ───────────────────────────
    const residueMap = stateRef.current.residueMap || {};
    const newProjections = [];
    if (activeSiteProjections !== undefined) {
      // Rebuild projections this frame
      activeSites.forEach(site => {
        if (site.position == null) return;
        const atomIdx = residueMap[site.position];
        if (atomIdx == null) return;
        const a = atoms[atomIdx];
        if (!a) return;
        const { sx, sy, depth } = proj([a[0], a[1], a[2]]);
        newProjections.push({ sx, sy, depth, site });
      });
      newProjections.sort((a, b) => a.depth - b.depth);
      stateRef.current.activeSiteProjections = newProjections;
    }

    // Draw rings back-to-front
    newProjections.forEach(({ sx, sy, depth, site }) => {
      const fog   = Math.max(0, Math.min(1, (depth / radius + 1) / 2));
      const color = SITE_COLORS[site.type] || SITE_COLORS.default;
      const isSelected = selectedSite === site;
      const r = isSelected ? 11 : 8;

      // Outer glow ring for selected
      if (isSelected) {
        ctx.beginPath(); ctx.arc(sx, sy, 15, 0, Math.PI * 2);
        ctx.strokeStyle = hexRgba(color, 0.25); ctx.lineWidth = 6; ctx.stroke();
      }
      // Main ring
      ctx.beginPath(); ctx.arc(sx, sy, r, 0, Math.PI * 2);
      ctx.strokeStyle = hexRgba(color, 0.55 + fog * 0.4);
      ctx.lineWidth = isSelected ? 2.5 : 1.5; ctx.stroke();
      // Fill dot
      ctx.beginPath(); ctx.arc(sx, sy, 3, 0, Math.PI * 2);
      ctx.fillStyle = hexRgba(color, 0.8 + fog * 0.2); ctx.fill();
    });

    // ── Legend ────────────────────────────────────────────────────────────────
    if (afMode) {
      // pLDDT legend
      [
        { label: ">90", color: "#5f8f7b" },
        { label: "70–90", color: "#79a8ca" },
        { label: "50–70", color: "#c8a35b" },
        { label: "<50",  color: "#c88c8c" },
      ].forEach(({ label, color }, li) => {
        const lx = 12 + li * 72, ly = H - 12;
        ctx.fillStyle = color; ctx.fillRect(lx, ly - 9, 14, 9);
        ctx.fillStyle = "#aab8c8"; ctx.font = "10px 'Segoe UI',sans-serif"; ctx.fillText(label, lx + 17, ly);
      });
      ctx.fillStyle = "#6a7a8a"; ctx.font = "9px 'Segoe UI',sans-serif"; ctx.fillText("pLDDT", 12, H - 15);
    } else {
      [["α-Helix", SS_COLOR[1]], ["β-Sheet", SS_COLOR[2]], ["Coil", SS_COLOR[0]]].forEach(([lbl, col], li) => {
        const lx = 12 + li * 76, ly = H - 12;
        ctx.fillStyle = col; ctx.fillRect(lx, ly - 9, 14, 9);
        ctx.fillStyle = "#aab8c8"; ctx.font = "10px 'Segoe UI',sans-serif"; ctx.fillText(lbl, lx + 17, ly);
      });
    }

    // Fold indicator
    if (t > 0.01) {
      ctx.fillStyle = "rgba(240,165,0,0.85)";
      ctx.font = "11px 'Segoe UI',sans-serif";
      ctx.fillText(`Unfolding: ${Math.round(t * 100)}%`, W - 110, 18);
    }
  }, [activeSites, selectedSite]);

  // ── RAF loop ──────────────────────────────────────────────────────────────
  useEffect(() => {
    let raf;
    const loop = () => {
      if (autoRotate && !dragRef.current.on) stateRef.current.ry += 0.005;
      if (!advancedPrompt && !sizeWarning) draw();
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, [autoRotate, draw, advancedPrompt, sizeWarning]);

  // ── Resize observer ───────────────────────────────────────────────────────
  useEffect(() => {
    const resize = () => { const c = canvasRef.current; if (!c) return; c.width = c.offsetWidth; c.height = c.offsetHeight; };
    resize();
    let rafId;
    const deb = () => { cancelAnimationFrame(rafId); rafId = requestAnimationFrame(resize); };
    const ro = new ResizeObserver(deb);
    if (canvasRef.current) ro.observe(canvasRef.current);
    return () => { ro.disconnect(); cancelAnimationFrame(rafId); };
  }, []);

  // ── Mouse: drag + wheel + active site click ───────────────────────────────
  useEffect(() => {
    const c = canvasRef.current;
    if (!c) return;

    const down = e => { dragRef.current = { on: true, lx: e.clientX, ly: e.clientY }; };
    const move = e => {
      if (!dragRef.current.on) return;
      stateRef.current.ry += (e.clientX - dragRef.current.lx) * 0.007;
      stateRef.current.rx += (e.clientY - dragRef.current.ly) * 0.007;
      dragRef.current.lx = e.clientX;
      dragRef.current.ly = e.clientY;
    };
    const up = e => {
      // If the mouse barely moved, treat as a click → hit-test active sites
      if (dragRef.current.on) {
        const dx = Math.abs(e.clientX - dragRef.current.lx);
        const dy = Math.abs(e.clientY - dragRef.current.ly);
        if (dx < 4 && dy < 4) {
          const rect = c.getBoundingClientRect();
          const mx   = e.clientX - rect.left;
          const my   = e.clientY - rect.top;
          const projs = stateRef.current.activeSiteProjections || [];
          let hit = null, bestD = Infinity;
          projs.forEach(p => {
            const d = Math.sqrt((mx - p.sx) ** 2 + (my - p.sy) ** 2);
            if (d < 18 && d < bestD) { bestD = d; hit = p.site; }
          });
          if (hit) setSelectedSite(prev => prev === hit ? null : hit);
        }
      }
      dragRef.current.on = false;
    };
    const wheel = e => {
      e.preventDefault();
      stateRef.current.zoom = Math.max(0.3, Math.min(4.5, stateRef.current.zoom - e.deltaY * 0.001));
    };

    c.addEventListener("mousedown", down);
    window.addEventListener("mousemove", move);
    window.addEventListener("mouseup", up);
    c.addEventListener("wheel", wheel, { passive: false });
    return () => {
      c.removeEventListener("mousedown", down);
      window.removeEventListener("mousemove", move);
      window.removeEventListener("mouseup", up);
      c.removeEventListener("wheel", wheel);
    };
  }, []); // no deps — accesses projections through stateRef

  // ── Sync foldT slider → stateRef + lerp atoms ────────────────────────────
  useEffect(() => {
    stateRef.current.foldT = foldT;
    // When fully folded, restore native atoms exactly — no lerp needed
    if (foldT === 0) {
      const na = stateRef.current.nativeAtoms;
      if (na && na.length) stateRef.current.atoms = na;
      return;
    }
    const { nativeAtoms, unfoldedXYZ } = stateRef.current;
    if (!nativeAtoms || !nativeAtoms.length || !unfoldedXYZ || !unfoldedXYZ.length) return;
    const t = foldT;
    stateRef.current.atoms = nativeAtoms.map((a, i) => {
      const u = unfoldedXYZ[i];
      if (!u) return a;
      return [
        lerp(a[0], u[0], t),
        lerp(a[1], u[1], t),
        lerp(a[2], u[2], t),
        a[3], a[4], a[5],
      ];
    });
  }, [foldT]);

  // ── Sync alphaFoldMode → stateRef ─────────────────────────────────────────
  useEffect(() => { stateRef.current.alphaFoldMode = alphaFoldMode; }, [alphaFoldMode]);

  // ── UniProt fetch (extended with active sites) ────────────────────────────
  const fetchUniprot = useCallback(async (pdb) => {
    setUniprot(null);
    setActiveSites([]);
    setSelectedSite(null);
    try {
      const res = await fetch(UNIPROT_SEARCH(pdb));
      if (!res.ok) return;
      const data  = await res.json();
      const entry = data.results?.[0];
      if (!entry) return;

      const fn       = entry.comments?.find(c => c.commentType === "FUNCTION")?.texts?.[0]?.value || null;
      const diseases = entry.comments?.filter(c => c.commentType === "DISEASE")?.map(c => c.disease?.diseaseName?.value)?.filter(Boolean) || [];
      const domains  = entry.features?.filter(f => ["Domain","Repeat","Motif","Region"].includes(f.type))?.slice(0, 10)?.map(f => ({ type: f.type, description: f.description || f.type, start: f.location?.start?.value, end: f.location?.end?.value })) || [];
      const keywords = entry.keywords?.map(k => k.name) || [];
      const organism = entry.organism?.scientificName || null;
      const gene     = entry.genes?.[0]?.geneName?.value || null;
      const subcell  = entry.comments?.filter(c => c.commentType === "SUBCELLULAR LOCATION")?.flatMap(c => c.subcellularLocations?.map(s => s.location?.value))?.filter(Boolean) || [];
      const cofactors= entry.comments?.filter(c => c.commentType === "COFACTOR")?.flatMap(c => c.cofactors?.map(cf => cf.name))?.filter(Boolean) || [];

      // ── Active / binding / other sites ─────────────────────────────────
      const siteFeatures = entry.features?.filter(f =>
        ["Active site", "Binding site", "Site"].includes(f.type)
      ) || [];
      const parsedSites = siteFeatures.map(f => ({
        type:        f.type,
        description: f.description || null,
        position:    f.location?.start?.value ?? null,
        // Some binding sites carry a ligand name in evidences or description
        ligand:      f.ligand?.name || null,
      }));
      setActiveSites(parsedSites);

      const accession = entry.primaryAccession;
      setUniprotAcc(accession);
      stateRef.current.uniprotAcc = accession;
      setUniprot({ accession, function: fn, diseases, domains, keywords, organism, gene, subcell, cofactors });

      // Return accession for AlphaFold follow-up
      return accession;
    } catch {}
  }, []);

  // ── NEW: AlphaFold fetch ──────────────────────────────────────────────────
  const fetchAlphaFold = useCallback(async (requestedAcc) => {
    const accession = (requestedAcc || uniprotAcc || stateRef.current.uniprotAcc || "").trim();
    if (!accession) {
      setAfError("No UniProt accession available for AlphaFold lookup.");
      return;
    }

    setAfLoading(true);
    setAfError(null);
    try {
      const res = await fetch(AF_API(accession));
      if (!res.ok) throw new Error("AlphaFold entry not found");
      const data = await res.json();
      const entry = Array.isArray(data) ? data[0] : data;
      const pdbUrl =
        entry?.pdbUrl ||
        entry?.cifUrl ||
        entry?.bcifUrl ||
        entry?.modelUrl ||
        entry?.pdb_url;

      if (!pdbUrl) throw new Error("No structure URL in AlphaFold response");

      const pdbText = await fetch(pdbUrl).then(r => r.text());
      const afAtoms = parsePDB(pdbText);
      if (!afAtoms.length) throw new Error("No Cα atoms in AlphaFold PDB");

      const c = centroid(afAtoms), r = maxR(afAtoms, c);
      const unfolded = generateUnfolded(afAtoms);

      // Field-by-field to avoid race with foldT effect
      stateRef.current.atoms = afAtoms;
      stateRef.current.nativeAtoms = afAtoms;
      stateRef.current.unfoldedXYZ = unfolded;
      stateRef.current.center = c;
      stateRef.current.radius = r;
      stateRef.current.residueMap = buildResidueMap(afAtoms);
      stateRef.current.foldT = 0;
      stateRef.current.alphaFoldMode = true;
      stateRef.current.uniprotAcc = accession;

      // setFoldT AFTER stateRef is populated so the foldT=0 effect sees nativeAtoms
      setFoldT(0);
      setAlphaFoldMode(true);
      setSSFrac(calcSSFraction(afAtoms));
      setUniprotAcc(accession);
    } catch (e) {
      setAfError(e.message || "AlphaFold fetch failed.");
    } finally {
      setAfLoading(false);
    }
  }, [uniprotAcc]);

  // ── Core load ─────────────────────────────────────────────────────────────
  const loadProtein = useCallback(async (pdb, preloadedPdbText) => {
    setLoading(true); setError(null); setMeta(null); setSequence("");
    setCurrentPdb(pdb); setSSFrac(null); setAlphaFoldMode(false);
    setAfError(null); setSelectedSite(null); setFoldT(0);
    setUniprotAcc("");
    // Clear stale accession immediately so AlphaFold button doesn't fire with wrong acc
    stateRef.current.uniprotAcc = "";

    const [metaRes, pdbRes, entityRes] = await Promise.allSettled([
      fetch(RCSB_META(pdb)).then(r => r.json()),
      preloadedPdbText ? Promise.resolve(preloadedPdbText) : fetch(RCSB_PDB(pdb)).then(r => r.text()),
      fetch(RCSB_ENTITY(pdb)).then(r => r.json()),
    ]);

    if (metaRes.status === "fulfilled") {
      const d = metaRes.value;
      setMeta({
        title:     d.struct?.title || pdb,
        method:    d.exptl?.[0]?.method || "—",
        resolution: d.refine?.[0]?.ls_d_res_high?.toFixed(2) ?? d.em_3d_reconstruction?.[0]?.resolution?.toFixed(2) ?? "—",
        deposited:  d.rcsb_accession_info?.initial_release_date?.split("T")[0] || "—",
        atoms:      d.rcsb_entry_info?.deposited_atom_count?.toLocaleString() || "—",
        keywords:   d.struct_keywords?.pdbx_keywords || "—",
        chains:     d.rcsb_entry_info?.polymer_entity_count || "—",
      });
    }
    if (entityRes.status === "fulfilled") setSequence(entityRes.value?.entity_poly?.pdbx_seq_one_letter_code_can || "");

    const pdbText = pdbRes.status === "fulfilled" ? pdbRes.value : null;
    const atoms   = pdbText && pdbText.includes("ATOM") ? parsePDB(pdbText) : buildFallback(pdb);
    if (!atoms.length) { setError("No Cα atoms found."); setLoading(false); return; }

    const c        = centroid(atoms), r = maxR(atoms, c);
    const unfolded = generateUnfolded(atoms);

    // Set all atom state atomically. Do NOT use spread — assign individual fields
    // so a concurrent foldT=0 effect sees a consistent snapshot.
    stateRef.current.atoms              = atoms;
    stateRef.current.nativeAtoms        = atoms;
    stateRef.current.unfoldedXYZ        = unfolded;
    stateRef.current.center             = c;
    stateRef.current.radius             = r;
    stateRef.current.residueMap         = buildResidueMap(atoms);
    stateRef.current.rx                 = 0.3;
    stateRef.current.ry                 = 0.4;
    stateRef.current.foldT              = 0;
    stateRef.current.alphaFoldMode      = false;
    stateRef.current.activeSiteProjections = [];

    setSSFrac(calcSSFraction(atoms));
    setLoading(false);

    // fetchUniprot is fire-and-forget for UI but we await the returned accession
    const acc = await fetchUniprot(pdb);
    stateRef.current.uniprotAcc = acc || null;
  }, [fetchUniprot]);

  const handleCustomLoad = useCallback((id, atomCount, pdbText) => {
    if (atomCount > BLOCK_THRESHOLD) setSizeWarning({ id, atomCount, pdbText, level: "large" });
    else if (atomCount > WARN_THRESHOLD) setSizeWarning({ id, atomCount, pdbText, level: "warn" });
    else loadProtein(id, pdbText);
  }, [loadProtein]);

  const confirmSizeWarning = useCallback(() => {
    if (!sizeWarning) return;
    loadProtein(sizeWarning.id, sizeWarning.pdbText);
    setSizeWarning(null);
  }, [sizeWarning, loadProtein]);

  // Saved views
  const saveView = () => {
    if (!viewName.trim()) return;
    const v = { id: Date.now(), name: viewName.trim(), pdb: currentPdb, rx: stateRef.current.rx, ry: stateRef.current.ry, zoom: stateRef.current.zoom, date: new Date().toLocaleDateString() };
    const updated = [...savedViews, v];
    setSavedViews(updated); localStorage.setItem("pvViews", JSON.stringify(updated)); setViewName("");
  };
  const restoreView = v => { loadProtein(v.pdb).then(() => { stateRef.current.rx = v.rx; stateRef.current.ry = v.ry; stateRef.current.zoom = v.zoom; }); };
  const deleteView  = id => { const updated = savedViews.filter(v => v.id !== id); setSavedViews(updated); localStorage.setItem("pvViews", JSON.stringify(updated)); };

  useEffect(() => { loadProtein("1MBN"); }, [loadProtein]);

  const info = PROTEINS[currentPdb];

  return (
    <div className="pv-root">
      {/* ── Left sidebar ─────────────────────────────────────────────────── */}
      <aside className="mv-controls">
        <div className="mv-section">
          <h4>Proteins</h4>
          <div className="mv-molecules">
            {Object.entries(PROTEINS).map(([pdb, p]) => (
              <button key={pdb} className={`mv-mol-btn${currentPdb === pdb ? " active" : ""}`}
                onClick={() => p.tier === "advanced" ? setAdvancedPrompt(pdb) : loadProtein(pdb)}>
                {p.label}{p.tier === "advanced" && " ⚠"}
              </button>
            ))}
          </div>
        </div>

        <CustomSearch onLoad={handleCustomLoad} />

        {/* ── NEW: Fold / Unfold slider ─────────────────────────────────── */}
        <div className="mv-section">
          <h4>Fold / Unfold</h4>
          <div className="fold-slider-wrap">
            <span className="fold-label">Folded</span>
            <input type="range" min="0" max="100" value={Math.round(foldT * 100)}
              className="fold-slider"
              onChange={e => setFoldT(parseFloat(e.target.value) / 100)} />
            <span className="fold-label">Unfolded</span>
          </div>
          <div className="fold-readout">{Math.round(foldT * 100)}% unfolded</div>
          <div className="fold-btns">
            <button className="mv-btn fold-preset" onClick={() => setFoldT(0)}>↺ Fold</button>
            <button className="mv-btn fold-preset" onClick={() => setFoldT(1)}>⤢ Unfold</button>
          </div>
          <p style={{ opacity: 0.45, fontSize: "0.75rem", margin: "6px 0 0" }}>
            Drag to animate denaturation. SS-aware geometry.
          </p>
        </div>

        {/* ── NEW: AlphaFold toggle ─────────────────────────────────────── */}
        <div className="mv-section">
          <h4>AlphaFold</h4>
          {alphaFoldMode
            ? (
              <div className="af-active-wrap">
                <div className="af-badge">AF2 active · pLDDT coloring</div>
                <PlddtLegend />
                <button className="mv-btn" style={{ marginTop: "8px" }}
                  onClick={() => {
                    setAlphaFoldMode(false);
                    // Restore RCSB atoms
                    const na = stateRef.current.nativeAtoms;
                    if (na.length) {
                      const c = centroid(na), r = maxR(na, c);
                      stateRef.current = { ...stateRef.current, atoms: na, center: c, radius: r };
                    }
                  }}>
                  ← Back to RCSB
                </button>
              </div>
            )
            : (
              <>
                <button className="mv-btn af-btn"
                  disabled={afLoading || !uniprotAcc}
                  onClick={() => fetchAlphaFold(uniprotAcc)}>
                  {afLoading ? "Loading…" : "Load AlphaFold structure"}
                </button>
                {afError && <div className="af-error">{afError}</div>}
                <p style={{ opacity: 0.45, fontSize: "0.75rem", margin: "6px 0 0" }}>
                  Loads predicted structure from EBI. Colors ribbon by pLDDT confidence.
                </p>
              </>
            )
          }
        </div>

        <div className="mv-section">
          <h4>Viewer</h4>
          <p className="pv-hint">Drag to rotate · Scroll to zoom · Click site rings</p>
        </div>

        {sequence && (
          <div className="mv-section">
            <h4>Sequence (Chain A · {sequence.length} aa)</h4>
            <div className="pv-seq">{sequence.match(/.{1,10}/g)?.join(" ")}</div>
          </div>
        )}

        <div className="mv-section">
          <h4>Save View</h4>
          <div className="mv-form">
            <input type="text" value={viewName} onChange={e => setViewName(e.target.value)}
              onKeyDown={e => e.key === "Enter" && saveView()} placeholder="View name" className="mv-input" />
            <button onClick={saveView} className="mv-btn">Save</button>
          </div>
        </div>

        <div className="mv-section">
          <h4>Saved Views ({savedViews.length})</h4>
          <div className="mv-views">
            {savedViews.length === 0
              ? <p style={{ opacity: 0.6, fontSize: "0.9em" }}>No saved views</p>
              : savedViews.map(v => (
                <div key={v.id} className="mv-view-item">
                  <div>
                    <strong>{v.name}</strong>
                    <div style={{ fontSize: "0.8em", opacity: 0.7 }}>{PROTEINS[v.pdb]?.label || v.pdb} · {v.date}</div>
                  </div>
                  <div className="mv-view-actions">
                    <button className="mv-vbtn" onClick={() => restoreView(v)}>Load</button>
                    <button className="mv-vbtn mv-vbtn-del" onClick={() => deleteView(v.id)}>Delete</button>
                  </div>
                </div>
              ))}
          </div>
        </div>
      </aside>

      {/* ── Canvas stage ──────────────────────────────────────────────────── */}
      <main className="pv-stage">
        <div className="mv-canvas-container pv-canvas-wrap">
          <canvas ref={canvasRef} className="mv-canvas pv-canvas" />

          {loading && <div className="pv-overlay"><div className="pv-spinner" /><span>Fetching {currentPdb} from RCSB…</span></div>}
          {error   && <div className="pv-overlay pv-err">{error}</div>}

          {advancedPrompt && (
            <div className="pv-overlay pv-advanced">
              <div className="pv-advanced-box">
                <h3>Advanced Protein</h3>
                <p>{PROTEINS[advancedPrompt]?.label} is a large structure that may render slowly on weaker devices.</p>
                <div className="pv-advanced-actions">
                  <button className="mv-btn" onClick={() => { loadProtein(advancedPrompt); setAdvancedPrompt(null); }}>Render Anyway</button>
                  <button className="mv-btn mv-btn-secondary" onClick={() => setAdvancedPrompt(null)}>Cancel</button>
                </div>
              </div>
            </div>
          )}

          {sizeWarning && (
            <div className="pv-overlay pv-advanced">
              <div className="pv-advanced-box">
                <h3 style={{ color: sizeWarning.level === "large" ? "#ff7b8a" : "#c8a35b" }}>
                  {sizeWarning.level === "large" ? "⛔ Very Large Structure" : "⚠ Large Structure"}
                </h3>
                <p>
                  <strong>{sizeWarning.id}</strong> contains <strong>{sizeWarning.atomCount.toLocaleString()} ATOM records</strong>.<br />
                  {sizeWarning.level === "large" ? "This may severely impact browser performance or cause a crash." : "This may render slowly — you can still proceed."}
                </p>
                <div className="pv-advanced-actions">
                  <button className="mv-btn" onClick={confirmSizeWarning}>{sizeWarning.level === "large" ? "Load Anyway (risky)" : "Load Anyway"}</button>
                  <button className="mv-btn mv-btn-secondary" onClick={() => setSizeWarning(null)}>Cancel</button>
                </div>
              </div>
            </div>
          )}

          {/* ── NEW: Active site tooltip overlay ───────────────────────── */}
          {selectedSite && (
            <div className="ast-wrap">
              <ActiveSiteTooltip site={selectedSite} onClose={() => setSelectedSite(null)} />
            </div>
          )}

          <div className="pv-canvas-btns">
            <button className={`pv-ctrl${autoRotate ? " pv-ctrl--active" : ""}`} onClick={() => setAutoRotate(v => !v)}>
              {autoRotate ? "⏸" : "▶"}
            </button>
            <button className="pv-ctrl" title="Reset view" onClick={() => { stateRef.current.rx = 0.3; stateRef.current.ry = 0.4; stateRef.current.zoom = 1; }}>↺</button>
          </div>
        </div>

        {/* ── Meta strip ──────────────────────────────────────────────────── */}
        <div className="pv-meta-strip">
          {meta ? (
            <>
              <div className="pv-meta-title">
                <h3>
                  {info?.label || currentPdb}
                  <span className="pv-badge">{currentPdb}</span>
                  {alphaFoldMode && <span className="pv-badge pv-badge--af">AlphaFold</span>}
                </h3>
                <div className="pv-meta-line">{info?.class} · {info?.bio || meta.title || "Protein structure"}</div>
                <div className="pv-meta-line" style={{ marginTop: 8 }}>
                  {info && <span><strong>Class:</strong> {info.class}</span>}
                  {uniprot?.gene && <span style={{ marginLeft: 10 }}><strong>Gene:</strong> {uniprot.gene}</span>}
                </div>
                <div className="pv-meta-line" style={{ marginTop: 6 }}><strong>Function:</strong> {info?.bio || meta.title}</div>
              </div>

              <div className="pv-meta-stats">
                <div className="pv-meta-chip">Method: {alphaFoldMode ? "AlphaFold2" : meta.method}</div>
                <div className="pv-meta-chip">Resolution: {alphaFoldMode ? "predicted" : `${meta.resolution} Å`}</div>
                <div className="pv-meta-chip">Chains: {meta.chains}</div>
                <div className="pv-meta-chip">Atoms: {meta.atoms}</div>
                {activeSites.length > 0 && (
                  <div className="pv-meta-chip pv-meta-chip--sites">
                    {activeSites.length} functional site{activeSites.length !== 1 ? "s" : ""}
                  </div>
                )}
              </div>

              <div className="pv-meta-legend">
                <div className="pv-meta-legend-title">{alphaFoldMode ? "pLDDT confidence" : "Secondary structure"}</div>
                {alphaFoldMode ? (
                  [["#5f8f7b",">90 very high"],["#79a8ca","70–90 confident"],["#c8a35b","50–70 low"],["#c88c8c","<50 very low"]].map(([c, l]) => (
                    <div key={l} className="pv-meta-legend-row"><span className="pv-swatch" style={{ background: c }} /><span>{l}</span></div>
                  ))
                ) : (
                  [[SS_COLOR[1],"α-Helix"],[SS_COLOR[2],"β-Sheet"],[SS_COLOR[0],"Coil / Loop"]].map(([c, l]) => (
                    <div key={l} className="pv-meta-legend-row"><span className="pv-swatch" style={{ background: c }} /><span>{l}</span></div>
                  ))
                )}
                {activeSites.length > 0 && (
                  <>
                    <div className="pv-meta-legend-title" style={{ marginTop: "8px" }}>Active sites</div>
                    {Object.entries(SITE_COLORS).filter(([k]) => k !== "default").map(([type, color]) => {
                      const count = activeSites.filter(s => s.type === type).length;
                      return count > 0 ? (
                        <div key={type} className="pv-meta-legend-row">
                          <span className="pv-swatch" style={{ background: color }} />
                          <span>{type} ({count})</span>
                        </div>
                      ) : null;
                    })}
                  </>
                )}
              </div>
            </>
          ) : (
            <p style={{ opacity: 0.5, fontSize: "0.85em", margin: 0 }}>Select a protein →</p>
          )}
        </div>
      </main>

      {/* ── Right bioinfo panel ──────────────────────────────────────────── */}
      <aside className="bioinfo-panel">
        <BioInfoPanel
          sequence={sequence}
          meta={meta}
          currentPdb={currentPdb}
          uniprot={uniprot}
          ssFrac={ssFrac}
          activeSites={activeSites}
          onSiteClick={site => {
            setSelectedSite(site);
            // If site has no resSeq match, still show tooltip
          }}
        />
      </aside>
    </div>
  );
};

export default ProteinViewer;  