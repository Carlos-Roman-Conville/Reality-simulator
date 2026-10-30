/** ECOLOGY.md from the library's `ecology` tables: the logistic stock model with its depletion rules (`depletion_rules`) and
 * the soil fertility index (`soil`). The host supplies every stock and field (r, K, q, demand are its own rows: the Caribbean
 * grounds stay in the game). Time is days. A stock's growth enters from `environment` and a catch leaves to `catch`, both
 * traced, and the step checks stock = before + growth - catch. Numbers the tables do not carry are in FLAGS.md.
 */
import { libraryRow } from "./library.ts";
import type { Trace } from "./trace.ts";

const DAY = 86400;
const YEAR = 365;

const depletion = (slug: string) => String(libraryRow("ecology", "depletion_rules", `ecology.depletion_rules.${slug}`)["Formula or statement"]);
const soilRow = (slug: string) => String(libraryRow("ecology", "soil", `ecology.soil.${slug}`).Formula);
/** The first capture group of a pattern in a table cell as a number; a row whose wording changed fails loudly. */
function figure(text: string, re: RegExp, what: string): number {
  const m = re.exec(text);
  if (!m) throw new Error(`ecology: cannot read ${what} from "${text}"`);
  return Number(m[1]);
}

// ---------------------------------------------------------------- stocks

export interface Stock {
  id: string;
  /** Biomass or head count, in the host's unit. */
  B: number;
  /** Carrying capacity, same unit. */
  K: number;
  /** Intrinsic growth rate per year. */
  r: number;
  /** Penned stock neither depletes by itself nor breeds (the turtle crawl row). */
  penned: boolean;
  /** Multiplier on r (nesting-beach take), until `rMultiplierUntilDay`. */
  rMultiplier: number;
  rMultiplierUntilDay: number | null;
  day: number;
}
export function createStock(id: string, B: number, K: number, r: number, o: { penned?: boolean } = {}): Stock {
  if (!(K > 0) || !(r >= 0) || !(B >= 0)) throw new Error("ecology: stock needs K > 0, r >= 0, B >= 0");
  return { id, B, K, r, penned: o.penned ?? false, rMultiplier: 1, rMultiplierUntilDay: null, day: 0 };
}

/** Maximum sustainable yield per year of the Schaefer model: r K / 4, at B = K / 2. */
export const msyPerYear = (s: Pick<Stock, "r" | "K">) => s.r * s.K / 4;

const effectiveR = (s: Stock) => s.rMultiplierUntilDay !== null && s.day >= s.rMultiplierUntilDay ? s.r : s.r * s.rMultiplier;

/** Fished out: B under this fraction of K (the row's 0.2). */
export const fishedOutFraction = () => figure(depletion("a-ground-is-fished-out"), /B under ([\d.]+) K/, "the fished-out fraction");
/** The catch multiplier on a fished-out ground (the row's x0.2). */
export const fishedOutCatchFactor = () => figure(depletion("a-ground-is-fished-out"), /catch x([\d.]+)/, "the fished-out catch factor");
export const isFishedOut = (s: Stock) => s.B < fishedOutFraction() * s.K;

/** Daily catch per fisher: q x effort x B / K, times the fished-out factor under 0.2 K. `q` is the host's (its Fishing skill). */
export function dailyCatch(s: Stock, q: number, effort: number): number {
  return q * effort * s.B / s.K * (isFishedOut(s) ? fishedOutCatchFactor() : 1);
}

export interface StockStep { growth: number; catch: number; unmet: number }

/** The overnight update B += r B (1 - B/K) / 365 - catch, one day. A catch beyond what stands is cut to B and the rest is
 * `unmet`; a penned stock does not grow. The transfers go to `trace` and the balance is checked. */
