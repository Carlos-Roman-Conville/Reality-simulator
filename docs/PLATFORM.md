# The reality simulation platform: mission and directive (Rex, 2026-10-30)

**Read this before `ENGINES.md`.** It records Rex's change of mission, given 2026-10-30 in his own words and in
a directive he worked out with ChatGPT and adopted. Everything below marked **(Rex)** is his; the rest is the
controller's organisation of it.

## 1. The mission

**(Rex)** We are no longer building a pirate simulator. We are building a **universal reality, life and
civilisation simulation platform**: Earth-like physics, organisms, human behaviour, societies, civilisations,
technology and history, produced by interconnected causal and mathematical mechanisms. It must run with no game,
graphics, narrative or player. A game is an interface and a set of objectives layered over a simulated reality.

**(Rex)** The pirate RPG becomes **one plugin** of the platform: it selects a time window, a region, and what the
catalogue allows (§6), and layers its story, factions, alignment, supernatural elements and progression on top. It
never defines a universal rule. Its story, combat, alignment, bestiary, town and art work stays intact, parked on
the back end, not interconnected with the platform for now.

**(Rex)** The scope is "every facet of life except evolution": lumber per wall and the techniques for each kind of
wall, every method of production of everything, gravity, forces, light and darkness, decay, digestion, waste. The
test of success is a **civilisation-scale** sim: a society becomes a village, city, kingdom, republic or empire by
its conditions; nations go to war for the reasons humans actually have; it can produce outcomes that never
happened, not replays.

## 2. The philosophy

**(Rex)** Explain outcomes by their mechanisms; never hardcode the outcome. No technology because its year
arrived; no war because a script said so; no rebellion because a meter hit a threshold; no production because a
building is labelled a factory; no strength because of a level. Mathematise history: find the gears behind why a
society reaches human sacrifice, why a revolution eats its own. The sim builds on itself: more turning gears is
better, **the one danger is overlapping gears** (two mechanisms for the same thing, built because the second author
forgot the first). Deterministic given the same inputs and seed; stochastic only where real uncertainty exists;
different seeds may give different histories, and that is a feature.

## 3. The seven domains

| Domain | Covers | Today |
|---|---|---|
| A. Physical reality | physics, chemistry, materials, thermodynamics, gravity, motion, optics, fluids, geology, atmosphere, weather, oceans, energy, degradation; construction mechanics, structural engineering, material requirements, manufacturing feasibility | `Toolchain/realism` (thermodynamics, gases, chemistry built; mechanics, optics, materials planned, PHASES-6-PLUS) |
| B. Life and species | anatomy, organs, muscle, neurology, genetics, metabolism, nutrition, cellular energy, reproduction, development, ageing, disease, injury, healing, waste, decomposition, death; humans first, then other species by configuration | `Toolchain/realism` and the `body/` docs |
| C. Cognition and interaction | perception, memory, learning, personality (the eight-function model as one configurable model, never hardcoded), goals, decisions, emotion, communication, relationships, variability | nothing; future lane |
| D. Economy and production | extraction, agriculture, manufacturing, construction, labour, trade, transport, markets, currencies, scarcity, pricing, ownership, investment, consumption; capitalism never assumed; every process grounded in materials, tools, knowledge, labour, energy, conditions | `Toolchain/economy` (25 tests), `Toolchain/settlement` (26 tests), contract agreed |
| E. Government and institutions | authority, law, offices, taxation, spending, property rights, enforcement, military organisation, diplomacy, succession, legitimacy; communities to empires | nothing; future lane |
| F. Society and culture | population, households, kinship, religion, norms, traditions, organisations, class, cultural transmission, collective action, migration, cooperation, conflict, rebellion; culture emerges from individuals, institutions, material conditions and history; a culture profile seeds it | `world/POPULATION.md` only; future lane |
| G. Civilisation and history | settlements, cities, states, nations, empires, technology development, armies, international relations, expansion, collapse, transitions; why societies get their institutions, technologies, wars and practices | nothing; the roadmap must show it |

## 4. Mathematising history

**(Rex)** Research and formalise historical mechanisms wherever evidence exists, from history, science,
economics, demography, political science, anthropology and psychology. Each mechanism is labelled by evidence
quality: (1) established physical or mathematical relationship; (2) empirically supported statistical
relationship; (3) historical observation and interpretation; (4) simplified simulation approximation; (5)
hypothetical or experimental model; (6) fictional mechanism. Historical events are evidence for building and
testing models, never scripts; competing explanations are kept, not collapsed to one.

## 5. Historical reconstruction as the validation test

