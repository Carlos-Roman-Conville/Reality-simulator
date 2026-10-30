/**
 * Human energy, heat, sleep and water as one engine process on a `body` component (kind "body", `props`). Every table
 * number comes from `data/library/physiology.json` through library.ts; the formulas are Mifflin-St Jeor (physics.ts,
 * PHY-MSJ), the MET cost (physics.ts metabolicHeat, PHY-MET) and the drift rule of PHYSIOLOGY.md section 4. What the docs
 * ask for and the library cannot support is listed in FLAGS.md and left disabled here.
 *
 * Inputs on `body.props` (all optional): height_cm, age_y, male (1 or 0) for the resting rate; acclimatisation (0 to 1,
 * default 1: the table's ceilings are the acclimatised ones); core_c (default: the recovery table's resting core);
 * sheltered (1 default; 0 for a wet cold night); work_w (external work, W); intake_kcal (food energy eaten); area_m2 and h.
 * Outputs by library id on `body.props.outputs` (read them with `bodyOutputs`): alertness, sleep_debt, circadian,
 * core_c, core_state, work_capacity_heat, water_deficit_pct, hydration_state, endurance_hydration, energy_balance_kcal,
 * pal, rmr_kcal, sweat_l_per_h, wbgt_c, wbgt_ceiling_c, acclimatisation, fatigue_met_hours, and the matching `*_row` ids.
 */
import type { Process } from "./scheduler.ts";
import { addHeat, type World } from "./world.ts";
import type { Component } from "./registry.ts";
import { KCAL_J, SWEAT_LATENT, heatFlow, metabolicHeat, restingMetabolicRate } from "./physics.ts";
import { libraryTable, type LibraryRow } from "./library.ts";
import { accumulateExposure } from "./atmosphere.ts";

export type BodyOutputs = Record<string, number | string | null>;

/** The outputs record of a body, created on first use. It lives at `props.outputs` (props is typed numbers only). */
export function bodyOutputs(body: Component): BodyOutputs {
  const p = body.props as unknown as { outputs?: BodyOutputs };
  return (p.outputs ??= {});
}

/** PHYSIOLOGY.md section 4 [model, proposed]: sweat L/h = clamp(0.3 + 0.25 MET + 0.1 over, 0.3, 2.5). In FLAGS.md. */
const SWEAT = { base: 0.3, perMet: 0.25, perOver: 0.1, min: 0.3, max: 2.5, coolFactor: 0.2, coreGateC: 37.0 } as const;

interface Band { lo: number; hi: number; row: LibraryRow }

/** "0 to 4", "over 40", ">= 40.0", "< 32.0" as the half-open interval [lo, hi). */
function parseBand(label: string): { lo: number; hi: number } {
  let m = /^(?:>=|over)\s*(-?[\d.]+)$/.exec(label);
  if (m) return { lo: Number(m[1]), hi: Infinity };
  m = /^(?:<|under)\s*(-?[\d.]+)$/.exec(label);
  if (m) return { lo: -Infinity, hi: Number(m[1]) };
  m = /^(-?[\d.]+) to (-?[\d.]+)$/.exec(label);
  if (m) return { lo: Number(m[1]), hi: Number(m[2]) };
  throw new Error(`physiology: cannot read the band "${label}"`);
}

function bandsOf(table: string, column: string): Band[] {
  return libraryTable("physiology", table).map(row => ({ ...parseBand(String(row[column])), row }));
}

function bandAt(bands: Band[], v: number): Band {
  return bands.find(b => v >= b.lo && v < b.hi) ?? (v < bands[0]!.lo ? bands[0]! : bands[bands.length - 1]!);
}

interface WbgtClass { lo: number; loIncl: boolean; hi: number; hiIncl: boolean; ceilingC: number; unacclimatisedC: number; driftCPerHPerC: number; row: LibraryRow }

interface Tables {
  met: Map<string, number>;
  sleepDebt: Band[]; circadian: Band[]; core: Band[]; hydration: Band[]; wbgt: WbgtClass[];
  palMin: number; palMax: number;
  needH: number; splitQuality: number; fatigueResetH: number; restCoreC: number;
  heatGainDays: number; heatLossDays: number;
}

let tables: Tables | null = null;

function num(text: string, re: RegExp, what: string, group = 1): number {
  const m = re.exec(text);
  if (!m) throw new Error(`physiology: the library text for ${what} no longer reads ${re}`);
  return Number(m[group]);
}

