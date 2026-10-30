# Settlement ↔ Economy contract (PROPOSAL, economy keeper, 2026-10-30)

**Status: proposed by the economy keeper; sent to the settlement keeper 2026-10-30; not agreed.** When both sides
agree, this file and `Toolchain/settlement/CONTRACTS.md` hold the same text, and ENGINES.md records the date.
Marks: **(Rex)** a decision of Rex's that this contract only restates; **(proposed)** either keeper's proposal,
open to the other; **(open)** a question neither keeper may answer: it goes to Rex. Nothing here is a game rule.

What this contract is for (ENGINES.md): wages, staffing, business inventory, production capacity. It also settles
transactions and accounting, because the two engines meet in the same ledger. The principle throughout is the one
realism and settlement already follow: **every number has one home**, each engine reaches another's numbers
through a provider interface the host implements, and **no engine imports another engine**.

## 1. One sentence per side

- **Settlement** owns *where* economic activity happens and *who* is in it: premises, fixtures, businesses as
  legal and physical things, posts, holders, assignments, projects, titles, leases, offices. Its tick decides each
  day **how much a business can make** (the capacity Q) and **what it pays its people** (wages, rents).
- **Economy** owns *what* is made, held, wanted and traded, and *what it is worth*: the goods catalogue, recipes
  (inputs, outputs, equipment, band, knowledge), every inventory's stock, each market's five numbers (stock,
  consumption per day, target reserve, production per day, base price: Rex, ALIGNMENT §10), prices, consumption,
  the labour market's wage quotes, trade and transport, organisations (companies), and the accounting view of a
  business (revenue, costs, profit, valuation).

## 2. Who owns which record

| Record | Owner | The other side sees it as | Notes |
|---|---|---|---|
| `Business`, `Post`, `Assignment`, `Project`, `Title`, `Lease`, `Office`, `Permission`, `Building.fixtures` | Settlement | read-only through `SettlementReader` (§4b) | unchanged from today's `state.ts` |
| `Business.inventory` (the opaque ref) | Settlement stores the string; **Economy mints and owns what it refers to** | Economy: an `Inventory` record keyed by that string | the host asks Economy for an inventory id (`openInventory`) before `openBusiness`, and passes it in |
| `Business.lines[]` (`recipe`, `equipment`, `unitsPerFixtureDay`, `labourPerUnit`) | Settlement stores; **the two rates come from Economy's recipe data** | Economy: `Recipe.rates` | **(proposed change to Settlement)** read the rates through the material provider (`rates(recipe)`) instead of storing copies, so a recipe's rate has one home. If Settlement prefers to keep the copies, the host copies them from Economy at `openBusiness` and this contract says so |
| `Recipe` (id, skill, band, min level, inputs, inputsAny, equipment, knowledge, region, by-products, and the per-unit quantities, labour and equipment rates) | Economy | Settlement: an opaque recipe id | recipe quantities, yields and labour per unit are **data the host supplies** (not in the pirate data yet: `data/pirate-ship/economy/README.md` "Not here yet") |
| `Good` (id, type base/specialty/cultural/money, weight, spoilage, legality) | Economy | never | types are **(open, Rex: GOODS.md Open 1–8)**; the engine takes them as data |
| `Inventory` (holder, market, stock per good) | Economy | Settlement: the ref only | one per business; per household, pool, ship or warehouse if the host wants; the holder string is the same opaque holder Settlement uses |
| `Market` (one per settlement or port: the five numbers per good, current price, shortage) | Economy | never | a Settlement-run town and an abstract port are both markets |
| `Shipment`, `Route`, `Order`, `Organisation` | Economy | never | travel days come from the host's map (a `TransportProvider`), never from Economy |
| `Account`, the `ledger` | **one home, chosen by the host** | both engines through their own interface | see §3 |
| `production[biz][day]` (Q per line, the binding cap) | Settlement | Economy reads it to record each market's observed production per day | Economy never recomputes Q for a Settlement-run business |
| `Post.wage` | Settlement (host data per post) | Economy quotes a market wage; it never writes a post | see §5 |

## 3. Money (proposed)

