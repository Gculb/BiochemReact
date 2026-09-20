import {
  buildFallback,
  buildResidueMap,
  calcBioInfo,
  calcSSFraction,
  centroid,
  countAtoms,
  generateUnfolded,
  hexRgba,
  maxR,
  parsePDB,
  rotX3,
  rotY3,
  spline,
} from "./proteinViewerUtils.js";

describe("protein viewer utilities", () => {
  test("returns null for empty or non-canonical sequences", () => {
    expect(calcBioInfo("")).toBeNull();
    expect(calcBioInfo("123---")).toBeNull();
  });

  test("calculates composition classes and terminal half-life", () => {
    const result = calcBioInfo("ACDEFGHIKLMNPQRSTVWY");

    expect(result.len).toBe(20);
    expect(result.composition).toHaveLength(20);
    expect(result.classes.charged).toBe(5);
    expect(result.nTerm).toBe("A");
    expect(result.halflife).toEqual({ mam: "4.4h", yeast: ">20h", ecoli: ">10h" });
  });

  test("maps structure residues and counts atom records", () => {
    const atoms = [
      [1, 2, 3, 1, 10, 0],
      [4, 5, 6, 2, 11, 0],
      [7, 8, 9, 0, null, 0],
    ];

    expect(buildResidueMap(atoms)).toEqual({ 10: 0, 11: 1 });
    expect(countAtoms("ATOM one\nHETATM two\nATOM three")).toBe(2);
    expect(calcSSFraction(atoms)).toEqual({ helix: "33.3", sheet: "33.3", coil: "33.3" });
    expect(calcSSFraction([])).toBeNull();
  });

  test("parses C-alpha atoms and secondary structure annotations", () => {
    const pdb = [
      "HELIX    1   1 ALA A    1  GLY A    2  1                                  ",
      "SHEET    1   A 1 VAL A   3  THR A   3  0                                ",
      "ATOM      1  CA  ALA A   1      11.104  13.207   9.456  1.00 20.00           C  ",
      "ATOM      2  CA  GLY A   2      12.104  14.207  10.456  1.00 30.00           C  ",
      "ATOM      3  CA  VAL A   3      13.104  15.207  11.456  1.00 40.00           C  ",
      "ATOM      4  N   VAL A   3      13.000  15.000  11.000  1.00 40.00           N  ",
    ].join("\n");

    expect(parsePDB(pdb)).toEqual([
      [11.104, 13.207, 9.456, 1, 1, 20],
      [12.104, 14.207, 10.456, 1, 2, 30],
      [13.104, 15.207, 11.456, 2, 3, 40],
    ]);
  });

  test("generates deterministic unfolding and fallback geometry", () => {
    const atoms = [[0, 0, 0, 1, 1, 0], [3, 0, 0, 2, 2, 0]];

    expect(generateUnfolded(atoms, 42)).toEqual(generateUnfolded(atoms, 42));
    expect(generateUnfolded(atoms, 42)).not.toEqual(generateUnfolded(atoms, 43));
    expect(buildFallback("1MBN").length).toBeGreaterThan(0);
    expect(buildFallback("unknown").every(atom => atom)).toBe(true);
  });

  test("provides stable geometry helpers", () => {
    const atoms = [[0, 0, 0], [2, 0, 0]];
    expect(centroid(atoms)).toEqual([1, 0, 0]);
    expect(maxR(atoms, [1, 0, 0])).toBe(1);
    expect(rotY3([1, 0, 0], 0)).toEqual([1, 0, 0]);
    expect(rotX3([1, 2, 3], 0)).toEqual([1, 2, 3]);
    expect(spline([[0, 0, 0], [1, 1, 1]], 2)).toHaveLength(3);
    expect(hexRgba("#ffffff", 0.5)).toBe("rgba(255,255,255,0.50)");
  });
});
