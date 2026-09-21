import React, { useState } from "react";
import { SITE_COLORS, SS_COLOR } from "./proteinViewerData.js";
import { calcBioInfo } from "./proteinViewerUtils.js";

const AA_COLORS = {
  A:"#82a993",R:"#c88c8c",N:"#8eb4c7",D:"#c88c8c",C:"#d1bf78",E:"#c88c8c",
  Q:"#8eb4c7",G:"#8d98a4",H:"#a189bc",I:"#82a993",L:"#82a993",K:"#c88c8c",
  M:"#d1bf78",F:"#b694bf",P:"#8eb4c7",S:"#7397b8",T:"#7397b8",W:"#b694bf",
  Y:"#b694bf",V:"#82a993",
};

const AA_INFO = {
  A: { name: "Alanine",       category: "Non-polar",    mw: 89.1,  codons: "GCU, GCC, GCA, GCG" },
  R: { name: "Arginine",      category: "Charged (+)",  mw: 174.2, codons: "CGU, CGC, CGA, CGG, AGA, AGG" },
  N: { name: "Asparagine",    category: "Polar",        mw: 132.1, codons: "AAU, AAC" },
  D: { name: "Aspartate",     category: "Charged (−)",  mw: 133.1, codons: "GAU, GAC" },
  C: { name: "Cysteine",      category: "Polar",        mw: 121.2, codons: "UGU, UGC" },
  E: { name: "Glutamate",     category: "Charged (−)",  mw: 147.1, codons: "GAA, GAG" },
  Q: { name: "Glutamine",     category: "Polar",        mw: 146.2, codons: "CAA, CAG" },
  G: { name: "Glycine",       category: "Non-polar",    mw: 75.1,  codons: "GGU, GGC, GGA, GGG" },
  H: { name: "Histidine",     category: "Charged (+)",  mw: 155.2, codons: "CAU, CAC" },
  I: { name: "Isoleucine",    category: "Non-polar",    mw: 131.2, codons: "AUU, AUC, AUA" },
  L: { name: "Leucine",       category: "Non-polar",    mw: 131.2, codons: "UUA, UUG, CUU, CUC, CUA, CUG" },
  K: { name: "Lysine",        category: "Charged (+)",  mw: 146.2, codons: "AAA, AAG" },
  M: { name: "Methionine",    category: "Non-polar",    mw: 149.2, codons: "AUG" },
  F: { name: "Phenylalanine", category: "Aromatic",     mw: 165.2, codons: "UUU, UUC" },
  P: { name: "Proline",       category: "Non-polar",    mw: 115.1, codons: "CCU, CCC, CCA, CCG" },
  S: { name: "Serine",        category: "Polar",        mw: 105.1, codons: "UCU, UCC, UCA, UCG, AGU, AGC" },
  T: { name: "Threonine",     category: "Polar",        mw: 119.1, codons: "ACU, ACC, ACA, ACG" },
  W: { name: "Tryptophan",    category: "Aromatic",     mw: 204.2, codons: "UGG" },
  Y: { name: "Tyrosine",      category: "Aromatic",     mw: 181.2, codons: "UAU, UAC" },
  V: { name: "Valine",        category: "Non-polar",    mw: 99.1,  codons: "GUU, GUC, GUA, GUG" },
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

const StatGrid = ({ cells }) => {
  const [selected, setSelected] = useState(null);
  const selectedCell = cells[selected ?? 0];

  return (
    <div className="bio-stat-grid-wrap">
      <div className="bio-stat-grid">
        {cells.map(({ label, value, unit, sub, accent }, i) => (
          <button
            key={label}
            type="button"
            className={`bio-stat-cell${selected === i ? " bio-stat-cell--selected" : ""}`}
            onClick={() => setSelected(selected === i ? null : i)}
            aria-pressed={selected === i}
          >
            <span className="bio-stat-label">{label}</span>
            <span className="bio-stat-value" style={accent ? { color: accent } : {}}>
              {value}{unit && <span className="bio-stat-unit"> {unit}</span>}
            </span>
            {sub && <span className="bio-stat-sub">{sub}</span>}
          </button>
        ))}
      </div>
      {selected != null && selectedCell?.sub && (
        <div className="bio-stat-detail" role="status">
          <strong>{selectedCell.label}</strong>
          <span>{selectedCell.sub}</span>
        </div>
      )}
    </div>
  );
};

const CompositionChart = ({ composition }) => {
  const [selectedAa, setSelectedAa] = useState(null);
  const maxPct = Math.max(...composition.map(c => parseFloat(c.pct)));
  const selected = composition.find(({ aa }) => aa === selectedAa);
  const selectedInfo = selected ? AA_INFO[selected.aa] : null;

  return (
    <div className="bio-comp-chart" aria-label="Amino acid composition">
      {[...composition].sort((a, b) => b.pct - a.pct).map(({ aa, pct, count }) => {
        const info = AA_INFO[aa];
        return (
          <button
            key={aa}
            type="button"
            className={`bio-comp-row${selectedAa === aa ? " bio-comp-row--selected" : ""}`}
            onClick={() => setSelectedAa(selectedAa === aa ? null : aa)}
            aria-pressed={selectedAa === aa}
            title={`${info?.name ?? aa}: ${count} residues (${pct}%)`}
          >
            <span className="bio-comp-aa" style={{ color: AA_COLORS[aa] || "#79a8ca" }}>{aa}</span>
            <span className="bio-comp-name">{info?.name ?? ""}</span>
            <div className="bio-comp-track">
              <div className="bio-comp-fill" style={{ width: `${(parseFloat(pct) / maxPct) * 100}%`, background: AA_COLORS[aa] || "#79a8ca" }} />
            </div>
            <span className="bio-comp-pct">{pct}%</span>
          </button>
        );
      })}
      {selected && selectedInfo && (
        <div className="bio-comp-detail" role="status">
          <strong>{selectedInfo.name} ({selected.aa})</strong>
          <span>{selected.count} residues · {selected.pct}% of sequence</span>
          <span>Category: {selectedInfo.category}</span>
          <span>Mol. weight: {selectedInfo.mw} Da</span>
          <span>Codons: {selectedInfo.codons}</span>
        </div>
      )}
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
          <button key={t.id} className={`bio-tab${tab === t.id ? " bio-tab--active" : ""}`} onClick={() => setTab(t.id)}>{t.label}</button>
        ))}
      </div>
      {tab === "physchem" && <div className="bio-content">{calc ? <>
        <StatGrid cells={[
          { label: "Mol. Weight", value: calc.mw, unit: "kDa", sub: `${Math.round(calc.mwRaw).toLocaleString()} Da` },
          { label: "Length", value: calc.len, unit: "aa" },
          { label: "Isoelectric pt", value: calc.pI, unit: "pH", accent: parseFloat(calc.pI) > 7 ? "#c8a35b" : "#79a8ca", sub: parseFloat(calc.pI) > 7 ? "Basic protein" : parseFloat(calc.pI) < 7 ? "Acidic protein" : "Neutral" },
          { label: "Charge at pH 7", value: (parseFloat(calc.chargeAt7) > 0 ? "+" : "") + calc.chargeAt7, accent: parseFloat(calc.chargeAt7) > 0 ? "#c8a35b" : "#79a8ca" },
        ]} />
        <div className="bio-divider" />
        <MetricBar label="GRAVY Score (Kyte-Doolittle)" value={calc.gravy} rawValue={parseFloat(calc.gravy) + 4.5} max={9} color={parseFloat(calc.gravy) > 0 ? "#c8a35b" : "#79a8ca"} note={`${parseFloat(calc.gravy) > 0 ? "Hydrophobic" : "Hydrophilic"} overall tendency`} />
        <MetricBar label="Aliphatic Index (thermostability)" value={calc.aliphIdx} rawValue={parseFloat(calc.aliphIdx)} max={150} color="#82a993" note={`${parseFloat(calc.aliphIdx) > 80 ? "High thermostability" : parseFloat(calc.aliphIdx) > 50 ? "Moderate stability" : "Lower stability"} (Ikai 1980)`} />
        <MetricBar label="Instability Index" value={calc.instabilityIdx} rawValue={parseFloat(calc.instabilityIdx)} max={100} color={calc.isStable ? "#82a993" : "#c88c8c"} note={`${calc.isStable ? "✓ Predicted stable in vitro" : "⚠ Predicted unstable"} (Guruprasad 1990, cutoff: 40)`} />
        <div className="bio-divider" />
        <StatGrid cells={[
          { label: "ε₂₈₀ reduced", value: calc.extCoeff, unit: "M⁻¹cm⁻¹", sub: "Extinction coefficient" },
          { label: "A₂₈₀ (0.1%)", value: calc.absCoeff, unit: "g⁻¹Lcm⁻¹", sub: "Absorbance (Pace 1995)" },
          { label: "+ Charged res.", value: calc.posCharged, sub: "Arg + Lys + His", accent: "#c8a35b" },
          { label: "− Charged res.", value: calc.negCharged, sub: "Asp + Glu", accent: "#79a8ca" },
        ]} />
        <div className="bio-divider" />
        <div className="bio-sublabel">N-terminal half-life — {calc.nTerm}– (N-end rule)</div>
        <div className="bio-halflife-grid">
          <div className="bio-hl-cell"><span>Mammalian</span><strong>{calc.halflife.mam}</strong></div>
          <div className="bio-hl-cell"><span>Yeast</span><strong>{calc.halflife.yeast}</strong></div>
          <div className="bio-hl-cell"><span>E. coli</span><strong>{calc.halflife.ecoli}</strong></div>
        </div>
        <div className="bio-footnote">Bachmair &amp; Varshavsky 1986 / Varshavsky 1992</div>
        {uniprot?.accession && <a href={`https://www.uniprot.org/uniprot/${uniprot.accession}`} target="_blank" rel="noreferrer" className="bio-uniprot-link">↗ UniProt {uniprot.accession}</a>}
      </> : <div className="bio-empty">Select a protein to compute statistics.</div>}</div>}
      {tab === "structure" && <div className="bio-content">{ssFrac ? <>
        <div className="bio-sublabel" style={{ marginBottom: "10px" }}>Secondary structure from Cα trace</div>
        <div className="bio-ss-row"><SSDonut ssFrac={ssFrac} /><div className="bio-ss-bars">
          <MetricBar label="α-Helix" value={`${ssFrac.helix}%`} rawValue={parseFloat(ssFrac.helix)} max={100} color={SS_COLOR[1]} />
          <MetricBar label="β-Sheet" value={`${ssFrac.sheet}%`} rawValue={parseFloat(ssFrac.sheet)} max={100} color={SS_COLOR[2]} />
          <MetricBar label="Coil / Loop" value={`${ssFrac.coil}%`} rawValue={parseFloat(ssFrac.coil)} max={100} color={SS_COLOR[0]} />
        </div></div>
        <div className="bio-divider" />
        <StatGrid cells={[
          { label: "Resolution", value: meta?.resolution ?? "—", unit: "Å", accent: meta?.resolution ? parseFloat(meta.resolution) < 2 ? "#82a993" : parseFloat(meta.resolution) < 3 ? "#c8a35b" : "#c88c8c" : undefined, sub: meta?.resolution ? parseFloat(meta.resolution) < 2 ? "High quality" : parseFloat(meta.resolution) < 3 ? "Good quality" : "Moderate quality" : undefined },
          { label: "Exp. method", value: meta?.method?.split(" ")?.[0] ?? "—" },
          { label: "Chains", value: meta?.chains ?? "—" },
          { label: "Total atoms", value: meta?.atoms ?? "—" },
        ]} />
        {meta?.deposited && <div className="bio-footnote" style={{ marginTop: "8px" }}>PDB deposited: {meta.deposited}</div>}
      </> : <div className="bio-empty">No structure data loaded.</div>}</div>}
      {tab === "function" && <div className="bio-content">
        {uniprot?.function ? <div className="bio-func-text">{uniprot.function}</div> : <div className="bio-empty">No UniProt function annotation available.</div>}
        {uniprot?.subcell?.length > 0 && <><div className="bio-sublabel" style={{ marginTop: "12px" }}>Subcellular location</div><div className="bio-tag-cloud">{uniprot.subcell.map((s, i) => <span key={i} className="bio-tag bio-tag--cyan">{s}</span>)}</div></>}
        {uniprot?.cofactors?.length > 0 && <><div className="bio-sublabel" style={{ marginTop: "10px" }}>Cofactors</div><div className="bio-tag-cloud">{uniprot.cofactors.map((c, i) => <span key={i} className="bio-tag bio-tag--yellow">{c}</span>)}</div></>}
        {uniprot?.diseases?.length > 0 && <><div className="bio-sublabel" style={{ marginTop: "10px" }}>Disease associations</div><div className="bio-tag-cloud">{uniprot.diseases.map((d, i) => <span key={i} className="bio-tag bio-tag--red">{d}</span>)}</div></>}
        {uniprot?.keywords?.length > 0 && <><div className="bio-sublabel" style={{ marginTop: "10px" }}>Keywords</div><div className="bio-tag-cloud">{uniprot.keywords.slice(0, 12).map((k, i) => <span key={i} className="bio-tag bio-tag--blue">{k}</span>)}</div></>}
        {!uniprot && <div className="bio-empty" style={{ marginTop: "10px" }}>No UniProt entry found for this PDB ID.</div>}
      </div>}
      {tab === "domains" && <div className="bio-content">
        {uniprot?.domains?.length > 0 ? <div className="bio-domain-list">{uniprot.domains.map((d, i) => <div key={i} className="bio-domain-item"><div className="bio-domain-type">{d.type}</div><div className="bio-domain-desc">{d.description}</div>{d.start != null && <div className="bio-domain-pos"><span>pos {d.start}–{d.end}</span><span className="bio-domain-len">{d.end - d.start + 1} aa</span></div>}</div>)}</div> : <div className="bio-empty">No domain annotations found.</div>}
        {uniprot?.organism && <div className="bio-organism-block"><div className="bio-sublabel">Source organism</div><div className="bio-organism-name">{uniprot.organism}</div>{uniprot.gene && <div className="bio-gene">Gene: <strong>{uniprot.gene}</strong></div>}</div>}
      </div>}
      {tab === "sites" && <div className="bio-content">{activeSites?.length > 0 ? <>
        <div className="bio-sublabel" style={{ marginBottom: "8px" }}>Click a site to highlight it on the structure</div>
        <div className="bio-site-list">{activeSites.map((site, i) => { const color = SITE_COLORS[site.type] || SITE_COLORS.default; return <div key={i} className="bio-site-item" onClick={() => onSiteClick(site)} style={{ borderLeft: `3px solid ${color}` }}><div className="bio-site-header"><span className="bio-site-type" style={{ color }}>{site.type}</span>{site.position != null && <span className="bio-site-pos">res. {site.position}</span>}</div>{site.description && <div className="bio-site-desc">{site.description}</div>}{site.ligand && <div className="bio-site-ligand">Ligand: {site.ligand}</div>}</div>; })}</div>
        <div className="bio-footnote" style={{ marginTop: "10px" }}>Source: UniProt feature annotations</div>
      </> : <div className="bio-empty">No active site / binding site annotations found for this entry.</div>}</div>}
      {tab === "comp" && <div className="bio-content">{calc ? <>
        <div className="bio-sublabel" style={{ marginBottom: "8px" }}>AA class breakdown</div><ClassDonut classes={calc.classes} total={calc.len} /><div className="bio-divider" /><div className="bio-sublabel" style={{ marginBottom: "6px" }}>Residue frequency — all 20 canonical AAs</div><CompositionChart composition={calc.composition} />
      </> : <div className="bio-empty">Load a protein to see composition.</div>}</div>}
    </div>
  );
}

export { BioInfoPanel, MetricBar, StatGrid, CompositionChart, ClassDonut, SSDonut, ActiveSiteTooltip, PlddtLegend };
export default BioInfoPanel;