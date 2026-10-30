import { describe, expect, it } from "vitest";
import { defaultRegistry } from "../src/registry.ts";
import type { Contents } from "../src/registry.ts";
import { World } from "../src/world.ts";
import { Scheduler } from "../src/scheduler.ts";
import { defaultReactions, heatPerKg, reactionProcess } from "../src/reactions.ts";
import type { Reaction } from "../src/reactions.ts";
import { formulaAtoms } from "../src/elements.ts";
import { R_GAS, C_TO_K } from "../src/physics.ts";
import reactionData from "../data/reactions.json";
import { combustionProcess } from "../src/process.ts";

const reaction = (id: string): Reaction => structuredClone(defaultReactions.find(x => x.id === id)!);
function setup(temperatureC: number, contents: Contents[], vent = true) {
  const reg = defaultRegistry();
  for (const id of ["vessel", "room"]) reg.addComponent({ id, kind: id, material: "iron", mass: 10,
    temperatureC: id === "vessel" ? temperatureC : 25, contents: id === "vessel" ? contents : [],
    ports: [], props: {}, condition: { capability: 1, control: 1, accuracy: 1 } });
  const w = new World(reg);
  if (vent) w.graph.connect({ id: "vent", kind: "gas", from: "vessel", to: "room", fromPort: "out", toPort: "in", props: {} });
  w.conserveElements();
  return w;
}
function run(w: World, records: Reaction[], seconds = 3, dt = 1) {
  const scheduler = new Scheduler();
  scheduler.add(reactionProcess("vessel", records));
  scheduler.run(w, seconds, dt);
  expect(w.trace.checks.length).toBeGreaterThan(0);
  expect(w.trace.failed()).toEqual([]);
}
const kg = (id: string, mol = 1) => defaultRegistry().substance(id).molarMass * mol;
const sensible = (w: World) => [...w.registry.components.values()].reduce((e, c) => e + w.registry.heatCapacity(c) * (c.temperatureC - 25), 0);

