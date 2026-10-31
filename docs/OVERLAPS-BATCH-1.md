# Overlap groups, batch 1 (registry keeper, 2026-10-30)

**Status: approved (Rex, 2026-10-30).** All 14 owners approved as proposed, together with the Kernel design. Each
group is now **closing**: the keepers named under "must agree" accept the ownership and the acceptance test, queue
the units, and report the group closed; the registry keeper then re-audits it and marks it closed (the tracking
table below, mirrored in GRAPH.md §2a and `registry/graph.json`). Groups 3–14 start as their keepers agree; 1–2
are P0 (Kernel keeper). Nothing is deleted; a losing home becomes a read, an aggregate or a restatement.

## Tracking

States: **closing** (approved; awaiting agreement) → **agreed** (keepers accepted ownership and test) → **units
queued** (belt units or keeper work started) → **closed** (keeper reported done with a commit; registry re-audit
passed). A group with no movement while its keepers are idle is reported to the controller as **stalled**.

**Closure criteria (PLATFORM.md §11a, added 2026-10-30).** "Closed" requires, where each applies:
- **implemented:** the acceptance test passes;
- **integrated:** the owner is wired to every former home that now reads it, and a combined test runs them together (through the contract until P0's registry ports exist);
- **validated:** against independent evidence within a declared tolerance, or a recorded "no independent data" with the experiment that would test it.

The registry keeper's re-audit checks all three. DUP-44 meets them: implemented (U16); integrated (I1b runs both engines through the contract); validation not applicable (an identity rule).

| # | Group | State | Keepers to agree | Agreed | Units queued | Closed (commit) | Re-audit |
|---|---|---|---|---|---|---|---|
| 1 | DUP-33 clocks | closing | Kernel, Reality, Settlement, Economy, (Balance) | — | — | — | — |
| 2 | DUP-32 kernels and ids | closing | Kernel, Settlement, Economy, Reality | — | — | — | — |
| 3 | DUP-22 body water and mass | closing: **units queued** | Reality | Reality keeper (P1-MODEL-REVIEW.md) | realism 2623 (plasma term waits on 2643's unit and sign); model reviewed, REVIEWS.md R-1, accepted with conditions | — | — |
| 4 | DUP-44 inventory identity | **closed** | Settlement, Economy | 2026-10-30 (CONTRACTS §15) | settlement keeper | settlement efc72cf; economy d84785a; pirate-ship fc83089 | 2026-10-30 passed: committed CONTRACTS.md byte-identical (md5 0fe282f5); settlement 27/27 incl. U16; pirate `src/economy` 4/4 incl. I1, I1b, I2 |
| 5 | DUP-5 oxygen per MET | closing | Reality | — | — | — | — |
| 6 | DUP-24 resting metabolic rate | closing | Reality | — | — | — | — |
| 7 | DUP-13 fatigue | closing: **units queued** | Reality, Combat | Reality keeper; Combat 2026-10-30 (CMB-12; marker `realism/done/combat-agreed-groups-7-8.md`): the pool rule is Rex's, the pool formula and /40 proposed | realism 2634 (one work record drives local and systemic fatigue); R-1 accepted | — | — |
| 8 | DUP-14 aerobic capacity | closing: **units queued** | Reality, Combat | Reality keeper; Combat 2026-10-30 (CMB-12; marker `realism/done/combat-agreed-groups-7-8.md`): the pool rule is Rex's, the pool formula and /40 proposed | realism 2635 (Banister clamp the only pathway); R-1 accepted with conditions (constants are estimates) | — | — |
| 9 | DUP-18 Banister | closing | Reality | — | — | — | — |
| 10 | DUP-26 labour supply | closing: **units queued** | Settlement, Economy, Reality | 2026-10-30, CONTRACTS §16 (settlement 70e3117, economy 91e374a; committed copies byte-identical, md5 c520e57f) | settlement 2617–2619, economy 2627–2632, Reality population supply 2636; after kernel 2615 | — | — |
| 11 | DUP-28 wages | closing: **units queued** | Settlement, Economy | 2026-10-30, CONTRACTS §16 (`setWage` the only writer of `Post.wage` besides `addPost`, U17) | as group 10 | — | — |
| 12 | DUP-29 labour interfaces | closing: **units queued** | Settlement, Economy | 2026-10-30, CONTRACTS §16 (one LabourSupply declaration, identical text, checked by settlement `check-contract-text.ts` and economy E17) | as group 10 | — | — |
| 13 | DUP-19 mortality | closing: **units queued** | Reality | Reality keeper | realism 2633 (one death, one cause; starvation opens a crisis); R-1 accepted with conditions | — | — |
| 14 | DUP-20 epidemic | closing: **units queued** | Reality | Reality keeper | realism 2626 (new cases from remaining susceptibles); R-1 accepted with a condition | — | — |

Still open for Rex inside the approved groups: Q15 and SET-12 (DUP-26 behaviour), Q10 / CONTRACTS §12.6 (DUP-28),
payer debt (REG-15), and the pool's conversion constant (DUP-14, gameplay).

Refinement B applies throughout: closure removes duplicate **authority**, not every related calculation. Where a
detailed and an aggregate computation legitimately coexist, the group keeps both, names the one owner of the
state, and asks for the aggregation interface to be documented and tested.

## Summary

| # | Group | Authority | Proposed owner of the state | Needs P0 first? | Also blocked on Rex | Run as |
|---|---|---|---|---|---|---|
| 1 | DUP-33 clocks | mixed | Kernel clock | is P0 | — | keeper + belt |
| 2 | DUP-32 copied kernels | duplicate-authority | Kernel package | yes | — | belt (keeper for the id scheme) |
| 3 | DUP-22 body water and mass | duplicate-authority | physiology water balance; nutrition body mass | no | — | keeper + belt |
| 4 | DUP-44 inventory identity | duplicate-authority | Economy inventories | no | — | belt after a contract edit |
| 5 | DUP-5 oxygen per MET | duplicate-authority | physiology energy expenditure | no | — | belt |
| 6 | DUP-24 resting metabolic rate | duplicate-authority | physiology RMR, equation by species | no | — | belt |
| 7 | DUP-13 fatigue | mixed | muscular 3CC (local) + physiology MET-hours (systemic), with a declared relation | no | the pool formula stays Rex's design | keeper + belt |
| 8 | DUP-14 aerobic capacity | duplicate-authority | circulation `aerobic_today` (mL O₂/min) | no | the pool's conversion is Rex's design | belt + doc |
| 9 | DUP-18 Banister | duplicate-authority | muscular Banister, one constant set | no | — | belt (Haiku/Composer) |
| 10 | DUP-26 labour supply | mixed | population supplies person-hours; Settlement assigns; Economy prices | partly (units) | Q15, SET-12 | keeper + belt |
| 11 | DUP-28 wages | duplicate-authority | Economy sets the level; Settlement pays | no | Q10 / CONTRACTS §12.6 | belt |
| 12 | DUP-29 two labour interfaces | duplicate-authority | one LabourSupply interface in CONTRACTS.md | no | — | belt after a contract edit |
| 13 | DUP-19 mortality | mixed | crisis record (individual cause-of-death ledger); population (aggregate) | no | — | keeper + belt |
| 14 | DUP-20 epidemic | aggregation | medicine disease course; population epidemic its aggregate | no | — | belt |

By refinement A, the groups that need no P0 (3–14) can start as soon as Rex approves and the keepers agree; 1 and
2 are P0 itself and go to the Kernel keeper.

Keepers referred to: **Kernel** (new, starting); **Reality** (body-and-world keeper, `HQ/handoffs/reality/`, also the
STATS.md editing coordinator); **Settlement** (`HQ/handoffs/settlement/`); **Economy** (`HQ/handoffs/economy/`);
**Balance** (paused; only for the alignment tick); **Combat** (consumer of fatigue and capacity, CMB-11).
Population sits in Reality until a Society keeper exists (CTRL-5); where a group names "population" as owner,
Reality holds it in the interim.

## 1. DUP-33 — clocks (shared time)

- **Today:** realism's Scheduler (1 s steps), `settlement.day`, `economy.day`, the economy StubLedger's hand-set day,
  the alignment tick, and BODY.md's overnight tick. Nothing converts between them; CONTRACTS.md §9 says
  `economy.tick(N)` but the command takes no day (UNIT-13).
- **Authority:** mixed. Different tick rates per engine are legitimate under one clock; independent counters are
  duplicate authority over time.
- **Proposed owner:** the Kernel clock: one simulated time, with the calendar as a view.
- **Becomes a read or an aggregate:** realism's Scheduler becomes a process group the Kernel schedules every 1 s;
  settlement and economy ticks become daily events in a declared order (today's CONTRACTS.md §9 order); `settlement.day`,
  `economy.day` and the ledger day become views derived from the clock, kept for compatibility; the alignment and
  overnight ticks become plugin events on the same clock.
- **Acceptance test:** P0 (1) and (2): one run drives realism at 1 s and settlement + economy daily for 30 days from
  one clock, and replays byte-identical with the same seed; plus: every engine's day view equals the clock's day at
  every step (no engine increments a counter of its own).
- **Must agree:** Kernel (owner), Reality, Settlement, Economy (CONTRACTS.md §9 changes on both sides, kept
  byte-identical); Balance for the plugin's alignment tick (paused keeper; may wait).
- **Run as:** Kernel keeper designs; Codex builds the scheduler; Sonnet writes each engine's adapter; Haiku checks.

## 2. DUP-32 — copied kernels and id schemes (state ownership)

- **Today:** `reduce`, `Runner`, `ctx`, `mint`, `must`, `finite` copied in settlement and economy (and the pattern in
  realism); three id schemes.
- **Authority:** duplicate authority (the same infrastructure owned three times).
- **Proposed owner:** the Kernel package: reducer and replay, snapshots, id minting with reserved prefixes (`inv.`
  stays Economy's, as agreed).
- **Becomes a read:** the settlement and economy copies become imports; realism's entity registry stays realism's
  (substances, materials, components) and registers its ids through the Kernel scheme.
- **Acceptance test:** realism's 239, settlement's 26 and economy's 25 tests pass unchanged after the switch; a replay
  test is byte-identical before and after; a Kernel test refuses an id minted under another engine's prefix.
- **Must agree:** Kernel, Settlement, Economy, Reality (for the id scheme only).
- **Run as:** belt (Codex or Sonnet; a mechanical refactor), with the Kernel keeper deciding the id scheme.

## 3. DUP-22 — body water, body mass, drug mass (state ownership)

- **Today:** body water in four ledgers (body contents, `waterDeficitKg`, glycogen-bound water, blood volume); body
  mass written by nutrition, circulation and physiology; drug mass held both as registry content and in
  neurology's gut and plasma compartments.
- **Authority:** duplicate authority.
- **Proposed owner:** `realism.physiology.water_balance` owns body water (kg); `realism.nutrition.body_mass` owns mass
  composition; `realism.neurology.pk` owns drug mass.
- **Becomes a read:** `waterDeficitKg` derived from the water balance; glycogen-bound water written as a delta to the
  water balance; plasma volume read from it (this is where "dehydration lowers plasma and oxygen delivery" enters,
  once, instead of beside the hydration factor); circulation's shed blood a delta to body mass; the registry content
  of a drug a view of neurology's compartments.
- **Acceptance test:** drinking 1 L changes body water once and moves deficit, plasma volume and mass consistently;
  the human-week checkpoint's mass balance closes within 1 × 10⁻⁶ kg; a dose's mass is counted once (sum over
  compartments = dose − eliminated).
- **Must agree:** Reality.
- **Run as:** Reality keeper decides the primary states; Codex units build; Haiku checks.

## 4. DUP-44 — inventory identity (state ownership)

- **Today:** settlement's construction step passes `Project.account` (a money holder) to `MaterialProvider.have/take`
  as an inventory id; economy keys inventories by `inv.*` with a separate holder. The pirate adapter's alias table
  hides it (ECON-3 / SET-4).
- **Authority:** duplicate authority (one id carries two identities).
- **Proposed owner:** Economy owns inventories (as CONTRACTS.md already states).
- **Becomes a read:** a project carries an inventory id of its own beside its account; `Project.account` stays money
  only. The adapter's alias table stays until the migration lands, then becomes unnecessary.
- **Acceptance test:** a settlement test where a project with account A and inventory I takes materials from I and
  pays from A; the pirate adapter's I1 and I2 thirty-day tests stay green.
- **Must agree:** Settlement, Economy (a CONTRACTS.md edit, byte-identical on both sides).
- **Run as:** belt (one Codex unit per engine) after the contract text is agreed.

## 5. DUP-5 — oxygen use per MET (metabolism)

- **Today:** 3.5 mL O₂/kg/min per MET in `physics.ts` `metabolicHeat`, in `atmosphere.ts` (`vo2PerMet`), and
  physiology's energy expenditure. Physiology scales energy to the body's RMR; atmosphere's gas exchange does not,
  so heat and gas disagree for any body whose RMR is not 1 kcal/kg/h (the horse).
- **Authority:** duplicate authority.
- **Proposed owner:** `realism.physiology.energy_expenditure` (metabolic rate, W, per body).
- **Becomes a read:** atmosphere's breathing takes O₂ consumption and CO₂ production from that rate through the
  respiratory quotient; `physics.metabolicHeat` becomes a helper only physiology calls.
- **Acceptance test:** for a human with a non-reference RMR and for the horse, O₂ consumed (atmosphere's ledger) ×
  its energy equivalent equals physiology's energy within 1 %; the carbon and oxygen element ledgers still close.
- **Must agree:** Reality.
- **Run as:** belt (Codex), Haiku check.

## 6. DUP-24 — resting metabolic rate (metabolism)

- **Today:** Mifflin in physiology and in `physics.restingMetabolicRate`, Kleiber in anatomy's species profile, and a
  host-set `props.rmr_kcal_day` bridging them.
- **Authority:** duplicate authority.
- **Proposed owner:** `realism.physiology.rmr`, the equation chosen by the species profile (Mifflin for humans,
  Kleiber for other species), its parameters in `realism.anatomy.species_profile`.
- **Becomes a read:** the other two formulas call it; a host-set RMR becomes a labelled override input
  (estimate or fiction), recorded as such.
- **Acceptance test:** one function returns RMR for a human and a horse, each checked against its source; a check
  finds no other RMR formula in `src/`.
- **Must agree:** Reality.
- **Run as:** belt (Codex), Haiku check.

## 7. DUP-13 — fatigue (fatigue)

- **Today:** whole-body MET-hours (physiology), per-muscle-group 3CC (muscular), Banister fatigue (muscular), the
  doc's `fatigueDay` (PHYSIOLOGY.md §6), and the Endurance pool (BODY.md §3, spent by COMBAT).
- **Authority:** mixed. Local (per-muscle) and systemic (whole-body) fatigue are a legitimate detail/aggregate pair,
  as are acute fatigue (minutes to hours) and training fatigue (Banister, days); the doc's `fatigueDay` and the pool
  keeping their own fatigue are duplicate authority.
- **Proposed owner:** `realism.muscular.fatigue_3cc` (local) and `realism.physiology.fatigue_met_hours` (systemic),
  with their relation documented as an aggregation interface; Banister's fatigue declared as the training-response
  state, a different quantity on a different timescale.
- **Becomes a read:** the Endurance pool and Efficiency stay pirate gameplay (Rex's design authority over their
  formulas is unchanged) and are computed in the pirate adapter from these states only; `fatigueDay` becomes a
  restatement.
- **Acceptance test:** one bout of work raises local fatigue in the working groups, and systemic fatigue matches the
  documented aggregate of the same work within a stated tolerance; the pirate adapter holds no fatigue counter of
  its own (a check over its state).
- **Must agree:** Reality (owner); Combat (consumer, CMB-11).
- **Run as:** Reality keeper designs the local/systemic relation (it needs judgement from the central/peripheral
  fatigue literature); then Codex.

## 8. DUP-14 — aerobic capacity (fatigue)

- **Today:** `aerobic_today` in circulation is oxygen delivery at maximal cardiac output in mL O₂/min; PHYSIOLOGY.md
  and BODY.md treat it as an index (`pool = Endurance × aerobic_today / 40`); Banister "performance" is a third
  aerobic measure (UNIT-4).
- **Authority:** duplicate authority, with a unit conflict.
- **Proposed owner:** `realism.circulation.aerobic_today` (mL O₂/min).
- **Becomes a read:** Banister's performance becomes a training input to it (one pathway), never read directly by
  anything else; any index (mL/kg/min, or the pool's /40) is a conversion in the pirate adapter with its unit stated.
- **Acceptance test:** `aerobic_today` is tested in mL O₂/min; changing training shifts it through Banister and
  nothing else reads Banister's performance; the adapter's index carries its unit and is derived, never stored.
- **Must agree:** Reality (owner and STATS.md editing coordinator); Combat. The pool's conversion constant is
  gameplay: Rex's.
- **Run as:** belt (Codex for the code; Composer for the doc fix through the Reality keeper).

## 9. DUP-18 — Banister impulse-response (fatigue)

- **Today:** the table lives in the physiology library, the code in `muscular.ts`, and the physiology flags say "not
  implemented"; the prose gives one constant set, the table another.
- **Authority:** duplicate authority (and a value conflict).
- **Proposed owner:** `realism.muscular.banister`, with one constant set taken from its cited source.
- **Becomes a read:** the physiology library table becomes the data muscular reads; the flags and the prose cite the
  same constants.
- **Acceptance test:** the Banister test reproduces a published worked example; one registry row; the library table
  and the prose agree.
- **Must agree:** Reality.
- **Run as:** belt (Haiku or Composer for the data and doc; Codex only if the code's constants change).

## 10. DUP-26 — labour supply (labour)

- **Today:** population's labour (adults × health × (1 − sick), health applied twice), Settlement's LabourProvider,
  Economy's LabourSupplyProvider, ecology's labour per hectare, and recipes' labour per unit; worker-days in one
  place, hours in another (UNIT-11); `hoursPerDay` 10 with no source vs 11 in Voth (SET-12).
- **Authority:** mixed. Aggregate supply (population) and detailed assignment (Settlement) are legitimate layers; two
  interfaces and two units are duplicate authority.
- **Proposed owner:** population supplies person-hours by category (Reality in the interim, Society later);
  Settlement owns assignment (who works where, the labour cap); Economy owns the labour requirement per unit of
  output and its price. One unit: person-hours.
- **Becomes a read or an aggregate:** ecology's labour per hectare becomes recipe data in Economy; the double health
  factor is removed from the population formula (a fix, recorded).
- **Acceptance test:** in a 30-day settlement and economy run, assigned hours never exceed supplied hours on any day;
  the units check (P0 dimensional validation) passes on every labour interface; two lines sharing workers behave as
  Rex decides in Q15.
- **Must agree:** Settlement, Economy, Reality (interim population).
- **Also blocked on Rex:** Q15 (how lines share labour) and SET-12 (hours per day) decide behaviour; ownership can be
  decided now.
- **Run as:** keepers agree the contract; Codex builds.

## 11. DUP-28 — wages (labour)

- **Today:** Settlement pays a fixed `Post.wage` per day; Economy's `wageQuote` is a query nothing consumes; payers may
  go into unlimited debt.
- **Authority:** duplicate authority.
- **Proposed owner:** Economy's wage quote sets the level (the default rule, posted-median, applies no pressure, so
  today's behaviour is unchanged); Settlement's `pay` executes it.
- **Becomes a read:** `setWage` becomes the command through which the level reaches posts.
- **Acceptance test:** with the default rule the ledger is identical to today's (a regression test); with a pressure
  rule, wages move only through `setWage` and payment reads them.
- **Must agree:** Settlement, Economy.
- **Also blocked on Rex:** Q10 / CONTRACTS.md §12.6 (wage levels, and whether a quote may move them). Whether a payer
  may go into debt is a further question for Rex, recorded here, not decided.
- **Run as:** belt (Codex).

## 12. DUP-29 — two labour interfaces (labour)

- **Today:** Settlement's `LabourProvider.draw / available / productivity` and Economy's `LabourSupplyProvider.supply`;
  neither is implemented.
- **Authority:** duplicate authority.
- **Proposed owner:** one LabourSupply interface in CONTRACTS.md, implemented by population.
- **Becomes a read:** both engines compile against the one interface.
- **Acceptance test:** one interface type; both engines' tests pass against a stub implementation of it.
- **Must agree:** Settlement, Economy (a CONTRACTS.md edit, byte-identical).
- **Run as:** belt (Codex or Sonnet).

## 13. DUP-19 — mortality (mortality)

- **Today:** circulation hazards, medicine's fatal draw, anatomy's crisis floors, and population's background,
  epidemic and famine deaths; no shared cause-of-death ledger.
- **Authority:** mixed. Individual and aggregate mortality coexist legitimately (one per resolution, PLATFORM.md §9);
  several individual sources each killing on their own are duplicate authority.
- **Proposed owner:** individual death: `realism.anatomy.crisis_floors` through `realism.infra.crisis_record`, the one
  cause-of-death ledger (circulation hazards and medicine's fatal draws become causes that feed it, never kill
  directly); aggregate death: population, its rates derived from the same parameters, the aggregation interface
  documented. The "no silent death" policy stays the plugin's.
- **Acceptance test:** every individual death in the 30-day run and in checkpoint 2 has exactly one recorded cause; a
  cohort of individuals and the aggregate run on the same inputs give death counts within a stated confidence band
  over one simulated year.
- **Must agree:** Reality. Combat and Balance consume deaths but their rules are unaffected.
- **Death and fate (Rex, 2026-10-30): an interface, not an overlap (IF-1, GRAPH.md §2).** Reality decides
  biological failure, with a crisis before every death; the pirate fate system decides what a dead character
  becomes (ghost, form, resurrection). The two rules are compatible. The plugin reads the death and its cause from
  the crisis record; Reality never reads the fate. Nothing in this group closes or changes the fate system, and the
  ghost-rule question (CMB-1 / BAL-28) is unaffected.
- **Run as:** Reality keeper designs the ledger; Codex builds.

## 14. DUP-20 — epidemic (mortality)

- **Today:** `population.ts` re-implements medicine's exposure and course as expected values and keeps its own health,
  food and seasoning shares.
- **Authority:** aggregation (legitimate, once it reads medicine's parameters).
- **Proposed owner:** `realism.medicine.disease_course` owns the course and its parameters; the population epidemic
  stays as its documented expected-value aggregate.
- **Becomes an aggregate:** the population epidemic reads medicine's parameters through one shared parser.
- **Acceptance test:** the mean of 1,000 individual runs and the aggregate agree within a stated tolerance on attack
  rate, case fatality and duration.
- **Must agree:** Reality.
- **Run as:** belt (Codex), Haiku check.

## Next batches (proposed)

| Batch | Theme | Groups |
|---|---|---|
| 2 | capacity and double penalties | DUP-15, 16, 17, 37, 38, 47; sleep DUP-12; blood and gas DUP-11, 23, 25; food DUP-21 |
| 3 | physical constants and formulas | DUP-1, 2, 3, 4, 6, 7, 8, 10, 40; degradation DUP-9 |
| 4 | economy hygiene and boundaries | DUP-27, 30, 31, 43, 45; taxation DUP-42 |
| 5 | homes in the wrong engine | DUP-34, 35, 36, 39, 41, 46 |