function lib(): Tables {
  if (tables) return tables;
  const met = new Map(libraryTable("physiology", "met").map(r => [String(r.id), Number(r.MET)]));
  const recovery = new Map(libraryTable("physiology", "recovery").map(r => [String(r.id), String(r["Overnight rule"])]));
  const rec = (id: string) => recovery.get(`physiology.recovery.${id}`) ?? "";
  const sleepRule = rec("sleep-debt"), fatigueRule = rec("whole-body-fatigue-the-days-met-hours");
  const heat = libraryTable("physiology", "acclimatisation").find(r => r.id === "physiology.acclimatisation.heat-acclimatisation")!;
  const pals = libraryTable("physiology", "pal").map(r => Number(r.PAL));
  const hours = (s: string) => { const [h, m] = s.split(":").map(Number); return h! + m! / 60; };
  const circadian = libraryTable("physiology", "circadian").map(row => {
    const m = /^(\d\d:\d\d) to (\d\d:\d\d)$/.exec(String(row["Ship's time"]));
    if (!m) throw new Error(`physiology: cannot read the time band "${String(row["Ship's time"])}"`);
    return { lo: hours(m[1]!), hi: hours(m[2]!), row };
  });
  const wbgt = libraryTable("physiology", "wbgt_limits").map((row): WbgtClass => {
    const label = String(row["Work class (MET)"]);
    let lo = -Infinity, hi = Infinity, loIncl = false, hiIncl = false;
    let m = /\(under ([\d.]+)\)/.exec(label);
    if (m) hi = Number(m[1]);
    else if ((m = /\(over ([\d.]+)\)/.exec(label))) lo = Number(m[1]);
    else if ((m = /\(([\d.]+) to ([\d.]+)\)/.exec(label))) { lo = Number(m[1]); hi = Number(m[2]); loIncl = hiIncl = true; }
    else throw new Error(`physiology: cannot read the work class "${label}"`);
    return { lo, loIncl, hi, hiIncl, ceilingC: Number(row["WBGT ceiling, acclimatised (C)"]), unacclimatisedC: Number(row["Unacclimatised (C)"]),
      driftCPerHPerC: Number(row["Model: core drift above ceiling (C per hour per C over)"]), row };
  });
  tables = {
    met,
    sleepDebt: bandsOf("sleep_debt", "Cumulative debt (hours below 8 h)"),
    circadian, core: bandsOf("core_temp", "Core (C)"), hydration: bandsOf("hydration", "Deficit (% body mass)"), wbgt,
    palMin: Math.min(...pals), palMax: Math.max(...pals),
    needH: num(sleepRule, /debt \+= max\(0, ([\d.]+) - hours slept\)/, "the sleep need"),
    splitQuality: num(sleepRule, /counts ([\d.]+) of its hours/, "the split-sleep quality"),
    fatigueResetH: num(fatigueRule, /after ([\d.]+)\+ hours/, "the fatigue reset"),
    restCoreC: num(rec("core-temperature"), /returns to ([\d.]+) if sheltered/, "the resting core"),
    heatGainDays: num(String(heat["Time to gain"]), /([\d.]+) to ([\d.]+) days/, "the heat gain clock", 2),
    heatLossDays: num(String(heat["Time to lose"]), /about ([\d.]+) days/, "the heat loss clock"),
  };
  return tables;
}

/** MET of a library activity: a full id (`physiology.met.smithing`), its slug (`smithing`), or a number as given. */
export function metOf(activity: number | string): number {
  if (typeof activity === "number") return activity;
  const t = lib().met, v = t.get(activity) ?? t.get(`physiology.met.${activity}`);
  if (v === undefined) throw new Error(`physiology: no MET row ${activity}`);
  return v;
}

/** The work class (light, moderate, heavy) of a MET: its WBGT ceilings and core drift rate. */
export function wbgtClass(met: number) {
  const c = lib().wbgt.find(x => (met > x.lo || (x.loIncl && met === x.lo)) && (met < x.hi || (x.hiIncl && met === x.hi)));
  if (!c) throw new Error(`physiology: no work class for MET ${met}`);
  return c;
}

