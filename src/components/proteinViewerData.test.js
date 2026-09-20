import {
  AF_API,
  BLOCK_THRESHOLD,
  PROTEINS,
  RCSB_ENTITY,
  RCSB_META,
  RCSB_PDB,
  RCSB_SEARCH,
  SITE_COLORS,
  SS_COLOR,
  SS_WIDTH,
  UNIPROT_SEARCH,
  WARN_THRESHOLD,
  plddtColor,
} from "./proteinViewerData.js";

describe("protein viewer data contracts", () => {
  test("builds the external structure URLs", () => {
    expect(RCSB_META("1mbn")).toContain("/entry/1mbn");
    expect(RCSB_ENTITY("1MBN")).toContain("/polymer_entity/1MBN/1");
    expect(RCSB_PDB("1MBN")).toBe("https://files.rcsb.org/download/1MBN.pdb");
    expect(AF_API("P12345")).toBe("https://alphafold.ebi.ac.uk/api/prediction/P12345");
    expect(UNIPROT_SEARCH("1MBN")).toContain("xref%3Apdb-1MBN");
    expect(RCSB_SEARCH).toContain("search.rcsb.org");
  });

  test("exposes the configured catalog and rendering thresholds", () => {
    expect(PROTEINS["1MBN"]).toMatchObject({ label: "Myoglobin", class: "All-α" });
    expect(PROTEINS["5XNL"].tier).toBe("advanced");
    expect(WARN_THRESHOLD).toBeLessThan(BLOCK_THRESHOLD);
    expect(SS_COLOR[1]).toBe("#79a8ca");
    expect(SS_WIDTH[1]).toBeGreaterThan(SS_WIDTH[0]);
    expect(SITE_COLORS["Active site"]).toBeDefined();
  });

  test("maps pLDDT values to confidence colors", () => {
    expect(plddtColor(95)).toBe("#5f8f7b");
    expect(plddtColor(80)).toBe("#6f90b0");
    expect(plddtColor(60)).toBe("#b89257");
    expect(plddtColor(20)).toBe("#a97878");
  });
});
