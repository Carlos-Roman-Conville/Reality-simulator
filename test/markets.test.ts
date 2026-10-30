// TESTS.md E5-E9: consumption, spoilage, shortage, prices. Every number is a fixture.
import { describe, expect, it } from 'vitest'
import { Runner, defaultConfig, marketStock, shortage, stubProviders, type Good } from '../src/index.ts'

const good = (id: string, over: Partial<Good> = {}): Good => ({ id, type: null, weight: null, spoilagePerDay: null, legal: null, ...over })

/** An abstract port with no game data: biscuit (consumed, spoils), timber (produced), and a market for each. */
function port() {
  const providers = stubProviders()
  const runner = new Runner(undefined, defaultConfig(), providers)
  runner.run({ type: 'defineGood', good: good('biscuit', { spoilagePerDay: 0.1 }) })
  runner.run({ type: 'defineGood', good: good('timber') })
  runner.run({ type: 'openMarket', id: 'port.a', mode: 'abstract' })
  const inv = runner.state.markets['port.a'].inventory
  runner.run({ type: 'addStock', inventory: inv, good: 'biscuit', units: 100 })
  return { runner, providers, inv }
}

describe('E5 consumption draws the market\'s stock by the host\'s numbers', () => {
  it('consumptionPerDay is taken each day; demand beyond stock is recorded as unmet, stock stops at zero', () => {
    const { runner } = port()
    runner.run({ type: 'setMarketGood', market: 'port.a', good: 'biscuit', consumptionPerDay: 30 })
    runner.run({ type: 'tick' })
    // spoilage first (100 × 0.1 = 10 lost), then consumption 30: 60 left
    expect(marketStock(runner.state, 'port.a', 'biscuit')).toBeCloseTo(60)
    expect(runner.state.markets['port.a'].goods.biscuit.consumedLast).toBe(30)
    runner.run({ type: 'tick' }); runner.run({ type: 'tick' })
    // 60 → 54 → 24 → 21.6 → 0 with 8.4 unmet
    expect(marketStock(runner.state, 'port.a', 'biscuit')).toBe(0)
    expect(runner.state.markets['port.a'].goods.biscuit.unmetLast).toBeCloseTo(8.4)
    const consumed = runner.events.filter((e) => e.type === 'consumed')
    expect(consumed.length).toBe(3)
  })
  it('with no consumptionPerDay, demand is headcount × perCapitaPerDay from the population provider; neither set means no demand (open)', () => {
    const { runner, providers } = port()
    runner.run({ type: 'defineGood', good: good('water') })
    const inv = runner.state.markets['port.a'].inventory
    runner.run({ type: 'addStock', inventory: inv, good: 'timber', units: 10 })
    runner.run({ type: 'setMarketGood', market: 'port.a', good: 'timber', targetReserve: 5 })      // no demand numbers
    runner.run({ type: 'addStock', inventory: inv, good: 'water', units: 50 })
    runner.run({ type: 'setMarketGood', market: 'port.a', good: 'water', perCapitaPerDay: 2 })
    providers.population.counts['port.a'] = 12
    runner.run({ type: 'tick' })
    expect(marketStock(runner.state, 'port.a', 'timber')).toBe(10)
    expect(marketStock(runner.state, 'port.a', 'water')).toBe(26)
  })
  it('an abstract market adds its productionPerDay to its own stock; a settlement-run market does not', () => {
    const { runner } = port()
    runner.run({ type: 'setMarketGood', market: 'port.a', good: 'timber', productionPerDay: 4 })
    runner.run({ type: 'openMarket', id: 'stl.b', mode: 'settlement' })
    runner.run({ type: 'setMarketGood', market: 'stl.b', good: 'timber', productionPerDay: 4 })
    runner.run({ type: 'tick' })
    expect(marketStock(runner.state, 'port.a', 'timber')).toBe(4)
    expect(runner.state.markets['port.a'].goods.timber.producedLast).toBe(4)
    expect(marketStock(runner.state, 'stl.b', 'timber')).toBe(0)
  })
})