/** The WBGT ceiling for continuous work at this MET, between the unacclimatised (0) and acclimatised (1) columns. */
export function wbgtCeiling(met: number, acclimatisation: number): number {
  const c = wbgtClass(met);
  return c.unacclimatisedC + acclimatisation * (c.ceilingC - c.unacclimatisedC);
}

/** Sleep debt (hours below need) to the table row and its alertness multiplier. */
export function sleepDebtRow(debtH: number) { const b = bandAt(lib().sleepDebt, debtH); return { row: b.row, multiplier: Number(b.row["Alertness multiplier"]) }; }

/** Clock hour (0 to 24) to the circadian row and factor; a band such as 22:00 to 02:00 wraps midnight. */
export function circadianRow(hour: number) {
  const h = ((hour % 24) + 24) % 24;
  const b = lib().circadian.find(x => (x.lo <= x.hi ? h >= x.lo && h < x.hi : h >= x.lo || h < x.hi));
  if (!b) throw new Error(`physiology: no circadian band for ${h} h`);
  return { row: b.row, factor: Number(b.row.Factor) };
}

/** Core temperature to its state row; `workCapacity` is the row's "work capacity xN" (1 for normal, null where the text gives none). */
export function coreRow(coreC: number) {
  const row = bandAt(lib().core, coreC).row, effect = String(row["What the sim does"]);
  const m = /work capacity x([\d.]+)/.exec(effect);
  return { row, state: String(row.State), effect, workCapacity: m ? Number(m[1]) : effect === "none" ? 1 : null, sweatAtMax: effect.includes("sweat rate at max") };
}

/** Water deficit (% of body mass) to its row; `endurance` is the Endurance factor (the in-heat one when hot), null where the text gives none. */
export function hydrationRow(deficitPct: number, hot: boolean) {
  const row = bandAt(lib().hydration, deficitPct).row, effect = String(row["Effect in the model"]);
  const m = /Endurance(?: pool)? x([\d.]+)(?: \(x([\d.]+) in heat\))?/.exec(effect);
  const endurance = m ? Number(hot && m[2] ? m[2] : m[1]) : effect === "none" ? 1 : null;
  return { row, effect, endurance };
}

/**
 * The overnight tick for sleep and fatigue (recovery table): debt += max(0, need - slept) - max(0, slept - need), floored at 0;
 * fatigue resets after the table's hours, else carries (need - slept)/need of itself. `slept` is already quality-weighted.
 */
export function overnight(debtH: number, fatigueMetH: number, sleptH: number) {
  const { needH, fatigueResetH } = lib();
  return {
    debtH: Math.max(0, debtH + Math.max(0, needH - sleptH) - Math.max(0, sleptH - needH)),
    fatigueMetH: sleptH >= fatigueResetH ? 0 : fatigueMetH * (needH - sleptH) / needH,
  };
}

/** The recovery table's weight of a split (watch) night's hours. */
export function splitSleepQuality(): number { return lib().splitQuality; }

/** The PAL bands' lowest and highest value (FAO 2004 as the library has them). */
export function palRange() { return { min: lib().palMin, max: lib().palMax }; }

/** Resting rate of a body from its props, kcal/day, or null when height, age or sex is missing. */
export function bodyRmr(body: Component): number | null {
  const { height_cm: h, age_y: a, male } = body.props;
  if (h === undefined || a === undefined || male === undefined) return null;
  return restingMetabolicRate(body.mass, h, a, male === 1);
}

export interface ScheduleEntry {
  fromH: number; toH: number;          // clock hours; toH <= fromH wraps midnight
  activity: number | string;           // a MET or a library MET row (id or slug)
  sleepQuality?: number;               // present: asleep; hours count at this weight toward the night
}

export interface PhysiologyOptions {
  met?: number;                        // constant MET when there is no schedule (or no window matches)
  schedule?: ScheduleEntry[];          // first matching window wins
  every?: number;                      // run every N fast steps (default 10)
  clockH0?: number;                    // clock hour at world time 0 (default 0)
  dayStartH?: number;                  // the hour the day's books close (default 12: the nautical day)
}

