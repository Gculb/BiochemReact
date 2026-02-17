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

  // ─── Helpers ──────────────────────────────────────────────────────────────
  const SC  = 1.1;
  const COL = { C:0x404040, N:0x3050f8, O:0xff3030, P:0xffa500, H:0xffffff };
  const SZ  = { C:0.30,     N:0.32,     O:0.32,     P:0.44,     H:0.18    };

  const mk = (x, y, el, z = 0) => {
    const a = createAtom(x*SC, y*SC, z*SC, COL[el], SZ[el]);
    group.add(a);
    return a;
  };
  const bond = (a, b) => group.add(createBond(a.position, b.position));




  // ── 1. PYRIMIDINE RING  N1-C2-N3-C4-C5-C6 ────────────────────────────────
  const C4  = mk( 0.000,  0.500, 'C');
  const N3  = mk(-0.866,  1.000, 'N');
  const C2  = mk(-1.732,  0.500, 'C');
  const N1  = mk(-1.732, -0.500, 'N');
  const C6  = mk(-0.866, -1.000, 'C');
  const C5  = mk( 0.000, -0.500, 'C');
  bond(C4,N3); bond(N3,C2); bond(C2,N1); bond(N1,C6); bond(C6,C5); bond(C5,C4);


  // ── 2. IMIDAZOLE RING  C4-N7-C8-N9-C5  (fused at shared C4–C5 bond) ──────
  // ±z offsets prevent N7/N9 from appearing stacked (they share the same x coordinate)
  const N7  = mk( 0.951,  0.809, 'N',  0.35);
  const C8  = mk( 1.539,  0.000, 'C');
  const N9  = mk( 0.951, -0.809, 'N', -0.35);
  bond(C4,N7); bond(N7,C8); bond(C8,N9); bond(N9,C5);


  // ── 3. ADENINE SUBSTITUENTS ───────────────────────────────────────────────
  // NH₂ on C6 (exocyclic amino group)
  const NH2N = mk(-0.866, -1.950, 'N');
  const NH2a = mk(-1.516, -2.423, 'H');
  const NH2b = mk(-0.216, -2.423, 'H');
  bond(C6,NH2N); bond(NH2N,NH2a); bond(NH2N,NH2b);

  // H on C2 and C8
  bond(C2, mk(-3.204,  1.350, 'H'));
  bond(C8, mk( 2.389,  0.000, 'H'));


  // ── 4. RIBOSE  O4′-C1′-C2′-C3′-C4′ ──────────────────────────────────────
  const C1p = mk( 1.2931, -1.7487, 'C');
  const O4p = mk( 2.2267, -2.1071, 'O');
  const C4p = mk( 2.1743, -3.1057, 'C');
  const C3p = mk( 1.2084, -3.3645, 'C');
  const C2p = mk( 0.6638, -2.5259, 'C');

  bond(N9,C1p);   // glycosidic bond
  bond(C1p,O4p); bond(O4p,C4p);
  bond(C4p,C3p); bond(C3p,C2p); bond(C2p,C1p);

  // 2′-OH
  const O2p = mk(-0.3349, -2.4735, 'O');
  bond(C2p, O2p);
  bond(O2p, mk(-0.8889, -2.4305, 'H'));

  // 3′-OH  (ATP has a free 3′-OH, unlike ACoA which has a 3′-phosphate)
  const O3p = mk( 0.8500, -4.2981, 'O');
  bond(C3p, O3p);
  bond(O3p, mk( 0.4917, -5.0000, 'H'));

  // C5′ exocyclic off C4′
  const C5p = mk( 2.9515, -3.7350, 'C');
  bond(C4p, C5p);


  // ── 5. TRIPHOSPHATE CHAIN  C5′–O5′–Pα–O–Pβ–O–Pγ ─────────────────────────
  // Each bond = 0.9 units in the C4′→C5′ outward direction (−39°).
  // Bridging oxygens sit between each phosphorus pair.
  // Terminal oxygens branch ±90° (perpendicular to chain direction).
  //
  // All positions pre-verified; min terminal-O separation = 1.27 (no overlap).

  // O5′ (5′-oxygen, between C5′ and Pα)
  const O5p = mk( 3.6509, -4.3014, 'O');
  bond(C5p, O5p);

  // Pα
  const Pa  = mk( 4.3503, -4.8678, 'P');
  bond(O5p, Pa);
  bond(Pa, mk( 4.9167, -4.1684, 'O'));   // terminal O (toward viewer side)
  bond(Pa, mk( 3.7839, -5.5672, 'O'));   // terminal O (away side)

  // Bridging O between Pα and Pβ  (the high-energy bond #1)
  const Ob1 = mk( 5.0498, -5.4342, 'O');
  bond(Pa, Ob1);

  // Pβ
  const Pb  = mk( 5.7492, -6.0006, 'P');
  bond(Ob1, Pb);
  bond(Pb, mk( 6.3156, -5.3011, 'O'));   // terminal O
  bond(Pb, mk( 5.1828, -6.7000, 'O'));   // terminal O

  // Bridging O between Pβ and Pγ  (the high-energy bond #2)
  const Ob2 = mk( 6.4486, -6.5670, 'O');
  bond(Pb, Ob2);

  // Pγ  (terminal phosphate — released as Pi on hydrolysis)
  const Pg  = mk( 7.1481, -7.1334, 'P');
  bond(Ob2, Pg);
  bond(Pg, mk( 7.7144, -6.4339, 'O'));   // terminal O
  bond(Pg, mk( 6.5817, -7.8328, 'O'));   // terminal O
  bond(Pg, mk( 7.8475, -7.6997, 'O'));   // terminal O (end of chain)

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


  const backbone = []; 

  for (let i = 0; i < residues; i++) {
    const angle = i * turn;

    const caPos = new THREE.Vector3(
      Math.cos(angle) * radius,
      i * rise,
      Math.sin(angle) * radius
    );

    // N is slightly behind and below Cα on the helix tangent
    const nPos = caPos.clone().add(
      new THREE.Vector3(Math.cos(angle - 0.3) * 0.6, -0.3, Math.sin(angle - 0.3) * 0.6)
    );

    // C is slightly ahead and above Cα
    const cPos = caPos.clone().add(
      new THREE.Vector3(Math.cos(angle + 0.3) * 0.6, 0.3, Math.sin(angle + 0.3) * 0.6)
    );

   
    // Offset radially outward and slightly upward from the C atom
    const oPos = cPos.clone().add(
      new THREE.Vector3(Math.cos(angle + 0.3) * 0.55, 0.4, Math.sin(angle + 0.3) * 0.55)
    );

    const n  = createAtom(nPos.x,  nPos.y,  nPos.z,  0x3050f8, 0.32); // blue  - nitrogen
    const ca = createAtom(caPos.x, caPos.y, caPos.z, 0xaaaaaa, 0.38); // grey  - alpha carbon
    const c  = createAtom(cPos.x,  cPos.y,  cPos.z,  0x404040, 0.30); // dark  - carbonyl carbon
    const o  = createAtom(oPos.x,  oPos.y,  oPos.z,  0xff3030, 0.28); // red   - carbonyl oxygen

    group.add(n, ca, c, o);


    group.add(createBond(nPos, caPos));   
    group.add(createBond(caPos, cPos));   
    group.add(createBond(cPos, oPos));    // C=O  (carbonyl)

   
    if (i > 0) {
      group.add(createBond(backbone[i - 1].c.position, nPos));
    }

    backbone.push({ n, ca, c, o, nPos, cPos, oPos });
  }


  for (let i = 4; i < residues; i++) {
    const donor    = backbone[i].nPos;       
    const acceptor = backbone[i - 4].oPos;   
    group.add(createBond(donor, acceptor, 0x00dd88));
  }

  return group;
};

