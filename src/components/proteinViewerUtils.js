import {
  AA_MASS,
  DIWV_DESTAB,
  HALFLIFE,
  KD,
  PKA,
} from "./proteinViewerData.js";

const WATER_MASS = 18.02;
const DEFAULT_RESIDUE_MASS = 111;
const MIN_PH = 0;
const MAX_PH = 14;
const PI_ITERATIONS = 150;

const POSITIVE_PKAS = {
  H: PKA.H,
  K: PKA.K,
  R: PKA.R,
};

const NEGATIVE_PKAS = {
  D: PKA.D,
  E: PKA.E,
  C: PKA.C,
  Y: PKA.Y,
};

const DEFAULT_HALFLIFE = {
  mam: "?",
  yeast: "?",
  ecoli: "?",
};

/**
 * Normalize a protein sequence to the 20 canonical amino acids.
 */
function normalizeSequence(sequence) {
  return sequence
    .toUpperCase()
    .replace(/[^ACDEFGHIKLMNPQRSTVWY]/g, "");
}

/**
 * Count each amino acid in a sequence.
 */
function countAminoAcids(sequence) {
  const counts = {};

  for (const aa of sequence) {
    counts[aa] = (counts[aa] || 0) + 1;
  }

  return counts;
}

/**
 * Calculate molecular weight in Daltons.
 *
 * Residue masses are summed and water is removed for each peptide bond.
 */
function calculateMolecularWeight(sequence) {
  const residueMass = sequence.split("").reduce(
    (sum, aa) => sum + (AA_MASS[aa] || DEFAULT_RESIDUE_MASS),
    0
  );

  const waterLoss = WATER_MASS * (sequence.length - 1);

  return residueMass - waterLoss;
}

/**
 * Calculate the Kyte-Doolittle GRAVY score.
 */
function calculateGravy(sequence) {
  const totalHydropathy = sequence.split("").reduce(
    (sum, aa) => sum + (KD[aa] || 0),
    0
  );

  return totalHydropathy / sequence.length;
}

/**
 * Calculate net charge at a given pH using the Henderson-Hasselbalch
 * relationships represented by the pKa values in proteinViewerData.js.
 */
function calculateCharge(counts, pH) {
  let charge =
    1 / (1 + 10 ** (pH - PKA.Nterm)) -
    1 / (1 + 10 ** (PKA.Cterm - pH));

  for (const [aa, pKa] of Object.entries(POSITIVE_PKAS)) {
    const count = counts[aa] || 0;

    charge += count / (1 + 10 ** (pH - pKa));
  }

  for (const [aa, pKa] of Object.entries(NEGATIVE_PKAS)) {
    const count = counts[aa] || 0;

    charge -= count / (1 + 10 ** (pKa - pH));
  }

  return charge;
}

/**
 * Find the isoelectric point by locating the pH where net charge
 * crosses zero.
 *
 * Bisection is used because the charge equation does not have
 * a convenient closed-form solution.
 */
function calculateIsoelectricPoint(counts) {
  let low = MIN_PH;
  let high = MAX_PH;

  for (let i = 0; i < PI_ITERATIONS; i++) {
    const mid = (low + high) / 2;

    if (calculateCharge(counts, mid) > 0) {
      low = mid;
    } else {
      high = mid;
    }
  }

  return (low + high) / 2;
}

/**
 * Count destabilizing dipeptides used by the instability index.
 */
function countDestabilizingDipeptides(sequence) {
  let count = 0;

  for (let i = 0; i < sequence.length - 1; i++) {
    const dipeptide = sequence[i] + sequence[i + 1];

    if (DIWV_DESTAB.has(dipeptide)) {
      count++;
    }
  }

  return count;
}

/**
 * Calculate the instability index percentage.
 */
function calculateInstabilityIndex(sequence) {
  if (sequence.length < 2) {
    return 0;
  }

  const destabilizingCount =
    countDestabilizingDipeptides(sequence);

  const dipeptideCount = sequence.length - 1;

  return (destabilizingCount / dipeptideCount) * 100;
}

