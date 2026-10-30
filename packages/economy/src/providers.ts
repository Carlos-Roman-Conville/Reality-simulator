// What this engine asks of the host (CONTRACTS.md §3, §4b, §4c, §5). The engine imports no other engine; the host
// implements these from @rex/settlement, @rex/realism, its map and its population model, or the stubs below.

export interface LedgerRow {
  id: string; day: number; kind: string; from: string | null; to: string | null
  subject: string | null; amount: number; authority: string | null; note: string
}

/** Money has one home (§3): Settlement's accounts in the pirate game. Economy keeps no balances. */
export interface LedgerProvider {
  balance(holder: string): number
  transfer(from: string, to: string, amount: number, kind: string, subject: string | null, note?: string): string
  rows(holder: string, fromDay: number, toDay: number): LedgerRow[]
}

/** Read-only view of a settlement (§4b); the host builds it from SettlementState each day. */
export interface SettlementReader {
  businesses(market: string): { id: string; inventory: string; account: string; status: string; open: boolean }[]
  posts(market: string): { id: string; biz: string; role: string; wage: number; hours: number; filledBy: string | null }[]
  production(biz: string, day: number): { recipe: string; q: number }[] | null
  hasFixture(market: string, fixture: string): boolean
}

export interface PopulationProvider {
  headcount(market: string, day: number): number
}

/** Workers the host's pools could supply for a role in a market today (§5): the population model's number, never
 *  this engine's. `null` when the host does not know. */
export interface LabourSupplyProvider {
  supply(market: string, role: string, day: number): number | null
}

export interface TransportProvider {
  /** Travel days from one market to another; Infinity when unreachable. */
  days(from: string, to: string): number
}

export interface Providers {
  ledger: LedgerProvider
  population: PopulationProvider
  labour: LabourSupplyProvider
  transport: TransportProvider
}

// In-memory stubs for tests and examples.

export class StubLedger implements LedgerProvider {
  balances: Record<string, number> = {}
  log: LedgerRow[] = []
  day = 0
  balance(holder: string): number { return this.balances[holder] ?? 0 }
  transfer(from: string, to: string, amount: number, kind: string, subject: string | null, note = ''): string {
    if (!Number.isFinite(amount) || amount < 0) throw new Error(`amount must be a number >= 0`)
    this.balances[from] = this.balance(from) - amount
    this.balances[to] = this.balance(to) + amount
    const id = `txn.${String(this.log.length + 1).padStart(4, '0')}`
    this.log.push({ id, day: this.day, kind, from, to, subject, amount, authority: null, note })
    return id
  }
  rows(holder: string, fromDay: number, toDay: number): LedgerRow[] {
    return this.log.filter((row) => (row.from === holder || row.to === holder) && row.day >= fromDay && row.day <= toDay)
  }
}

export class StubPopulation implements PopulationProvider {
  counts: Record<string, number> = {}
  headcount(market: string): number { return this.counts[market] ?? 0 }
}

export class StubLabourSupply implements LabourSupplyProvider {
  table: Record<string, number> = {}        // key `${market}:${role}`
  set(market: string, role: string, workers: number): void { this.table[`${market}:${role}`] = workers }
  supply(market: string, role: string): number | null { return this.table[`${market}:${role}`] ?? null }
}

export class StubTransport implements TransportProvider {
  table: Record<string, number> = {}        // key `${from}>${to}`
  set(from: string, to: string, days: number): void { this.table[`${from}>${to}`] = days; this.table[`${to}>${from}`] = days }
  days(from: string, to: string): number { return from === to ? 0 : (this.table[`${from}>${to}`] ?? Number.POSITIVE_INFINITY) }
}

/** A SettlementReader over plain lists, for tests of the labour market without a settlement engine on disk. */
export class StubSettlementReader implements SettlementReader {
  bizRows: Record<string, { id: string; inventory: string; account: string; status: string; open: boolean }[]> = {}
  postRows: Record<string, { id: string; biz: string; role: string; wage: number; hours: number; filledBy: string | null }[]> = {}
  productionRows: Record<string, { day: number; lines: { recipe: string; q: number }[] }> = {}
  fixtures: Record<string, string[]> = {}
  businesses(market: string) { return this.bizRows[market] ?? [] }
  posts(market: string) { return this.postRows[market] ?? [] }
  production(biz: string, day: number) { const r = this.productionRows[biz]; return r && r.day === day ? r.lines : null }
  hasFixture(market: string, fixture: string): boolean { return (this.fixtures[market] ?? []).includes(fixture) }
}

export function stubProviders(): Providers & { ledger: StubLedger; population: StubPopulation; labour: StubLabourSupply; transport: StubTransport } {
  return { ledger: new StubLedger(), population: new StubPopulation(), labour: new StubLabourSupply(), transport: new StubTransport() }
}
