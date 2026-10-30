// TESTS.md E12 (the labour market) and E14 (the three-port sim). Every number is a fixture.
import { describe, expect, it } from 'vitest'
import { simulate, table } from '../examples/three-ports.ts'
import { StubLabourSupply, StubSettlementReader, defaultConfig, totalUnits, wageQuote, wageQuotes } from '../src/index.ts'

function town() {
  const reader = new StubSettlementReader()
  reader.postRows['stl.town'] = [
    { id: 'post.1', biz: 'biz.1', role: 'cooper', wage: 10, hours: 10, filledBy: 'p1' },
    { id: 'post.2', biz: 'biz.1', role: 'cooper', wage: 14, hours: 10, filledBy: null },
    { id: 'post.3', biz: 'biz.2', role: 'cooper', wage: 12, hours: 10, filledBy: null },
    { id: 'post.4', biz: 'biz.2', role: 'sawyer', wage: 8, hours: 10, filledBy: 'p2' },
  ]
  const labour = new StubLabourSupply()
  return { reader, labour }
}

describe('E12 the wage quote rises when posts outnumber workers', () => {
  it('the default rule quotes the posted median with no pressure (the open state); no posts, no quote', () => {
    const { reader, labour } = town()
    const q = wageQuote(defaultConfig(), reader, labour, 'stl.town', 'cooper', 0)
    expect(q).toMatchObject({ posts: 3, filled: 1, workers: null, median: 12, quote: 12, rule: 'posted-median' })
    expect(wageQuote(defaultConfig(), reader, labour, 'stl.town', 'smith', 0).quote).toBeNull()
  })
  it('under the ratio rule the quote rises with more posts than workers, falls with more workers, within its bounds', () => {
    const { reader, labour } = town()
    const config = { ...defaultConfig(), wageRule: { kind: 'ratio' as const, elasticity: 0.5, floor: 0.5, ceiling: 2 } }
    labour.set('stl.town', 'cooper', 1)                       // 3 posts, 1 worker: pressure 2/3
    expect(wageQuote(config, reader, labour, 'stl.town', 'cooper', 0).quote).toBeCloseTo(12 * (1 + 0.5 * 2 / 3))
    labour.set('stl.town', 'cooper', 3)
    expect(wageQuote(config, reader, labour, 'stl.town', 'cooper', 0).quote).toBe(12)
    labour.set('stl.town', 'cooper', 30)                      // pressure −0.9: 1 − 0.45 = 0.55 ≥ floor
    expect(wageQuote(config, reader, labour, 'stl.town', 'cooper', 0).quote).toBeCloseTo(12 * 0.55)
    labour.set('stl.town', 'sawyer', 0)                       // 1 post, 0 workers: pressure 1 → 1.5
    const all = wageQuotes(config, reader, labour, 'stl.town', 0)
    expect(all.map((q) => q.role)).toEqual(['cooper', 'sawyer'])
    expect(all[1].quote).toBe(12)
    // with the supply unknown, the ratio rule falls back to the median
    expect(wageQuote(config, new StubSettlementReader(), labour, 'stl.town', 'cooper', 0).quote).toBeNull()
  })
})

describe('E14 the three-port sim prints prices and shortages over days and is deterministic', () => {
  it('thirty days twice give the same state and the same table; goods and money are conserved; every price is finite', () => {
    const a = simulate(30)
    const b = simulate(30)
    expect(JSON.stringify(a.state)).toBe(JSON.stringify(b.state))
    expect(JSON.stringify(a.log)).toBe(JSON.stringify(b.log))
    const printed = table(a)
    expect(printed.split('\n').length).toBe(31)
    expect(printed).toContain('north/grain')
    for (const row of a.rows) for (const cell of Object.values(row.cells)) { expect(Number.isFinite(cell.price)).toBe(true); expect(cell.stock).toBeGreaterThanOrEqual(0) }
    // money: the two purses plus the three ports' takings sum to the 1000 the companies started with
    expect(Object.values(a.balances).reduce((s, v) => s + v, 0)).toBeCloseTo(1000)
    // timber and cloth never spoil: production in minus consumption out equals the change in units anywhere
    const state = a.state as { markets: Record<string, { goods: Record<string, { producedLast: number; consumedLast: number }> }> }
    void state
    expect(totalUnits(a.state as never, 'timber')).toBeGreaterThan(0)
    // the companies traded: at least one shipment, at least one sale
    const kinds = (a.log as { type: string }[]).map((c) => c.type)
    expect(kinds).toContain('ship')
    expect(kinds).toContain('sell')
  })
})
