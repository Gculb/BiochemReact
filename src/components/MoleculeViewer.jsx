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

    // Amino acid backbone
    const nPos = [-2.5, 0.6, 0];
    const n = createAtom(...nPos, 0x0000ff, 0.45);
    group.add(n);

    const caPos = [0, 0, 0];
    const ca = createAtom(...caPos, 0xaaaaaa, 0.5);
    group.add(ca);
    group.add(createBond(n.position, ca.position));

    const cPos = [2.3, 0.6, 0];
    const c = createAtom(...cPos, 0x333333, 0.45);
    group.add(c);
    group.add(createBond(ca.position, c.position));

    const oPos = [3.2, 1.4, 0];
    const o = createAtom(...oPos, 0xff3030, 0.5);
    group.add(o);
    group.add(createBond(c.position, o.position));

    // Indole aromatic side chain
    const cbPos = [0, -1.5, 0];
    const cb = createAtom(...cbPos, 0x404040, 0.45);
    group.add(cb);
    group.add(createBond(ca.position, cb.position));

    // 6-membered benzene-like ring
    const benzeneAtoms = [];
    const benzenePos = [
      [-1, -2.4], [-1.9, -1.8], [-1.9, -0.6], 
      [-1, 0], [0, -0.6], [0, -2.4]
    ];
    benzenePos.forEach((pos, i) => {
      const isN = i === 4;
      const atom = createAtom(pos[0], pos[1], 0, isN ? 0x0000ff : 0x404040, 0.35);
      benzeneAtoms.push(atom);
      group.add(atom);
    });
    for (let i = 0; i < benzeneAtoms.length; i++) {
      group.add(createBond(benzeneAtoms[i].position, benzeneAtoms[(i + 1) % benzeneAtoms.length].position));
    }

    // 5-membered pyrrole ring (fused)
    const pyrroleAtoms = [];
    const pyrrolePos = [
      [0, -1.5], [1, -2.1], [1.5, -0.9], 
      [0.7, 0], [-0.2, -0.5]
    ];
    pyrrolePos.forEach((pos, i) => {
      const isN = i === 4;
      const atom = createAtom(pos[0], pos[1], 0, isN ? 0x0000ff : 0x404040, 0.35);
      pyrroleAtoms.push(atom);
      group.add(atom);
    });
    for (let i = 0; i < pyrroleAtoms.length; i++) {
      group.add(createBond(pyrroleAtoms[i].position, pyrroleAtoms[(i + 1) % pyrroleAtoms.length].position));
    }

    return group;
  };

  const makeCholesterol = () => {
    const group = new THREE.Group();
    const SCALE = 0.8;

    // 4 fused rings (simplified as columns of atoms)
    const ringA = [];
    const ringB = [];
    const ringC = [];
    const ringD = [];

    // Ring A (6 atoms)
    for (let i = 0; i < 6; i++) {
      const angle = (i * Math.PI * 2) / 6;
      const x = i * 0.8 * SCALE;
      const y = Math.sin(angle) * 1.2 * SCALE;
      const atom = createAtom(x, y, 0, 0x404040, 0.35);
      ringA.push(atom);
      group.add(atom);
    }

    // Ring B (6 atoms) - fused with ring A
    for (let i = 0; i < 6; i++) {
      const x = 3 * 0.8 * SCALE + i * 0.6 * SCALE;
      const y = 1.5 * SCALE * Math.sin(i * 0.5);
      const atom = createAtom(x, y, 0, 0x4d4d4d, 0.35);
      ringB.push(atom);
      group.add(atom);
    }

    // Ring C (6 atoms)
    for (let i = 0; i < 6; i++) {
      const x = 6 * 0.8 * SCALE + i * 0.6 * SCALE;
      const y = 1.5 * SCALE * Math.sin(i * 0.5 + 1);
      const atom = createAtom(x, y, 0, 0x595959, 0.35);
      ringC.push(atom);
      group.add(atom);
    }

    // Ring D (5 atoms) - 5-membered ring
    for (let i = 0; i < 5; i++) {
      const angle = (i * Math.PI * 2) / 5;
      const x = 8.5 * SCALE + Math.cos(angle) * SCALE;
      const y = 1.2 * SCALE + Math.sin(angle) * SCALE;
      const atom = createAtom(x, y, 0, 0x666666, 0.35);
      ringD.push(atom);
      group.add(atom);
    }

    // Bond rings
    for (let i = 0; i < ringA.length - 1; i++) {
      group.add(createBond(ringA[i].position, ringA[i + 1].position));
    }
    for (let i = 0; i < ringB.length - 1; i++) {
      group.add(createBond(ringB[i].position, ringB[i + 1].position));
    }
    for (let i = 0; i < ringC.length - 1; i++) {
      group.add(createBond(ringC[i].position, ringC[i + 1].position));
    }
    for (let i = 0; i < ringD.length - 1; i++) {
      group.add(createBond(ringD[i].position, ringD[i + 1].position));
    }
    group.add(createBond(ringD[ringD.length - 1].position, ringD[0].position));

    // Connect fused system
    group.add(createBond(ringA[ringA.length - 1].position, ringB[0].position));
    group.add(createBond(ringB[ringB.length - 1].position, ringC[0].position));
    group.add(createBond(ringC[ringC.length - 1].position, ringD[0].position));

    // Hydroxyl group
    const ohAtom = createAtom(-1.2 * SCALE, -1.5 * SCALE, 0, 0xff3030, 0.4);
    group.add(ohAtom);
    group.add(createBond(ringA[0].position, ohAtom.position));

    // Alkyl side chain
    const chainStart = ringD[2].position.clone();
    const chain1 = createAtom(chainStart.x + 1.2 * SCALE, chainStart.y, 0, 0x404040, 0.3);
    const chain2 = createAtom(chainStart.x + 2 * SCALE, chainStart.y + 0.6 * SCALE, 0, 0x404040, 0.3);
    group.add(chain1, chain2);
    group.add(createBond(chainStart, chain1.position));
    group.add(createBond(chain1.position, chain2.position));

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