/** Eat or drink in kind: food energy and water enter the body, traced. Water goes into the body's water content when it holds any. */
export function ingest(w: World, body: string, food: { kcal?: number; waterKg?: number }, process = "ingest") {
  const b = w.registry.component(body);
  if (food.kcal) {
    b.props.intake_kcal = (b.props.intake_kcal ?? 0) + food.kcal;
    w.trace.record({ t: w.t, process, quantity: "energy:chemical", from: "food", to: body, amount: food.kcal * KCAL_J });
  }
  if (food.waterKg) {
    b.props.waterDeficitKg = (b.props.waterDeficitKg ?? 0) - food.waterKg;
    b.props.waterDeficitPct = b.props.waterDeficitKg / b.mass * 100;
    if (b.contents.some(x => x.substance === "water")) w.registry.addContent(b, "water", "liquid", food.waterKg);
    w.trace.record({ t: w.t, process, quantity: "mass:water", from: "intake", to: body, amount: food.waterKg });
  }
}

/** Close the day: sleep and fatigue by the overnight table, the core back to rest if sheltered, acclimatisation, the day's PAL. */
function closeDay(b: Component, rmr: number | null) {
  const p = b.props, t = lib();
  const n = overnight(p.sleep_debt ?? 0, p.fatigue_met_hours ?? 0, p.slept_effective_h ?? 0);
  p.sleep_debt = n.debtH; p.fatigue_met_hours = n.fatigueMetH; p.slept_effective_h = 0;
  if ((p.sheltered ?? 1) === 1) p.core_c = t.restCoreC;
  const gain = p.heat_day === 1;
  p.acclimatisation = Math.min(1, Math.max(0, (p.acclimatisation ?? 1) + (gain ? 1 / t.heatGainDays : -1 / t.heatLossDays)));
  p.heat_day = 0;
  p.days_closed = (p.days_closed ?? 0) + 1;
  p.pal_last = rmr ? (p.day_expenditure_kcal ?? 0) / rmr : 0;
  p.day_expenditure_kcal = 0;
}

