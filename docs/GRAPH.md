# The dependency graph (opened 2026-10-30, registry keeper)

**Status: approved with refinements (Rex, 2026-10-30).** Rex approved the engine organisation and the phase order
(`ENGINES.md` "The approved organisation"). The owner of each overlap group stays **proposed** until its batch is
approved (batch 1: `OVERLAPS-BATCH-1.md`); no migration starts before the affected keepers agree ownership and
acceptance tests. This is the readable view of `registry/graph.json`; ids are those of `registry/mechanisms.json`.

## 1. The graph in numbers

- Nodes: 442 rows (351 mechanisms, 91 restatements).
- Edges: 214 `depends_on` (resolved from each row's dependency list), 91 `restates`, 135 `overlap` (members of the 49 groups below), 4 `interface` (hand-offs, §2).
- Unresolved dependencies: 83 mentions of 80 names that match no row (data files, host inputs, props, other docs); listed in graph.json.
- Cross-engine `depends_on` edges: realism → pirate-ship: 14, settlement → shared: 7, economy → shared: 7, settlement → economy: 3, shared → economy: 3, pirate-ship → realism: 3, shared → settlement: 1, shared → realism: 1.
  The realism → pirate-ship edges are realism code citing a pirate doc as its formula's authority (ENGINE.md, GAS_DYNAMICS.md, ANATOMY.md §3a, BODY.md): universal formulas whose statement lives in the plugin. Proposed: move each statement into a realism gear file (PLATFORM.md §8) and leave the doc pointing at it.
- Most-read mechanisms (in-degree): `realism.chem.molar_mass` 5, `settlement.ledger.pay` 5, `pirate.gas.box_model` 4, `economy.inventory.holdings` 4, `realism.population.labour` 4, `realism.thermo.water_vapour_pressure` 3, `realism.thermo.water_latent_heat` 3, `realism.mech.rigid_body_contact` 3.

The causal spine the code follows today (from `examples/human-wound.ts`, `three-ports.ts` and the pirate adapter's
`runDay`): environment → room air → physiology → breathing → nutrition → neurology → circulation → medicine →
anatomy (realism, one 1 s step, in declared process order); then, once a day and with no link to the above,
settlement tick → economy tick. Realism and the two economic engines do not exchange anything yet; the pirate
adapters read both.

## 2. Duplicates and overlaps (every one found)

Kinds: **duplicate** = the same quantity computed in two places; **conflict** = homes disagree in value or unit;
**double-penalty** = one cause applied as several effects (forbidden by PLATFORM.md §7); **ownership** = two
owners, or none; **overlap** = related mechanisms that must share a part.

**Authority (refinement B, Rex 2026-10-30):** closure removes duplicate *authority*, not every related
calculation. **duplicate-authority** = two homes own or compute the same state or value: one becomes a read.
**aggregation** = a detailed and an aggregate computation coexist legitimately, provided one owner holds the state
and the aggregation interface is documented. **mixed** = part of each (the note says which part). **ownership-gap**
= no owner, or the owner sits in the wrong engine. **shared-part** = distinct mechanisms that should share a helper
or a boundary contract. **Batch** = the presentation batch for Rex (batch 1 is `OVERLAPS-BATCH-1.md`; 2–5 proposed).

**State:** proposed → **closing** (Rex approved the owner; the keepers agree tests and queue units) → **closed**
(the keeper reported it done and the registry keeper re-audited it). Progress per group is in §2a.

**Closure criteria (PLATFORM.md §11a, Rex 2026-10-30).** A group closes only when, where each applies:
(1) **implemented**: the owner's code and the group's acceptance test pass; (2) **integrated**: the owner is wired
to every former home that now reads it (through registry ports once P0 lands, through the agreed contract until
then) and a combined test runs them together; (3) **validated**: where independent evidence exists for the owned
quantity, the behaviour matches it within a declared tolerance; where none exists, the row says so and names the
experiment that would test it. A re-audit by the registry keeper (not the author) checks all three; "validated"
never comes from the author's own tests alone.

| Id | Kind | Authority | Batch | State | What | Homes (ids) | Owner (approved, or proposed) |
|---|---|---|---|---|---|---|---|
| DUP-1 | duplicate+conflict | duplicate-authority | 3 | proposed | Carbon/charcoal combustion: four descriptions, two heats of combustion (30.0 vs 32.8 MJ/kg) | `realism.chem.carbon_combustion_charcoal`<br>`realism.chem.reaction_extent`<br>`realism.chem.heat_per_kg`<br>`realism.gas.sources_sinks`<br>`pirate.sci.combustion` | realism.chem.reaction_extent (the stoichiometric reaction record); physics.ts carbonCombustion and atmosphere fireFlows become callers/derived. 30 MJ/kg (charcoal, impure) and 32.8 MJ/kg (pure carbon) may both be right for different substances: record charcoal and graphite as two substances rather than pick one. |
| DUP-2 | duplicate+unit | duplicate-authority | 3 | proposed | Water saturation vapour pressure: Antoine (Pa) in physics.ts vs Magnus (hPa, RH in percent) in environment.ts; room.props.rh is a fraction | `realism.thermo.water_vapour_pressure`<br>`realism.env.wbgt_bom`<br>`pirate.sci.sensible_latent_antoine` | realism.thermo.water_vapour_pressure; environment calls it; RH is a fraction everywhere. |
| DUP-3 | duplicate | duplicate-authority | 3 | proposed | Latent heat of water: waterLatentHeat(T) vs constant SWEAT_LATENT 2.43e6 | `realism.thermo.water_latent_heat`<br>`realism.physiology.sweat` | realism.thermo.water_latent_heat evaluated at skin temperature. |
| DUP-4 | duplicate | duplicate-authority | 3 | proposed | Ideal gas: physics.molesInVolume vs atmosphere.litresToMoles, literal R | `realism.gas.ideal_gas`<br>`realism.gas.units` | realism.gas.ideal_gas. |
| DUP-5 | duplicate+conflict | duplicate-authority | 1 | closing | Oxygen use per MET computed three times; physiology scales energy to the body's RMR, atmosphere's O2/CO2 exchange does not (disagree for any body whose RMR is not 1 kcal/kg/h, e.g. the horse) | `realism.thermo.metabolic_heat`<br>`realism.gas.breathing_process`<br>`realism.physiology.energy_expenditure`<br>`pirate.doc.physiology.activity_energy` | realism.physiology.energy_expenditure owns metabolic rate; heat, metabolic water and gas exchange all read its one output. |
| DUP-6 | overlap | shared-part | 3 | proposed | Evaporation: ASHRAE pool evaporation vs Lewis-relation skin evaporation (different surfaces, same psychrometrics) | `realism.thermo.surface_evaporation`<br>`realism.physiology.sweat` | keep both; share one psychrometric helper (DUP-2). |
| DUP-7 | duplicate | duplicate-authority (the immersion table may stay as validation data) | 3 | proposed | Hypothermia: cold-water immersion outcome table vs physiology core temperature (cold side planned) | `realism.env.cold_water_immersion`<br>`realism.physiology.core_state`<br>`realism.physiology.cold_water`<br>`pirate.doc.physiology.cold_immersion` | realism.physiology.core_state once its cold side is built; the immersion table becomes validation data. |
| DUP-8 | duplicate | duplicate-authority | 3 | proposed | Still scenario hard-codes room air and outside humidity that atmosphere owns | `realism.infra.still_scenario`<br>`realism.gas.room_box` | realism.gas.room_box baseline air. |
| DUP-9 | duplicate | mixed (building and equipment condition are legitimate aggregate states over physical decay; spoilage's own constant rate is a duplicate) | 3 | proposed | Degradation in four homes: equipment wear by temperature, building condition decay, goods spoilage, planned materials decay | `realism.equip.wear_by_temperature`<br>`settlement.building.condition_decay`<br>`economy.spoilage`<br>`realism.materials.deformation_fracture_decay`<br>`pirate.sci.equipment_wear`<br>`pirate.goods.spoilage` | realism.materials.deformation_fracture_decay (planned Phase 9) owns physical and organic degradation; settlement keeps condition as a state that reads it; economy spoilage reads realism decay rates for perishables. |
| DUP-10 | conflict | duplicate-authority | 3 | proposed | Material constants twice: brick cp (physics BRICK_WALL 790 vs materials.json brick 900), copper cp 385 vs 390, charcoal cp 1000 vs 999.08 | `realism.thermo.brick_wall_constants`<br>`realism.infra.component_registry` | data/materials.json and substances.json; physics.ts constants read them. |
| DUP-11 | ownership | duplicate-authority | 2 | proposed | Haemoglobin saturation coded in atmosphere.ts, documented as circulation's (CIRCULATION.md §1a) | `realism.gas.hb_saturation`<br>`pirate.doc.circulation.sao2` | realism circulation (blood gas); atmosphere supplies alveolar PO2 only. |
| DUP-12 | duplicate | duplicate-authority | 2 | proposed | Sleep pressure as two states: physiology sleep_debt/alertness vs neurology hours_awake/adenosine/arousal | `realism.physiology.sleep_debt`<br>`realism.physiology.alertness`<br>`realism.neurology.sleep_wake`<br>`pirate.doc.physiology.sleep_alertness` | realism.neurology.sleep_wake owns sleep pressure; physiology alertness becomes a read of it. |
| DUP-13 | duplicate | mixed (per-muscle 3CC (detail) and whole-body MET-hours (aggregate) may coexist with a declared relation; the doc fatigueDay and the pool are duplicates) | 1 | closing | Fatigue in five places: whole-body MET-hours, per-group 3CC, Banister fatigue, the doc's fatigueDay, the Endurance pool | `realism.physiology.fatigue_met_hours`<br>`realism.muscular.fatigue_3cc`<br>`realism.muscular.banister`<br>`pirate.phys.fatigue_day`<br>`pirate.body.endurance_pool`<br>`pirate.combat.endurance_efficiency` | realism.muscular.fatigue_3cc (local) and realism.physiology.fatigue_met_hours (systemic), with a declared relation; the pool and Efficiency are pirate gameplay reads, never a third fatigue. |
| DUP-14 | conflict+unit | duplicate-authority | 1 | closing | aerobic_today: code outputs DO2 at max cardiac output in mL O2/min; docs treat it as an index (pool = Endurance x aerobic_today/40); Banister 'performance' a third aerobic measure | `realism.circulation.aerobic_today`<br>`realism.muscular.banister`<br>`pirate.phys.aerobic_banister`<br>`pirate.body.endurance_pool` | realism.circulation.aerobic_today (mL O2/min); any index is a pirate adapter conversion with its unit stated. |
| DUP-15 | double-penalty | duplicate-authority | 2 | proposed | Work capacity as four separate multipliers (heat, hydration, endurance-hydration, starvation x0.8) plus the doc's work capacity; hydration and bleeding table rows name game attributes (Endurance, Wits, Strength) and would stack | `realism.physiology.wbgt_core_drift`<br>`realism.physiology.hydration_band`<br>`realism.nutrition.starvation_limit`<br>`realism.circulation.bleeding_class`<br>`pirate.body.work_capacity`<br>`pirate.body.strength_today`<br>`pirate.combat.functional_capacity` | a new universal mechanism realism.capacity.functional (the universal core of BODY.md: one combination rule over biological states, worst-dip or product stated once); STATS attributes and combat read it through the pirate adapter (web/src/world/adapters/stats.ts capabilityToday is the right pattern). |
| DUP-16 | double-penalty | duplicate-authority | 2 | proposed | Vitamin C below 300 mg drives four consequences: deficiency stage, collagen loss, healing x3, and a separate scurvy disease row | `realism.nutrition.pools`<br>`realism.anatomy.tissue_collagen`<br>`realism.medicine.healing_multiplier`<br>`realism.medicine.disease_course` | one pathway: nutrition pool -> anatomy collagen state; healing reads collagen, not vitamin C; 'scurvy' is the name of that state, not a second disease course. |
| DUP-17 | duplicate | duplicate-authority | 2 | proposed | Age effects in four unlinked places (physiology ageing table no code reads, medicine healing by age, muscular age gate, neurology dopamine decline) plus STATS ageing | `realism.physiology.ageing_curves`<br>`realism.medicine.healing_multiplier`<br>`realism.muscular.adaptation_day`<br>`realism.neurology.baseline_drivers`<br>`pirate.stats.ageing_max`<br>`pirate.phys.ageing_curves` | realism.genes.ageing_capacity (planned Phase 12): ageing acts through organ capacity; the four effects become reads. |
| DUP-18 | ownership+conflict | duplicate-authority | 1 | closing | Banister impulse-response: table in physiology library, code in muscular.ts, physiology flags say not implemented; constants k1/k2 0.4/42, 0.4/7 in prose vs 1 and 1.3 in table | `realism.physiology.banister_table`<br>`realism.muscular.banister`<br>`pirate.phys.aerobic_banister` | realism.muscular.banister; one constant set with its source. |
| DUP-19 | duplicate | mixed (individual and aggregate mortality coexist legitimately (one per resolution); the five individual sources without one cause ledger are duplicate authority) | 1 | closing | Mortality from five sources with no shared cause-of-death ledger: circulation hazards, medicine fatal draw, anatomy crisis floors, population background/epidemic/famine | `realism.circulation.hazards`<br>`realism.medicine.disease_course`<br>`realism.anatomy.crisis_floors`<br>`realism.infra.crisis_record`<br>`realism.population.cohort_tick`<br>`realism.population.epidemic`<br>`realism.population.famine` | individual death: realism.anatomy.crisis_floors via realism.infra.crisis_record (one cause-of-death ledger); aggregate death: population, calibrated so the aggregate equals the mean of individuals (PLATFORM §9: finer refines, never contradicts). |
| DUP-20 | duplicate | aggregation (the population epidemic is the expected-value aggregate of medicine's course; legitimate once it reads medicine's parameters and a test checks mean agreement) | 1 | closing | Population epidemic reimplements medicine exposure/course as expected values; keeps its own health, foodDays, seasonedShare | `realism.population.epidemic`<br>`realism.medicine.disease_course`<br>`pirate.pop.epidemic` | realism.medicine.disease_course owns the course; the aggregate reads the same parameters; a test checks mean agreement. |
| DUP-21 | duplicate | mixed (population foodDays is an aggregate of nutrition; the adapter rations and economy per-capita consumption are two authorities for one flow) | 2 | proposed | Food in four accounts: population foodDays, economy per-capita consumption, per-body nutrition, pirate adapters/food.ts rations; hunger can kill by two paths | `realism.population.famine`<br>`economy.consumption.demand`<br>`realism.nutrition.eat_meal`<br>`realism.nutrition.starvation_limit`<br>`pirate.goods.consumption` | economy.consumption.demand moves goods out of inventory; realism.nutrition owns intake and starvation per body; population famine becomes the aggregate of nutrition status (economy PLAN step 11). |
| DUP-22 | ownership | duplicate-authority | 1 | closing | Body water in four ledgers (body contents, waterDeficitKg, glycogen-bound water, blood volume); body mass has no single owner (nutrition, circulation, physiology); drug mass booked twice | `realism.physiology.water_balance`<br>`realism.nutrition.energy_store`<br>`realism.nutrition.body_mass`<br>`realism.circulation.blood_ledger`<br>`realism.neurology.pk` | realism.physiology.water_balance owns body water; realism.nutrition.body_mass the mass; others write deltas through them. |
| DUP-23 | duplicate | duplicate-authority | 2 | proposed | Blood volume per kg and resting cardiac output in anatomy species profile and circulation | `realism.anatomy.species_profile`<br>`realism.circulation.normal_blood_volume`<br>`realism.circulation.cardiac_output` | realism.anatomy.species_profile holds the species parameter; circulation reads it. |
| DUP-24 | duplicate | duplicate-authority | 1 | closing | Resting metabolic rate: Mifflin (physiology), Kleiber (anatomy), host-set props.rmr_kcal_day, physics.restingMetabolicRate | `realism.physiology.rmr`<br>`realism.nutri.rmr_mifflin`<br>`realism.anatomy.species_profile`<br>`pirate.doc.physiology.rmr` | realism.physiology.rmr with the equation chosen per species profile. |
| DUP-25 | duplicate | duplicate-authority | 2 | proposed | Gas tolerance thresholds in anatomy respiratory profile, medicine air conditions and atmosphere thresholds | `realism.anatomy.respiratory_profile`<br>`realism.medicine.air_conditions`<br>`realism.gas.thresholds_layering` | realism.gas.thresholds_layering for exposure, realism.medicine.air_conditions for effects; anatomy keeps species tolerance data only. |
| DUP-26 | duplicate+unit | mixed (population labour (aggregate supply) and settlement assignment (detail) are legitimate layers; the two provider interfaces and two units are duplicates) | 1 | closing | Labour supply in five homes: population labour (health applied twice), settlement LabourProvider, economy LabourSupplyProvider, ecology labour per hectare, recipes labourPerUnit; worker-days vs hours (Q15), hoursPerDay 10 vs 11 (SET-12) | `realism.population.labour`<br>`shared.labour.provider_draw`<br>`shared.contract.labour_supply_provider`<br>`settlement.production.labour_cap`<br>`economy.recipe.rates`<br>`pirate.eco.crops_table` | Society (population) supplies person-hours; settlement assigns; economy prices; one unit: person-hours. |
| DUP-27 | duplicate | duplicate-authority | 4 | proposed | Stock creation by three paths (settlement Q -> produce, economy abstract market, host addStock); production recorded twice (DayProduction vs producedLast) | `settlement.production.constraint_Q`<br>`economy.material.produce`<br>`economy.production.abstract_market`<br>`economy.market.observed_production` | economy.material.produce is the only way goods appear; settlement computes capacity Q; one production record (economy's). |
| DUP-28 | duplicate | duplicate-authority | 1 | closing | Wages: settlement pays a fixed Post.wage; economy wage_quote is a query nothing consumes | `settlement.wage.pay`<br>`settlement.wage.set_wage`<br>`economy.labour.wage_quote` | economy.labour.wage_quote sets the level (once Rex answers Q10/§12.6); settlement.wage.pay executes it. |
| DUP-29 | duplicate | duplicate-authority | 1 | closing | Two labour-supply interfaces, neither implemented | `shared.labour.provider_draw`<br>`shared.contract.labour_supply_provider` | one interface, implemented by the future Society population. |
| DUP-30 | duplicate | duplicate-authority | 4 | proposed | Ledger, Rates and equipment list declared in both engines (StubLedger/LedgerRow vs Transaction) | `settlement.ledger.pay`<br>`shared.contract.ledger_provider`<br>`economy.recipe.rates`<br>`settlement.production.equipment_cap` | settlement ledger (contract agreed); shared types in one package. |
| DUP-31 | duplicate | duplicate-authority | 4 | proposed | Shortage computed twice inside economy (unclamped in consumption, clamped in queries.shortage) | `economy.consumption.demand`<br>`economy.shortage.event` | economy.shortage.event. |
| DUP-32 | duplicate | duplicate-authority | 1 | closing | Reducer, Runner, ctx, mint, must, finite copied in three engines; three id schemes | `settlement.infra.reducer_replay`<br>`economy.infra.reducer_replay`<br>`settlement.infra.id_scheme`<br>`economy.infra.id_scheme`<br>`realism.infra.component_registry` | a shared kernel package (new, infra). |
| DUP-33 | duplicate | mixed (different tick rates per engine are legitimate under one clock; independent counters with no conversion are duplicate authority over time) | 1 | closing | Clocks: realism scheduler (1 s), settlement day, economy day, StubLedger day, alignment tick, BODY.md overnight tick; nothing converts between them | `realism.infra.scheduler`<br>`settlement.infra.tick_scheduler`<br>`economy.infra.tick_scheduler`<br>`shared.contract.day_order`<br>`pirate.body.overnight_tick`<br>`pirate.align.step` | a universal time and event scheduler (new, ENGINES.md 'shared infrastructure still missing'). |
| DUP-34 | ownership | ownership-gap | 5 | proposed | Weather generator exists only in pirate game code (places.ts daily Markov chain, replays from day 1); realism has none | `pirate.env.weather_markov`<br>`pirate.env.climate_monthly`<br>`realism.env.place_process` | realism environment (a universal weather and climate mechanism); the Caribbean climate rows stay plugin data. |
| DUP-35 | duplicate | duplicate-authority | 5 | proposed | Vector/mosquito exposure multipliers in environment exposure table and pirate adapters/medicine.ts multiplierOf; season defined in ENVIRONMENT climate and ECOLOGY calendar | `realism.env.exposure_by_terrain`<br>`pirate.eco.calendar`<br>`pirate.env.climate_monthly` | realism.env.exposure_by_terrain; one season definition in environment. |
| DUP-36 | duplicate | duplicate-authority | 5 | proposed | Injury: COMBAT wound ladder, HP and Endurance pool vs realism medicine wounds, circulation bleeding, crisis | `pirate.combat.wound_ladder`<br>`pirate.combat.regional_damage_dip`<br>`realism.medicine.wounds`<br>`realism.circulation.bleeding_class`<br>`realism.anatomy.crisis_floors`<br>`realism.contact.contact_event` | realism owns injury physiology; combat reads it (CMB-11's proposed §9 interfaces). Contact and Impact Mechanics (P2, Rex 2026-10-30) is the source of hit location and impact (IF-3, IF-4). |
| DUP-37 | double-penalty | duplicate-authority | 2 | proposed | Vision dips from several sources: CHEMISTRY smoke 'Eyesight x0.6', COMBAT head-wound dips, (optics planned) | `pirate.body.head_attrs_today`<br>`pirate.combat.regional_damage_dip`<br>`realism.optics.light_visibility`<br>`realism.contact.contact_event` | the capability aggregator (DUP-15) with optics as the physical input. Contact and Impact Mechanics (P2, Rex 2026-10-30) is the source of hit location and impact (IF-3, IF-4). |
| DUP-38 | duplicate | duplicate-authority | 2 | proposed | 'State' multiplier stated three ways (STATS 6 items, BODY 3, PSYCHOLOGY 6); drinkFactor a STATS placeholder while neurology produces the real output | `pirate.body.state_multiplier`<br>`pirate.stats.performance`<br>`pirate.psych.pushes`<br>`realism.neurology.circuits` | pirate BODY.md for the multiplier (pirate gameplay); neurology for intoxication. |
| DUP-39 | duplicate | duplicate-authority | 5 | proposed | Town alignment rule in code (web/src/alignment) and in town ENDINGS/UPGRADES docs | `pirate.align.town_aggregate`<br>`pirate.align.perfect_town` | pirate balance code; docs point to it. |
| DUP-40 | duplicate+unit | duplicate-authority (doc-level only) | 3 | proposed | Room box model written in three places (ENGINE.md, GAS_DYNAMICS.md, atmosphere.ts) with ACH converted /3600 in one doc and /60 in the other | `realism.gas.room_box`<br>`pirate.gas.box_model`<br>`pirate.atm.ventilation_ach` | realism.gas.room_box; docs point to it. |
| DUP-41 | ownership | ownership-gap | 5 | proposed | Population and demography live in Reality (population.ts, world/POPULATION.md) but belong to Society (CTRL-5); population takes a game 'reputation' input | `realism.population.cohort_tick`<br>`realism.population.migration`<br>`realism.population.labour`<br>`pirate.pop.vital_rates`<br>`pirate.pop.recruit_pool` | a Society engine (new); Reality keeps biological reproduction, ageing and mortality (ENGINES.md boundary). |
| DUP-42 | ownership | ownership-gap | 4 | proposed | Taxation: settlement wages.ts publicWorks is an empty stub; taxes belong to the future Government engine | `settlement.wage.pay`<br>`settlement.authority.office_powers` | Government (new); settlement records office holders only (ENGINES.md contract). |
| DUP-43 | ownership | ownership-gap | 4 | proposed | Property valuation (PriceProvider.valueOf) declared, never implemented or called; money created/destroyed by credit/debit outside conservation, no money-supply owner | `shared.contract.price_provider`<br>`economy.price.rule`<br>`settlement.ledger.pay` | economy (pricing and money supply), pending Rex §12.3. |
| DUP-44 | ownership | duplicate-authority | 1 | closed | Inventory identity: Project.account used as both money holder and inventory id; economy keys inventories by inv.* with a separate holder | `settlement.project.construction`<br>`shared.contract.inventory_ownership`<br>`economy.inventory.holdings` | economy owns inventories; settlement passes an inventory id distinct from the account. |
| DUP-45 | overlap | shared-part | 4 | proposed | Burial, sanitation, waste scoped in three engines (settlement PACKAGES §8, economy PLAN step 12, realism Phase 11) | `settlement.scope_added.cemetery_sanitation_landuse`<br>`economy.burial_waste`<br>`realism.waste.sanitation_decomposition` | keep the ENGINES.md split (settlement: land and infrastructure; economy: services and flows; realism: decomposition and exposure); a contract before code. |
| DUP-46 | duplicate | ownership-gap (the universal model does not exist; the pirate charts stay pirate (CTRL-7)) | 5 | proposed | Personality: 16 hand-authored MBTI response charts in alignment, STATS personality type and sliders, PSYCHOLOGY.md | `pirate.align.response_chart`<br>`pirate.stats.personality_type`<br>`pirate.stats.personality_sliders`<br>`pirate.psych.pushes` | Cognition (new) with the eight-function model as one optional configurable model (decided, CTRL-7); the pirate charts stay pirate. |
| DUP-47 | ownership | duplicate-authority | 2 | proposed | Endurance pool owned three ways: formula in BODY §3 (with heatFactor), PHYSIOLOGY §6 (without), spent by COMBAT | `pirate.body.endurance_pool`<br>`pirate.combat.endurance_efficiency`<br>`pirate.phys.fatigue_day` | pirate BODY.md (pirate gameplay over DUP-13's universal fatigue). |
| DUP-48 | duplicate | duplicate-authority (inside one engine) | owner | closed | Business.status written by two mechanisms: settlement staffing (dormant/staffed) and production (producing/staffed); found by the settlement keeper while resolving REG-16 (SET-21) | `settlement.business.staffing`<br>`settlement.production.constraint_Q` | settlement.production.constraint_Q as the one writer (sets dormant, staffed or producing once per day); staffing keeps its outcome in the tick context only, never in state; end-of-day value, state and the pirate golden unchanged (settlement keeper's final design) |
| DUP-49 | duplicate | duplicate-authority (documented-only on both sides; nothing built) | 2 | proposed | Decision rows inside the nutrition library: 'appetite' (hunger x palatability x state, per food offered) and 'eating-rule' (eats if appetite > 0.3 or hunger > 0.8) decide what a person does, which is Cognition's drive, priority and selection; found by the Reality keeper against the cognition keeper's input contract (cognition DESIGN.md §8) | `realism.nutrition.hunger_fullness`<br>`cognition.needs.drive`<br>`cognition.decision.select`<br>`pirate.nutr.hunger_appetite` | Reality keeps fullness and hunger as body signals (body.hunger_signal; the 'drive' wording becomes 'signal'); appetite's palatability and the eating rule go to Cognition (needs.drive, decision.select), or to the game where they are its content, and become restatements in nutrition.json. No code exists for either row |

Counts: duplicate 33, overlap 2, conflict 2, ownership 9, double-penalty 3.
Counts by authority: duplicate-authority 35, shared-part 2, mixed 6, aggregation 1, ownership-gap 5.
Batches: 1: DUP-5 DUP-13 DUP-14 DUP-18 DUP-19 DUP-20 DUP-22 DUP-24 DUP-26 DUP-28 DUP-29 DUP-32 DUP-33 DUP-44; 2: DUP-11 DUP-12 DUP-15 DUP-16 DUP-17 DUP-21 DUP-23 DUP-25 DUP-37 DUP-38 DUP-47 DUP-49; 3: DUP-1 DUP-2 DUP-3 DUP-4 DUP-6 DUP-7 DUP-8 DUP-9 DUP-10 DUP-40; 4: DUP-27 DUP-30 DUP-31 DUP-42 DUP-43 DUP-45; 5: DUP-34 DUP-35 DUP-36 DUP-39 DUP-41 DUP-46; owner: DUP-48.

### 2a. Closure tracking

| Id | State | Decision | Progress (agreed / units queued / closed with commit) |
|---|---|---|---|
| DUP-5 | closing | owner approved as proposed (Rex, 2026-10-30; OVERLAPS-BATCH-1.md) | awaiting the keepers' agreement |
| DUP-13 | closing | owner approved as proposed (Rex, 2026-10-30; OVERLAPS-BATCH-1.md) | 2026-10-30 units queued: realism unit 2634: one work record drives local and systemic fatigue; after kernel 2607; 2026-10-30 model reviewed: REVIEWS.md R-1: accepted; 2026-10-30 agreed: CMB-12; marker realism/done/combat-agreed-groups-7-8.md; the pool rule is Rex's, the pool formula and /40 are proposed |
| DUP-14 | closing | owner approved as proposed (Rex, 2026-10-30; OVERLAPS-BATCH-1.md) | 2026-10-30 units queued: realism unit 2635: Banister clamp the only pathway into aerobic_today; after kernel 2607; 2026-10-30 model reviewed: REVIEWS.md R-1: accepted with conditions; 2026-10-30 agreed: CMB-12; marker realism/done/combat-agreed-groups-7-8.md; the pool rule is Rex's, the pool formula and /40 are proposed |
| DUP-18 | closing | owner approved as proposed (Rex, 2026-10-30; OVERLAPS-BATCH-1.md) | awaiting the keepers' agreement |
| DUP-19 | closing | owner approved as proposed (Rex, 2026-10-30; OVERLAPS-BATCH-1.md) | 2026-10-30 units queued: realism unit 2633: one death per body, one cause; starvation opens a crisis; after kernel 2607; 2026-10-30 model reviewed: REVIEWS.md R-1: accepted with conditions |
| DUP-20 | closing | owner approved as proposed (Rex, 2026-10-30; OVERLAPS-BATCH-1.md) | 2026-10-30 units queued: realism unit 2626: epidemic aggregate from remaining susceptibles; after kernel 2607; 2026-10-30 model reviewed: REVIEWS.md R-1: accepted with conditions |
| DUP-22 | closing | owner approved as proposed (Rex, 2026-10-30; OVERLAPS-BATCH-1.md) | 2026-10-30 units queued: realism unit 2623: water ledger; plasma term waits on 2643's unit and sign; after kernel 2607; 2026-10-30 model reviewed: REVIEWS.md R-1: accepted with conditions |
| DUP-24 | closing | owner approved as proposed (Rex, 2026-10-30; OVERLAPS-BATCH-1.md) | awaiting the keepers' agreement |
| DUP-26 | closing | owner approved as proposed (Rex, 2026-10-30; OVERLAPS-BATCH-1.md) | 2026-10-30 contract proposed: settlement CONTRACTS s16 (one LabourSupply interface in person-hours) and s17; economy P1.md 2c4caa3; not yet agreed; 2026-10-30 agreed (settlement 70e3117; economy 91e374a): CONTRACTS s16 Labour (economy P1.md rev 2 with Settlement amendments A and B); committed copies byte-identical (md5 c520e57f, registry check); 2026-10-30 units queued: settlement belt units 2617-2619, economy 2627-2632, all after kernel stage 2615 |
| DUP-28 | closing | owner approved as proposed (Rex, 2026-10-30; OVERLAPS-BATCH-1.md) | 2026-10-30 contract proposed: settlement CONTRACTS s16 (one LabourSupply interface in person-hours) and s17; economy P1.md 2c4caa3; not yet agreed; 2026-10-30 agreed (settlement 70e3117; economy 91e374a): CONTRACTS s16 Labour (economy P1.md rev 2 with Settlement amendments A and B); committed copies byte-identical (md5 c520e57f, registry check); 2026-10-30 units queued: settlement belt units 2617-2619, economy 2627-2632, all after kernel stage 2615 |
| DUP-29 | closing | owner approved as proposed (Rex, 2026-10-30; OVERLAPS-BATCH-1.md) | 2026-10-30 contract proposed: settlement CONTRACTS s16 (one LabourSupply interface in person-hours) and s17; economy P1.md 2c4caa3; not yet agreed; 2026-10-30 agreed (settlement 70e3117; economy 91e374a): CONTRACTS s16 Labour (economy P1.md rev 2 with Settlement amendments A and B); committed copies byte-identical (md5 c520e57f, registry check); 2026-10-30 units queued: settlement belt units 2617-2619, economy 2627-2632, all after kernel stage 2615 |
| DUP-32 | closing | owner approved as proposed (Rex, 2026-10-30; OVERLAPS-BATCH-1.md) | awaiting the keepers' agreement |
| DUP-33 | closing | owner approved as proposed (Rex, 2026-10-30; OVERLAPS-BATCH-1.md) | awaiting the keepers' agreement |
| DUP-44 | closed | owner approved as proposed (Rex, 2026-10-30; OVERLAPS-BATCH-1.md) | 2026-10-30 agreed: CONTRACTS.md s15; 2026-10-30 closed (settlement efc72cf; economy d84785a; pirate-ship fc83089): Project.inventory apart from Project.account; U16 and I1b; 2026-10-30 re-audited: committed CONTRACTS.md byte-identical in both repos (md5 0fe282f5); settlement 27/27 incl. U16; pirate src/economy 4/4 incl. I1, I1b, I2; 2026-10-30 re-audited (11a criteria): implemented: U16; integrated: I1b runs settlement and economy together through the contract (ports after P0); validated: n/a (an identity rule, no empirical behaviour) |
| DUP-48 | closed | owner fix inside its boundary: an implementation defect against an approved model (PLATFORM.md §11a); SET-21 | 2026-10-30 agreed: unit to be queued after kernel 2615; 2026-10-30 units queued: settlement 2654 (2654-settlement-one-status-writer), needs only kernel 2599 (moved from 2615 to break the deadlock with kernel 2600); it also names settlement.business.status once in settlement's kernel.json. On pass: writer = settlement.production.constraint_Q, staffing dropped from candidate_writers; 2026-10-30 registry writer set ahead of the code: writer = settlement.production.constraint_Q, staffing dropped; DUP-48 stays closing until 2654 passes and is re-audited; 2026-10-30 closed (settlement 8dc8fcb (unit 2654)): staffing.ts has no status write; production the only status writer in the tick; U21 one event per change; kernel.json names settlement.business.status once; 2026-10-30 re-audited: verified: in src/tick only production.ts calls setStatus; settlement 51/51 tests, typecheck clean; kernel check-registry.ts on settlement/kernel.json exits 0. Residual (REG-21, not blocking): the closeBusiness command (commands.ts L495-499) also sets dormant on close, a command-path write of the same value that production writes at the next tick |

### Interfaces, not overlaps

Hand-offs between engines that look like overlaps and are not. They are recorded so nobody tries to close them;
`graph.json` holds them under `interfaces`, as edges of type `interface`.

| Id | Provider → consumer | What | Related groups |
|---|---|---|---|
| IF-1 | `realism.infra.crisis_record` → `pirate.align.fates_forms` | Death to fate: Reality decides biological failure, with a crisis before every death; the pirate fate system decides what a dead character becomes. The two rules are compatible (Rex, 2026-10-30). This is a hand-off, never an overlap: the plugin reads the death, and Reality never reads the fate. | DUP-19, DUP-20 |
| IF-2 | `realism.records.organism_state` → `pirate.stats.attribute_value` | Character sheet as a view (Rex, 2026-10-30): a character sheet is a view of the three organism records, never a second source of numbers. STATS.md attributes (Rex's gameplay design: scale, Poise, Efficiency) are computed from the records through the pirate adapter; nobody inherits a Strength score. | DUP-15, DUP-17 |
| IF-3 | `realism.contact.contact_event` → `realism.medicine.wounds` | Contact to injury: Physical Reality emits a contact event (position, relative velocity, direction, duration, impulse, penetration); anatomy and medicine read it to make the wound; materials read it for damage to objects and armour. Physical Reality never decides the wound; medicine never recomputes the impact. | DUP-36, DUP-37 |
| IF-4 | `realism.contact.contact_event` → `pirate.combat.hit_and_location` | Contact to the combat plugin: the pirate combat rules read the contact event for hit location and impact instead of rolling them (supersedes the plugin's regional dip as the source of hit location); combat keeps its own rules for turns, actions and choices. | DUP-36 |

## 3. Incompatible units

| Id | Where | Problem | Proposal |
|---|---|---|---|
| UNIT-1 | `realism.circulation.blood_ledger / realism.nutrition.pools` | circulation writes blood_lost_ml (mL); nutrition's iron-loss rule reads blood_lost_l (L); nothing writes blood_lost_l, so haemorrhage never costs iron outside tests | a wiring bug, not a design question |
| UNIT-2 | `realism.env.wbgt_bom / room.props.rh` | relative humidity in percent in environment.ts, a fraction in room props (capped at 1.5) | one unit: fraction |
| UNIT-3 | `pirate.gas.box_model / pirate.atm.ventilation_ach` | ENGINE.md Q = ACH V/3600 (per second); GAS_DYNAMICS.md Q = ACH V/60 (per minute); code uses per-minute flow | docs restate the code's unit |
| UNIT-4 | `realism.circulation.aerobic_today` | mL O2/min in code; an index ~20-65 (divided by 40) in PHYSIOLOGY/BODY docs | see DUP-14 |
| UNIT-5 | `realism.physiology.rmr / realism.thermo.metabolic_heat` | kcal/day vs W; kcal (props) vs J (trace) via KCAL_J | SI internally, kcal only at the edge |
| UNIT-6 | `realism.gas.* / realism.atmos.barometric_pressure` | Pa (physics) and mmHg (atmosphere, physiology) both in use; converted by MMHG_PER_PA | acceptable; declare per interface |
| UNIT-7 | `realism.eco.logistic_stock` | step in days, r per year; stock B in 'catch-days' or head count, not kg: cannot join goods mass | state biomass in kg or head with a conversion |
| UNIT-8 | `realism.gas.grid_transport` | diffusion, rise and settle as fractions per step: results depend on cell size and dt | physical D (m2/s) and velocities |
| UNIT-9 | `realism.population.* / realism.medicine.* / realism.circulation.*` | per year /365, per day, per second, per hour: conversions inline and undocumented; circulation hazards mix units per event | declare a timescale per mechanism (registry field) |
| UNIT-10 | `realism.nutrition.pools` | sodium/magnesium loss reads sweat_kg as litres | explicit density |
| UNIT-11 | `shared.labour.* / settlement.production.labour_cap / economy.recipe.rates` | worker-days vs hours per unit (Q15); hoursPerDay 10 (no source) vs 11 (Voth, SET-12); wage per day ignores hours | person-hours |
| UNIT-12 | `economy.*` | money, weight and volume unitless; base prices null; Good.weight stored, never used; no currency unit (GOODS Open 2) | a currency and mass unit per good |
| UNIT-13 | `settlement.day / economy.day / StubLedger.day / realism t` | three day counters plus seconds; economy.tick takes no day argument though CONTRACTS §9 says tick(N) | one clock (DUP-33) |
| UNIT-14 | `pirate.eco.crops_table / realism.eco.soil_fertility` | yield in t/ha with a unitless soil index; no nutrient or mass balance | soil nutrients in kg/ha |
| UNIT-15 | `realism.neurology.baseline_drivers` | neurology reads props pain, hunger, fever, starvation_stage, liver_function; medicine writes outputs['medicine.pain'], anatomy outputs.liver; nothing writes hunger, fever or starvation_stage | interface by registry id, not prop name |

UNIT-1 was checked by the registry keeper against the code: `circulation.ts` L91/L105 write `blood_lost_ml`,
`nutrition.ts` L409/L438 read `blood_lost_l`, and only `nutrition.test.ts` L224 sets `blood_lost_l`.

## 3a. Integration: connected pairs with no combined test (PLATFORM.md §11a)

Each mechanism is **implemented** (code and unit tests pass), **integrated** (wired through registry ports to
what it reads and feeds), and **validated** (its behaviour matches independent evidence within declared
tolerances): three separate states, recorded per row in `mechanisms.json` (`vv`). Seeded 2026-10-30:

- built mechanisms 202; **implemented** 200; with a combined (integration) test 105; **integrated through registry ports 0** (the ports arrive with P0; today wiring is by prop names, process order and CONTRACTS.md providers); **validated 0**, 5 candidates awaiting re-audit. That most rows are implemented-not-validated is the honest starting point (Rex).

The combined tests counted as integration evidence:

| Combined test | Mechanisms | Complete? |
|---|---|---|
| realism test/checkpoint1.test.ts, test/hydration-week.test.ts; examples/human-week.ts (CHECKPOINTS.md Checkpoint 1, 2540, 2565) | 39 | yes |
| realism test/checkpoint2.test.ts; examples/human-wound.ts (CHECKPOINTS.md Checkpoint 2: partial, acceptance blocked) | 61 | partial (acceptance blocked) |
| realism test/independence.test.ts; examples/horse-stable.ts (CHECKPOINTS.md Independence) | 9 | yes |
| realism test/still.test.ts (lab/still.ts) | 14 | yes |
| pirate-ship web/src/economy/economy.test.ts I1, I1b, I2 (Toolchain/economy/TESTS.md) | 25 | yes |
| Toolchain/economy examples/three-ports.ts; test/labour-and-sim.test.ts | 11 | yes |

Of the connected pairs (a `depends_on` edge between two built mechanisms), 63 run together in one of these tests and **61 do not**:

| Reader | Reads | Engines |
|---|---|---|
| `economy.consumption.demand` | `economy.market.five_numbers` | economy |
| `economy.infra.reducer_replay` | `economy.infra.id_scheme` | economy |
| `economy.production.abstract_market` | `economy.market.five_numbers` | economy |
| `economy.shortage.event` | `economy.market.five_numbers` | economy |
| `settlement.business.open` | `economy.inventory.holdings` | economy, settlement |
| `economy.labour.wage_quote` | `shared.contract.settlement_reader` | economy, shared |
| `economy.recipe.rates` | `economy.recipe.definition` | economy, shared |
| `economy.trade.shipment` | `shared.contract.ledger_provider` | economy, shared |
| `economy.trade.trade` | `shared.contract.ledger_provider` | economy, shared |
| `pirate.align.institution_transform` | `pirate.align.square_classify` | pirate-ship |
| `pirate.env.period_hurricane_factor` | `pirate.env.weather_markov` | pirate-ship |
| `pirate.env.weather_markov` | `pirate.env.climate_monthly` | pirate-ship |
| `realism.chem.carbon_combustion_charcoal` | `realism.chem.molar_mass` | realism |
| `realism.chem.carbon_combustion_charcoal` | `realism.gas.room_box` | realism |
| `realism.chem.heat_per_kg` | `realism.chem.molar_mass` | realism |
| `realism.chem.reaction_extent` | `realism.chem.molar_mass` | realism |
| `realism.chem.reaction_extent` | `realism.infra.component_registry` | realism |
| `realism.chem.reaction_validation` | `realism.chem.molar_mass` | realism |
| `realism.circulation.cardiac_output` | `realism.anatomy.species_profile` | realism |
| `realism.env.exposure_by_terrain` | `realism.env.wbgt_bom` | realism |
| `realism.env.place_process` | `realism.env.exposure_by_terrain` | realism |
| `realism.gas.altitude_inspired_po2` | `realism.atmos.barometric_pressure` | realism |
| `realism.gas.alveolar_po2` | `realism.gas.altitude_inspired_po2` | realism |
| `realism.gas.breathing_process` | `realism.gas.cohb` | realism |
| `realism.gas.grid_box_handoff` | `realism.gas.grid_transport` | realism |
| `realism.gas.grid_transport` | `realism.gas.units` | realism |
| `realism.gas.room_box` | `realism.thermo.water_vapour_pressure` | realism |
| `realism.gas.room_box` | `realism.gas.ideal_gas` | realism |
| `realism.gas.sources_sinks` | `realism.gas.units` | realism |
| `realism.infra.operator_control` | `realism.infra.rng` | realism |
| `realism.infra.thermometer_drift` | `realism.infra.rng` | realism |
| `realism.infra.world_conservation` | `realism.chem.molar_mass` | realism |
| `realism.medicine.disease_course` | `realism.medicine.immunity` | realism |
| `realism.neurology.alcohol_withdrawal_stage` | `realism.neurology.tolerance_dependence_withdrawal` | realism |
| `realism.neurology.occupancy` | `realism.neurology.pk` | realism |
| `realism.neurology.tolerance_dependence_withdrawal` | `realism.neurology.tone` | realism |
| `realism.neurology.tone` | `realism.neurology.occupancy` | realism |
| `realism.population.epidemic` | `realism.medicine.disease_course` | realism |
| `realism.population.epidemic` | `realism.medicine.immunity` | realism |
| `realism.population.labour` | `realism.population.epidemic` | realism |
| `realism.thermo.boiling` | `realism.thermo.water_boiling_point` | realism |
| `realism.thermo.convective_losses` | `realism.thermo.heat_flow_UA` | realism |
| `realism.thermo.room_envelope_walls` | `realism.thermo.heat_flow_UA` | realism |
| `realism.thermo.room_envelope_walls` | `realism.thermo.brick_wall_constants` | realism |
| `realism.thermo.surface_evaporation` | `realism.thermo.water_vapour_pressure` | realism |
| `realism.thermo.surface_evaporation` | `realism.thermo.water_latent_heat` | realism |
| `realism.thermo.water_boiling_point` | `realism.thermo.water_vapour_pressure` | realism |
| `settlement.authority.office_powers` | `settlement.expiry` | settlement |
| `settlement.building.condition_output_factor` | `settlement.building.condition_decay` | settlement |
| `settlement.business.open` | `settlement.property.right_of_use` | settlement |
| `settlement.infra.reducer_replay` | `settlement.infra.id_scheme` | settlement |
| `settlement.land.parcel_split_merge` | `settlement.property.title_transfer` | settlement |
| `settlement.production.equipment_cap` | `settlement.building.condition_output_factor` | settlement |
| `settlement.project.construction` | `settlement.authority.office_powers` | settlement |
| `settlement.property.lease` | `settlement.ledger.pay` | settlement |
| `settlement.property.right_of_use` | `settlement.property.lease` | settlement |
| `settlement.property.title_transfer` | `settlement.ledger.pay` | settlement |
| `settlement.property.title_transfer` | `settlement.authority.office_powers` | settlement |
| `settlement.business.staffing` | `shared.labour.provider_draw` | settlement, shared |
| `settlement.production.labour_cap` | `shared.labour.provider_draw` | settlement, shared |
| `settlement.project.construction` | `shared.labour.provider_draw` | settlement, shared |

Limits of this view: pairs inside one module may already be exercised together by that module's unit tests (the
owner confirms and adds the test to the row's `integration_tests`); the `depends_on` edges are resolved by name
(GRAPH.md §6), so a missing edge hides a pair. Thermoregulation and hydration, the pair Rex named, run together in
checkpoint 1 and hydration-week and are covered.

**Couplings that should exist and are not wired at all** (no edge, no test; from the overlap groups):

| Coupling | Today | Group |
|---|---|---|
| dehydration → plasma volume → oxygen delivery | documented in circulation's delivery failures, not implemented | DUP-22 |
| nutrition (per body) ↔ economy consumption (goods) ↔ population famine | three unconnected accounts | DUP-21 |
| population labour → settlement assignment → economy labour quote | no LabourSupply implementation until units 2617–2636 | DUP-26, DUP-29 |
| organ function ← hydration, anaemia, drug burden, nutrition | anatomy reads only perfusion and host signals | DUP-15 |
| realism (any) ↔ settlement/economy | no exchange; only the pirate adapters read both | P5, economy PLAN step 11 |

## 4. Circular dependencies

No import-level cycle exists in any engine (the readers checked imports). The resolved `depends_on` graph has
these two-node cycles:

| Cycle | Reading |
|---|---|
| `pirate.doc.anatomy.tissue_integrity` ⇄ `pirate.doc.nutrition.deficiency_pools` | doc-level loop: vitamin C pool and collagen state cite each other (DUP-16) |
| `realism.anatomy.feed_gate` ⇄ `realism.nutrition.absorption` | intended feedback: the gut gate limits absorption and absorption feeds organ state; acceptable, order declared only in comments |
| `pirate.doc.physiology.acclimatisation` ⇄ `pirate.doc.physiology.heat_stress` | doc-level feedback: acclimatisation lowers heat strain which drives acclimatisation; the code orders it |
| `realism.physiology.urine` ⇄ `realism.physiology.water_balance` | intended feedback: urine output depends on water balance and changes it; acceptable inside one step if the order is declared |
| `realism.muscular.banister` ⇄ `realism.physiology.banister_table` | an ownership loop, not causality: table in the physiology library, code in muscular (DUP-18) |
| `pirate.body.state_multiplier` ⇄ `pirate.stats.performance` | doc-level loop: STATS performance and BODY state multiplier define each other (DUP-38) |
| `pirate.env.period_hurricane_factor` ⇄ `pirate.env.weather_markov` | pirate code: the period factor is parsed into the weather chain that it describes (DUP-34) |

Run-order coupling (not cycles, but hidden dependencies): physiology reads `place.props.wbgt_c` written by
environment; breathing must follow room air and physiology; circulation after breathing; medicine after
circulation; anatomy after both. This order lives only in comments and examples. Settlement's tick calls economy's
`produce` and economy then reads settlement's output: works only by the agreed day order (CONTRACTS.md §9).
The anatomy cascade and circulation's regulation loops are intended feedback, half built.
The universal scheduler (ROADMAP phase 0) should declare these orders as data.

## 5. Ownership conflicts and contract-vs-code gaps

| Item | Two sides | State |
|---|---|---|
| Banister | physiology library table vs `muscular.ts` code vs physiology flags "not implemented" | DUP-18 |
| Hb saturation | CIRCULATION.md §1a vs `atmosphere.ts` | DUP-11 |
| Body mass, body water | nutrition, circulation, physiology all write | DUP-22 |
| Endurance pool | BODY §3, PHYSIOLOGY §6, COMBAT | DUP-47 |
| Inventory identity | `Project.account` as inventory id vs economy `inv.*` + holder | DUP-44 |
| Money supply | `credit`/`debit` outside conservation; no owner | DUP-43 |
| Property value | `PriceProvider.valueOf` declared, never implemented or called | DUP-43, CONTRACTS §12.3 |
| Taxation | settlement `publicWorks` stub vs future Government | DUP-42 |
| Population | Reality vs Society | DUP-41, CTRL-5 |
| Culture, organisations, factions | no owner; factions split Story vs Balance | CTRL-6 |
| Reference catalogue (§6) | no owner | AUDIT.md |
| Universal clock | no owner; six tick systems | DUP-33, BAL-25, REAL-10 |
| CONTRACTS.md §9 | promises market clearing, labour quotes and accounting snapshots inside `economy.tick`; the code has quotes and accounts as queries and no clearing | contract text ahead of code |
| CONTRACTS.md §8 | promises cost-of-goods and spoilage lines; `accounts()` has neither | contract text ahead of code |
| CONTRACTS.md §6, §4b | economy reads `reader.production` and `hasFixture`; economy `src/` calls only `reader.posts()` | equipment-presence check unbuilt |
| Question ids | CONTRACTS/README call idle fixtures "Q9"; in settlement QUESTIONS.md it is Q5 and Q9 is inheritance | id inconsistency |
| Load-bearing prose | realism regex-parses constants from library text cells (glycogenFactor, repair rates, places.ts hurricane weight): rewording a sentence changes the model | structural; ROADMAP phase 0 |

## 6. How to read graph.json

`nodes` (id, engine, status, kind, domain, scope); `edges` (`from`, `to`, `type`, and `group` on overlap edges);
`overlap_groups`; `unit_issues`; `cycles` (strongly connected components of `depends_on`); `unresolved_dependencies`
(name → mentions). The dependency resolution is by id, then by unique name or last id segment; a wrong match is
possible on generic names, so treat single edges as leads and the overlap groups (hand-checked) as findings.

