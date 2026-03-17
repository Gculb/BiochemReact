import React, { useEffect, useRef, useState, useCallback } from "react";
import "./proteinViewer.css";

// ─── RCSB PDB API endpoints ───────────────────────────────────────────────────
const RCSB_META   = (id) => `https://data.rcsb.org/rest/v1/core/entry/${id}`;
const RCSB_ENTITY = (id) => `https://data.rcsb.org/rest/v1/core/polymer_entity/${id}/1`;
const RCSB_PDB    = (id) => `https://files.rcsb.org/download/${id}.pdb`;


const PROTEINS = {
  "1MBN": { label: "Myoglobin",        class: "All-α",       bio: "Oxygen storage in muscle" },
  "4INS": { label: "Insulin",          class: "α + α",       bio: "Blood glucose regulation" },
  "1TIM": { label: "TIM Barrel",       class: "(β/α)₈",      bio: "Triosephosphate isomerase" },
  "2POR": { label: "Porin",            class: "All-β barrel", bio: "Outer membrane channel" },
  "3NIR": { label: "GFP",             class: "β-barrel",    bio: "Green fluorescent protein" },
  "1HHO": { label: "Hemoglobin",       class: "All-α",       bio: "O₂ transport (α₂β₂ tetramer)" },
  "1CAG": { label: "Collagen",         class: "Triple helix", bio: "Extracellular matrix structure" },
  "6LU7": { label: "SARS-CoV-2 Mpro", class: "α/β mixed",   bio: "Main protease, key drug target" },
  "5XNL": { label: "p53 DBD",         class: "β-sandwich",  bio: "Tumor suppressor DNA-binding domain" , tier: "advanced"}, //NEED STRONG COMPUTER TO RENDER
  "1UBQ": { label: "Ubiquitin",        class: "α+β",         bio: "Protein degradation tag" },
};


const SS_COLOR = { 0: "#8892a4", 1: "#5b9bd5", 2: "#f0a500" };

const SS_WIDTH = { 0: 2, 1: 5.5, 2: 4 };


function buildFallback(pdb) {
  const PI = Math.PI;
  const atoms = []; // [x, y, z, ssType]  ssType: 0=coil 1=helix 2=sheet

  const helix = (len, ox, oy, oz, phaseDeg) => {
    for (let i = 0; i < len; i++) {
      const a = (phaseDeg + i * 100) * PI / 180;
      atoms.push([ox + 2.3 * Math.cos(a), oy + 2.3 * Math.sin(a), oz + i * 1.5, 1]);
    }
    atoms.push([0, 0, 0, 0], [0, 0, 0, 0], [0, 0, 0, 0]); // coil gap
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
      const sa = s * (2*PI/16);
      const cx = 10*Math.cos(sa), cy = 10*Math.sin(sa);
      for (let j = 0; j < 14; j++) {
        const jj = s%2===0 ? j : 13-j;
        atoms.push([cx+(j-7)*0.25*Math.sin(sa), cy+(j-7)*0.25*Math.cos(sa), jj*3.4-24, 2]);
      }
    }
  } else if (pdb === "1TIM") {
    for (let i = 0; i < 8; i++) {
      const ma = i*PI/4, br = 7;
      const cx = br*Math.cos(ma), cy = br*Math.sin(ma);
      for (let j = 0; j < 8; j++)
        atoms.push([cx-j*0.25*Math.cos(ma), cy-j*0.25*Math.sin(ma), j*3.4, 2]);
      const hcx = (br+5)*Math.cos(ma+PI/8), hcy = (br+5)*Math.sin(ma+PI/8);
      for (let j = 0; j < 12; j++) {
        const ha = j*100*PI/180;
        atoms.push([hcx+2.3*Math.cos(ha), hcy+2.3*Math.sin(ha), j*1.5+2, 1]);
      }
    }
  } else if (pdb === "1CAG") {
    [0, 2*PI/3, 4*PI/3].forEach(off => {
      for (let i = 0; i < 60; i++) {
        const t = i/59, ma = off+t*6*PI, sa = off+t*20*PI;
        atoms.push([(3+1.5*Math.cos(sa))*Math.cos(ma), (3+1.5*Math.cos(sa))*Math.sin(ma), i*0.86-26, 1]);
      }
    });
  } else {
    // generic β-barrel fallback for GFP / 6LU7 / unknown
    for (let s = 0; s < 11; s++) {
      const sa = s*(2*PI/11), cx = 9*Math.cos(sa), cy = 9*Math.sin(sa);
      for (let j = 0; j < 15; j++) {
        const jj = s%2===0 ? j : 14-j;
        atoms.push([cx+(j-7)*0.2*Math.sin(sa), cy+(j-7)*0.2*Math.cos(sa), jj*3.4-25, 2]);
      }
    }
    helix(20, 0, 0, -15, 0);
  }
  return atoms;
}

