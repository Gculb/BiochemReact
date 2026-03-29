import React, { useEffect, useRef, useState, useCallback } from "react";

// ─── RCSB PDB API endpoints ───────────────────────────────────────────────────
const RCSB_META   = (id) => `https://data.rcsb.org/rest/v1/core/entry/${id}`;
const RCSB_ENTITY = (id) => `https://data.rcsb.org/rest/v1/core/polymer_entity/${id}/1`;
const RCSB_PDB    = (id) => `https://files.rcsb.org/download/${id}.pdb`;
const UNIPROT_SEARCH = (pdb) => `https://rest.uniprot.org/uniprotkb/search?query=database(PDB):${pdb}&format=json&fields=id,protein_name,gene_names,organism_name,cc_function,ft_domain,sequence,cc_disease,keyword&size=1`;

const PROTEINS = {
  "1MBN": { label: "Myoglobin",        class: "All-α",        bio: "Oxygen storage in muscle" },
  "4INS": { label: "Insulin",          class: "α + α",        bio: "Blood glucose regulation" },
  "1TIM": { label: "TIM Barrel",       class: "(β/α)₈",       bio: "Triosephosphate isomerase" },
  "2POR": { label: "Porin",            class: "All-β barrel", bio: "Outer membrane channel" },
  "3NIR": { label: "GFP",              class: "β-barrel",     bio: "Green fluorescent protein" },
  "1HHO": { label: "Hemoglobin",       class: "All-α",        bio: "O₂ transport (α₂β₂ tetramer)" },
  "1CAG": { label: "Collagen",         class: "Triple helix", bio: "Extracellular matrix structure" },
  "6LU7": { label: "SARS-CoV-2 Mpro", class: "α/β mixed",    bio: "Main protease, key drug target" },
  "5XNL": { label: "p53 DBD",          class: "β-sandwich",   bio: "Tumor suppressor DNA-binding domain", tier: "advanced" },
  "1UBQ": { label: "Ubiquitin",        class: "α+β",          bio: "Protein degradation tag" },
};

// Atom count thresholds for size warnings
const WARN_THRESHOLD  = 5000;
const BLOCK_THRESHOLD = 20000;

const SS_COLOR = { 0: "#8892a4", 1: "#5b9bd5", 2: "#f0a500" };
const SS_WIDTH = { 0: 2, 1: 5.5, 2: 4 };

// ─── Amino-acid mass table (monoisotopic, Da) ─────────────────────────────────
const AA_MASS = {
  A:89.09,R:174.20,N:132.12,D:133.10,C:121.16,E:147.13,Q:146.15,G:75.03,
  H:155.16,I:131.17,L:131.17,K:146.19,M:149.20,F:165.19,P:115.13,S:105.09,
  T:119.12,W:204.23,Y:181.19,V:117.15,
};

// Hydrophobicity (Kyte-Doolittle scale)
const KD = {
  A:1.8,R:-4.5,N:-3.5,D:-3.5,C:2.5,E:-3.5,Q:-3.5,G:-0.4,H:-3.2,
  I:4.5,L:3.8,K:-3.9,M:1.9,F:2.8,P:-1.6,S:-0.8,T:-0.7,W:-0.9,Y:-1.3,V:4.2,
};

function calcBioInfo(seq) {
  if (!seq) return null;
  const s = seq.toUpperCase().replace(/[^ACDEFGHIKLMNPQRSTVWY]/g,"");
  if (!s.length) return null;
  const mw = s.split("").reduce((sum,aa)=>sum+(AA_MASS[aa]||111),0) - 18.02*(s.length-1);
  const hydro = s.split("").reduce((sum,aa)=>sum+(KD[aa]||0),0)/s.length;
  const counts = {};
  for (const aa of s) counts[aa]=(counts[aa]||0)+1;
  const composition = Object.entries(counts)
    .sort((a,b)=>b[1]-a[1])
    .slice(0,5)
    .map(([aa,n])=>({ aa, pct: ((n/s.length)*100).toFixed(1) }));
  return { mw: (mw/1000).toFixed(2), hydro: hydro.toFixed(2), len: s.length, composition };
}