const makeAcetylCoA = () => {
  const group = new THREE.Group();

  // ─── Helpers ──────────────────────────────────────────────────────────────
  const SC  = 1.1;  // world-units per bond-length unit
  const COL = { C:0x404040, N:0x3050f8, O:0xff3030, P:0xffa500, S:0xffdd00, H:0xffffff };
  const SZ  = { C:0.30,     N:0.32,     O:0.32,     P:0.42,     S:0.44,     H:0.18    };

  const mk = (x, y, el, z = 0) => {
    const a = createAtom(x*SC, y*SC, z*SC, COL[el], SZ[el]);
    group.add(a);
    return a;
  };
  const bond = (a, b) => group.add(createBond(a.position, b.position));




  // ── 1. PYRIMIDINE RING  N1-C2-N3-C4-C5-C6 ────────────────────────────────
  const C4  = mk( 0.000,  0.500, 'C');
  const N3  = mk(-0.866,  1.000, 'N');
  const C2  = mk(-1.732,  0.500, 'C');
  const N1  = mk(-1.732, -0.500, 'N');
  const C6  = mk(-0.866, -1.000, 'C');
  const C5  = mk( 0.000, -0.500, 'C');
  bond(C4,N3); bond(N3,C2); bond(C2,N1); bond(N1,C6); bond(C6,C5); bond(C5,C4);



  const N7  = mk( 0.951,  0.809, 'N',  0.35);
  const C8  = mk( 1.539,  0.000, 'C');
  const N9  = mk( 0.951, -0.809, 'N', -0.35);
  bond(C4,N7); bond(N7,C8); bond(C8,N9); bond(N9,C5);


  const NH2N = mk(-0.866, -1.950, 'N');
  const NH2a = mk(-1.516, -2.423, 'H');
  const NH2b = mk(-0.216, -2.423, 'H');
  bond(C6,NH2N); bond(NH2N,NH2a); bond(NH2N,NH2b);


  const HC2  = mk(-3.204,  1.350, 'H');
  bond(C2,HC2);


  const HC8  = mk( 2.389,  0.000, 'H');
  bond(C8,HC8);

  //4. Ribose
  const C1p = mk( 1.2931, -1.7487, 'C');
  const O4p = mk( 2.2267, -2.1071, 'O');
  const C4p = mk( 2.1743, -3.1057, 'C');
  const C3p = mk( 1.2084, -3.3645, 'C');
  const C2p = mk( 0.6638, -2.5259, 'C');

  bond(N9, C1p);                              // glycosidic bond
  bond(C1p,O4p); bond(O4p,C4p);
  bond(C4p,C3p); bond(C3p,C2p); bond(C2p,C1p);

  // 2′-OH (outward from C2′)
  const O2p = mk(-0.3349, -2.4735, 'O');
  const H2p = mk(-0.8889, -2.4305, 'H');
  bond(C2p,O2p); bond(O2p,H2p);

  // 3′-O → 3′-phosphate
  const O3p = mk( 0.8500, -4.2981, 'O');
  bond(C3p,O3p);

  // C5′ exocyclic off C4′ (outward, toward phosphate chain)
  const C5p = mk( 2.9515, -3.7350, 'C');
  bond(C4p,C5p);


  // ── 5. 3′-PHOSPHATE ───────────────────────────────────────────────────────
  const P3  = mk( 0.4917, -5.2317, 'P');
  bond(O3p, P3);
  bond(P3, mk( 0.6883, -6.0586, 'O'));
  bond(P3, mk(-0.2078, -5.7146, 'O'));
  bond(P3, mk( 0.7963, -4.4381, 'O'));


  // ── 6. 5′-PYROPHOSPHATE  Pa–O–Pb ─────────────────────────────────────────
  const Pa     = mk( 3.8840, -4.4902, 'P');
  bond(C5p, Pa);
  bond(Pa, mk( 3.8840, -3.6402, 'O'));    // terminal O up
  bond(Pa, mk( 3.8840, -5.3402, 'O'));    // terminal O down

  const PbO    = mk( 4.4280, -4.9307, 'O');
  bond(Pa, PbO);

  const Pb     = mk( 4.9720, -5.3713, 'P');
  bond(PbO, Pb);
  bond(Pb, mk( 4.9720, -4.5213, 'O'));    // terminal O up
  bond(Pb, mk( 4.9720, -6.2213, 'O'));    // terminal O down


  // ── 7. PANTETHEINE ARM  ───────────────────────────────────────────────────

  let wx = 4.9720, wy = -5.3713;

  const step = (el, dy) => {
    wx += 1.05; wy += dy;
    return mk(wx, wy, el);
  };
  const DY = 0.42;

  const PbLink = step('O', +DY);  bond(Pb,     PbLink);
  const pantC1 = step('C', -DY);  bond(PbLink, pantC1);
  const pantC2 = step('C', +DY);  bond(pantC1, pantC2);
  const amC1   = step('C', -DY);  bond(pantC2, amC1);
  bond(amC1, mk(wx, wy - 0.88, 'O'));          // first amide C=O (down)

  const amN1   = step('N', +DY);  bond(amC1,   amN1);
  bond(amN1,   mk(wx + 0.15, wy + 0.85, 'H')); // N-H

  const betC1  = step('C', -DY);  bond(amN1,   betC1);
  const betC2  = step('C', +DY);  bond(betC1,  betC2);
  const amC2   = step('C', -DY);  bond(betC2,  amC2);
  bond(amC2,   mk(wx, wy - 0.88, 'O'));         // second amide C=O (down)

  const amN2   = step('N', +DY);  bond(amC2,   amN2);
  bond(amN2,   mk(wx + 0.15, wy + 0.85, 'H')); // N-H

  const cysC1  = step('C', -DY);  bond(amN2,   cysC1);
  const cysC2  = step('C', +DY);  bond(cysC1,  cysC2);
  const sulfur = step('S', -0.30); bond(cysC2,  sulfur);


  // ── 8. ACETYL GROUP  CH₃–C(=O)–S  (the reactive thioester) ──────────────
  const thioC  = step('C', +0.30); bond(sulfur, thioC);
  bond(thioC,  mk(wx, wy - 0.88, 'O'));         // thioester C=O (down)

  const methyl = step('C', +DY);   bond(thioC,  methyl);
  bond(methyl, mk(wx + 0.55, wy + 0.60, 'H'));
  bond(methyl, mk(wx + 0.55, wy - 0.50, 'H'));
  bond(methyl, mk(wx,        wy + 0.30, 'H', 0.60));

  return group;
};