**(Rex)** Pick several real societies with very different environments, institutions, resources, technologies and
outcomes. Initialise from documented conditions at an earlier date, run without forcing the outcome, compare the
trajectory with history. Target: **at least 70% similarity (a reality differential of at most 30%)**, measured by
explicit indicators, never a subjective score: population, settlement growth, resource availability, production,
technology, institutional change, territory, conflict, political stability, migration, cultural and religious
change; each indicator and their combined trajectory. Multiple runs, controlled conditions, recorded seeds;
systematic error told apart from stochastic variation. Societies used for development are never the only ones
used for validation. A failed reconstruction is investigated for the missing mechanism, input or interaction. The
70% is a provisional development target, not a claim.

## 6. Technology emerges; the catalogue tags, never unlocks

**(Rex)** Invention dates are reference information. A society develops a technology from resources, knowledge,
tools, manufacturing capability, energy, skilled labour, incentives, institutions, communication and
experimentation; earlier than history if the capabilities exist, never if they don't. Possibility, knowledge,
invention, adoption and deployment are distinct states.

**(Rex)** A **universal reference catalogue** tags every entity, substance, organism, technology, institution,
practice and phenomenon: stable id, names, classification, geographic origin and spread, culture or civilisation,
earliest evidence, period or date range, discovery / invention / identification / adoption dates, sources,
confidence, and the provenance class (real, prehistoric, mythological, fantasy, science fiction, original fiction;
several may apply). Thorough enough to say "this region, this country, this locale, this period". Two uses:
**game configuration** (a pirate game asks for the Caribbean, 1690–1720, and gets historically grounded starting
conditions; a medieval or dark-ages game asks for its own) and **unconstrained life simulation**, where the
catalogue never grants anything because its date arrived. Historical metadata is never an invisible progression
script.

## 7. No duplicate mechanisms: the registry

**(Rex)** Every mechanism has one authoritative owner. Before any new subsystem, formula, table or document, the
author searches the registry for an equivalent. Every mechanism carries a contract: stable id; owning engine;
inputs and units; outputs and units; internal state; mathematical formulation; dependencies; timescale and update
frequency; conservation rules or invariants; sources and evidence quality (§4); approximations and limitations;
validation tests; downstream consumers. Subsystems talk through explicit interfaces; no engine applies a second
penalty for an effect owned elsewhere (dehydration changes one biological state; everything else reads it). The
registry (`REGISTRY.md`, with a dependency graph) must expose duplicated calculations, conflicting ownership,
circular dependencies and incompatible units. The registry is the controller's main tool.

## 8. Documentation: one gear per file

**(Rex)** Each gear is its own small `.md` that feeds a larger one: `PHYSICS.md` names the domain; gravity,
mechanics, optics, fluids and thermodynamics each have their own file; higher systems reference, never rewrite,
a formula. Documentation mirrors executable ownership. Source data and implementation stay in sync.

## 9. Resolution

Different resolutions for the same mechanisms: an individual nearby in full physiological, cognitive and physical
detail; a distant village as aggregated demography and economy; a civilisation in long steps until an event needs
finer ones. Finer resolution refines the aggregate, never contradicts it.

## 10. What is preserved

Nothing is deleted or rewritten: `Toolchain/realism`, `economy`, `settlement`, the scientific reference library,
and all pirate-ship content (story, combat, alignment, bestiary, town, art, STARTING_TOWN.md, CULTURE.md). Keepers
keep their responsibilities until a reassignment is approved. This is evolution of the architecture, not a
rebuild.

## 11. How the work is run (Rex, 2026-10-30)

- **The controller outputs; the sub-agents build.** The controller session coordinates architecture, ownership,
  dependencies, priorities and integration, and reports to Rex. It does not build.
- **Every sub-agent session is Opus 5.5** (`claude-opus-5-5`), never Fable.
- **Build units go through the conveyor belt** (`Games/Card Games/_agent/run_queue.py`, lanes `realism`,
  `settlement`, `economy`, `pirate-ship`; `BELT.md`, `RULES.md`, `WORK.template.md`): Codex for engine logic,
  Cursor Composer for data, tests and UI, Claude Sonnet for platform work, Haiku for checks. Keepers write WORK
  files and gates; the runner decides pass or fail. Quality is never traded for tokens: a unit that needs design
  judgement stays with an Opus keeper.
- Every keeper ends every turn with five lines (responsibility, latest commit, tests, blocked on Rex, next task)
  and keeps `HQ/handoffs/<keeper>/HANDOFF.md` and `ISSUES.md` current.
- Historical first; three value labels (`ENGINES.md`).

## 11a. Mathematical verification and validation (Rex, 2026-10-30)

