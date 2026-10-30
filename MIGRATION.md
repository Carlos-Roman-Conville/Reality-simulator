# Three layers: dependency map and migration plan (2026-10-29)

Rex's instruction (relayed from ChatGPT, 2026-10-29): the realism engine must be completely independent of
pirate-ship; audit the pirate repository for scientific systems, formulas, reference data and documentation
that belong to the universal engine; separate universal mechanisms and reference data from pirate-specific
content; move nothing blindly and duplicate no scientific data; first produce a dependency map and a
migration plan. This is that plan. Phases 1 to 3 ran on the belt the same evening (see §5); 35 engine tests and 274 game tests pass.

## 1. The three layers

| Layer | Home | Holds | Imports |
|---|---|---|---|
| **Universal realism engine** | `Toolchain/realism/src/` | formulas and processes: physics, chemistry, anatomy, physiology, nutrition, neurology, circulation, the biological inputs of psychology, atmosphere and gas dynamics, equipment capability and wear, population and ecology dynamics | nothing from any game |
| **Scientific data library** | `Toolchain/realism/data/` | substances, materials, reactions, nutrients, foods' real composition, organs, tissues, diseases, wounds' biology, drugs' kinetics, muscle groups, equipment specifications, climate and species constants, and the sources behind every row | nothing; the engine reads it |
| **Pirate game** | `Games/RPG's/pirate-ship/` | characters, factions, story, map, 1650 to 1730 availability, prices, period treatments and names, game rules, visible faces, STATS formulas, combat consequences, minigames, time anomalies, Jamaica's climate and Port Royal's population as instances | `@rex/realism` public API and its data, by id |

Test of the boundary: the engine can simulate a human, a horse, a laboratory or a room with none of
pirate-ship on disk. The game can be deleted without breaking an engine test.

## 2. What the audit found

The pirate repo's `files/pirate-ship/body/data/*.json` (18 files, about 1,250 rows) and the 22 docs under
`body/`, `world/` and `science/` mix the layers **inside single tables and single paragraphs**, by design:
every doc carries the four statement kinds [science] / [history] / [model] / [fiction], and most tables carry
both universal columns (a constant, a formula, a mechanism) and game columns (`Visible face`, `Period
treatment`, `STATS skill`, `GOODS.md row`, `1650 to 1730 availability`, `COMBAT 4a hit-location`, `Game
boost (fiction)`). So the migration is a **column split keyed by id**, not a file move. Counts from the
audit:

- Sources: 320 rows in `sources.json`; 168 `science`, 33 `reference` (library), 116 `history` and 3 museum
  or primary texts (game).
- Docs: every body and world doc cites COMBAT, STATS or PIRATE (BODY.md 38 such citations, MEDICINE.md 27,
  POPULATION.md 22); and the game's other keepers cite them back (balance, combat, story, town, STATS).
  These docs are game design documents that quote science; they stay where they are.
- Code: the only code consumer of the engine is `web/src/world/galleyStill.ts` (an adapter, correct shape).
  No game code reads `body/data` yet; only the static dashboard does, through `body/data.js`.
- The engine's own data is still hard-coded in `src/registry.ts` (belt task 2508 moves it to `data/`).

## 3. Dependency map: table by table

Legend: **E** engine (a formula or process), **L** library (reference rows), **G** game (adapter rows keyed by
the same id). "Split" names the columns that go to the game.

