import { useCallback, useEffect, useRef } from "react";
import {
  AF_API, BLOCK_THRESHOLD, RCSB_ENTITY, RCSB_META, RCSB_PDB,
  UNIPROT_SEARCH, WARN_THRESHOLD,
} from "./proteinViewerData.js";

const useProteinLoader = ({
  stateRef,
  uniprotAcc,
  sizeWarning,
  setLoading,
  setError,
  setMeta,
  setSequence,
  setCurrentPdb,
  setSSFrac,
  setAlphaFoldMode,
  setAfError,
  setSelectedSite,
  setFoldT,
  setUniprotAcc,
  setUniprot,
  setActiveSites,
  setAfLoading,
  setSizeWarning,
  buildFallback,
  parsePDB,
  buildResidueMap,
  calcSSFraction,
  generateUnfolded,
  centroid,
  maxR,
}) => {
  const loadGenerationRef = useRef(0);
  const structureWorkerRef = useRef(null);
  const workerRequestRef = useRef(0);

  const prepareStructure = useCallback((pdb, pdbText) => {
    const fallback = () => {
      const atoms = pdbText && pdbText.includes("ATOM") ? parsePDB(pdbText) : buildFallback(pdb);
      if (!atoms.length) throw new Error("No Cα atoms found.");
      const center = centroid(atoms);
      return {
        atoms,
        unfolded: generateUnfolded(atoms),
        center,
        radius: maxR(atoms, center),
        residueMap: buildResidueMap(atoms),
        ssFrac: calcSSFraction(atoms),
      };
    };

    if (typeof Worker === "undefined") return Promise.resolve().then(fallback);
    if (!structureWorkerRef.current) {
      try {
        structureWorkerRef.current = new Worker(`${process.env.PUBLIC_URL || ""}/proteinStructure.worker.js`);
      } catch {
        return Promise.resolve().then(fallback);
      }
    }

    const worker = structureWorkerRef.current;
    const id = ++workerRequestRef.current;
    return new Promise((resolve, reject) => {
      const handleMessage = event => {
        if (event.data.id !== id) return;
        worker.removeEventListener("message", handleMessage);
        worker.removeEventListener("error", handleError);
        if (event.data.error) Promise.resolve().then(fallback).then(resolve).catch(reject);
        else resolve(event.data);
      };
      const handleError = () => {
        worker.removeEventListener("message", handleMessage);
        worker.removeEventListener("error", handleError);
        structureWorkerRef.current = null;
        Promise.resolve().then(fallback).then(resolve).catch(reject);
      };
      worker.addEventListener("message", handleMessage);
      worker.addEventListener("error", handleError, { once: true });
      worker.postMessage({ id, pdb, pdbText });
    });
  }, [buildFallback, buildResidueMap, calcSSFraction, centroid, generateUnfolded, maxR, parsePDB]);

  useEffect(() => () => {
    structureWorkerRef.current?.terminate();
    structureWorkerRef.current = null;
  }, []);

  const fetchUniprot = useCallback(async (pdb, loadGeneration) => {
    setUniprot(null);
    setActiveSites([]);
    setSelectedSite(null);
    try {
      const res = await fetch(UNIPROT_SEARCH(pdb));
      if (!res.ok) return;
      const data = await res.json();
      if (loadGeneration !== loadGenerationRef.current) return;
      const entry = data.results?.[0];
      if (!entry) return;

      const fn = entry.comments?.find(c => c.commentType === "FUNCTION")?.texts?.[0]?.value || null;
      const diseases = entry.comments?.filter(c => c.commentType === "DISEASE")?.map(c => c.disease?.diseaseName?.value)?.filter(Boolean) || [];
      const domains = entry.features?.filter(f => ["Domain", "Repeat", "Motif", "Region"].includes(f.type))?.slice(0, 10)?.map(f => ({ type: f.type, description: f.description || f.type, start: f.location?.start?.value, end: f.location?.end?.value })) || [];
      const keywords = entry.keywords?.map(k => k.name) || [];
      const organism = entry.organism?.scientificName || null;
      const gene = entry.genes?.[0]?.geneName?.value || null;
      const subcell = entry.comments?.filter(c => c.commentType === "SUBCELLULAR LOCATION")?.flatMap(c => c.subcellularLocations?.map(s => s.location?.value))?.filter(Boolean) || [];
      const cofactors = entry.comments?.filter(c => c.commentType === "COFACTOR")?.flatMap(c => c.cofactors?.map(cf => cf.name))?.filter(Boolean) || [];

      const siteFeatures = entry.features?.filter(f => ["Active site", "Binding site", "Site"].includes(f.type)) || [];
      const parsedSites = siteFeatures.map(f => ({
        type: f.type,
        description: f.description || null,
        position: f.location?.start?.value ?? null,
        ligand: f.ligand?.name || null,
      }));
      setActiveSites(parsedSites);

      const accession = entry.primaryAccession;
      setUniprotAcc(accession);
      stateRef.current.uniprotAcc = accession;
      setUniprot({ accession, function: fn, diseases, domains, keywords, organism, gene, subcell, cofactors });

      return accession;
    } catch {}
  }, [setActiveSites, setSelectedSite, setUniprot, setUniprotAcc, stateRef]);

  const fetchAlphaFold = useCallback(async (requestedAcc) => {
    const loadGeneration = loadGenerationRef.current;
    const accession = (requestedAcc || uniprotAcc || stateRef.current.uniprotAcc || "").trim();
    if (!accession) {
      setAfError("No UniProt accession available for AlphaFold lookup.");
      return;
    }

    setAfLoading(true);
    setAfError(null);
    try {
      const res = await fetch(AF_API(accession));
      if (!res.ok) throw new Error("AlphaFold entry not found");
      const data = await res.json();
      const entry = Array.isArray(data) ? data[0] : data;
      const pdbUrl = entry?.pdbUrl || entry?.cifUrl || entry?.bcifUrl || entry?.modelUrl || entry?.pdb_url;

      if (!pdbUrl) throw new Error("No structure URL in AlphaFold response");

      const pdbText = await fetch(pdbUrl).then(r => r.text());
      if (loadGeneration !== loadGenerationRef.current) return;
      const prepared = await prepareStructure("", pdbText);
      const { atoms: afAtoms, center: c, radius: r, unfolded, residueMap } = prepared;

      stateRef.current.atoms = afAtoms;
      stateRef.current.nativeAtoms = afAtoms;
      stateRef.current.unfoldedXYZ = unfolded;
      stateRef.current.center = c;
      stateRef.current.radius = r;
      stateRef.current.residueMap = residueMap;
      stateRef.current.foldT = 0;
      stateRef.current.alphaFoldMode = true;
      stateRef.current.uniprotAcc = accession;

      setFoldT(0);
      setAlphaFoldMode(true);
      setSSFrac(prepared.ssFrac);
      setUniprotAcc(accession);
    } catch (e) {
      setAfError(e.message || "AlphaFold fetch failed.");
    } finally {
      setAfLoading(false);
    }
  }, [prepareStructure, setAfError, setAfLoading, setAlphaFoldMode, setFoldT, setSSFrac, setUniprotAcc, stateRef, uniprotAcc]);

  const loadProtein = useCallback(async (pdb, preloadedPdbText) => {
    const loadGeneration = ++loadGenerationRef.current;
    setLoading(true); setError(null); setMeta(null); setSequence("");
    setCurrentPdb(pdb); setSSFrac(null); setAlphaFoldMode(false);
    setAfError(null); setSelectedSite(null); setFoldT(0);
    setUniprotAcc("");
    stateRef.current.uniprotAcc = "";

    const [metaRes, pdbRes, entityRes] = await Promise.allSettled([
      fetch(RCSB_META(pdb)).then(r => r.json()),
      preloadedPdbText ? Promise.resolve(preloadedPdbText) : fetch(RCSB_PDB(pdb)).then(r => r.text()),
      fetch(RCSB_ENTITY(pdb)).then(r => r.json()),
    ]);
    if (loadGeneration !== loadGenerationRef.current) return;

    if (metaRes.status === "fulfilled") {
      const d = metaRes.value;
      setMeta({
        title: d.struct?.title || pdb,
        method: d.exptl?.[0]?.method || "—",
        resolution: d.refine?.[0]?.ls_d_res_high?.toFixed(2) ?? d.em_3d_reconstruction?.[0]?.resolution?.toFixed(2) ?? "—",
        deposited: d.rcsb_accession_info?.initial_release_date?.split("T")[0] || "—",
        atoms: d.rcsb_entry_info?.deposited_atom_count?.toLocaleString() || "—",
        keywords: d.struct_keywords?.pdbx_keywords || "—",
        chains: d.rcsb_entry_info?.polymer_entity_count || "—",
      });
    }
    if (entityRes.status === "fulfilled") setSequence(entityRes.value?.entity_poly?.pdbx_seq_one_letter_code_can || "");

    const pdbText = pdbRes.status === "fulfilled" ? pdbRes.value : null;
    let prepared;
    try {
      prepared = await prepareStructure(pdb, pdbText);
    } catch (loadError) {
      setError(loadError.message || "No Cα atoms found.");
      setLoading(false);
      return;
    }
    const { atoms, center: c, radius: r, unfolded, residueMap, ssFrac: preparedSSFrac } = prepared;

    stateRef.current.atoms = atoms;
    stateRef.current.nativeAtoms = atoms;
    stateRef.current.unfoldedXYZ = unfolded;
    stateRef.current.rcsbAtoms = atoms;
    stateRef.current.rcsbUnfoldedXYZ = unfolded;
    stateRef.current.center = c;
    stateRef.current.radius = r;
    stateRef.current.residueMap = residueMap;
    stateRef.current.rx = 0.3;
    stateRef.current.ry = 0.4;
    stateRef.current.foldT = 0;
    stateRef.current.alphaFoldMode = false;
    stateRef.current.activeSiteProjections = [];

    setSSFrac(preparedSSFrac);
    setLoading(false);

    const acc = await fetchUniprot(pdb, loadGeneration);
    if (loadGeneration !== loadGenerationRef.current) return;
    stateRef.current.uniprotAcc = acc || null;
  }, [fetchUniprot, prepareStructure, setAfError, setAlphaFoldMode, setCurrentPdb, setError, setFoldT, setLoading, setMeta, setSelectedSite, setSequence, setSSFrac, setUniprotAcc, stateRef]);

  const handleCustomLoad = useCallback((id, atomCount, pdbText) => {
    if (atomCount > BLOCK_THRESHOLD) setSizeWarning({ id, atomCount, pdbText, level: "large" });
    else if (atomCount > WARN_THRESHOLD) setSizeWarning({ id, atomCount, pdbText, level: "warn" });
    else loadProtein(id, pdbText);
  }, [loadProtein, setSizeWarning]);

  const confirmSizeWarning = useCallback(() => {
    if (!sizeWarning) return;
    loadProtein(sizeWarning.id, sizeWarning.pdbText);
    setSizeWarning(null);
  }, [loadProtein, setSizeWarning, sizeWarning]);

  return { fetchAlphaFold, loadProtein, handleCustomLoad, confirmSizeWarning };
};

export default useProteinLoader;
