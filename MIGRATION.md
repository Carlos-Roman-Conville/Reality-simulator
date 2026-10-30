# Migration plan: the pirate town onto the settlement engine (settlement keeper, 2026-10-29; proposed)

Every step leaves the slot model, `port.align`, `<slot>.align`, `<slot>.pending`, the transformation rule and
the nine endings working exactly as today, and every step ends with the alignment tests and the invariance test
(`TESTS.md` T0) green. Nothing starts until Rex approves this plan; steps 3, 6 and 9 each also wait on a named
answer in `QUESTIONS.md`. Marks: **(Rex)** his; **(proposed)** mine; **(open)** Rex's call.

**Authorised 2026-10-29 (Rex, agreeing with ChatGPT's review):** the architecture; step 1 in full (records, the
ledger, assignments, projects) in the package. Still open before their steps: the map's dimensions (step 3), the
starting titles and faction ownership restrictions (steps 4 and 6). Step 1 was built the same day in this folder
(README, "Built so far"), and step 2 (the adapter shell, the T0 guard, T1, A1 and A2) in the pirate repo the same
evening on Rex's verbatim approval relayed by the town keeper: "the first operational acceptance test must
demonstrate purchasing property, transferring title, leasing it, staffing a business, renovating its interior,
producing goods, and verifying that ownership changes alone do not alter institutional alignment". The starting
rows in `data/pirate-ship/settlement/start.json` are FACILITIES s7's proposal, every one marked proposed, and the
geometry there is an explicit placeholder until step 3.

Workers follow Rex's belt rule: Codex for solvers and the reducer, Sonnet for data-driven modules and adapters,
one module per task; Fable only for design and review. No whole-game Opus session.

## The guard every step runs (T0, alignment invariance)

The existing simulator scenarios (`web/src/alignment/sim/`) are folded through `reduce` before and after the
step with the settlement engine attached and driven through a scripted day (a sale, a lease, a hire, a renovation,
a tick). `AlignmentState` must be **byte-identical** at every command, and `townPosition`, `isPerfect` and
`ending` unchanged. The test lives in the adapter and is the first thing written (step 2).

## Steps

