# The simulation engines: owners, boundaries, lanes (2026-10-30)

**Mission (2026-10-30, later the same day):** the project is now the universal reality and civilisation
simulation platform, with the pirate game as one plugin. Read `PLATFORM.md` first; this file remains the engine
map and is kept current by the controller.

Rex's architecture (2026-10-30, worked out with ChatGPT and adopted): a family of reusable simulation engines
under `Toolchain/`, with the pirate ship (`Games/RPG's/pirate-ship`) as the first game that uses them through
adapters. Rules Rex set the same day:

- **One authoritative owner per system.** Everyone else consumes its outputs through documented interfaces.
- **Every universal engine is independent of pirate-ship**, with stable interfaces between engines.
- **Ownership is not activity.** An owner session stays idle until a concrete research or implementation task
  is ready. No session is started merely to produce documentation.
- Every owner ends each turn with five lines: responsibility, latest commit, tests passing, what is blocked on
  Rex, next proposed task.
- **Historical first (Rex, 2026-10-30).** The game is based on realism, so wherever reliable historical or
  real-world data exists it fills the answer: starting population, wages, prices, religion, technology, burial
  customs, household structure, economic organisation. Rex decides only where no data exists or the data
  conflicts. Every value carries one of three labels: **researched** (with its source), **estimate** (derived
  from research, the derivation shown), **fiction** (Rex's or a faction's). History sets the starting conditions
  and constraints; the simulated mechanisms decide what follows, so outcomes may leave history.
- **Nothing is a fixed property that mechanisms could produce (Rex, 2026-10-30).** A town's culture is not a
  setting; it emerges from its individuals (personality, upbringing, memories, beliefs, needs), their relationships
  and organisations, its institutions and material conditions, and feeds back into how children are raised and
  what is approved or punished. No "rebellion meter": enough hungry, angry people with a way to coordinate is a
  rebellion. Deterministic given the same inputs and seed; stochastic only where real uncertainty exists.
- The ordering principle: physics decides what can happen, biology what an organism can do, cognition what it
  attempts, society the institutions and incentives around the attempt. The game supplies the objectives.

## The approved organisation (Rex, 2026-10-30, on the audit; `AUDIT.md` §6, `ROADMAP.md`)

| Engine | Responsibility | State |
|---|---|---|
| **Kernel** | shared time and scheduling, event ordering and causality, stable ids, units and dimensional validation, seeded RNG, snapshots and replay, cross-engine transaction boundaries. **Infrastructure only: it never owns a scientific or economic formula** (Rex) | new; P0; Kernel keeper to start |
| **Physical Reality** | mechanics, thermodynamics, chemistry, fluids, optics, materials, environment; **weather and climate as a major P2 subsystem, generated from physics (solar heating, pressure gradients, humidity, instability, ocean evaporation, terrain, circulation, surface water), never drawn from a table** (Rex); climate = a region's statistics and boundary conditions, weather = the atmospheric state over time | today inside `realism/`; split from Life when mechanics makes it necessary |
| **Life & Species** | anatomy, physiology, metabolism, genetics, development, health | today inside `realism/` |
| **Catalogue** | scientific, historical, geographic and fictional reference data; tags, never unlocks | new; P4, researchable in parallel once ids and contracts exist |
| **Settlement** | property, buildings, construction, workforce assignments | built, kept independent |
| **Economy** | production, consumption, prices, trade, accounting | built, kept independent |
| **Society** | population, culture, organisations, collective behaviour | new; P6 |
| **Cognition** | perception, memory, learning, individual decisions | **started 2026-10-30** (Rex: begin now, in parallel, under refinement A): a baseline decision engine first (perception and subjective world, needs and goals, knowledge and memory with wrong beliefs, action generation and selection, learning), policy `a_t = π(o_t, m_t, n_t, p)` with the personality structure p a null model in the baseline; Rex's light-and-crystal / eight-function theory is the second layer, changing how experience is processed, never assigning behaviours to types; first benchmark the hungry-pair resource scenario under identical seeds; design and units for Rex's approval before code |
| **Government** | laws, political authority, institutions, enforcement | new; P8; architecture may be researched while P6–P7 build |
| **Knowledge & Technology** | discovery, invention, capabilities, diffusion | new; P9 |
| **History** | historical initialisation, reconstruction and comparison; **a thin composition and validation layer, never a scripted-outcome engine**: it describes what happened in the simulation, it never determines what must happen (Rex) | new; P10–P11 |

