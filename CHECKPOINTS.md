# Checkpoints

## Checkpoint 1 — human week (2525, 2026-10-29)

Run `node --experimental-strip-types examples/human-week.ts`.
Run the gate: `npx vitest run && npx tsc --noEmit && node --experimental-strip-types examples/human-week.ts > /dev/null`
(PowerShell uses `$null` for the final redirect.)

The example declares its synthetic day, body, initial reserves, meal masses, drinks,
work schedule and door schedule. This is a prescribed experiment, not weather data,
a recommended diet, or a game adapter. Seven complete 05:00–05:00 days use 60 s
steps (the occupied-box library row). Normal sleep is 23:00–05:00; nights 3 and 5
replace 23:00–01:00 with watch. The remaining four hours are continuous sleep,
so the table's 4-on/4-off quality penalty is not applied. The fixed outdoor day
(18 C at 05:00, 24 C at 15:00) repeats via `environment.diurnalC`; humidity follows
the inherited outside water mixing ratio and the room's vapour balance.

Order: circumstances (food, drinking, door, outdoor curve), room ventilation,
environment (room temperature/humidity to WBGT), physiology, breathing,
nutrition, neurology, audit, then `World.afterStep`. METs and food composition
come from library ids; ACH 0.2/2 comes from the ventilation-events example.
The environment's zero-offset exposure row is a named WBGT baseline, not a claim
that the room is a ship's deck. No game imports, servers, downloads or agents.

The ledger prints daily kcal in/out and storage change, mass, water deficit,
sleep debt, alertness, core temperature, room CO2 peak, all pooled nutrient
levels/stages and circuits keyed by their library row ids. Outputs are retained
at full precision for tests; printed numbers are rounded only for readability.

### What passed

- All seven days close on the final interval, with no extra step or eighth-day
  meal. Physiology and nutrition previously closed at the start of the following
  step, including that step's expenditure in nutrition. Both now close after
  accumulating the final interval. Integer elapsed seconds are combined before
  converting to hours, avoiding a floating-point miss at midnight.
- Each day's food energy matches the food rows; intake minus expenditure equals
  storage change within 1% (actual floating-point residuals are much smaller).
  Pending energy is traced between the daily storage updates and checked each step.
- Water closes for the body and body-plus-room, including food, drinks, sweat
  and ventilation. All pooled nutrient masses and room O2/CO2/N2 close each step.
  Room elements close too. `World` now accepts the deliberately empty chemical
  formulas of mass-only nutrient/drug ledger substances; malformed nonempty
  formulas still go through the strict parser.
- Weekly mass change matches the library's fat/glycogen energy accounting.
  Sleep debt is 2, 4, 8, 10, 14, 16, 18 h. Alertness matches the corresponding
  debt row times the 02:00–06:00 circadian factor, including both watch nights.
- A controlled, isothermal replay of one sleeper in the same 40 m3 room at
  shut-door ACH matches the continuous box-model CO2 peak within 1%, including
  oxygen consumption in the mole-fraction denominator. This isolates the box
  equation from the week run's changing temperature, sweat and body mass; it
  does not pretend those changing conditions have a constant-source solution.
- Every numeric output is finite at every minute. All transfers are finite.
  The week takes roughly 1.5–2 seconds locally, below the 20 s acceptance bound.
- Gate: 140 tests in 11 files passed, including the unchanged still tests;
  TypeScript and the shell example passed. No existing tolerance was loosened.

### What it cannot prove — FLAGS touched

The following existing FLAGS remain limitations, not new fitted coefficients.
Unmentioned grid, fire, toxic-dose, drug-withdrawal, cold-water and disease paths
are not exercised. No unsupported calibration has been enabled for this checkpoint.