Money has one home. Today that home is Settlement's `accounts` and `ledger` (`pay`, `record`), and nothing in this
contract moves it. Economy declares a `LedgerProvider` and never keeps balances of its own:

```ts
interface LedgerProvider {
  balance(holder: string): number
  /** Move money and write one ledger row; returns the row id. Balances may go negative (debt) as in Settlement. */
  transfer(from: string, to: string, amount: number, kind: string, subject: string | null, note?: string): string
  /** Rows touching a holder in a day range, for accounting. */
  rows(holder: string, fromDay: number, toDay: number): LedgerRow[]
}
```

In the pirate game the host implements it over Settlement's accounts (through Settlement commands or a shared
account store: the adapter's choice). In Economy's own tests it is an in-memory stub. Economy's row kinds
(`sale`, `purchase`, `freight`, `duty`, `dividend`) are strings; **(proposed)** Settlement widens `TransactionKind`
to `string` or adds Economy's kinds, whichever it prefers. **(open, Rex: Settlement Q7)** whether `port.cash` is
the treasury.

## 4. The interfaces

### 4a. What Economy implements for Settlement (Settlement's `providers.ts`, unchanged in shape)

| Settlement asks | Economy answers | Promise |
|---|---|---|
| `MaterialProvider.available(inventory, recipe)` | output units the inputs on hand allow, by Economy's recipe quantities; `Infinity` for a recipe with no inputs | pure; the same answer twice in a day |
| `MaterialProvider.produce(inventory, recipe, units)` | consumes inputs (an `inputsAny` choice: the host's rule, default the first available: **(proposed)**), adds outputs and by-products, records the day's production on the inventory's market | throws if `units > available` (Settlement guarantees it never asks that) |
| `MaterialProvider.have / take` | stock reads and draws for projects | the same |
| `PriceProvider.valueOf(subject, day)` | **goods and inventories only**: a good's current market price, an inventory's value at market | **(open, Rex)** who values a title, building or parcel for a sale the host does not price: Economy can offer a materials-plus-labour replacement cost; a land market is not proposed |
| **(proposed, new)** `MaterialProvider.rates(recipe)` → `{ unitsPerFixtureDay, labourPerUnit }` | the recipe's rates | so Settlement's lines need not copy them |

Economy does **not** implement `LabourProvider` (available, draw, productivity: persons, skill bands and pools are
the host's and realism's POPULATION work; Economy offers only a band-to-factor table as data if asked) or
`UtilityProvider` (realism).

### 4b. What Settlement gives Economy (`SettlementReader`, read-only, pure over `SettlementState`)

Economy never holds a `SettlementState`; the host passes a reader each tick:

```ts
interface SettlementReader {
  businesses(market: string): { id: string; inventory: string; account: string; status: string; open: boolean }[]
  posts(market: string): { id: string; biz: string; role: string; wage: number; hours: number; filledBy: string | null }[]
  production(biz: string, day: number): { recipe: string; q: number }[] | null
  hasFixture(market: string, fixture: string): boolean          // "a settlement has or lacks each" (GOODS.md 3h)
}
```

All of these exist as Settlement queries or state today; the reader is the adapter's mapping, one market per
settlement id.

### 4c. What Economy asks of others (not Settlement)

`PopulationProvider.headcount(market, day)` and per-capita consumption (realism's POPULATION / NUTRITION or host
data), `TransportProvider.days(from, to)` (the host's map), the day number (the host's clock). Listed so the
boundary with realism is visible; not part of this contract.

## 5. Wages and staffing (proposed)

- **Settlement** decides who fills a post and pays `Post.wage`. Wage levels are host data (Settlement Q10, open).
- **Economy** runs a **labour market** per market: it reads open and filled posts (4b) and the pool supply the host
  reports, and quotes `wageQuote(market, role, day)`: the going rate for a role under shortage or surplus. The
  host may feed the quote back into posts (a Settlement `setWage` command, if Settlement adds one: **(proposed)**)
  or ignore it. Economy never changes a post.
- Wage payments are Settlement's ledger rows (`wage`). Economy's accounting reads them (§3 `rows`), never
  duplicates them.
- Household income (what a paid person then buys) is **consumption** in Economy, driven by the balance the ledger
  shows. **(open, Rex)** whether named characters' spending is simulated at all, or only pools'.

## 6. Production and consumption (proposed)

- For a **Settlement-run market**, production is Settlement's Q handed to `produce`; Economy only records it.
- For an **abstract market** (a port with no Settlement state: `ports.json` `produces` / `consumes`), Economy runs
  its own production and consumption from the five numbers. A market is one or the other, flagged in Economy's
  data (`mode: 'settlement' | 'abstract'`), so nothing is counted twice.
- **Consumption** (households, ships provisioning, a business buying its inputs from the market) is Economy's in
  both modes.
- **Equipment presence** ("the settlement has or lacks each", GOODS.md 3h) comes from Settlement's fixtures (4b
  `hasFixture`) in a Settlement-run market and from data in an abstract one. Economy's recipe check reads it; it
  never owns fixtures.
