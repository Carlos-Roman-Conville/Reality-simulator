// TESTS.md E10, E11, E13: shipments, sales and money, accounting. Every number is a fixture.
import { describe, expect, it } from 'vitest'
import { Runner, accounts, defaultConfig, inTransit, marketStock, stock, stubProviders, totalUnits, type Good } from '../src/index.ts'

const good = (id: string, over: Partial<Good> = {}): Good => ({ id, type: null, weight: null, spoilagePerDay: null, legal: null, ...over })

/** Two abstract ports three days apart, a trading company with a store in each, rum priced in both. */
function lane() {
  const providers = stubProviders()
  providers.transport.set('port.a', 'port.b', 3)
  const runner = new Runner(undefined, defaultConfig(), providers)
  runner.run({ type: 'defineGood', good: good('rum') })
  runner.run({ type: 'defineGood', good: good('fish', { spoilagePerDay: 0.5 }) })
  runner.run({ type: 'openMarket', id: 'port.a', mode: 'abstract' })
  runner.run({ type: 'openMarket', id: 'port.b', mode: 'abstract' })
  runner.run({ type: 'setMarketGood', market: 'port.a', good: 'rum', basePrice: 2 })
  runner.run({ type: 'setMarketGood', market: 'port.b', good: 'rum', basePrice: 5 })
  const company = runner.run({ type: 'openOrganisation', name: 'The Company', kind: 'company' }).minted!
  const storeA = runner.run({ type: 'openInventory', holder: company, market: 'port.a' }).minted!
  const storeB = runner.run({ type: 'openInventory', holder: company, market: 'port.b' }).minted!
  runner.run({ type: 'addStock', inventory: runner.state.markets['port.a'].inventory, good: 'rum', units: 100 })
  providers.ledger.balances[company] = 1000
  return { runner, providers, company, storeA, storeB }
}

const money = (balances: Record<string, number>) => Object.values(balances).reduce((a, b) => a + b, 0)

describe('E10 goods in transit are in no market', () => {
  it('a shipment leaves its inventory at once, is in no inventory on the way, and lands after the map\'s days', () => {
    const { runner, company, storeA, storeB } = lane()
    runner.run({ type: 'buy', inventory: storeA, good: 'rum', units: 40 })
    const id = runner.run({ type: 'ship', from: storeA, to: storeB, good: 'rum', units: 30, freight: { payer: company, payee: 'master', amount: 15 } }).minted!
    expect(stock(runner.state, storeA, 'rum')).toBe(10)
    expect(stock(runner.state, storeB, 'rum')).toBe(0)
    expect(inTransit(runner.state, 'rum')).toBe(30)
    expect(totalUnits(runner.state, 'rum')).toBe(100)
    expect(runner.state.shipments[id]).toMatchObject({ departed: 0, arrives: 3, status: 'transit' })
    runner.run({ type: 'tick' }); runner.run({ type: 'tick' })
    expect(stock(runner.state, storeB, 'rum')).toBe(0)
    runner.run({ type: 'tick' })                         // day 2 → 3: not yet (arrives when state.day >= 3)
    expect(runner.state.day).toBe(3)
    expect(stock(runner.state, storeB, 'rum')).toBe(0)
    runner.run({ type: 'tick' })
    expect(stock(runner.state, storeB, 'rum')).toBe(30)
    expect(inTransit(runner.state, 'rum')).toBe(0)
    expect(totalUnits(runner.state, 'rum')).toBe(100)
    expect(runner.events.filter((e) => e.type === 'arrived').length).toBe(1)
  })
  it('a pair with no route is refused; a perishable good spoils on the way', () => {
    const { runner, storeA, storeB } = lane()
    runner.run({ type: 'openMarket', id: 'port.c', mode: 'abstract' })
    const far = runner.run({ type: 'openInventory', holder: 'nobody', market: 'port.c' }).minted!
    runner.run({ type: 'addStock', inventory: storeA, good: 'fish', units: 16 })
    expect(() => runner.run({ type: 'ship', from: storeA, to: far, good: 'fish', units: 1 })).toThrow(/no route/)
    runner.run({ type: 'ship', from: storeA, to: storeB, good: 'fish', units: 16 })
    for (let i = 0; i < 4; i++) runner.run({ type: 'tick' })
    expect(stock(runner.state, storeB, 'fish')).toBeCloseTo(16 * 0.5 ** 3 * 0.5)   // three days at sea, one ashore
  })
})

