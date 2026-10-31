# The platform audit (registry keeper, 2026-10-30)

**Status: approved with refinements (Rex, 2026-10-30).** Rex approved the engine organisation of §6 and the
roadmap's order; his refinements are recorded in `ENGINES.md` "The approved organisation" and in §6 below. The
moves of §3 remain **proposed** item by item: no disruptive migration starts until the affected keepers agree
ownership and acceptance tests. It records what exists against the seven domains, names what is missing, and
separates universal from pirate-specific. Nothing has moved, been deleted or been rewritten. Row ids refer to `registry/mechanisms.json`
(`REGISTRY.md`); DUP- and UNIT- ids to `GRAPH.md`.

## 1. The seven domains against what exists

Counts are authoritative mechanism rows (restatements excluded). "Universal" means usable with no game.

| Domain | Built | Doc-only | Planned | What exists | Verdict |
|---|---|---|---|---|---|
| **A. Physical reality** | 43 | 9 | 6 | realism: thermodynamics (heat flow, convection, NTU, boiling, condensation, evaporation), gases (ideal gas, room box model, grid transport, altitude, layering), chemistry (stoichiometric reactions, molar mass, combustion), environment (WBGT, diurnal curve, daylight, wind chill, cold water, exposure), conservation ledgers (mass, element atoms) | strong at the lumped-thermal and gas level; **no mechanics, optics, fluids, materials, structures, weather, geology, oceans or world energy ledger** |
| **B. Life and species** | 84 | 32 | 14 | realism: anatomy (assembly, organ function, damage/repair, crisis floors), circulation, physiology (energy, heat, water, sleep, circadian, acclimatisation), muscular (3CC, adaptation, Banister), nutrition (pools, absorption, energy store, starvation), neurology (PK, receptors, tolerance, circuits, sleep-wake), medicine (disease course, immunity, wounds, healing, pain); a horse by configuration | the most complete domain; **five double penalties** (DUP-13, 15, 16, 17, 19), energy as a daily stock not a flux, no reproduction, development, genetics, excretion or decomposition |
| **C. Cognition and interaction** | 3 | 18 | 1 | pirate only: alignment square and 16 MBTI response charts (code), STATS cognitive attributes, skills, rust, sliders, PSYCHOLOGY.md pushes | **nothing universal**; the alignment engine stays pirate (CTRL-7) |
| **D. Economy and production** | 34 | 3 | 7 | settlement: parcels, titles, leases, buildings and condition, construction projects, businesses and posts, capacity Q, wages and rent, ledger; economy: inventories, recipes, abstract markets, spoilage, consumption, shortage, price rule (`base`), trade, shipments, organisations, labour quote, accounts; the agreed contract | good skeleton; **recipes have no quantities (ECON-5), no material/energy balance, no price discovery or market clearing, no money supply, no households, no construction bill of materials** |
| **E. Government and institutions** | 5 | 0 | 1 | settlement offices and permissions, titles and transfer, right of use, expiry (records only) | **no authority, law, taxation (stub), enforcement, military, diplomacy, succession or legitimacy** |
| **F. Society and culture** | 12 | 2 | 1 | realism population.ts (cohort tick, epidemic, famine, labour, settler migration), economy organisations, settlement workforce assignment; town CULTURE.md as starting data | **demography only, and in the wrong engine** (DUP-41); no households, kinship, religion, norms, organisations as actors, transmission, collective action |
| **G. Civilisation and history** | 0 | 3 | 1 | pirate only: dated technology availability lists, anomaly plug, knowledge rule (GOODS 3f), region escalation | **nothing**; the pirate items are the §6 pattern to avoid in the universal sim |
| infra | 21 | 4 | 1 | realism kernel (World, Scheduler at 1 s, Trace, entity Registry, port Graph, library loader, RNG); settlement and economy reducers with replay and their own day ticks | **three kernels, six clocks, no shared one** (DUP-32, DUP-33) |

## 2. Missing foundational mechanisms, per domain

Ordered within each domain by what depends on it. "Planned" = already named in a keeper's plan; the rest are new
from this audit (proposed).

