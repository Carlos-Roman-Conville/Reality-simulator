# The mechanism registry (opened 2026-10-30, registry keeper)

**Status: approved with refinements (Rex, 2026-10-30).** Rex approved the audit's engine organisation and phase
order (`ENGINES.md` "The approved organisation"; PLATFORM.md log). The registry records what exists; the owner of
each overlap group stays **proposed** until its batch is approved (`OVERLAPS-BATCH-1.md` first). Nothing has
moved, nothing was deleted or rewritten, and no code changed. Refinement B governs closure: a detailed and an
aggregate computation may coexist when one owner holds the state and the aggregation interface is documented; each
overlap group carries an `authority` class saying which it is (GRAPH.md §2).

**The rule it serves (Rex, PLATFORM.md §7):** every mechanism has one authoritative owner. Before any new
subsystem, formula, table or document, search this registry (`registry/mechanisms.json`, or the tables below) for
an equivalent. If one exists, consume its output through its interface; never add a second penalty for an effect
owned elsewhere.

## The files

| File | What |
|---|---|
| `REGISTRY.md` (this) | how to use the registry; the summary; one line per mechanism |
| `registry/mechanisms.json` | the full contract per row: every PLATFORM.md §7 field |
| `registry/graph.json` | nodes, edges (depends_on, restates, overlap), the 47 overlap groups (each with its `authority` class and presentation `batch`), the 15 unit issues, cycles, unresolved dependencies |
| `registry/quantities.json` | the quantity vocabulary (schema 2, agreed with the Kernel keeper, `kernel/DESIGN.md` §8): one row per quantity id `<scope>.<quantity>`, its unit symbol (from `kernel/data/units.json` once it exists), its one writer. 317 seeds from the audit's output names, awaiting each owner's confirmation; 17 have several candidate writers |
| `registry/aliases.json` | renames of mechanism and quantity ids (old → new, date, reason); a retired id is never reused |
| `OVERLAPS-BATCH-1.md` | the first batch of overlap groups for Rex: owner, reads and aggregates, acceptance test, keepers to agree, routing |
| `GRAPH.md` | the readable graph: every duplicate and overlap with its homes and proposed owner, unit problems, cycles, ownership conflicts |
| `AUDIT.md` | the seven domains against what exists; missing foundations; universal vs pirate-specific; the engine-organisation proposal |
| `ROADMAP.md` | phases in dependency order with acceptance tests, owners and belt routing; the historical-reconstruction benchmark |

## How each row reads (the §7 contract)

`mechanisms.json` rows carry: `id` (stable, dotted `<engine>.<area>.<mechanism>`), `name`, `owning_engine`,
`home` (file and function or section), `home_kind` (code / docs), `status` (**built** = code exists;
**documented-only** = a formula or rule written in a doc, no code; **planned** = named as future work), `kind`
(**mechanism** = an authoritative home; **restatement** = a doc or adapter restating a mechanism owned elsewhere,
with `restates` pointing at the owner), `domain` (A–G of PLATFORM.md §3, or infra), `scope` (universal /
pirate-specific / mixed), `inputs` and `outputs` with units, `state`, `formulation`, `dependencies`, `timescale`,
`invariants`, `sources`, `evidence` (1–6, PLATFORM.md §4: 1 physical law, 2 statistical, 3 historical observation,
4 simulation approximation, 5 hypothetical, 6 fiction), `approximations`, `tests`, `consumers`, `notes`,
`overlap_groups` (DUP- ids in GRAPH.md), `unit_issues` (UNIT- ids), and `audit_batch` (which reader extracted it).
Schema 2 (2026-10-30) adds `writes` and `reads` (quantity ids from `quantities.json`, mirrored from each engine's
`kernel.json` processes once declared; seeded today from outputs) and `aggregates` ({of, by, interface, test}:
the refinement-B link from an aggregate to the detailed quantity it summarises). The kernel's check
(`check-registry.ts <registry dir> <kernel.json…>`) reads only rows with kind "mechanism" and status "built" and
fails on a declared write with no row, or a quantity with two writers; there is no exception list.

Evidence grades are the auditors' judgement from the code and docs, to be confirmed by each owner. Fields the
source does not state are recorded as such ("none stated", "unknown"), never filled in.

## How the audit was done

Six readers (Sonnet), each over one batch with one extraction schema: realism physical side, realism life side,
settlement + economy, the pirate body docs and STATS.md, the pirate world/science/balance/goods/combat docs and
their game code, and the ten keepers' handoffs and issues. The registry keeper merged the rows, linked 91
restatements to their owners, wrote the 47 overlap groups and 15 unit issues by hand, and computed the graph.
Files over 40 KB were searched, never read whole; per-food, per-disease and per-item table rows are data, not
mechanisms, and are not itemised. Coverage limits are listed in `HQ/handoffs/registry/HANDOFF.md`.

## Summary

| | built | documented-only | planned | total |
|---|---|---|---|---|
| realism mechanisms | 128 | 3 | 41 | 172 |
| settlement mechanisms | 23 | 0 | 1 | 24 |
| economy mechanisms | 20 | 0 | 2 | 22 |
| cognition mechanisms | 0 | 0 | 18 | 18 |
| shared mechanisms | 7 | 5 | 1 | 13 |
| pirate-ship mechanisms | 24 | 63 | 15 | 102 |
| restatements (pirate docs and adapters) | 0 | 90 | 1 | 91 |
| **all rows** | 202 | 161 | 79 | 442 |

**Restatements** are not errors: the pirate body docs are rendered from the same library JSON as the realism
code (`body/build-body-data.py`), so their tables cannot disagree with the code. Disagreements live only in their
prose formulas; those are in GRAPH.md (DUP-14, DUP-18, the sweat formula, the DO2 dissolved term).

**Most important findings** (detail in GRAPH.md and AUDIT.md):

1. **No platform mechanism registry existed.** `realism/src/registry.ts` is an entity store (substances,
   materials, components); `graph.ts` is a list of port edges. Both are reusable as shared vocabulary (their ids).
2. **47 overlap groups**, of which the gravest are the double penalties the §7 rule forbids: work capacity from
   four multipliers (DUP-15), vitamin C with four consequences (DUP-16), fatigue in five places (DUP-13), vision
   dips from several sources (DUP-37), and mortality from five sources with no cause-of-death ledger (DUP-19).
3. **One wiring bug:** circulation writes `blood_lost_ml`, nutrition reads `blood_lost_l`; haemorrhage never costs
   iron outside tests (UNIT-1). Several neurology inputs have no producer (UNIT-15).
4. **No shared clock:** six tick systems, nothing converts between them (DUP-33).
5. **Contract text and code differ** in three places (CONTRACTS.md §6, §8, §9; GRAPH.md §5).
6. **Domains C, E, F, G have almost nothing universal.** What exists there is pirate-specific (alignment,
   personality charts, STATS) or a placeholder (settlement offices, population.ts).
7. **Four PLATFORM.md §6 conflicts** (date- or level-gated unlocks) live in the pirate plugin; acceptable as plugin
   configuration, never as universal rules (AUDIT.md §4).
8. **Cellular biology (Rex, 2026-10-30):** 12 planned rows `realism.cellular.*` record the foundational
   Life & Species layer (`CELLULAR.md`, not yet written): cell populations with representative states, ATP flux,
   mitochondria, DNA damage and repair, telomeres, senescence, proteostasis, stem-cell pools, epigenetics,
   inflammation, death and replacement, and ageing as an emergent output. What moves under it is the registry's
   task R-CELL after P0 and P1 (ROADMAP.md). Beside them, 9 planned rows for the representational resolution of
   biology (Rex, 2026-10-30): three records per organism (`realism.records.genetic_profile`, `cellular_state`,
   `organism_state`), genetics (`realism.genetics.recombination`, `inheritance`, `mutation`, `expression_response`,
   `population_distribution`) and `realism.development.trait_change` (ΔM = f(G, T, N, H, R)).
9. **Interfaces, not overlaps:** IF-1 death to fate (Reality decides biological failure, with a crisis before every
   death; the pirate fate system decides what a dead character becomes); IF-2 the character sheet as a view of the
   three organism records, never a second source of numbers (GRAPH.md §2).

## Mechanisms (authoritative homes), by owning engine

Columns: id · status · domain · scope · evidence · V&V · overlap groups and unit issues · home.
Status: B built, D documented-only, P planned. Scope: U universal, P pirate-specific, M mixed.
V&V (schema 3, PLATFORM.md §11a): **I** implemented (code and unit tests), **T** integration-tested (a combined test
runs it with connected mechanisms; registry ports arrive with P0), **V** validated against independent evidence
(re-audited), **v** a validation candidate awaiting re-audit, **F** failed validation (the owner reported it; see the row's
record), **-** not yet. Model reviews of proposed changes are in `REVIEWS.md`. The full record per row is `vv` in
`mechanisms.json`: sources and model, applicability, verification tests, validation evidence and tolerance,
stability/conservation/boundary tests, `integration_tested_with`, integration tests, report.



### realism (172)

