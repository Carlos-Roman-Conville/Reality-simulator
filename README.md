# @rex/economy: the economy engine (contract stage, 2026-10-30)

A reusable economic simulation: goods and recipes as data, inventories, markets with Rex's five numbers per good
(stock, consumption per day, target reserve, production per day, base price), prices from supply and demand,
consumption, a labour market, trade and transport over a host-supplied network, organisations, and business
accounting. A reducer plus a daily tick, pure and replayable. **It imports nothing from any game or any other
engine**; the pirate game's goods, ports and companies (`Games/RPG's/pirate-ship/data/pirate-ship/economy/`) reach
it through an adapter. Modelled on `../realism` and `../settlement`. Rex placed it here on 2026-10-28
(ALIGNMENT §10); the engine family and its rules are in `../ENGINES.md`.

**Status: contract text confirmed with Settlement (2026-10-30); PLAN step 2 in progress; nothing is written against §13's new Settlement calls until its commit lands.** ENGINES.md requires the contract to be agreed before
either side implements production or labour. `CONTRACTS.md` is the agreed text.

## Read in this order

1. `../ENGINES.md`: owners, boundaries, the contracts to agree.
2. [CONTRACTS.md](CONTRACTS.md): who owns which record, what each side promises, the interfaces.
3. [PLAN.md](PLAN.md): the steps from contract to the thirty-day settlement benchmark, each with its tests.

## Run

    npm install --offline      # vitest and typescript from the cache (the settlement lock file)
    npm test
    npm run typecheck

## Built so far (step 2, 2026-10-30)

`src/`: the records (`state.ts`: goods, recipes with quantities and rates, inventories, markets with Rex's five
numbers per good), ids (`ids.ts`: inv, mkt, ship, ord, org), tunables (`config.ts`: `priceRule` defaults to `base`,
the open state; `inputsAnyChoice`; the tick order), the provider interfaces this engine asks of the host with
in-memory stubs (`providers.ts`: ledger, population, transport, the settlement reader), the command union and
handlers (`commands.ts`: defineGood, defineRecipe, openInventory, openMarket, setMarketGood, addStock, removeStock,
moveStock, produce, take, tick), the material side and Settlement's `MaterialProvider` shape over a `Runner`
(`material.ts`), the reducer and `Runner` with replay (`reduce.ts`), the tick (`tick/`: production roll-up,
advance), queries (`queries.ts`: stock, shortage, price by rule, inventory value). `test/engine.test.ts`: one
describe per TESTS.md E-row, 10 tests. No example yet (PLAN step 8).

## Marks

**(Rex)** his decision, restated. **(proposed)** this keeper's suggestion. **(open)** only Rex can answer; the
engine carries a config key or refuses meanwhile. No value is filled in silently.

## Boundaries (what is deliberately not here)

- Persons, skills and skill bands as attributes of people, population counts, nutrition: the host and `realism`.
- Premises, fixtures, posts, who fills them, construction, titles, leases: `settlement`.
- Laws, duties and taxes as rules, enforcement: the future Government engine; Economy only applies a rate it is
  handed.
- Any pirate fact: goods names, ports, companies, prices, the map.