const makeTryptophan = () => {
  const group = new THREE.Group();
  const SCALE = 1.6;

  const at = (x, y, z, el) => {
    const styles = {
      C: [0x404040, 0.40],
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



  const ca  = at( 0.0,  0.0, 0, "C");
  const haC = at( 0.0,  1.0, 0, "H"); 
  link(ca, haC);

  // Amino group NH2
  const n   = at(-1.2,  0.0, 0, "N");
  const hn1 = at(-1.8,  0.8, 0, "H");
  const hn2 = at(-1.8, -0.8, 0, "H");
  link(ca, n);
  link(n, hn1);
  link(n, hn2);

  // Carboxyl group — asymmetric: C=O (carbonyl) and C-OH (hydroxyl)
  const coo  = at( 1.3,  0.0,  0,    "C");
  const oC   = at( 1.9,  0.9,  0,    "O");  // C=O  (carbonyl, no H)
  const oH   = at( 1.9, -0.9,  0,    "O");  // C-OH (hydroxyl)
  const hoH  = at( 2.8, -0.9,  0,    "H");  // H on the OH
  link(ca, coo);
  link(coo, oC);   // double bond — rendered same visually, but oC has no H
  link(coo, oH);
  link(oH, hoH);

  // ── Side chain: Cβ (CH2 bridge to indole) ─────────────────────────────────
  const cb  = at( 0.0, -1.3,  0,    "C");
  const hb1 = at(-0.7, -1.8,  0.5,  "H");
  const hb2 = at( 0.7, -1.8,  0.5,  "H");
  link(ca, cb);
  link(cb, hb1);
  link(cb, hb2);


  // Benzene ring — 6-membered, placed below Cβ
  const b1 = at( 0.7, -3.1, 0, "C");  // C7a — fusion atom shared with pyrrole
  const b2 = at( 0.7, -4.5, 0, "C");  // C3a — fusion atom shared with pyrrole
  const b3 = at( 1.8, -5.2, 0, "C");
  const b4 = at( 3.0, -4.5, 0, "C");
  const b5 = at( 3.0, -3.1, 0, "C");
  const b6 = at( 1.8, -2.4, 0, "C");

 
  link(b1, b2);
  link(b2, b3);
  link(b3, b4);
  link(b4, b5);
  link(b5, b6);
  link(b6, b1);


  const hb = [b3, b4, b5, b6].map(atom => {
    const pos = atom.position;
    // push H outward from benzene center (~x=1.85, y=-3.8)
    const dx = (pos.x - 1.85 * SCALE) * 0.35;
    const dy = (pos.y + 3.80 * SCALE) * 0.35;
    const h = createAtom(pos.x + dx, pos.y + dy, 0, 0xffffff, 0.22);
    group.add(h);
    group.add(createBond(pos, h.position));
    return h;
  });


  const c2   = at(-0.5, -3.8, 0, "C");  // C2 — bonded to Cβ
  const c3   = at(-0.5, -4.8, 0, "C");  // C3
  const indN = at( 0.1, -5.6, 0, "N");  // indole N (NH)
  const hn   = at( 0.1, -6.5, 0, "H");  // N-H (the characteristic indole NH)

  link(c2,   b1);
  link(b2,   indN);
  link(indN, c3);
  link(c3,   c2);

  link(indN, hn);

  const hc2 = at(-1.35, -3.4, 0, "H");
  const hc3 = at(-1.35, -5.2, 0, "H");
  link(c2, hc2);
  link(c3, hc3);


  link(cb, c2);

  return group;
};
      const makeCholesterol = () => {
        const group = new THREE.Group();

  
        const S        = 0.9;
        const r        = 1.2 * S;                          
        const hexStep  = r * Math.sqrt(3);                  
        const pentR    = r / (2 * Math.sin(Math.PI / 5));   
        const apothem  = pentR * Math.cos(Math.PI / 5);     
        const PUCK_HEX = 0.22 * S;                          
        const PUCK_PNT = 0.18 * S;                          


        const makeHexRing = (cx, cy) => {
          const atoms = Array.from({ length: 6 }, (_, i) => {
            const angle  = Math.PI / 6 + i * (Math.PI / 3);
            const pucker = (i % 2 === 0 ? PUCK_HEX : -PUCK_HEX);
            const a = createAtom(
              cx + r * Math.cos(angle),
              cy + r * Math.sin(angle),
              pucker,
              0x404040, 0.35
            );
            group.add(a);
            return a;
          });
          for (let i = 0; i < 6; i++) {
            group.add(createBond(atoms[i].position, atoms[(i + 1) % 6].position));
          }
          return atoms;
        };

        // Pentagon fused to the right edge of ring C (atoms C[0] upper and C[5] lower).
        // Atom 0 coincides with C[5], atom 1 coincides with C[0].
        // Remaining atoms 2-4 are new and extend to the right.
        const makePentRing = (sharedTop, sharedBottom) => {
          // Pentagon center lies on the perpendicular bisector of the shared edge, to the right.
          const midX   = (sharedTop.position.x + sharedBottom.position.x) / 2;
          const midY   = (sharedTop.position.y + sharedBottom.position.y) / 2;
          const pentCx = midX + apothem;   // +x = to the right of ring C
          const pentCy = midY;

          // Angle from pentagon center to the lower shared atom (= D[0] start angle).
          const startAngle = Math.atan2(
            sharedBottom.position.y - pentCy,
            sharedBottom.position.x - pentCx
          );

          // Build 5 atoms going clockwise (-72° per step) so:
          //   D[0] → sharedBottom (= C[5])
          //   D[1] → sharedTop    (= C[0])
          //   D[2..4] → new atoms extending right
          const atoms = Array.from({ length: 5 }, (_, i) => {
            // D[0] and D[1] reuse the already-existing shared atoms
            if (i === 0) return sharedBottom;
            if (i === 1) return sharedTop;
            const angle  = startAngle - i * (2 * Math.PI / 5);
            const pucker = (i % 2 === 0 ? PUCK_PNT : -PUCK_PNT);
            const a = createAtom(
              pentCx + pentR * Math.cos(angle),
              pentCy + pentR * Math.sin(angle),
              pucker,
              0x404040, 0.35
            );
            group.add(a);
            return a;
          });
          for (let i = 0; i < 5; i++) {
            group.add(createBond(atoms[i].position, atoms[(i + 1) % 5].position));
          }
          return atoms;
        };
        //build four rings
        const ringA = makeHexRing(0, 0);
        const ringB = makeHexRing(hexStep, 0);
        const ringC = makeHexRing(2 * hexStep, 0);
        const ringD = makePentRing(ringC[0], ringC[5]);

     

        // ─── Substituents ─────────────────────────────────────────────────────────

        // OH group on C3 (ring A, atom [1] — upper-left, β-face points +Z)
        const c3     = ringA[1];
        const ohPos  = c3.position.clone().add(new THREE.Vector3(0, 0.9 * S, 0.3 * S));
        const oh     = createAtom(ohPos.x, ohPos.y, ohPos.z, 0xff3030, 0.42);
        group.add(oh);
        group.add(createBond(c3.position, oh.position));

        // Small H on the OH
        const hOhPos = ohPos.clone().add(new THREE.Vector3(0, 0.5 * S, 0.2 * S));
        const hOh    = createAtom(hOhPos.x, hOhPos.y, hOhPos.z, 0xffffff, 0.22);
        group.add(hOh);
        group.add(createBond(oh.position, hOh.position));

        // Angular methyl at C10 (shared junction atom ringA[0] == ringB[2]), β-face
        const c10    = ringA[0];
        const me10   = createAtom(c10.position.x, c10.position.y, c10.position.z + 0.95 * S, 0x404040, 0.30);
        group.add(me10);
        group.add(createBond(c10.position, me10.position));

        // Angular methyl at C13 (shared junction atom ringB[0] == ringC[2]), β-face
        const c13    = ringB[0];
        const me13   = createAtom(c13.position.x, c13.position.y, c13.position.z + 0.95 * S, 0x404040, 0.30);
        group.add(me13);
        group.add(createBond(c13.position, me13.position));

        // 8-carbon isooctyl tail from C17 (ring D, atom [2])
        // Zig-zags in XY with slight Z alternation, heading generally in +X
        const tailSteps = [
          new THREE.Vector3( 1.10 * S,  0.30 * S,  0.30 * S),
          new THREE.Vector3( 1.10 * S, -0.30 * S, -0.30 * S),
          new THREE.Vector3( 1.05 * S,  0.25 * S,  0.25 * S),
          new THREE.Vector3( 1.05 * S, -0.20 * S, -0.25 * S),
          new THREE.Vector3( 1.00 * S,  0.20 * S,  0.20 * S),
          new THREE.Vector3( 1.00 * S, -0.15 * S, -0.20 * S),
          new THREE.Vector3( 0.90 * S,  0.10 * S,  0.15 * S),
          new THREE.Vector3( 0.90 * S, -0.10 * S, -0.15 * S),
        ];

        let prevPos = ringD[2].position.clone();
        for (const step of tailSteps) {
          const pos  = prevPos.clone().add(step);
          const atom = createAtom(pos.x, pos.y, pos.z, 0x404040, 0.28);
          group.add(atom);
          group.add(createBond(prevPos, atom.position));
          prevPos = pos;
        }

        // Isopropyl branch: add one extra methyl at the second-to-last tail carbon
        // (approximate C24 branching, giving cholesterol's isooctyl shape)
        const branchBase = prevPos.clone().add(new THREE.Vector3(-0.90 * S, 0, 0));
        const branchAtom = createAtom(
          branchBase.x + 0.5 * S,
          branchBase.y + 0.6 * S,
          branchBase.z + 0.2 * S,
          0x404040, 0.26
        );
        group.add(branchAtom);
        group.add(createBond(branchBase, branchAtom.position));

        // Small axial H for visual depth on ring A
        const hAxPos = ringA[3].position.clone().add(new THREE.Vector3(-0.35 * S, -0.20 * S, -0.35 * S));
        const hAx    = createAtom(hAxPos.x, hAxPos.y, hAxPos.z, 0xffffff, 0.20);
        group.add(hAx);
        group.add(createBond(ringA[3].position, hAx.position));

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