export function stepStock(s: Stock, catchAmount: number, trace?: Trace): StockStep {
  if (!(catchAmount >= 0)) throw new Error("ecology: catch must be >= 0");
  const growth = s.penned ? 0 : effectiveR(s) * s.B * (1 - s.B / s.K) / YEAR;
  const before = s.B;
  // Growth is added before the catch is taken, as in the row: B + growth - catch.
  const available = before + growth;
  const taken = Math.min(catchAmount, available);
  s.B = available - taken;
  s.day += 1;
  if (trace) {
    const t = s.day * DAY;
    if (growth > 0) trace.record({ t, process: "ecology.stock", quantity: `stock:${s.id}`, from: "environment", to: s.id, amount: growth });
    if (growth < 0) trace.record({ t, process: "ecology.stock", quantity: `stock:${s.id}`, from: s.id, to: "environment", amount: -growth });
    if (taken > 0) trace.record({ t, process: "ecology.stock", quantity: `stock:${s.id}`, from: s.id, to: "catch", amount: taken });
    trace.check(t, `stock:${s.id}`, before + growth - taken, s.B, 1e-9 * Math.max(1, s.K));
  }
  return { growth, catch: taken, unmet: catchAmount - taken };
}

/** Years for a logistic stock to go from fraction `from` of K to `to`: ln[(to/(1-to)) / (from/(1-from))] / r. */
export function logisticYears(r: number, from: number, to: number): number {
  if (!(r > 0) || !(from > 0 && from < 1) || !(to > 0 && to < 1)) throw new Error("ecology: logisticYears needs r > 0 and fractions in (0, 1)");
  return Math.log((to / (1 - to)) / (from / (1 - from))) / r;
}
/** The recovery row: years from 0.2 K back to 0.8 K ("about 2.8/r"; the logistic gives ln 16 / r = 2.77/r). */
export const recoveryYears = (r: number) => logisticYears(r, 0.2, 0.8);

/** Years a stock fished at a constant `catchPerYear` takes to reach zero from B0, by the logistic curve. Only a catch above MSY
 * collapses; at exactly MSY the stock holds, below it settles. Returns null when the stock does not collapse. */
export function collapseYears(s: Pick<Stock, "r" | "K">, B0: number, catchPerYear: number): number | null {
  const { r, K } = s;
  const h = catchPerYear;
  const msy = msyPerYear(s);
  if (h <= msy) return null;
  // dB/dt = -(r/K)(u^2 + c^2), u = B - K/2, c^2 = K h / r - K^2 / 4: u = -c tan(atan(-u0/c)... ) solved for u = -K/2.
  const c = Math.sqrt(K * h / r - K * K / 4);
  const u0 = B0 - K / 2;
  return (Math.atan(u0 / c) - Math.atan(-K / 2 / c)) * K / (r * c);
}

/** Taking breeding females on the beach in the nesting season: r x0.5 for a decade (3,650 days). */
export function takeNestingFemales(s: Stock): void {
  const text = depletion("nesting-beaches");
  if (!/for a decade/.test(text)) throw new Error(`ecology: cannot read the nesting duration from "${text}"`);
  s.rMultiplier = figure(text, /r x([\d.]+)/, "the nesting r multiplier");
  s.rMultiplierUntilDay = s.day + 10 * YEAR;
}

/** Food a crawl of N pens gives: N x the row's kg per turtle. */
export const crawlFoodKg = (n: number) => n * figure(depletion("turtle-crawls-goods-md-row-60"), /N x (\d+) kg/, "kg per turtle");

export function stockOutputs(s: Stock) {
  return {
    "ecology.depletion_rules.overnight-stock-update": s.B,
    "ecology.depletion_rules.a-ground-is-fished-out": isFishedOut(s),
    "ecology.depletion_rules.daily-catch-per-fisher.fill": s.B / s.K,
  };
}

// ---------------------------------------------------------------- soil

export interface Field { id: string; f: number }
/** Fertility is an index of 0 to 1 (the soil table's own range). */
const clamp01 = (x: number) => Math.min(1, Math.max(0, x));

/** The drain per harvest of each crop, read from the row ("cane 0.06, ... pease -0.02 i.e. restores"). */
export function cropDemand(): Record<string, number> {
  const text = soilRow("fertility-drain-per-harvest");
  const out: Record<string, number> = {};
  for (const m of text.matchAll(/([a-z]+) (-?\d*\.\d+)/g)) out[m[1]] = Number(m[2]);
  if (!Object.keys(out).length) throw new Error(`ecology: cannot read crop demands from "${text}"`);
  return out;
}