export function physiologyProcess(body: string, room: string, o: PhysiologyOptions = {}): Process {
  const clockH0 = o.clockH0 ?? 0, dayStartH = o.dayStartH ?? 12;
  const schedule = (o.schedule ?? []).map(e => ({ ...e, met: metOf(e.activity) }));
  const activityAt = (hour: number) => {
    for (const e of schedule) {
      const inside = e.fromH < e.toH ? hour >= e.fromH && hour < e.toH : hour >= e.fromH || hour < e.toH;
      if (inside) return { met: e.met, quality: e.sleepQuality ?? null };
    }
    if (o.met === undefined) throw new Error(`physiology: no activity at ${hour} h and no default MET`);
    return { met: o.met, quality: null };
  };
  return { name: "body", every: o.every ?? 10, step(w, dt) {
    const b = w.registry.component(body), r = w.registry.component(room), reg = w.registry, p = b.props, t = lib();
    const mass = b.mass, dtH = dt / 3600;
    const clock = clockH0 + w.t / 3600, hour = ((clock % 24) + 24) % 24;
    p.core_c ??= t.restCoreC;
    p.acclimatisation ??= 1;
    const rmr = bodyRmr(b);
    const dayIndex = Math.floor((clock - dayStartH) / 24);
    if (p.day_index === undefined) p.day_index = dayIndex;
    while (p.day_index < dayIndex) { closeDay(b, rmr); p.day_index++; }

    const act = activityAt(hour), met = act.met;
    // energy: the MET cost, corrected to this body's resting rate when it has one (PHYSIOLOGY.md section 4); heat is M - W
    const scale = rmr === null ? 1 : rmr * KCAL_J / 86400 / metabolicHeat(1, mass);
    const mWatt = metabolicHeat(met, mass) * scale;
    const workWatt = Math.min(p.work_w ?? 0, mWatt);
    const heatWatt = mWatt - workWatt;
    const spent = mWatt * dt;
    w.trace.record({ t: w.t, process: "body", quantity: "energy:chemical", from: body, to: "metabolism", amount: spent });
    addHeat(w, b, heatWatt * dt);
    w.trace.record({ t: w.t, process: "body", quantity: "energy", from: "metabolism", to: body, amount: heatWatt * dt });
    if (workWatt > 0) w.trace.record({ t: w.t, process: "body", quantity: "energy", from: "metabolism", to: "work", amount: workWatt * dt, note: "external work" });
    p.expenditure_kcal = (p.expenditure_kcal ?? 0) + spent / KCAL_J;
    p.day_expenditure_kcal = (p.day_expenditure_kcal ?? 0) + spent / KCAL_J;
    p.fatigue_met_hours = (p.fatigue_met_hours ?? 0) + met * dtH;
    if (act.quality !== null) p.slept_effective_h = (p.slept_effective_h ?? 0) + dtH * act.quality;

    // exchange with the air: h A dT, skin area 1.9 m2, h 10 in still air
    const q = heatFlow(p.h ?? 10, p.area_m2 ?? 1.9, b.temperatureC - r.temperatureC) * dt;
    addHeat(w, b, -q); addHeat(w, r, q);
    w.trace.record({ t: w.t, process: "body", quantity: "energy", from: body, to: room, amount: q });

    // heat stress: WBGT against the work class's ceiling, core drift above it (WBGT is the room's dry temperature unless it carries wbgt_c)
    const wbgt = r.props.wbgt_c ?? r.temperatureC;
    const ceiling = wbgtCeiling(met, p.acclimatisation);
    const over = Math.max(0, wbgt - ceiling);
    if (act.quality === null && wbgt > wbgtCeiling(met, 0)) p.heat_day = 1;
    p.core_c += over * wbgtClass(met).driftCPerHPerC * dtH;

    // sweat: PHYSIOLOGY.md section 4 (SWEAT), cooling by evaporation falling with humidity; the tissue sits above 37 C to sweat fully
    const hotCore = coreRow(p.core_c).sweatAtMax;
    let sweatLph = hotCore ? SWEAT.max
      : Math.min(SWEAT.max, Math.max(SWEAT.min, SWEAT.base + SWEAT.perMet * met + SWEAT.perOver * over)) * (b.temperatureC > SWEAT.coreGateC ? 1 : SWEAT.coolFactor);
    let sweatKg = sweatLph / 3600 * dt;
    const held = b.contents.find(x => x.substance === "water" && x.phase === "liquid");
    if (held && sweatKg > held.mass) { sweatKg = held.mass; sweatLph = sweatKg * 3600 / dt; }
    const evapJ = sweatKg * SWEAT_LATENT * Math.max(0, 1 - (r.props.rh ?? 0.6));
    addHeat(w, b, -evapJ);
    p.waterDeficitKg = (p.waterDeficitKg ?? 0) + sweatKg;
    p.sweat_kg = (p.sweat_kg ?? 0) + sweatKg;
    p.waterDeficitPct = p.waterDeficitKg / mass * 100;
    if (held) reg.addContent(b, "water", "liquid", -sweatKg);
    reg.addContent(r, "water", "gas", sweatKg);
    w.trace.record({ t: w.t, process: "body", quantity: "mass:water", from: body, to: room, amount: sweatKg, note: "sweat" });
    w.trace.record({ t: w.t, process: "body", quantity: "energy", from: body, to: "sweat-latent", amount: evapJ });

    // exposure
    accumulateExposure(b, r, dt);

    // outputs by library id
    const out = bodyOutputs(b), debt = sleepDebtRow(p.sleep_debt ?? 0), circ = circadianRow(hour), core = coreRow(p.core_c);
    const hyd = hydrationRow(p.waterDeficitPct, over > 0);
    p.intake_kcal ??= 0;
    out.met = met;
    out.rmr_kcal = rmr;
    out.energy_balance_kcal = p.intake_kcal - p.expenditure_kcal;
    out.energy_expenditure_kcal = p.expenditure_kcal;
    out.day_expenditure_kcal = p.day_expenditure_kcal;
    out.pal = rmr !== null && (p.days_closed ?? 0) > 0 ? p.pal_last : null;
    out.sleep_debt = p.sleep_debt ?? 0; out.sleep_debt_row = String(debt.row.id);
    out.circadian = circ.factor; out.circadian_row = String(circ.row.id);
    out.alertness = debt.multiplier * circ.factor;
    out.fatigue_met_hours = p.fatigue_met_hours;
    out.wbgt_c = wbgt; out.wbgt_ceiling_c = ceiling; out.wbgt_row = String(wbgtClass(met).row.id);
    out.acclimatisation = p.acclimatisation;
    out.core_c = p.core_c; out.core_state = core.state; out.core_row = String(core.row.id); out.work_capacity_heat = core.workCapacity;
    out.sweat_l_per_h = sweatLph;
    out.water_deficit_pct = p.waterDeficitPct; out.hydration_state = hyd.effect; out.hydration_row = String(hyd.row.id); out.endurance_hydration = hyd.endurance;
  } };
}