| Step | Work | Where | Depends on | Done when | Worker |
|---|---|---|---|---|---|
| **0** | This design: `DEPENDENCIES.md`, `PACKAGES.md`, this plan, `TESTS.md`, `QUESTIONS.md`. | `Toolchain/settlement/` | | Rex approves the plan (and answers Q1, Q2, Q6 before step 3, 6, 9) | settlement keeper (done 2026-10-29) |
| **1** | **The package skeleton.** `package.json` (`@rex/settlement`, same shape as realism: TS, vitest, no deps), `src/`: `ids.ts`, `state.ts` (records of PACKAGES s2, JSON-safe, versioned), `reduce.ts` (the command union; every command validates and throws on its invariants), `tick.ts` (the seven steps, each a function in its own file under `src/tick/`), `queries.ts`, `providers.ts` (the four interfaces plus in-memory stubs), `index.ts`. Unit tests per rule (`TESTS.md` U1 to U9). **No pirate code touched.** | package | 0 | `npm test` green; the hamlet scenario (three parcels, one business) runs with stubs | Codex (reducer, tick), Sonnet (queries, stubs) |
| **2** | **The adapter shell and the guard.** `web/src/settlement/`: `load.ts` (replays `data/pirate-ship/settlement/start.json` into engine commands; the `port.*` to engine-id bindings are **derived from the replay order**, never hand-kept, so one file cannot drift from the other), `bridge.ts` (folds settlement events into story hooks keyed on `port.*`; **no** alignment command issued), `index.ts`. `package.json` gains `"@rex/settlement": "file:../../../../Toolchain/settlement"`, vite `fs.allow` the path (the realism precedent). T0, T1, A1, A2 green. | pirate repo | 1 | **done 2026-10-29** (web: 278 tests green incl. the 4 adapter tests; `npx tsc -b` clean for the game's own files; a pre-existing unused-import error in `Toolchain/realism/src/process.ts` is the realism lane's) | settlement keeper |
| **3** | **The continuous map, derived.** A script `scripts/derive_map.py` (package) reads a *requirements* file the adapter supplies (`data/pirate-ship/settlement/requirements.json`: each `port.*` place's footprint class, housing for POPULATION s5's pool, road share, harbour frontage, undeveloped reserve share) and prints the derived dimensions, districts and a first parcel layout as `maps/port.json` (tiles + a `districts` and `parcels` layer). **No fixed counts are typed anywhere**; the counts fall out of the requirements (worked example below, every number proposed). `map.ts` is unchanged; a new `mapLayers.ts` reads the layers; `DockScene` keeps rendering `dock.json` until a `PortScene` exists (its own unit, later). | both | 2, **Q1** (footprint classes) | T2 green: every place has tiles; roads connect every parcel to the harbour; reserve share met; the dock's tiles are inside the harbour district | Sonnet (script), Codex (layout solver if a hand layout is not enough) |
| **4** | **Property live.** Titles for every parcel and building from `port.json` (holders per Q6, every row proposed until Rex says); `sell`, `transfer`, `inherit`, `lease`, `endLease`, the ledger, accounts; `port.cash` bound to the settlement treasury **only if Rex says (Q7)**, otherwise the treasury is its own account. The alignment engine is untouched: `slot.owner` is never written. | both | 2 | T3, T4, T5 green; T0 green after a scripted sale of `port.bakery`'s building | Sonnet |
| **5** | **Facilities onto buildings.** Each starting building gets `fixtures[]` from what its place is (the butcher shop a `salting-house`? the shipyard a `shipyard` and a `forge`? **every assignment proposed**, Q8); the adapter exposes `hasFacility(settlement, id)` = `hasFixture(..., {activeOnly: per Q9})`. `recipes.json` `facilities.list` and GOODS s3h are unchanged; the future economy engine's check reads the adapter's function. | both | 4 | T6 green: the derived boolean equals the hand list for the starting state; T0 green | Sonnet |
| **6** | **Businesses and workforce.** One business per starting place that has one (Q6); posts from `occupations.json` roles (counts proposed, Q10); `LabourProvider` reading POPULATION's pool per district with the stub productivity table; wages as ledger rows; `staffed` / `dormant` statuses. Named characters get **assignments** (residence at their place, employment or management where TOWNS.md says they run it) and nothing in `AlignmentState` changes: `location` stays `town` / `aboard` / `departed` and is derived exactly as today. | both | 5, **Q2** (whether recruiting still freezes the business) | T7, T8 green; T0 green after hiring, dismissing and a `recruit` | Sonnet |
| **7** | **Production.** `MaterialProvider` stub over a JSON inventory per business (until `Toolchain/economy` exists; then one file swaps the stub for the engine); `UtilityProvider` constant 1; production lines per business from `recipes.json` ids (which lines each starting business runs: proposed, Q10); `Q = min(...)` runs in the tick. The brewery is an optional construct project with `brewhouse` fixtures and Brewing posts (**Rex, via paste**), not a starting place. | both | 6 | T9, T10 green; a dormant brewery parcel produces nothing until built, staffed and supplied | Codex (production), Sonnet (data) |
| **8** | **Construction and renovation.** Projects over the layout: `renovate` writes a new layout version and fixtures; `construct` on a vacant parcel mints a building; `split` and `merge` parcels; materials through the provider, labour through the pool; permits through an office where `rules.json` requires one. Layouts persist in the save. | both | 7 | T11, T12 green; T0 green after a renovation of the butcher shop's interior | Codex |
| **9** | **Authority and public works.** `office.mayor` seated in `port.townhall`'s building; its powers from `rules.json`; public titles held by `town`; `publicWorks` businesses paid from the treasury; permissions ledgered. `sec.townhall` and `port.townhall` untouched; how the office is won is the story's (**Q11**). | both | 8, **Q11** | T13 green; T0 green after an appointment and a permit | Sonnet |
| **10** | **The development readings beside the flag.** The adapter exposes `physical('port.bakery')` and `economic('port.bakery')` as queries for screens and the simulator. The alignment `developed` flag is **not** derived from them: Rex decides (FACILITIES s8 item 4, **Q3**) whether `develop` may be issued from a settlement event, and if so the bridge gains one rule, as data. | pirate repo | 9, **Q3** | T14 green; UNRESOLVED gains a line until Q3 is answered | Sonnet |
| **11** | **Acceptance.** `TESTS.md` A1 end to end in the adapter: buy a property, transfer its title, lease a business, staff it, renovate its interior, produce goods; assert the story and alignment states unchanged where they should be and the ledger complete. Smoke project under `Toolchain/settlement/examples/` (a second settlement with no pirate data) proves reuse. | both | 10 | A1 green; the example runs | Sonnet; Fable reviews |
| **12** | **Hand-back.** FACILITIES.md s7 and s8 updated by the town keeper to point here (the records now live in the engine); `Toolchain/SCOPE.md` row flips to active; PLAN.md unit for the settlement engine beside unit 37. | docs | 11 | links resolve; `check_scopes.py` clean | town keeper, settlement keeper |

