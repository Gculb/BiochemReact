const parsePDB = text => {
  const ssMap = {}, atoms = [], lines = text.split("\n");
  lines.forEach(line => {
    const record = line.slice(0, 6).trim();
    if (record === "HELIX") {
      const chain = line[19] || " ", start = parseInt(line.slice(21, 25)), end = parseInt(line.slice(33, 37));
      for (let residue = start; residue <= end; residue++) ssMap[`${chain}${residue}`] = 1;
    } else if (record === "SHEET") {
      const chain = line[21] || " ", start = parseInt(line.slice(22, 26)), end = parseInt(line.slice(33, 37));
      for (let residue = start; residue <= end; residue++) ssMap[`${chain}${residue}`] = 2;
    }
  });
  lines.forEach(line => {
    if (line.slice(0, 4) !== "ATOM" || line.slice(12, 16).trim() !== "CA") return;
    const chain = line[21] || " ", residue = parseInt(line.slice(22, 26));
    const x = parseFloat(line.slice(30, 38)), y = parseFloat(line.slice(38, 46)), z = parseFloat(line.slice(46, 54));
    const plddt = parseFloat(line.slice(60, 66)) || 0;
    if (Number.isNaN(x) || Number.isNaN(y) || Number.isNaN(z)) return;
    const ss = ssMap[`${chain}${residue}`] ?? ssMap[`A${residue}`] ?? ssMap[` ${residue}`] ?? 0;
    atoms.push([x, y, z, ss, residue, plddt]);
  });
  return atoms;
};

const centroid = atoms => {
  const count = atoms.length || 1;
  return [
    atoms.reduce((sum, atom) => sum + atom[0], 0) / count,
    atoms.reduce((sum, atom) => sum + atom[1], 0) / count,
    atoms.reduce((sum, atom) => sum + atom[2], 0) / count,
  ];
};
const maxR = (atoms, center) => Math.max(...atoms.map(([x, y, z]) => Math.sqrt((x - center[0]) ** 2 + (y - center[1]) ** 2 + (z - center[2]) ** 2)), 1);
const buildResidueMap = atoms => {
  const map = {};
  atoms.forEach((atom, index) => { if (atom[4] != null) map[atom[4]] = index; });
  return map;
};
const calcSSFraction = atoms => {
  if (!atoms.length) return null;
  const total = atoms.length, helix = atoms.filter(atom => atom[3] === 1).length, sheet = atoms.filter(atom => atom[3] === 2).length;
  return { helix: ((helix / total) * 100).toFixed(1), sheet: ((sheet / total) * 100).toFixed(1), coil: (((total - helix - sheet) / total) * 100).toFixed(1) };
};
const generateUnfolded = (atoms, seed = 42) => {
  let rng = seed;
  const random = () => { rng = (rng * 1664525 + 1013904223) & 0xffffffff; return (rng >>> 0) / 0xffffffff; };
  const normal = () => { const u = Math.max(1e-10, random()), v = random(); return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v); };
  const center = centroid(atoms);
  return atoms.map((atom, index) => {
    const [x, y, z, ss] = atom, dx = x - center[0], dy = y - center[1], dz = z - center[2];
    const distance = Math.sqrt(dx * dx + dy * dy + dz * dz) || 1;
    const rx = dx / distance, ry = dy / distance, rz = dz / distance;
    if (ss === 1) {
      const blow = 18 + random() * 12;
      return [x + rx * blow + normal() * 3, y + ry * blow + normal() * 3, z + rz * blow + normal() * 3 + (index % 2 === 0 ? 8 : -8)];
    }
    if (ss === 2) {
      const perpendicular = [-rz, 0, rx], blow = 14 + random() * 10, side = (random() - 0.5) * 24;
      return [x + rx * blow + perpendicular[0] * side + normal() * 2, y + ry * blow + normal() * 4, z + rz * blow + perpendicular[2] * side + normal() * 2];
    }
    return [x + normal() * 20, y + normal() * 20, z + normal() * 20];
  });
};

self.onmessage = event => {
  const { id, pdbText } = event.data;
  try {
    const atoms = parsePDB(pdbText || "");
    if (!atoms.length) throw new Error("No Cα atoms found.");
    const center = centroid(atoms);
    self.postMessage({ id, atoms, unfolded: generateUnfolded(atoms), center, radius: maxR(atoms, center), residueMap: buildResidueMap(atoms), ssFrac: calcSSFraction(atoms) });
  } catch (error) {
    self.postMessage({ id, error: error.message || "Unable to prepare structure" });
  }
};
