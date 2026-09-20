import React, { useState } from "react";
import { PROTEINS, RCSB_META, RCSB_PDB, RCSB_SEARCH } from "./proteinViewerData.js";
import { countAtoms } from "./proteinViewerUtils.js";

export default function ProteinSearch({ onLoad }) {
  const [query, setQuery] = useState("");
  const [searching, setSearching] = useState(false);
  const [err, setErr] = useState("");
  const [databaseResults, setDatabaseResults] = useState([]);
  const suggestions = Object.entries(PROTEINS)
    .filter(([pdb, protein]) => !query || pdb.includes(query.toUpperCase()) || protein.label.toUpperCase().includes(query.toUpperCase()))
    .sort(([firstPdb], [secondPdb]) => firstPdb.localeCompare(secondPdb));

  const loadSuggestion = pdb => {
    setQuery(pdb);
    setErr("");
    onLoad(pdb, 0, null);
  };

  const submit = async event => {
    event?.preventDefault();
    const searchTerm = query.trim();
    if (!searchTerm || searchTerm.length < 2) { setErr("Enter a PDB ID or protein name to search."); return; }
    setErr(""); setDatabaseResults([]); setSearching(true);
    try {
      const exactId = /^[a-z0-9]{4}$/i.test(searchTerm) ? searchTerm.toUpperCase() : null;
      if (exactId) {
        const [metaRes, pdbRes] = await Promise.all([fetch(RCSB_META(exactId)), fetch(RCSB_PDB(exactId))]);
        if (!metaRes.ok || !pdbRes.ok) throw new Error(`PDB entry "${exactId}" was not found.`);
        const pdbText = await pdbRes.text();
        if (!pdbText.includes("ATOM")) throw new Error(`PDB entry "${exactId}" has no renderable atom data.`);
        onLoad(exactId, countAtoms(pdbText), pdbText);
      } else {
        const response = await fetch(RCSB_SEARCH, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            query: { type: "terminal", service: "full_text", parameters: { value: searchTerm } },
            return_type: "entry",
            request_options: { paginate: { start: 0, rows: 8 } },
          }),
        });
        if (!response.ok) throw new Error("RCSB search is temporarily unavailable.");
        const result = await response.json();
        const entries = await Promise.all((result.result_set || []).slice(0, 8).map(async item => {
          const pdb = item.identifier.toUpperCase();
          try {
            const metadata = await fetch(RCSB_META(pdb)).then(res => res.ok ? res.json() : null);
            return { pdb, title: metadata?.struct?.title || "Untitled structure" };
          } catch { return { pdb, title: "RCSB structure" }; }
        }));
        if (!entries.length) throw new Error(`No RCSB structures matched "${searchTerm}".`);
        setDatabaseResults(entries);
      }
    } catch (searchError) { setErr(searchError.message || "Network error. Try again."); }
    finally { setSearching(false); }
  };

  return (
    <div className="mv-section">
      <h4>Custom PDB Search</h4>
      <form className="mv-form" onSubmit={submit}>
        <input className="mv-input" value={query} onChange={e => { setQuery(e.target.value.slice(0, 80)); setErr(""); setDatabaseResults([]); }}
          placeholder="PDB ID or protein name" spellCheck={false} aria-label="PDB ID or protein name" />
        <button className="mv-btn" type="submit" disabled={searching}>{searching ? "Searching…" : "Search"}</button>
      </form>
      {suggestions.length > 0 && (
        <div className="mv-search-suggestions" aria-label="Suggested proteins">
          {suggestions.map(([pdb, protein]) => <button key={pdb} type="button" onClick={() => loadSuggestion(pdb)}>{protein.label}<span>{pdb}</span></button>)}
        </div>
      )}
      {databaseResults.length > 0 && (
        <div className="mv-search-results" aria-live="polite">
          <div className="mv-search-results-heading">RCSB database matches</div>
          {databaseResults.map(result => <button key={result.pdb} type="button" onClick={() => loadSuggestion(result.pdb)}><span>{result.title}</span><strong>{result.pdb}</strong></button>)}
        </div>
      )}
      {err && <div className="mv-search-message mv-search-message--error" role="alert">{err}</div>}
      {!err && <p className="mv-search-help">Search any 4-character RCSB PDB identifier or choose a suggestion.</p>}
    </div>
  );
}
