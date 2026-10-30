// Events the reducer returns. The host folds them; the engine never pushes.

export type EconomyEvent =
  | { type: 'goodDefined'; good: string }
  | { type: 'recipeDefined'; recipe: string }
  | { type: 'inventoryOpened'; inventory: string; holder: string; market: string }
  | { type: 'marketOpened'; market: string; mode: string; inventory: string }
  | { type: 'marketGoodSet'; market: string; good: string }
  | { type: 'stockChanged'; inventory: string; good: string; delta: number; reason: string }
  | { type: 'produced'; inventory: string; recipe: string; units: number; output: string | null; outputUnits: number }
  | { type: 'spoiled'; inventory: string; good: string; units: number }
  | { type: 'consumed'; market: string; good: string; units: number; unmet: number }
  | { type: 'shortage'; market: string; good: string; stock: number; targetReserve: number; shortage: number }
  | { type: 'priceSet'; market: string; good: string; price: number; was: number | null }
  | { type: 'dayEnded'; day: number }