/**
 * Calculate the aliphatic index.
 */
function calculateAliphaticIndex(counts, length) {
  const value =
    (counts.A || 0) +
    2.9 * (counts.V || 0) +
    3.9 * ((counts.I || 0) + (counts.L || 0));

  return (value / length) * 100;
}

/**
 * Calculate the molar extinction coefficient at 280 nm.
 */
function calculateExtinctionCoefficient(counts) {
  return (
    5500 * (counts.W || 0) +
    1490 * (counts.Y || 0) +
    125 * (counts.C || 0)
  );
}

/**
 * Convert amino-acid counts into a frequency-sorted composition array.
 */
function calculateComposition(counts, length) {
  return Object.entries(counts)
    .sort((a, b) => b[1] - a[1])
    .map(([aa, count]) => ({
      aa,
      count,
      pct: ((count / length) * 100).toFixed(1),
    }));
}

/**
 * Group residues into the categories used by the composition donut.
 */
function calculateResidueClasses(counts) {
  const positiveCharged =
    (counts.R || 0) +
    (counts.K || 0) +
    (counts.H || 0);

  const negativeCharged =
    (counts.D || 0) +
    (counts.E || 0);

  return {
    aromatic:
      (counts.F || 0) +
      (counts.W || 0) +
      (counts.Y || 0) +
      (counts.H || 0),

    nonpolar:
      (counts.G || 0) +
      (counts.A || 0) +
      (counts.V || 0) +
      (counts.L || 0) +
      (counts.I || 0) +
      (counts.P || 0) +
      (counts.M || 0),

    polar:
      (counts.S || 0) +
      (counts.T || 0) +
      (counts.C || 0) +
      (counts.N || 0) +
      (counts.Q || 0),

    charged: positiveCharged + negativeCharged,
  };
}

/**
 * Calculate physicochemical and sequence-level properties.
 *
 * This function intentionally preserves the object shape expected by
 * BioInfoPanel and the other protein viewer components.
 */
export function calcBioInfo(sequence) {
  if (!sequence) {
    return null;
  }

  const normalizedSequence = normalizeSequence(sequence);

  if (!normalizedSequence.length) {
    return null;
  }

  const length = normalizedSequence.length;
  const counts = countAminoAcids(normalizedSequence);

  const molecularWeight =
    calculateMolecularWeight(normalizedSequence);

  const gravy = calculateGravy(normalizedSequence);

  const chargeAt7 = calculateCharge(counts, 7);

  const pIRaw =
    calculateIsoelectricPoint(counts);

  const instabilityRaw =
    calculateInstabilityIndex(normalizedSequence);

  const instabilityIdx =
    instabilityRaw.toFixed(1);

  const aliphaticRaw =
    calculateAliphaticIndex(counts, length);

  const extinctionCoefficient =
    calculateExtinctionCoefficient(counts);

  const positiveCharged =
    (counts.R || 0) +
    (counts.K || 0) +
    (counts.H || 0);

  const negativeCharged =
    (counts.D || 0) +
    (counts.E || 0);

  const nTerm = normalizedSequence[0];

  const halflife =
    HALFLIFE[nTerm] || DEFAULT_HALFLIFE;

  return {
    mw: (molecularWeight / 1000).toFixed(2),
    mwRaw: molecularWeight,

    gravy: gravy.toFixed(3),

    pI: pIRaw.toFixed(2),
    chargeAt7: chargeAt7.toFixed(2),

    instabilityIdx,
    isStable: instabilityRaw < 40,

    aliphIdx: aliphaticRaw.toFixed(1),

    extCoeff: extinctionCoefficient.toLocaleString(),

    absCoeff: extinctionCoefficient
      ? (extinctionCoefficient / molecularWeight).toFixed(3)
      : "0",

    composition:
      calculateComposition(counts, length),

    classes:
      calculateResidueClasses(counts),

    halflife,
    nTerm,

    posCharged: positiveCharged,
    negCharged: negativeCharged,

    len: length,
  };
}

