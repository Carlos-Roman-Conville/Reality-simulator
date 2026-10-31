# The platform roadmap (registry keeper, 2026-10-30)

**Status: approved with refinements (Rex, 2026-10-30).** The P0–P11 order is approved (`ENGINES.md` "The approved
organisation"; PLATFORM.md log). Each phase names its owning engine (`AUDIT.md` §6), its acceptance test, and how
the work is run (§11): **keeper** = needs an Opus keeper's design judgement; **belt** = units on the conveyor
belt (Codex for engine logic, Composer for data, tests and UI, Sonnet for platform work, Haiku for checks).
Nothing existing is deleted; the pirate content is preserved and parked (PLATFORM.md §1, §10).

## Rex's refinements (2026-10-30)

- **(A) Dependency-based parallelism.** A phase, or a part of one, starts when what it *reads from* is ready, never
  because "the previous phase finished". Ready means: for research and data work, the ids and contracts it will
  use exist; for building, the mechanisms it reads are built and pass their acceptance tests. Named cases:
  **Catalogue research may run beside P2** once Kernel ids and the catalogue contract exist; **Government
  architecture may be researched during P6–P7** and built after them. The diagram below shows read-dependencies,
  not a queue.
- **(B) Authority, not every calculation.** P1 removes duplicate *authority*. A detailed and an aggregate
  computation may coexist (per-muscle and whole-body fatigue; individual and population mortality) when one owner
  holds the state and the aggregation interface is documented. Each overlap group carries an `authority` class
  (`registry/graph.json`, GRAPH.md §2): duplicate-authority, aggregation, mixed, ownership-gap, shared-part.
- **Kernel fence.** The Kernel is infrastructure only (time and scheduling, event ordering and causality, ids,
  units and dimensional validation, seeded RNG, snapshots, replay, cross-engine transaction boundaries). It never
  owns a scientific or economic formula.
- **Weather and climate** are a major P2 subsystem generated from physics, never drawn from a table. Climate = a
  region's statistics and boundary conditions; weather = the atmospheric state over time.
- **History** is a thin composition and validation layer; it never determines what must happen.
- **No disruptive migration** starts until the affected keepers agree ownership and acceptance tests; overlap
  owners go to Rex in batches (`OVERLAPS-BATCH-1.md` first).
- **Success measures:** each major subsystem proves itself with an executable demonstration; P11 weighs historical
  reconstruction and generative plausibility equally, and compares the platform with simpler cliodynamic models.
- **Resolution of the biology:** three records per organism (genetic profile, cellular and developmental state,
  organism state); a character sheet is a view, never a second source of numbers (P3).
- **The benchmark structure is provisional** (P11): periods, weights and the 70 % stay provisional until data
  coverage and the eleven indicators are audited.

Two rules apply to every phase:

- **Registry first.** A phase's first unit writes its mechanisms' rows (`registry/mechanisms.json`, the §7 contract)
  and searches for equivalents; its last unit updates the rows to built, and the registry keeper re-audits.
  **Every belt unit's Gate carries its validation specification** (PLATFORM.md §11a): the sources and model;
  verification tests (the mathematics as stated); validation data with its tolerance where independent data
  exists, or the experiment that would test it where none does; numerical stability, conservation and
  boundary-condition tests; and integration tests with every mechanism it reads or feeds. The unit fills the row's
  `vv` record. Its state then moves **implemented** → **integrated** → **validated**, never conflated: a unit
  passing its own tests is implemented only. Validation needs independent reference data, a competing model where
  one exists, the registry keeper's re-audit, and Haiku check units that did not write the code.
- **Historical first, labelled.** Every value is researched / estimate / fiction; every mechanism carries an
  evidence level (AUDIT.md §5).

## The read-dependencies at a glance

Arrows are "reads from" (refinement A). Research and data tracks start as soon as their ids and contracts exist:
Catalogue research beside P2; Government architecture research during P6–P7; Kernel planning now.

```
P0 Kernel ──► P1 Overlap closure ──┬─► R-CELL audit ─► (P3's cellular layer)
                                   ├─► P2 Physical foundations ─┐
                                   ├─► P3 Life completion ──────┼─► P5 Grounded economy ─┐
                                   └─► P4 Catalogue v1 ─────────┘                        │
                                    P2,P3 ─► P7 Cognition ───────────────────────────────┤
                                    P3,P5 ─► P6 Society ─────────────────────────────────┤
                                              P5,P6,P7 ─► P8 Government ─────────────────┤
                                                 P2–P7 ─► P9 Knowledge & Technology ─────┤
                                                         P5–P9 ─► P10 History ───────────┴─► P11 Reconstruction benchmark
Plugin track (after P1, in parallel): PL, the pirate plugin re-seated on the interfaces
Research tracks: P4 Catalogue research ║ P2 (needs P0 ids + the catalogue contract); P8 Government architecture ║ P6–P7
```

## Phases

| Phase | Owner (engine) | Contents | Acceptance test | Run as |
|---|---|---|---|---|
| **P0 Kernel** | Kernel (new; infrastructure only, never a formula) | one clock and event scheduler across timescales with declared process order and causality (DUP-33); stable ids; reducer and replay; snapshots; seeded RNG streams per mechanism (DUP-32); units and dimensional validation (UNIT-5, -9, -12); interfaces keyed by registry id (UNIT-15); cross-engine transaction boundaries (a day's settlement → economy step commits or rolls back as one); trace compaction (REAL-10); a registry check script | (1) one run drives realism at 1 s and settlement + economy daily from one clock for 30 simulated days; (2) the same inputs and seed replay byte-identical from any snapshot, and a different seed differs only in stochastic mechanisms; (3) a dimensional error (kcal passed where W is declared) fails at the interface; (4) the check script fails when a mechanism writes an output with no registry row, or two rows own one output; (5) the fence: the kernel package imports no engine and owns no registry row of a domain A–G; (6) no silent change (Rex): under equivalent initial conditions the thirty-day settlement simulation gives the same outputs after adoption as before, unless a correction is documented | keeper (Kernel keeper, starting now); belt: Codex (scheduler, kernel), Sonnet (check script), Haiku (checks) |
| **P1 Overlap closure** | each current owner; the registry keeper tracks | removes duplicate **authority** (refinement B): Rex approves an owner per DUP group, batch by batch (`OVERLAPS-BATCH-1.md`); duplicate-authority homes become reads or restatements; aggregation homes stay, with one state owner and a documented aggregation interface; fix the wiring faults (UNIT-1 `blood_lost_ml`/`_l`, UNIT-15 neurology inputs, UNIT-2 RH); one combination rule for functional capacity (DUP-15); one cause-of-death ledger (DUP-19); move the universal formulas out of the pirate docs into realism gear files (§8); each migration only after the affected keepers agree | (1) for each closed duplicate-authority group, a test that the cause changes one state and every effect reads it (e.g. 6 % dehydration lowers work capacity once; vitamin C depletion reaches healing only through collagen); (2) for each aggregation group, a test that the aggregate equals the mean of the detailed computation within a stated tolerance over the same inputs; (3) every death in a 30-day run has one recorded cause; (4) GRAPH.md shows no open duplicate-authority group in a closed batch | keeper (Reality, Settlement, Economy, each for its groups); belt: Codex units per group, Haiku checks |
| **P2 Physical foundations** | Physical Reality (inside `realism/` until the split) | mechanics, gravity, friction, collisions (Phase 6); fluids, buoyancy, drag (7); optics, visibility (8); materials: deformation, fracture, corrosion, decay (9); structural mechanics and construction techniques per wall and roof type; **weather and climate, a major subsystem generated from physics** (below); oceans and currents; hydrology and surface water; soils; geography, terrain and routes; a world energy ledger; acoustics | (1) a human standing one minute and a falling body conserve energy within 0.1 %; (2) a timber beam's deflection matches Euler–Bernoulli within 5 % and a wall fails at its tabulated load; (3) a hull floats at its Archimedes draught; (4) the weather tests below; (5) visibility falls with illuminance as the source curve | keeper (Reality; the split decision when mechanics makes it necessary); belt: Codex (mechanisms), Composer (material and station data, tests) |
| **R-CELL Cellular ownership audit** | registry keeper, with the Reality keeper | after P0 and P1, before P3's cellular work (Rex): audit metabolism, muscle adaptation, medicine, genetics and organ ageing (DUP-17 among them) for what moves under cellular ownership; record each move as a proposed overlap group | every current mechanism that reads or writes a cell-level quantity has a proposed cellular owner or a recorded reason to stay; Rex approves the moves | keeper (registry + Reality); Haiku checks |
| **P3 Life completion** | Life & Species (inside `realism/` until the split) | **cellular biology** (below; `CELLULAR.md`), the foundation of the rest; metabolism as flux (10); excretion, sanitation exposure, decomposition (11); genes and ageing through organ capacity (12, DUP-17); reproduction, pregnancy, growth and development; homeostasis loops; fever; hunger and appetite; one sleep pressure (DUP-12); crops as plants (growth from soil, water, light); pathogen transmission between bodies | (1) food in = tissue + heat + CO₂ + water + faeces + urine, mass balanced within 1 % over a week; (2) 1,000 simulated lives from birth reproduce the shape of a source life table (survival at 1, 5, 20, 50, 70 within 15 %); (3) a crop's yield responds to rain and soil as in the source trials; (4) no ageing effect exists outside organ capacity, and organ capacity declines only through cellular states (no timer); (5) cellular: two simulated people of the same age with different histories (exposure, nutrition, training) differ in organ capacity in the documented direction | keeper (Reality); belt: Codex, Composer (data), Haiku |
| **P4 Catalogue v1** | Catalogue (new); research may run beside P2 once P0 ids and the catalogue contract exist (A) | the §6 schema; first content: substances, materials, crops, livestock, foods, tools and technologies, institutions and practices for the four benchmark regions and the pirate window; provenance classes; the pirate TECHNOLOGY.md lists as tags | (1) "Caribbean, 1690–1720" and "England, 1270" each return a starting-conditions bundle with every value labelled and sourced; (2) a test proves no mechanism reads a catalogue date as a gate | keeper (schema); belt: Composer (rows), Haiku (source and label checks) |
| **P5 Grounded economy** | Economy, Settlement | recipes with quantities, yields, labour and energy, mass-balanced (ECON-5); agriculture fed by P3 crops; construction bills of materials from P2 structures; households (income, budget, consumption; CONTRACTS §12.4); price discovery and market clearing (CONTRACTS §9); money, credit and a money-supply owner (DUP-43); property valuation (§12.3); transport over P2 geography; one labour unit (UNIT-11) | (1) a 30-day settlement conserves mass by element, and money except declared mints; (2) a harvest failure raises the grain price and lowers consumption with no price script; (3) a house's materials and labour come from its walls and roof, not a list; (4) staple prices over a simulated decade fall within the documented range for the reference region | keeper (Economy; Settlement for its side); belt: Codex, Composer (recipes from GOODS.md), Haiku |
| **P6 Society** | Society (new) | demography from Reality (DUP-41; Reality keeps biological reproduction, ageing, mortality); households, marriage, kinship, inheritance customs; organisations as actors; religion and belief; norms and sanctions; cultural transmission; class; migration decisions; collective action | (1) a village of 500 run 100 years keeps its age structure within 15 % of the source population; (2) migration follows a wage or food differential with the documented sign; (3) collective action arises from individual states (hungry, angry, connected), never from a meter | keeper (a new Society keeper); belt: Codex, Composer |
| **P7 Cognition** | Cognition (new) | perception (P2 optics, acoustics), attention, memory, learning and skill (the universal form of STATS skill, rust and talent), needs, emotion, decisions, attribution, communication, relationships; the personality-model slot with the eight-function model as one configuration (CTRL-7) | (1) the bar simulator (ENGINES.md) runs headless and deterministically with a seed; (2) skill gain follows the power law of practice and decays without use as its source says; (3) swapping the personality model changes behaviour without touching any other engine | keeper (a new Cognition keeper; design-heavy); belt: Codex |
| **P8 Government** | Government (new); architecture research may run during P6–P7, building after them (A) | authority and legitimacy; law as data; offices' powers (Settlement keeps the records); taxation and spending (the publicWorks stub, DUP-42); property-rights regimes; succession; courts and policing; military organisation; diplomacy | (1) a tax reaches households only through Economy's ledger; (2) a contested succession arises from the rules and the claimants, never a script; (3) the same society under two property regimes diverges as the sources describe (e.g. enclosure) | keeper (a new Government keeper); belt: Codex, Composer (institutional data) |
| **P9 Knowledge & Technology** | Knowledge & Technology (new) | possibility (P2/P3 feasibility), knowledge, invention, adoption and deployment as separate states; diffusion through trade, migration and writing; experimentation | (1) a society with no ore never deploys iron tools; one with ore, fuel, skill and contact adopts them, earlier than history if it can; (2) adoption follows an S-curve whose speed depends on contact and incentive | keeper (new); belt: Codex, Composer (catalogue links) |
| **P10 History** | History (new; a thin composition and validation layer, never scripted outcomes) | the Seshat Global History Databank as a data source (labelled values); long-step aggregation of settlements and polities; territory; international relations and the causes of war; collapse and transition; the resolution hand-off at civilisation scale (§9) | (1) the same village run individually and aggregated agrees within 10 % on population, output and deaths over 50 years; (2) a polity forms, expands or fragments from its conditions in seeded runs, with outcomes differing across seeds | keeper (new); belt: Codex |
| **P11 Evaluation** | History (the harness); every engine | P11a historical reconstruction (§5), P11b generative plausibility, P11c comparison with a structural-demographic baseline on uncalibrated cases (below) | below: a and b of equal weight, each required | keeper (History, with the registry keeper for investigations); belt: Composer (datasets, Seshat extracts), Sonnet (harness), Haiku |
| **PL Pirate plugin** | the pirate keepers | re-seat the plugin on the interfaces: the moves of AUDIT.md §3; STATS and combat read the capacity core; weather and climate from Reality; alignment untouched | the plugin's 387 web tests and 178 alignment tests still pass; the plugin defines no universal rule (a check over its imports) | belt mostly (Sonnet, Codex); keepers only for design questions |

A partial benchmark run (H1 England, demography and economy only) is worth doing after P6 to find missing
mechanisms early; it is diagnostic, never a pass.

### Executable demonstrations (Rex, 2026-10-30)

Each major subsystem also proves itself with an **executable demonstration**: a headless, seeded run anyone can
start, whose output shows the mechanisms working together. It is part of the phase's acceptance, beside the tests
above, and it never uses a pirate slice. Every demonstration records its seed, writes its trace, and passes the
P0 conservation checks.

| Phase | Demonstration | What it must show |
|---|---|---|
| P2 | **two fighters exchanging physically resolved actions** | blows, grapples and falls resolved by mechanics (mass, momentum, contact, friction) and their injuries by Life & Species; no hit points, no to-hit table |
| P3 | **an organism ageing under different conditions** | the same genetic profile raised under different nutrition, work, exposure and disease histories ages differently; ageing emerges from cellular states, never a timer |
| P5 | **a settlement answering a harvest failure** | a poor harvest propagates through stocks, prices, consumption, labour and migration pressure, with no scripted response |
| P6 | **a population forming competing organisations** | households and individuals form guilds, congregations or factions that compete for members and resources |
| P8 | **an institution gaining or losing legitimacy** | legitimacy rises or falls from what the institution does and what people experience (taxes, justice, protection, famine), never a meter |
| P10 | **several societies developing and interacting over centuries** | trade, migration, war and diffusion between societies, from their conditions, with different outcomes across seeds |

Where the science is missing (cognition, cultural change, institutional emergence, ageing rates), the phase holds
**explicit hypotheses** as evidence-level-5 rows in the registry and its demonstration tests their consequences;
more mechanisms never mean more accuracy by themselves (Rex).

### P2 in detail: weather and climate generated from physics (Rex, 2026-10-30)

Climate is a region's statistics and boundary conditions; weather is the atmospheric state over time. The weather
is computed, never drawn from a table; climate statistics are an *output* to compare against records, never an
input the weather copies. Today's pirate daily Markov chain (`web/src/world/adapters/places.ts`, DUP-34) keeps
serving the plugin until this subsystem replaces it there; it is never promoted into the engine.

| Part | Mechanism (each its own gear file, §8) | Reads |
|---|---|---|
| Boundary conditions | latitude, terrain and elevation, land/sea mask, surface type, sea-surface temperature field, orbital insolation by day of year | Catalogue (geography), P2 geography |
| Radiation | solar geometry, shortwave absorbed by surface and air, longwave emission, cloud and humidity effects | optics (Phase 8), thermodynamics |
| Surface energy and water | sensible and latent heat flux, ocean and land evaporation, soil moisture, snow, surface water | thermodynamics, hydrology, soils |
| Atmosphere dynamics | pressure gradients, wind (geostrophic plus surface friction), advection of heat and moisture, a coarse circulation suited to the run's resolution (§9) | fluids (Phase 7), the gas mechanisms already built |
| Moisture and instability | saturation (DUP-2's one vapour-pressure formula), lapse rates, convection, cloud, precipitation, orographic lift | thermodynamics |
| Storms | tropical cyclones and frontal storms emerging from instability, sea-surface temperature and shear | the above |
| Local climate | the existing WBGT, diurnal curve, daylight and exposure mechanisms read the weather state instead of fixed tables | `realism/src/environment.ts` |

Weather acceptance tests (proposed; Rex 2026-10-30: monthly normals are necessary, not sufficient):

1. **No table:** a check that no weather mechanism reads observed climate values as its output (boundary conditions
   only).
2. **Distributions, not only means.** Driven only by boundary conditions, ≥ 30 simulated years at each validation
   station match, each against **independent observations** (stations and periods never used to develop or tune
   the generator), with a **tolerance set per variable** from the observed inter-annual spread and measurement
   error, never one universal 10 %:

   | Variable | Measure compared | Tolerance basis (per variable) |
   |---|---|---|
   | Monthly normals | mean temperature, precipitation total per month | inter-annual standard deviation of the observed monthly values |
   | Rainfall frequency | wet-day fraction per month; wet-day intensity distribution | sampling error of the observed fractions; quantile spread |
   | Dry-spell duration | distribution of consecutive dry days (median, 90th percentile, longest per year) | bootstrap interval of the observed distribution |
   | Temperature variability | daily mean, daily range, day-to-day change; their standard deviations and extremes | observed spread by season |
   | Wind distributions | speed distribution (e.g. Weibull fit) and direction rose per season | sampling error of the observed fit and rose |
   | Seasonal patterns | phase and amplitude of the annual cycle; onset and end of the wet season | observed year-to-year range of onset dates |
   | Extreme-event frequency | return levels of heavy rain, heat, cold, high wind; storm counts per season | confidence interval of the observed return levels |

   A two-sample test per variable (e.g. Kolmogorov–Smirnov for distributions) at a stated significance, reported
   variable by variable; the generator passes when every variable passes, never on an average.
3. **Conservation:** domain radiation, evaporation and precipitation balance within 1 % per simulated year.
4. **Response:** changing one boundary condition (sea-surface temperature +1 °C) moves the outputs in the documented
   direction.
5. **Storms emerge:** they occur with a seasonality and frequency inside the observed range for the region (row
   "extreme-event frequency"), never scheduled.

The tolerances and the choice of validation stations are set by the Physical Reality keeper after auditing the
coverage of observational data; they are recorded with their sources before any run is scored.

### P2 in detail: Contact and Impact Mechanics (Rex, 2026-10-30)

A Physical Reality subsystem. The Reality keeper holds the full brief. It provides:
- articulated-limb geometry;
- continuous collision detection (swept volumes between steps);
- per-point blade velocity and effective mass;
- impact impulse and energy;
- simplified penetration against a material resistance profile (skin, fat, muscle and bone; cloth, leather and mail).

It emits one **contact event** per contact: position, relative velocity, direction, duration, impulse and the
penetration result (quantity `world.contact_event`, a record). Three consumers read it:
- anatomy and medicine make the wound (IF-3);
- materials damage objects and armour;
- the pirate combat plugin takes hit location and impact from it (IF-4). This supersedes the plugin's regional dip
  as the source of hit location (DUP-36, DUP-37).

**Wound depth is reported with its uncertainty.** The registry holds the subsystem as planned rows
`realism.contact.*`.

Validation scenarios (the contact event's validation plan, part of the P2 fighters demonstration):

| Id | Scenario | What must hold |
|---|---|---|
| V-C1 | blade position | the same cut delivers a different impulse and depth by where on the blade it strikes |
| V-C2 | punch angle | the same punch delivers a different impulse by its angle of incidence |
| V-C3 | grazing hit on a moving defender | relative velocity and contact duration, not the attacker's swing alone, set the impulse; a defender moving away receives less |

Penetration depth is checked against published penetration or ballistic-gelatin data where any exists. Where none
does, it is labelled unvalidated.

### P3 in detail: cellular biology (Rex, 2026-10-30)

A foundational layer of Life & Species between chemistry and tissues (`CELLULAR.md`; not a top-level engine): ATP
production and use (a flux, never a stored pool), DNA damage and repair, telomeres, senescence, mitochondrial
function, proteostasis, stem-cell populations, epigenetic regulation, inflammation and immune signalling, cell
death and replacement. It is modelled as **cell populations with representative states** (size, capacity, energy,
damage, repair, senescent fraction, turnover), never individual cells; resolution is raised locally for an
experiment. **Ageing is an emergent output**, never a timer on organ performance. The layer underlies muscle growth,
nutrition, disease, wound healing, cancer, toxicology and reproduction, and gives other species their own turnover
and regeneration by parameters. Established cellular processes are labelled apart from simplified or experimental
ageing models (evidence levels, PLATFORM.md §4). The registry holds it as 12 planned rows `realism.cellular.*`.
It starts after P0, P1 and the R-CELL audit.

**Resolution of the biology (Rex, 2026-10-30).** Cells and DNA are compact mathematical representations that
preserve their causal effects, never their real form. Each organism has three separate records:

1. a **genetic profile**: chromosome segments carrying trait-associated variants (linkage, polygenic effects,
   dominance, interactions), never independent trait sliders or an average of the parents;
2. a **cellular and developmental state** per representative tissue population: repair capacity, accumulated
   damage `D(t+1) = D(t) + damage − repair`, regeneration, adaptation;
3. the **organism state**: anatomy, organs, muscles, nutrients, immunity, capabilities.

A character sheet is a view of these records, never a second source of numbers (interface IF-2). A trait such as
muscle growth is `ΔM = f(G, T, N, H, R)` (genetics, training stimulus, nutrition, hormones and development,
recovery): nobody inherits a Strength score. Genetics in P3: recombination, inheritance, mutation and expression
responses (planned rows `realism.genetics.*`, `realism.records.*`, `realism.development.trait_change`). Named
characters get tissue-level detail; distant populations carry aggregate genetic and health distributions
(refinement B).

P3 acceptance adds: (6) a child's genetic profile is a recombination of its parents' segments, and trait
correlations between relatives fall within documented heritability ranges for the traits modelled; (7) muscle
growth under the same training differs by genetic profile, nutrition and recovery as `ΔM = f(G, T, N, H, R)`.

## P11: evaluation, two halves of equal weight (Rex, 2026-10-30)

The platform is a **generative** model of reality, not only a predictive one. P11 evaluates two things of equal
weight, each reported on its own and each required:

- **P11a, historical reconstruction:** does the engine reproduce observed patterns from documented starting
  conditions? (The benchmark below, PLATFORM.md §5.)
- **P11b, generative plausibility:** do new societies, along histories that never happened, obey physical,
  biological, economic and social constraints and emerge through coherent mechanisms? (Its indicators follow the
  benchmark.)
- **P11c, comparison with simpler models:** the platform against simpler cliodynamic models on cases neither was
  calibrated on.

## P11a: the historical-reconstruction benchmark (PLATFORM.md §5)

**Approved provisionally (Rex, 2026-10-30):** the structure (H1 and H2 for development, H3 and H4 held out,
Iceland in reserve). The periods, the weights and the 70 % target stay provisional until data coverage and the
eleven indicators are audited; that audit is the first unit of P11 and may run as research once P4's catalogue
contract exists (refinement A).

### The four first targets

Chosen so outcomes differ as much as possible (collapse, abandonment, long stability, shocks and regime change)
and environments differ (sub-Arctic pastoral, tropical forest maize, temperate mixed farming, island rice).
Two are **development** societies (used while building mechanisms) and two are **held-out validation**
societies (never used for tuning), per §5's rule. A fifth, Iceland, is a reserve control for Greenland.

| # | Society, window | Outcome to reproduce (never forced) | Role | Why it tests the platform |
|---|---|---|---|---|
| H1 | England, 1270–1700 | Malthusian ceiling, Black Death (−40–50 %), wage rise, enclosure, civil war 1642–51, a republic 1649–60, restoration | development | best-documented pre-industrial economy: annual series for population, wages, prices, output; tests demography, economy, government and conflict together |
| H2 | Tokugawa Japan, 1600–1868 | long internal peace, population plateau (~26–32 M) after 1720, closed trade, proto-industry, no war for 250 years | development | stability as an outcome (a sim that only makes wars fails it); household registers give demography; rice tax gives the fiscal state |
| H3 | Norse Greenland, 985–c.1450 | settlement, peak (~2,000–3,000 people), diet shift to marine food, abandonment | validation (held out) | small, closed, environment-driven; collapse without conquest; tests climate → ecology → nutrition → migration |
| H4 | Copán valley (Classic Maya), 400–1200 CE | dynastic growth to ~20–28 k, deforestation and soil loss, political collapse c. 820, slow depopulation | validation (held out) | tropical maize, no draft animals or metal tools; collapse of institutions before people; tests land use, soil, legitimacy |
| (H5) | Iceland, 874–1300 | settlement, deforestation and erosion, the Commonwealth (no executive), absorption by Norway 1262–64, survival | reserve control | same founders and technology as H3 with a different outcome |

### The data each needs (proposed; every value labelled researched / estimate / fiction)

| Target | Starting conditions (initialise) | Trajectory to compare against | Main sources to research |
|---|---|---|---|
| H1 England | 1270 population (~4.5–5 M), land use by type, crop yields, livestock, wages and prices, manorial and royal institutions, towns and their sizes, technology inventory (mills, ploughs, ships), climate | annual population, real wages, GDP per head, urban share, enclosure, tax revenue, plague mortality, wars and the civil war, regime changes | Broadberry, Campbell, Klein, Overton & van Leeuwen *British Economic Growth 1270–1870*; Clark's wage and price series; Wrigley & Schofield *Population History of England*; Campbell *The Great Transition*; tree-ring and documentary climate series |
| H2 Tokugawa | 1600 population (~12–18 M, contested), kokudaka by domain, irrigated area, rice yields, castle towns, the bakuhan institutions, the 1630s trade restrictions as a starting rule set | population by province (1721 onward shogunal surveys), arable area, urban sizes (Edo, Osaka, Kyoto), famines (Kyōhō, Tenmei, Tenpō), peasant uprisings (ikki counts), rice prices | Hayami Akira's register demography; Saito Osamu on wages and output; Totman on forestry; Aoki Kōji's ikki counts |
| H3 Greenland | founding c. 985 (~14 ships, ~400–500 people), farm sites and pasture, livestock, walrus-ivory trade link to Norway, church, climate | farm counts by phase, population estimates, δ13C/δ15N diet shift in burials, trade contacts, abandonment date | Lynnerup's demography; Arneborg et al. isotope studies; McGovern's zooarchaeology; GISP2/ice-core and lake-sediment temperature reconstructions; Dugmore et al. |
| H4 Copán | c. 400 CE founding of the dynasty, valley soils and slopes, maize yields, forest cover, settlement hierarchy | structure counts by phase (obsidian-hydration dated), population estimates, pollen-recorded forest loss, monument dates (political activity), skeletal health | Webster, Freter & Gonlin *Copán: The Rise and Fall of an Ancient Maya Kingdom*; Abrams on construction energetics; pollen cores (Rue); regional speleothem drought records |
| H5 Iceland | 874 settlement, birch cover, pasture, livestock, Althing institutions | farm counts, tephra-dated erosion, institutional change 1262 | Landnámabók (with care), tephrochronology studies, Grágás |

### The indicators (proposed definitions)

Each indicator is a time series sampled at fixed checkpoints (every 10 years for H1/H2, every 25 years for
H3/H4). Each gets a similarity score S in [0, 1]; the reality differential is 1 − S.

| # | Indicator | Measure | Score |
|---|---|---|---|
| I1 | Population | total people | S = max(0, 1 − mean over checkpoints of \|ln(sim/hist)\| / ln 2) (a factor of 2 off scores 0) |
| I2 | Settlement growth | number of settlements by size class; largest settlement size | as I1 on the largest settlement; class-count distribution by 1 − total-variation distance |
| I3 | Resource availability | arable/pasture/forest area; key stock (timber, fish, game) | as I1 per resource, averaged |
| I4 | Production | output per head of the staple (grain, rice, maize, dairy) in kg | as I1 |
| I5 | Technology | set of deployed technologies at each checkpoint (catalogue ids) | Jaccard similarity of the simulated and historical deployed sets; adoption-date error scored 1 − min(1, \|Δt\| / 50 y) |
| I6 | Institutional change | ordered list of regime/institution transitions (e.g. manorial → leasehold, monarchy → republic) | event matching within a window (±25 y): F1 score of matched events |
| I7 | Territory | area controlled / occupied | as I1 |
| I8 | Conflict | count and intensity of wars, revolts, uprisings per period | rate as I1; timing of major events by I6's F1 |
| I9 | Political stability | regime duration; successions that were violent | 1 − \|share violent sim − hist\|; mean regime duration as I1 |
| I10 | Migration | net migration and abandonment (settlements lost) | as I1 where series exist; abandonment timing as I6 |
| I11 | Cultural and religious change | share of population by religion or practice at checkpoints | 1 − total-variation distance |

Combined score: the weighted mean of the indicators the target has data for (equal weights by default; Rex sets
any other weighting). The 70 % target (§5) applies to the combined score **and** is reported per indicator.

Protocol: N ≥ 30 runs per target with recorded seeds; report the mean and spread of each S; an error that keeps
its sign across seeds is systematic (a missing mechanism or input, investigated and logged), one that does not is
stochastic. No parameter may be tuned on H3 or H4; a failed held-out target opens an investigation issue, never a
tuning pass.

Acceptance (proposed): the benchmark harness runs all four targets headless; H1 and H2 reach ≥ 70 % combined
before H3 and H4 are first run; H3 and H4 results are reported as-is.

## P11b: generative plausibility (proposed indicators)

Runs: seeded societies started from conditions that never existed together (a climate, resources, a population
and institutions combined freshly, or a documented society with one starting condition changed), N ≥ 30 seeds
each, long enough to cross several generations. Each indicator is computed for every run; **gates** must hold in
every run, **graded** indicators score S in [0, 1].

| # | Indicator | Measure | Type |
|---|---|---|---|
| G1 | Conservation holds | mass by element, energy, water, money (except declared mints) and population accounting (births − deaths ± migration) close at every step | gate |
| G2 | Mortality within biological bounds | age-specific mortality, life expectancy, maximum lifespan, fertility and growth fall inside the ranges documented for human populations under comparable conditions | graded (share of checks inside bounds) |
| G3 | Economic constraints hold | nothing produced without its inputs, energy, tools, knowledge and labour; food per head below subsistence produces hunger and deaths, never a silent floor; prices positive and finite | gate (production) and graded (output per head inside the documented range for the technology) |
| G4 | Institutions traceable to mechanisms | every institution, office, law, organisation, war and technology adoption in the event log has a complete causal trace to mechanism events | gate |
| G5 | Decisions follow the behavioural rules | a replayed sample of individual decisions reproduces each from the Cognition model's rules and the individual's recorded state | gate |
| G6 | Histories are generated, not forced | different seeds give different histories (outcome distribution not degenerate), and no outcome is reachable only by a script | graded |
| G7 | Documented regularities appear | cross-cultural regularities with sources (e.g. population pressing on food supply; urbanisation rising with surplus) appear without being coded as rules | graded (share reproduced) |

Explicit hypotheses (evidence-level-5 rows) are tested here: each states its expected consequence and the run
reports whether it appeared.

## P11c: comparison with simpler cliodynamic models (proposed)

Cliodynamics is an input and a yardstick for Society, Government and History (Rex): it explains pressures and
forecasts instability windows, not specific events, and its own record is mixed.

- **Baseline:** Turchin's structural-demographic theory (population pressure, elite overproduction, state fiscal
  distress, the political stress indicator), as published (Turchin and Nefedov, *Secular Cycles*, 2009, and later
  work), implemented as a small baseline model.
- **Data:** the **Seshat Global History Databank** as a source for History and for the benchmark's starting
  conditions and trajectories (polity size, social complexity, warfare, institutions), with each value labelled.
- **Cases:** societies **neither** the platform **nor** the baseline was calibrated on (not H1 or H2, and not the
  cases the baseline's authors used), drawn from Seshat's coverage.
- **Measure:** both models predict the same quantities where both can: instability windows (I8 conflict, I9 stability),
  population (I1) and polity size (I7), scored as in P11a. The platform is reported against the baseline indicator
  by indicator, including where it does worse.

## Decided and open

Decided by Rex, 2026-10-30: the engine organisation (with the Kernel fence, the Reality split when mechanics makes
it necessary, and History as a thin layer); the P0–P11 order with refinements A and B; weather from physics; the
benchmark structure, provisionally.

Still open:

1. Owners for the 47 overlap groups, batch by batch (batch 1: `OVERLAPS-BATCH-1.md`; batches 2–5 listed in
   GRAPH.md §2).
2. The benchmark periods, weights and the 70 % target, after the data-coverage and indicator audit.
3. Reconciling the three value-label systems (AUDIT.md §5) and REAL-12.
4. CTRL-12: whether `Toolchain/`'s root becomes a git repository (the controller notes `Reality-simulator` was
   pushed to GitHub; whether that covers these root docs is the controller's to confirm).
