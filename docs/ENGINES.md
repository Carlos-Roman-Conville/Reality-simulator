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

## Engines

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
