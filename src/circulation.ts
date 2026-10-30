/** CIRCULATION.md CIR-DO2 and the circulation library. Volumes are mL, Hb is g/dL,
 * flow L/min, pressure mmHg, time seconds. Missing kinetic parameters stay null.
 * Run after breathingProcess; the host owns wounds, treatment supplies and crises.
 */
import { libraryMeta, libraryRow, libraryTable, type LibraryRow } from "./library.ts";
import { bodyOutputs } from "./physiology.ts";
import { saturation } from "./atmosphere.ts";
import type { World } from "./world.ts";
import type { Process } from "./scheduler.ts";

const row = (table: string, id: string) => libraryRow("circulation", table, `circulation.${table}.${id}`);
function numberIn(text: unknown, pattern: RegExp = /([\d.]+)/, group = 1): number {
  const match = pattern.exec(String(text).replace(/(?<=\d),(?=\d)/g, ""));
  if (!match) throw new Error(`circulation: cannot read ${text}`);
  return Number(match[group]);
}
const normal = (id: string) => numberIn(row("quantities", id)["Normal (70 kg man)"]);

/** All source rules and normals, including qualitative values, keyed by stable id. */
export function circulationRules(table: "quantities" | "bleeding" | "delivery_failures" | "homeostasis" | "blood_gas" | "events") {
  return Object.fromEntries(libraryTable("circulation", table).map(r => [String(r.id), r]));
}

export function normalBloodVolume(massKg: number, male: boolean): number {
  finite(massKg, "mass");
  const source = libraryMeta("circulation", "quantities").source;
  return massKg * numberIn(source, male ? /about ([\d.]+) mL\/kg/ : /men\) ([\d.]+) \(women/);
}
function finite(value: number, name: string) {
  if (!Number.isFinite(value) || value < 0) throw new Error(`circulation: invalid ${name}`);
}
function fraction(value: number, name: string) { finite(value, name); if (value > 1) throw new Error(`circulation: invalid ${name}`); }

/** Bound oxygen only, per CIR-DO2. No duplicate saturation or CO kinetics. */
export function oxygenDelivery(coLMin: number, hbGDL: number, sao2: number, cohb = 0): number {
  finite(coLMin, "cardiac output"); finite(hbGDL, "haemoglobin"); fraction(sao2, "saturation"); fraction(cohb, "COHb");
  const binding = numberIn(row("blood_gas", "oxygen-content-with-co")["Formula or rule"], /CaO2 = ([\d.]+)/);
  return coLMin * binding * hbGDL * sao2 * (1 - cohb) * 10; // dL/L
}

/** Fractional classes take precedence over the rounded 70 kg illustrative mL column.
 * Adjacent boundaries enter the higher class; IV is strictly over 40% as written. */
export function bleedingClass(lossMl: number, baselineMl: number): LibraryRow {
  finite(lossMl, "loss"); finite(baselineMl, "baseline");
  if (!baselineMl) throw new Error("circulation: zero baseline");
  const rows = libraryTable("circulation", "bleeding"), pct = lossMl / baselineMl * 100;
  if (pct > numberIn(rows[3]["Loss (% of blood volume)"])) return rows[3];
  if (pct >= numberIn(rows[2]["Loss (% of blood volume)"])) return rows[2];
  return pct >= numberIn(rows[1]["Loss (% of blood volume)"]) ? rows[1] : rows[0];
}

/** The table specifies whole-body perfusion only in class I; unspecified organs stay null. */
export function bleedingEffects(lossMl: number, baselineMl: number) {
  const r = bleedingClass(lossMl, baselineMl), text = String(r["Pressure and perfusion (model)"]), consequences = String(r["Organ consequences (ANATOMY)"]);
  const value = (pattern: RegExp) => pattern.test(text) ? numberIn(text, pattern) : null;
  const pressure = text.includes("pressure held") ? normal("mean-arterial-pressure") : value(/MAP ([\d.]+)/);
  const all = value(/perfusion ([\d.]+)/);
  return { row: r, pressure, pressureUpperBound: value(/MAP under ([\d.]+)/),
    perfusion: { brain: value(/brain ([\d.]+)/) ?? (r.Class === "I" ? all : null),
      kidneys: value(/kidneys ([\d.]+)/) ?? (/kidneys ([\d.]+)/.test(consequences) ? numberIn(consequences, /kidneys ([\d.]+)/) : r.Class === "I" ? all : null),
      gut: value(/gut(?: perfusion)? ([\d.]+)/) ?? (r.Class === "I" ? all : null),
      skin: value(/skin and gut perfusion ([\d.]+)/) ?? (r.Class === "I" ? all : null) },
    deathRatePerHour: numberIn(r["Death risk per hour at this loss, untreated (placeholder)"]) / 100,
    unmeasured: true as const };
}

