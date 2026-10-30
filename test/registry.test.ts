import { describe, expect, it } from "vitest";
import { defaultRegistry } from "../src/registry.ts";
import { formulaAtoms } from "../src/elements.ts";

// Standard atomic weights, g/mol: IUPAC CIAAW https://ciaaw.org/atomic-weights.htm
const ATOMIC_WEIGHT: Record<string, number> = { H: 1.008, C: 12.011, N: 14.007, O: 15.999, S: 32.06, K: 39.098, Ca: 40.078, Hg: 200.59, Pb: 207.2 };

/** Sum of atoms, including parenthesized groups, kg/mol. */
function formulaMass(formula: string): number {
  let g = 0;
  for (const [el, n] of Object.entries(formulaAtoms(formula))) {
    const w = ATOMIC_WEIGHT[el];
    if (w === undefined) throw new Error(`no atomic weight for ${el} in ${formula}`);
    g += w * n;
  }
  return g / 1000;
}

describe("the data-driven registry", () => {
  const reg = defaultRegistry();

  it("every substance's molar mass is within 1% of the sum of its atoms", () => {
    expect(reg.substances.size).toBeGreaterThanOrEqual(14);
    for (const s of reg.substances.values()) {
      expect(Math.abs(s.molarMass - formulaMass(s.formula)) / formulaMass(s.formula), s.id).toBeLessThan(0.01);
    }
  });

  it("the water, hydrogen and lime rows carry real molecular weights, not rounded ones", () => {
    for (const id of ["water", "h2", "limestone", "quicklime", "slaked_lime"]) {
      const s = reg.substance(id);
      expect(Math.abs(s.molarMass - formulaMass(s.formula)) / formulaMass(s.formula), id).toBeLessThan(1e-4);
    }
    expect(reg.substance("water").molarMass).toBe(0.018015);
  });

  it("every substance and material row cites a source URL", () => {
    for (const s of reg.substances.values()) expect(s.source, s.id).toMatch(/^https:\/\//);
    for (const m of reg.materials.values()) expect(m.source, m.id).toMatch(/^https:\/\//);
  });
});