describe('E11 money is conserved across a sale', () => {
  it('buying and selling move goods one way and money the other at the market price; totals never change', () => {
    const { runner, providers, company, storeA } = lane()
    const before = money(providers.ledger.balances)
    runner.run({ type: 'buy', inventory: storeA, good: 'rum', units: 40 })
    expect(providers.ledger.balance(company)).toBe(920)
    expect(providers.ledger.balance('port.a')).toBe(80)
    expect(marketStock(runner.state, 'port.a', 'rum')).toBe(60)
    runner.run({ type: 'sell', inventory: storeA, good: 'rum', units: 10, price: 3 })
    expect(providers.ledger.balance(company)).toBe(950)
    expect(money(providers.ledger.balances)).toBe(before)
    expect(totalUnits(runner.state, 'rum')).toBe(100)
    expect(providers.ledger.log.map((r) => r.kind)).toEqual(['purchase', 'sale'])
  })
  it('a trade with no price anywhere is refused (open), as is one beyond the stock', () => {
    const { runner, storeA } = lane()
    runner.run({ type: 'addStock', inventory: storeA, good: 'fish', units: 5 })
    expect(() => runner.run({ type: 'sell', inventory: storeA, good: 'fish', units: 1 })).toThrow(/no price/)
    expect(() => runner.run({ type: 'buy', inventory: storeA, good: 'rum', units: 101 })).toThrow(/the market has 100/)
    const snapshot = JSON.stringify(runner.state)
    expect(() => runner.run({ type: 'sell', inventory: storeA, good: 'rum', units: 1 })).toThrow(/have 0/)
    expect(JSON.stringify(runner.state)).toBe(snapshot)
  })
})

describe('E13 accounting: revenue minus costs is profit and reconciles with the ledger', () => {
  it('the view sums the holder\'s rows by kind, values its inventories at today\'s prices, and matches the balance change', () => {
    const { runner, providers, company, storeA, storeB } = lane()
    const ledger = providers.ledger
    const start = ledger.balance(company)
    runner.run({ type: 'buy', inventory: storeA, good: 'rum', units: 40 })                                  // 80 out
    runner.run({ type: 'ship', from: storeA, to: storeB, good: 'rum', units: 30, freight: { payer: company, payee: 'master', amount: 15 } })
    for (let i = 0; i < 4; i++) { ledger.day = runner.state.day; runner.run({ type: 'tick' }) }
    ledger.day = runner.state.day
    runner.run({ type: 'sell', inventory: storeB, good: 'rum', units: 30 })                                 // 150 in at port.b's 5
    ledger.transfer(company, 'clerk', 7, 'wage', 'post.1')
    ledger.transfer('patron', company, 20, 'gift', null)
    const view = accounts(runner.state, runner.config, ledger, company, 0, runner.state.day)
    expect(view).toMatchObject({ revenue: 150, purchases: 80, wages: 7, rent: 0, freight: 15, otherIn: 20, otherOut: 0 })
    expect(view.profit).toBe(150 + 20 - 80 - 7 - 15)
    expect(ledger.balance(company) - start).toBe(view.profit)
    expect(view.inventoryValue).toBe(10 * 2)                                                                 // 10 rum left in port.a at 2
    expect(view.unpriced).toEqual([])
    const lateOnly = accounts(runner.state, runner.config, ledger, company, 4, 4)
    expect(lateOnly.revenue).toBe(150)
    expect(lateOnly.purchases).toBe(0)
  })
})
