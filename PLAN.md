# Plan: from contract to the thirty-day benchmark (economy keeper, 2026-10-30)

Each step is one commit series with its tests named after the rule they hold (TESTS.md arrives with step 2). A
step waits where it says. Every number in a test is a fixture, not a game rule.

| Step | What | Waits on | Tests |
|---|---|---|---|
| 1 | **Contract** with Settlement (`CONTRACTS.md`); the same text on both sides. Text confirmed 2026-10-30; waits only for Settlement's §13 commit | Settlement commit | none |
| 2 | **Records and reducer**: goods, recipes, inventories, markets, config (every constant proposed), ids, `reduce` + `Runner`, events; `MaterialProvider` implementation over inventories | 1 | E1 stock never negative; E2 produce consumes inputs by the recipe's quantities and yields by-products; E3 replay gives the same state; E4 no import from outside the package (a test reads `src/`) |
| 3 | **Consumption and spoilage** per market from the five numbers and a population provider | 2 | E5 consumption draws stock; E6 spoilage by the good's rule; E7 shortage event when stock < reserve |
| 4 | **Prices** from shortage, the formula a config key | 2 | E8 price rises with shortage, falls with surplus, by the configured curve; E9 base price is data, never derived |
| 5 | **Trade**: orders, shipments with host travel days, arrival adds stock, freight through the ledger provider | 4 | E10 goods in transit are in no market; E11 money conserved across a sale |
| 6 | **Labour market**: wage quotes from posts and pools read through `SettlementReader` | 1, 2 | E12 quote rises when posts outnumber workers |
| 7 | **Accounting**: the derived view over ledger rows and inventory value | 5 | E13 revenue minus costs equals profit and reconciles with the ledger |
| 8 | **Three ports, three goods, two companies** (pirate PLAN unit 37's first sim) as an example with no pirate data | 5 | E14 the sim prints prices and shortages over days and is deterministic |
| 9 | **Settlement integration**: the pirate adapter implements Settlement's providers from this engine and the reader from Settlement's state | 2, settlement keeper | I1 Settlement's hamlet produces into an Economy inventory |
| 10 | **Thirty-day autonomous settlement benchmark**: one settlement, Settlement + Economy + stub population, thirty ticks, every invariant held every day | 9 | I2 thirty days: money and mass conserved, no negative stock, prices finite |
| 11 | **Realism hook**: a population / nutrition provider from `realism` for consumption | 10, body-and-world keeper | I3 |

Open for Rex items are collected in `CONTRACTS.md` §12 and never block a step: the step runs with the value marked
proposed in config, or refuses the command.