**Cellular biology (Rex, 2026-10-30):** a foundational layer of Life & Species between chemistry and tissues,
not a top-level engine (`CELLULAR.md`): ATP production and use, DNA damage and repair, telomeres, senescence,
mitochondrial function, proteostasis, stem-cell populations, epigenetic regulation, inflammation and immune
signalling, cell death and replacement. Modelled as **cell populations with representative states** (size,
capacity, energy, damage, repair, senescent fraction, turnover), never trillions of cells; resolution raised
locally for an experiment. **Ageing is an emergent output of it**, never a timer on organ performance; two people
of the same age differ by their histories. It also underlies muscle growth, nutrition, disease, wound healing,
cancer, toxicology and reproduction, and gives other species their own turnover and regeneration by parameters.
Established cellular processes are labelled apart from simplified or experimental ageing models. Not before P0
and P1: the registry keeper audits metabolism, muscle adaptation, medicine, genetics and organ ageing for what
moves under cellular ownership first.

**Resolution of the biology (Rex, 2026-10-30, refining the above):** cells and DNA are simulated as compact
mathematical representations that preserve their causal effects, never in their real form. Three separate records
per organism: (1) a **genetic profile**, stable inherited information for development and reproduction, as
chromosome segments carrying trait-associated variants (linkage, polygenic effects, dominance, interactions), never
independent trait sliders or an average of the parents; (2) a **cellular and developmental state** (repair
capacity, accumulated damage `D(t+1) = D(t) + damage − repair`, regeneration, adaptation), per representative
tissue population; (3) the **organism state** (anatomy, organs, muscles, nutrients, immunity, capabilities). A
character sheet is a view of these records, never a second source of numbers. A trait like muscular growth is
`ΔM = f(G, T, N, H, R)` (genetics, training stimulus, nutrition, hormones and development, recovery): nobody
inherits a Strength score. Named characters get tissue-level detail; distant populations aggregate genetic and
health distributions.

**Success measures (Rex, 2026-10-30):** the platform is a **generative** model of reality, not only a predictive
one. Two evaluations of equal weight: **historical reconstruction** (does the engine reproduce observed patterns
from documented starting conditions) and **generative plausibility** (do new societies obey physical, biological,
economic and social constraints and emerge through coherent mechanisms, even along histories that never happened).
Each major subsystem proves itself with an **executable demonstration**, not with a pirate slice: an organism
ageing under different conditions; two fighters exchanging physically resolved actions; a settlement answering a
harvest failure; a population forming competing organisations; an institution gaining or losing legitimacy;
several societies developing and interacting over centuries. **Cliodynamics** (Turchin's structural-demographic
theory, the Seshat databank, the journal *Cliodynamics*) is an input and a yardstick for Society, Government and
History: it explains pressures and forecasts instability windows, not specific events, and its own record is
mixed; the test worth running is the platform against simpler cliodynamic models on cases neither was calibrated
on. More mechanisms never mean more accuracy by themselves; where the science is missing (cognition, cultural
change, institutional emergence, ageing rates) the platform holds explicit hypotheses and tests their consequences.

**Weather validation (Rex, 2026-10-30):** monthly normals within a tolerance are necessary, not sufficient; the
generator must also match rainfall frequency, dry-spell duration, temperature variability, wind distributions,
seasonal patterns and extreme-event frequency, with variable-specific tolerances and independent observational
data, never one universal 10 %.

