import { calcBioInfo, calcSSFraction, generateUnfolded, parsePDB } from "./proteinViewer";

describe("protein viewer calculations", () => {
  test("calculates sequence statistics", () => {
    const result = calcBioInfo("ACDEFGHIKLMNPQRSTVWY");

    expect(result.len).toBe(20);
    expect(result.composition).toHaveLength(20);
    expect(Number(result.mw)).toBeGreaterThan(1);
    expect(result.pI).toMatch(/^\d+\.\d{2}$/);
  });

  test("calculates secondary structure fractions", () => {
    const atoms = [
      [0, 0, 0, 1, 1, 0],
      [1, 0, 0, 1, 2, 0],
      [2, 0, 0, 2, 3, 0],
      [3, 0, 0, 0, 4, 0],
    ];

    expect(calcSSFraction(atoms)).toEqual({ helix: "50.0", sheet: "25.0", coil: "25.0" });
  });

  test("parses C-alpha coordinates and secondary structure", () => {
    const pdb = [
      "HELIX    1   1 ALA A    1  GLY A    2  1                                  ",
      "ATOM      1  CA  ALA A   1      11.104  13.207   9.456  1.00 20.00           C  ",
      "ATOM      2  CA  GLY A   2      12.104  14.207  10.456  1.00 30.00           C  ",
      "ATOM      3  N   GLY A   2      12.000  14.000  10.000  1.00 30.00           N  ",
    ].join("\n");
    const atoms = parsePDB(pdb);

    expect(atoms).toHaveLength(2);
    expect(atoms[0].slice(0, 3)).toEqual([11.104, 13.207, 9.456]);
    expect(atoms[0][3]).toBe(1);
    expect(atoms[1][5]).toBe(30);
  });

  test("generates deterministic unfolded coordinates", () => {
    const atoms = [[0, 0, 0, 1, 1, 0], [3, 0, 0, 2, 2, 0]];

    expect(generateUnfolded(atoms, 42)).toEqual(generateUnfolded(atoms, 42));
    expect(generateUnfolded(atoms, 42)).not.toEqual(generateUnfolded(atoms, 43));
  });
});