export interface CirculationOptions {
  every?: number;
  /** Actual host flow/resistance, never inferred from volume by an invented curve. */
  resistance?: number;
  cardiacOutputLMin?: number;
  maximalCardiacOutputLMin?: number;
  /** Explicit experimental time constant; no numeric one exists in the library. */
  volumeTauSeconds?: number;
  kidneyWorking?: boolean;
}

/** Initial blood is a volume ledger, not fictitious kg or an added body mass. */
export function initialiseCirculation(w: World, body: string) {
  const b = w.registry.component(body), p = b.props;
  if (p.circulation_initial_ml !== undefined) return;
  if (p.male !== 0 && p.male !== 1) throw new Error("circulation: supply male=0 or 1 for normal volume");
  const volume = normalBloodVolume(b.mass, p.male === 1);
  const hb = p.male === 1 ? normal("haemoglobin") : numberIn(row("quantities", "haemoglobin")["Normal (70 kg man)"], /men\) ([\d.]+)/);
  p.circulation_initial_ml = p.blood_volume_ml = volume;
  p.circulation_initial_hb_g = p.blood_hb_g = hb * volume / 100;
  p.blood_lost_ml = p.blood_received_ml = p.blood_hb_lost_g = 0;
}

function check(w: World, body: string) {
  const p = w.registry.component(body).props;
  w.trace.check(w.t, `volume:blood:${body}`, p.circulation_initial_ml + w.trace.into(body, "volume:blood") - w.trace.outOf(body, "volume:blood"), p.blood_volume_ml, 1e-6);
  w.trace.check(w.t, `mass:haemoglobin:${body}`, p.circulation_initial_hb_g / 1000 - w.trace.outOf(body, "mass:haemoglobin"), p.blood_hb_g / 1000, 1e-9);
}

/** Whole blood leaves with its current Hb concentration. Requested loss caps at available blood. */
export function loseBlood(w: World, body: string, ml: number): number {
  finite(ml, "blood loss"); initialiseCirculation(w, body);
  const p = w.registry.component(body).props, actual = Math.min(ml, p.blood_volume_ml);
  const hb = p.blood_volume_ml ? p.blood_hb_g * actual / p.blood_volume_ml : 0;
  p.blood_volume_ml -= actual; p.blood_lost_ml += actual;
  p.blood_hb_g -= hb; p.blood_hb_lost_g += hb;
  w.trace.record({ t: w.t, process: "circulation", quantity: "volume:blood", from: body, to: "shed-blood", amount: actual });
  w.trace.record({ t: w.t, process: "circulation", quantity: "mass:haemoglobin", from: body, to: "shed-blood", amount: hb / 1000 });
  check(w, body); return actual;
}

/** Wound rate is a host input, not a class death chance. Binding/ligation stops it. */
export function bleed(w: World, body: string, rateMlMin: number, seconds: number, clotting: number, bound = false) {
  finite(rateMlMin, "wound rate"); finite(seconds, "time"); fraction(clotting, "clotting");
  const factor = numberIn(libraryMeta("circulation", "bleeding").source, /\(([\d.]+) - clotting\)/);
  return loseBlood(w, body, bound ? 0 : rateMlMin * seconds / 60 * (factor - clotting));
}

/** Loop metadata preserves qualitative time constants; no conversion of 'days' to a guessed number. */
export function regulationLoops() {
  return Object.fromEntries(libraryTable("circulation", "homeostasis").map(r => [String(r.id), {
    target: r.Target, correction: r["Corrects by"], timeConstant: r["Time constant"], tauSeconds: null, failsWhen: r["Fails when"],
  }]));
}