/**
 * Create a deterministic pseudo-random number generator.
 *
 * A seeded generator keeps unfolded structures reproducible.
 */
function createRandomGenerator(seed) {
  let state = seed;

  const random = () => {
    state =
      (state * 1664525 + 1013904223) &
      0xffffffff;

    return (state >>> 0) / 0xffffffff;
  };

  const randomNormal = () => {
    const u = Math.max(1e-10, random());
    const v = random();

    return (
      Math.sqrt(-2 * Math.log(u)) *
      Math.cos(2 * Math.PI * v)
    );
  };

  return {
    random,
    randomNormal,
  };
}

/**
 * Generate an artificial unfolded representation of a structure.
 */
export function generateUnfolded(atoms, seed = 42) {
  if (!atoms.length) {
    return [];
  }

  const { random, randomNormal } =
    createRandomGenerator(seed);

  const center = centroid(atoms);

  return atoms.map((atom, index) => {
    const [x, y, z, secondaryStructure] =
      atom;

    const dx = x - center[0];
    const dy = y - center[1];
    const dz = z - center[2];

    const distance =
      Math.sqrt(
        dx * dx +
        dy * dy +
        dz * dz
      ) || 1;

    const rx = dx / distance;
    const ry = dy / distance;
    const rz = dz / distance;

    if (secondaryStructure === 1) {
      const blow =
        18 + random() * 12;

      return [
        x +
          rx * blow +
          randomNormal() * 3,

        y +
          ry * blow +
          randomNormal() * 3,

        z +
          rz * blow +
          randomNormal() * 3 +
          (index % 2 === 0 ? 8 : -8),
      ];
    }

    if (secondaryStructure === 2) {
      const perpendicular = [
        -rz,
        0,
        rx,
      ];

      const blow =
        14 + random() * 10;

      const side =
        (random() - 0.5) * 24;

      return [
        x +
          rx * blow +
          perpendicular[0] * side +
          randomNormal() * 2,

        y +
          ry * blow +
          randomNormal() * 4,

        z +
          rz * blow +
          perpendicular[2] * side +
          randomNormal() * 2,
      ];
    }

    return [
      x + randomNormal() * 20,
      y + randomNormal() * 20,
      z + randomNormal() * 20,
    ];
  });
}

/**
 * Parse CA atoms and secondary-structure records from PDB text.
 */
export function parsePDB(text) {
  const secondaryStructure = {};
  const atoms = [];
  const lines = text.split("\n");

  /*
   * Parse HELIX and SHEET records first so the
   * structural type is available when atoms are read.
   */
  for (const line of lines) {
    const record =
      line.slice(0, 6).trim();

    if (record === "HELIX") {
      const chain =
        line[19] || " ";

      const start =
        parseInt(line.slice(21, 25));

      const end =
        parseInt(line.slice(33, 37));

      for (
        let residue = start;
        residue <= end;
        residue++
      ) {
        secondaryStructure[
          `${chain}${residue}`
        ] = 1;
      }
    }

    if (record === "SHEET") {
      const chain =
        line[21] || " ";

      const start =
        parseInt(line.slice(22, 26));

      const end =
        parseInt(line.slice(33, 37));

      for (
        let residue = start;
        residue <= end;
        residue++
      ) {
        secondaryStructure[
          `${chain}${residue}`
        ] = 2;
      }
    }
  }

  /*
   * Parse alpha-carbon atoms.
   */
  for (const line of lines) {
    const isAtomRecord =
      line.slice(0, 4) === "ATOM";

    const isCalpha =
      line.slice(12, 16).trim() === "CA";

    if (!isAtomRecord || !isCalpha) {
      continue;
    }

    const chain =
      line[21] || " ";

    const residueNumber =
      parseInt(line.slice(22, 26));

    const x =
      parseFloat(line.slice(30, 38));

    const y =
      parseFloat(line.slice(38, 46));

    const z =
      parseFloat(line.slice(46, 54));

    const plddt =
      parseFloat(line.slice(60, 66)) || 0;

    if (
      Number.isNaN(x) ||
      Number.isNaN(y) ||
      Number.isNaN(z)
    ) {
      continue;
    }

    const structureKey =
      `${chain}${residueNumber}`;

    const secondaryStructureType =
      secondaryStructure[structureKey] ??
      secondaryStructure[
        `A${residueNumber}`
      ] ??
      secondaryStructure[
        ` ${residueNumber}`
      ] ??
      0;

    atoms.push([
      x,
      y,
      z,
      secondaryStructureType,
      residueNumber,
      plddt,
    ]);
  }

  return atoms;
}

