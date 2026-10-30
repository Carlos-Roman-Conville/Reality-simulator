import data from "../data/reactions.json" with { type: "json" };
import type { Phase, Registry } from "./registry.ts";
import type { Process } from "./scheduler.ts";
import { C_TO_K, R_GAS } from "./physics.ts";
import { formulaAtoms } from "./elements.ts";

export interface Reagent { substance: string; phase: Phase; coefficient: number }
export interface Reaction {
  id: string;
  name: string;
  reactants: Reagent[];
  products: Reagent[];
  conditions: { minimumTemperatureC: number; catalyst?: string; note: string };
  rate: { kind: "complete"; note: string } | { kind: "arrhenius"; k0PerS: number; activationEnergyJPerMol: number; source: string; note: string };
  heat: number; // J per mole of reaction as written; positive absorbs heat
  where: string;
  mark: string;
  source: string;
}

export const defaultReactions = data.reactions as Reaction[];

function validate(reg: Registry, reaction: Reaction) {
  if (!reaction.reactants.length || !reaction.products.length || !Number.isFinite(reaction.heat)
    || !Number.isFinite(reaction.conditions.minimumTemperatureC) || reaction.conditions.minimumTemperatureC <= -C_TO_K
    || !reaction.source) throw new Error(`invalid reaction ${reaction.id}`);
  const balance: Record<string, number> = {};
  for (const [side, sign] of [[reaction.reactants, -1], [reaction.products, 1]] as const) {
    const seen = new Set<string>();
    for (const term of side) {
      const key = `${term.substance}:${term.phase}`;
      if (seen.has(key) || !Number.isFinite(term.coefficient) || term.coefficient <= 0) throw new Error(`invalid reagent in ${reaction.id}`);
      seen.add(key);
      const s = reg.substance(term.substance);
      if (!(s.molarMass > 0) || !(s.cp[term.phase]! > 0)) throw new Error(`missing thermal data for ${key}`);
      for (const [el, n] of Object.entries(formulaAtoms(s.formula))) balance[el] = (balance[el] ?? 0) + sign * n * term.coefficient;
    }
  }
  if (Object.values(balance).some(n => Math.abs(n) > 1e-10)) throw new Error(`unbalanced reaction ${reaction.id}`);
  if (reaction.conditions.catalyst) reg.substance(reaction.conditions.catalyst);
  const rate = reaction.rate;
  if (rate.kind === "arrhenius" && (!(rate.k0PerS >= 0) || !Number.isFinite(rate.k0PerS)
    || !(rate.activationEnergyJPerMol >= 0) || !Number.isFinite(rate.activationEnergyJPerMol) || !rate.source)) throw new Error(`invalid kinetics ${reaction.id}`);
  if (rate.kind !== "arrhenius" && (rate.kind !== "complete" || !rate.note.includes("[model]"))) throw new Error(`missing rate model ${reaction.id}`);
}

/** Vessel reactions, in record order. Reactants/catalysts must be inside the vessel.
 * k = k0 exp(-Ea/RT): https://goldbook.iupac.org/terms/view/A00446
 * [model] First-order limiting-reagent extent, integrated at frozen step temperature:
 * extent = available * (1-exp(-k dt)); complete fallback is explicitly marked in each record.
 * Hess's law and constant-cp sensible enthalpy, relative to 298.15 K (25 C):
 * https://srd.nist.gov/JPCRD/jpcrdS2Vol11.pdf and each record's formation enthalpies.
 * Endothermic extent is also limited by sensible heat above the minimum temperature.
 * Named simplifications: constant heat capacities, irreversible reactions, threshold ignition,
 * perfect mixing, no pressure/equilibrium kinetics, instantaneous gas transport along the first
 * outgoing gas edge (no edge means retained gas). Gas carries sensible enthalpy to its receiver.
 */