- **Spoilage** is Economy's (stock falls by the good's rule), with the data marked estimate where it is.

## 7. Prices and trade (proposed)

Economy's alone: the price per good per market from the five numbers (the formula is a config key; the
illustrative `base × (0.7 + 2.3 × shortage)` from ALIGNMENT §10 is **not** adopted until Rex says), shortage
events, orders, shipments with travel days from the host's map, duties where a government layer sets them,
organisations that own inventories and ships. Settlement sees none of this except the price it asks for.

## 8. Accounting (proposed)

Economy offers a derived, pure view `accounts(biz, fromDay, toDay)` → revenue (sales), cost of goods (purchases,
inputs consumed at cost), wages and rent (Settlement's rows through the ledger), spoilage, profit, and the
inventory's value at market. It is a query, never state: the ledger stays the record.

## 9. Order of a day (proposed)

The host runs `settlement.tick(day)` first (decay, projects, staffing, production, wages, public works, expiry),
then `economy.tick(day)` (spoilage, consumption, market clearing and prices, labour-market quotes, shipments,
accounting snapshots). So a day's production is on the shelf before the day's buyers come. Both reducers are pure:
`reduce(state, command, config, providers) → { state, events }`; events are returned, never pushed; neither
engine issues the other's commands. Economy takes a seeded random source from the host where a rule needs one;
replaying the same command log gives the same state.

## 10. Ids

Opaque strings on both sides, compared and never parsed. Economy mints `inv.*`, `mkt.*`, `ship.*`, `ord.*`,
`org.*` with Settlement's counter scheme (stable, never reused). A market id is the settlement id the host gives.

## 11. What each side promises

Settlement promises: the provider interfaces keep the shape Economy implements; `produce` is never called for
more than `available`; `Business.inventory` is treated as opaque; production results are queryable per day; ledger
rows for wages and rents carry the post or lease id as `subject`.

Economy promises: no import from Settlement or any game; `MaterialProvider` answers are pure within a day; stock
never goes negative; money moves only through `LedgerProvider`; it never writes a post, fixture, title or
assignment; every rule Rex has not decided is a config key or an open item in this file.

## 12. Open for Rex (collected)

1. Goods types, money versus goods, grain of goods, names, cask size (GOODS.md Open 1–8).
2. Is `port.cash` the treasury (Settlement Q7)?
3. Who values property for an unpriced sale (§4a)?
4. Is named characters' spending simulated, or only pools' (§5)?
5. The price formula and its constants (§7): a config key until then.
6. Wage levels per trade (Settlement Q10) and whether a market wage quote may move them.

## 13. Changes this proposal asks of Settlement (each small, none blocking)

a. `MaterialProvider.rates(recipe)`, or the host-copies-at-open rule (§2).
b. `TransactionKind` widened or extended (§3).
c. A `setWage(post, wage)` command (§5), if Rex wants market wages to reach posts.
d. Confirm the reader in §4b is derivable from today's queries (it looks so from `queries.ts` and `state.ts`).

## Log

| Date | What |
|---|---|
| 2026-10-30 | Proposal written and sent to the settlement keeper |
