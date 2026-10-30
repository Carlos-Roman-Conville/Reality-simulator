# Dependency map: today's town, alignment, economy and map (settlement keeper, 2026-10-29)

What exists in `Games/RPG's/pirate-ship` that a settlement engine touches, and how the pieces depend on each
other today. Nothing here is changed by this document; it is the "before" picture the migration plan
(`MIGRATION.md`) works from. Marks: **(Rex)** his decision; **(proposed)** someone's starting point;
**(open)** nothing decided; **(audit)** what the files hold today, read on 2026-10-29.

Paths are relative to the pirate repo unless they start with `Toolchain/`.

## 1. The pieces

### Docs (design records; Rex's decisions live here)

| Doc | Owner | What it fixes that the engine must honour |
|---|---|---|
| `files/pirate-ship/town/TOWNS.md` | town keeper | the 16 `port.*` places and who is at each; the starting port is dying; towns are ecosystems; "you can't max a town out" |
| `files/pirate-ship/town/UPGRADES.md` | town keeper | the slot model: stable `port.*` ids, `sec.*` sectors (8 x 2), `port.align`, `<slot>.align`, `<slot>.pending`, `port.cash`, the transformation rule, the ghost rule, develop = `recruit(x) AND` x's condition |
| `files/pirate-ship/town/ENDINGS.md` | town keeper | nine endings read from `port.align`; perfect = every developed institution in one alignment; mean, no weighting |
| `files/pirate-ship/town/FACILITIES.md` | town keeper | the proposal, its audit (s2), eleven collisions (s3), six resolutions (s6; ownership is not control is Rex's), six record types (s7, proposed), open (s8) |
| `files/pirate-ship/balance/ALIGNMENT.md` | balance keeper | s1 the square; s5 institutions and the transformation rule; s6 the town and endings; s8 the config keys; s9 the reducer architecture; s10 scope change, including **the economy engine lives in `Toolchain/economy/`** (Rex, 2026-10-28) |
| `files/pirate-ship/economy/GOODS.md` | economy research | s3c the recipe rule (materials + equipment + band); s3f knowledge apart from skill; s3h equipment from a facilities list, "a settlement has or lacks each" |
| `files/pirate-ship/world/POPULATION.md` | body-and-world keeper | the unnamed pool: cohorts, `labour`, `occupations` map, the overnight tick; **never writes a named character's fate**; settlement sizes s5 (150 to 300, proposed) |
| `files/pirate-ship/art/TOWN_SHEETS.md` | art keeper | keyed on `port.*` slot ids (so ids never change) |
| `files/pirate-ship/story/characters/*.md` | story keeper | `develops_place` per character; slugs the alignment engine keys on |
| `files/pirate-ship/combat/COMBAT.md` s4e | combat keeper | death and transformation (Rex, 2026-10-29); unresolved against the pair ghost rule; **out of the settlement engine's scope by the brief** |

### Data

| File | Built by | Holds | Who reads it in code |
|---|---|---|---|
| `data/pirate-ship/alignment/institutions.json` | hand (balance keeper) | 8 sectors x 2 slots: `slot` (a `port.*` id or null), `owner` slug, `forms` per quadrant (all null) | `web/src/alignment/institutions.ts` `initialSlots()`; `conditions.ts` validates against it |
| `data/pirate-ship/alignment/thresholds.json` | hand | the s8 keys: `ownerDeparted: freeze`, `ghostRule`, `townAggregate: mean`, `perfectCounts: all-developed`, placeholders | `state.ts`, `institutions.ts`, `town.ts` |
| `data/pirate-ship/alignment/conditions.json` | hand | per slot, what must be supplied before `develop` (farm and butcher shop: bodies) | `conditions.ts` |
| `data/pirate-ship/alignment/{charts,starts,events,gates}.json` | hand | character charts, starts, placeholder events, joining gates | `charts.ts`, `state.ts`, `events.ts`, `gates.ts` |
| `data/pirate-ship/economy/recipes.json` | `files/pirate-ship/economy/build-economy-data.py` from `skill-tree.json` + `GOODS.md` | 248 recipes with `equipment[]`; **`facilities.list`: 25 equipment ids** (forge 16 recipes, loom 9, brewhouse 7, still 7, furnace 6, ...), "a settlement has or lacks each; the engine checks it before the band" | **nobody yet** (the economy engine is not built) |
| `data/pirate-ship/economy/goods.json` | same build | 133 rows, about 260 engine goods, `basePrice` null | nobody yet |
| `data/pirate-ship/economy/skills.json` | same build | 42 skills, five bands, the recipe rule text | nobody yet |
| `data/pirate-ship/economy/occupations.json` | same build | 43 labels over skills; "labels level nothing and grant nothing"; no wage, schedule or workplace | nobody yet |
| `data/pirate-ship/economy/ports.json` | same build from `atlantic-map.json` | 85 Atlantic nodes with `produces` / `consumes`; stock, consumptionPerDay, targetReserve, productionPerDay, basePrices all null | nobody yet |
| `data/pirate-ship/maps/dock.json` | hand | one placeholder tilemap (24 x 14 tiles of 16 px): water, planks, hull, deck, post; a spawn | `web/src/world/DockScene.ts` via `map.ts` |
| `Toolchain/realism/data/library/population.json` | `split_data.py` | the cohort record (labour, occupations), rates | the game's `body/build-body-data.py` (docs only) |

### Code

| Module | Depends on | Exposes |
|---|---|---|
| `web/src/alignment/state.ts` | thresholds, starts, gates, `institutions.initialSlots` | `AlignmentState { day, player, characters{location, pos, region, inParty, unlocked}, slots{sector, owner, developed, pos, region, pending}, supplied, slotTransformedAt, town, log }`; the `Command` union |
| `web/src/alignment/engine.ts` | charts, events, square, state, institutions, gates, conditions, town | `reduce(state, command, config)`: the one entry point; `UNRESOLVED[]` |
| `web/src/alignment/institutions.ts` | institutions.json, state, square | `develop` (requires the owner recruited and the ghost rule resolved), `markReturned`, `sleep` (a developed slot whose owner is in town adopts the owner's position; departed owners freeze) |
| `web/src/alignment/town.ts` | charts, engine config, state | `townPosition` = mean of developed slots with a position; `isPerfect` |
| `web/src/alignment/endings.ts` | town | position to one of nine ending ids |
| `web/src/alignment/sim/` | engine | scenario runner, reachability search, smoke tests |
| `web/src/world/map.ts` | nothing | `loadMap`, `tileAt`, `isSolid`, `boxFree`, `moveBody`, `atDockEdge`: pure tile logic, no notion of a place id |
| `web/src/world/DockScene.ts` | Phaser, dock.json, map.ts, fishing, camera, silhouettes | the one scene: player movement, fishing |
| `web/src/world/galleyStill.ts` | `@rex/realism` | the pattern for an adapter to a Toolchain engine |
| `web/package.json`, `web/vite.config.ts` | | `"@rex/realism": "file:../../../../Toolchain/realism"`; vite `fs.allow` includes the Toolchain path |

## 2. The edges that matter

```
TOWNS.md places --(reserve id)--> UPGRADES.md slots --(slot id)--> institutions.json --> institutions.ts
                                        |                                                      |
         art/TOWN_SHEETS.md <--(key)----+                   develop(slot) <-- recruit(owner) AND conditions.json supply
                                                                             |
                                                   sleep: slot.pos := owner.pos while owner.location == 'town'
                                                                             |
                                                  town.ts: port.align = mean(developed slots' pos) --> endings.ts (9)

GOODS.md s3c/s3h --(build)--> recipes.json.facilities.list (25 ids) --(per-settlement boolean, no reader yet)--> [Toolchain/economy, not built]
occupations.json (labels) --> skills.json ids             POPULATION.md cohorts.labour / occupations --> (no code)
dock.json --> map.ts --> DockScene.ts                      (no edge from any tile to any port.* id)
```

Facts the map makes explicit **(audit)**:

1. **The only coupling between "a place" and the alignment engine is a string.** `institutions.json` names a
   `port.*` id per slot; nothing else in code knows what a place is. A settlement engine can therefore sit beside
   the alignment engine and be joined to it by a binding table, without the alignment engine importing it.
2. **`developed` is a flag set by a command, not derived from anything physical.** `develop(slot)` is issued by
   the game when the story condition is met. A settlement engine's "physically developed" and "economically
   active" readings are new dimensions; they do not replace the flag unless Rex says (FACILITIES s8 item 4).
3. **Ownership in the alignment engine means "the character who shapes the institution"** (`slot.owner`), not
   legal title. The brief's rule (owner or manager changes never move alignment) is satisfied by never writing
   `slot.owner` from the settlement side.
4. **Facilities are a settlement-level boolean with no reader.** Moving equipment onto buildings changes no
   existing code path; it changes the *future* economy engine's check, which can be written as a derived query
   over buildings from the start (MIGRATION step 5).
5. **The map has no places.** `dock.json` is one scene. A continuous town map with districts and parcels is new
   data and a new loader layer; `map.ts` tile logic is reusable as is.
6. **The population model supplies counts, never names.** Its `labour` and `occupations` fields are exactly the
   pool a workforce system draws unnamed workers from; the fence (never a named fate) is Rex's and stays.
7. **`port.cash` exists as a key with no mover** (UPGRADES.md: "how it moves: open"). Wages, rents, sales and
   public works are candidate movers; which of them touch it is Rex's.
8. **Ghosts, death and transformation are a separate unresolved system** (UPGRADES.md; COMBAT.md s4e). The brief
   keeps property and economy independent of it: a title's `holder` can be any string, and succession is a host
   command, so whatever Rex decides there plugs in without changing records.

## 3. What is absent (the gap the engine fills)

| Need (from the brief) | Today | Closest existing hook |
|---|---|---|
| parcels, districts, a continuous map | one dock scene | `map.ts` tile logic; TOWNS.md place list; POPULATION s5 sizes |
| buildings with condition and persistent layouts | none (a slot's state is a story form) | art keys on `port.*` |
| titles, leases, sales, inheritance, transfers, a ledger | none; one owner per place, succession for two places (Rex) | `slot.owner` (not legal title) |
| construction and renovation projects | none | recipes' `equipment` vocabulary; GOODS skills for the trades |
| businesses, workforce posts, schedules, wages | none; occupations are labels | `occupations.json`, `skills.json` bands; POPULATION `labour` |
| production as `min(equipment, labour, materials, utilities)` | the recipe rule (knowledge + band + materials + equipment) as text | `recipes.json`; realism for utilities later |
| public works, municipal permissions, authority | none; `sec.townhall` is a story contest | `port.townhall`, `port.cash` |

## 4. Fixed points the engine must not move

- `port.*` and `sec.*` ids: story and institution references, never parcel or business ids **(Rex)**.
- `port.align` = mean of developed institutions' positions; `<slot>.align`, `<slot>.pending`; the overnight
  transformation; `ownerDeparted: freeze` **(Rex)**.
- `develop` requires the owner recruited and the story condition; recruiting alone develops nothing **(Rex)**.
- Ownership is not control; property ownership, business operation and management are separate; one legal owner,
  many tenants **(Rex, 2026-10-29)**.
- Residence, employment, management and crew membership are separate, non-exclusive assignments **(Rex, via the
  brief)**.
- The mayor is an office inside the town hall; `sec.townhall` stays **(Rex, via paste)**.
- One continuous, expandable map with districts and subdividable parcels; no fixed counts yet **(Rex, via paste)**.
- A brewery is an optional constructible facility **(Rex, via paste)**.
- No invented rules: every number in this folder is **proposed** until Rex sets it.