// ─── Fallback geometry builders ───────────────────────────────────────────────
function buildFallback(pdb) {
  const PI = Math.PI;
  const atoms = [];
  const helix = (len, ox, oy, oz, phaseDeg) => {
    for (let i = 0; i < len; i++) {
      const a = (phaseDeg + i * 100) * PI / 180;
      atoms.push([ox + 2.3 * Math.cos(a), oy + 2.3 * Math.sin(a), oz + i * 1.5, 1]);
    }
    atoms.push([0,0,0,0],[0,0,0,0],[0,0,0,0]);
  };
  if (pdb === "1MBN" || pdb === "1HHO") {
    [[16,0,0,0,0],[8,8,-5,28,45],[7,2,3,44,90],[6,-6,1,56,135],
     [9,-10,-4,67,180],[8,-4,-8,82,225],[7,4,-6,95,270],[5,8,2,108,315]]
      .forEach(([l,ox,oy,oz,p]) => helix(l,ox,oy,oz,p));
  } else if (pdb === "4INS") {
    helix(9, 0, 0, 0, 0); helix(10, 10, 0, 0, 0);
    for (let i = 0; i < 30; i++) {
      const a = i * 100 * PI / 180;
      atoms.push([2.3*Math.cos(a), -12+2.3*Math.sin(a), i*1.5-5, 1]);
    }
  } else if (pdb === "2POR") {
    for (let s = 0; s < 16; s++) {
      const sa = s*(2*PI/16), cx=10*Math.cos(sa), cy=10*Math.sin(sa);
      for (let j = 0; j < 14; j++) {
        const jj = s%2===0?j:13-j;
        atoms.push([cx+(j-7)*0.25*Math.sin(sa), cy+(j-7)*0.25*Math.cos(sa), jj*3.4-24, 2]);
      }
    }
  } else if (pdb === "1TIM") {
    for (let i = 0; i < 8; i++) {
      const ma=i*PI/4, br=7, cx=br*Math.cos(ma), cy=br*Math.sin(ma);
      for (let j = 0; j < 8; j++)
        atoms.push([cx-j*0.25*Math.cos(ma), cy-j*0.25*Math.sin(ma), j*3.4, 2]);
      const hcx=(br+5)*Math.cos(ma+PI/8), hcy=(br+5)*Math.sin(ma+PI/8);
      for (let j = 0; j < 12; j++) {
        const ha=j*100*PI/180;
        atoms.push([hcx+2.3*Math.cos(ha), hcy+2.3*Math.sin(ha), j*1.5+2, 1]);
      }
    }
  } else if (pdb === "1CAG") {
    [0, 2*PI/3, 4*PI/3].forEach(off => {
      for (let i = 0; i < 60; i++) {
        const t=i/59, ma=off+t*6*PI, sa=off+t*20*PI;
        atoms.push([(3+1.5*Math.cos(sa))*Math.cos(ma), (3+1.5*Math.cos(sa))*Math.sin(ma), i*0.86-26, 1]);
      }
    });
  } else {
    for (let s = 0; s < 11; s++) {
      const sa=s*(2*PI/11), cx=9*Math.cos(sa), cy=9*Math.sin(sa);
      for (let j = 0; j < 15; j++) {
        const jj=s%2===0?j:14-j;
        atoms.push([cx+(j-7)*0.2*Math.sin(sa), cy+(j-7)*0.2*Math.cos(sa), jj*3.4-25, 2]);
      }
    }
    helix(20, 0, 0, -15, 0);
  }
  return atoms;
}

// ─── PDB parser ───────────────────────────────────────────────────────────────
function parsePDB(text) {
  const ssMap = {}, atoms = [], lines = text.split("\n");
  lines.forEach(line => {
    const rec = line.slice(0,6).trim();
    if (rec==="HELIX") { const s=parseInt(line.slice(21,25)), e=parseInt(line.slice(33,37)); for(let i=s;i<=e;i++) ssMap[`A${i}`]=1; }
    else if (rec==="SHEET") { const s=parseInt(line.slice(22,26)), e=parseInt(line.slice(33,37)); for(let i=s;i<=e;i++) ssMap[`A${i}`]=2; }
  });
  lines.forEach(line => {
    if (line.slice(0,4)!=="ATOM") return;
    if (line.slice(12,16).trim()!=="CA") return;
    const chain=line[21], resSeq=parseInt(line.slice(22,26));
    const x=parseFloat(line.slice(30,38)), y=parseFloat(line.slice(38,46)), z=parseFloat(line.slice(46,54));
    if (isNaN(x)||isNaN(y)||isNaN(z)) return;
    atoms.push([x,y,z, ssMap[`${chain}${resSeq}`]||0]);
  });
  return atoms;
}

// Count total ATOM lines for size check
function countAtoms(text) {
  return text.split("\n").filter(l => l.startsWith("ATOM")).length;
}

// ─── 3D math ──────────────────────────────────────────────────────────────────
const centroid = (atoms) => {
  const n=atoms.length||1;
  return [atoms.reduce((s,a)=>s+a[0],0)/n, atoms.reduce((s,a)=>s+a[1],0)/n, atoms.reduce((s,a)=>s+a[2],0)/n];
};
const maxR = (atoms,c) => Math.max(...atoms.map(([x,y,z])=>Math.sqrt((x-c[0])**2+(y-c[1])**2+(z-c[2])**2)),1);
const rotY3 = ([x,y,z],a) => [Math.cos(a)*x+Math.sin(a)*z, y, -Math.sin(a)*x+Math.cos(a)*z];
const rotX3 = ([x,y,z],a) => [x, Math.cos(a)*y-Math.sin(a)*z, Math.sin(a)*y+Math.cos(a)*z];
function catmullRom(p0,p1,p2,p3,t) {
  return p0.map((_,i)=>0.5*((2*p1[i])+(-p0[i]+p2[i])*t+(2*p0[i]-5*p1[i]+4*p2[i]-p3[i])*t*t+(-p0[i]+3*p1[i]-3*p2[i]+p3[i])*t*t*t));
}
function spline(pts,steps=5) {
  if (pts.length<2) return pts;
  const out=[];
  for (let i=0;i<pts.length-1;i++) {
    const p0=pts[Math.max(0,i-1)],p1=pts[i],p2=pts[Math.min(pts.length-1,i+1)],p3=pts[Math.min(pts.length-1,i+2)];
    for (let s=0;s<steps;s++) out.push(catmullRom(p0,p1,p2,p3,s/steps));
  }
  out.push(pts[pts.length-1]);
  return out;
}
function hexRgba(hex,a) {
  const r=parseInt(hex.slice(1,3),16),g=parseInt(hex.slice(3,5),16),b=parseInt(hex.slice(5,7),16);
  return `rgba(${r},${g},${b},${a.toFixed(2)})`;
}

