// Tunables. Every value here is marked proposed; a host overrides it from its own data. Nothing Rex has not decided
// is given a number: where he has not, the default is the rule that does nothing (`price: base`).

export type PriceRule =
  | { kind: 'base' }                                     // price = basePrice; the open state until Rex chooses a curve
  | { kind: 'shortage-linear'; low: number; high: number } // price = base × (low + (high − low) × shortage); ALIGNMENT §10's illustration is low 0.7, high 3.0, NOT adopted

export type InputsAnyChoice = 'first-available'          // which option of an inputsAny group is consumed (proposed)

export interface EconomyConfig {
  priceRule: PriceRule
  inputsAnyChoice: InputsAnyChoice
  tickOrder: readonly string[]
}

export const TICK_ORDER = ['production', 'spoilage', 'consumption', 'prices', 'advance'] as const   // step 5 adds shipments

export function defaultConfig(): EconomyConfig {
  return { priceRule: { kind: 'base' }, inputsAnyChoice: 'first-available', tickOrder: TICK_ORDER }
}