| Module / FLAGS topics touched | Scope and limitation |
| --- | --- |
| Physiology: sweat coefficients, skin area/h, thermoregulating tissue vs core | The inherited PHYSIOLOGY/ENG-HT model is exercised unchanged; energy bookkeeping is not validation of heat control. The fixture loses its full initial 40 kg water by day 7 and continues work. This is an exposed model failure, not a plausible surviving human. |
| Physiology: urine/breath losses, hydration threshold shift, core cooling, shade bonus, heat-day definition, cold drift | Only sweat/food/drinking move water; absent loss, cooling and cold paths remain absent. The daily sheltered core reset is the library rule; constant final core does not prove thermal safety. No shade bonus is added; heat acclimatisation retains its existing any-hot-step definition. |
| Physiology: sleep quality and debt cap | Continuous six/four-hour nights use no unsupported quality weights or debt cap. No split-night or sleep-quality calibration is claimed. |
| Nutrition: starting fat, lean catabolism, starvation clock, glycogen water/body mass | Initial fat and water are declared host inputs. Mass is the existing fat-only composition proxy: it excludes changing water and glycogen mass, food oxidation and lean tissue. No survival/death or starvation-stage inference is made. |
| Nutrition: deficiency stages, pools without reserves, recovery clocks | Only numeric pooled reserves and stage 1 are exercised. Sodium is depleted on day 1; magnesium later. Unpooled nutrients have no invented reserve; stages 2/3 stay disabled. A seven-day run cannot validate long deficiency/recovery times. |
| Nutrition: absorption, food classes, missing vitamins, protein quality | Existing meal absorption and named fish classification are used; missing vitamin D/iodine, protein quality and unpooled chemistry remain unsupported. No flux, raw-fish, alcohol, cooking or grain modifiers are added. |
| Nutrition: fullness/hunger/appetite | Meals are prescribed. No automatic hunger or appetite signal is fabricated for neurology. |
| Atmosphere: breath water, gas source units, outside water/N2, gas layers | Breath water is absent. Sources remain litres at room conditions; outside humidity and argon folded into nitrogen retain existing assumptions. This is a well-mixed box, not stratification or a measured bedroom ventilation rate. |
| Atmosphere: body elemental ledger, A–a gradient and respiratory calculator, gas shifts/drive failure | Only the room has an elemental ledger; oxidised food chemistry cannot yet close across the body. Respiratory outputs retain the existing calculator and unmodelled pH/temperature/CO effects. No pathological drive or tissue-exchange validation. |
| Environment: diurnal extreme hours/interpolation, day length, WBGT error and wind/sun, vector exposure | Extreme values/hours and daylight are host fixture inputs. Existing interpolation and WBGT are reused, without an invented error bound, radiation model or climate table. Vector exposure and sunburn time remain null. |
| Neurology: sleep clearance, baseline driver sizes and decay times, deficiency/genetics, liver function | The example explicitly marks asleep; the existing immediate adenosine reset and exercise/heat drivers are exercised. No deficiency effect size, starvation/hunger driver or liver model is fabricated. Day-end circuit snapshots do not prove cognition or dehydration survival. |
| Neurology: EC50/tolerance/rebound, inverted-U circuits, sleep quality, outputs/ranges | No drugs or calibration overrides are supplied. EC50 occupancies stay null and tolerance build stays off. Inverted-U terms and sleep quality remain disabled; circuit row ids, existing baseline-centred reads and clamps are reported, not validated against measured performance. |

The most important downstream warning is the dehydration/continued-activity result.
Conservation passes precisely because the water ledger tracks this depletion;
it must not be presented as a successful physiological survival prediction.

## Checkpoint 2 — human wound (2531, 2026-10-30): partial, acceptance blocked

Run `node --experimental-strip-types examples/human-wound.ts`.
Gate: `npx vitest run && npx tsc --noEmit && node --experimental-strip-types examples/human-wound.ts > /dev/null`
(PowerShell uses `$null` for the redirect and separate commands with exit checks.)

The example runs three independent copies of checkpoint 1 with the same seed:
bound immediately, bound after one hour, and never bound. Output is interleaved
by day for comparison. A small optional extension hook in `runHumanWeek` adds
checkpoint processes before its existing audit; default checkpoint-1 behavior
and tests remain unchanged. Anatomy adds zero-mass organ/tissue views. Medicine
creates a class-II thrust at day 2 05:00. The left hand hauls for one minute at
08:00 on days 1 and 2 using the activation row and its MET in physiology, then
rests while the ordinary week duties continue. Medicine uses the day's work/rest,
nutrition and sleep factors. Organ snapshots run hourly after breathing and
medicine; muscle fractions and the existing mass proxy are checked every minute.

The daily ledger includes library-id blood volume, DO2 and medicine outputs,
organ functions below one and unknown organs, unknown thrust pain as null, sick
and wound lists, left-hand peak/end fatigue and crisis records. Right-hand
fatigue is null because it is not simulated. The three simulations are isolated,
not three people sharing one room. No wound-to-strength multiplier is invented.

**This checkpoint is not fully accepted.** The task's requested untreated
haemorrhage trajectory cannot be computed from the supplied library: there is
no thrust bleed rate or clotting value, no blood-volume-to-cardiac-output curve,
and no numeric downstream organ-cascade kinetics. Rates stay null; binding is
scheduled and recorded, but all three runs retain their blood and produce no
haemorrhage crisis. A separate test prescribes the circulation table's loss
amounts, verifies class III/IV perfusion and the anatomy crisis record, and
verifies that no dead flag is set. That is a response to supplied loss, not a
predicted untreated wound course or a quantified DO2 failure.

The clean wound row gives 14–30 days, beyond the seven-day integrated run.
`healingReference` separately advances a bound wound with neutral healing
factors through the row's maximum. Seed 1 heals on its drawn day (14); seed 2
draws infection and remains paused. Neither result forces infection or clears
it. The integrated wounds remain open at day 7; their actual daily progress is
tested against the medicine healing multipliers, including the day-2 work rule.

Conservation checks cover blood volume, haemoglobin in the prescribed-loss
probe, muscle fractions, and the inherited energy/water/nutrient/gas ledgers.
The body mass assertion checks nutrition's existing fat-only proxy and that
organ shells add no mass. Physical total body mass including shed blood cannot
be validated without density/composition and coupling rules. This and the timed
untreated-crisis case remain explicit TODO tests. Checkpoint 1's dehydration,
continued activity, and other limitations above still apply. See FLAGS.md's
checkpoint-2 section for missing inputs; no unsupported calibration is enabled.

Validation: full gate passed on 2026-10-30: 216 tests passed in 18 files,
2 explicit checkpoint-2 TODOs; `npx tsc --noEmit` passed; the shell example
exited 0. Existing still and checkpoint-1 tests were unchanged and passed.
The TODOs mean a green executable gate does not imply full checkpoint acceptance.