| File.table | Rows | Layer | Split: game keeps |
|---|---|---|---|
| physiology.met, pal, sleep_debt, circadian, wbgt_limits, core_temp, cold_water, hydration, banister, ageing, acclimatisation, recovery, ventilation | 83 | E + L | `Visible face`, `Activity (duty)` names (the MET value and compendium activity stay L; the duty mapping is G) |
| nutrition.nutrients, absorption, body_composition, depletion | 68 | L (+E for depletion kinetics) | `Stage 1/2/3 face`; deficiency disease link stays L (it is biology) |
| nutrition.foods, foods_more | 102 | L for the composition columns, G for `Good (GOODS.md row)`, `Keeps (days at sea)` | the food id maps a universal food to a trade good |
| nutrition.ration, boosts | 15 | G | all (period ration; `Game boost (fiction)` is fiction by its own label) |
| anatomy.organs, tissues, damage_function, timescales, species, respiratory | 55 | E + L | `Period diseases and injuries`, `Visible face`, `Owner of the effect`, the fish-person column (Rex's form: G, fiction) |
| circulation.quantities, bleeding, delivery_failures, homeostasis, blood_gas, events | 49 | E + L | `Face`, `Visible face`; event chances stay model placeholders in L until measured |
| medicine.diseases | 22 | L: cause, incubation, course, death risk, lasting harm, what really helped | G: `[period name]`, `Period treatment`, `How the sim catches it` (exposure comes from the game's places) |
| medicine.wounds, bleeding, pain, healing, immunity, exposure | 45 | L for biology (bleeding class, infection chance, healing days, immunity states) | G: `What it dips (COMBAT 4a)`, `Period treatment`, `Visible face` |
| medicine.treatments, hygiene | 24 | G (what the surgeon did, STATS Surgery, GOODS supplies) with one L column, `Really worked?` | the efficacy column is science and moves; the rest is period practice |
| muscular.groups, values, fatigue_rates, endurance_time, training, adaptation, patterns, tendons, injuries, gym, limb_strength | 98 | E + L | `Feeds limb stat` (STATS), `Example actions`, `gym` (the ship's training options: G) |
| muscular.activations | 26 | L for the 31 activation columns and MET | G: the `Action` and `Source doc` naming (duty, fishing stage, combat action) |
| neurology.systems, baseline, pk, receptor, circuits, interactions, outputs | 59 | E + L | `Period status` of each drug, `What a tone reads as` faces, `outputs` (what the game's meters receive) |
| psychology.pushes, madness_links | 34 | G | all; the biological inputs they read (hunger, pain, sleep debt, drug tone) are engine outputs by id |
| body.record, capabilities, tick, states_of_being, chains, visible_faces | 70 | G | all; `capabilities` are STATS formulas over engine outputs; `tick` becomes the game's scheduler configuration; `states_of_being` are species profiles that reference library organs |
| atmosphere.baseline, altitude, modifiers | 17 | E + L | none |
| atmosphere.regions, scenarios | 21 | G | the ship's and town's rooms and their period provenance |
| gasdynamics.units, box_model, sources_sinks | 26 | E + L | `Who writes / reads` |
| gasdynamics.grid | 7 | E | `the combat map's tiles` wording becomes "a grid the host supplies" |
| chemistry.schema, substances, reactions, domains, reaction_fields | 75 | L (schema is E's contract) | `Period source in the game`, `Period example`, `Where` |
| chemistry.scope | 8 | G policy (Rex's decisions) | all |
| equipment.roles, assembly, wear, confidence | 27 | E | none |
| equipment.catalogue | 314 | L: id, roles, made of, energy, max temperature, pressure, precision, capacity, needs, enables, conf_capability | G: `1650 to 1730 availability`, `Skill (GOODS 3c)`; `Date`, `Credited to`, `Predecessor`, `conf_history` are world history, which the JOURNAL's Time Anomaly label needs, so they go to L as a `history` sub-record the game reads (a second game in 1850 reads the same dates) |
| science.separations, states, classifications, entry | 36 | E (the discovery and journal contracts) | the labels' examples |
| science.technology, plan | 17 | G | all |
| environment.climate, weather_states, currents, sun, period_climate | 33 | G instances of Jamaica (L once a second game wants a place table; then `data/places/`) | all; the exposure physics (WBGT, sunburn time) is E |
| environment.exposure | 11 | E + G | the place names are G; shade, wind and WBGT rules are E |
| ecology.stocks, crops, soil, seasons, depletion_rules | 42 | E for the logistic and soil rules, G for the Caribbean stocks and crops | all rows; the formulas move |
| population.rates, cohorts, tick, fences | 32 | E for the cohort tick, G for Port Royal's rates and the named-character fences | rates and fences |
| sources.sources | 320 | L for `science` and `reference`, G for `history` | by the `Kind` column |

## 4. Docs

The 22 docs stay in the game as its design documents, because they are where Rex's decisions live, every
other keeper cites them, and most of their words are game consequences. The engine gets its own reference
docs rendered from the library data (one per domain, science and model rows only, the same build script
pattern as `body/build-body-data.py`). Each game doc then cites the engine doc's row ids instead of
restating the constant, so a number has one home. `science/ENGINE.md`, `CHEMISTRY.md` §1 to §3 (the
schemas), `SCIENTIFIC_EQUIPMENT.md` §3 to §4 (assembly, wear, confidence), `DISCOVERY.md` and `JOURNAL.md`
(the contracts) are engine documentation written in the game repo; they move to the package once their
tables move, leaving a pointer page behind. `PHYSICS.md` (a stub) and `PLAN.md` fold into the package's
README and this file.

## 5. Migration plan

Each phase keeps every test green and never leaves a number in two places.

| Phase | Work | Where | Worker |
|---|---|---|---|
| 0 | Boundaries (this document). Rules: the package imports nothing from any game; the game imports `@rex/realism` only; every library row has a stable `id`; game adapters key by that id; the build renders docs from one copy. | done | body keeper |
| 1 | Engine's own data to files: `data/substances.json`, `materials.json` (belt 2508), `reactions.json` (2509); fuller physics (2507); the planner's 2511 verified the substance rows against their cited pages. | package | done 2026-10-29, 33 tests |
| 2 | `scripts/split_data.py` in the package: reads the game's 18 data files, writes library files by the map in §3 (universal columns, `id`, `source` keys) and rewrites the game's files to adapter rows (`id` plus game columns). `sources.json` split by `Kind`. | package + game | **done 2026-10-29** (belt 2512, 2513): 16 library files, 83 tables, 1,474 rows, 201 sources; `check_library.py` passes; the game's files hold only ids and game columns |
| 3 | The game's `build-body-data.py` reads two roots (the package's `data/library/` and the game's adapters) and renders the docs and `data.js` from both, joined on `id`, so the dashboard and the game show the same authoritative numbers (**done 2026-10-29**, belt 2513 and 2514: 41 library markers in the docs, the build fails if the library is missing, the dashboard verified in the browser). Still to do: the package's own `build-docs.py` and reference docs, one per domain. | both | Sonnet |
| 4 | Processes as engine modules, from the docs' formulas: `physiology.ts` (energy, heat, sleep, hydration), `nutrition.ts` (pools, absorption, depletion), `circulation.ts` (DO2, bleeding classes, loops), `neurology.ts` (tone, kinetics, clocks), `anatomy.ts` (organ function, damage, cascade), `muscular.ts` (3CC fatigue, four-level adaptation), `atmosphere.ts` (altitude, box model, grid), `population.ts`, `ecology.ts`. Each with tests against the cited numbers (the sleep-debt table, the Widmark curve, the alveolar gas equation, the logistic stock). The body becomes organ components on the connection graph. | package | Codex for solvers, Sonnet for data-driven modules; one module per task |
| 5 | Game adapters in `web/src/world/`: duty → MET, good → food id, place → room, STATS capability formulas over engine outputs, visible faces, psychology pushes. `galleyStill.ts` is the pattern. | game | Sonnet |
| 6 | Move the contract docs (§4) and retire the game's copies to pointer pages; the JOURNAL's Time Anomaly logic reads the library's history sub-records. | both | Sonnet |
| 7 | Second consumer: a smoke project (`Toolchain/realism/examples/`) that simulates a horse in a stable and a laboratory calcination with no game on disk. This is the proof the layering holds. | package | Sonnet |

Phase 2 is the only one that touches the game's data files, and it does so once, by script, with a diff Rex can
read. Phases 4 and 5 are the bulk of the work and can run in parallel on the belt because they touch
different repositories.

## 6. What stays game-specific, by name

Visible faces and their channels; STATS capability formulas; states of being as Rex's forms; the overnight
tick order as the game's scheduler configuration; psychology pushes and madness links; period names,
treatments, prices, availability and skills; the ship's and town's rooms; Jamaica's months and Port Royal's
rates; the combat tile grid as the host of the engine's gas grid; the fiction rows (boosts, the fish-person
column); every "(Rex, date)" decision about what the game does with a number. The engine supplies the
number; the game decides what it means.

## 7. Decisions and open items

- **Phase 2 runs after Phase 1's three belt tasks land (Rex, 2026-10-29)**, so the split script sees the
  final schema. Queued as belt tasks 2512 (the library side, in this repo) and 2513 (the game side), with
  `Needs:` on 2507 to 2509.
- **(open)** Whether place tables (climate, currents, stocks) go to the library at once as
  `data/places/jamaica.json` or stay in the game until a second game needs a place. Until Rex decides they
  stay in the game, as §3 says.