describe('E6 spoilage follows the good\'s rate in every inventory', () => {
  it('a tenth of the biscuit is lost a day wherever it lies; timber (null) never spoils', () => {
    const { runner, inv } = port()
    const store = runner.run({ type: 'openInventory', holder: 'victualler', market: 'port.a' }).minted!
    runner.run({ type: 'addStock', inventory: store, good: 'biscuit', units: 20 })
    runner.run({ type: 'addStock', inventory: store, good: 'timber', units: 20 })
    runner.run({ type: 'tick' })
    expect(marketStock(runner.state, 'port.a', 'biscuit')).toBeCloseTo(90)
    expect(runner.state.inventories[store].stock.biscuit).toBeCloseTo(18)
    expect(runner.state.inventories[store].stock.timber).toBe(20)
    expect(runner.events.filter((e) => e.type === 'spoiled').length).toBe(2)
    void inv
  })
})

describe('E7 a shortage event when stock falls under the target reserve', () => {
  it('no event while stock meets the reserve; one per day below it, with the shortage fraction', () => {
    const { runner } = port()
    runner.run({ type: 'setMarketGood', market: 'port.a', good: 'biscuit', consumptionPerDay: 40, targetReserve: 50 })
    runner.run({ type: 'tick' })                     // 100 → 90 → 50: not under
    expect(runner.events.filter((e) => e.type === 'shortage')).toEqual([])
    runner.run({ type: 'tick' })                     // 50 → 45 → 5: under
    const events = runner.events.filter((e) => e.type === 'shortage')
    expect(events.length).toBe(1)
    expect(events[0]).toMatchObject({ market: 'port.a', good: 'biscuit', targetReserve: 50 })
    expect((events[0] as { shortage: number }).shortage).toBeCloseTo(0.9)
    expect(shortage(runner.state, 'port.a', 'biscuit')).toBeCloseTo(0.9)
  })
})

describe('E8 price moves with shortage by the configured curve', () => {
  it('under shortage-linear the price rises as stock falls and returns to base when the reserve is met', () => {
    const { runner } = port()
    runner.config = { ...defaultConfig(), priceRule: { kind: 'shortage-linear', low: 0.7, high: 3 } }
    runner.run({ type: 'setMarketGood', market: 'port.a', good: 'biscuit', consumptionPerDay: 40, targetReserve: 50, basePrice: 10 })
    runner.run({ type: 'tick' })                     // stock 50 = reserve: shortage 0 → price 7
    expect(runner.state.markets['port.a'].goods.biscuit.price).toBeCloseTo(7)
    runner.run({ type: 'tick' })                     // stock 5: shortage 0.9 → 10 × (0.7 + 2.3 × 0.9) = 27.7
    expect(runner.state.markets['port.a'].goods.biscuit.price).toBeCloseTo(27.7)
    const inv = runner.state.markets['port.a'].inventory
    runner.run({ type: 'addStock', inventory: inv, good: 'biscuit', units: 200 })
    runner.run({ type: 'tick' })
    expect(runner.state.markets['port.a'].goods.biscuit.price).toBeCloseTo(7)
    expect(runner.events.filter((e) => e.type === 'priceSet').length).toBe(3)
  })
})

describe('E9 base price is data, never derived', () => {
  it('a good with no base price has no price under any rule; the default rule returns the base price unchanged', () => {
    const { runner } = port()
    runner.run({ type: 'setMarketGood', market: 'port.a', good: 'biscuit', consumptionPerDay: 90, targetReserve: 50 })
    runner.run({ type: 'tick' })
    expect(runner.state.markets['port.a'].goods.biscuit.price).toBeNull()
    runner.run({ type: 'setMarketGood', market: 'port.a', good: 'biscuit', basePrice: 3 })
    runner.run({ type: 'tick' })
    expect(runner.state.markets['port.a'].goods.biscuit.price).toBe(3)     // rule 'base', shortage ignored
    expect(() => runner.run({ type: 'setMarketGood', market: 'port.a', good: 'biscuit', basePrice: -1 })).toThrow(/basePrice/)
  })
})
