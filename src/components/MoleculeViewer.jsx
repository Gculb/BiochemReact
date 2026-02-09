/**
 * MoleculeViewer Component
 * Interactive 3D molecular visualization with Three.js
 * Supports 10+ molecules with rotation, zoom, and view saving
 */

import React, { useEffect, useRef, useState } from "react";
import * as THREE from "three";
import "./MoleculeViewer.css";

const MoleculeViewer = () => {
  const canvasRef = useRef(null);
  const sceneRef = useRef(null);
  const cameraRef = useRef(null);
  const rendererRef = useRef(null);
  const molRef = useRef(null);
  const dragStateRef = useRef({ isDragging: false, prevX: 0, prevY: 0 });
  const [currentMol, setCurrentMol] = useState("glucose");
  const [savedViews, setSavedViews] = useState([]);
  const [rotSpeed, setRotSpeed] = useState({ x: 0.01, y: 0.01 });
  const [info, setInfo] = useState({});
  const [viewName, setViewName] = useState("");

  // Molecule definitions
  const molRegistry = {
    glucose: {
      title: "Glucose (C₆H₁₂O₆)",
      type: "Monosaccharide",
      role: "Primary energy source",
      struct: "6-carbon ring",
      feat: "Glycolysis substrate"
    },
    alanine: {
      title: "Alanine (C₃H₇NO₂)",
      type: "Amino acid",
      role: "Protein building block",
      struct: "Nonpolar side chain",
      feat: "Ala or A"
    },
    atp: {
      title: "ATP (C₁₀H₁₆N₅O₁₃P₃)",
      type: "Nucleotide",
      role: "Energy currency",
      struct: "Three phosphates",
      feat: "ΔG° = -30.5 kJ/mol"
    },
    dna: {
      title: "DNA Base Pair (A-T)",
      type: "Nucleic acid",
      role: "Genetic storage",
      struct: "2 H-bonds",
      feat: "Watson-Crick pairing"
    },
    dnacg: {
      title: "DNA Base Pair (C-G)",
      type: "Nucleic acid",
      role: "Genetic storage",
      struct: "3 H-bonds",
      feat: "Watson-Crick pairing"
    },
    acetylcoa: {
      title: "Acetyl-CoA",
      type: "Coenzyme",
      role: "Metabolic intermediate",
      struct: "2-carbon acetyl",
      feat: "TCA entry"
    },
    tryptophan: {
      title: "Tryptophan (C₁₁H₁₂N₂O₂)",
      type: "Amino acid",
      role: "Protein building block",
      struct: "Aromatic side chain",
      feat: "Precursor to serotonin"
    },
    cholesterol: {
      title: "Cholesterol (C₂₇H₄₆O)",
      type: "Steroid",
      role: "Membrane component",
      struct: "Four rings",
      feat: "Hormone precursor"
    },
    alphahelix: {
      title: "Alpha Helix",
      type: "Protein secondary structure",
      role: "Structural motif",
      struct: "Right-handed coil",
      feat: "Stabilized by H-bonds"
    }
  };

  // Helper to create atom
  const createAtom = (x, y, z, color, size = 0.5) => {
    const geometry = new THREE.SphereGeometry(size, 32, 32);
    const material = new THREE.MeshPhongMaterial({ color, shininess: 100 });
    const mesh = new THREE.Mesh(geometry, material);
    mesh.position.set(x, y, z);
    return mesh;
  };

  // Helper to create bond
  const createBond = (start, end, color = 0xcccccc) => {
    const direction = new THREE.Vector3().subVectors(end, start);
    const length = direction.length();
    const geometry = new THREE.CylinderGeometry(0.15, 0.15, length, 8);
    const material = new THREE.MeshPhongMaterial({ color });
    const mesh = new THREE.Mesh(geometry, material);
    mesh.position.copy(start).add(direction.clone().multiplyScalar(0.5));
    mesh.quaternion.setFromUnitVectors(
      new THREE.Vector3(0, 1, 0),
      direction.normalize()
    );
    return mesh;
  };

  // Molecule makers
  const makeGlucose = () => {
    const group = new THREE.Group();
    const atoms = [];
    const r = 2;
    // Create 6-membered carbon ring
    for (let i = 0; i < 6; i++) {
      const angle = (i * Math.PI * 2) / 6;
      const x = r * Math.cos(angle);
      const y = r * Math.sin(angle);
      const isO = i === 0;
      const at = createAtom(x, y, 0, isO ? 0xff0000 : 0x404040, isO ? 0.6 : 0.5);
      atoms.push(at);
      group.add(at);
    }
    for (let i = 0; i < 6; i++) {
      group.add(createBond(atoms[i].position, atoms[(i + 1) % 6].position));
    }
    // Add hydroxyl groups on carbons 1-4, and CH2OH on C5
    [1, 2, 3, 4].forEach((i) => {
      const angle = (i * Math.PI * 2) / 6;
      const x = (r + 1.4) * Math.cos(angle);
      const y = (r + 1.4) * Math.sin(angle);
      const o = createAtom(x, y, 0, 0xff0000, 0.6);
      group.add(o);
      group.add(createBond(atoms[i].position, o.position));
      const hx = x + 0.8 * Math.cos(angle);
      const hy = y + 0.8 * Math.sin(angle);
      const h = createAtom(hx, hy, 0, 0xffffff, 0.35);
      group.add(h);
      group.add(createBond(o.position, h.position));
    });
    // CH2OH group on C5
    const angle5 = (5 * Math.PI * 2) / 6;
    const ch2x = (r + 1.4) * Math.cos(angle5);
    const ch2y = (r + 1.4) * Math.sin(angle5);
    const c5 = createAtom(ch2x, ch2y, 0, 0x404040, 0.45);
    group.add(c5);
    group.add(createBond(atoms[5].position, c5.position));
    const o5x = ch2x + 0.8 * Math.cos(angle5);
    const o5y = ch2y + 0.8 * Math.sin(angle5);
    const o5 = createAtom(o5x, o5y, 0, 0xff0000, 0.55);
    group.add(o5);
    group.add(createBond(c5.position, o5.position));
    const h5x = o5x + 0.8 * Math.cos(angle5);
    const h5y = o5y + 0.8 * Math.sin(angle5);
    const h5 = createAtom(h5x, h5y, 0, 0xffffff, 0.35);
    group.add(h5);
    group.add(createBond(o5.position, h5.position));
    return group;
  };

  const makeAlanine = () => {
    const group = new THREE.Group();
    const SCALE = 1.6;

    const createAt = (x, y, z, el) => {
      const colors = {
        C: [0x404040, 0.4],
        N: [0x3050f8, 0.45],
        O: [0xff3030, 0.45],
        H: [0xffffff, 0.25]
      };
      const [c, r] = colors[el];
      const m = createAtom(x * SCALE, y * SCALE, z * SCALE, c, r);
      group.add(m);
      return m;
    };

    const ca = createAt(0, 0, 0, "C");
    const n = createAt(-1.2, 0.8, 0, "N");
    const nh1 = createAt(-2.0, 1.3, 0, "H");
    const nh2 = createAt(-1.2, 1.8, 0, "H");

    group.add(createBond(ca.position, n.position));
    group.add(createBond(n.position, nh1.position));
    group.add(createBond(n.position, nh2.position));

    const c2 = createAt(1.4, 0, 0, "C");
    const o1 = createAt(2.4, 0.8, 0, "O");
    const o2 = createAt(2.4, -0.8, 0, "O");

    group.add(createBond(ca.position, c2.position));
    group.add(createBond(c2.position, o1.position));
    group.add(createBond(c2.position, o2.position));

    const cb = createAt(0, -1.4, 0, "C");
    group.add(createBond(ca.position, cb.position));

    const mh1 = createAt(-0.8, -2.2, 0, "H");
    const mh2 = createAt(0.8, -2.2, 0, "H");
    const mh3 = createAt(0, -1.4, 1.0, "H");

    group.add(createBond(cb.position, mh1.position));
    group.add(createBond(cb.position, mh2.position));
    group.add(createBond(cb.position, mh3.position));

    return group;
  };

  const makeATP = () => {
    const group = new THREE.Group();
    
    // Adenine - 6+5 fused ring (purine)
    // 6-membered ring
    const ring6 = [];
    for (let i = 0; i < 6; i++) {
      const angle = (i * Math.PI * 2) / 6;
      const x = -6 + Math.cos(angle) * 0.85;
      const y = Math.sin(angle) * 0.85;
      const isN = i % 2 === 0;
      const atom = createAtom(x, y, 0, isN ? 0x0000ff : 0x404040, 0.4);
      ring6.push(atom);
      group.add(atom);
    }
    for (let i = 0; i < 6; i++) {
      group.add(createBond(ring6[i].position, ring6[(i + 1) % 6].position));
    }
    
    // 5-membered ring (fused)
    const ring5 = [];
    for (let i = 0; i < 5; i++) {
      const angle = Math.PI / 2 + (i * Math.PI * 2) / 5;
      const x = -6 + 1.2 * Math.cos(angle) * 0.7;
      const y = 0.7 * Math.sin(angle);
      const isN = i === 4;
      const atom = createAtom(x, y, 0, isN ? 0x0000ff : 0x404040, 0.35);
      ring5.push(atom);
      group.add(atom);
    }
    for (let i = 0; i < 5; i++) {
      group.add(createBond(ring5[i].position, ring5[(i + 1) % 5].position));
    }

    // Ribose sugar (5-carbon ring)
    const ribose = createAtom(-3, 0, 0, 0x404040, 0.5);
    group.add(ribose);
    group.add(createBond(ring6[0].position, ribose.position));

    // Phosphate chain (3 phosphate groups)
    const p1 = createAtom(-0.3, 0, 0, 0xffa500, 0.7);
    const p2 = createAtom(1.7, 0.4, 0, 0xffa500, 0.65);
    const p3 = createAtom(3.7, 0, 0, 0xffa500, 0.6);
    group.add(p1, p2, p3);

    // Connect phosphates
    group.add(createBond(ribose.position, p1.position));
    group.add(createBond(p1.position, p2.position));
    group.add(createBond(p2.position, p3.position));

    // Double-bond oxygens (high energy!)
    const oPositions = [
      { p: p1, offset: [0, 1] },
      { p: p2, offset: [0.2, 1.1] },
      { p: p3, offset: [0, 1] }
    ];
    
    oPositions.forEach(({ p, offset }) => {
      const oAtom = createAtom(p.position.x + offset[0], p.position.y + offset[1], 0, 0xff3030, 0.55);
      group.add(oAtom);
      group.add(createBond(p.position, oAtom.position));
    });

    return group;
  };

  const makeDNA = () => {
    const group = new THREE.Group();
    const aPos = [
      { x: -3, y: 1.5 },
      { x: -2.5, y: 0.5 },
      { x: -3, y: -0.5 },
      { x: -4, y: -0.5 },
      { x: -4.5, y: 0.5 }
    ];
    const aAtoms = [];
    aPos.forEach((p, i) => {
      const a = createAtom(p.x, p.y, 0, i === 0 || i === 4 ? 0x0000ff : 0x404040, 0.45);
      aAtoms.push(a);
      group.add(a);
    });
    for (let i = 0; i < 5; i++) {
      group.add(createBond(aAtoms[i].position, aAtoms[(i + 1) % 5].position));
    }

    const tPos = [
      { x: 3, y: 1.5 },
      { x: 2.5, y: 0.5 },
      { x: 3, y: -0.5 },
      { x: 4, y: -0.5 },
      { x: 4.5, y: 0.5 }
    ];
    const tAtoms = [];
    tPos.forEach((p, i) => {
      const a = createAtom(p.x, p.y, 0, i === 1 || i === 3 ? 0xff0000 : 0x404040, 0.45);
      tAtoms.push(a);
      group.add(a);
    });
    for (let i = 0; i < 5; i++) {
      group.add(createBond(tAtoms[i].position, tAtoms[(i + 1) % 5].position));
    }

    group.add(createBond(new THREE.Vector3(-2.5, 1, 0), new THREE.Vector3(2.5, 1, 0), 0x88ff88));
    group.add(createBond(new THREE.Vector3(-2.5, -0.2, 0), new THREE.Vector3(2.5, -0.2, 0), 0x88ff88));

    return group;
  };

  const makeDNACG = () => {
    const group = new THREE.Group();
    const cPos = [
      { x: -3, y: 1.5 },
      { x: -2.5, y: 0.5 },
      { x: -3, y: -0.5 },
      { x: -4, y: -0.5 },
      { x: -4.5, y: 0.5 }
    ];
    const cAtoms = [];
    cPos.forEach((p, i) => {
      const a = createAtom(p.x, p.y, 0, i === 1 || i === 3 ? 0x0000ff : 0x404040, 0.45);
      cAtoms.push(a);
      group.add(a);
    });
    for (let i = 0; i < 5; i++) {
      group.add(createBond(cAtoms[i].position, cAtoms[(i + 1) % 5].position));
    }

    const gPos = [
      { x: 3, y: 1.5 },
      { x: 2.5, y: 0.5 },
      { x: 3, y: -0.5 },
      { x: 4, y: -0.5 },
      { x: 4.5, y: 0.5 }
    ];
    const gAtoms = [];
    gPos.forEach((p, i) => {
      const a = createAtom(p.x, p.y, 0, i === 0 || i === 4 ? 0x404040 : 0x0000ff, 0.45);
      gAtoms.push(a);
      group.add(a);
    });
    for (let i = 0; i < 5; i++) {
      group.add(createBond(gAtoms[i].position, gAtoms[(i + 1) % 5].position));
    }

    group.add(createBond(new THREE.Vector3(-2.5, 1, 0), new THREE.Vector3(2.5, 1, 0), 0x88ff88));
    group.add(createBond(new THREE.Vector3(-2.5, -0.2, 0), new THREE.Vector3(2.5, -0.2, 0), 0x88ff88));
    group.add(createBond(new THREE.Vector3(-2.5, 0.4, 0), new THREE.Vector3(2.5, 0.4, 0), 0x88ff88));

    return group;
  };

  const makeAlphaHelix = () => {
    const group = new THREE.Group();
    const residues = 12;
    const radius = 1.2;
    const rise = 0.5;
    const turn = (2 * Math.PI) / 3.6;

    for (let i = 0; i < residues; i++) {
      const angle = i * turn;
      const caPos = new THREE.Vector3(
        Math.cos(angle) * radius,
        i * rise,
        Math.sin(angle) * radius
      );
      const nPos = caPos.clone().add(new THREE.Vector3(Math.cos(angle - 0.3) * 0.6, -0.3, Math.sin(angle - 0.3) * 0.6));
      const cPos = caPos.clone().add(new THREE.Vector3(Math.cos(angle + 0.3) * 0.6, 0.3, Math.sin(angle + 0.3) * 0.6));

      const n = createAtom(nPos.x, nPos.y, nPos.z, 0x0000ff, 0.35);
      const ca = createAtom(caPos.x, caPos.y, caPos.z, 0xaaaaaa, 0.4);
      const c = createAtom(cPos.x, cPos.y, cPos.z, 0x333333, 0.35);

      group.add(n, ca, c);
      group.add(createBond(nPos, caPos));
      group.add(createBond(caPos, cPos));
    }
    return group;
  };

  const makeAcetylCoA = () => {
    const group = new THREE.Group();
    const SCALE = 1.4;

    // Adenine base
    const aden = createAtom(-6 * SCALE, 0, 0, 0x3050f8, 0.6);
    group.add(aden);

    // Ribose
    const ribPos = [-2.5 * SCALE, 0, 0];
    const rib = createAtom(...ribPos, 0x404040, 0.5);
    group.add(rib);
    group.add(createBond(aden.position, rib.position));

    // Phosphate groups (3)
    const p1Pos = [0, 0, 0];
    const p1 = createAtom(...p1Pos, 0xffa500, 0.65);
    group.add(p1);
    group.add(createBond(rib.position, p1.position));

    const p2Pos = [1.5 * SCALE, 0.4 * SCALE, 0];
    const p2 = createAtom(...p2Pos, 0xffa500, 0.6);
    group.add(p2);
    group.add(createBond(p1.position, p2.position));

    const p3Pos = [3 * SCALE, 0, 0];
    const p3 = createAtom(...p3Pos, 0xffa500, 0.6);
    group.add(p3);
    group.add(createBond(p2.position, p3.position));

    // Acetyl group (2-carbon)
    const c1Pos = [4.5 * SCALE, 0, 0];
    const c1 = createAtom(...c1Pos, 0x404040, 0.5);
    group.add(c1);
    group.add(createBond(p3.position, c1.position));

    const c2Pos = [6 * SCALE, 0, 0];
    const c2 = createAtom(...c2Pos, 0x404040, 0.5);
    group.add(c2);
    group.add(createBond(c1.position, c2.position));

    // Oxygen on acetyl
    const oPos = [6.5 * SCALE, 0.8 * SCALE, 0];
    const o = createAtom(...oPos, 0xff3030, 0.5);
    group.add(o);
    group.add(createBond(c2.position, o.position));

    return group;
  };

          const makeTryptophan = () => {
            const group = new THREE.Group();
            const SCALE = 1.6;

            const at = (x, y, z, el) => {
              const styles = {
                C: [0x404040, 0.4],
                N: [0x3050f8, 0.45],
                O: [0xff3030, 0.45],
                H: [0xffffff, 0.25]
              };
              const [c, r] = styles[el];
              const m = createAtom(x * SCALE, y * SCALE, z * SCALE, c, r);
              group.add(m);
              return m;
            };

            const link = (a, b) => group.add(createBond(a.position, b.position));

            // Backbone
            const ca = at(0, 0, 0, "C");
            const n = at(-1.2, 0.8, 0, "N");
            const h1 = at(-2.0, 1.3, 0, "H");
            const h2 = at(-1.2, 1.8, 0, "H");

            link(ca, n);
            link(n, h1);
            link(n, h2);

            const c = at(1.4, 0, 0, "C");
            const o1 = at(2.4, 0.8, 0, "O");
            const o2 = at(2.4, -0.8, 0, "O");

            link(ca, c);
            link(c, o1);
            link(c, o2);

            // Side chain CH2
            const cb = at(0, -1.5, 0, "C");
            link(ca, cb);

            // Indole ring (simplified)
            const ring = [
              at(0.8, -3.0, 0, "C"),
              at(2.2, -3.0, 0, "C"),
              at(3.0, -4.2, 0, "C"),
              at(2.2, -5.4, 0, "C"),
              at(0.8, -5.4, 0, "C"),
              at(0.0, -4.2, 0, "C")
            ];

            link(cb, ring[0]);
            ring.forEach((a, i) => link(a, ring[(i + 1) % ring.length]));

            const indoleN = at(1.0, -6.8, 0, "N");
            link(ring[4], indoleN);

            return group;
          };
const makeCholesterol = () => {
  const group = new THREE.Group();
  const SCALE = 0.9;

  // ---------- Helpers ----------
  const rotateAroundAxis = (v, axis, angle) => {
    const q = new THREE.Quaternion();
    q.setFromAxisAngle(axis, angle);
    return v.clone().applyQuaternion(q);
  };

  // Ensure an atom Mesh is added to the group exactly once
  const ensureAtomInGroup = (atom) => {
    if (!atom.parent) group.add(atom);
  };

  // Build a fused cyclohexane (chair) given two adjacent existing atoms (anchorA -> anchorB)
  const buildFusedChairHexagon = ({
    anchorA,              // THREE.Mesh (existing atom)
    anchorB,              // THREE.Mesh (existing atom, adjacent to anchorA)
    bondLength = 1.05 * SCALE,
    puckers = [0.45, -0.45, 0.45, -0.45, 0.45, -0.45].map(v => v * SCALE),
    angleSign = 1         // 1 or -1 to choose orientation
  }) => {
    const atoms = new Array(6);
    atoms[0] = anchorA;
    atoms[1] = anchorB;

    // Guarantee anchors live in our group
    ensureAtomInGroup(anchorA);
    ensureAtomInGroup(anchorB);

    const p0 = anchorA.position.clone();
    const p1 = anchorB.position.clone();
    let prevPos = p1.clone();
    let prevDir = p1.clone().sub(p0).normalize();

    // Choose an approximate "up" vector for puckering. If ring direction is close to Z, use X.
    let worldUp = new THREE.Vector3(0, 0, 1);
    if (Math.abs(prevDir.dot(worldUp)) > 0.9) worldUp = new THREE.Vector3(1, 0, 0);

    // plane normal (perpendicular to ring plane) => use cross(dir, up)
    let planeNormal = new THREE.Vector3().crossVectors(prevDir, worldUp);
    if (planeNormal.lengthSq() < 1e-6) planeNormal = new THREE.Vector3(0, 0, 1);
    planeNormal.normalize();

    const angle = angleSign * (Math.PI / 3); // 60 degrees for hexagon

    // Walk: atoms[0], atoms[1] are anchors; compute atoms[2..5]
    for (let i = 2; i < 6; i++) {
      const newDir = rotateAroundAxis(prevDir, planeNormal, angle).normalize();
      const pos = prevPos.clone()
        .add(newDir.clone().multiplyScalar(bondLength))
        .addScaledVector(planeNormal, puckers[i]); // puckering perpendicular to ring plane

      const atom = createAtom(pos.x, pos.y, pos.z, 0x404040, 0.35);
      group.add(atom);

      // bond from prevPos (which is the previous atom) to current
      group.add(createBond(prevPos, pos));

      atoms[i] = atom;
      prevPos = pos.clone();
      prevDir = newDir.clone();
    }

    // close ring: bond between last atom and atoms[0]
    group.add(createBond(atoms[5].position, atoms[0].position));

    return atoms;
  };

  // Build a fused cyclopentane (5-membered) given two adjacent existing atoms (anchorA -> anchorB)
  const buildFusedPentagon = ({
    anchorA,
    anchorB,
    bondLength = 0.95 * SCALE,
    puckers = [0.25, -0.25, 0.25, -0.25, 0.25].map(v => v * SCALE),
    angleSign = 1
  }) => {
    const n = 5;
    const atoms = new Array(n);
    atoms[0] = anchorA;
    atoms[1] = anchorB;

    ensureAtomInGroup(anchorA);
    ensureAtomInGroup(anchorB);

    let p0 = anchorA.position.clone();
    let p1 = anchorB.position.clone();
    let prevPos = p1.clone();
    let prevDir = p1.clone().sub(p0).normalize();

    // choose world up
    let worldUp = new THREE.Vector3(0, 0, 1);
    if (Math.abs(prevDir.dot(worldUp)) > 0.9) worldUp = new THREE.Vector3(1, 0, 0);

    let planeNormal = new THREE.Vector3().crossVectors(prevDir, worldUp);
    if (planeNormal.lengthSq() < 1e-6) planeNormal = new THREE.Vector3(0, 0, 1);
    planeNormal.normalize();

    const angle = angleSign * (2 * Math.PI / n); // 72° for pentagon

    for (let i = 2; i < n; i++) {
      const newDir = rotateAroundAxis(prevDir, planeNormal, angle).normalize();
      const pos = prevPos.clone()
        .add(newDir.clone().multiplyScalar(bondLength))
        .addScaledVector(planeNormal, puckers[i]); // small pucker
      const atom = createAtom(pos.x, pos.y, pos.z, 0x404040, 0.35);
      group.add(atom);
      group.add(createBond(prevPos, pos));
      atoms[i] = atom;
      prevPos = pos.clone();
      prevDir = newDir.clone();
    }

    // close ring
    group.add(createBond(atoms[n - 1].position, atoms[0].position));

    return atoms;
  };

  // ---------- Build scaffold (steroid fused rings) ----------
  // Slightly different coordinates than your original centers: we will place two seed atoms for ring A,
  // then build the rest by fusion. This is robust and removes long diagonals.

  // Seed two atoms for ring A
  const a0 = createAtom(0.0 * SCALE, 0.0 * SCALE, 0.45 * SCALE, 0x404040, 0.35); // up
  const a1 = createAtom(1.05 * SCALE, 0.0 * SCALE, -0.45 * SCALE, 0x404040, 0.35); // down
  group.add(a0);
  group.add(a1);
  group.add(createBond(a0.position, a1.position));

  // Ring A (hexagon) built from anchors a0->a1
  const ringA = buildFusedChairHexagon({
    anchorA: a0,
    anchorB: a1,
    bondLength: 1.05 * SCALE,
    puckers: [0.45, -0.45, 0.45, -0.45, 0.45, -0.45].map(v => v * SCALE),
    angleSign: 1
  });

  // Ring B fused to ringA at atoms 4 & 5 (use ringA[4], ringA[5])
  const ringB = buildFusedChairHexagon({
    anchorA: ringA[4],
    anchorB: ringA[5],
    bondLength: 1.05 * SCALE,
    puckers: [0.45, -0.45, 0.45, -0.45, 0.45, -0.45].map(v => v * SCALE),
    angleSign: 1
  });

  // Ring C fused to ringB at atoms 4 & 5 (the standard steroid connectivity)
  const ringC = buildFusedChairHexagon({
    anchorA: ringB[4],
    anchorB: ringB[5],
    bondLength: 1.05 * SCALE,
    puckers: [0.45, -0.45, 0.45, -0.45, 0.45, -0.45].map(v => v * SCALE),
    angleSign: -1 // flip orientation if you need the ring to bend the other way
  });

  // Ring D (pentagon) fused to ringC using ringC[2] & ringC[3]
  const ringD = buildFusedPentagon({
    anchorA: ringC[2],
    anchorB: ringC[3],
    bondLength: 0.95 * SCALE,
    puckers: [0.25, -0.25, 0.25, -0.25, 0.25].map(v => v * SCALE),
    angleSign: 1
  });

  // ---------- Add substituents similar to your original routine ----------

  // OH on C3 -> choose ringA[2] (beta: up)
  const c3 = ringA[2];
  const ohPos = c3.position.clone().add(new THREE.Vector3(0, 0, 1.0 * SCALE));
  const oh = createAtom(ohPos.x, ohPos.y, ohPos.z, 0xff3030, 0.38);
  group.add(oh);
  group.add(createBond(c3.position, oh.position));

  // Methyl at approx ringB[2] (C10)
  const methyl10Pos = ringB[2].position.clone().add(new THREE.Vector3(0, 0, 0.95 * SCALE));
  const methyl10 = createAtom(methyl10Pos.x, methyl10Pos.y, methyl10Pos.z, 0x404040, 0.32);
  group.add(methyl10);
  group.add(createBond(ringB[2].position, methyl10.position));

  // Methyl at approx ringC[1] (C13)
  const methyl13Pos = ringC[1].position.clone().add(new THREE.Vector3(0, 0, 0.95 * SCALE));
  const methyl13 = createAtom(methyl13Pos.x, methyl13Pos.y, methyl13Pos.z, 0x404040, 0.32);
  group.add(methyl13);
  group.add(createBond(ringC[1].position, methyl13.position));

  // Alkyl tail from ringD[2] (C17) — zig-zag, alternate puckering for clarity
  let prev = ringD[2].position.clone();
  const tailSteps = [
    new THREE.Vector3(1.05 * SCALE, 0.05 * SCALE, 0.65 * SCALE),
    new THREE.Vector3(1.05 * SCALE, -0.15 * SCALE, -0.6 * SCALE),
    new THREE.Vector3(1.05 * SCALE, 0.2 * SCALE, 0.55 * SCALE),
    new THREE.Vector3(0.95 * SCALE, -0.05 * SCALE, -0.45 * SCALE),
    new THREE.Vector3(0.95 * SCALE, 0.15 * SCALE, 0.35 * SCALE)
  ];

  for (let i = 0; i < tailSteps.length; i++) {
    const pos = prev.clone().add(tailSteps[i]);
    const t = createAtom(pos.x, pos.y, pos.z, 0x404040, 0.30);
    group.add(t);
    group.add(createBond(prev, t.position));
    prev = t.position.clone();
  }

  // Small hydrogens for silhouette
  const h1Pos = ringA[1].position.clone().add(new THREE.Vector3(-0.45 * SCALE, -0.25 * SCALE, -0.25 * SCALE));
  const h1 = createAtom(h1Pos.x, h1Pos.y, h1Pos.z, 0xffffff, 0.22);
  group.add(h1);
  group.add(createBond(ringA[1].position, h1.position));

  const h2Pos = ringC[4].position.clone().add(new THREE.Vector3(0.45 * SCALE, 0.25 * SCALE, 0.25 * SCALE));
  const h2 = createAtom(h2Pos.x, h2Pos.y, h2Pos.z, 0xffffff, 0.22);
  group.add(h2);
  group.add(createBond(ringC[4].position, h2.position));

  return group;
};



  const moleculeBuilders = {
    glucose: makeGlucose,
    alanine: makeAlanine,
    atp: makeATP,
    dna: makeDNA,
    dnacg: makeDNACG,
    acetylcoa: makeAcetylCoA,
    tryptophan: makeTryptophan,
    cholesterol: makeCholesterol,
    alphahelix: makeAlphaHelix
  };

  // Initialize Three.js scene
  useEffect(() => {
    if (!canvasRef.current) return;

    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x0f0f1e);

    const camera = new THREE.PerspectiveCamera(
      75,
      canvasRef.current.clientWidth / canvasRef.current.clientHeight,
      0.1,
      1000
    );
    camera.position.z = 15;

    const renderer = new THREE.WebGLRenderer({ canvas: canvasRef.current, antialias: true });
    renderer.setSize(canvasRef.current.clientWidth, canvasRef.current.clientHeight);

    const light1 = new THREE.AmbientLight(0xffffff, 0.7);
    const light2 = new THREE.DirectionalLight(0xffffff, 0.8);
    light2.position.set(10, 10, 10);
    scene.add(light1, light2);

    sceneRef.current = scene;
    cameraRef.current = camera;
    rendererRef.current = renderer;

    // Mouse controls using ref to avoid state closure issues
    const handleMouseDown = (e) => {
      dragStateRef.current.isDragging = true;
      dragStateRef.current.prevX = e.clientX;
      dragStateRef.current.prevY = e.clientY;
    };

    const handleMouseMove = (e) => {
      if (!dragStateRef.current.isDragging || !molRef.current) return;
      const deltaX = e.clientX - dragStateRef.current.prevX;
      const deltaY = e.clientY - dragStateRef.current.prevY;
      molRef.current.rotation.y += deltaX * 0.005;
      molRef.current.rotation.x += deltaY * 0.005;
      dragStateRef.current.prevX = e.clientX;
      dragStateRef.current.prevY = e.clientY;
    };

    const handleMouseUp = () => {
      dragStateRef.current.isDragging = false;
    };

    canvasRef.current.addEventListener("mousedown", handleMouseDown);
    canvasRef.current.addEventListener("mousemove", handleMouseMove);
    canvasRef.current.addEventListener("mouseup", handleMouseUp);
    canvasRef.current.addEventListener("mouseleave", handleMouseUp);

    // Zoom with scroll
    canvasRef.current.addEventListener(
      "wheel",
      (e) => {
        e.preventDefault();
        camera.position.z += e.deltaY * 0.01;
        camera.position.z = Math.max(5, Math.min(30, camera.position.z));
      },
      { passive: false }
    );

    // Load saved views
    const views = JSON.parse(localStorage.getItem("molViews") || "[]");
    setSavedViews(views);

    // Animation loop
    const animate = () => {
      requestAnimationFrame(animate);
      if (molRef.current && !dragStateRef.current.isDragging) {
        molRef.current.rotation.x += rotSpeed.x * 0.5;
        molRef.current.rotation.y += rotSpeed.y * 0.5;
      }
      renderer.render(scene, camera);
    };
    animate();

    // Load initial molecule
    loadMolecule(currentMol);

    // Cleanup on unmount
    return () => {
      renderer.dispose();
    };
  }, []);

  const loadMolecule = (name) => {
    if (!sceneRef.current) return;

    // Remove previous molecule
    if (molRef.current) {
      sceneRef.current.remove(molRef.current);
      molRef.current.traverse((node) => {
        if (node.geometry) node.geometry.dispose();
        if (node.material) node.material.dispose();
      });
    }

    // Create new molecule
    const builder = moleculeBuilders[name];
    if (builder) {
      const mol = builder();
      sceneRef.current.add(mol);
      molRef.current = mol;
      setCurrentMol(name);
      setInfo(molRegistry[name]);
    }
  };

  const saveView = () => {
    if (!viewName.trim() || !molRef.current) return;

    const view = {
      id: Date.now(),
      name: viewName,
      molecule: currentMol,
      rotation: {
        x: molRef.current.rotation.x,
        y: molRef.current.rotation.y,
        z: molRef.current.rotation.z
      },
      zoom: cameraRef.current.position.z,
      time: new Date().toISOString()
    };

    const updated = [...savedViews, view];
    setSavedViews(updated);
    localStorage.setItem("molViews", JSON.stringify(updated));
    setViewName("");
  };

  const restoreView = (view) => {
    loadMolecule(view.molecule);
    setTimeout(() => {
      if (molRef.current) {
        molRef.current.rotation.x = view.rotation.x;
        molRef.current.rotation.y = view.rotation.y;
        molRef.current.rotation.z = view.rotation.z;
      }
      if (cameraRef.current) {
        cameraRef.current.position.z = view.zoom;
      }
    }, 100);
  };

  const deleteView = (id) => {
    const updated = savedViews.filter((v) => v.id !== id);
    setSavedViews(updated);
    localStorage.setItem("molViews", JSON.stringify(updated));
  };

  return (
    <div className="molecule-viewer">
      <div className="mv-canvas-container">
        <canvas ref={canvasRef} className="mv-canvas"></canvas>
        <div className="mv-info">
          {info.title && (
            <>
              <h3>{info.title}</h3>
              <p><strong>Type:</strong> {info.type}</p>
              <p><strong>Role:</strong> {info.role}</p>
              <p><strong>Structure:</strong> {info.struct}</p>
              <p><strong>Features:</strong> {info.feat}</p>
            </>
          )}
        </div>
      </div>

      <div className="mv-controls">
        <div className="mv-section">
          <h4>Molecules</h4>
          <div className="mv-molecules">
            {Object.keys(molRegistry).map((key) => (
              <button
                key={key}
                className={`mv-mol-btn ${currentMol === key ? "active" : ""}`}
                onClick={() => loadMolecule(key)}
              >
                {molRegistry[key].title.split("(")[0]}
              </button>
            ))}
          </div>
        </div>

        <div className="mv-section">
          <h4>Save View</h4>
          <div className="mv-form">
            <input
              type="text"
              value={viewName}
              onChange={(e) => setViewName(e.target.value)}
              placeholder="View name"
              className="mv-input"
            />
            <button onClick={saveView} className="mv-btn">
              Save
            </button>
          </div>
        </div>

        <div className="mv-section">
          <h4>Saved Views ({savedViews.length})</h4>
          <div className="mv-views">
            {savedViews.length === 0 ? (
              <p style={{ opacity: 0.6, fontSize: "0.9em" }}>No saved views</p>
            ) : (
              savedViews.map((view) => (
                <div key={view.id} className="mv-view-item">
                  <div>
                    <strong>{view.name}</strong>
                    <div style={{ fontSize: "0.8em", opacity: 0.7 }}>
                      {view.molecule} • {new Date(view.time).toLocaleDateString()}
                    </div>
                  </div>
                  <div className="mv-view-actions">
                    <button className="mv-vbtn" onClick={() => restoreView(view)}>
                      Load
                    </button>
                    <button
                      className="mv-vbtn mv-vbtn-del"
                      onClick={() => deleteView(view.id)}
                    >
                      Delete
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default MoleculeViewer;