/** First-order volume recovery only with a host tau and an explicit finite supply of
 * already available intravascular replacement fluid (props.circulation_fluid_ml).
 * This does not model oral absorption or manufacture red cells. */
export function circulationProcess(body: string, options: CirculationOptions = {}): Process {
  for (const key of ["resistance", "cardiacOutputLMin", "maximalCardiacOutputLMin", "volumeTauSeconds"] as const) {
    const v = options[key]; if (v !== undefined) { finite(v, key); if ((key === "resistance" || key === "volumeTauSeconds") && v === 0) throw new Error(`circulation: zero ${key}`); }
  }
  return { name: "circulation", every: options.every ?? 1, step(w, dt) {
    finite(dt, "time"); initialiseCirculation(w, body);
    const b = w.registry.component(body), p = b.props, out = bodyOutputs(b);
    if (options.volumeTauSeconds !== undefined && options.kidneyWorking === true) {
      const supply = p.circulation_fluid_ml ?? 0; finite(supply, "replacement fluid");
      const ml = Math.min(supply, Math.max(0, p.circulation_initial_ml - p.blood_volume_ml) * -Math.expm1(-dt / options.volumeTauSeconds));
      p.circulation_fluid_ml = supply - ml; p.blood_volume_ml += ml; p.blood_received_ml += ml;
      w.trace.record({ t: w.t, process: "circulation", quantity: "volume:blood", from: `${body}:replacement-fluid`, to: body, amount: ml });
      w.trace.check(w.t, `volume:replacement-fluid:${body}`, supply, p.circulation_fluid_ml + ml, 1e-6);
    }
    const effects = bleedingEffects(p.blood_lost_ml, p.circulation_initial_ml);
    if (p.blood_received_ml > 0) {
      effects.pressure = null;
      for (const organ of ["brain", "kidneys", "gut", "skin"] as const) effects.perfusion[organ] = null;
    }
    const hb = p.blood_volume_ml > 0 ? p.blood_hb_g * 100 / p.blood_volume_ml : 0;
    const sat = typeof out.sao2 === "number" ? out.sao2 : typeof p.arterial_po2_mmhg === "number" ? saturation(p.arterial_po2_mmhg) : null;
    const cohb = typeof out.cohb === "number" ? out.cohb : null;
    const co = options.cardiacOutputLMin ?? (options.resistance !== undefined && effects.pressure !== null ? effects.pressure / options.resistance : null);
    const delivery = (flow: number | undefined | null) => flow == null || sat === null || cohb === null ? null : oxygenDelivery(flow, hb, sat, cohb);
    for (const r of libraryTable("circulation", "quantities")) out[String(r.id)] ??= null;
    out["circulation.quantities.blood-volume"] = p.blood_volume_ml;
    out["circulation.quantities.haemoglobin"] = hb;
    out["circulation.quantities.arterial-oxygen-saturation"] = sat;
    out["circulation.quantities.cardiac-output"] = co;
    out["circulation.quantities.oxygen-delivery-do2"] = delivery(co);
    out["circulation.quantities.mean-arterial-pressure"] = effects.pressure;
    out.aerobic_today = delivery(options.maximalCardiacOutputLMin);
    for (const r of libraryTable("circulation", "bleeding")) out[String(r.id)] = r.id === effects.row.id ? 1 : 0;
    for (const [organ, value] of Object.entries(effects.perfusion)) out[`circulation.quantities.perfusion-per-organ.${organ}`] = value;
    out["circulation.blood_gas.saturation-sao2"] = sat;
    out["circulation.blood_gas.carboxyhaemoglobin-cohb"] = cohb;
    out["circulation.blood_gas.oxygen-content-with-co"] = sat === null || cohb === null ? null : oxygenDelivery(1, hb, sat, cohb) / 10;
    out["circulation.blood_gas.arterial-pco2"] = out.paco2_mmhg ?? null;
    out["circulation.blood_gas.arterial-po2"] = p.arterial_po2_mmhg ?? null;
    out["circulation.blood_gas.acid-base"] = null;
    out["circulation.blood_gas.hydrogen-sulphide"] = null;
    check(w, body);
  } };
}

