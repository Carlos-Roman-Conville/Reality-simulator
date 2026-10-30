// The labour market (CONTRACTS.md §5): a quote per role per market from the posts Settlement shows (through the
// reader) and the workers the host's pools could supply. A pure query: Economy never writes a post, and whether a
// quote ever reaches Post.wage is Rex's (Settlement Q10). The rule is a config key; the default quotes the going
// rate with no pressure, which is the open state.

import type { EconomyConfig } from './config.ts'
import type { LabourSupplyProvider, SettlementReader } from './providers.ts'

export type WageRule =
  | { kind: 'posted-median' }                              // the median wage of the role's posts today; no pressure (the open state)
  | { kind: 'ratio'; elasticity: number; floor: number; ceiling: number }
    // median × clamp(1 + elasticity × (posts − workers) / max(posts, workers, 1), floor, ceiling): illustrative, NOT Rex's

export interface WageQuote {
  market: string
  role: string
  day: number
  posts: number            // posts of the role in the market (filled or not)
  filled: number
  workers: number | null   // the host's supply, null when unknown
  median: number | null    // the posted median, null with no posts
  quote: number | null     // by the rule; null with no posts
  rule: WageRule['kind']
}

function median(values: number[]): number | null {
  if (!values.length) return null
  const sorted = [...values].sort((a, b) => a - b)
  const mid = Math.floor(sorted.length / 2)
  return sorted.length % 2 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2
}

export function wageQuote(config: EconomyConfig, reader: SettlementReader, labour: LabourSupplyProvider, market: string, role: string, day: number): WageQuote {
  const rolePosts = reader.posts(market).filter((post) => post.role === role)
  const workers = labour.supply(market, role, day)
  const med = median(rolePosts.map((post) => post.wage))
  const rule = config.wageRule
  let quote: number | null = med
  if (med !== null && rule.kind === 'ratio' && workers !== null) {
    const pressure = (rolePosts.length - workers) / Math.max(rolePosts.length, workers, 1)
    quote = med * Math.min(rule.ceiling, Math.max(rule.floor, 1 + rule.elasticity * pressure))
  }
  return { market, role, day, posts: rolePosts.length, filled: rolePosts.filter((post) => post.filledBy !== null).length, workers, median: med, quote, rule: rule.kind }
}

/** Quotes for every role that has a post in the market. */
export function wageQuotes(config: EconomyConfig, reader: SettlementReader, labour: LabourSupplyProvider, market: string, day: number): WageQuote[] {
  const roles = [...new Set(reader.posts(market).map((post) => post.role))].sort()
  return roles.map((role) => wageQuote(config, reader, labour, market, role, day))
}