The keepers are responsible for researching, selecting, implementing, testing and validating the mathematics.
Rex is never the one who finds a wrong formula, an unrealistic parameter, a numerical instability or a
contradiction between mechanisms; he decides what the simulator must represent and approves major design choices,
and he can ask why a simulation behaves as it does and get a traceable, evidence-backed answer.

Three states, never conflated: **implemented** (the code exists and its unit tests pass) ≠ **integrated** (it is
wired to the mechanisms it reads and feeds, through registry ports) ≠ **validated** (its behaviour, alone and in
combination, matches independent evidence within declared tolerances). The registry records all three per mechanism.

For every mechanism the owner provides: (1) the scientific sources and the model used; (2) inputs, outputs, units,
assumptions, conditions of applicability; (3) **verification** tests, that the mathematics is implemented as
stated; (4) **validation** against independent empirical data where any exists, with tolerances; (5) numerical
stability, conservation and boundary-condition tests; (6) **integration** tests with the mechanisms it is
connected to (heat transfer and thermoregulation together, not only apart); (7) automated detection of duplicate
effects and conflicting state ownership (the Kernel check script); (8) a report of accuracy, uncertainty,
limitations and unresolved scientific questions. A validation specification is part of every belt unit's Gate.

When a model fails validation, the owner investigates, corrects and reruns without Rex diagnosing it. Owners may
autonomously fix implementation defects against the approved model inside their boundary. A change to the
scientific model itself, to an architectural assumption, or an unvalidated hypothesis is recorded and reviewed
before it becomes authoritative. Where no validated model exists, the approximation or hypothesis is labelled
(§4 levels 4–6) and an experiment to evaluate it is designed.

Qualification: an agent testing its own implementation is not independence. Validation needs independent
reference data, competing models where they exist, a re-audit by the registry keeper, Haiku check units that did
not write the code, and the held-out benchmarks; for cognition and civilisation-scale behaviour, explicit
uncertainty is the honest result.

## 12. The controller's immediate assignment (Rex, 2026-10-30), and its state

| # | Item | State |
|---|---|---|
| 1 | Update mission and architecture docs | this file; `ENGINES.md` points here |
| 2 | Audit the existing engines against the seven domains | the audit session (`HQ/handoffs/registry/`) |
| 3 | Missing foundational mechanisms and duplicated responsibilities | the audit session |
| 4 | Mechanism ownership registry and dependency graph | the audit session: `REGISTRY.md`, `registry/` |
| 5 | Separate universal requirements from pirate-specific ones | the audit session |
| 6 | Review whether the engine organisation needs expansion or regrouping | the audit session proposes; Rex approves |
| 7 | Update the master development dashboard to the new mission | pending (the Game dashboard, `Card Games/progress`, port 8098) |
| 8 | Phased roadmap by dependencies with acceptance tests | the audit session: `ROADMAP.md` |
| 9 | Preserve repositories, commits, tests, keepers | nothing removed |
| 10 | Present the reorganisation for approval before any disruptive migration | the audit session reports; the controller presents; Rex approves |

## Log

| Date | What |
|---|---|
| 2026-10-30 | Mission changed from pirate simulator to the universal reality platform; directive recorded; run rules (controller outputs, Opus 5.5 sub-agents, belt) recorded; settlement and economy lanes added to the belt; audit session started |
| 2026-10-30 | Rex approved the Cognition design (C-Q1–C-Q8 as proposed, personality after the baseline, crude formulas with codex fingerprints) and added a universal motivational architecture (Maslow for categories not priority; SDT; homeostatic/allostatic; RL; `M_i = w_i·D_i·S_i` proposed); Reality owns biological signals, Cognition owns appraisal and selection, personality owns processing. Cognition lane released |
| 2026-10-30 | Cognition lane opened at Rex's direction (baseline decision engine first, personality second; design before code) |
| 2026-10-30 | Rex approved the Kernel P0 design (ms ticks; harness in `kernel/harness/`; `money` and `count` base dimensions; year length deferred to Catalogue/History) and all 14 batch-1 overlap owners. The kernel lane is released; keepers start P1 groups as they agree acceptance tests |
| 2026-10-30 | Audit delivered (`AUDIT.md`, `REGISTRY.md`, `GRAPH.md`, `ROADMAP.md`). Rex approved the engine organisation and the P0–P11 order with refinements A (dependency parallelism) and B (duplicate authority, not every calculation); Kernel infrastructure-only; weather a physics-generated P2 subsystem; benchmark structure provisional. Items 2–6 and 8 done; 7 (dashboard) and 10 (migrations, per batch) remain. GitHub: `Pirate-game` and `Reality-simulator` pushed |
