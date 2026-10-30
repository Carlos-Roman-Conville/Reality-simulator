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

## Package tests (`test/markets.test.ts`), steps 3–4

| Id | Rule under test | Must hold |
|---|---|---|
| E5 | consumption draws the market's stock by the host's numbers | `consumptionPerDay` is taken each day; demand beyond stock is `unmet` and stock stops at zero; with no `consumptionPerDay`, demand is headcount × `perCapitaPerDay` from the population provider; neither set means no demand (open); an abstract market adds `productionPerDay` to its own stock, a settlement-run market does not |
| E6 | spoilage follows the good's rate in every inventory | a tenth a day is lost wherever the good lies; a good with `null` never spoils |
| E7 | a shortage event when stock falls under the target reserve | none while the reserve is met; one per day below it, carrying the shortage fraction |
| E8 | price moves with shortage by the configured curve | under `shortage-linear` the price rises as stock falls and returns to base when the reserve is met; a `priceSet` event per change |
| E9 | base price is data, never derived | no base price, no price under any rule; the default rule returns the base price unchanged; a negative base price is refused |

## Package tests (`test/trade.test.ts`), steps 5 and 7

| Id | Rule under test | Must hold |
|---|---|---|
| E10 | goods in transit are in no market | a shipment leaves its inventory at once, is in no inventory on the way, lands after the host map's days; total units are conserved; a pair with no route is refused; a perishable good spoils on the way |
| E11 | money is conserved across a sale | buying and selling move goods one way and money the other at the market's price (or the host's), through the ledger provider only; the sum of balances never changes; a trade with no price anywhere is refused (open); one beyond stock leaves the state untouched |
| E13 | accounting reconciles with the ledger | the view sums the holder's rows by kind (sale, purchase, wage, rent, freight, other), values its inventories at today's prices, and its profit equals the balance change; a day range filters the rows |

## Package tests (`test/labour-and-sim.test.ts`), steps 6 and 8

| Id | Rule under test | Must hold |
|---|---|---|
| E12 | the wage quote rises when posts outnumber workers | the default rule (`posted-median`) quotes the role's posted median with no pressure (the open state) and nothing for a role with no posts; under the `ratio` rule the quote rises with more posts than workers, falls with more workers, stays within its floor and ceiling, and falls back to the median when the host's supply is unknown |
| E14 | the three-port sim is deterministic | thirty days run twice give the same state, log and printed table; every price finite, no negative stock; the companies' purses and the ports' takings sum to what the companies started with; at least one shipment and one sale happened |

## Integration (`Games/RPG's/pirate-ship/web/src/economy/economy.test.ts`, steps 9–10; pirate commit 962702a)

| Id | Rule under test | Must hold |
|---|---|---|
| I1 | the port's butcher produces into an economy inventory through the material provider | one settlement day: Settlement's Q (four units of meat from one butcher, no labour left for the fish line) is the stock move the economy records, with by-products; every provider call Settlement made is a logged economy command and the day replays; the reader sees the settlement's businesses, posts, production for that day only, and fixtures; the price provider answers for goods and refuses property (open); the ledger provider is Settlement's ledger |
| I2 | thirty autonomous days of the port with both engines | every day: the two days aligned, no negative stock, Settlement's total money unchanged, every price finite, the economy's observed production equals Settlement's Q per line; inputs run out part way and the shop goes back to staffed; cattle is conserved into meat sold, eaten or on the shelf; the shop's balance equals the accounting view's profit; the economy's whole run replays byte for byte |

Planned: I3 consumption from a realism population provider (step 11, waits on the body-and-world keeper).
