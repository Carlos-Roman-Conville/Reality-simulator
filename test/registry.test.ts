import { describe, expect, it } from "vitest";
import { defaultRegistry } from "../src/registry.ts";

// Standard atomic weights, g/mol: IUPAC CIAAW https://ciaaw.org/atomic-weights.htm
const ATOMIC_WEIGHT: Record<string, number> = { H: 1.008, C: 12.011, N: 14.007, O: 15.999, S: 32.06, K: 39.098, Hg: 200.59, Pb: 207.2 };

/** Sum of atoms of a flat formula such as "C2H5OH" or "S8", kg/mol. */
function formulaMass(formula: string): number {
  let g = 0;
  for (const [, el, n] of formula.matchAll(/([A-Z][a-z]?)(\d*)/g)) {
    const w = ATOMIC_WEIGHT[el];
    if (w === undefined) throw new Error(`no atomic weight for ${el} in ${formula}`);
    g += w * (n ? Number(n) : 1);
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

  it("every substance and material row cites a source URL", () => {
    for (const s of reg.substances.values()) expect(s.source, s.id).toMatch(/^https:\/\//);
    for (const m of reg.materials.values()) expect(m.source, m.id).toMatch(/^https:\/\//);
  });
});