// ─── PDB text parser → Cα atoms ──────────────────────────────────────────────
function parsePDB(text) {
  const ssMap = {};
  const atoms = [];
  const lines = text.split("\n");

  lines.forEach(line => {
    const rec = line.slice(0,6).trim();
    if (rec === "HELIX") {
      const s = parseInt(line.slice(21,25)), e = parseInt(line.slice(33,37));
      for (let i = s; i <= e; i++) ssMap[`A${i}`] = 1;
    } else if (rec === "SHEET") {
      const s = parseInt(line.slice(22,26)), e = parseInt(line.slice(33,37));
      for (let i = s; i <= e; i++) ssMap[`A${i}`] = 2;
    }
  });

  lines.forEach(line => {
    if (line.slice(0,4) !== "ATOM") return;
    if (line.slice(12,16).trim() !== "CA") return;
    const chain = line[21];
    const resSeq = parseInt(line.slice(22,26));
    const x = parseFloat(line.slice(30,38));
    const y = parseFloat(line.slice(38,46));
    const z = parseFloat(line.slice(46,54));
    if (isNaN(x)||isNaN(y)||isNaN(z)) return;
    atoms.push([x, y, z, ssMap[`${chain}${resSeq}`]||0]);
  });

  return atoms;
}

// ─── 3D math ──────────────────────────────────────────────────────────────────
const centroid = (atoms) => {
  const n = atoms.length||1;
  return [atoms.reduce((s,a)=>s+a[0],0)/n, atoms.reduce((s,a)=>s+a[1],0)/n, atoms.reduce((s,a)=>s+a[2],0)/n];
};
const maxR = (atoms, c) => Math.max(...atoms.map(([x,y,z]) => Math.sqrt((x-c[0])**2+(y-c[1])**2+(z-c[2])**2)), 1);

const rotY3 = ([x,y,z], a) => [Math.cos(a)*x+Math.sin(a)*z, y, -Math.sin(a)*x+Math.cos(a)*z];
const rotX3 = ([x,y,z], a) => [x, Math.cos(a)*y-Math.sin(a)*z, Math.sin(a)*y+Math.cos(a)*z];

function catmullRom(p0,p1,p2,p3,t) {
  return p0.map((_,i) => 0.5*((2*p1[i])+(-p0[i]+p2[i])*t+(2*p0[i]-5*p1[i]+4*p2[i]-p3[i])*t*t+(-p0[i]+3*p1[i]-3*p2[i]+p3[i])*t*t*t));
}
function spline(pts, steps=5) {
  if (pts.length < 2) return pts;
  const out = [];
  for (let i = 0; i < pts.length-1; i++) {
    const p0=pts[Math.max(0,i-1)], p1=pts[i], p2=pts[Math.min(pts.length-1,i+1)], p3=pts[Math.min(pts.length-1,i+2)];
    for (let s=0; s<steps; s++) out.push(catmullRom(p0,p1,p2,p3,s/steps));
  }
  out.push(pts[pts.length-1]);
  return out;
}