describe("reaction records and solver", () => {
  it("calcines limestone in hot iron, vents CO2 and absorbs 178 kJ/mol", () => {
    const w = setup(1100, [{ substance: "limestone", phase: "solid", mass: kg("limestone") }]);
    const before = sensible(w);
    run(w, [reaction("calcination")]);
    const r = w.registry, vessel = r.component("vessel");
    expect(r.contentMass(vessel, "limestone")).toBe(0);
    expect(r.contentMass(vessel, "quicklime")).toBeCloseTo(kg("quicklime"), 12);
    expect(r.contentMass(r.component("room"), "co2")).toBeCloseTo(kg("co2"), 12);
    expect(r.component("room").temperatureC).toBeGreaterThan(25);
    expect(before - sensible(w)).toBeCloseTo(178000, 6);
    expect(w.trace.transfers.find(x => x.to === "chemical:calcination" && x.quantity === "energy")!.amount).toBeCloseTo(178000, 8);
  });
  it("slaking warms by 65 kJ per mole and leaves excess water", () => {
    const w = setup(25, [{ substance: "quicklime", phase: "solid", mass: kg("quicklime", 2) },
      { substance: "water", phase: "liquid", mass: kg("water", 3) }]);
    run(w, [reaction("slaking")]);
    const v = w.registry.component("vessel");
    expect(w.registry.contentMass(v, "slaked_lime")).toBeCloseTo(kg("slaked_lime", 2), 12);
    expect(w.registry.contentMass(v, "water")).toBeCloseTo(kg("water"), 12);
    expect(v.temperatureC - 25).toBeCloseTo(130000 / w.registry.heatCapacity(v), 10);
    expect(w.trace.into("vessel", "energy")).toBeCloseTo(130000, 8);
  });
  it("stops calcination at its heat budget and resumes after reheating", () => {
    const w = setup(826, [{ substance: "limestone", phase: "solid", mass: kg("limestone") }]);
    run(w, [reaction("calcination")]);
    const v = w.registry.component("vessel");
    expect(v.temperatureC).toBeCloseTo(825, 8);
    expect(w.registry.contentMass(v, "limestone")).toBeGreaterThan(0);
    v.temperatureC = 1100;
    run(w, [reaction("calcination")]);
    expect(w.registry.contentMass(v, "limestone")).toBe(0);
  });
  it("honours minimum temperature, liquid phase and zero elapsed time", () => {
    const w = setup(824, [{ substance: "limestone", phase: "solid", mass: kg("limestone") }]);
    run(w, [reaction("calcination")]);
    expect(w.trace.transfers).toHaveLength(0);
    w.registry.component("vessel").temperatureC = 1100;
    reactionProcess("vessel").step(w, 0);
    expect(w.trace.transfers).toHaveLength(0);
    const dry = setup(25, [{ substance: "quicklime", phase: "solid", mass: kg("quicklime") }, { substance: "water", phase: "gas", mass: kg("water") }]);
    run(dry, [reaction("slaking")]);
    expect(dry.trace.transfers).toHaveLength(0);
  });
  it("requires catalysts without consuming them", () => {
    const r = reaction("slaking");
    r.conditions.catalyst = "charcoal"; // synthetic gate fixture, not a claim about lime chemistry
    const w = setup(25, [{ substance: "quicklime", phase: "solid", mass: kg("quicklime") }, { substance: "water", phase: "liquid", mass: kg("water") }]);
    run(w, [r]);
    expect(w.trace.transfers).toHaveLength(0);
    w.registry.addContent(w.registry.component("vessel"), "charcoal", "solid", .01);
    w.trace.record({ t: w.t, process: "fixture", quantity: "mass:charcoal", from: "outside", to: "vessel", amount: .01 });
    run(w, [r]);
    expect(w.registry.contentMass(w.registry.component("vessel"), "charcoal")).toBe(.01);
  });
  it("uses Arrhenius temperature dependence and elapsed seconds", () => {
    for (const temp of [850, 1100]) for (const dt of [.5, 2]) {
      const r = reaction("calcination");
      // Synthetic numerical fixture; these are not asserted to be measured calcination kinetics.
      r.rate = { kind: "arrhenius", k0PerS: 1, activationEnergyJPerMol: 50000,
        source: "https://goldbook.iupac.org/terms/view/A00446", note: "[model] synthetic test parameters" };
      const w = setup(temp, [{ substance: "limestone", phase: "solid", mass: kg("limestone") }], false);
      const expected = Math.exp(-Math.exp(-50000 / (R_GAS * (temp + C_TO_K))) * dt);
      run(w, [r], dt, dt);
      expect(w.registry.contentMass(w.registry.component("vessel"), "limestone") / kg("limestone")).toBeCloseTo(expected, 12);
      expect(w.registry.contentMass(w.registry.component("vessel"), "co2")).toBeGreaterThan(0);
    }
  });
  it("carbon and water formation obey stoichiometry, limiting oxygen and their cited heat", () => {
    for (const [id, fuel, phase] of [["comb_c_full", "charcoal", "solid"], ["water_formation", "h2", "gas"]] as const) {
      const r = reaction(id), o2 = r.reactants[1].coefficient;
      const w = setup(600, [{ substance: fuel, phase, mass: kg(fuel, 2) }, { substance: "o2", phase: "gas", mass: kg("o2", o2) }]);
      const beforeMoles = Object.fromEntries(["C", "H", "O"].map(el => [el, w.elementMolesOf(el, ["vessel", "room"])]));
      const totalMass = () => [...w.registry.components.values()].flatMap(x => x.contents).reduce((s, x) => s + x.mass, 0);
      const beforeMass = totalMass();
      const before = sensible(w);
      run(w, [r]);
      expect(w.registry.contentMass(w.registry.component("vessel"), fuel)).toBeCloseTo(kg(fuel), 12);
      expect(sensible(w) - before).toBeCloseTo(-r.heat, 6);
      for (const el of ["C", "H", "O"]) expect(w.elementMolesOf(el, ["vessel", "room"])).toBeCloseTo(beforeMoles[el], 12);
      expect(totalMass()).toBeCloseTo(beforeMass, 12);
    }
  });
  it("conserves total mass through every default reaction, one weight set for all rows", () => {
    for (const r of defaultReactions) {
      const reg = defaultRegistry();
      const mass = (terms: Reaction["reactants"]) => terms.reduce((s, x) => s + x.coefficient * reg.substance(x.substance).molarMass, 0);
      expect(mass(r.products), r.id).toBeCloseTo(mass(r.reactants), 12);
    }
  });
  it("charcoal burns only at 15% oxygen by volume or more, the per-kg heat follows from the row", () => {
    const r = reaction("comb_c_full");
    expect(r.conditions.minO2).toBe(0.15);
    expect(r.minO2Source).toBeNull();
    expect(r.conditions.note).toContain("**(Rex, 2026-10-29)**");
    const air = (n2Mol: number) => setup(600, [{ substance: "charcoal", phase: "solid", mass: kg("charcoal", 2) },
      { substance: "o2", phase: "gas", mass: kg("o2") }, { substance: "n2", phase: "gas", mass: kg("n2", n2Mol) }]);
    const thin = air(9); // 10% oxygen
    run(thin, [r]);
    expect(thin.trace.transfers).toHaveLength(0);
    const rich = air(3); // 25% oxygen
    run(rich, [r]);
    expect(rich.registry.contentMass(rich.registry.component("vessel"), "charcoal")).toBeCloseTo(kg("charcoal"), 12);
    const edge = air(5.6), reg = edge.registry; // 1 / 6.6 = 15.15%
    run(edge, [r], 1);
    expect(reg.contentMass(reg.component("vessel"), "charcoal")).toBeLessThan(kg("charcoal", 2));
    expect(heatPerKg(reg, r)).toBeCloseTo(-393510 / reg.substance("charcoal").molarMass, 6);
    expect(-heatPerKg(reg, r) / 1e6).toBeCloseTo(32.8, 1);
  });
  it("rejects an oxygen condition with neither a source nor a [model] mark, or out of range", () => {
    const w = setup(600, [{ substance: "charcoal", phase: "solid", mass: kg("charcoal") }, { substance: "o2", phase: "gas", mass: kg("o2") }]);
    const unmarked = reaction("comb_c_full"); unmarked.conditions.note = "ignition";
    expect(() => reactionProcess("vessel", [unmarked]).step(w, 1)).toThrow("oxygen condition");
    for (const bad of [0, 1.5, -0.1]) {
      const r = reaction("comb_c_full"); r.conditions.minO2 = bad;
      expect(() => reactionProcess("vessel", [r]).step(w, 1)).toThrow("oxygen condition");
    }
    const cited = reaction("comb_c_full"); cited.minO2Source = "https://example.org/oxygen";
    expect(() => reactionProcess("vessel", [cited]).step(w, 1)).not.toThrow();
  });
  it("rejects unbalanced records before changing inventories", () => {
    const w = setup(1100, [{ substance: "limestone", phase: "solid", mass: kg("limestone") }]);
    const r = reaction("calcination"); r.products[1].coefficient = 2;
    expect(() => reactionProcess("vessel", [r]).step(w, 1)).toThrow("unbalanced");
    expect(w.trace.transfers).toHaveLength(0);
  });
  it("every seed has a source, a marked fallback and heat derived from formation data", () => {
    for (const r of defaultReactions) {
      expect(r.source).toMatch(/^https:\/\//);
      expect(r.rate.note).toContain("[model]");
    }
    for (const r of reactionData.reactions) {
      const formation: Record<string, number | undefined> = r.formationEnthalpiesJPerMol;
      const sum = (terms: typeof r.reactants) => terms.reduce((n, x) => n + x.coefficient * formation[`${x.substance}:${x.phase}`]!, 0);
      const derived = sum(r.products) - sum(r.reactants);
      expect(r.heat).toBe(["calcination", "slaking"].includes(r.id) ? Math.round(derived / 1000) * 1000 : derived);
    }
  });
});

describe("element ledger", () => {
  it("also checks the existing heater's combustion without treating burned as an external source", () => {
    const w = setup(25, [{ substance: "charcoal", phase: "solid", mass: kg("charcoal") }]);
    const reg = w.registry;
    reg.addContent(reg.component("room"), "o2", "gas", .032);
    w.trace.record({ t: 0, process: "fixture", quantity: "mass:o2", from: "outside", to: "room", amount: .032 });
    reg.component("vessel").props.feedKgPerS = .001;
    const scheduler = new Scheduler(); scheduler.add(combustionProcess("vessel", "room"));
    scheduler.run(w, 3, 1);
    expect(w.trace.failed()).toEqual([]);
  });
  it("parses grouped and repeated atoms and rejects malformed formulas", () => {
    expect(formulaAtoms("Ca(OH)2")).toEqual({ Ca: 1, O: 2, H: 2 });
    expect(formulaAtoms("C2H5OH")).toEqual({ C: 2, H: 6, O: 1 });
    expect(formulaAtoms("Ca((OH)2)2")).toEqual({ Ca: 1, O: 4, H: 4 });
    for (const formula of ["", "Ca(OH", "H2O!", "H0", "()", "H2O)"]) expect(() => formulaAtoms(formula)).toThrow();
  });
  it("accounts for vented element mass across a boundary", () => {
    const w = setup(1100, [{ substance: "limestone", phase: "solid", mass: kg("limestone") }]);
    w.conserveElements(["vessel"]);
    run(w, [reaction("calcination")]);
  });
  it("conserves total mass and atom moles through water formation with real molar masses", () => {
    const w = setup(600, [{ substance: "h2", phase: "gas", mass: kg("h2", 2) }, { substance: "o2", phase: "gas", mass: kg("o2") }]);
    const atoms = () => ["H", "O"].map(el => w.elementMolesOf(el, ["vessel", "room"]));
    const totalMass = () => [...w.registry.components.values()].flatMap(x => x.contents).reduce((s, x) => s + x.mass, 0);
    const beforeMass = totalMass();
    expect(atoms()[0]).toBeCloseTo(4, 12);
    run(w, [reaction("water_formation")]);
    expect(totalMass()).toBeCloseTo(beforeMass, 12);
    expect(atoms()[0]).toBeCloseTo(4, 12);
    expect(atoms()[1]).toBeCloseTo(2, 12);
    expect(w.registry.contentMass(w.registry.component("vessel"), "water") + w.registry.contentMass(w.registry.component("room"), "water"))
      .toBeCloseTo(2 * 0.018015, 12);
  });
  it("detects untraced element creation instead of accepting reaction pseudo-transfers", () => {
    const w = setup(25, []);
    w.registry.addContent(w.registry.component("vessel"), "water", "liquid", .018);
    w.trace.record({ t: 0, process: "broken", quantity: "mass:water", from: "chemical:broken", to: "vessel", amount: .018, chemicalChange: true });
    w.afterStep();
    expect(w.trace.failed().map(x => x.quantity).sort()).toEqual(["element:H", "element:O"]);
  });
});
