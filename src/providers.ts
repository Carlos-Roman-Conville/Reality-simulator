// Provider interfaces (PACKAGES.md s4): what the engine asks of the host. The engine imports no other engine;
// the host implements these from @rex/economy, @rex/realism, its population model, or the stubs below.

import type { SettlementState } from './state.ts'

export interface LabourProvider {
  /** False while a person is aboard, dead or away: the host knows, the engine does not (Q2). */
  available(person: string, day: number): boolean
  /** Workers an unnamed pool supplies for a role today, at most `wanted`. */
  draw(pool: string, role: string, requires: unknown, wanted: number, day: number): number
  /** 0..n output factor of a holder in a role; the host maps skill bands to this. */
  productivity(holder: string, role: string): number
}

export interface MaterialProvider {
  /** Output units the inputs on hand in `inventory` allow for `recipe`. */
  available(inventory: string, recipe: string): number
  /** Consume the inputs and add the outputs for `units` of `recipe`. */
  produce(inventory: string, recipe: string, units: number): void
  /** Units of a material on hand in `inventory`. */
  have(inventory: string, material: string): number
  /** Take up to `units` of a material for a project; returns what was taken. */
  take(inventory: string, material: string, units: number): number
  /** A recipe's rates (CONTRACTS.md s13a): the recipe's home is the economy, so the engine reads them each tick. */
  rates(recipe: string): Rates
}

export interface Rates {
  unitsPerFixtureDay: number   // output units one fixture of each needed kind allows per day
  labourPerUnit: number        // worker-days per unit; 0 means the line needs no labour
}

export interface UtilityProvider {
  capacity(building: string, recipe: string, state: SettlementState): number
}

export interface PriceProvider {
  valueOf(subject: string, day: number): number
}

export interface Providers {
  labour: LabourProvider
  materials: MaterialProvider
  utilities: UtilityProvider
  prices: PriceProvider
}

// In-memory stubs for tests and examples.

export interface StubRecipe extends Rates { inputs: { good: string; units: number }[]; output: string; yield: number }

export class StubMaterials implements MaterialProvider {
  stock: Record<string, Record<string, number>> = {}
  recipes: Record<string, StubRecipe>
  constructor(recipes: Record<string, StubRecipe> = {}) { this.recipes = recipes }
  set(inventory: string, good: string, units: number): void {
    (this.stock[inventory] ??= {})[good] = units
  }
  get(inventory: string, good: string): number {
    return this.stock[inventory]?.[good] ?? 0
  }
  available(inventory: string, recipe: string): number {
    const def = this.recipes[recipe]
    if (!def) throw new Error(`stub recipe unknown: ${recipe}`)
    if (!def.inputs.length) return Number.POSITIVE_INFINITY
    return Math.floor(Math.min(...def.inputs.map((input) => this.get(inventory, input.good) / input.units)))
  }
  produce(inventory: string, recipe: string, units: number): void {
    const def = this.recipes[recipe]
    if (!def) throw new Error(`stub recipe unknown: ${recipe}`)
    for (const input of def.inputs) this.set(inventory, input.good, this.get(inventory, input.good) - input.units * units)
    this.set(inventory, def.output, this.get(inventory, def.output) + def.yield * units)
  }
  rates(recipe: string): Rates {
    const def = this.recipes[recipe]
    if (!def) throw new Error(`stub recipe unknown: ${recipe}`)
    return { unitsPerFixtureDay: def.unitsPerFixtureDay, labourPerUnit: def.labourPerUnit }
  }
  have(inventory: string, material: string): number { return this.get(inventory, material) }
  take(inventory: string, material: string, units: number): number {
    const have = this.get(inventory, material)
    const taken = Math.min(have, units)
    this.set(inventory, material, have - taken)
    return taken
  }
}

export class StubLabour implements LabourProvider {
  away = new Set<string>()
  pools: Record<string, number> = {}            // workers per pool per day
  factors: Record<string, number> = {}          // productivity per holder (default 1)
  available(person: string): boolean { return !this.away.has(person) }
  draw(pool: string, _role: string, _requires: unknown, wanted: number): number {
    return Math.min(wanted, this.pools[pool] ?? 0)
  }
  productivity(holder: string): number { return this.factors[holder] ?? 1 }
}

export class StubUtilities implements UtilityProvider {
  caps: Record<string, number> = {}
  fallback: number
  constructor(fallback = Number.POSITIVE_INFINITY) { this.fallback = fallback }
  capacity(building: string): number { return this.caps[building] ?? this.fallback }
}

export class StubPrices implements PriceProvider {
  values: Record<string, number> = {}
  valueOf(subject: string): number { return this.values[subject] ?? 0 }
}

export function stubProviders(recipes: Record<string, StubRecipe> = {}): Providers & {
  labour: StubLabour; materials: StubMaterials; utilities: StubUtilities; prices: StubPrices
} {
  return { labour: new StubLabour(), materials: new StubMaterials(recipes), utilities: new StubUtilities(), prices: new StubPrices() }
}