export interface CardiovascularState {
  index?: number; demandExceedsSupply?: boolean; triggerDay?: boolean;
  potassium?: number; magnesiumLow?: boolean; sao2?: number; drugs?: boolean;
  heartDamage?: number; feverC?: number; sustainedLowHeartFunction?: boolean;
  embolicClot?: boolean; pressureVeryHigh?: boolean; immobile?: boolean;
  dehydrated?: boolean; injury?: boolean; sepsis?: boolean; latePox?: boolean;
  classIIIPlus?: boolean; acuteHeartFailure?: boolean; badBurn?: boolean; anaphylaxis?: boolean;
}

/** Placeholder intensity in the table's native unit, NOT a measured hazard or a roll.
 * Competing/unsized causes return null instead of inventing an aggregation rule. */
export function hazard(event: string, state: CardiovascularState = {}) {
  const id = event.replace(/^circulation\.events\./, ""), r = row("events", id);
  const pre = String(r["Precondition (the state it needs)"]), chance = String(r["Daily or per-event chance (placeholder)"]);
  const index = state.index ?? 0, damage = state.heartDamage ?? 0;
  finite(index, "atherosclerosis index"); finite(damage, "heart damage");
  let eligible = false, rate: number | null = null, unit: "day" | "hour" | "event" | "state" | "index/day" = "day";
  switch (id) {
    case "atherosclerosis-the-index": eligible = true; unit = "index/day"; break;
    case "angina": eligible = index > numberIn(pre, /over ([\d.]+)/) && state.demandExceedsSupply === true;
      rate = index * numberIn(chance, /index x ([\d.]+)/); unit = "event"; break;
    case "myocardial-infarction": eligible = index > numberIn(pre, /over ([\d.]+)/);
      rate = index ** 2 * numberIn(chance, /index\^2 x ([\d.]+)/) * (state.triggerDay ? numberIn(chance, /, x([\d.]+)/) : 1); break;
    case "arrhythmia": {
      const k = state.potassium, electrolytes = (k !== undefined && (k < numberIn(pre, /under ([\d.]+)/) || k > numberIn(pre, /or over ([\d.]+)/))) || state.magnesiumLow === true;
      const hypoxia = state.sao2 !== undefined && state.sao2 < numberIn(pre, /saturation under ([\d.]+)/);
      const scar = damage > numberIn(pre, /damage over ([\d.]+)/), fever = state.feverC !== undefined && state.feverC > numberIn(pre, /fever over ([\d.]+)/);
      eligible = electrolytes || hypoxia || scar || fever || state.drugs === true; unit = "hour";
      const rates: number[] = [];
      if (electrolytes) rates.push(numberIn(chance, k !== undefined && k > numberIn(chance, /potassium over ([\d.]+)/) ? /([\d.]+)% \(potassium/ : /([\d.]+)% \(electrolytes/) / 100);
      if (scar) rates.push(numberIn(chance, /([\d.]+)% \(damage/) / 100);
      if (state.drugs) rates.push(numberIn(chance, /([\d.]+)% \(drugs/) / 100);
      rate = rates.length === 1 && !hypoxia && !fever ? rates[0] : null; break;
    }
    case "heart-failure": eligible = damage > numberIn(pre, /damage over ([\d.]+)/) || state.sustainedLowHeartFunction === true; unit = "state"; break;
    case "stroke": eligible = index > numberIn(pre, /index over ([\d.]+)/) || state.embolicClot === true || state.pressureVeryHigh === true;
      rate = index > 0 ? index ** 2 * numberIn(chance, /index\^2 x ([\d.]+)/) : null; break;
    case "thrombosis-and-embolism": eligible = !!(state.immobile || state.dehydrated || state.injury || state.sepsis || state.latePox);
      rate = state.immobile ? numberIn(chance, /([\d.]+)%/) / 100 : null; break;
    case "shock-circulatory": eligible = !!(state.classIIIPlus || state.sepsis || state.acuteHeartFailure || state.badBurn || state.anaphylaxis); unit = "state"; break;
  }
  return { id: String(r.id), eligible, rate: eligible ? rate : 0, unit, unmeasured: true as const, precondition: pre, rule: chance };
}