/**
 * Count ATOM records in a PDB file.
 */
export const countAtoms = (text) =>
  text
    .split("\n")
    .filter((line) =>
      line.startsWith("ATOM")
    )
    .length;

/**
 * Map residue numbers to their corresponding atom index.
 */
export const buildResidueMap = (atoms) => {
  const map = {};

  atoms.forEach((atom, index) => {
    if (atom[4] != null) {
      map[atom[4]] = index;
    }
  });

  return map;
};

/**
 * Calculate the percentage of helix, sheet, and coil residues.
 */
export function calcSSFraction(atoms) {
  if (!atoms.length) {
    return null;
  }

  const total = atoms.length;

  const helix =
    atoms.filter(
      (atom) => atom[3] === 1
    ).length;

  const sheet =
    atoms.filter(
      (atom) => atom[3] === 2
    ).length;

  const coil =
    total - helix - sheet;

  return {
    helix:
      ((helix / total) * 100).toFixed(1),

    sheet:
      ((sheet / total) * 100).toFixed(1),

    coil:
      ((coil / total) * 100).toFixed(1),
  };
}

/**
 * Add a synthetic alpha helix to a fallback structure.
 */
function addHelix(
  atoms,
  length,
  offsetX,
  offsetY,
  offsetZ,
  phaseDegrees
) {
  const phaseRadians =
    (phaseDegrees * Math.PI) / 180;

  for (let i = 0; i < length; i++) {
    const angle =
      phaseRadians +
      (i * 100 * Math.PI) / 180;

    atoms.push([
      offsetX +
        2.3 * Math.cos(angle),

      offsetY +
        2.3 * Math.sin(angle),

      offsetZ +
        i * 1.5,

      1,
      null,
      0,
    ]);
  }

  /*
   * Spacer points are retained from the original
   * fallback representation.
   */
  atoms.push(
    [0, 0, 0, 0, null, 0],
    [0, 0, 0, 0, null, 0],
    [0, 0, 0, 0, null, 0]
  );
}

/**
 * Build a synthetic myoglobin-like structure.
 */
function buildMyoglobinFallback() {
  const atoms = [];

  const helices = [
    [16, 0, 0, 0, 0],
    [8, 8, -5, 28, 45],
    [7, 2, 3, 44, 90],
    [6, -6, 1, 56, 135],
    [9, -10, -4, 67, 180],
    [8, -4, -8, 82, 225],
    [7, 4, -6, 95, 270],
    [5, 8, 2, 108, 315],
  ];

  for (const args of helices) {
    addHelix(atoms, ...args);
  }

  return atoms;
}

/**
 * Build a synthetic insulin-like structure.
 */
function buildInsulinFallback() {
  const atoms = [];

  addHelix(
    atoms,
    9,
    0,
    0,
    0,
    0
  );

  addHelix(
    atoms,
    10,
    10,
    0,
    0,
    0
  );

  for (let i = 0; i < 30; i++) {
    const angle =
      (i * 100 * Math.PI) / 180;

    atoms.push([
      2.3 * Math.cos(angle),

      -12 +
        2.3 * Math.sin(angle),

      i * 1.5 - 5,

      1,
      null,
      0,
    ]);
  }

  return atoms;
}