function move(trace: Trace | undefined, field: Field, process: string, delta: number, day: number) {
  if (!trace || delta === 0) return;
  trace.record({ t: day * DAY, process, quantity: `fertility:${field.id}`, from: delta < 0 ? field.id : "soil-inputs", to: delta < 0 ? "crop" : field.id, amount: Math.abs(delta) });
}
/** Applies a change to f, clamped to [0, 1]; returns the change that landed. Traced, balance checked. */
function applyFertility(field: Field, delta: number, process: string, trace?: Trace, day = 0): number {
  const before = field.f;
  field.f = clamp01(before + delta);
  const landed = field.f - before;
  move(trace, field, process, landed, day);
  trace?.check(day * DAY, `fertility:${field.id}`, before + landed, field.f, 1e-12);
  return landed;
}

export const createField = (id: string, f: number): Field => {
  if (!(f >= 0 && f <= 1)) throw new Error("ecology: fertility must be in [0, 1]");
  return { id, f };
};

/** Clearing forest gives a new field f = 0.9 (the row). */
export const clearForest = (id: string): Field => createField(id, figure(soilRow("deforestation"), /f = ([\d.]+)/, "the new-field fertility"));

export interface Harvest { yield: number; drain: number }
/** A harvest: yield = maxYield x (0.3 + 0.7 f) x rain x labour (read before the drain), then f -= demand of the crop.
 * The rain and labour factors are the host's; `dryYearFactor` gives the soil row's one rain figure. */
export function harvest(field: Field, crop: string, maxYield: number, rainFactor: number, labourFactor: number, trace?: Trace, day = 0): Harvest {
  const demand = cropDemand()[crop];
  if (demand === undefined) throw new Error(`ecology: no demand row for crop ${crop}`);
  const y = maxYield * (0.3 + 0.7 * field.f) * rainFactor * labourFactor;
  const landed = applyFertility(field, -demand, "ecology.soil.harvest", trace, day);
  return { yield: y, drain: -landed };
}

/** A dry year (rain under 60% of normal) halves yields; otherwise the table has no rain factor: null, the host's. */
export function dryYearFactor(rainFraction: number): number | null {
  const text = soilRow("rain");
  const limit = figure(text, /under (\d+)% of normal/, "the dry-year limit") / 100;
  return rainFraction < limit ? 0.5 : null;
}

/** Manure: f += 0.03 per 10 t/ha of dung. */
export function manure(field: Field, tonnesPerHa: number, trace?: Trace, day = 0): number {
  const text = soilRow("manure");
  const per = figure(text, /f \+= ([\d.]+) per/, "the manure gain");
  const unit = figure(text, /per (\d+) t\/ha/, "the manure unit");
  return applyFertility(field, per * tonnesPerHa / unit, "ecology.soil.manure", trace, day);
}

/** Fallow: f += 0.02 a year idle, +0.04 under bush, for `days`. */
export function fallow(field: Field, days: number, underBush = false, trace?: Trace, day = 0): number {
  const text = soilRow("fallow");
  const idle = figure(text, /f \+= ([\d.]+) a year idle/, "the idle fallow gain");
  const bush = figure(text, /\+([\d.]+) under bush/, "the bush fallow gain");
  return applyFertility(field, (underBush ? bush : idle) * days / YEAR, "ecology.soil.fallow", trace, day);
}

/** Erosion on a cleared slope: f -= 0.02 a year extra, for `days`. */
export function erode(field: Field, days: number, trace?: Trace, day = 0): number {
  const per = figure(soilRow("deforestation"), /f -= ([\d.]+) a year extra/, "the slope erosion");
  return applyFertility(field, -per * days / YEAR, "ecology.soil.deforestation", trace, day);
}

export const soilOutputs = (field: Field) => ({ "ecology.soil.yield": 0.3 + 0.7 * field.f, "ecology.soil.fertility": field.f });
