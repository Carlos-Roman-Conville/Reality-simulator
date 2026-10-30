/**
 * Service 1: the registry. Stable ids for substances (properties only, never behaviour), materials (what a component is
 * made of), components (equipment, organs, structures: a thermal mass with contents and ports) and assemblies.
 */
import { BRICK_WALL, CP } from "./physics.ts";

export type Phase = "solid" | "liquid" | "gas";

export interface Substance {
  id: string;
  name: string;
  molarMass: number;          // kg/mol
  cp: Partial<Record<Phase, number>>; // J/(kg K) by phase
  hhv?: number;               // J/kg if a fuel
  provenance: "Historical" | "Anachronistic" | "Prehistoric" | "Mythological" | "Fantasy" | "Science Fiction" | "Original Fiction";
}

export interface Material {
  id: string;
  name: string;
  cp: number;                 // J/(kg K)
  maxTemperatureC: number;    // beyond it the component fails
  corrodedBy: string[];       // substance ids it must not hold
}

export type PortKind = "fluid" | "gas" | "heat" | "power" | "mechanical" | "material";

export interface Port {
  id: string;
  kind: PortKind;
  direction: "in" | "out" | "both";
}

/** Condition as three independent properties (SCIENTIFIC_EQUIPMENT.md section 4). 1 = new. */
export interface Condition { capability: number; control: number; accuracy: number }

export interface Contents { substance: string; phase: Phase; mass: number } // kg

export interface Component {
  id: string;
  kind: string;               // heater | vessel | pipe | condenser | tub | collector | room | body | thermometer ...
  material: string;           // Material id
  mass: number;               // kg of the component itself (its thermal mass)
  temperatureC: number;       // one lumped temperature (a simplification the trace names)
  contents: Contents[];
  ports: Port[];
  condition: Condition;
  props: Record<string, number>; // area_m2, U, volume_m3, ach, maxTemperatureC ... per kind
}

export class Registry {
  substances = new Map<string, Substance>();
  materials = new Map<string, Material>();
  components = new Map<string, Component>();

  addSubstance(s: Substance) { this.substances.set(s.id, s); return s; }
  addMaterial(m: Material) { this.materials.set(m.id, m); return m; }
  addComponent(c: Component) {
    if (!this.materials.has(c.material)) throw new Error(`component ${c.id}: unknown material ${c.material}`);
    for (const x of c.contents) if (!this.substances.has(x.substance)) throw new Error(`component ${c.id}: unknown substance ${x.substance}`);
    this.components.set(c.id, c); return c;
  }
  substance(id: string) { const s = this.substances.get(id); if (!s) throw new Error(`unknown substance ${id}`); return s; }
  material(id: string) { const m = this.materials.get(id); if (!m) throw new Error(`unknown material ${id}`); return m; }
  component(id: string) { const c = this.components.get(id); if (!c) throw new Error(`unknown component ${id}`); return c; }

  /** Thermal mass of a component with its contents, J/K. */
  heatCapacity(c: Component): number {
    let cap = c.mass * this.material(c.material).cp;
    for (const x of c.contents) cap += x.mass * (this.substance(x.substance).cp[x.phase] ?? 1000);
    return cap;
  }
  contentMass(c: Component, substance: string, phase?: Phase): number {
    return c.contents.filter(x => x.substance === substance && (!phase || x.phase === phase)).reduce((a, x) => a + x.mass, 0);
  }
  addContent(c: Component, substance: string, phase: Phase, kg: number) {
    const x = c.contents.find(y => y.substance === substance && y.phase === phase);
    if (x) x.mass += kg; else c.contents.push({ substance, phase, mass: kg });
    if (x && x.mass < 1e-12) x.mass = 0;
  }
}

/** The default substances and materials, real constants (physics.ts). A game's own data extends these. */
export function defaultRegistry(): Registry {
  const r = new Registry();
  r.addSubstance({ id: "water", name: "Water", molarMass: 0.018, cp: { liquid: CP.water, gas: CP.waterVapour, solid: 2090 }, provenance: "Historical" });
  r.addSubstance({ id: "o2", name: "Oxygen", molarMass: 0.032, cp: { gas: 918 }, provenance: "Historical" });
  r.addSubstance({ id: "n2", name: "Nitrogen", molarMass: 0.028, cp: { gas: 1040 }, provenance: "Historical" });
  r.addSubstance({ id: "co2", name: "Carbon dioxide", molarMass: 0.044, cp: { gas: 844 }, provenance: "Historical" });
  r.addSubstance({ id: "co", name: "Carbon monoxide", molarMass: 0.028, cp: { gas: 1040 }, provenance: "Historical" });
  r.addSubstance({ id: "charcoal", name: "Charcoal (as carbon)", molarMass: 0.012, cp: { solid: CP.charcoal }, hhv: 30.0e6, provenance: "Historical" });
  r.addSubstance({ id: "ethanol", name: "Ethanol", molarMass: 0.046, cp: { liquid: 2440, gas: 1420 }, hhv: 26.8e6, provenance: "Historical" });
  r.addMaterial({ id: "copper", name: "Copper", cp: CP.copper, maxTemperatureC: 1085, corrodedBy: [] });
  r.addMaterial({ id: "glass", name: "Glass", cp: CP.glass, maxTemperatureC: 500, corrodedBy: [] });
  r.addMaterial({ id: "iron", name: "Iron", cp: CP.iron, maxTemperatureC: 1200, corrodedBy: ["aqua_fortis"] });
  r.addMaterial({ id: "wood", name: "Wood", cp: 1700, maxTemperatureC: 250, corrodedBy: [] });
  r.addMaterial({ id: "wall_brick", name: "Wall brick (LBNL)", cp: BRICK_WALL.cp, maxTemperatureC: 1400, corrodedBy: [] });
  r.addMaterial({ id: "brick", name: "Brick", cp: 840, maxTemperatureC: 1400, corrodedBy: [] });
  r.addMaterial({ id: "flesh", name: "Flesh", cp: 3500, maxTemperatureC: 45, corrodedBy: [] });
  r.addMaterial({ id: "air_mass", name: "Air (a room's)", cp: CP.air, maxTemperatureC: 1e9, corrodedBy: [] });
  return r;
}