**Kernel adoption (Rex, 2026-10-30):** adopting shared time, ordering, ids and seeded randomness must not silently
change existing results: the thirty-day settlement simulation gives the same outputs under equivalent initial
conditions unless a correction is documented. **Mortality:** Reality decides biological failure (a crisis before
every death); the game's fate system decides what a dead character becomes; the two rules are compatible.

Refinements Rex set with the approval: **(A)** dependency-based parallelism: a phase starts when what it reads
from is ready, never "the previous phase finished"; **(B)** overlap closure removes duplicate *authority*, not
every related calculation: a detailed and an aggregate computation may coexist when one owner holds the state and
the aggregation interface is documented; the registry distinguishes legitimate aggregation from contradictory
duplication. The benchmark structure (England and Tokugawa Japan for development; Norse Greenland and Copán held
out; Iceland reserve) is approved provisionally: periods, weights and the 70 % target stay provisional until data
coverage and the eleven indicators are audited. No disruptive migration starts until the affected keepers agree
ownership and acceptance tests. The 47 overlap groups are presented in prioritised batches, first shared time,
state ownership, metabolism, fatigue, labour and mortality.

## Engines as they stand today

| Engine | Folder | Owner session | State | Priority |
|---|---|---|---|---|
| Reality & Species (physics, chemistry, environment, materials, biology, species) | `realism/` | body-and-world keeper | built: 239 tests; mechanics/biomechanics layer missing | high |
| Settlement (land, property, buildings, businesses, workforce, construction) | `settlement/` | settlement keeper | built: step 2, 23 tests; waits on Rex's Q1, Q5, Q6, Q7, Q10 | medium |
| Economy (production, trade, consumption, labour, markets) | `economy/` | economy keeper (started 2026-10-30) | built: steps 2–8, 25 tests (E1–E14: production, consumption, spoilage, shortage, prices, trade, shipments, accounting, labour quotes, the three-port sim); contract with Settlement agreed; next the pirate adapter and the thirty-day benchmark | high |
| Government (laws, authority, institutions, taxes, enforcement) | not created | none yet | nothing | design after Economy; boundaries agreed with Settlement first |
| Cognition & Interaction (perception, memory, learning, decisions, communication, social behaviour) | not created | none yet | nothing; the alignment engine in the pirate repo is the nearest thing | research and architecture after Government; the bar simulator as an early test |