export function reactionProcess(vessel: string, reactions: readonly Reaction[] = defaultReactions): Process {
  return { name: "reactions", every: 1, step(w, dt) {
    if (!Number.isFinite(dt) || dt < 0) throw new Error("invalid reaction timestep");
    if (dt === 0) return;
    const reg = w.registry, v = reg.component(vessel);
    // Validate all records before mutating anything, including unknown substances and unbalanced equations.
    for (const reaction of reactions) validate(reg, reaction);
    const edge = w.graph.from(vessel, "gas")[0];
    const receiver = edge ? reg.component(edge.to) : undefined;
    for (const reaction of reactions) {
      const min = reaction.conditions.minimumTemperatureC;
      if (v.temperatureC < min) continue;
      if (reaction.conditions.catalyst && reg.contentMass(v, reaction.conditions.catalyst) <= 0) continue;
      let extent = Math.min(...reaction.reactants.map(x => reg.contentMass(v, x.substance, x.phase) / (reg.substance(x.substance).molarMass * x.coefficient)));
      if (extent <= 0) continue;
      if (reaction.rate.kind === "arrhenius") {
        const k = reaction.rate.k0PerS * Math.exp(-reaction.rate.activationEnergyJPerMol / (R_GAS * (v.temperatureC + C_TO_K)));
        extent *= -Math.expm1(-k * dt);
      }
      const cap = reg.heatCapacity(v);
      if (!(cap > 0)) throw new Error(`no heat capacity in ${vessel}`);
      const molarCapacity = (terms: Reagent[]) => terms.reduce((sum, x) => {
        const s = reg.substance(x.substance);
        return sum + x.coefficient * s.molarMass * s.cp[x.phase]!;
      }, 0);
      const deltaCap = molarCapacity(reaction.products) - molarCapacity(reaction.reactants);
      const energyPerMolAtMin = reaction.heat + deltaCap * (min - 25);
      if (reaction.heat > 0 && energyPerMolAtMin > 0) extent = Math.min(extent, cap * Math.max(0, v.temperatureC - min) / energyPerMolAtMin);
      if (extent <= 0) continue;
      const sensible = cap * (v.temperatureC - 25) - extent * reaction.heat;
      const process = `reaction:${reaction.id}`, reservoir = `chemical:${reaction.id}`;
      for (const [terms, sign] of [[reaction.reactants, -1], [reaction.products, 1]] as const) for (const x of terms) {
        const kg = extent * x.coefficient * reg.substance(x.substance).molarMass;
        reg.addContent(v, x.substance, x.phase, sign * kg);
        w.trace.record({ t: w.t, process, quantity: `mass:${x.substance}`, from: sign < 0 ? vessel : reservoir,
          to: sign < 0 ? reservoir : vessel, amount: kg, chemicalChange: true });
      }
      v.temperatureC = 25 + sensible / reg.heatCapacity(v);
      const heat = -extent * reaction.heat;
      w.trace.record({ t: w.t, process, quantity: "energy", from: heat >= 0 ? reservoir : vessel,
        to: heat >= 0 ? vessel : reservoir, amount: Math.abs(heat), note: `reaction enthalpy; ${extent} mol; ${reaction.source}` });
      if (!receiver || receiver === v) continue;
      for (const x of reaction.products.filter(x => x.phase === "gas")) {
        const s = reg.substance(x.substance), kg = extent * x.coefficient * s.molarMass;
        const carried = kg * s.cp.gas! * (v.temperatureC - 25);
        const oldEnergy = reg.heatCapacity(receiver) * (receiver.temperatureC - 25);
        reg.addContent(v, x.substance, "gas", -kg);
        reg.addContent(receiver, x.substance, "gas", kg);
        receiver.temperatureC = 25 + (oldEnergy + carried) / reg.heatCapacity(receiver);
        w.trace.record({ t: w.t, process, quantity: `mass:${x.substance}`, from: vessel, to: receiver.id, amount: kg });
        w.trace.record({ t: w.t, process, quantity: "energy", from: vessel, to: receiver.id, amount: carried, note: "gas sensible enthalpy relative to 25 C" });
      }
    }
  } };
}
