import React, { useEffect, useRef, useState } from "react";
import {
  AF_API, AA_MASS, PROTEINS, RCSB_ENTITY, RCSB_PDB,
  SS_COLOR, UNIPROT_SEARCH, plddtColor,
} from "./proteinViewerData.js";
import {
  calcBioInfo, calcSSFraction, centroid, maxR, parsePDB, rotX3, rotY3,
} from "./proteinViewerUtils.js";

const averagePlddt = atoms => {
  const values = atoms.map(atom => atom[5]).filter(value => value > 0);
  return values.length ? (values.reduce((sum, value) => sum + value, 0) / values.length).toFixed(1) : null;
};

function ComparisonStructureCard({ pdb, label, onData }) {
  const canvasRef = useRef(null);
  const requestRef = useRef(0);
  const dragRef = useRef(null);
  const [mode, setMode] = useState("rcsb");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [data, setData] = useState(null);
  const [rotation, setRotation] = useState({ x: 0.3, y: 0.4, zoom: 1 });
  const [showCAlpha, setShowCAlpha] = useState(true);

  useEffect(() => {
    let raf;
    const animate = () => {
      if (!dragRef.current) setRotation(value => ({ ...value, y: value.y + 0.005 }));
      raf = requestAnimationFrame(animate);
    };
    raf = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(raf);
  }, []);

  useEffect(() => {
    const request = ++requestRef.current;
    setLoading(true); setError(null); setData(null); onData(null);
    if (!pdb) { setLoading(false); setError("Choose a protein to compare."); return; }
    const load = async () => {
      try {
        let atoms, sequence;
        if (mode === "rcsb") {
          const [pdbRes, entityRes] = await Promise.all([fetch(RCSB_PDB(pdb)), fetch(RCSB_ENTITY(pdb))]);
          if (!pdbRes.ok) throw new Error("RCSB structure unavailable");
          atoms = parsePDB(await pdbRes.text());
          const entity = entityRes.ok ? await entityRes.json() : null;
          sequence = entity?.entity_poly?.pdbx_seq_one_letter_code_can || "";
        } else {
          const uniRes = await fetch(UNIPROT_SEARCH(pdb));
          const uniData = await uniRes.json();
          const accession = uniData.results?.[0]?.primaryAccession;
          if (!accession) throw new Error("No UniProt mapping for this PDB");
          const afRes = await fetch(AF_API(accession));
          const afData = await afRes.json();
          const url = (Array.isArray(afData) ? afData[0] : afData)?.pdbUrl;
          if (!url) throw new Error("AlphaFold structure unavailable");
          atoms = parsePDB(await (await fetch(url)).text());
          sequence = uniData.results?.[0]?.sequence?.value || "";
        }
        if (request !== requestRef.current) return;
        if (!atoms.length) throw new Error("No Cα atoms found");
        const result = { atoms, sequence, calc: calcBioInfo(sequence), ssFrac: calcSSFraction(atoms), plddt: mode === "af" ? averagePlddt(atoms) : null };
        setData(result); onData(result); setLoading(false);
      } catch (loadError) {
        if (request !== requestRef.current) return;
        setError(loadError.message || "Unable to load structure"); setLoading(false);
      }
    };
    load();
  }, [pdb, mode, onData]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !data?.atoms?.length) return;
    const ctx = canvas.getContext("2d");
    canvas.width = canvas.offsetWidth; canvas.height = canvas.offsetHeight;
    const center = centroid(data.atoms), radius = maxR(data.atoms, center);
    const { x: rx, y: ry, zoom } = rotation;
    const project = atom => {
      const rotatedY = rotY3([atom[0] - center[0], atom[1] - center[1], atom[2] - center[2]], ry);
      const rotated = rotX3(rotatedY, rx);
      const scale = Math.min(canvas.width, canvas.height) * 0.38 * zoom / radius;
      return [canvas.width / 2 + rotated[0] * scale, canvas.height / 2 - rotated[1] * scale, rotated[2]];
    };
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    for (let i = 1; i < data.atoms.length; i++) {
      const previous = data.atoms[i - 1], atom = data.atoms[i];
      const gap = Math.hypot(atom[0] - previous[0], atom[1] - previous[1], atom[2] - previous[2]);
      if (gap > 6) continue;
      const start = project(previous), end = project(atom);
      const color = mode === "af" ? plddtColor(atom[5]) : SS_COLOR[atom[3] || 0];
      ctx.beginPath(); ctx.moveTo(start[0], start[1]); ctx.lineTo(end[0], end[1]);
      ctx.strokeStyle = color; ctx.lineWidth = atom[3] === 1 ? 4 : 2.5; ctx.lineCap = "round"; ctx.stroke();
    }
    if (showCAlpha) {
      const step = Math.max(1, Math.floor(data.atoms.length / 220));
      data.atoms.forEach((atom, index) => {
        if (index % step !== 0) return;
        const point = project(atom);
        ctx.beginPath(); ctx.arc(point[0], point[1], atom[3] === 1 ? 2.8 : 2.2, 0, Math.PI * 2);
        ctx.fillStyle = mode === "af" ? plddtColor(atom[5]) : SS_COLOR[atom[3] || 0]; ctx.fill();
      });
    }
  }, [data, mode, rotation, showCAlpha]);

  const pointerDown = event => { dragRef.current = { x: event.clientX, y: event.clientY }; event.currentTarget.setPointerCapture(event.pointerId); };
  const pointerMove = event => {
    if (!dragRef.current) return;
    const deltaX = event.clientX - dragRef.current.x;
    const deltaY = event.clientY - dragRef.current.y;
    setRotation(value => ({ ...value, y: value.y + deltaX * 0.01, x: value.x + deltaY * 0.01 }));
    dragRef.current = { x: event.clientX, y: event.clientY };
  };
  const pointerUp = () => { dragRef.current = null; };

  return (
    <article className="compare-card">
      <div className="compare-card-header"><div><span className="compare-card-label">{label}</span><h3>{PROTEINS[pdb]?.label || pdb} <span>{pdb}</span></h3></div><div className="compare-mode-toggle"><button className={mode === "rcsb" ? "active" : ""} onClick={() => setMode("rcsb")}>RCSB</button><button className={mode === "af" ? "active" : ""} onClick={() => setMode("af")}>AlphaFold</button></div></div>
      <button type="button" className={`compare-atom-toggle${showCAlpha ? " active" : ""}`} onClick={() => setShowCAlpha(value => !value)} aria-pressed={showCAlpha}>{showCAlpha ? "Hide" : "Show"} Cα atoms</button>
      <div className="compare-canvas-wrap"><canvas ref={canvasRef} onPointerDown={pointerDown} onPointerMove={pointerMove} onPointerUp={pointerUp} onPointerCancel={pointerUp} onWheel={event => setRotation(value => ({ ...value, zoom: Math.max(.5, Math.min(2.5, value.zoom - event.deltaY * .001)) }))} />{loading && <div className="compare-status">Loading {mode === "af" ? "AlphaFold" : "RCSB"}…</div>}{error && <div className="compare-status compare-status--error">{error}</div>}</div>
      {data?.calc && <div className="compare-stats"><div><span>Length</span><strong>{data.calc.len} aa</strong></div><div><span>Helix / Sheet</span><strong>{data.ssFrac.helix}% / {data.ssFrac.sheet}%</strong></div><div><span>Avg. pLDDT</span><strong>{data.plddt ? `${data.plddt}` : "—"}</strong></div><div><span>Charge at pH 7</span><strong>{data.calc.chargeAt7}</strong></div></div>}
    </article>
  );
}