function hexRgba(hex, a) {
  const r=parseInt(hex.slice(1,3),16), g=parseInt(hex.slice(3,5),16), b=parseInt(hex.slice(5,7),16);
  return `rgba(${r},${g},${b},${a.toFixed(2)})`;
}

// ─── Component ────────────────────────────────────────────────────────────────
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
  const [savedViews, setSavedViews]   = useState(() => JSON.parse(localStorage.getItem("pvViews")||"[]"));
  const [viewName, setViewName]       = useState("");
  const [advancedPrompt, setAdvancedPrompt] = useState(null); 

  // ── Renderer ─────────────────────────────────────────────────────────────────
  const draw = useCallback(() => {
    const canvas = canvasRef.current; if (!canvas) return;
    const ctx = canvas.getContext("2d");
    const W = canvas.width, H = canvas.height;
    ctx.clearRect(0,0,W,H);

    const { rx, ry, zoom, atoms, center, radius } = stateRef.current;
    if (!atoms.length) return;

    const scale = (Math.min(W,H)/2.3)*zoom/radius;
    const cx = W/2, cy = H/2;

    const proj = ([ax,ay,az]) => {
      const [dx,dy,dz] = [ax-center[0], ay-center[1], az-center[2]];
      const [x1,y1,z1] = rotY3([dx,dy,dz], ry);
      const [x2,y2,z2] = rotX3([x1,y1,z1], rx);
      const fov = 1 + z2/(radius*5);
      return { sx: cx+x2*scale*fov, sy: cy-y2*scale*fov, depth: z2 };
    };

    // Split into continuous backbone segments
    const segs = [];
    let seg = [];
    atoms.forEach((a,i) => {
      const prev = atoms[i-1];
      if (prev) {
        const d = Math.sqrt((a[0]-prev[0])**2+(a[1]-prev[1])**2+(a[2]-prev[2])**2);
        if (d>6) { if (seg.length>1) segs.push([...seg]); seg=[]; }
      }
      seg.push(a);
    });
    if (seg.length>1) segs.push(seg);

    // Build draw list with avg depth for painter's sort
    const drawList = segs.map(rawSeg => {
      const pts3 = rawSeg.map(a=>[a[0],a[1],a[2]]);
      const smooth = spline(pts3, 5);
      const projected = smooth.map(p=>proj(p));
      const avgDepth = projected.reduce((s,p)=>s+p.depth,0)/projected.length;
      return { projected, ssArr: rawSeg.map(a=>a[3]), rawLen: rawSeg.length, avgDepth };
    });
    drawList.sort((a,b) => a.avgDepth-b.avgDepth);


    drawList.forEach(({ projected, ssArr, rawLen }) => {
      if (projected.length < 2) return;
      for (let i=1; i<projected.length; i++) {
        const t = (i-1)/(projected.length-1);
        const ssIdx = Math.min(Math.floor(t*(rawLen-1)), ssArr.length-1);
        const ss = ssArr[ssIdx]||0;
        const p0=projected[i-1], p1=projected[i];
        const avgDepth = (p0.depth+p1.depth)/2;
        const fog = Math.max(0, Math.min(1, (avgDepth/radius+1)/2));
        const alpha = 0.35+fog*0.65;
        const w = SS_WIDTH[ss]*(0.65+fog*0.55);
        const color = SS_COLOR[ss];

        // Glow pass for helices
        if (ss===1) {
          ctx.beginPath(); ctx.moveTo(p0.sx,p0.sy); ctx.lineTo(p1.sx,p1.sy);
          ctx.strokeStyle = hexRgba("#a8d4ff", alpha*0.25);
          ctx.lineWidth = w+5; ctx.lineCap="round"; ctx.stroke();
        }
        // Main stroke
        ctx.beginPath(); ctx.moveTo(p0.sx,p0.sy); ctx.lineTo(p1.sx,p1.sy);
        ctx.strokeStyle = hexRgba(color, alpha);
        ctx.lineWidth = w; ctx.lineCap="round"; ctx.lineJoin="round"; ctx.stroke();
      }
    });

    // Cα dots (sparse)
    const step = Math.max(1, Math.floor(atoms.length/180));
    atoms.forEach(([ax,ay,az,ss],i) => {
      if (i%step!==0) return;
      const {sx,sy,depth} = proj([ax,ay,az]);
      const fog = Math.max(0,Math.min(1,(depth/radius+1)/2));
      const r = (ss===1?3.5:ss===2?3:2)*(0.55+fog*0.5);
      ctx.beginPath(); ctx.arc(sx,sy,r,0,Math.PI*2);
      ctx.fillStyle = hexRgba(SS_COLOR[ss], 0.45+fog*0.45);
      ctx.fill();
    });

    // Legend bottom-left
    [["α-Helix",SS_COLOR[1]],["β-Sheet",SS_COLOR[2]],["Coil",SS_COLOR[0]]].forEach(([lbl,col],li) => {
      const lx = 12+li*76, ly = H-12;
      ctx.fillStyle=col; ctx.fillRect(lx,ly-9,14,9);
      ctx.fillStyle="#aab8c8"; ctx.font="10px 'Segoe UI',sans-serif"; ctx.fillText(lbl,lx+17,ly);
    });
  }, []);

  // ── Animation loop ────────────────────────────────────────────────────────────
  useEffect(() => {
    let raf;
    const loop = () => {
      if (autoRotate && !dragRef.current.on) stateRef.current.ry += 0.005;
      if (!advancedPrompt) draw();
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, [autoRotate, draw]);

  // ── Canvas sizing ─────────────────────────────────────────────────────────────
useEffect(() => {
  const resize = () => {
    const c = canvasRef.current; if (!c) return;
    c.width = c.offsetWidth; c.height = c.offsetHeight;
  };

  resize();

  let rafId;
  const debouncedResize = () => {
    cancelAnimationFrame(rafId);
    rafId = requestAnimationFrame(resize); 
  };

  const ro = new ResizeObserver(debouncedResize);
  if (canvasRef.current) ro.observe(canvasRef.current);
  return () => {
    ro.disconnect();
    cancelAnimationFrame(rafId);
  };
}, []);

  // ── Mouse / touch ─────────────────────────────────────────────────────────────
  useEffect(() => {
    const c = canvasRef.current; if (!c) return;
    const down = e => { dragRef.current = {on:true, lx:e.clientX, ly:e.clientY}; };
    const move = e => {
      if (!dragRef.current.on) return;
      stateRef.current.ry += (e.clientX-dragRef.current.lx)*0.007;
      stateRef.current.rx += (e.clientY-dragRef.current.ly)*0.007;
      dragRef.current.lx = e.clientX; dragRef.current.ly = e.clientY;
    };
    const up   = () => { dragRef.current.on = false; };
    const wheel= e => {
      e.preventDefault();
      stateRef.current.zoom = Math.max(0.3, Math.min(4.5, stateRef.current.zoom - e.deltaY*0.001));
    };
    c.addEventListener("mousedown", down);
    window.addEventListener("mousemove", move);
    window.addEventListener("mouseup", up);
    c.addEventListener("wheel", wheel, {passive:false});
    return () => {
      c.removeEventListener("mousedown", down);
      window.removeEventListener("mousemove", move);
      window.removeEventListener("mouseup", up);
      c.removeEventListener("wheel", wheel);
    };
  }, []);

  // ── Load protein from RCSB ────────────────────────────────────────────────────
  const loadProtein = useCallback(async (pdb) => {
    setLoading(true); setError(null); setMeta(null); setSequence(""); setCurrentPdb(pdb);

    const [metaRes, pdbRes, entityRes] = await Promise.allSettled([
      fetch(RCSB_META(pdb)).then(r=>r.json()),
      fetch(RCSB_PDB(pdb)).then(r=>r.text()),
      fetch(RCSB_ENTITY(pdb)).then(r=>r.json()),
    ]);

    if (metaRes.status==="fulfilled") {
      const d = metaRes.value;
      setMeta({
        title:      d.struct?.title || pdb,
        method:     d.exptl?.[0]?.method || "—",
        resolution: d.refine?.[0]?.ls_d_res_high?.toFixed(2) ?? d.em_3d_reconstruction?.[0]?.resolution?.toFixed(2) ?? "—",
        deposited:  d.rcsb_accession_info?.initial_release_date?.split("T")[0] || "—",
        atoms:      d.rcsb_entry_info?.deposited_atom_count?.toLocaleString() || "—",
        keywords:   d.struct_keywords?.pdbx_keywords || "—",
        chains:     d.rcsb_entry_info?.polymer_entity_count || "—",
      });
    }

    if (entityRes.status==="fulfilled") {
      setSequence(entityRes.value?.entity_poly?.pdbx_seq_one_letter_code_can || "");
    }

    let atoms;
    if (pdbRes.status==="fulfilled" && pdbRes.value.includes("ATOM")) {
      atoms = parsePDB(pdbRes.value);
    } else {
   
      atoms = buildFallback(pdb);
    }

    if (!atoms.length) { setError("No Cα atoms found."); setLoading(false); return; }
    const c = centroid(atoms), r = maxR(atoms, c);
    stateRef.current = { ...stateRef.current, atoms, center:c, radius:r, rx:0.3, ry:0.4 };
    setLoading(false);
  }, []);

  useEffect(() => { loadProtein("1MBN"); }, [loadProtein]);

  // ── Save/restore views ────────────────────────────────────────────────────────
  const saveView = () => {
    if (!viewName.trim()) return;
    const v = { id:Date.now(), name:viewName.trim(), pdb:currentPdb,
      rx:stateRef.current.rx, ry:stateRef.current.ry, zoom:stateRef.current.zoom,
      date:new Date().toLocaleDateString() };
    const updated = [...savedViews, v];
    setSavedViews(updated);
    localStorage.setItem("pvViews", JSON.stringify(updated));
    setViewName("");
  };

  const restoreView = (v) => {
    loadProtein(v.pdb).then(() => {
      stateRef.current.rx = v.rx; stateRef.current.ry = v.ry; stateRef.current.zoom = v.zoom;
    });
  };

  const deleteView = (id) => {
    const updated = savedViews.filter(v=>v.id!==id);
    setSavedViews(updated); localStorage.setItem("pvViews", JSON.stringify(updated));
  };

  const info = PROTEINS[currentPdb];

  return (
    <div className="molecule-viewer pv-root">

      {/* ── Viewport ── */}
      <div className="mv-canvas-container pv-canvas-wrap">
        <canvas ref={canvasRef} className="mv-canvas pv-canvas" />

        {loading && (
          <div className="pv-overlay">
            <div className="pv-spinner" />
            <span>Fetching {currentPdb} from RCSB…</span>
          </div>
        )}
        {error && <div className="pv-overlay pv-err">{error}</div>}

        {advancedPrompt && (
                <div className="pv-overlay pv-advanced">
                <div className="pv-advanced-box">
                    <h3>Advanced Protein</h3>

                    <p>
                    {PROTEINS[advancedPrompt]?.warning ||
                    "This structure may render slowly on weaker devices."}
                    </p>

                    <div className="pv-advanced-actions">
                    <button
                        className="mv-btn"
                        onClick={()=>{
                        loadProtein(advancedPrompt);
                        setAdvancedPrompt(null);
                        }}
                    >
                        Render Anyway
                    </button>

                    <button
                        className="mv-btn mv-btn-secondary"
                        onClick={()=>setAdvancedPrompt(null)}
                    >
                        Cancel
                    </button>
                    </div>
                </div>
                </div>
            )}
        <div className="mv-info pv-meta-overlay">
          {meta ? (
            <>
              <h3>{info?.label} <span className="pv-badge">{currentPdb}</span></h3>
              <p><strong>Class:</strong> {info?.class}</p>
              <p><strong>Function:</strong> {info?.bio}</p>
              <p><strong>Method:</strong> {meta.method}</p>
              <p><strong>Resolution:</strong> {meta.resolution} Å</p>
              <p><strong>Chains:</strong> {meta.chains}</p>
              <p><strong>Atoms:</strong> {meta.atoms}</p>
            </>
          ) : (
            !loading && <p style={{opacity:0.5,fontSize:"0.85em"}}>Select a protein →</p>
          )}
        </div>

        <div className="pv-canvas-btns">
          <button className={`pv-ctrl${autoRotate?" pv-ctrl--active":""}`} onClick={()=>setAutoRotate(v=>!v)}>
            {autoRotate ? "⏸" : "▶"}
          </button>
          <button className="pv-ctrl" title="Reset view" onClick={()=>{ stateRef.current.rx=0.3; stateRef.current.ry=0.4; stateRef.current.zoom=1; }}>
            ↺
          </button>
        </div>
      </div>

      {/* ── Controls ── */}
      <div className="mv-controls">

        {/* Protein selector */}
        <div className="mv-section">
          <h4>Proteins</h4>
          <div className="mv-molecules">
            {Object.entries(PROTEINS).map(([pdb, p]) => (
              <button key={pdb}
                className={`mv-mol-btn${currentPdb===pdb?" active":""}`}
                onClick={()=>{
                const p = PROTEINS[pdb];
                if (p?.tier === "advanced") {
                    setAdvancedPrompt(pdb);
                } else {
                    loadProtein(pdb);
                }
                }}>
                {p.label} {p.tier === "advanced" && "⚠"}
              </button>
            ))}
          </div>
        </div>

        {/* SS legend */}
        <div className="mv-section pv-legend">
          <h4>Secondary Structure</h4>
          <div className="pv-legend-row">
            <span className="pv-swatch" style={{background:SS_COLOR[1]}} />α-Helix
            <span className="pv-swatch" style={{background:SS_COLOR[2]}} />β-Sheet
            <span className="pv-swatch" style={{background:SS_COLOR[0]}} />Coil
          </div>
          <p className="pv-hint">Drag to rotate · Scroll to zoom</p>
        </div>

        {/* Sequence */}
        {sequence && (
          <div className="mv-section">
            <h4>Sequence (Chain A · {sequence.length} aa)</h4>
            <div className="pv-seq">{sequence.match(/.{1,10}/g)?.join(" ")}</div>
          </div>
        )}

        {/* Save view */}
        <div className="mv-section">
          <h4>Save View</h4>
          <div className="mv-form">
            <input type="text" value={viewName} onChange={e=>setViewName(e.target.value)}
              onKeyDown={e=>e.key==="Enter"&&saveView()}
              placeholder="View name" className="mv-input" />
            <button onClick={saveView} className="mv-btn">Save</button>
          </div>
        </div>

        {/* Saved views */}
        <div className="mv-section">
          <h4>Saved Views ({savedViews.length})</h4>
          <div className="mv-views">
            {savedViews.length === 0 ? (
              <p style={{opacity:0.6, fontSize:"0.9em"}}>No saved views</p>
            ) : (
              savedViews.map(v => (
                <div key={v.id} className="mv-view-item">
                  <div>
                    <strong>{v.name}</strong>
                    <div style={{fontSize:"0.8em",opacity:0.7}}>
                      {PROTEINS[v.pdb]?.label || v.pdb} · {v.date}
                    </div>
                  </div>
                  <div className="mv-view-actions">
                    <button className="mv-vbtn" onClick={()=>restoreView(v)}>Load</button>
                    <button className="mv-vbtn mv-vbtn-del" onClick={()=>deleteView(v.id)}>Delete</button>
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

export default ProteinViewer; 