| id | st | dom | sc | ev | V&V | overlaps | home |
|---|---|---|---|---|---|---|---|
| `realism.anatomy.assembly` | B | B | U | 4 | IT- |  | realism/src/anatomy.ts assembleBody L97-145 |
| `realism.anatomy.crisis_floors` | B | B | M | 6 | IT- | DUP-19 DUP-36 | realism/src/anatomy.ts L165-169, L219 |
| `realism.anatomy.damage_repair` | B | B | U | 5 | IT- |  | realism/src/anatomy.ts anatomyProcess L193-196 |
| `realism.anatomy.feed_gate` | B | B | U | 4 | IT- |  | realism/src/anatomy.ts feedAssembly L244-250 |
| `realism.anatomy.organ_function` | B | B | U | 4 | IT- |  | realism/src/anatomy.ts anatomyProcess L174-225 |
| `realism.anatomy.respiratory_profile` | B | B | U | 1 | I-- | DUP-25 | realism/data/library/anatomy.json respiratory; src/anatomy.ts L54 |
| `realism.anatomy.species_profile` | B | B | U | 1 | IT- | DUP-23 DUP-24 | realism/src/anatomy.ts speciesProfile L43-56, speciesRmr L59 |
| `realism.anatomy.tissue_collagen` | B | B | U | 4 | IT- | DUP-16 | realism/src/anatomy.ts anatomyProcess L184-187 |
| `realism.atmos.barometric_pressure` | B | A | U | 1 | ITv | UNIT-6 | realism/src/physics.ts pressureAtAltitude L12 |
| `realism.bio.library_text_parsing` | B | infra | U | 4 | I-- |  | realism/src/*.ts grab()/numberIn()/libraryRow |
| `realism.cellular.ageing_emergent` | P | B | U | ? | --- |  | realism/CELLULAR.md (planned; ENGINES.md 'Cellular biology', Rex 2026-10-30) |
| `realism.cellular.atp_flux` | P | B | U | ? | --- |  | realism/CELLULAR.md (planned; ENGINES.md 'Cellular biology', Rex 2026-10-30) |
| `realism.cellular.death_replacement` | P | B | U | ? | --- |  | realism/CELLULAR.md (planned; ENGINES.md 'Cellular biology', Rex 2026-10-30) |
| `realism.cellular.dna_damage_repair` | P | B | U | ? | --- |  | realism/CELLULAR.md (planned; ENGINES.md 'Cellular biology', Rex 2026-10-30) |
| `realism.cellular.epigenetic_regulation` | P | B | U | ? | --- |  | realism/CELLULAR.md (planned; ENGINES.md 'Cellular biology', Rex 2026-10-30) |
| `realism.cellular.inflammation_signalling` | P | B | U | ? | --- |  | realism/CELLULAR.md (planned; ENGINES.md 'Cellular biology', Rex 2026-10-30) |
| `realism.cellular.mitochondrial_function` | P | B | U | ? | --- |  | realism/CELLULAR.md (planned; ENGINES.md 'Cellular biology', Rex 2026-10-30) |
| `realism.cellular.population_state` | P | B | U | ? | --- |  | realism/CELLULAR.md (planned; ENGINES.md 'Cellular biology', Rex 2026-10-30) |
| `realism.cellular.proteostasis` | P | B | U | ? | --- |  | realism/CELLULAR.md (planned; ENGINES.md 'Cellular biology', Rex 2026-10-30) |
| `realism.cellular.senescence` | P | B | U | ? | --- |  | realism/CELLULAR.md (planned; ENGINES.md 'Cellular biology', Rex 2026-10-30) |
| `realism.cellular.stem_cell_pools` | P | B | U | ? | --- |  | realism/CELLULAR.md (planned; ENGINES.md 'Cellular biology', Rex 2026-10-30) |
| `realism.cellular.telomeres` | P | B | U | ? | --- |  | realism/CELLULAR.md (planned; ENGINES.md 'Cellular biology', Rex 2026-10-30) |
| `realism.chem.carbon_combustion_charcoal` | B | A | U | 4 | IT- | DUP-1 | realism/src/physics.ts carbonCombustion L52; process.ts combustionProcess L34 |
| `realism.chem.heat_per_kg` | B | A | U | 1 | I-- | DUP-1 | realism/src/reactions.ts heatPerKg L27 |
| `realism.chem.molar_mass` | B | A | U | 1 | I-- |  | realism/src/elements.ts formulaAtoms L24, formulaMolarMass L11 |
| `realism.chem.reaction_extent` | B | A | U | 4 | I-- | DUP-1 | realism/src/reactions.ts reactionProcess L101 |
| `realism.chem.reaction_validation` | B | A | U | 1 | I-- |  | realism/src/reactions.ts validate L32 |
| `realism.circulation.aerobic_today` | B | B | U | 2 | IT- | DUP-14 UNIT-4 | realism/src/circulation.ts L144,172 |
| `realism.circulation.bleed_rate` | B | B | U | 5 | IT- |  | realism/src/circulation.ts bleed/bleedFactor L116-124 |
| `realism.circulation.bleeding_class` | B | B | M | 2 | IT- | DUP-15 DUP-36 | realism/src/circulation.ts bleedingClass/bleedingEffects L44-66 |
| `realism.circulation.blood_ledger` | B | B | U | 1 | IT- | DUP-22 UNIT-1 | realism/src/circulation.ts initialiseCirculation/loseBlood/check L81-113 |
| `realism.circulation.cardiac_output` | B | B | U | 4 | IT- | DUP-23 | realism/src/circulation.ts circulationProcess L163; anatomy.ts assemblyCirculation L229-23 |
| `realism.circulation.hazards` | B | B | U | 5 | IT- | DUP-19 | realism/src/circulation.ts hazard L203-234 |
| `realism.circulation.normal_blood_volume` | B | B | U | 2 | IT- | DUP-23 | realism/src/circulation.ts normalBloodVolume L25 |
| `realism.circulation.o2_delivery` | B | B | U | 1 | IT- |  | realism/src/circulation.ts oxygenDelivery L36-40 |
| `realism.circulation.regulation_loops` | P | B | U | 5 | --- |  | realism/src/circulation.ts regulationLoops L128 |
| `realism.circulation.volume_recovery` | B | B | U | 5 | IT- |  | realism/src/circulation.ts L148-154 |
| `realism.contact.collision_detection` | P | A | U | ? | --- |  | realism (Physical Reality, P2 Contact and Impact Mechanics; planned; Rex 2026-10-30, Reali |
| `realism.contact.contact_event` | P | A | U | ? | --- | DUP-36 DUP-37 | realism (Physical Reality, P2 Contact and Impact Mechanics; planned; Rex 2026-10-30, Reali |
| `realism.contact.impact_impulse` | P | A | U | ? | --- |  | realism (Physical Reality, P2 Contact and Impact Mechanics; planned; Rex 2026-10-30, Reali |
| `realism.contact.limb_geometry` | P | A | U | ? | --- |  | realism (Physical Reality, P2 Contact and Impact Mechanics; planned; Rex 2026-10-30, Reali |
| `realism.contact.penetration` | P | A | U | ? | --- |  | realism (Physical Reality, P2 Contact and Impact Mechanics; planned; Rex 2026-10-30, Reali |
| `realism.contact.point_velocity_mass` | P | A | U | ? | --- |  | realism (Physical Reality, P2 Contact and Impact Mechanics; planned; Rex 2026-10-30, Reali |
| `realism.development.trait_change` | P | B | U | ? | --- |  | realism (Life & Species; planned; ENGINES.md 'Resolution of the biology', Rex 2026-10-30) |
| `realism.eco.fished_out_catch` | B | B | M | 4 | I-- |  | realism/src/ecology.ts dailyCatch L55, isFishedOut L52 |
| `realism.eco.logistic_stock` | B | B | U | 1 | I-- | UNIT-7 | realism/src/ecology.ts stepStock L63, effectiveR L46 |
| `realism.eco.msy_collapse_recovery` | B | B | U | 1 | I-- |  | realism/src/ecology.ts msyPerYear L44, collapseYears L92, logisticYears L83, recoveryYears |
| `realism.eco.soil_fertility` | B | B | U | 4 | I-- | UNIT-14 | realism/src/ecology.ts harvest L162, manure L178, fallow L186, erode L194, clearForest L15 |
| `realism.env.cold_water_immersion` | B | B | U | 3 | I-- | DUP-7 | realism/src/environment.ts coldWater L132, durationMinutes L119 |
| `realism.env.daylight` | B | A | U | 4 | I-- |  | realism/src/environment.ts sunHours L95, isDay L98, sunburnFraction L104 |
| `realism.env.diurnal_curve` | B | A | U | 4 | IT- |  | realism/src/environment.ts diurnalC L86 |
| `realism.env.exposure_by_terrain` | B | A | M | 4 | I-- | DUP-35 | realism/src/environment.ts exposure L66, placeOutputs L166 |
| `realism.env.place_process` | B | A | U | 4 | IT- | DUP-34 | realism/src/environment.ts environmentProcess L193 |
| `realism.env.wbgt_bom` | B | A | U | 2 | IT- | DUP-2 UNIT-2 | realism/src/environment.ts wbgtBom L44, vapourPressureHpa L38 |
| `realism.env.wind_chill` | B | A | U | 2 | I-- |  | realism/src/environment.ts windChillC L109 |
| `realism.equip.wear_by_temperature` | B | A | U | 5 | IT- | DUP-9 | realism/src/process.ts wearProcess L216 |
| `realism.fluid.hydrostatics_drag_flow` | P | A | U | ? | --- |  | realism/PHASES-6-PLUS.md Phase 7 |
| `realism.gas.altitude_inspired_po2` | B | A | U | 1 | I-- |  | realism/src/atmosphere.ts altitudeAir L136 |
| `realism.gas.alveolar_po2` | B | B | U | 1 | IT- |  | realism/src/atmosphere.ts alveolarPO2 L148 |
| `realism.gas.breathing_process` | B | B | U | 4 | IT- | DUP-5 | realism/src/atmosphere.ts breathingProcess L410 |
| `realism.gas.cohb` | B | B | U | 2 | I-- |  | realism/src/atmosphere.ts cohbAfter L211 |
| `realism.gas.exposure_accumulation` | B | B | U | 1 | I-- |  | realism/src/atmosphere.ts accumulateExposure L392 |
| `realism.gas.grid_box_handoff` | B | A | U | 4 | I-- |  | realism/src/atmosphere.ts Grid.uniform L512, asBox L522 |
| `realism.gas.grid_transport` | B | A | U | 4 | I-- | UNIT-8 | realism/src/atmosphere.ts Grid.step L544; gridProcess L620 |
| `realism.gas.hb_saturation` | B | B | U | 1 | IT- | DUP-11 | realism/src/atmosphere.ts saturation L154 |
| `realism.gas.ideal_gas` | B | A | U | 1 | I-- | DUP-4 | realism/src/physics.ts molesInVolume L68, airDensity L73; atmosphere.ts litresToMoles L115 |
| `realism.gas.room_box` | B | A | U | 1 | ITv | DUP-8 DUP-40 | realism/src/atmosphere.ts roomAirProcess L278 |
| `realism.gas.sources_sinks` | B | A | U | 4 | IT- | DUP-1 | realism/src/atmosphere.ts bodyGasFlows L323, lampFlows L331, fireFlows L337, rotFlows L344 |
| `realism.gas.thresholds_layering` | B | A | U | 4 | I-- | DUP-25 | realism/src/atmosphere.ts gasThresholds L221, layeredPpm L243, densityVsAir L234 |
| `realism.gas.units` | B | A | U | 1 | I-- | DUP-4 | realism/src/atmosphere.ts L104-123 |
| `realism.gas.ventilation_drive` | B | B | U | 2 | IT- |  | realism/src/atmosphere.ts respiratoryState L192 |
| `realism.genes.ageing_capacity` | P | B | U | ? | --- |  | realism/PHASES-6-PLUS.md Phase 12 |
| `realism.genetics.expression_response` | P | B | U | ? | --- |  | realism (Life & Species; planned; ENGINES.md 'Resolution of the biology', Rex 2026-10-30) |
| `realism.genetics.inheritance` | P | B | U | ? | --- |  | realism (Life & Species; planned; ENGINES.md 'Resolution of the biology', Rex 2026-10-30) |
| `realism.genetics.mutation` | P | B | U | ? | --- |  | realism (Life & Species; planned; ENGINES.md 'Resolution of the biology', Rex 2026-10-30) |
| `realism.genetics.population_distribution` | P | B | U | ? | --- |  | realism (Life & Species; planned; ENGINES.md 'Resolution of the biology', Rex 2026-10-30) |
| `realism.genetics.recombination` | P | B | U | ? | --- |  | realism (Life & Species; planned; ENGINES.md 'Resolution of the biology', Rex 2026-10-30) |
| `realism.infra.component_registry` | B | infra | U | 1 | I-- | DUP-10 DUP-32 | realism/src/registry.ts Registry |
| `realism.infra.connection_graph` | B | infra | U | 1 | I-- |  | realism/src/graph.ts Graph |
| `realism.infra.crisis_record` | B | B | M | 6 | IT- | DUP-19 | realism/src/crisis.ts recordCrisis L32, trackCrisis L42, declareDeath L62 |
| `realism.infra.energy_addheat` | B | A | U | 1 | I-- |  | realism/src/world.ts addHeat L76 |
| `realism.infra.library_loader` | B | infra | U | 1 | I-- |  | realism/src/library.ts libraryTable L56 |
| `realism.infra.operator_control` | B | A | M | 6 | IT- |  | realism/src/process.ts controlProcess L23 |
| `realism.infra.rng` | B | infra | U | 1 | I-- |  | realism/src/process.ts rng L14 |
| `realism.infra.scheduler` | B | infra | U | 4 | IT- | DUP-33 | realism/src/scheduler.ts Scheduler.run L18 |
| `realism.infra.still_scenario` | B | infra | M | 4 | IT- | DUP-8 | realism/src/lab/still.ts runStill L42 |
| `realism.infra.thermometer_drift` | B | A | M | 5 | IT- |  | realism/src/process.ts thermometerProcess L204 |
| `realism.infra.trace` | B | infra | U | 1 | IT- |  | realism/src/trace.ts Trace |
| `realism.infra.world_conservation` | B | infra | U | 1 | IT- |  | realism/src/world.ts conserve L25, conserveElements L42, afterStep L51 |
| `realism.materials.deformation_fracture_decay` | P | A | U | ? | --- | DUP-9 | realism/PHASES-6-PLUS.md Phase 9 |
| `realism.mech.articulated_locomotion` | P | A | U | ? | --- |  | realism/PHASES-6-PLUS.md Phase 6 (after rigid) |
| `realism.mech.rigid_body_contact` | P | A | U | ? | --- |  | realism/PHASES-6-PLUS.md Phase 6 |
| `realism.medicine.air_conditions` | B | B | U | 3 | I-- | DUP-25 | realism/src/medicine.ts airConditions L451-481 |
| `realism.medicine.disease_course` | B | B | U | 3 | I-- | DUP-16 DUP-19 DUP-20 | realism/src/medicine.ts diseaseCourse/expose/advanceDays L61,169,402 |
| `realism.medicine.fever_state` | P | B | U | 6 | --- |  | realism/(none) |
| `realism.medicine.healing_multiplier` | B | B | U | 4 | IT- | DUP-16 DUP-17 | realism/src/medicine.ts healingMultiplier/worldHealingFactors L362-385 |
| `realism.medicine.immunity` | B | B | U | 3 | I-- |  | realism/src/medicine.ts immunityRule/recover/treat L75,194 |
| `realism.medicine.pain` | B | B | U | 4 | IT- |  | realism/src/medicine.ts painLevel L430 |
| `realism.medicine.process` | B | infra | U | 4 | IT- |  | realism/src/medicine.ts medicineProcess L509 |
| `realism.medicine.treatment_claims` | B | B | P | 3 | I-- |  | realism/src/medicine.ts CLAIMS/treat L207-272 |
| `realism.medicine.wounds` | B | B | U | 3 | IT- | DUP-36 | realism/src/medicine.ts inflictWound L330-350 |
| `realism.metab.flux_digestion_atp` | P | B | U | ? | --- |  | realism/PHASES-6-PLUS.md Phase 10 |
| `realism.muscular.activation` | B | B | U | 2 | IT- |  | realism/src/muscular.ts muscularActivation L46 |
| `realism.muscular.adaptation_day` | B | B | U | 5 | I-- | DUP-17 | realism/src/muscular.ts adaptMuscleDay L159-181 |
| `realism.muscular.banister` | B | B | U | 2 | I-- | DUP-13 DUP-14 DUP-18 | realism/src/muscular.ts muscularBanisterDay L185-192 |
| `realism.muscular.endurance_reference` | B | B | U | 3 | I-- |  | realism/src/muscular.ts muscularEnduranceReference L96 |
| `realism.muscular.fatigue_3cc` | B | B | U | 2 | IT- | DUP-13 | realism/src/muscular.ts stepMuscleFatigue L58-93 |
| `realism.muscular.limb_strength` | P | B | P | 6 | --- |  | realism/data/library/muscular.json limb_strength; muscularOutputs L200 |
| `realism.muscular.tendon_injury` | P | B | U | 3 | --- |  | realism/data/library/muscular.json tendons, injuries; createMuscularState L131 |
| `realism.muscular.training_stimuli` | B | B | U | 5 | I-- |  | realism/src/muscular.ts muscularStimuli L137-150 |
| `realism.neurology.alcohol_withdrawal_stage` | B | B | U | 5 | I-- |  | realism/src/neurology.ts L641-646 |
| `realism.neurology.baseline_drivers` | B | B | M | 5 | IT- | DUP-17 UNIT-15 | realism/src/neurology.ts baselineMoves L159-189 |
| `realism.neurology.breathing_drive` | B | B | U | 2 | IT- |  | realism/src/neurology.ts breathingDrive L449 |
| `realism.neurology.circuits` | B | B | M | 5 | IT- | DUP-38 | realism/src/neurology.ts neuroCircuits/circuitRead L405-430, process L627-639 |
| `realism.neurology.occupancy` | B | B | U | 1 | I-- |  | realism/src/neurology.ts occupancy L321 |
| `realism.neurology.pk` | B | B | U | 1 | I-- | DUP-22 | realism/src/neurology.ts pkStep/concentration/dose L289-318,491 |
| `realism.neurology.sleep_wake` | B | B | U | 5 | IT- | DUP-12 | realism/src/neurology.ts L539-543 |
| `realism.neurology.tolerance_dependence_withdrawal` | B | B | U | 5 | I-- |  | realism/src/neurology.ts toleranceStep/recoveryStep/dependence/rebound L346-358; process L |
| `realism.neurology.tone` | B | B | U | 4 | IT- |  | realism/src/neurology.ts neurologyProcess L580-623 |
| `realism.nutri.rmr_mifflin` | B | B | U | 2 | I-- | DUP-24 | realism/src/physics.ts restingMetabolicRate L93 |
| `realism.nutrition.absorption` | B | B | M | 4 | IT- |  | realism/src/nutrition.ts absorbedFraction L289-309 |
| `realism.nutrition.body_mass` | B | B | U | 2 | IT- | DUP-22 | realism/src/nutrition.ts L455-461; GLYCOGEN_BOUND_WATER L383 |
| `realism.nutrition.eat_meal` | B | B | U | 4 | IT- | DUP-21 | realism/src/nutrition.ts eatMeal L314-343 |
| `realism.nutrition.energy_store` | B | B | U | 1 | IT- | DUP-22 | realism/src/nutrition.ts closeDay L440-468 |
| `realism.nutrition.hunger_fullness` | D | B | U | 6 | --- | DUP-49 | realism/data/library/nutrition.json body_composition |
| `realism.nutrition.pools` | B | B | U | 4 | IT- | DUP-16 UNIT-1 UNIT-10 | realism/src/nutrition.ts closeDay L400-438; pools() L149 |
| `realism.nutrition.requirement` | B | B | U | 2 | IT- |  | realism/src/nutrition.ts dailyNeed L74 |
| `realism.nutrition.starvation_limit` | B | B | U | 4 | I-- | DUP-15 DUP-21 | realism/src/nutrition.ts L474 |
| `realism.optics.light_visibility` | P | A | U | ? | --- | DUP-37 | realism/PHASES-6-PLUS.md Phase 8 |
| `realism.physiology.acclimatisation` | B | B | U | 4 | I-- |  | realism/src/physiology.ts closeDay L268 |
| `realism.physiology.ageing_curves` | D | B | U | 2 | --- | DUP-17 | realism/data/library/physiology.json ageing |
| `realism.physiology.alertness` | B | B | U | 4 | IT- | DUP-12 | realism/src/physiology.ts L397 |
| `realism.physiology.banister_table` | D | B | U | 2 | --- | DUP-18 | realism/data/library/physiology.json banister; no physiology.ts code |
| `realism.physiology.body_area` | B | B | U | 2 | IT- |  | realism/src/physiology.ts bodyArea L55 |
| `realism.physiology.circadian` | B | B | M | 3 | IT- |  | realism/src/physiology.ts circadianRow L180 |
| `realism.physiology.cold_water` | P | B | U | 2 | --- | DUP-7 | realism/data/library/physiology.json cold_water |
| `realism.physiology.core_state` | B | B | U | 2 | IT- | DUP-7 | realism/src/physiology.ts coreRow L188 |
| `realism.physiology.energy_expenditure` | B | B | U | 1 | IT- | DUP-5 | realism/src/physiology.ts physiologyProcess L298-310 |
| `realism.physiology.fatigue_met_hours` | B | B | U | 5 | IT- | DUP-13 | realism/src/physiology.ts L311, overnight L211 |
| `realism.physiology.heat_balance` | B | B | U | 1 | IT- |  | realism/src/physiology.ts L43-70, 326-336 |
| `realism.physiology.hydration_band` | B | B | M | 2 | IT- | DUP-15 | realism/src/physiology.ts hydrationRow L200; crises L406 |
| `realism.physiology.metabolic_water` | B | B | U | 1 | IT- |  | realism/src/physiology.ts L344 |
| `realism.physiology.pal` | B | B | U | 1 | IT- |  | realism/src/physiology.ts closeDay L272 |
| `realism.physiology.rmr` | B | B | U | 2 | IT- | DUP-24 UNIT-5 | realism/src/physiology.ts bodyRmr L226; physics.ts restingMetabolicRate |
| `realism.physiology.sleep_debt` | B | B | U | 2 | IT- | DUP-12 | realism/src/physiology.ts overnight/sleepDebtRow L177,211 |
| `realism.physiology.sweat` | B | B | U | 4 | ITv | DUP-3 DUP-6 | realism/src/physiology.ts L331-340 |
| `realism.physiology.urine` | B | B | U | 2 | IT- |  | realism/src/physiology.ts L52, 346-347 |
| `realism.physiology.water_balance` | B | B | U | 1 | IT- | DUP-22 | realism/src/physiology.ts ingest L248; L337-376 |
| `realism.physiology.wbgt_core_drift` | B | B | U | 2 | IT- | DUP-15 | realism/src/physiology.ts L320-324, wbgtCeiling L171 |
| `realism.population.cohort_tick` | B | F | U | 4 | I-- | DUP-19 DUP-41 | realism/src/population.ts tick L128-223 |
| `realism.population.epidemic` | B | F | U | 4 | I-- | DUP-19 DUP-20 | realism/src/population.ts startEpidemic/tick L71,149-180 |
| `realism.population.famine` | B | F | U | 5 | I-- | DUP-19 DUP-21 | realism/src/population.ts L138-146,203 |
| `realism.population.labour` | B | D | U | 5 | I-- | DUP-26 DUP-41 | realism/src/population.ts populationOutputs L240 |
| `realism.population.migration` | B | F | P | 6 | I-- | DUP-41 | realism/src/population.ts settlersPerDay/tick L123,189-195 |
| `realism.records.cellular_state` | P | B | U | ? | --- |  | realism (Life & Species; planned; ENGINES.md 'Resolution of the biology', Rex 2026-10-30) |
| `realism.records.genetic_profile` | P | B | U | ? | --- |  | realism (Life & Species; planned; ENGINES.md 'Resolution of the biology', Rex 2026-10-30) |
| `realism.records.organism_state` | P | B | U | ? | --- |  | realism (Life & Species; planned; ENGINES.md 'Resolution of the biology', Rex 2026-10-30) |
| `realism.thermo.boiling` | B | A | U | 4 | IT- |  | realism/src/process.ts boilingProcess L125 |
| `realism.thermo.brick_wall_constants` | B | A | M | ? | I-- | DUP-10 | realism/src/physics.ts BRICK_WALL L119 |
| `realism.thermo.condensation_ntu` | B | A | U | 4 | IT- |  | realism/src/process.ts condensationProcess L157 |
| `realism.thermo.convective_losses` | B | A | U | 4 | I-- |  | realism/src/process.ts lossesProcess L66 |
| `realism.thermo.counterflow_ntu` | B | A | U | 1 | IT- |  | realism/src/physics.ts counterflowEffectiveness L125 |
| `realism.thermo.heat_flow_UA` | B | A | U | 1 | IT- |  | realism/src/physics.ts heatFlow L63 |
| `realism.thermo.metabolic_heat` | B | B | U | 1 | I-- | DUP-5 UNIT-5 | realism/src/physics.ts metabolicHeat L81 |
| `realism.thermo.mixture_distillation` | P | A | U | ? | --- |  | realism/data/library/science.json separations; no code |
| `realism.thermo.natural_convection_cylinder` | B | A | U | 1 | IT- |  | realism/src/physics.ts condenserWaterCoefficient L142 |
| `realism.thermo.room_envelope_walls` | B | A | U | 4 | I-- |  | realism/src/process.ts wallsProcess L108 |
| `realism.thermo.surface_evaporation` | B | A | U | 1 | I-- | DUP-6 | realism/src/physics.ts surfaceEvaporationKgPerS L107; process.ts evaporationProcess L82 |
| `realism.thermo.water_boiling_point` | B | A | U | 1 | I-v |  | realism/src/physics.ts waterBoilingPoint L24 |
| `realism.thermo.water_latent_heat` | B | A | U | 1 | IT- | DUP-3 | realism/src/physics.ts waterLatentHeat L31 |
| `realism.thermo.water_vapour_pressure` | B | A | U | 1 | IT- | DUP-2 | realism/src/physics.ts waterVapourPressure L17 |
| `realism.waste.sanitation_decomposition` | P | B | U | ? | --- | DUP-45 | realism/PHASES-6-PLUS.md Phase 11 |

### settlement (24)

| id | st | dom | sc | ev | V&V | overlaps | home |
|---|---|---|---|---|---|---|---|
| `settlement.assign.workforce` | B | F | U | 4 | I-- |  | settlement/src/commands.ts assign/unassign/hire/dismiss |
| `settlement.authority.office_powers` | B | E | U | 4 | I-- | DUP-42 | settlement/src/commands.ts createOffice/appoint/grantPermission/revokePermission; context. |
| `settlement.building.condition_decay` | B | D | U | 5 | ITv | DUP-9 | settlement/src/tick/decay.ts decay(); config decayClasses, exposure, decayShares (settleme |
| `settlement.building.condition_output_factor` | B | D | U | 5 | I-- |  | settlement/src/config.ts bandOf; tick/production.ts |
| `settlement.business.open` | B | D | U | 4 | I-- |  | settlement/src/commands.ts openBusiness/closeBusiness/setOperator/setManager/setLines/setP |
| `settlement.business.staffing` | B | D | U | 4 | IT- |  | settlement/src/tick/staffing.ts staffing(); queries.economic |
| `settlement.expiry` | B | E | U | 4 | IT- |  | settlement/src/tick/expiry.ts expiry() |
| `settlement.infra.id_scheme` | B | infra | U | 4 | I-- | DUP-32 | settlement/src/ids.ts mint(), isPool() |
| `settlement.infra.reducer_replay` | B | infra | U | 4 | I-- | DUP-32 | settlement/src/reduce.ts reduce(), Runner |
| `settlement.infra.tick_scheduler` | B | infra | U | 4 | IT- | DUP-33 | settlement/src/tick/index.ts, src/config.ts TICK_ORDER |
| `settlement.land.parcel_split_merge` | B | F | U | 4 | I-- |  | settlement/src/commands.ts splitParcel/mergeParcels |
| `settlement.ledger.pay` | B | D | U | 1 | IT- | DUP-30 DUP-43 | settlement/src/context.ts pay/record/accountOf; commands.ts credit/debit/payCommand; queri |
| `settlement.production.constraint_Q` | B | D | U | 4 | IT- | DUP-27 | settlement/src/tick/production.ts production() |
| `settlement.production.equipment_cap` | B | D | U | 4 | IT- | DUP-30 | settlement/src/tick/production.ts (equipment loop) |
| `settlement.production.labour_cap` | B | D | U | 4 | IT- | DUP-26 UNIT-11 | settlement/src/tick/production.ts (labourDays loop) |
| `settlement.project.construction` | B | D | U | 4 | IT- |  | settlement/src/tick/projects.ts, src/commands.ts startProject/completeProject/advanceProje |
| `settlement.project.layout_versions` | B | infra | U | 4 | I-- |  | settlement/src/commands.ts completeProject/nextLayout/checkPlacements/setLayout |
| `settlement.property.lease` | B | D | U | 4 | I-- |  | settlement/src/commands.ts leaseTitle/endLease/setRent; src/tick/wages.ts wages() |
| `settlement.property.right_of_use` | B | E | U | 4 | I-- |  | settlement/src/context.ts hasRightOfUse |
| `settlement.property.title_transfer` | B | E | U | 4 | I-- |  | settlement/src/commands.ts sell/transfer/inherit/changeHolder |
| `settlement.query.fixtures` | B | infra | U | 4 | I-- |  | settlement/src/queries.ts hasFixture/physical/economic/production |
| `settlement.scope_added.cemetery_sanitation_landuse` | P | F | M | 5 | --- | DUP-45 | settlement/PACKAGES.md s8 |
| `settlement.wage.pay` | B | D | U | 4 | IT- | DUP-28 DUP-42 | settlement/src/tick/wages.ts wages() |
| `settlement.wage.set_wage` | B | D | U | 4 | I-- | DUP-28 | settlement/src/commands.ts setWage |

### economy (22)

| id | st | dom | sc | ev | V&V | overlaps | home |
|---|---|---|---|---|---|---|---|
| `economy.accounting.view` | B | D | U | 1 | IT- |  | economy/src/queries.ts accounts() |
| `economy.burial_waste` | P | D | U | 5 | --- | DUP-45 | economy/PLAN.md step 12; README 'Scope added' |
| `economy.consumption.demand` | B | D | U | 4 | IT- | DUP-21 DUP-31 | economy/src/tick/index.ts consumption() |
| `economy.example.three_ports` | B | D | U | 5 | I-- |  | economy/examples/three-ports.ts |
| `economy.infra.id_scheme` | B | infra | U | 4 | I-- | DUP-32 | economy/src/ids.ts |
| `economy.infra.reducer_replay` | B | infra | U | 4 | I-- | DUP-32 | economy/src/reduce.ts, src/context.ts |
| `economy.infra.tick_scheduler` | B | infra | U | 4 | IT- | DUP-33 | economy/src/tick/index.ts tick(); config TICK_ORDER |
| `economy.inventory.holdings` | B | D | U | 1 | IT- |  | economy/src/state.ts Inventory; context.ts adjust/stockOf; commands.ts openInventory/addSt |
| `economy.labour.wage_quote` | B | D | U | 5 | IT- | DUP-28 | economy/src/labour.ts wageQuote/wageQuotes |
| `economy.market.five_numbers` | B | D | U | 3 | I-- |  | economy/src/state.ts MarketGood; commands.ts setMarketGood |
| `economy.market.observed_production` | B | D | U | 4 | I-- | DUP-27 | economy/src/tick/index.ts production() (roll), commands.ts produce |
| `economy.material.available` | B | D | U | 4 | IT- |  | economy/src/material.ts availableUnits |
| `economy.material.produce` | B | D | U | 4 | IT- | DUP-27 | economy/src/commands.ts produce; src/material.ts consumeInputs |
| `economy.org.organisation` | B | F | U | 4 | IT- |  | economy/src/commands.ts openOrganisation |
| `economy.price.king_davenant` | P | D | M | 3 | --- |  | economy/RESEARCH.md s1 |
| `economy.price.rule` | B | D | U | 4 | IT- | DUP-43 | economy/src/queries.ts price(); config PriceRule; tick prices() |
| `economy.production.abstract_market` | B | D | U | 4 | IT- | DUP-27 | economy/src/tick/index.ts production() |
| `economy.recipe.definition` | B | D | U | 4 | I-- |  | economy/src/state.ts Good/Recipe; commands.ts defineGood/defineRecipe |
| `economy.shortage.event` | B | D | U | 4 | IT- | DUP-31 | economy/src/tick/index.ts consumption(); src/queries.ts shortage() |
| `economy.spoilage` | B | B | U | 4 | IT- | DUP-9 | economy/src/tick/index.ts spoilage() |
| `economy.trade.shipment` | B | D | U | 4 | IT- |  | economy/src/commands.ts ship(); tick shipments() |
| `economy.trade.trade` | B | D | U | 4 | IT- |  | economy/src/commands.ts trade() |

### cognition (18)

| id | st | dom | sc | ev | V&V | overlaps | home |
|---|---|---|---|---|---|---|---|
| `cognition.attention.allocate` | P | C | U | 4 | --- |  | cognition/DESIGN.md (design approved by Rex 2026-10-30, cognition 0291ac8; lane running) |
| `cognition.belief.update` | P | C | U | 4 | --- |  | cognition/DESIGN.md (design approved by Rex 2026-10-30, cognition 0291ac8; lane running) |
| `cognition.communication.language` | P | C | U | ? | --- |  | cognition/DESIGN.md (design approved by Rex 2026-10-30, cognition 0291ac8; lane running) |
| `cognition.decision.evaluate` | P | C | U | 4 | --- |  | cognition/DESIGN.md (design approved by Rex 2026-10-30, cognition 0291ac8; lane running) |
| `cognition.decision.generate` | P | C | U | 4 | --- |  | cognition/DESIGN.md (design approved by Rex 2026-10-30, cognition 0291ac8; lane running) |
| `cognition.decision.select` | P | C | U | 4 | --- | DUP-49 | cognition/DESIGN.md (design approved by Rex 2026-10-30, cognition 0291ac8; lane running) |
| `cognition.emotion.appraisal` | P | C | U | ? | --- |  | cognition/DESIGN.md (design approved by Rex 2026-10-30, cognition 0291ac8; lane running) |
| `cognition.goals.objectives` | P | C | U | 4 | --- |  | cognition/DESIGN.md (design approved by Rex 2026-10-30, cognition 0291ac8; lane running) |
| `cognition.learning.attribution` | P | C | U | 5 | --- |  | cognition/DESIGN.md (design approved by Rex 2026-10-30, cognition 0291ac8; lane running) |
| `cognition.learning.outcome` | P | C | U | 4 | --- |  | cognition/DESIGN.md (design approved by Rex 2026-10-30, cognition 0291ac8; lane running) |
| `cognition.memory.episodic` | P | C | U | 4 | --- |  | cognition/DESIGN.md (design approved by Rex 2026-10-30, cognition 0291ac8; lane running) |
| `cognition.needs.drive` | P | C | U | 4 | --- | DUP-49 | cognition/DESIGN.md (design approved by Rex 2026-10-30, cognition 0291ac8; lane running) |
| `cognition.perception.detect` | P | C | U | 4 | --- |  | cognition/DESIGN.md (design approved by Rex 2026-10-30, cognition 0291ac8; lane running) |
| `cognition.personality.eight_function` | P | C | U | 5 | --- |  | cognition/DESIGN.md (design approved by Rex 2026-10-30, cognition 0291ac8; lane running) |
| `cognition.personality.slot` | P | C | U | ? | --- |  | cognition/DESIGN.md (design approved by Rex 2026-10-30, cognition 0291ac8; lane running) |
| `cognition.planning.lookahead` | P | C | U | ? | --- |  | cognition/DESIGN.md (design approved by Rex 2026-10-30, cognition 0291ac8; lane running) |
| `cognition.relationship.trust` | P | C | U | ? | --- |  | cognition/DESIGN.md (design approved by Rex 2026-10-30, cognition 0291ac8; lane running) |
| `cognition.skill.practice` | P | C | U | ? | --- |  | cognition/DESIGN.md (design approved by Rex 2026-10-30, cognition 0291ac8; lane running) |

### shared (13)

| id | st | dom | sc | ev | V&V | overlaps | home |
|---|---|---|---|---|---|---|---|
| `economy.recipe.rates` | B | D | U | 4 | IT- | DUP-26 DUP-30 UNIT-11 | economy/src/material.ts materialProvider.rates; settlement/src/providers.ts MaterialProvid |
| `shared.contract.day_order` | B | infra | U | 4 | IT- | DUP-33 | settlement/CONTRACTS.md s9 |
| `shared.contract.inventory_ownership` | B | D | U | 4 | -T- |  | settlement/CONTRACTS.md s2 and s15 (= economy/CONTRACTS.md) |
| `shared.contract.labour_supply` | P | D | U | 4 | --- |  | settlement/CONTRACTS.md s16 (= economy); declaration in settlement/src/providers.ts and ec |
| `shared.contract.labour_supply_provider` | D | C | U | 4 | --- | DUP-26 DUP-29 | economy/src/providers.ts |
| `shared.contract.ledger_provider` | B | D | U | 1 | IT- | DUP-30 | economy/src/providers.ts LedgerProvider, StubLedger; settlement/src/commands.ts payCommand |
| `shared.contract.material_provider` | B | D | U | 4 | IT- |  | settlement/src/providers.ts MaterialProvider; economy/src/material.ts materialProvider(run |
| `shared.contract.population_provider` | D | B | U | 4 | --- |  | economy/src/providers.ts |
| `shared.contract.price_provider` | D | D | U | 4 | --- | DUP-43 | settlement/CONTRACTS.md s4a; settlement src/providers.ts PriceProvider |
| `shared.contract.settlement_reader` | B | D | U | 4 | IT- |  | settlement/CONTRACTS.md s4b; economy/src/providers.ts SettlementReader |
| `shared.contract.transport_provider` | D | A | U | 4 | --- |  | economy/src/providers.ts |
| `shared.labour.provider_draw` | B | D | U | 4 | I-- | DUP-26 DUP-29 | settlement/src/providers.ts LabourProvider; economy/src/providers.ts LabourSupplyProvider |
| `shared.utility.provider` | D | A | U | 5 | --- |  | settlement/src/providers.ts UtilityProvider/StubUtilities; tick/production.ts |

### pirate-ship (102)

| id | st | dom | sc | ev | V&V | overlaps | home |
|---|---|---|---|---|---|---|---|
| `pirate.align.faction_influence` | P | E | P | 6 | --- |  | ps/balance/ALIGNMENT.md §10 third/fourth/sixth run-down |
| `pirate.align.fates_forms` | P | B | P | 6 | --- |  | ps/combat/COMBAT.md §4e; ALIGNMENT.md seventh run-down |
| `pirate.align.gates_conditions` | B | F | P | 6 | I-- |  | Games/RPG's/pirate-ship/web/src/alignment/gates.ts, conditions.ts; doc ALIGNMENT.md §5,§7 |
| `pirate.align.institution_transform` | B | E | P | 6 | I-- |  | Games/RPG's/pirate-ship/web/src/alignment/institutions.ts develop/markReturned/sleep; doc  |
| `pirate.align.perfect_town` | B | F | P | 6 | I-- | DUP-39 | Games/RPG's/pirate-ship/web/src/alignment/town.ts isPerfect; endings.ts ending; doc ALIGNM |
| `pirate.align.reducer` | B | infra | P | 4 | I-- |  | Games/RPG's/pirate-ship/web/src/alignment/engine.ts reduce |
| `pirate.align.response_chart` | B | C | P | 6 | I-- | DUP-46 | Games/RPG's/pirate-ship/web/src/alignment/charts.ts respond/reachable; engine.ts event; do |
| `pirate.align.square_classify` | B | C | P | 6 | I-- |  | Games/RPG's/pirate-ship/web/src/alignment/square.ts classify; doc ps/balance/ALIGNMENT.md  |
| `pirate.align.step` | B | C | P | 6 | I-- | DUP-33 | Games/RPG's/pirate-ship/web/src/alignment/square.ts step; doc ALIGNMENT.md §2 |
| `pirate.align.town_aggregate` | B | F | P | 6 | I-- | DUP-39 | Games/RPG's/pirate-ship/web/src/alignment/town.ts townPosition; doc ALIGNMENT.md §6 |
| `pirate.align.witness` | B | F | P | 6 | I-- |  | Games/RPG's/pirate-ship/web/src/alignment/engine.ts; doc ALIGNMENT.md §4 |
| `pirate.atm.active_regions` | B | A | M | 4 | I-- |  | ps/world/ATMOSPHERE.md §4; GAS_DYNAMICS.md §2 'Return to baseline' |
| `pirate.atm.scenarios` | B | A | P | 3 | I-- |  | ps/world/ATMOSPHERE.md §5; adapters Games/RPG's/pirate-ship/web/src/world/adapters/places. |
| `pirate.body.accident_chance` | D | B | P | 5 | --- |  | ps/body/BODY.md §2 |
| `pirate.body.agility_today` | D | B | M | 4 | --- |  | ps/body/BODY.md §2 |
| `pirate.body.appearance` | D | infra | P | 6 | --- |  | ps/body/BODY.md §2 |
| `pirate.body.constitution_today` | D | B | M | 4 | --- |  | ps/body/BODY.md §2 |
| `pirate.body.dexterity_today` | D | B | M | 4 | --- |  | ps/body/BODY.md §2 |
| `pirate.body.endurance_pool` | D | B | P | 4 | --- | DUP-13 DUP-14 DUP-47 | ps/body/BODY.md §3; PHYSIOLOGY.md §6 |
| `pirate.body.head_attrs_today` | D | C | M | 4 | --- | DUP-37 | ps/body/BODY.md §2 |
| `pirate.body.movement` | D | B | P | 4 | --- |  | ps/body/BODY.md §2; MUSCULAR §8 |
| `pirate.body.overnight_tick` | D | infra | M | 4 | --- | DUP-33 | ps/body/BODY.md §4 |
| `pirate.body.poise_nerve_efficiency` | D | C | P | 6 | --- |  | ps/body/BODY.md §2 |
| `pirate.body.record` | D | B | U | 6 | --- |  | ps/body/BODY.md §1 |
| `pirate.body.reflexes_today` | D | B | M | 4 | --- |  | ps/body/BODY.md §2 |
| `pirate.body.sim_level` | P | infra | U | 4 | --- |  | ps/body/BODY.md §8 |
| `pirate.body.state_multiplier` | D | C | P | 6 | --- | DUP-38 | ps/body/BODY.md §2 row 'state' |
| `pirate.body.states_of_being` | D | B | P | 6 | --- |  | ps/body/BODY.md §6 |
| `pirate.body.strength_today` | D | B | M | 4 | --- | DUP-15 | ps/body/BODY.md §2 row Strength_today |
| `pirate.body.work_capacity` | D | B | P | 4 | --- | DUP-15 | ps/body/BODY.md §2 |
| `pirate.combat.detection` | D | B | M | 5 | --- |  | ps/combat/COMBAT.md §6 |
| `pirate.combat.endurance_efficiency` | D | B | P | 6 | --- | DUP-13 DUP-47 | ps/combat/COMBAT.md §6a |
| `pirate.combat.five_variable_contest` | P | B | P | 5 | --- |  | ps/combat/COMBAT.md §3 |
| `pirate.combat.functional_capacity` | B | B | M | 4 | I-- | DUP-15 | Games/RPG's/pirate-ship/web/src/world/adapters/stats.ts capabilityToday |
| `pirate.combat.hit_and_location` | D | B | P | 5 | --- |  | ps/combat/COMBAT.md §3 |
| `pirate.combat.muscle_model` | B | B | U | 3 | I-- |  | ps/combat/COMBAT.md §4b; realism/src/muscular.ts |
| `pirate.combat.nutrition_loadout` | P | D | P | 6 | --- |  | ps/combat/COMBAT.md §7 |
| `pirate.combat.poise_flinch` | D | B | P | 6 | --- |  | ps/combat/COMBAT.md §6a |
| `pirate.combat.regional_damage_dip` | B | B | M | 4 | I-- | DUP-36 DUP-37 | Games/RPG's/pirate-ship/web/src/world/adapters/medicine.ts dipFactor, suppliedFactors; doc |
| `pirate.combat.skill_band_unlocks` | P | C | P | 6 | --- |  | ps/combat/COMBAT.md §5 |
| `pirate.combat.wound_ladder` | P | B | U | 5 | --- | DUP-36 | ps/combat/COMBAT.md §4 |
| `pirate.doc.circulation.clotting` | D | B | U | 3 | --- |  | ps/body/CIRCULATION.md §4 |
| `pirate.doc.circulation.delivery_failures` | D | B | U | 1 | --- |  | ps/body/CIRCULATION.md §3 |
| `pirate.doc.circulation.electrolytes` | P | B | U | 2 | --- |  | ps/body/CIRCULATION.md §5 |
| `pirate.doc.medicine.hygiene` | P | B | M | 5 | --- |  | ps/body/MEDICINE.md §6 |
| `pirate.doc.muscular.injuries` | D | B | U | 3 | --- |  | ps/body/MUSCULAR.md §6 |
| `pirate.eco.calendar` | D | A | P | 3 | --- | DUP-35 | ps/world/ECOLOGY.md §5 |
| `pirate.eco.crop_rain` | B | A | U | 4 | I-- |  | ps/world/ECOLOGY.md §3; code ecology.ts dryYearFactor |
| `pirate.eco.crops_table` | D | D | M | 3 | --- | DUP-26 UNIT-14 | ps/world/ECOLOGY.md §2 table ecology.crops |
| `pirate.eco.nesting_females` | B | B | P | 4 | I-- |  | ps/world/ECOLOGY.md §1; code ecology.ts takeNestingFemales |
| `pirate.env.climate_monthly` | B | A | P | 2 | I-- | DUP-34 DUP-35 | ps/world/ENVIRONMENT.md §1 table environment.climate |
| `pirate.env.currents` | D | A | P | 2 | --- |  | ps/world/ENVIRONMENT.md §4 |
| `pirate.env.hurricane_approach` | D | A | P | 5 | --- |  | ps/world/ENVIRONMENT.md §2 |
| `pirate.env.period_hurricane_factor` | B | A | P | 3 | --- |  | ps/world/ENVIRONMENT.md §1 table period_climate; code Games/RPG's/pirate-ship/web/src/worl |
| `pirate.env.rain_catch` | D | A | P | 4 | --- |  | ps/world/ENVIRONMENT.md §2 |
| `pirate.env.sun_sunburn` | B | A | M | 3 | I-- |  | ps/world/ENVIRONMENT.md §6; code realism environment.ts sunHours, sunburnFraction |
| `pirate.env.weather_markov` | B | A | M | 5 | I-- | DUP-34 | ps/world/ENVIRONMENT.md §2; code Games/RPG's/pirate-ship/web/src/world/adapters/places.ts  |
| `pirate.env.wind_sailing` | D | A | M | 4 | --- |  | ps/world/ENVIRONMENT.md §3-4 (PIRATE.md §5a owns base speed) |
| `pirate.gas.respiratory_quotient` | B | B | U | 2 | I-- |  | ps/world/GAS_DYNAMICS.md §2 |
| `pirate.goods.cask_estimates` | D | D | P | 3 | --- |  | ps/economy/GOODS.md §1j |
| `pirate.goods.classes` | P | D | P | 6 | --- |  | ps/economy/GOODS.md §3 |
| `pirate.goods.open_items` | P | D | M | ? | --- |  | ps/economy/GOODS.md 'Open for Rex' 1-8 |
| `pirate.goods.region_escalation` | P | G | P | 6 | --- |  | ps/economy/REGIONS.md §5 |
| `pirate.goods.region_isolation` | P | D | P | 6 | --- |  | ps/economy/REGIONS.md §4-5 |
| `pirate.goods.skill_bands` | D | C | P | 6 | --- |  | ps/economy/GOODS.md §3c |
| `pirate.muscular.effort_required` | D | B | M | 4 | --- |  | ps/body/MUSCULAR.md §3 |
| `pirate.muscular.gym` | D | B | P | 6 | --- |  | ps/body/MUSCULAR.md §7 |
| `pirate.muscular.limb_strength` | P | B | P | 4 | --- |  | ps/body/MUSCULAR.md §8 |
| `pirate.nutr.boosts` | D | B | P | 6 | --- |  | ps/body/NUTRITION.md §7 |
| `pirate.nutr.cask_water` | P | D | P | 5 | --- |  | ps/body/NUTRITION.md §6 |
| `pirate.nutr.hunger_appetite` | D | B | M | 5 | --- | DUP-49 | ps/body/NUTRITION.md §4 |
| `pirate.phys.ageing_curves` | D | B | M | 2 | --- | DUP-17 | ps/body/PHYSIOLOGY.md §8 |
| `pirate.phys.fatigue_day` | D | B | M | 4 | --- | DUP-13 DUP-47 | ps/body/PHYSIOLOGY.md §6 |
| `pirate.phys.seasickness` | D | B | M | 2 | --- |  | ps/body/PHYSIOLOGY.md §9 |
| `pirate.pop.ageing` | B | B | U | 4 | I-- |  | ps/world/POPULATION.md §3; code population.ts ageingRates |
| `pirate.pop.recruit_pool` | D | F | P | 6 | --- | DUP-41 | ps/world/POPULATION.md §3 |
| `pirate.pop.vital_rates` | B | F | P | 3 | I-- | DUP-41 | ps/world/POPULATION.md §1 |
| `pirate.psych.madness_triggers` | D | C | P | 6 | --- |  | ps/body/PSYCHOLOGY.md §2 |
| `pirate.psych.pushes` | D | C | P | 5 | --- | DUP-38 DUP-46 | ps/body/PSYCHOLOGY.md §1 |
| `pirate.sci.anomaly_plug` | D | G | P | 6 | --- |  | ps/science/TECHNOLOGY.md §1 |
| `pirate.sci.assembly_pipeline` | D | A | U | 4 | --- |  | ps/science/SCIENTIFIC_EQUIPMENT.md §1,§3; data realism/data/library/equipment.json (313 ro |
| `pirate.sci.chem_possibility` | D | A | U | 1 | --- |  | ps/science/CHEMISTRY.md §1,§3-4 |
| `pirate.sci.discovery_states` | D | C | U | 5 | --- |  | ps/science/DISCOVERY.md §2-3 |
| `pirate.sci.journal_anomaly_label` | D | infra | P | 6 | --- |  | ps/science/JOURNAL.md §1-2 |
| `pirate.sci.knowledge_rule` | D | G | M | 5 | --- |  | ps/economy/GOODS.md §3f; science/DISCOVERY.md §3 step 6 |
| `pirate.sci.tech_availability` | D | G | P | 5 | --- |  | ps/science/TECHNOLOGY.md §1; SCIENTIFIC_EQUIPMENT.md catalogue state (common 101, rare 83, |
| `pirate.sci.unknown_rule` | D | infra | U | 6 | --- |  | ps/science/CHEMISTRY.md §4 |
| `pirate.stats.ageing_max` | D | B | M | 4 | --- | DUP-17 | ps/STATS.md §1 'Age (proposed)' |
| `pirate.stats.attribute_catalogue` | D | B | M | 6 | --- |  | ps/STATS.md §1 table |
| `pirate.stats.attribute_value` | D | B | M | 6 | --- |  | ps/STATS.md §1 |
| `pirate.stats.claims` | D | C | P | 6 | --- |  | ps/STATS.md §2 |
| `pirate.stats.function_attributes` | D | C | P | 6 | --- |  | ps/STATS.md §1 'functions as attributes' |
| `pirate.stats.learning_gain` | D | C | P | 6 | --- |  | ps/STATS.md §4 'Earlier draft' |
| `pirate.stats.performance` | D | C | P | 6 | --- | DUP-38 | ps/STATS.md §4 |
| `pirate.stats.personality_sliders` | D | C | P | 6 | --- | DUP-46 | ps/STATS.md §3 |
| `pirate.stats.personality_type` | D | C | P | 6 | --- | DUP-46 | ps/STATS.md §0 |
| `pirate.stats.relationships` | D | F | P | 6 | --- |  | ps/STATS.md §5 |
| `pirate.stats.skill_attribute_map` | D | C | P | 6 | --- |  | ps/STATS.md §2 table |
| `pirate.stats.skill_level` | D | C | P | 6 | --- |  | ps/STATS.md §2 |
| `pirate.stats.skill_rust` | D | C | P | 6 | --- |  | ps/STATS.md §2 |
| `pirate.stats.talent` | D | C | P | 6 | --- |  | ps/STATS.md §2 |
| `pirate.web.economy_settlement_bridge` | B | infra | P | 4 | I-- |  | Games/RPG's/pirate-ship/web/src/economy/providers.ts runDay; settlement/bridge.ts fold; lo |

## Restatements (91): docs and adapters that restate an owned mechanism

Each points at its owner. Edit the owner, never the restatement's formula; the doc should cite the owner's id.

| restatement | restates (owner) | overlaps | home |
|---|---|---|---|
| `pirate.atm.alveolar_gas` | `realism.gas.alveolar_po2` |  | ps/world/ATMOSPHERE.md §2 + body/CIRCULATION.md §1a (referenced) |
| `pirate.atm.baseline_composition` | `realism.gas.room_box` |  | ps/world/ATMOSPHERE.md §1 (table atmosphere.baseline) |
| `pirate.atm.pressure_altitude` | `realism.atmos.barometric_pressure` |  | ps/world/ATMOSPHERE.md §2 |
| `pirate.atm.ventilation_ach` | `realism.gas.room_box` | DUP-40 UNIT-3 | ps/world/ATMOSPHERE.md §3-4; GAS_DYNAMICS.md §1 |
| `pirate.doc.anatomy.crisis_death` | `realism.anatomy.crisis_floors` |  | ps/body/ANATOMY.md §3a |
| `pirate.doc.anatomy.damage_repair` | `realism.anatomy.damage_repair` |  | ps/body/ANATOMY.md §3 |
| `pirate.doc.anatomy.organ_cascade` | `realism.anatomy.organ_function` |  | ps/body/ANATOMY.md §1,§3 |
| `pirate.doc.anatomy.species_profile` | `realism.anatomy.species_profile` |  | ps/body/ANATOMY.md §5 |
| `pirate.doc.anatomy.tissue_integrity` | `realism.anatomy.tissue_collagen` |  | ps/body/ANATOMY.md §2 |
| `pirate.doc.circulation.bleeding` | `realism.circulation.bleed_rate` |  | ps/body/CIRCULATION.md §2 |
| `pirate.doc.circulation.blood_volume` | `realism.circulation.normal_blood_volume` |  | ps/body/CIRCULATION.md §1 |
| `pirate.doc.circulation.cardiac_events` | `realism.circulation.hazards` |  | ps/body/CIRCULATION.md §6 |
| `pirate.doc.circulation.do2` | `realism.circulation.o2_delivery` |  | ps/body/CIRCULATION.md §1 |
| `pirate.doc.circulation.regulation_loops` | `realism.circulation.regulation_loops` |  | ps/body/CIRCULATION.md §7 |
| `pirate.doc.circulation.sao2` | `realism.gas.hb_saturation` | DUP-11 | ps/body/CIRCULATION.md §1a |
| `pirate.doc.medicine.air_conditions` | `realism.medicine.air_conditions` |  | ps/body/MEDICINE.md §1a |
| `pirate.doc.medicine.disease_course` | `realism.medicine.disease_course` |  | ps/body/MEDICINE.md §1 |
| `pirate.doc.medicine.exposure` | `realism.medicine.disease_course` |  | ps/body/MEDICINE.md §1 |
| `pirate.doc.medicine.healing` | `realism.medicine.healing_multiplier` |  | ps/body/MEDICINE.md §7 |
| `pirate.doc.medicine.immunity` | `realism.medicine.immunity` |  | ps/body/MEDICINE.md §8 |
| `pirate.doc.medicine.pain_shock` | `realism.medicine.pain` |  | ps/body/MEDICINE.md §4 |
| `pirate.doc.medicine.treatments` | `realism.medicine.treatment_claims` |  | ps/body/MEDICINE.md §5 |
| `pirate.doc.medicine.wounds` | `realism.medicine.wounds` |  | ps/body/MEDICINE.md §2 |
| `pirate.doc.muscular.3cc` | `realism.muscular.fatigue_3cc` |  | ps/body/MUSCULAR.md §4 |
| `pirate.doc.muscular.adaptation` | `realism.muscular.adaptation_day` |  | ps/body/MUSCULAR.md §5,§5a |
| `pirate.doc.nutrition.absorption` | `realism.nutrition.absorption` |  | ps/body/NUTRITION.md §2a |
| `pirate.doc.nutrition.deficiency_pools` | `realism.nutrition.pools` |  | ps/body/NUTRITION.md §5 |
| `pirate.doc.nutrition.energy_balance` | `realism.nutrition.energy_store` |  | ps/body/NUTRITION.md §4 |
| `pirate.doc.nutrition.glycogen_factor` | `realism.nutrition.energy_store` |  | ps/body/NUTRITION.md §4 |
| `pirate.doc.nutrition.requirements` | `realism.nutrition.requirement` |  | ps/body/NUTRITION.md §1 |
| `pirate.doc.nutrition.starvation_stages` | `realism.nutrition.starvation_limit` |  | ps/body/NUTRITION.md §4 |
| `pirate.doc.physiology.acclimatisation` | `realism.physiology.acclimatisation` |  | ps/body/PHYSIOLOGY.md §9 |
| `pirate.doc.physiology.activity_energy` | `realism.physiology.energy_expenditure` | DUP-5 | ps/body/PHYSIOLOGY.md §1 |
| `pirate.doc.physiology.circadian` | `realism.physiology.circadian` |  | ps/body/PHYSIOLOGY.md §3 |
| `pirate.doc.physiology.cold_immersion` | `realism.env.cold_water_immersion` | DUP-7 | ps/body/PHYSIOLOGY.md §5 |
| `pirate.doc.physiology.heat_stress` | `realism.physiology.wbgt_core_drift` |  | ps/body/PHYSIOLOGY.md §4 |
| `pirate.doc.physiology.hydration` | `realism.physiology.hydration_band` |  | ps/body/PHYSIOLOGY.md §5a |
| `pirate.doc.physiology.overnight` | `realism.physiology.core_state` |  | ps/body/PHYSIOLOGY.md §7 |
| `pirate.doc.physiology.rmr` | `realism.physiology.rmr` | DUP-24 | ps/body/PHYSIOLOGY.md §1 |
| `pirate.doc.physiology.sleep_alertness` | `realism.physiology.sleep_debt` | DUP-12 | ps/body/PHYSIOLOGY.md §3 |
| `pirate.doc.physiology.sweat_rate_doc` | `realism.physiology.sweat` |  | ps/body/PHYSIOLOGY.md §4 |
| `pirate.doc.physiology.thermal_cost` | `realism.physiology.heat_balance` |  | ps/body/PHYSIOLOGY.md §1 |
| `pirate.doc.physiology.ventilation` | `realism.gas.ventilation_drive` |  | ps/body/PHYSIOLOGY.md §1a |
| `pirate.eco.cpue_catch` | `realism.eco.fished_out_catch` |  | ps/world/ECOLOGY.md §1; code ecology.ts dailyCatch |
| `pirate.eco.fished_out` | `realism.eco.fished_out_catch` |  | ps/world/ECOLOGY.md §1; code ecology.ts isFishedOut, fishedOutCatchFactor |
| `pirate.eco.recovery` | `realism.eco.msy_collapse_recovery` |  | ps/world/ECOLOGY.md §1; code ecology.ts logisticYears, recoveryYears |
| `pirate.eco.schaefer_stock` | `realism.eco.logistic_stock` |  | ps/world/ECOLOGY.md §1; code realism/src/ecology.ts createStock, stepStock |
| `pirate.eco.soil_fertility` | `realism.eco.soil_fertility` |  | ps/world/ECOLOGY.md §3; code ecology.ts harvest, manure, fallow, erode, clearFor |
| `pirate.env.diurnal_temperature` | `realism.env.diurnal_curve` |  | ps/world/ENVIRONMENT.md §1; code realism environment.ts diurnalC |
| `pirate.env.exposure_by_place` | `realism.env.exposure_by_terrain` |  | ps/world/ENVIRONMENT.md §5; code realism/src/environment.ts exposure(), placeOut |
| `pirate.env.wbgt` | `realism.env.wbgt_bom` |  | ps/world/ENVIRONMENT.md §5 (BoM cited); code realism/src/environment.ts wbgtBom |
| `pirate.env.wind_chill_cold_water` | `realism.env.wind_chill` |  | ps/world/ENVIRONMENT.md §5; code realism environment.ts windChillC, coldWater |
| `pirate.gas.box_model` | `realism.gas.room_box` | DUP-40 UNIT-3 | ps/world/GAS_DYNAMICS.md §2 |
| `pirate.gas.exposure_dose` | `realism.gas.exposure_accumulation` |  | ps/world/GAS_DYNAMICS.md §1 |
| `pirate.gas.grid` | `realism.gas.grid_transport` |  | ps/world/GAS_DYNAMICS.md §4 (status deferred); code realism/src/atmosphere.ts cl |
| `pirate.gas.heavy_layering` | `realism.gas.thresholds_layering` |  | ps/world/GAS_DYNAMICS.md §2 |
| `pirate.gas.sinks` | `realism.gas.sources_sinks` |  | ps/world/GAS_DYNAMICS.md §3 last row |
| `pirate.gas.sources` | `realism.gas.sources_sinks` |  | ps/world/GAS_DYNAMICS.md §3 |
| `pirate.goods.abstract_production_shipments` | `economy.production.abstract_market` |  | economy/src/tick/index.ts production, shipments |
| `pirate.goods.consumption` | `economy.consumption.demand` | DUP-21 | economy/src/tick/index.ts consumption |
| `pirate.goods.price_shortage_rule` | `economy.price.rule` |  | ps/balance/ALIGNMENT.md §10 fifth run-down; economy code economy/src/queries.ts  |
| `pirate.goods.recipe_rule` | `economy.recipe.definition` |  | ps/economy/GOODS.md §3c,§3f,§3h; data recipes.json (183 recipes) |
| `pirate.goods.shortage` | `economy.shortage.event` |  | economy/src/queries.ts shortage; tick consumption event |
| `pirate.goods.spoilage` | `economy.spoilage` | DUP-9 | economy/src/tick/index.ts spoilage; doc ps/economy/GOODS.md §1i |
| `pirate.goods.wage_quote` | `economy.labour.wage_quote` |  | economy/src/labour.ts wageQuote |
| `pirate.neuro.baseline` | `realism.neurology.baseline_drivers` |  | ps/body/NEUROLOGY.md §2 |
| `pirate.neuro.breathing_drive` | `realism.neurology.breathing_drive` |  | ps/body/NEUROLOGY.md §6 |
| `pirate.neuro.circuits` | `realism.neurology.circuits` |  | ps/body/NEUROLOGY.md §5 |
| `pirate.neuro.clocks` | `realism.neurology.tolerance_dependence_withdrawal` |  | ps/body/NEUROLOGY.md §4 |
| `pirate.neuro.occupancy` | `realism.neurology.occupancy` |  | ps/body/NEUROLOGY.md §3 |
| `pirate.neuro.pk` | `realism.neurology.pk` |  | ps/body/NEUROLOGY.md §3 |
| `pirate.phys.aerobic_banister` | `realism.muscular.banister` | DUP-14 DUP-18 | ps/body/PHYSIOLOGY.md §2 |
| `pirate.pop.cohort_tick` | `realism.population.cohort_tick` |  | ps/world/POPULATION.md §3; code realism/src/population.ts tick |
| `pirate.pop.epidemic` | `realism.population.epidemic` | DUP-20 | ps/world/POPULATION.md §3; code population.ts startEpidemic/tick |
| `pirate.pop.famine` | `realism.population.famine` |  | ps/world/POPULATION.md §3; code population.ts famineRule |
| `pirate.pop.labour_supply` | `realism.population.labour` |  | ps/world/POPULATION.md §2-3; code population.ts populationOutputs |
| `pirate.pop.migration` | `realism.population.migration` |  | ps/world/POPULATION.md §3; code population.ts settlersPerDay, tick |
| `pirate.ref.settlement.condition_decay` | `settlement.building.condition_decay` |  | settlement/src/tick/decay.ts; config.ts bands (fine 0.0005/d ... ruined) |
| `pirate.ref.settlement.lease_expiry` | `settlement.expiry` |  | settlement/src/tick/expiry.ts |
| `pirate.ref.settlement.production_q` | `settlement.production.constraint_Q` |  | settlement/src/tick/production.ts |
| `pirate.ref.settlement.project_labour_days` | `settlement.project.construction` |  | settlement/src/tick/projects.ts |
| `pirate.ref.settlement.staffing` | `settlement.business.staffing` |  | settlement/src/tick/staffing.ts |
| `pirate.ref.settlement.wages_rent` | `settlement.wage.pay` |  | settlement/src/tick/wages.ts |
| `pirate.sci.combustion` | `realism.chem.carbon_combustion_charcoal` | DUP-1 | ps/science/ENGINE.md §2; code physics.ts carbonCombustion, HHV; process.ts combu |
| `pirate.sci.control_noise` | `realism.infra.operator_control` |  | ps/science/ENGINE.md §2; code process.ts controlProcess |
| `pirate.sci.equipment_wear` | `realism.equip.wear_by_temperature` | DUP-9 | ps/science/SCIENTIFIC_EQUIPMENT.md §4; realism process.ts wearProcess |
| `pirate.sci.heat_transfer` | `realism.thermo.heat_flow_UA` |  | ps/science/ENGINE.md §2; code physics.heatFlow, process.lossesProcess |
| `pirate.sci.measurement_drift` | `realism.infra.thermometer_drift` |  | ps/science/ENGINE.md §2; SCIENTIFIC_EQUIPMENT.md §4; code process.ts thermometer |
| `pirate.sci.reaction_rate` | `realism.chem.reaction_extent` |  | ps/science/CHEMISTRY.md §4-5; code realism/src/reactions.ts reactionProcess |
| `pirate.sci.registry_scheduler_trace` | `realism.infra.scheduler` |  | ps/science/ENGINE.md §1; code realism/src/registry.ts, graph.ts, process.ts, sch |
| `pirate.sci.sensible_latent_antoine` | `realism.thermo.water_vapour_pressure` | DUP-2 | ps/science/ENGINE.md §2; code realism/src/physics.ts |

`ps/` = `Games/RPG's/pirate-ship/files/pirate-ship/`. Engine paths are under `Toolchain/`.

## Maintaining the registry (proposed)

- A new mechanism gets a row before its code or doc: id, owner, the §7 fields. Its author searches first.
- A keeper whose change adds, moves or removes a mechanism updates its row in the same turn and tells the registry keeper.
- Overlap groups close only when Rex approves an owner and the losing homes become restatements or reads.
- The registry keeper re-audits after each phase of ROADMAP.md.