## Step 3, worked: how the map's dimensions are derived (every number proposed)

The rule Rex gave: no fixed parcel or district count; derive the initial dimensions from the spatial requirements
of the existing locales, housing, roads, harbour and undeveloped land. The script does only arithmetic over a
requirements file; the numbers below are a first fill of that file so the method can be checked, **not** a map.

| Requirement | Source | Proposed input | Tiles (16 px) |
|---|---|---|---|
| 16 `port.*` places | TOWNS.md | footprint class per place: small (6 x 5: hut, locked house, ESFJ stall), medium (8 x 6: clinic, apothecary, butcher shop, INFP house, tavern), large (12 x 8: church, town hall, warehouse, shipyard), field (20 x 14: the farm), open (market 16 x 4, docks 24 x 6, fort 14 x 10 off the grid) | about 1,900 |
| housing | POPULATION s5: 150 to 300 people, declining; a household of about 5 (proposed) | 30 to 60 houses at 5 x 4, a third of them empty or ruined at the start (the dying port) | 600 to 1,200 |
| roads and paths | the market "runs from the port into town" (Rex) | 20 % of developed area (proposed) | 500 to 650 |
| harbour | the docks, the shipyard's ways and careening beach, water frontage | one map edge, 6 tiles deep | about 600 |
| undeveloped reserve | "room to grow" (Rex, via paste); vacant parcels per playthrough | 40 % of the developed area, in parcels of the medium class, plus the edge district (the hut, the forest, the fort) | 1,200 to 1,700 |
| **total** | | | **about 4,800 to 6,100**, i.e. a map near **90 x 60** at the start, growable by `growDistrict` |

Districts fall out of adjacency, not a count: harbour (docks, shipyard, market's start), square (town hall,
church, tavern, clinic, apothecary), housing (the rest of the market, houses, the butcher shop, the warehouse),
farmland (the farm, fields, the reserve beyond), edge (the hut, the forest path, the fort, the INFP's house if
Rex puts it out of town). Whether that is five districts or three is the script's output after Rex fixes the
footprint classes (Q1).

## What each step must not do

- Write `slot.owner`, `slot.developed`, `slot.pos`, `slot.pending`, `CharacterState.location` from settlement
  code. Only the existing alignment commands do, issued by the game as today.
- Rename or retire any `port.*` or `sec.*` id, or key any art or ending on an engine id.
- Change `recipes.json`, `occupations.json`, `skills.json`, `goods.json` or `GOODS.md` (the economy research's;
  the adapter reads them).
- Add a law of inheritance, an election, a tax, a wage table or a parcel count that no source gives. Every such
  number enters `rules.json` marked proposed and is listed in `QUESTIONS.md`.
- Represent ghosts, deaths or transformations. A changed holder is a string the host sets.
- Touch `Toolchain/realism` or pre-empt `Toolchain/economy`: the providers are the seam.