Society = Economy + Government + population/demography (`realism`'s `POPULATION` work today) + culture and
organisations (no owner). Settlement is Society's physical and institutional layer.

## Scope added 2026-10-30 (Rex: "every facet of life except evolution")

| Engine | Added responsibilities |
|---|---|
| Reality & Species | **Mechanics** (gravity, force, momentum, collisions, friction, fluid forces), **optics** (light propagation, reflection, absorption, visibility; darkness is the absence of light reaching an observer, supernatural darkness a fictional mechanism of its own), fluid dynamics, materials (deformation, fracture, corrosion, decay); the **full lifecycle**: digestion → absorption → metabolism and cellular energy as flux (ATP availability, never a stored pool) → heat → waste and excretion (faeces, urine, CO₂) → sanitation, soil, water quality, disease exposure, **decomposition**; genes and ageing acting through organ capacity, enzyme activity and regulation, never as global modifiers |
| Cognition & Interaction (future) | individual beliefs, preferences, learning, memory, behavioural variability; how a person interprets an experience (blames the government, the merchants, outsiders, themselves, or stays loyal) |
| Society (future) | cultural transmission, social networks, collective action, organisations (families, churches, guilds, cults, political groups); culture as the emergent output of individuals and institutions |
| Government (future) | institutional rules, authority, political systems, enforcement; burial permissions, sanitation rules |
| Settlement | cemeteries (parcels, grave capacity, burial infrastructure), sanitation infrastructure, land use |
| Economy | burial services (coffins, labour, transport, land), waste management, resource flows |
| Pirate game (town keeper) | **`town/CULTURE.md` per town**: the starting conditions only, never the engine: starting beliefs and religious preference (changeable when an outside cult gains influence), customs including burial and death customs, the economic and political arrangement (capitalist, communal, feudal: an institutional structure, not the culture itself), the economic situation, historical context, local practices. Historical research fills it; factions and time anomalies add alternatives (consecrated ground, burial at sea, bodies preserved or transformed) |

Culture, economic system, political system and religion are separate dimensions that interact: a town can be
Catholic, under a monarchy, with private merchant ownership and strong mutual aid, all at once.

## Shared infrastructure still missing

- **Universal time and events:** one scheduler across timescales (milliseconds to years); each engine ticks at
  its own scale.
- **Universal state and causality:** each engine owns its part of a causal chain (physics → anatomy → medicine →
  physiology → cognition → economy → society) with no duplicated ownership of state.

## Game-specific keepers (pirate-ship, never engines)

| Keeper | Owns | Priority |
|---|---|---|
| story | characters, quests, factions, transformations, consequences | maintain |
| town | FACILITIES.md, the starting port's configuration, locales, ownership rows | medium, waits on Rex |
| combat | pirate fighting rules and encounters; consumes realism's physics | resume walkthrough |
| bestiary | creature definitions, biological profiles, provenance, journal entries, encounter data; never physiology | maintain |
| balance | alignment, endings, reachability, fate constraints | paused |
| art | character and environment assets | paused |

## Boundaries Rex set on 2026-10-30 (the five overlaps)

| Overlap | Boundary |
|---|---|
| Settlement ↔ Economy | Economy started; its first task is the interface agreement with Settlement, then an independent economic sim; thirty-day autonomous settlement sim as the first integration benchmark |
| Population | demography moves to Society when a Society-side owner exists; Reality keeps biological reproduction, ageing and mortality |
| Culture and organisations | reserved for the Society layer; Story keeps fictional faction identities and narratives. Society is not a folder of Economy + Government + Population: it must represent organisations and collective behaviour (a pirate faction is at once an economic actor, a political organisation and a social group) without duplicating the engines under it |
| Alignment ↔ Cognition | the alignment engine in the pirate repo stays pirate-specific; the eight-function personality model becomes one optional cognitive model inside the future Cognition engine |
| `STATS.md` (pirate repo) | the Reality & Species keeper is its **editing coordinator**: it makes the edits and keeps the scientific mechanisms under each attribute consistent. It is not the design authority: gameplay attributes, progression and balance stay Rex's. Combat and Story submit proposed changes to it instead of editing |

## Contracts to agree before code

- **Settlement ↔ Economy: agreed 2026-10-30.** `CONTRACTS.md` is byte-identical in `economy/` and `settlement/`
  (Settlement's side: `settlement` commit 2c4223c, 26 tests). Seven items in its §12 are open for Rex: goods
  types (GOODS.md Open 1–8), `port.cash` as treasury (Q7), who values property for an unpriced sale, whether
  named characters' spending is simulated, the price formula, wage levels and whether quotes move them (Q10),
  whether an idle fixture counts (Q9).
- **Settlement ↔ Government:** Settlement records who holds an office; Government defines what the office may do.
- **Realism ↔ Combat / Bestiary:** realism owns physics and physiology; combat and bestiary read them.
- **Story ↔ Cognition:** story defines motives and history; cognition computes decisions from them.

## Log

| Date | What |
|---|---|
| 2026-10-30 | File opened from Rex's reorganisation; cargo-research session archived; owners and the three new lanes recorded |
| 2026-10-30 | Economy keeper started; the five overlap boundaries and the `STATS.md` coordinator recorded |
| 2026-10-30 | Settlement ↔ Economy contract agreed; economy engine built to step 8 (25 tests); seven contract items open for Rex |
| 2026-10-30 | Rex: historical data fills answers first (three value labels); culture emerges from individuals; cemeteries and `town/CULTURE.md`; mechanics, optics, excretion, decomposition, cellular energy, genes and ageing added to Reality's scope |
