# Overlap groups, batch 2 (registry keeper, 2026-10-30)

**Status: proposed, for Rex.** The second of five batches of the overlap groups (GRAPH.md §2): capacity and double
penalties, sleep, blood and gas, food. Same form as batch 1. For each group Rex is asked one thing: **approve the
proposed owner, change it, or hold it.** Approval starts nothing by itself: each group starts only when the keepers
named under "must agree" accept the ownership and the acceptance test. Nothing is deleted; a losing home becomes a
read, an aggregate or a restatement.

A group closes under the same criteria as batch 1 (PLATFORM.md §11a):
- **implemented:** the acceptance test passes;
- **integrated:** a combined test of the owner with every former home that now reads it;
- **validated:** against independent evidence within a declared tolerance where such data exists. This applies in particular to groups 1, 2, 7, 8 and 9, whose quantities have published human data; groups 5 and 6 are gameplay, so validation does not apply to them.

These groups enforce PLATFORM.md §7's sharpest rule: **no engine applies a second penalty for an effect owned
elsewhere.** Refinement B still applies: a detailed and an aggregate computation may coexist when one owner holds
the state and the aggregation interface is documented.

## Summary

| # | Group | Authority | Proposed owner of the state | Reads from (must close first) | Also needs Rex | Run as |
|---|---|---|---|---|---|---|
| 1 | DUP-15 work capacity | duplicate-authority | a new universal `realism.capacity.functional`: one combination rule over biological states | batch 1: DUP-13, 14, 22 | only if no source gives the combination rule | keeper + belt |
| 2 | DUP-16 vitamin C | duplicate-authority | nutrition pool → anatomy collagen state (one pathway) | — | — | belt |
| 3 | DUP-17 ageing | duplicate-authority | cellular ageing, `realism.cellular.ageing_emergent` (planned, Rex's cellular layer) | R-CELL, P3 | — | registry + Reality keeper; later P3 |
| 4 | DUP-37 vision | duplicate-authority | the capacity combination (group 1), with optics as its physical input | group 1 | — | belt after group 1 |
| 5 | DUP-38 state multiplier, drink | duplicate-authority | neurology for intoxication; BODY.md for the pirate "state" multiplier | — | which item list the multiplier has | doc (Composer) + adapter (Codex) |
| 6 | DUP-47 Endurance pool | duplicate-authority | BODY.md §3 (pirate gameplay), reading universal states only | batch 1: DUP-13, 14; group 1 | the pool formula (with or without its own heat factor) | doc + adapter |
| 7 | DUP-12 sleep pressure | duplicate-authority | neurology sleep-wake (adenosine) | — | — | belt |
| 8 | DUP-11 haemoglobin saturation | duplicate-authority | circulation (blood gas) | — | — | belt |
| 9 | DUP-23 blood volume, resting cardiac output | duplicate-authority | anatomy species profile (the parameter) | — | — | belt |
| 10 | DUP-25 gas tolerance thresholds | duplicate-authority | atmosphere (exposure) and medicine (effects); anatomy keeps species data only | — | — | belt |
| 11 | DUP-21 food | mixed | Economy (food leaving inventory), nutrition (intake and starvation), population (aggregate) | batch 1: DUP-19; Economy PLAN step 11 | — | keepers agree a contract; belt |
| 12 | DUP-49 appetite and the eating rule (added 2026-10-30) | duplicate-authority | Reality: hunger and fullness as body signals; Cognition: appetite's palatability and the eating decision | — | which parts are game content | doc edits (Composer), no code |

Order within the batch: groups 2, 7, 8, 9, 10 stand alone and can start as soon as they are approved and agreed;
group 1 waits for batch 1's fatigue and water groups; 4 and 6 wait for group 1; 11 waits for the mortality ledger
(DUP-19); 3 waits for the R-CELL audit and P3.

Keepers referred to: **Reality** (body-and-world keeper; also the STATS.md editing coordinator), **Economy**,
**Combat** (consumer of capacity, vision and the pool, CMB-11). Rex is the design authority over STATS.md
gameplay (scales, Poise, Efficiency, the pool); those items are marked.

## 1. DUP-15 — work capacity (capacity, double penalty)

- **Today:** four separate multipliers on work: `work_capacity_heat` (WBGT core drift), `work_capacity_hydration` and
  `endurance_hydration` (hydration bands), starvation ×0.8 (nutrition library), plus BODY.md's own work capacity and
  `Strength_today`; the hydration and bleeding library rows name game attributes ("Endurance pool ×0.8", "Wits ×0.7"),
  so a host applying both sets would stack them.
- **Authority:** duplicate authority, and a double penalty.
- **Proposed owner:** a new universal mechanism, `realism.capacity.functional`: the universal core of BODY.md's hub.
  It reads each biological state once (core temperature, hydration, blood, glycogen, fever, wounds, fatigue, aerobic
  capacity) and applies **one combination rule** stated once (for example, the worst dip, or a product), with its
  source.
- **Becomes a read or a restatement:** the four multipliers become inputs to it; the game-attribute names in the
  realism library move to the pirate stats adapter (`web/src/world/adapters/stats.ts`, whose `capabilityToday` and
  `adapters/medicine.ts` `dipFactor` are already the right pattern); BODY.md §2–3 keep the STATS scaling (Rex's
  design) and cite the capacity output.
- **Acceptance test:** (1) a body at 6 % dehydration and a WBGT of 32 °C has a capacity equal to the declared
  combination of the two causes, each counted once; (2) removing one cause restores exactly its share; (3) a check
  finds no game-attribute name in `realism/data/library` or `src/`; (4) the pirate adapter reads only capacity
  outputs, never a raw multiplier.
- **Must agree:** Reality (owner; and as STATS.md editing coordinator); Combat (consumer).
- **Also needs Rex:** only if no source gives the combination rule (worst dip vs product). Per the no-invented-rules
  rule, the Reality keeper researches it first and asks Rex if the evidence is silent.
- **Run as:** Reality keeper designs; Codex builds; Haiku checks the library names.

## 2. DUP-16 — vitamin C (double penalty)

- **Today:** vitamin C below 300 mg drives four consequences: the nutrition deficiency stage, anatomy collagen loss
  (−0.02/day), medicine healing ×3, and a separate `scurvy` disease course (42–84 days' incubation).
- **Authority:** duplicate authority, and a double penalty.
- **Proposed owner:** one pathway: the nutrition pool sets the anatomy collagen state; healing reads collagen, not
  vitamin C. "Scurvy" becomes the name (diagnosis) of that state, not a second course.
- **Becomes a read or a restatement:** medicine's ×3 healing row reads collagen; the scurvy disease row becomes a label
  over the nutrition and collagen states.
- **Acceptance test:** (1) holding collagen fixed while vitamin C is low leaves healing unchanged; (2) depleting
  vitamin C slows healing only through collagen; (3) no scurvy course advances on its own clock.
- **Must agree:** Reality.
- **Note:** this pathway moves under cellular ownership later (collagen synthesis is a cellular process); the R-CELL
  audit records it.
- **Run as:** belt (Codex), Haiku check.

## 3. DUP-17 — ageing (double penalty)

- **Today:** age effects in four unlinked places: the physiology ageing table (no code reads it), medicine's healing
  by age (>50 ×1.3, >65 ×1.6), muscular's age gate (×0.8 at 45), neurology's dopamine decline (−5 %/decade after
  40); plus STATS ageing maxima and PHYSIOLOGY.md §8 curves.
- **Authority:** duplicate authority.
- **Proposed owner:** `realism.cellular.ageing_emergent` (planned; Rex's cellular layer, 2026-10-30): ageing emerges
  from cellular states and acts through organ capacity, never as a timer.
- **Becomes a read or a restatement:** until the cellular layer is built, the four existing effects stay as labelled
  approximations (evidence level 4), frozen: no new age-keyed multiplier may be added (the registry check enforces
  it once P0 lands). The physiology ageing table becomes reference data for validating the cellular model. STATS
  ageing maxima stay Rex's gameplay, reading capacity.
- **Acceptance test:** interim: a check that no mechanism outside these four reads age directly; final: ROADMAP P3
  tests (4) and (5) (capacity declines only through cellular states; same-age people with different histories
  differ).
- **Must agree:** Reality.
- **Run as:** the R-CELL audit (registry and Reality keepers) after P0 and P1, then P3 building. No belt work now.

## 4. DUP-37 — vision (double penalty)

- **Today:** smoke sets "Eyesight ×0.6" directly (CHEMISTRY.md), COMBAT sets eyesight dips from head wounds, and optics
  (Phase 8) is planned.
- **Authority:** duplicate authority.
- **Proposed owner:** the capacity combination of group 1, with optics as its physical input once built: smoke acts
  as light attenuation (optics) and eye irritation (medicine air conditions); a head wound acts through medicine's
  wound state.
- **Becomes a read or a restatement:** CHEMISTRY.md's ×0.6 row becomes a restatement citing the two pathways; COMBAT
  reads eyesight capacity.
- **Acceptance test:** smoke and a head wound together give an eyesight capacity equal to the declared combination,
  each cause once; smoke alone changes eyesight only through attenuation and irritation.
- **Must agree:** Reality; Combat.
- **Run as:** belt after group 1; the optics input arrives with P2.

## 5. DUP-38 — the "state" multiplier and the drink factor

- **Today:** the pirate "state" multiplier is stated three ways (STATS.md §4 with six items, BODY.md §2 with three,
  PSYCHOLOGY.md §3 with six, "not computed here"); `drinkFactor` is a STATS placeholder while neurology already
  produces the real intoxication outputs.
- **Authority:** duplicate authority.
- **Proposed owner:** `realism.neurology.circuits` (with its pharmacokinetics) for intoxication; BODY.md §2 for the
  pirate "state" multiplier (one definition; STATS.md and PSYCHOLOGY.md cite it).
- **Becomes a read or a restatement:** `drinkFactor` becomes a read of neurology's output in the pirate adapter; the
  STATS and PSYCHOLOGY statements become restatements.
- **Acceptance test:** one definition of the state multiplier, cited by the other two docs; drinking changes
  performance only through neurology's output.
- **Must agree:** Reality (STATS.md editing coordinator).
- **Also needs Rex:** which item list the multiplier has (six or three items); this is gameplay design.
- **Run as:** doc work (Composer, through the Reality keeper); one adapter unit (Codex).

## 6. DUP-47 — the Endurance pool

- **Today:** its formula is in BODY.md §3 (with a heat factor), in PHYSIOLOGY.md §6 (without one), and COMBAT spends
  it.
- **Authority:** duplicate authority.
- **Proposed owner:** BODY.md §3 (pirate gameplay), computed in the pirate adapter from universal states only (batch
  1's fatigue and aerobic capacity, and group 1's capacity).
- **Becomes a read or a restatement:** PHYSIOLOGY.md §6 becomes a restatement; COMBAT reads the pool through the
  adapter.
- **Acceptance test:** one formula in one doc; the adapter holds no fatigue or heat state of its own; combat's spend
  reads the adapter's value.
- **Must agree:** Reality (coordinator); Combat.
- **Also needs Rex:** the formula. If the pool reads group 1's capacity, which already includes heat, a heat factor
  of the pool's own would penalise heat twice; the registry keeper's proposal is the version without it, for Rex to
  decide.
- **Run as:** doc (Composer) and adapter (Codex), after group 1.

## 7. DUP-12 — sleep pressure

- **Today:** physiology's `sleep_debt` and alertness, and neurology's hours awake, adenosine and arousal; the library
  calls adenosine "the mechanism under" the debt table but nothing links them. Two alertness-like outputs.
- **Authority:** duplicate authority.
- **Proposed owner:** `realism.neurology.sleep_wake` (adenosine) for sleep pressure.
- **Becomes a read:** physiology's alertness reads neurology's arousal; sleep debt over several days is computed from
  the same state (documented); medicine's healing ×1.2 reads it.
- **Acceptance test:** 24 hours awake raises one sleep pressure; alertness and arousal are one output; healing reads
  it; the human-week checkpoint gives the same results within its tolerance (no silent change).
- **Must agree:** Reality.
- **Run as:** belt (Codex), Haiku check.

## 8. DUP-11 — haemoglobin saturation

- **Today:** coded in `atmosphere.ts`; documented as circulation's (CIRCULATION.md §1a). The seed quantity `air.sao2`
  has two candidate writers (REG-16).
- **Authority:** duplicate authority.
- **Proposed owner:** circulation (blood gas); atmosphere supplies alveolar oxygen pressure only.
- **Becomes a read:** atmosphere's breathing reads saturation from circulation; the quantity is renamed `body.sao2`
  (an alias recorded).
- **Acceptance test:** one saturation function, in circulation; the atmosphere and circulation tests give the same
  values before and after.
- **Must agree:** Reality.
- **Run as:** belt (Codex).

## 9. DUP-23 — blood volume and resting cardiac output

- **Today:** blood volume per kg in anatomy's species profile (70; horse 80) and in circulation (parsed from prose);
  resting cardiac output in both; anatomy checks they are equal at assembly.
- **Authority:** duplicate authority.
- **Proposed owner:** `realism.anatomy.species_profile` holds the species parameters; circulation reads them.
- **Becomes a read:** circulation's normal blood volume and cardiac output come from the profile; the prose parse and
  the equality check become unnecessary.
- **Acceptance test:** one parameter per species; human and horse values unchanged; a check finds no prose parse
  for them.
- **Must agree:** Reality.
- **Run as:** belt (Codex or Haiku).

## 10. DUP-25 — gas tolerance thresholds

- **Today:** "hypoxia under 16 % O₂, CO₂ over 3 %" in anatomy's respiratory profile, saturation and CO₂ patterns in
  medicine's air conditions, and atmosphere's own thresholds.
- **Authority:** duplicate authority.
- **Proposed owner:** `realism.gas.thresholds_layering` for exposure (what the air is), `realism.medicine.air_conditions`
  for effects (what it does to a body); anatomy keeps species tolerance data only, read by medicine.
- **Becomes a read:** anatomy's thresholds become data; no threshold is stated twice.
- **Acceptance test:** each threshold appears once, as data; a body in 15 % O₂ shows one effect, computed in medicine.
- **Must agree:** Reality.
- **Run as:** belt (Codex), Haiku check.

## 11. DUP-21 — food

- **Today:** four food accounts: population's `foodDays`, Economy's per-capita consumption, per-body nutrition, and the
  pirate adapter's rations (`web/src/world/adapters/food.ts`); hunger can kill by two paths (population famine ×1.5
  and per-body starvation).
- **Authority:** mixed. Population's famine as an aggregate of nutrition status is legitimate; the rations and
  Economy's consumption as two authorities over one flow are duplicates.
- **Proposed owner:** Economy's consumption moves food out of inventories (kg); `realism.nutrition` owns intake and
  starvation per body; population famine is the documented aggregate of nutrition status (the aggregation interface);
  the pirate rations become the plugin's choice of what to eat, reading Economy's inventory and writing meals into
  nutrition, never a separate account.
- **Becomes a read or an aggregate:** population `foodDays` derived; famine deaths through the one cause-of-death
  ledger (DUP-19).
- **Acceptance test:** in an integrated run, food removed from inventories each day equals food eaten plus spoilage
  and waste (kg); one starvation rule exists; aggregate famine deaths match a cohort of individuals on the same
  inputs within a stated band.
- **Must agree:** Economy, Reality (nutrition, population, and the world adapters).
- **Run as:** the keepers agree the population/nutrition provider in CONTRACTS.md (Economy PLAN step 11); then Codex.

## 12. DUP-49 — appetite and the eating rule (added 2026-10-30)

- **Today:** two decision rows sit inside the nutrition library (`data/library/nutrition.json` body_composition, registry id `realism.nutrition.hunger_fullness`):
  - **appetite** = hunger × palatability × state, computed for each food offered;
  - **eating-rule**: the person eats if appetite is over 0.3 or hunger is over 0.8.

  Both decide what a person does, which is Cognition's job (drive, priority, selection; `Toolchain/cognition/DESIGN.md` §8). The pirate NUTRITION.md §4 restates them. Neither has code.
- **Authority:** duplicate authority. Both sides are documented only; nothing is built.
- **Proposed owner** (Reality keeper, with the cognition keeper):
  - Reality keeps fullness and hunger as **body signals** (`body.hunger_signal`); the library's "drive" wording becomes "signal".
  - Appetite's palatability and the eating decision go to Cognition (`cognition.needs.drive`, `cognition.decision.select`), or to the game where they are its content (food preferences of a character, a game's "eats when" rule).
- **Becomes a restatement:** the two library rows and NUTRITION.md §4 cite their owners.
- **Acceptance test:** no decision rule remains in Reality's library (a check for thresholds on appetite or hunger that choose an action); Cognition's hungry-pair benchmark (DESIGN.md §6) eats through `decision.select` reading `body.hunger_signal`.
- **Must agree:** Reality, Cognition.
- **Also needs Rex:** which of palatability and the eating rule are game content rather than universal cognition.
- **Run as:** doc edits (Composer, through the two keepers); no code exists to change.

## After batch 2

| Batch | Theme | Groups |
|---|---|---|
| 3 | physical constants and formulas | DUP-1, 2, 3, 4, 6, 7, 8, 10, 40; degradation DUP-9 |
| 4 | economy hygiene and boundaries | DUP-27, 30, 31, 43, 45; taxation DUP-42 |
| 5 | homes in the wrong engine | DUP-34, 35, 36, 39, 41, 46 |
