// The working context of one reduce call: a deep copy of the state (a throw leaves the caller's state untouched),
// the config, the providers and the events collected so far. Helpers every command and tick step share.

import type { EconomyConfig } from './config.ts'
import type { EconomyEvent } from './events.ts'
import { mint, type Prefix } from './ids.ts'
import type { Providers } from './providers.ts'
import type { EconomyState, Good, Inventory, Market, MarketGood, Recipe } from './state.ts'

export interface Ctx {
  state: EconomyState
  config: EconomyConfig
  providers: Providers
  events: EconomyEvent[]
  minted: string | null       // the id a command minted, for the host
  taken: number | null        // what `take` took
}

export function newId(ctx: Ctx, prefix: Prefix): string {
  const minted = mint(ctx.state.counters, prefix)
  ctx.state.counters = minted.counters
  return minted.id
}

export function must<T>(table: Record<string, T>, id: string, what: string): T {
  if (!Object.hasOwn(table, id)) throw new Error(`unknown ${what}: ${id}`)
  return table[id]
}

export const good = (ctx: Ctx, id: string): Good => must(ctx.state.goods, id, 'good')
export const recipe = (ctx: Ctx, id: string): Recipe => must(ctx.state.recipes, id, 'recipe')
export const inventory = (ctx: Ctx, id: string): Inventory => must(ctx.state.inventories, id, 'inventory')
export const market = (ctx: Ctx, id: string): Market => must(ctx.state.markets, id, 'market')

export function nonempty(value: unknown, what: string): string {
  if (typeof value !== 'string' || !value.trim()) throw new Error(`${what} must be a non-empty string`)
  return value
}

export function finite(value: unknown, what: string, min = Number.NEGATIVE_INFINITY): number {
  if (typeof value !== 'number' || !Number.isFinite(value) || value < min) throw new Error(`${what} must be a number >= ${min}`)
  return value
}

export function integer(value: unknown, what: string, min: number): number {
  finite(value, what, min)
  if (!Number.isInteger(value)) throw new Error(`${what} must be an integer`)
  return value as number
}

export function stockOf(inv: Inventory, goodId: string): number {
  return inv.stock[goodId] ?? 0
}

/** Change an inventory's stock; stock never goes negative (E1). A zero result removes the key so JSON stays small. */
export function adjust(ctx: Ctx, inv: Inventory, goodId: string, delta: number, reason: string): void {
  const next = stockOf(inv, goodId) + delta
  if (next < -1e-9) throw new Error(`stock of ${goodId} in ${inv.id} would go negative (${stockOf(inv, goodId)} ${delta})`)
  if (next <= 1e-9) delete inv.stock[goodId]
  else inv.stock[goodId] = next
  ctx.events.push({ type: 'stockChanged', inventory: inv.id, good: goodId, delta, reason })
}

export function marketGood(mkt: Market, goodId: string): MarketGood {
  return (mkt.goods[goodId] ??= {
    consumptionPerDay: null, targetReserve: null, productionPerDay: null, basePrice: null, producedToday: 0, producedLast: 0,
  })
}
