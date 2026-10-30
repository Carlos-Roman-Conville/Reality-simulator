import { describe, expect, it } from "vitest";
import { defaultRegistry } from "../src/registry.ts";
import { formulaMolarMass } from "../src/elements.ts";
import { M } from "../src/physics.ts";

describe("the data-driven registry", () => {
  const reg = defaultRegistry();

  it("every substance's molar mass is the CIAAW sum of its atoms, one weight set for all rows", () => {
    expect(reg.substances.size).toBeGreaterThanOrEqual(14);
    for (const s of reg.substances.values()) expect(s.molarMass, s.id).toBeCloseTo(formulaMolarMass(s.formula), 12);
    expect(reg.substance("water").molarMass).toBe(0.018015);
  });

  it("physics M is the registry's weight, exactly, for the substances the engine converts by M", () => {
    expect(M.H2O).toBe(0.018015);
    expect(M.H2O).toBe(reg.substance("water").molarMass);
    expect(M.O2).toBe(reg.substance("o2").molarMass);
    expect(M.N2).toBe(reg.substance("n2").molarMass);
    expect(M.CO2).toBe(reg.substance("co2").molarMass);
    expect(M.CO).toBe(reg.substance("co").molarMass);
  });

  it("every substance and material row cites a source URL", () => {
    for (const s of reg.substances.values()) expect(s.source, s.id).toMatch(/^https:\/\//);
    for (const m of reg.materials.values()) expect(m.source, m.id).toMatch(/^https:\/\//);
  });
});