| Domain | Missing foundations |
|---|---|
| **infra** | one clock and event scheduler across timescales (ms to years), with declared process order (DUP-33); a shared kernel (ids, reducer/replay, seeded RNG streams per mechanism, units) (DUP-32); interfaces by registry id instead of prop names (UNIT-15); the resolution hand-off: aggregate ↔ individual with "finer refines, never contradicts" (§9; BODY §8 sim levels is the only sketch); trace compaction (REAL-10); the universal reference catalogue (§6); a units table (PHYSICS.md stub; UNIT-5, -9, -12) |
| **A** | rigid-body mechanics, gravity, friction, collisions (planned Phase 6); fluids: hydrostatics, buoyancy, drag, flow (Phase 7); optics: light, visibility, darkness (Phase 8); materials: deformation, fracture, corrosion, decay (Phase 9); **structural mechanics and construction** (loads, spans, lumber per wall, technique per wall type: domain A's own list, no plan); weather and climate generation (today only a pirate Markov chain, DUP-34); solar geometry and seasons; oceans, currents, tides, waves; hydrology (rivers, groundwater, rain catch); geology and soils (formation, erosion); a whole-world energy ledger; fire spread; acoustics (detection needs it); geography: terrain, distance and routes (transport needs it) |
| **B** | metabolism as flux: digestion → absorption → cellular energy → heat (Phase 10); excretion, waste, sanitation exposure, decomposition (Phase 11); genetics and ageing through organ capacity (Phase 12, DUP-17); reproduction, pregnancy, birth, growth and development; homeostasis loops (seven planned in circulation); electrolytes, glucose, acid-base; fever and the immune response; one functional-capacity combination rule (DUP-15); hunger, appetite, satiety; one sleep pressure (DUP-12); plants (crop growth physiology, linked to soil and water); pathogen ecology and transmission between bodies (vectors, contact networks); species configuration beyond human and horse |
| **C** | perception (from optics and acoustics); attention; memory; learning and skill acquisition (the universal form of STATS skill, rust and talent); needs and motivation; emotion and affect (stress, fear: PSYCHOLOGY.md's inputs); a personality-model slot with the eight-function model as one optional configuration (CTRL-7); beliefs and attribution (who is blamed: ENGINES.md); decision-making; communication and language; relationships and trust; seeded behavioural variability |
| **D** | recipes with quantities, yields, labour and energy per unit, and a mass balance (ECON-5, REAL-9); agriculture as production fed by crop growth (B) and soil (A); construction bills of materials from structural mechanics; price discovery and market clearing (CONTRACTS §9 promises it); money, currency, credit and a money-supply owner (DUP-43); households: income, budgets, consumption choices (§12.4); transport network, cost and time (TransportProvider is a stub); capital, investment, depreciation; property valuation (§12.3); labour skill and productivity from C; one labour unit (UNIT-11) |
| **E** | authority and legitimacy; law as data (rules, sanctions, enforcement probability); offices and their powers (settlement records holders only); taxation and public spending (publicWorks stub, DUP-42); property-rights regimes (feudal, communal, private: ENGINES.md says institutional structure, not culture); inheritance and succession law (SET-11); courts and policing; military organisation, recruitment, logistics; diplomacy and treaties |
| **F** | demography moved from Reality (births, deaths, ages, marriage; DUP-41); households and kinship; social networks; organisations as actors (families, guilds, churches, cults, factions, companies); religion and belief systems; norms and sanctions; cultural transmission (upbringing, peers); class and stratification; collective action and coordination (rebellion as "enough hungry, angry people with a way to coordinate"); migration decisions; cooperation and conflict between groups |
| **G** | settlement-hierarchy growth (hamlet → village → city) from the layers below; polity formation and territory; the technology pipeline (possibility → knowledge → invention → adoption → deployment, §6); knowledge diffusion through trade, migration and writing; international relations and the causes of war; collapse and transition dynamics; long-step aggregation for civilisation scale (§9); the historical-reconstruction harness (§5) |

## 3. Universal vs pirate-specific: what should move (proposed)

### 3a. Pirate-specific responsibilities living in the universal engines → the pirate plugin

| Responsibility | File today | Proposed home |
|---|---|---|
| Exposure terrain rows (below decks, galley, tavern, Guinea coast); Kingston climate; period climate; sun table | `Toolchain/realism/data/library/environment.json` (consumed by `src/environment.ts`) | plugin data passed in by the host; environment.ts keeps the mechanism |
| England/Jamaica/Miskito vital rates; settlers = prosperity × reputation; transients and ships in port | `realism/data/library/population.json`, `realism/src/population.ts` (`settlersPerDay`, the `reputation` input) | plugin data; the settler rule becomes a plugin adapter over Society's migration |
| Fishing-skill catch, cane and pease crops, turtle crawls and nesting beaches | `realism/src/ecology.ts` (`dailyCatch`), `realism/data/library/ecology.json` | plugin data; skill becomes a Cognition input |
| Ship's-time watch bands; nautical day start 12:00 | `realism/src/physiology.ts` (circadian), `physiology.json` | plugin config |
| Ship foods for haem iron (salt beef, boucan, tasajo, coast provisions) | `realism/src/nutrition.ts` `HAEM_FOODS` | food data (catalogue) |
| "Surgeon skill 50+ dressing daily" healing row; ship quarantine | `realism/data/library/medicine.json` | plugin; the period treatments themselves are historical data for the catalogue |
| STATS 1–20 limb strength; game attributes (Endurance, Wits, Strength) named inside hydration, bleeding and aerobic rows | `realism/src/muscular.ts` `limb_strength`, `physiology.json`, `circulation.json` | the pirate stats adapter (`web/src/world/adapters/stats.ts`) |
| "No silent death" design policy | `realism/src/crisis.ts` | plugin policy; the crisis record stays universal |
| Galley still scenario; "Caribbean day" default | `realism/src/lab/still.ts`, `src/world.ts` | an example, labelled as such |
| Operator skill 0–100, thermometer drift | `realism/src/process.ts` | mixed: keep; skill becomes a Cognition input |
| Crisis floors cited to the pirate ANATOMY.md §3a; formulas cited to ENGINE.md, GAS_DYNAMICS.md | realism code citing `files/pirate-ship/body/`, `science/`, `world/` | move the statements into realism gear files (§8); docs point back |
| `port.*` questions (Q1–Q11), `port.cash` treasury | `Toolchain/settlement/QUESTIONS.md`, CONTRACTS §12.2 | pirate configuration questions; can stay where they are, labelled plugin |
| 1690–1720 Caribbean wage research; King-Davenant | `Toolchain/economy/RESEARCH.md` | historical datasets (catalogue), not engine rules |
| `pool.` prefix, `labourer` role, `pool.default`; `ship.*` meaning shipment | `settlement/src/tick/projects.ts`, economy ids | minor conventions; rename `ship.*` → `shipment.*` when convenient (proposed) |

### 3b. Universal responsibilities living only in the pirate repo → the engines

| Responsibility | File today | Proposed home |
|---|---|---|
| Daily weather (Markov chain, replays from day 1) | `web/src/world/adapters/places.ts`, `world/ENVIRONMENT.md` §2 | Reality (physical): weather and climate |
| Ocean currents, wind and point of sail, hurricane approach | `world/ENVIRONMENT.md` §3–4 | Reality (physical): fluids, oceans |
| The capability core: wound dip, cold, hydration, blood, glycogen and fever factors; one combination rule | `body/BODY.md` §2–3, `web/src/world/adapters/stats.ts` `capabilityToday`, `adapters/medicine.ts` `dipFactor` | Reality (life): `capacity.functional` (DUP-15); STATS scaling stays pirate |
| Simulation levels (aggregate, discovered) | `body/BODY.md` §8 | kernel: resolution hand-off |
| Overnight tick order | `body/BODY.md` §4 | kernel: the scheduler |
| Hunger and appetite, seasickness, ageing curves, whole-body Banister, hygiene multipliers, sleep-quality weights | `body/NUTRITION.md` §4, `PHYSIOLOGY.md` §2, §8, §9, `MEDICINE.md` §6 | Reality (life) |
| Population cohorts, vital-rate structure, recruit pool structure | `world/POPULATION.md` | Society (the recruit pool stays pirate) |
| Discovery states, knowledge rule, chemical possibility (free energy), assembly pipeline, "unknown" rule | `science/DISCOVERY.md`, `economy/GOODS.md` §3f, `science/CHEMISTRY.md`, `science/SCIENTIFIC_EQUIPMENT.md` | Knowledge & Technology; chemical possibility to Reality (chemistry) |
| Goods recipes and classes | `economy/GOODS.md` | Economy data, tagged by the catalogue |
| Technology availability by date (101 common / 83 rare / 128 none for 1650–1730) | `science/TECHNOLOGY.md`, `SCIENTIFIC_EQUIPMENT.md` | the catalogue as reference tags (dates never unlock); the plugin may still select by them |
| Crop table (yield, labour per hectare) | `world/ECOLOGY.md` §2 | Reality (life: crops) + Economy (agriculture) |
| Detection by sight and sound | `combat/COMBAT.md` §6 | Reality optics and acoustics + Cognition perception |
| Stress, fear, morale as inputs | `body/PSYCHOLOGY.md` | Cognition (the meters stay pirate) |
| Cognitive capacities (Wits, Memory, Perception, Pattern Recognition, Intuition, Spatial Reasoning, Nerve) | `STATS.md` §1 | Cognition as capacities; the 1–20 scale stays pirate |

### 3c. Stays in the pirate plugin (no move)

The alignment engine, gates, conditions, institution transforms, endings, perfect towns, the ghost rule and fates
(`web/src/alignment/`, `balance/`, `town/`); the 16 response charts; STATS scale, Poise, Efficiency, sliders, hearts,
claims, rust as gameplay; skill bands and region escalation (`GOODS.md` §3c, `REGIONS.md` §5, `COMBAT.md` §5);
combat rules (reading Reality, CMB-11); story, factions, bestiary content, town, art; the technology anomaly plug and
the hurricane period factor as plugin configuration.

## 4. PLATFORM.md §6 conflicts (date- or level-gated)

All four live in the pirate plugin. They are legitimate as **game configuration** (§6: "a pirate game asks for the
Caribbean, 1690–1720"), never as universal rules, and the universal sim must not read them.

| Item | File | Note |
|---|---|---|
| Hurricane weight ×0.25 before 1715, ×0.6 after | `web/src/world/adapters/places.ts` `weightOf(year)` (regex over table prose) | climate data keyed by period: acceptable as data; the regex makes prose load-bearing |
| Technology common / rare / none for 1650–1730; 13 items "none (anomaly)" | `science/TECHNOLOGY.md`, `SCIENTIFIC_EQUIPMENT.md` | the catalogue tags these; the anomaly plug exists only because availability is a list |
| Skill bands gate recipes and techniques | `economy/GOODS.md` §3c/§3f, `combat/COMBAT.md` §5 | gameplay; the universal sim needs knowledge and skill from Cognition instead |
| Level cap rises per region, best technology last | `economy/REGIONS.md` §5 | gameplay progression |

## 5. Value-label systems (open)

Three labelling systems are not reconciled: researched / estimate / fiction (ENGINES.md), the six evidence levels
(PLATFORM.md §4), and the library's `[science] [history] [model] [fiction]` marks. Proposed: every value keeps one
of the three labels (it says where the number came from) and every mechanism carries one evidence level (it says
how good the relationship is); the library marks map onto levels (science → 1–2, history → 3, model → 4–5,
fiction → 6). REAL-12 (may an `estimate` drive a process?) is Rex's.

## 6. The engine organisation (proposed)

### What the audit shows

- **Reality & Species** carries two domains (A and B) in one package, 239 tests and seven planned phases. Its
  life side is mature; its physical side is about to grow (mechanics, fluids, optics, materials). The two meet at
  one interface: a body is a component in the physical world.
- **Settlement and Economy** have a clean, agreed boundary (land, property and capacity vs flows, prices and
  trade). Their duplicates (DUP-27 to DUP-31) are contract hygiene, not a reason to merge. Settlement's titles,
  inheritance and offices are records whose rules belong to Government.
- **Population** sits in Reality and belongs to Society (DUP-41, CTRL-5).
- **Infrastructure is triplicated** and there is no clock (DUP-32, DUP-33). This blocks every cross-engine
  mechanism more than any missing domain does.
- **Nobody owns** the catalogue, culture and organisations, technology emergence, or the benchmark.

### The proposal (approved by Rex 2026-10-30, with the refinements below)

Rex's refinements on approval (2026-10-30; `ENGINES.md` is the authoritative record and uses his engine names:
Kernel, Physical Reality, Life & Species, Catalogue, Settlement, Economy, Society, Cognition, Government,
Knowledge & Technology, History):

- **Kernel is infrastructure only:** time and scheduling, event ordering and causality, stable ids, units and
  dimensional validation, seeded RNG, snapshots and replay, cross-engine transaction boundaries. It never owns a
  scientific or economic formula.
- **Reality splits** into Physical Reality and Life & Species when mechanics makes it necessary (the row below).
- **Weather and climate** are a major Physical Reality subsystem generated from physics (solar heating, pressure
  gradients, humidity, instability, ocean evaporation, terrain, circulation, surface water), never drawn from a
  table. Climate = a region's statistics and boundary conditions; weather = the atmospheric state over time.
- **History** is a thin composition and validation layer: it describes what happened in the simulation and never
  determines what must happen.
- **Dependency-based parallelism (A)** and **authority, not every calculation (B)**: see ROADMAP.md.

| Engine | Domain | Action | Why |
|---|---|---|---|
| **Kernel** (new) | infra | **add first** | one clock and event scheduler, ids, reducer/replay, seeded RNG, units, interfaces by registry id, resolution hand-off. Every other engine adopts it; nothing else integrates without it |
| **Catalogue** (new) | infra / G | **add** | the §6 reference catalogue: tags entities, substances, organisms, technologies, institutions, practices with dates, regions and provenance; never unlocks. Serves plugin configuration and the benchmark's starting conditions |
| **Reality & Species** | A + B | **keep, split later**: two packages in the same repo when Phase 6 starts — `physical` (A) and `life` (B) — on one shared kernel, with the body-in-world interface written first. Ecology (stocks, soil, crops) stays in `life` | avoids one owner for two domains as A grows; no files move until then |
| **Settlement** | D (land, property, buildings) | **keep**; hand the *rules* of offices, titles and inheritance to Government by contract, keep the records | §7 one owner per mechanism; Settlement ↔ Government contract is already listed as "to agree before code" |
| **Economy** | D | **keep** | contract agreed; owns production, prices, money, trade, households' consumption |
| **Society** (new) | F | **add**: demography from Reality (Reality keeps biological reproduction, ageing, mortality), households, kinship, organisations, religion, norms, transmission, collective action, migration | ENGINES.md already reserves it; population needs a home before the benchmark |
| **Cognition** (new) | C | **add** as ENGINES.md plans; eight-function model as one optional configuration | individuals' decisions drive everything in E, F, G |
| **Government** (new) | E | **add** as ENGINES.md plans | taxation, law, authority, military, diplomacy |
| **Knowledge & Technology** (new) | G (part) | **add**: the possibility → knowledge → invention → adoption → deployment pipeline and knowledge diffusion | §6 makes technology emergent; it reads Reality (feasibility), Economy (capability), Society and Cognition (transmission, experimentation) and must have one owner |
| **History** (new, late) | G | **add last**: long-step aggregation of polities, territory, international relations, collapse; and the reconstruction harness | it composes the others and must not duplicate them; a thin layer, not a second economy or government |
| **Pirate plugin** | — | **keep**, with the moves of §3 | Rex: parked on the back end, interfaces only |

Considered and not proposed: merging Settlement into Economy (the boundary is clean and contract-backed);
one big Society engine containing Economy and Government (ENGINES.md rules it out); splitting Reality now (it
would interrupt a working keeper for no present gain).

Ownership of the new engines follows PLATFORM.md §11: an Opus keeper per engine for design, belt units for
building. The registry keeper keeps the registry and re-audits after each roadmap phase.