// ─── Inline styles ────────────────────────────────────────────────────────────
const S = {
  root: { display:"flex", height:"100vh", background:"#0d1117", color:"#c9d1d9", fontFamily:"'IBM Plex Mono', 'Fira Code', monospace", fontSize:"13px", overflow:"hidden" },
  sidebar: { width:"320px", minWidth:"260px", display:"flex", flexDirection:"column", background:"#111820", borderRight:"1px solid #1e2d3d", overflowY:"auto", flexShrink:0 },
  canvasWrap: { flex:1, position:"relative", display:"flex", flexDirection:"column" },
  canvas: { width:"100%", height:"100%", display:"block", cursor:"grab" },
  section: { padding:"12px 14px", borderBottom:"1px solid #1a2536" },
  sectionTitle: { fontSize:"10px", letterSpacing:"0.15em", textTransform:"uppercase", color:"#4a7fa5", marginBottom:"8px", fontWeight:700 },
  proteinBtn: (active) => ({
    display:"block", width:"100%", textAlign:"left", padding:"6px 10px",
    background: active ? "#1a3352" : "transparent",
    border: active ? "1px solid #2a5a8a" : "1px solid transparent",
    borderRadius:"4px", color: active ? "#7ec8e3" : "#8b9db0",
    cursor:"pointer", marginBottom:"3px", fontSize:"12px",
    transition:"all 0.15s",
  }),
  overlay: { position:"absolute", inset:0, display:"flex", alignItems:"center", justifyContent:"center", background:"rgba(13,17,23,0.85)", flexDirection:"column", gap:"12px", zIndex:10 },
  metaOverlay: { position:"absolute", top:"12px", left:"12px", background:"rgba(13,17,23,0.82)", border:"1px solid #1e2d3d", borderRadius:"6px", padding:"12px 14px", maxWidth:"240px", backdropFilter:"blur(6px)" },
  badge: { display:"inline-block", background:"#1a3352", color:"#5b9bd5", borderRadius:"3px", padding:"1px 6px", fontSize:"10px", marginLeft:"6px", fontFamily:"monospace" },
  ctrlBtn: (active) => ({
    position:"absolute", right:0, bottom:0, display:"flex", flexDirection:"column", gap:"4px", padding:"10px",
  }),
  btn: { padding:"5px 10px", background:"#1a3352", border:"1px solid #2a5a8a", color:"#7ec8e3", borderRadius:"4px", cursor:"pointer", fontSize:"12px" },
  btnSecondary: { padding:"5px 10px", background:"transparent", border:"1px solid #2a3a4a", color:"#8b9db0", borderRadius:"4px", cursor:"pointer", fontSize:"12px" },
  input: { background:"#0d1117", border:"1px solid #2a3a4a", color:"#c9d1d9", borderRadius:"4px", padding:"5px 9px", fontSize:"12px", width:"100%", boxSizing:"border-box", fontFamily:"inherit" },
  seq: { fontFamily:"'IBM Plex Mono', monospace", fontSize:"10px", lineHeight:"1.7", color:"#5b9bd5", wordBreak:"break-all", maxHeight:"100px", overflowY:"auto", background:"#0d1117", borderRadius:"4px", padding:"8px" },
  spinner: { width:"28px", height:"28px", border:"3px solid #1e2d3d", borderTop:"3px solid #5b9bd5", borderRadius:"50%", animation:"spin 0.8s linear infinite" },
  warnBox: { background:"#1a2a10", border:"1px solid #3a6a20", borderRadius:"6px", padding:"14px", maxWidth:"320px", textAlign:"center" },
  infoGrid: { display:"grid", gridTemplateColumns:"1fr 1fr", gap:"6px" },
  infoCell: { background:"#0d1117", borderRadius:"4px", padding:"8px", border:"1px solid #1a2536" },
  infoLabel: { fontSize:"9px", letterSpacing:"0.1em", textTransform:"uppercase", color:"#4a7fa5", marginBottom:"2px" },
  infoVal: { fontSize:"13px", color:"#c9d1d9", fontWeight:600 },
  barWrap: { height:"6px", background:"#1a2536", borderRadius:"3px", marginTop:"4px", overflow:"hidden" },
  tabBar: { display:"flex", borderBottom:"1px solid #1a2536" },
  tab: (active) => ({
    flex:1, padding:"8px 4px", background:active ? "#111820" : "transparent",
    border:"none", borderBottom: active ? "2px solid #5b9bd5" : "2px solid transparent",
    color: active ? "#7ec8e3" : "#4a6a80", cursor:"pointer", fontSize:"11px",
    letterSpacing:"0.08em", textTransform:"uppercase", fontFamily:"inherit",
  }),
  searchRow: { display:"flex", gap:"6px" },
  tag: (color) => ({ display:"inline-block", background: color+"22", border:`1px solid ${color}55`, color, borderRadius:"3px", padding:"2px 7px", fontSize:"10px", marginRight:"4px", marginBottom:"4px" }),
  functionBox: { fontSize:"11px", lineHeight:"1.6", color:"#9ab0c8", background:"#0d1117", borderRadius:"4px", padding:"8px", maxHeight:"120px", overflowY:"auto", border:"1px solid #1a2536" },
  viewItem: { display:"flex", justifyContent:"space-between", alignItems:"center", padding:"6px 8px", background:"#0d1117", borderRadius:"4px", border:"1px solid #1a2536", marginBottom:"4px" },
};