/**
 * Build a synthetic beta-barrel / porin structure.
 */
function buildPorinFallback() {
  const atoms = [];

  for (
    let strand = 0;
    strand < 16;
    strand++
  ) {
    const strandAngle =
      (strand * 2 * Math.PI) / 16;

    const centerX =
      10 * Math.cos(strandAngle);

    const centerY =
      10 * Math.sin(strandAngle);

    for (
      let residue = 0;
      residue < 14;
      residue++
    ) {
      const position =
        strand % 2 === 0
          ? residue
          : 13 - residue;

      atoms.push([
        centerX +
          (residue - 7) *
            0.25 *
            Math.sin(strandAngle),

        centerY +
          (residue - 7) *
            0.25 *
            Math.cos(strandAngle),

        position * 3.4 - 24,

        2,
        null,
        0,
      ]);
    }
  }

  return atoms;
}

/**
 * Build a synthetic TIM-barrel-like structure.
 */
function buildTIMFallback() {
  const atoms = [];

  for (let i = 0; i < 8; i++) {
    const mainAngle =
      (i * Math.PI) / 4;

    const radius = 7;

    const centerX =
      radius * Math.cos(mainAngle);

    const centerY =
      radius * Math.sin(mainAngle);

    for (let j = 0; j < 8; j++) {
      atoms.push([
        centerX -
          j *
            0.25 *
            Math.cos(mainAngle),

        centerY -
          j *
            0.25 *
            Math.sin(mainAngle),

        j * 3.4,

        2,
        null,
        0,
      ]);
    }

    const helixCenterX =
      (radius + 5) *
      Math.cos(
        mainAngle + Math.PI / 8
      );

    const helixCenterY =
      (radius + 5) *
      Math.sin(
        mainAngle + Math.PI / 8
      );

    for (let j = 0; j < 12; j++) {
      const helixAngle =
        (j * 100 * Math.PI) / 180;

      atoms.push([
        helixCenterX +
          2.3 *
            Math.cos(helixAngle),

        helixCenterY +
          2.3 *
            Math.sin(helixAngle),

        j * 1.5 + 2,

        1,
        null,
        0,
      ]);
    }
  }

  return atoms;
}

/**
 * Build a synthetic CAG-like helical structure.
 */
function buildCAGFallback() {
  const atoms = [];

  const offsets = [
    0,
    (2 * Math.PI) / 3,
    (4 * Math.PI) / 3,
  ];

  for (const offset of offsets) {
    for (let i = 0; i < 60; i++) {
      const t = i / 59;

      const mainAngle =
        offset + t * 6 * Math.PI;

      const secondaryAngle =
        offset + t * 20 * Math.PI;

      atoms.push([
        (
          3 +
          1.5 *
            Math.cos(secondaryAngle)
        ) *
          Math.cos(mainAngle),

        (
          3 +
          1.5 *
            Math.cos(secondaryAngle)
        ) *
          Math.sin(mainAngle),

        i * 0.86 - 26,

        1,
        null,
        0,
      ]);
    }
  }

  return atoms;
}

/**
 * Build a generic synthetic beta-rich structure.
 */
function buildGenericFallback() {
  const atoms = [];

  for (
    let strand = 0;
    strand < 11;
    strand++
  ) {
    const strandAngle =
      (strand * 2 * Math.PI) / 11;

    const centerX =
      9 * Math.cos(strandAngle);

    const centerY =
      9 * Math.sin(strandAngle);

    for (
      let residue = 0;
      residue < 15;
      residue++
    ) {
      const position =
        strand % 2 === 0
          ? residue
          : 14 - residue;

      atoms.push([
        centerX +
          (residue - 7) *
            0.2 *
            Math.sin(strandAngle),

        centerY +
          (residue - 7) *
            0.2 *
            Math.cos(strandAngle),

        position * 3.4 - 25,

        2,
        null,
        0,
      ]);
    }
  }

  addHelix(
    atoms,
    20,
    0,
    0,
    -15,
    0
  );

  return atoms;
}

