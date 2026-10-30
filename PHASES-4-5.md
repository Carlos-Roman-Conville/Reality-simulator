# Phases 4 and 5: making the library operational (approved by Rex, 2026-10-29)

Rex (relayed from ChatGPT, 2026-10-29): approve Phases 4 and 5 of MIGRATION.md for the belt, as coordinated
workstreams with explicit integration checkpoints. Phase 4 implements the scientific mechanisms the docs
describe, from the shared library, one authoritative implementation per process, the engine independent of
pirate-ship. Phase 5 connects the game's characters, skills, equipment, facilities, environment, actions and
inventory to the engine: the game supplies circumstances and receives results, and duplicates no formula.
Requirements: small testable modules with explicit dependencies; independent modules in parallel, integrated
in dependency order; data validated against the library and unsupported models **flagged, never patched with
an invented constant**; unit, cross-system and conservation tests; the 35 engine and 274 game tests stay
green; the planner must not re-queue the same unresolved issue; a working end-to-end simulation at every
checkpoint. Primary acceptance test: a thirty-day simulation of a small pirate settlement (eating, sleeping,
working, producing goods, fatigue, recovery, consumption) joined to the game's workforce, inventory,
facilities and economy. The settlement is an integration target, not a town redesign: where staffing,
ownership or construction systems are missing, the task exposes the dependency and uses a clearly identified
temporary fixture. After these phases: the engine runs a different organism or environment with no game code.

## Lanes and order

Two belt lanes run in parallel. `realism` (new; tasks `NN-realism-*`, repo `Toolchain/realism`) builds Phase 4;
`pirate-ship` builds Phase 5 and waits on the engine's checkpoints through cross-lane `Needs:`.

```
realism lane                                          pirate-ship lane
2520 physiology ─┐
2522 atmosphere  ├─ 2521 nutrition ─┐
2523 environment ┤                  ├─ 2525 CHECKPOINT 1: a human for a week ──┬─ 2533 characters ─┬─ 2536 stats and faces ─┐
                 └─ 2524 neurology ─┘                                          ├─ 2534 food, inventory ┼─ 2537 work, production ┤
2526 circulation ─ 2527 anatomy ─┐                                             └─ 2535 places ─────────┘                       │
2528 muscular ───────────────────┼─ 2529 medicine ─ 2530 ecology, population                                                   │
                                 └─ 2531 CHECKPOINT 2: the human wounded ────────── 2538 medicine and combat adapter ──────────┤
2532 INDEPENDENCE: a horse in a stable (no game code)                              2539 ACCEPTANCE: the settlement, 30 days ───┘
```

## Rules every task carries

1. **The library is the source.** A module reads `data/library/*.json` through `src/library.ts` (2520 writes
   it). A constant that is not in the library and not in a cited source is not used: the module writes a line
   to `FLAGS.md` (`UNSUPPORTED: <module> <what> <which doc asked for it>`) and leaves that path disabled or
   `null`. Never a made-up number, never a loosened test.
2. **One implementation per process.** If a formula already exists in `physics.ts`, `process.ts` or an earlier
   module, call it. The still (`src/lab/still.ts`) keeps passing unchanged.
3. **Every transfer traced, every conserved quantity checked** (`World.conserve`, the per-element check from
   2509): energy (kcal in, work and heat out, stored), water, each nutrient's mass, blood volume, goods.
4. **Outputs by id**, the ids the library rows carry, so the game's adapters read `outputs["sleep_debt"]` and
   never a module's internals.
5. **The game never holds a formula.** An adapter maps game records to engine inputs and engine outputs to
   the game's faces and meters, with the numbers that the game's own adapter rows carry (`body/data/*.json`).
6. **Fixtures are named.** Where the game lacks a system the simulation needs (who staffs a facility, who owns
   it, how it is built, how a wage is paid), the adapter uses a fixture declared in
   `web/src/world/FIXTURES.md`: what it stands in for, the value used, the decision Rex must make. Fixtures
   never silently decide a rule.
7. **Checkpoints are runnable.** 2525, 2531, 2532 and 2539 each leave a program that runs from the shell and
   prints a ledger, plus a test that asserts ranges taken from the library's own rows.
8. **Other keepers' folders are read, never edited** (`story/`, `town/`, `combat/`, `balance/`, `art/`,
   `economy/`, `crew/`); COMBAT.md §4a to §4e are Rex's decisions and stay as written.

## The thirty-day settlement (2539)

Twelve characters in Port Royal across thirty days of the game's climate: each sleeps, eats from a shared
inventory of the economy's goods (`data/pirate-ship/economy/goods.json`, mapped to library foods), works a
facility by a duty schedule (MET by activity), produces goods by the economy's recipes, tires and recovers,
and meets seeded hazards (a wound, a fever). The test asserts: goods produced minus consumed equals the stock
change; each body's energy and water balance closes; nobody dies silently (a death opens a crisis record);
mass, alertness and fatigue trajectories stay inside the library's ranges; the run takes under a minute. The
ledger prints per day: stock, output, calories issued, sleep, sick list, crises. `FIXTURES.md` lists every
stand-in with Rex's decision next to it.

## Status (2026-10-30, 02:30)

Both phases landed overnight on the belt, 26 engine tasks and 8 game tasks, about 46 dollars.

- **Engine (Phase 4):** ten modules exported from `src/index.ts`; 225 tests. Checkpoint 1 (`examples/human-week.ts`)
  runs in 1.7 s with 0 failed checks; after 2540 the water ledger closes at a 0.5% deficit instead of draining the body.
  Checkpoint 2 (`human-wound.ts`) runs three binding variants with 0 failed checks. Independence (`horse-stable.ts`):
  a 500 kg horse for thirty days, energy in equals energy out, no game word in `src/` (the gate greps for it).
- **Game (Phase 5):** adapters for characters, food and inventory, places, stats and faces, work and production,
  medicine and combat; `web/src/world/settlement.run.ts` prints thirty days of stock, production, consumption,
  spoilage, calories, sleep, hazards, shortages and crises for twelve settlers. A yellow fever case on day 14 opens a
  crisis record with its row and risk; nobody dies silently; stores sized for the month run out on day 30.
- **Honest gaps, all in `flags/` or `FIXTURES.md`:** the library's unsourced slots are null (plasma refill, maximal
  cardiac output, bleed rate and clotting, organ masses, cascade kinetics, three-compartment fatigue rates, EC50 and
  tolerance rate, vector exposure); sourcing tasks 2552 to 2562 fill them from opened pages or record the search.
  2561 built `src/crisis.ts`: a class IV bleed opens a crisis, the hydration bands "6 to 10" and "over 10" open one at
  their lower bound, and `declareDeath` throws without a crisis. Weather in the settlement run repeats
  one daily mean (the diurnal curve is not applied by the places adapter). Production rates are F-WK fixtures.
- **Belt lessons (ISSUES I-1029 to I-1032):** gate paths are relative to the gate's `cd`; a source package carries
  its consumers' strictest type flags; sourcing tasks need `Tools: WebSearch, WebFetch`; `Already done if` tests the
  new artifact or is `false`.

## After these phases

The engine simulates a horse in a stable (2532) with no import from any game. Then: the body as organ
components on the graph in the still's room (so the distiller's lungs breathe the room's CO), the dashboard's
Simulation Laboratory on a browser bundle, and the package's own reference docs (MIGRATION Phase 3's tail).