function ProteinComparison({ primaryPdb, onClose }) {
  const availablePdbs = Object.keys(PROTEINS);
  const effectivePrimaryPdb = primaryPdb || availablePdbs[0];
  const [secondaryPdb, setSecondaryPdb] = useState(availablePdbs.find(pdb => pdb !== effectivePrimaryPdb) || availablePdbs[0]);
  const effectiveSecondaryPdb = secondaryPdb === effectivePrimaryPdb ? availablePdbs.find(pdb => pdb !== effectivePrimaryPdb) || availablePdbs[0] : secondaryPdb;
  const [primaryData, setPrimaryData] = useState(null);
  const [secondaryData, setSecondaryData] = useState(null);
  const primaryInfo = primaryData?.calc, secondaryInfo = secondaryData?.calc;
  const compositionDelta = primaryInfo && secondaryInfo
    ? Object.keys(AA_MASS).map(aa => ({ aa, delta: (secondaryInfo.composition.find(item => item.aa === aa)?.pct || 0) - (primaryInfo.composition.find(item => item.aa === aa)?.pct || 0) })).filter(item => item.delta !== 0).sort((a, b) => Math.abs(b.delta) - Math.abs(a.delta)).slice(0, 8)
    : [];

  return (
    <section className="protein-comparison">
      <div className="comparison-heading"><div><span className="compare-card-label">STRUCTURE COMPARISON</span><h2>Two proteins, one view</h2><p>Inspect geometry and statistics side by side. Drag either structure to rotate it.</p></div><button className="mv-btn mv-btn-secondary" onClick={onClose}>Disable comparison</button></div>
      <div className="comparison-picker"><label htmlFor="comparison-protein">Compare {effectivePrimaryPdb} with</label><select id="comparison-protein" value={effectiveSecondaryPdb} onChange={event => setSecondaryPdb(event.target.value)}>{Object.entries(PROTEINS).map(([pdb, protein]) => <option key={pdb} value={pdb} disabled={pdb === effectivePrimaryPdb}>{protein.label} ({pdb})</option>)}</select></div>
      <div className="comparison-cards"><ComparisonStructureCard pdb={effectivePrimaryPdb} label="Primary structure" onData={setPrimaryData} /><ComparisonStructureCard pdb={effectiveSecondaryPdb} label="Comparison structure" onData={setSecondaryData} /></div>
      {primaryInfo && secondaryInfo && <div className="comparison-deltas"><h3>Differences</h3><div className="comparison-delta-grid"><div><span>Length difference</span><strong>{secondaryInfo.len - primaryInfo.len > 0 ? "+" : ""}{secondaryInfo.len - primaryInfo.len} aa</strong></div><div><span>Charge difference</span><strong>{(parseFloat(secondaryInfo.chargeAt7) - parseFloat(primaryInfo.chargeAt7)).toFixed(2)}</strong></div><div><span>Helix difference</span><strong>{(parseFloat(secondaryData.ssFrac.helix) - parseFloat(primaryData.ssFrac.helix)).toFixed(1)}%</strong></div><div><span>Sheet difference</span><strong>{(parseFloat(secondaryData.ssFrac.sheet) - parseFloat(primaryData.ssFrac.sheet)).toFixed(1)}%</strong></div></div><div className="comparison-composition"><span>Largest composition shifts</span>{compositionDelta.map(({ aa, delta }) => <span key={aa} className={delta > 0 ? "delta-positive" : "delta-negative"}>{aa} {delta > 0 ? "+" : ""}{delta.toFixed(1)}%</span>)}</div></div>}
    </section>
  );
}

export { ProteinComparison, ComparisonStructureCard, averagePlddt };
export default ProteinComparison;