// ─── Bioinformatics Panel ─────────────────────────────────────────────────────
function BioInfoPanel({ sequence, meta, currentPdb, uniprot }) {
  const calc = calcBioInfo(sequence);
  const [tab, setTab] = useState("stats");

  const tabs = [
    { id:"stats",    label:"Stats"    },
    { id:"function", label:"Function" },
    { id:"domains",  label:"Domains"  },
  ];

  return (
    <div style={S.section}>
      <div style={S.sectionTitle}>Bioinformatics</div>

      <div style={S.tabBar}>
        {tabs.map(t => (
          <button key={t.id} style={S.tab(tab===t.id)} onClick={()=>setTab(t.id)}>{t.label}</button>
        ))}
      </div>

      {tab === "stats" && calc && (
        <div style={{paddingTop:"10px"}}>
          <div style={S.infoGrid}>
            <div style={S.infoCell}>
              <div style={S.infoLabel}>Mol. Weight</div>
              <div style={S.infoVal}>{calc.mw} <span style={{fontSize:"10px",color:"#4a7fa5"}}>kDa</span></div>
            </div>
            <div style={S.infoCell}>
              <div style={S.infoLabel}>Length</div>
              <div style={S.infoVal}>{calc.len} <span style={{fontSize:"10px",color:"#4a7fa5"}}>aa</span></div>
            </div>
            <div style={S.infoCell}>
              <div style={S.infoLabel}>Hydrophobicity</div>
              <div style={S.infoVal}>{calc.hydro}</div>
              <div style={S.barWrap}>
                <div style={{
                  height:"100%", borderRadius:"3px",
                  width:`${Math.min(100, Math.max(0,(parseFloat(calc.hydro)+4.5)/9*100))}%`,
                  background: parseFloat(calc.hydro) > 0 ? "#f0a500" : "#5b9bd5",
                  transition:"width 0.5s",
                }} />
              </div>
            </div>
            <div style={S.infoCell}>
              <div style={S.infoLabel}>Resolution</div>
              <div style={S.infoVal}>{meta?.resolution ?? "—"} <span style={{fontSize:"10px",color:"#4a7fa5"}}>Å</span></div>
            </div>
          </div>

          <div style={{marginTop:"10px"}}>
            <div style={{...S.infoLabel, marginBottom:"6px"}}>Top residues</div>
            <div style={{display:"flex", flexWrap:"wrap"}}>
              {calc.composition.map(({aa,pct})=>(
                <span key={aa} style={S.tag("#5b9bd5")}>{aa} {pct}%</span>
              ))}
            </div>
          </div>

          {uniprot?.accession && (
            <div style={{marginTop:"8px"}}>
              <a href={`https://www.uniprot.org/uniprot/${uniprot.accession}`}
                 target="_blank" rel="noreferrer"
                 style={{color:"#4a9fd5", fontSize:"11px", textDecoration:"none"}}>
                ↗ UniProt: {uniprot.accession}
              </a>
            </div>
          )}
        </div>
      )}

      {tab === "function" && (
        <div style={{paddingTop:"10px"}}>
          {uniprot?.function ? (
            <div style={S.functionBox}>{uniprot.function}</div>
          ) : (
            <div style={{...S.functionBox, color:"#4a6a80"}}>No UniProt function annotation found for this entry.</div>
          )}
          {uniprot?.diseases?.length > 0 && (
            <div style={{marginTop:"10px"}}>
              <div style={S.infoLabel}>Disease associations</div>
              <div style={{display:"flex", flexWrap:"wrap", marginTop:"4px"}}>
                {uniprot.diseases.map((d,i)=><span key={i} style={S.tag("#e05a5a")}>{d}</span>)}
              </div>
            </div>
          )}
          {uniprot?.keywords?.length > 0 && (
            <div style={{marginTop:"10px"}}>
              <div style={S.infoLabel}>Keywords</div>
              <div style={{display:"flex", flexWrap:"wrap", marginTop:"4px"}}>
                {uniprot.keywords.slice(0,8).map((k,i)=><span key={i} style={S.tag("#4a7fa5")}>{k}</span>)}
              </div>
            </div>
          )}
        </div>
      )}

      {tab === "domains" && (
        <div style={{paddingTop:"10px"}}>
          {uniprot?.domains?.length > 0 ? (
            <div>
              {uniprot.domains.map((d,i)=>(
                <div key={i} style={{...S.infoCell, marginBottom:"5px"}}>
                  <div style={S.infoLabel}>{d.type}</div>
                  <div style={{fontSize:"11px", color:"#c9d1d9"}}>{d.description}</div>
                  {d.start && <div style={{fontSize:"10px", color:"#4a7fa5", marginTop:"2px"}}>pos {d.start}–{d.end}</div>}
                </div>
              ))}
            </div>
          ) : (
            <div style={{...S.functionBox, color:"#4a6a80"}}>No domain annotations found for this entry.</div>
          )}

          {uniprot?.organism && (
            <div style={{marginTop:"10px"}}>
              <div style={S.infoLabel}>Organism</div>
              <div style={{fontSize:"11px", color:"#9ab0c8", marginTop:"3px", fontStyle:"italic"}}>{uniprot.organism}</div>
            </div>
          )}
          {uniprot?.gene && (
            <div style={{marginTop:"8px"}}>
              <div style={S.infoLabel}>Gene</div>
              <div style={{fontSize:"12px", color:"#7ec8e3", marginTop:"3px"}}>{uniprot.gene}</div>
            </div>
          )}
        </div>
      )}

      {tab === "stats" && !calc && (
        <div style={{padding:"10px 0", color:"#4a6a80", fontSize:"11px"}}>Load a protein to see statistics.</div>
      )}
    </div>
  );
}

