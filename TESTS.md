# Tests: one row per rule (economy keeper, 2026-10-30)

Package tests (E) run with nothing of any game on disk, under vitest in this folder. Integration tests (I) run in
the pirate repo's `web/` beside the settlement adapter once PLAN step 9 exists. Every number in a setup is a fixture,
not a game rule.

## Package tests (`test/engine.test.ts`), step 2

| Id | Rule under test | Must hold |
|---|---|---|
| E1 | stock never goes negative | a move, removal or production beyond stock throws and the state is byte-identical to before; `take` returns at most the stock; no inventory holds a zero or negative entry |
| E2 | produce consumes inputs by the recipe's quantities and yields output and by-products | one log makes two planks and half a unit of sawdust; the market's `producedToday` rises by the output and rolls to `producedLast` at tick; an `inputsAny` group pools its options and draws the first available first (proposed); a recipe with no inputs is unlimited by materials; `units` must be an integer >= 1; the `MaterialProvider` over a `Runner` has Settlement's shape plus `rates` and logs every call |
| E3 | replay gives the same state | a day of commands replayed from the log is JSON-identical, ids included; prices and shortage read from the five numbers and read `null` where the host set nothing (never a default); `priceRule: base` returns the base price, a configured curve scales it |
| E4 | no import from outside the package | every import in `src/` is relative and stays inside `src/`; no spec names settlement, realism or pirate; an unknown command throws |

## Planned (PLAN.md steps 3–8)

E5 consumption draws stock · E6 spoilage by the good's rule · E7 shortage event when stock < reserve · E8 price
rises with shortage and falls with surplus by the configured curve · E9 base price is data, never derived · E10
goods in transit are in no market · E11 money conserved across a sale · E12 wage quote rises when posts outnumber
workers · E13 revenue minus costs equals profit and reconciles with the ledger · E14 the three-port sim is
deterministic.

## Integration (PLAN.md steps 9–11)

I1 Settlement's hamlet produces into an Economy inventory through the material provider · I2 thirty days of one
settlement: money and mass conserved, no negative stock, prices finite · I3 consumption from a realism population
provider.