/**
 * Return a fallback structure for known PDB IDs.
 */
export function buildFallback(pdb) {
  switch (pdb) {
    case "1MBN":
    case "1HHO":
      return buildMyoglobinFallback();

    case "4INS":
      return buildInsulinFallback();

    case "2POR":
      return buildPorinFallback();

    case "1TIM":
      return buildTIMFallback();

    case "1CAG":
      return buildCAGFallback();

    default:
      return buildGenericFallback();
  }
}

/**
 * Calculate the centroid of a collection of XYZ coordinates.
 */
export const centroid = (atoms) => {
  const count = atoms.length || 1;

  return [
    atoms.reduce(
      (sum, atom) =>
        sum + atom[0],
      0
    ) / count,

    atoms.reduce(
      (sum, atom) =>
        sum + atom[1],
      0
    ) / count,

    atoms.reduce(
      (sum, atom) =>
        sum + atom[2],
      0
    ) / count,
  ];
};

/**
 * Calculate the maximum radial distance from a center point.
 */
export const maxR = (
  atoms,
  center
) =>
  Math.max(
    ...atoms.map(
      ([x, y, z]) =>
        Math.sqrt(
          (x - center[0]) ** 2 +
          (y - center[1]) ** 2 +
          (z - center[2]) ** 2
        )
    ),
    1
  );

/**
 * Rotate a 3D coordinate around the Y axis.
 */
export const rotY3 = (
  [x, y, z],
  angle
) => [
  Math.cos(angle) * x +
    Math.sin(angle) * z,

  y,

  -Math.sin(angle) * x +
    Math.cos(angle) * z,
];

/**
 * Rotate a 3D coordinate around the X axis.
 */
export const rotX3 = (
  [x, y, z],
  angle
) => [
  x,

  Math.cos(angle) * y -
    Math.sin(angle) * z,

  Math.sin(angle) * y +
    Math.cos(angle) * z,
];

/**
 * Calculate one Catmull-Rom spline point.
 */
function catmullRom(
  p0,
  p1,
  p2,
  p3,
  t
) {
  return p0.map((_, index) =>
    0.5 *
    (
      2 * p1[index] +
      (-p0[index] +
        p2[index]) *
        t +
      (
        2 * p0[index] -
        5 * p1[index] +
        4 * p2[index] -
        p3[index]
      ) *
        t *
        t +
      (
        -p0[index] +
        3 * p1[index] -
        3 * p2[index] +
        p3[index]
      ) *
        t *
        t *
        t
    )
  );
}

/**
 * Interpolate a collection of points using Catmull-Rom splines.
 */
export function spline(
  points,
  steps = 5
) {
  if (points.length < 2) {
    return points;
  }

  const output = [];

  for (
    let i = 0;
    i < points.length - 1;
    i++
  ) {
    const p0 =
      points[Math.max(0, i - 1)];

    const p1 =
      points[i];

    const p2 =
      points[
        Math.min(
          points.length - 1,
          i + 1
        )
      ];

    const p3 =
      points[
        Math.min(
          points.length - 1,
          i + 2
        )
      ];

    for (
      let step = 0;
      step < steps;
      step++
    ) {
      output.push(
        catmullRom(
          p0,
          p1,
          p2,
          p3,
          step / steps
        )
      );
    }
  }

  output.push(
    points[points.length - 1]
  );

  return output;
}

/**
 * Convert a #RRGGBB hex color to an rgba() string.
 */
export function hexRgba(
  hex,
  alpha
) {
  const red =
    parseInt(
      hex.slice(1, 3),
      16
    );

  const green =
    parseInt(
      hex.slice(3, 5),
      16
    );

  const blue =
    parseInt(
      hex.slice(5, 7),
      16
    );

  return `rgba(${red},${green},${blue},${alpha.toFixed(2)})`;
}