// ─── Custom Search ────────────────────────────────────────────────────────────
function CustomSearch({ onLoad }) {
  const [query, setQuery] = useState("");
  const [searching, setSearching] = useState(false);
  const [err, setErr] = useState("");

  const submit = async () => {
    const id = query.trim().toUpperCase();
    if (!id || id.length < 4) { setErr("Enter a valid 4-character PDB ID."); return; }
    setErr(""); setSearching(true);
    try {
      // Verify the entry exists + check atom count
      const [metaRes, pdbRes] = await Promise.all([
        fetch(RCSB_META(id)),
        fetch(RCSB_PDB(id)).then(r => r.text()),
      ]);
      if (!metaRes.ok) { setErr(`PDB entry "${id}" not found.`); setSearching(false); return; }
      const atomCount = countAtoms(pdbRes);
      onLoad(id, atomCount, pdbRes);
    } catch {
      setErr("Network error. Check the PDB ID and try again.");
    }
    setSearching(false);
  };

  return (
    <div style={S.section}>
      <div style={S.sectionTitle}>Custom PDB Search</div>
      <div style={S.searchRow}>
        <input
          style={{...S.input, flex:1}}
          value={query}
          onChange={e => setQuery(e.target.value.slice(0,4))}
          onKeyDown={e => e.key==="Enter" && submit()}
          placeholder="e.g. 2HHB"
          maxLength={4}
          spellCheck={false}
        />
        <button style={S.btn} onClick={submit} disabled={searching}>
          {searching ? "…" : "Load"}
        </button>
      </div>
      {err && <div style={{color:"#e05a5a", fontSize:"11px", marginTop:"5px"}}>{err}</div>}
      <div style={{color:"#4a6a80", fontSize:"10px", marginTop:"5px"}}>
        Any 4-character RCSB PDB identifier
      </div>
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────
const ProteinViewer = () => {
  const canvasRef  = useRef(null);
  const dragRef    = useRef({ on:false, lx:0, ly:0 });
  const stateRef   = useRef({ rx:0.3, ry:0.4, zoom:1, atoms:[], center:[0,0,0], radius:1 });

  const [currentPdb, setCurrentPdb]   = useState("1MBN");
  const [loading, setLoading]         = useState(false);
  const [error, setError]             = useState(null);
  const [meta, setMeta]               = useState(null);
  const [sequence, setSequence]       = useState("");
  const [autoRotate, setAutoRotate]   = useState(true);
  const [savedViews, setSavedViews]   = useState(() => { try { return JSON.parse(localStorage.getItem("pvViews")||"[]"); } catch { return []; } });
  const [viewName, setViewName]       = useState("");
  const [advancedPrompt, setAdvancedPrompt] = useState(null);
  const [sizeWarning, setSizeWarning] = useState(null); // { id, atomCount, pdbText }
  const [uniprot, setUniprot]         = useState(null);
  const [customLabel, setCustomLabel] = useState(null);

  // ── Renderer ──────────────────────────────────────────────────────────────────
  const draw = useCallback(() => {
    const canvas = canvasRef.current; if (!canvas) return;
    const ctx = canvas.getContext("2d");
    const W=canvas.width, H=canvas.height;
    ctx.clearRect(0,0,W,H);
    const { rx, ry, zoom, atoms, center, radius } = stateRef.current;
    if (!atoms.length) return;
    const scale=(Math.min(W,H)/2.3)*zoom/radius;
    const cx=W/2, cy=H/2;
    const proj = ([ax,ay,az]) => {
      const [dx,dy,dz]=[ax-center[0],ay-center[1],az-center[2]];
      const [x1,y1,z1]=rotY3([dx,dy,dz],ry);
      const [x2,y2,z2]=rotX3([x1,y1,z1],rx);
      const fov=1+z2/(radius*5);
      return { sx:cx+x2*scale*fov, sy:cy-y2*scale*fov, depth:z2 };
    };
    const segs=[], seg2=[];
    let seg=[];
    atoms.forEach((a,i) => {
      const prev=atoms[i-1];
      if (prev) { const d=Math.sqrt((a[0]-prev[0])**2+(a[1]-prev[1])**2+(a[2]-prev[2])**2); if (d>6) { if (seg.length>1) segs.push([...seg]); seg=[]; } }
      seg.push(a);
    });
    if (seg.length>1) segs.push(seg);
    const drawList = segs.map(rawSeg => {
      const pts3=rawSeg.map(a=>[a[0],a[1],a[2]]);
      const smooth=spline(pts3,5);
      const projected=smooth.map(p=>proj(p));
      const avgDepth=projected.reduce((s,p)=>s+p.depth,0)/projected.length;
      return { projected, ssArr:rawSeg.map(a=>a[3]), rawLen:rawSeg.length, avgDepth };
    });
    drawList.sort((a,b)=>a.avgDepth-b.avgDepth);
    drawList.forEach(({ projected, ssArr, rawLen }) => {
      if (projected.length<2) return;
      for (let i=1;i<projected.length;i++) {
        const t=(i-1)/(projected.length-1);
        const ssIdx=Math.min(Math.floor(t*(rawLen-1)),ssArr.length-1);
        const ss=ssArr[ssIdx]||0;
        const p0=projected[i-1], p1=projected[i];
        const avgDepth=(p0.depth+p1.depth)/2;
        const fog=Math.max(0,Math.min(1,(avgDepth/radius+1)/2));
        const alpha=0.35+fog*0.65;
        const w=SS_WIDTH[ss]*(0.65+fog*0.55);
        const color=SS_COLOR[ss];
        if (ss===1) {
          ctx.beginPath(); ctx.moveTo(p0.sx,p0.sy); ctx.lineTo(p1.sx,p1.sy);
          ctx.strokeStyle=hexRgba("#a8d4ff",alpha*0.25); ctx.lineWidth=w+5; ctx.lineCap="round"; ctx.stroke();
        }
        ctx.beginPath(); ctx.moveTo(p0.sx,p0.sy); ctx.lineTo(p1.sx,p1.sy);
        ctx.strokeStyle=hexRgba(color,alpha); ctx.lineWidth=w; ctx.lineCap="round"; ctx.lineJoin="round"; ctx.stroke();
      }
    });
    const step=Math.max(1,Math.floor(atoms.length/180));
    atoms.forEach(([ax,ay,az,ss],i) => {
      if (i%step!==0) return;
      const {sx,sy,depth}=proj([ax,ay,az]);
      const fog=Math.max(0,Math.min(1,(depth/radius+1)/2));
      const r=(ss===1?3.5:ss===2?3:2)*(0.55+fog*0.5);
      ctx.beginPath(); ctx.arc(sx,sy,r,0,Math.PI*2);
      ctx.fillStyle=hexRgba(SS_COLOR[ss],0.45+fog*0.45); ctx.fill();
    });
    [["α-Helix",SS_COLOR[1]],["β-Sheet",SS_COLOR[2]],["Coil",SS_COLOR[0]]].forEach(([lbl,col],li) => {
      const lx=12+li*76, ly=H-12;
      ctx.fillStyle=col; ctx.fillRect(lx,ly-9,14,9);
      ctx.fillStyle="#aab8c8"; ctx.font="10px 'IBM Plex Mono',monospace"; ctx.fillText(lbl,lx+17,ly);
    });
  }, []);

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

  useEffect(() => {
    const resize = () => {
      const c=canvasRef.current; if (!c) return;
      c.width=c.offsetWidth; c.height=c.offsetHeight;
    };
    resize();
    let rafId;
    const debouncedResize = () => { cancelAnimationFrame(rafId); rafId=requestAnimationFrame(resize); };
    const ro = new ResizeObserver(debouncedResize);
    if (canvasRef.current) ro.observe(canvasRef.current);
    return () => { ro.disconnect(); cancelAnimationFrame(rafId); };
  }, []);

  useEffect(() => {
    const c=canvasRef.current; if (!c) return;
    const down=e=>{ dragRef.current={on:true,lx:e.clientX,ly:e.clientY}; };
    const move=e=>{ if (!dragRef.current.on) return; stateRef.current.ry+=(e.clientX-dragRef.current.lx)*0.007; stateRef.current.rx+=(e.clientY-dragRef.current.ly)*0.007; dragRef.current.lx=e.clientX; dragRef.current.ly=e.clientY; };
    const up=()=>{ dragRef.current.on=false; };
    const wheel=e=>{ e.preventDefault(); stateRef.current.zoom=Math.max(0.3,Math.min(4.5,stateRef.current.zoom-e.deltaY*0.001)); };
    c.addEventListener("mousedown",down);
    window.addEventListener("mousemove",move);
    window.addEventListener("mouseup",up);
    c.addEventListener("wheel",wheel,{passive:false});
    return () => { c.removeEventListener("mousedown",down); window.removeEventListener("mousemove",move); window.removeEventListener("mouseup",up); c.removeEventListener("wheel",wheel); };
  }, []);

  // ── UniProt fetch ──────────────────────────────────────────────────────────────
  const fetchUniprot = useCallback(async (pdb) => {
    setUniprot(null);
    try {
      const res = await fetch(UNIPROT_SEARCH(pdb));
      if (!res.ok) return;
      const data = await res.json();
      const entry = data.results?.[0];
      if (!entry) return;
      const fn = entry.comments?.find(c=>c.commentType==="FUNCTION")?.texts?.[0]?.value || null;
      const diseases = entry.comments
        ?.filter(c=>c.commentType==="DISEASE")
        ?.map(c=>c.disease?.diseaseName?.value)
        ?.filter(Boolean) || [];
      const domains = entry.features
        ?.filter(f=>["Domain","Repeat","Motif","Region"].includes(f.type))
        ?.slice(0,8)
        ?.map(f=>({ type:f.type, description:f.description || f.type, start:f.location?.start?.value, end:f.location?.end?.value })) || [];
      const keywords = entry.keywords?.map(k=>k.name) || [];
      const organism = entry.organism?.scientificName || null;
      const gene = entry.genes?.[0]?.geneName?.value || null;
      setUniprot({ accession:entry.primaryAccession, function:fn, diseases, domains, keywords, organism, gene });
    } catch { /* silent */ }
  }, []);

  // ── Core loader ───────────────────────────────────────────────────────────────
  const applyPdbText = useCallback(async (pdb, pdbText, label) => {
    let atoms;
    if (pdbText && pdbText.includes("ATOM")) {
      atoms = parsePDB(pdbText);
    } else {
      atoms = buildFallback(pdb);
    }
    if (!atoms.length) { setError("No Cα atoms found."); setLoading(false); return; }
    const c=centroid(atoms), r=maxR(atoms,c);
    stateRef.current = { ...stateRef.current, atoms, center:c, radius:r, rx:0.3, ry:0.4 };
    setLoading(false);
    if (label) setCustomLabel(label);
  }, []);

  const loadProtein = useCallback(async (pdb, preloadedPdbText) => {
    setLoading(true); setError(null); setMeta(null); setSequence(""); setCurrentPdb(pdb); setCustomLabel(null);

    const [metaRes, pdbRes, entityRes] = await Promise.allSettled([
      fetch(RCSB_META(pdb)).then(r=>r.json()),
      preloadedPdbText ? Promise.resolve(preloadedPdbText) : fetch(RCSB_PDB(pdb)).then(r=>r.text()),
      fetch(RCSB_ENTITY(pdb)).then(r=>r.json()),
    ]);

    if (metaRes.status==="fulfilled") {
      const d=metaRes.value;
      setMeta({
        title:      d.struct?.title||pdb,
        method:     d.exptl?.[0]?.method||"—",
        resolution: d.refine?.[0]?.ls_d_res_high?.toFixed(2) ?? d.em_3d_reconstruction?.[0]?.resolution?.toFixed(2) ?? "—",
        deposited:  d.rcsb_accession_info?.initial_release_date?.split("T")[0]||"—",
        atoms:      d.rcsb_entry_info?.deposited_atom_count?.toLocaleString()||"—",
        keywords:   d.struct_keywords?.pdbx_keywords||"—",
        chains:     d.rcsb_entry_info?.polymer_entity_count||"—",
      });
    }

    if (entityRes.status==="fulfilled") {
      const seq = entityRes.value?.entity_poly?.pdbx_seq_one_letter_code_can||"";
      setSequence(seq);
    }

    const pdbText = pdbRes.status==="fulfilled" ? pdbRes.value : null;
    await applyPdbText(pdb, pdbText, null);
    fetchUniprot(pdb);
  }, [applyPdbText, fetchUniprot]);

  // ── Custom search handler ─────────────────────────────────────────────────────
  const handleCustomLoad = useCallback((id, atomCount, pdbText) => {
    if (atomCount > BLOCK_THRESHOLD) {
      setSizeWarning({ id, atomCount, pdbText, level:"large" });
    } else if (atomCount > WARN_THRESHOLD) {
      setSizeWarning({ id, atomCount, pdbText, level:"warn" });
    } else {
      loadProtein(id, pdbText);
    }
  }, [loadProtein]);

  const confirmSizeWarning = useCallback(() => {
    if (!sizeWarning) return;
    loadProtein(sizeWarning.id, sizeWarning.pdbText);
    setSizeWarning(null);
  }, [sizeWarning, loadProtein]);

  // ── Save/restore views ────────────────────────────────────────────────────────
  const saveView = () => {
    if (!viewName.trim()) return;
    const v = { id:Date.now(), name:viewName.trim(), pdb:currentPdb,
      rx:stateRef.current.rx, ry:stateRef.current.ry, zoom:stateRef.current.zoom,
      date:new Date().toLocaleDateString() };
    const updated=[...savedViews,v];
    setSavedViews(updated); try { localStorage.setItem("pvViews",JSON.stringify(updated)); } catch {}
    setViewName("");
  };
  const restoreView = (v) => { loadProtein(v.pdb).then(()=>{ stateRef.current.rx=v.rx; stateRef.current.ry=v.ry; stateRef.current.zoom=v.zoom; }); };
  const deleteView  = (id) => { const updated=savedViews.filter(v=>v.id!==id); setSavedViews(updated); try { localStorage.setItem("pvViews",JSON.stringify(updated)); } catch {}; };

  useEffect(() => { loadProtein("1MBN"); }, [loadProtein]);

  const info = PROTEINS[currentPdb];
  const displayLabel = customLabel || info?.label || currentPdb;

  return (
    <div style={S.root}>
      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        ::-webkit-scrollbar { width:4px; } ::-webkit-scrollbar-track { background:#0d1117; }
        ::-webkit-scrollbar-thumb { background:#2a3a4a; border-radius:2px; }
        * { box-sizing:border-box; }
      `}</style>

      {/* ── Sidebar ── */}
      <div style={S.sidebar}>

        {/* Header */}
        <div style={{padding:"14px 14px 10px", borderBottom:"1px solid #1a2536"}}>
          <div style={{fontSize:"11px", letterSpacing:"0.2em", textTransform:"uppercase", color:"#4a7fa5", marginBottom:"2px"}}>Protein Viewer</div>
          <div style={{fontSize:"16px", fontWeight:700, color:"#c9d1d9"}}>BiochemReact</div>
        </div>

        {/* Preset proteins */}
        <div style={S.section}>
          <div style={S.sectionTitle}>Preset Proteins</div>
          {Object.entries(PROTEINS).map(([pdb, p]) => (
            <button key={pdb} style={S.proteinBtn(currentPdb===pdb)}
              onClick={()=>{
                if (p.tier==="advanced") { setAdvancedPrompt(pdb); }
                else { loadProtein(pdb); }
              }}>
              <span>{p.label}</span>
              <span style={{opacity:0.5, fontSize:"10px", marginLeft:"6px"}}>{pdb}</span>
              {p.tier==="advanced" && <span style={{...S.tag("#f0a500"), marginLeft:"6px", fontSize:"9px"}}>⚠ heavy</span>}
            </button>
          ))}
        </div>

        {/* Custom search */}
        <CustomSearch onLoad={handleCustomLoad} />

        {/* Secondary structure legend */}
        <div style={S.section}>
          <div style={S.sectionTitle}>Secondary Structure</div>
          <div style={{display:"flex", gap:"12px", flexWrap:"wrap"}}>
            {[["α-Helix",SS_COLOR[1]],["β-Sheet",SS_COLOR[2]],["Coil",SS_COLOR[0]]].map(([lbl,col])=>(
              <div key={lbl} style={{display:"flex", alignItems:"center", gap:"5px"}}>
                <div style={{width:"12px",height:"12px",background:col,borderRadius:"2px"}} />
                <span style={{fontSize:"11px",color:"#8b9db0"}}>{lbl}</span>
              </div>
            ))}
          </div>
          <div style={{color:"#4a6a80",fontSize:"10px",marginTop:"6px"}}>Drag to rotate · Scroll to zoom</div>
        </div>

        {/* Bioinformatics */}
        <BioInfoPanel sequence={sequence} meta={meta} currentPdb={currentPdb} uniprot={uniprot} />

        {/* Sequence */}
        {sequence && (
          <div style={S.section}>
            <div style={S.sectionTitle}>Sequence — Chain A · {sequence.length} aa</div>
            <div style={S.seq}>{sequence.match(/.{1,10}/g)?.join(" ")}</div>
          </div>
        )}

        {/* Save view */}
        <div style={S.section}>
          <div style={S.sectionTitle}>Save View</div>
          <div style={S.searchRow}>
            <input type="text" value={viewName} onChange={e=>setViewName(e.target.value)}
              onKeyDown={e=>e.key==="Enter"&&saveView()} placeholder="View name" style={{...S.input,flex:1}} />
            <button onClick={saveView} style={S.btn}>Save</button>
          </div>
        </div>

        {/* Saved views */}
        <div style={S.section}>
          <div style={S.sectionTitle}>Saved Views ({savedViews.length})</div>
          {savedViews.length===0 ? (
            <div style={{opacity:0.5,fontSize:"11px"}}>No saved views yet</div>
          ) : savedViews.map(v=>(
            <div key={v.id} style={S.viewItem}>
              <div>
                <div style={{fontWeight:600,fontSize:"12px"}}>{v.name}</div>
                <div style={{fontSize:"10px",opacity:0.6}}>{PROTEINS[v.pdb]?.label||v.pdb} · {v.date}</div>
              </div>
              <div style={{display:"flex",gap:"4px"}}>
                <button style={{...S.btn,padding:"3px 8px",fontSize:"11px"}} onClick={()=>restoreView(v)}>Load</button>
                <button style={{...S.btnSecondary,padding:"3px 8px",fontSize:"11px"}} onClick={()=>deleteView(v.id)}>✕</button>
              </div>
            </div>
          ))}
        </div>

      </div>

      {/* ── Canvas area ── */}
      <div style={S.canvasWrap}>
        <canvas ref={canvasRef} style={S.canvas} />

        {loading && (
          <div style={S.overlay}>
            <div style={S.spinner} />
            <span style={{fontSize:"12px",color:"#4a7fa5"}}>Fetching {currentPdb} from RCSB…</span>
          </div>
        )}
        {error && <div style={{...S.overlay, color:"#e05a5a"}}>{error}</div>}

        {/* Advanced protein warning (preset) */}
        {advancedPrompt && (
          <div style={S.overlay}>
            <div style={{...S.warnBox, borderColor:"#5a8a20"}}>
              <div style={{fontSize:"14px",fontWeight:700,color:"#a0d060",marginBottom:"8px"}}>⚠ Heavy Structure</div>
              <div style={{fontSize:"12px",color:"#9ab0c8",marginBottom:"14px"}}>
                <strong>{PROTEINS[advancedPrompt]?.label}</strong> is a large structure that may render slowly or stutter on lower-powered devices.
              </div>
              <div style={{display:"flex",gap:"8px",justifyContent:"center"}}>
                <button style={S.btn} onClick={()=>{ loadProtein(advancedPrompt); setAdvancedPrompt(null); }}>Render Anyway</button>
                <button style={S.btnSecondary} onClick={()=>setAdvancedPrompt(null)}>Cancel</button>
              </div>
            </div>
          </div>
        )}

        {/* Custom PDB size warning */}
        {sizeWarning && (
          <div style={S.overlay}>
            <div style={{...S.warnBox, borderColor: sizeWarning.level==="large" ? "#8a2020" : "#8a6020"}}>
              <div style={{fontSize:"14px",fontWeight:700,color: sizeWarning.level==="large" ? "#e05a5a" : "#f0a500",marginBottom:"8px"}}>
                {sizeWarning.level==="large" ? "⛔ Very Large Structure" : "⚠ Large Structure"}
              </div>
              <div style={{fontSize:"12px",color:"#9ab0c8",marginBottom:"6px"}}>
                <strong>{sizeWarning.id}</strong> contains <strong style={{color:"#c9d1d9"}}>{sizeWarning.atomCount.toLocaleString()} ATOM records</strong>.
              </div>
              <div style={{fontSize:"11px",color:"#6a8aa0",marginBottom:"14px"}}>
                {sizeWarning.level==="large"
                  ? "This structure is very large and may severely impact browser performance or cause a crash. Proceed with caution."
                  : "This structure is moderately large and may render slowly. You can still proceed."}
              </div>
              <div style={{display:"flex",gap:"8px",justifyContent:"center"}}>
                <button style={{...S.btn, borderColor: sizeWarning.level==="large" ? "#8a2020" : undefined}} onClick={confirmSizeWarning}>
                  {sizeWarning.level==="large" ? "Load Anyway (risky)" : "Load Anyway"}
                </button>
                <button style={S.btnSecondary} onClick={()=>setSizeWarning(null)}>Cancel</button>
              </div>
            </div>
          </div>
        )}

        {/* Meta overlay */}
        <div style={S.metaOverlay}>
          {meta ? (
            <>
              <div style={{fontWeight:700,fontSize:"13px",color:"#7ec8e3",marginBottom:"4px"}}>
                {displayLabel}
                <span style={S.badge}>{currentPdb}</span>
              </div>
              {info && <div style={{fontSize:"11px",color:"#4a7fa5",marginBottom:"6px"}}>{info.class}</div>}
              <div style={{fontSize:"11px",color:"#8b9db0",marginBottom:"2px"}}>{info?.bio || meta.title}</div>
              <div style={{height:"1px",background:"#1e2d3d",margin:"6px 0"}} />
              <div style={{fontSize:"10px",color:"#4a6a80"}}>{meta.method} · {meta.resolution} Å · {meta.chains} chain{meta.chains!==1?"s":""}</div>
              {uniprot?.gene && <div style={{fontSize:"10px",color:"#4a7fa5",marginTop:"3px"}}>Gene: <span style={{color:"#7ec8e3"}}>{uniprot.gene}</span></div>}
            </>
          ) : !loading && <div style={{opacity:0.4,fontSize:"11px"}}>Select or search a protein →</div>}
        </div>

        {/* Canvas controls */}
        <div style={{position:"absolute",right:"10px",bottom:"10px",display:"flex",flexDirection:"column",gap:"5px"}}>
          <button style={{...S.btn, opacity: autoRotate ? 1 : 0.6}} onClick={()=>setAutoRotate(v=>!v)} title={autoRotate?"Pause rotation":"Resume rotation"}>
            {autoRotate ? "⏸" : "▶"}
          </button>
          <button style={S.btnSecondary} title="Reset view" onClick={()=>{ stateRef.current.rx=0.3; stateRef.current.ry=0.4; stateRef.current.zoom=1; }}>
            ↺
          </button>
        </div>
      </div>
    </div>
  );
};

export default ProteinViewer;