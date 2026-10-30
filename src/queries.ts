// Pure reads over state. Prices follow config.priceRule (CONTRACTS.md §7: a config key until Rex chooses).

import type { EconomyConfig } from './config.ts'
import type { EconomyState } from './state.ts'

export function stock(state: EconomyState, inventory: string, good: string): number {
  const inv = state.inventories[inventory]
  if (!inv) throw new Error(`unknown inventory: ${inventory}`)
  return inv.stock[good] ?? 0
}

/** Stock of a good for sale in a market (its own inventory). */
export function marketStock(state: EconomyState, market: string, good: string): number {
  const mkt = state.markets[market]
  if (!mkt) throw new Error(`unknown market: ${market}`)
  return stock(state, mkt.inventory, good)
}

/** 0 when stock meets the target reserve, 1 when empty; null when the host has not set a reserve (open). */
export function shortage(state: EconomyState, market: string, good: string): number | null {
  const entry = state.markets[market]?.goods[good]
  if (!entry || entry.targetReserve === null) return null
  if (entry.targetReserve <= 0) return 0
  return Math.max(0, Math.min(1, 1 - marketStock(state, market, good) / entry.targetReserve))
}

/** The price of a good in a market by the configured rule; null when the host has set no base price (open). */
export function price(state: EconomyState, config: EconomyConfig, market: string, good: string): number | null {
  const entry = state.markets[market]?.goods[good]
  if (!entry || entry.basePrice === null) return null
  const rule = config.priceRule
  if (rule.kind === 'base') return entry.basePrice
  const s = shortage(state, market, good) ?? 0
  return entry.basePrice * (rule.low + (rule.high - rule.low) * s)
}

/** An inventory's value at its market's prices; goods with no price count 0 and are listed as unpriced. */
export function inventoryValue(state: EconomyState, config: EconomyConfig, inventory: string): { value: number; unpriced: string[] } {
  const inv = state.inventories[inventory]
  if (!inv) throw new Error(`unknown inventory: ${inventory}`)
  let value = 0
  const unpriced: string[] = []
  for (const [good, units] of Object.entries(inv.stock)) {
    const p = price(state, config, inv.market, good)
    if (p === null) unpriced.push(good)
    else value += p * units
  }
  return { value, unpriced }
}

/** Yesterday's observed production of a good into a market (through `produce`). */
export function producedLast(state: EconomyState, market: string, good: string): number {
  return state.markets[market]?.goods[good]?.producedLast ?? 0
}
