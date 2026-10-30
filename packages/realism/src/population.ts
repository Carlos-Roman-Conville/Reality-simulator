/** POPULATION.md from the library's `population` tables: the cohort record (`cohorts`) and its daily update (`tick`): births,
 * background deaths, an epidemic run through `medicine.ts`'s disease courses, ageing between cohorts, famine, migration.
 * The host supplies the rates (Port Royal's stay in the game). Counts are real numbers: the aggregate model keeps expected
 * people. Every person who enters is a birth or an arrival, every one who leaves is a death (by cause) or a departure, ageing
 * only moves people between cohorts; each tick checks the total against those flows. Numbers the tables do not carry are in
 * FLAGS.md.
 */
import { libraryRow } from "./library.ts";
import { diseaseCourse, immunityRule } from "./medicine.ts";
import type { Trace } from "./trace.ts";

const DAY = 86400;
const YEAR = 365;

const tickRule = (slug: string) => String(libraryRow("population", "tick", `population.tick.${slug}`).Rule);
function figure(text: string, re: RegExp, what: string): number {
  const m = re.exec(text);
  if (!m) throw new Error(`population: cannot read ${what} from "${text}"`);
  return Number(m[1]);
}

export const COHORTS = ["children", "adultsM", "adultsF", "elders"] as const;
export type CohortName = typeof COHORTS[number];

/** Rates the host supplies, per year (the `rates table` the tick rows read). */
export interface Rates {
  /** Births per adult woman per year. */
  birthRate: number;
  /** Background deaths per person per year; the elders' rate is the row's multiple of it. */
  deathRate: number;
  /** Share of children who become men on reaching 15 (the table gives the move, not the sex split). */
  childMaleShare: number;
}

export interface Epidemic {
  disease: string;
  startDay: number;
  /** Share of the susceptible pool newly sick per day (the disease's catch rate: the host's). */
  catchRate: number;
  /** People who fell ill by cohort, in the order of COHORTS, one entry per day of the outbreak that is still running. */
  batches: { day: number; n: Record<CohortName, number> }[];
  /** Share of the pool who have fallen ill so far (cases / pool at the time, summed). */
  caught: number;
}

export interface Population {
  day: number;
  children: number; adultsM: number; adultsF: number; elders: number;
  /** Fraction of adults immune to the local fevers. */
  seasonedShare: number;
  transient: number;
  /** Mean body condition, 0 to 1. */
  health: number;
  /** Stores against need; the tick takes one a day and the host adds. */
  foodDays: number;
  epidemic: Epidemic | null;
  /** Total of people ever entering and leaving, by cause. */
  ledger: { births: number; arrivals: number; deaths: Record<string, number>; departures: number };
}

export function createPopulation(c: Partial<Pick<Population, CohortName | "seasonedShare" | "transient" | "health" | "foodDays">>): Population {
  const p: Population = { day: 0, children: 0, adultsM: 0, adultsF: 0, elders: 0, seasonedShare: 0, transient: 0, health: 1, foodDays: 0,
    epidemic: null, ledger: { births: 0, arrivals: 0, deaths: {}, departures: 0 }, ...c };
  for (const n of COHORTS) if (!(p[n] >= 0)) throw new Error(`population: ${n} must be >= 0`);
  if (!(p.health >= 0 && p.health <= 1) || !(p.seasonedShare >= 0 && p.seasonedShare <= 1)) throw new Error("population: health and seasonedShare are in [0, 1]");
  return p;
}
export const total = (p: Population) => p.children + p.adultsM + p.adultsF + p.elders + p.transient;
export const adults = (p: Population) => p.adultsM + p.adultsF;

/** Starts an outbreak. The disease needs a numeric course (the row's days); the host gives the catch rate. */
export function startEpidemic(p: Population, disease: string, catchRate: number): Epidemic {
  const d = diseaseCourse(disease);
  if (!d.course) throw new Error(`population: ${disease} has no course in days; an epidemic of it is unsupported`);
  if (!(catchRate >= 0)) throw new Error("population: catchRate must be >= 0");
  p.epidemic = { disease, startDay: p.day, catchRate, batches: [], caught: 0 };
  return p.epidemic;
}

export interface TickOptions {
  /** New transient people this day (ships in port x crew share ashore), and those who sail. */
  arrivals?: number;
  transientLeaving?: number;
  /** Settlers: prosperity x reputation x the row's 0.001 a day join the adults; `settlerMaleShare` splits them. */
  prosperity?: number;
  reputation?: number;
  settlerMaleShare?: number;
  /** Adults leaving this day, by sex (fear of fever, the dying port). */
  leaversM?: number;
  leaversF?: number;
  /** Where in the disease row's course and risk range this outbreak falls (0 low .. 1 high). Default the middle. */
  riskAt?: number;
  trace?: Trace;
}

export interface TickResult {
  births: number;
  backgroundDeaths: Record<CohortName, number>;
  epidemicDeaths: Record<CohortName, number>;
  newCases: number;
  aged: { toAdults: number; toElders: number };
  arrivals: number;
  departures: number;
  famine: boolean;
}

const zero = (): Record<CohortName, number> => ({ children: 0, adultsM: 0, adultsF: 0, elders: 0 });
const clamp01 = (x: number) => Math.min(1, Math.max(0, x));
const point = (r: { lo: number; hi: number }, p: number) => r.lo + p * (r.hi - r.lo);

/** The row's famine terms: health -0.02 a day, births x0.5, deaths x1.5. */
export function famineRule() {
  const text = tickRule("food");
  return { healthLoss: figure(text, /health -= ([\d.]+) a day/, "the famine health loss"), birthsFactor: figure(text, /births x([\d.]+)/, "the famine birth factor"),
    deathsFactor: figure(text, /deaths x([\d.]+)/, "the famine death factor") };
}
/** Daily moves between cohorts: 1/5475 of children (15 years) and 1/12,775 of adults (the 35 years from 15 to 50). */
export function ageingRates() {
  const days = figure(tickRule("ageing"), /1\/(\d+) a day/, "the children ageing rate");
  return { toAdults: 1 / days, toElders: 1 / (days / 15 * 35) };
}
export const elderDeathFactor = () => figure(tickRule("deaths-background"), /elders x(\d+)/, "the elder death factor");
export const settlersPerDay = (prosperity: number, reputation: number) =>
  prosperity * reputation * figure(tickRule("migration-in"), /reputation x ([\d.]+) a day/, "the settler rate");

/** One day, in the order of the tick table: births, background deaths, epidemic, ageing, food, migration. Rates act on the
 * counts at the start of the day. */
export function tick(p: Population, rates: Rates, o: TickOptions = {}): TickResult {
  const trace = o.trace;
  const t = (p.day + 1) * DAY;
  const start = total(p);
  const rec = (from: string, to: string, amount: number, note?: string) => {
    if (trace && amount !== 0) trace.record({ t, process: "population.tick", quantity: "people", from, to, amount, note });
  };
  const famineRow = famineRule();
  const startCounts = { children: p.children, adultsM: p.adultsM, adultsF: p.adultsF, elders: p.elders };
  // Food: one day of stores gone; under zero is famine for today's rates.
  p.foodDays -= 1;
  const famine = p.foodDays < 0;

  // Births: children += adults_f x birth_rate / 365 x health.
  const births = startCounts.adultsF * rates.birthRate / YEAR * p.health * (famine ? famineRow.birthsFactor : 1);
  // Background deaths: n x death_rate / 365 x (2 - health), elders x2.
  const deathFactor = (2 - p.health) * (famine ? famineRow.deathsFactor : 1);
  const background = zero();
  for (const c of COHORTS) background[c] = startCounts[c] * rates.deathRate / YEAR * deathFactor * (c === "elders" ? elderDeathFactor() : 1);

  // Epidemic: new cases from the susceptible pool, deaths from the disease's risk spread over its course days.
  const epidemicDeaths = zero();
  let newCases = 0;
  const ep = p.epidemic;
  if (ep) {
    const d = diseaseCourse(ep.disease);
    const at = o.riskAt ?? 0.5;
    const courseDays = Math.max(1, Math.round(point(d.course!, at)));
    const seasoned = immunityRule(ep.disease).level === "lifelong";
    const pool = startCounts.children + startCounts.adultsM + startCounts.adultsF + startCounts.elders;
    const day = p.day - ep.startDay;
    if (day < courseDays && pool > 0) {
      // The sick share rises by catch rate x (1 - seasoned share), never beyond those not yet caught or immune.
      const share = Math.min(ep.catchRate * (1 - p.seasonedShare), Math.max(0, 1 - p.seasonedShare - ep.caught));
      const n = zero();
      for (const c of COHORTS) n[c] = startCounts[c] * share;
      ep.batches.push({ day: p.day, n });
      ep.caught += share;
      newCases = pool * share;
    }
    const risk = d.risk ? point(d.risk, at) : 0;
    const survivorsAdults = { v: 0 };
    ep.batches = ep.batches.filter(b => {
      const age = p.day - b.day;
      for (const c of COHORTS) epidemicDeaths[c] += Math.min(b.n[c] * risk / courseDays, startCounts[c] - background[c]);
      if (age + 1 >= courseDays) { survivorsAdults.v += (b.n.adultsM + b.n.adultsF) * (1 - risk); return false; }
      return true;
    });
    // Survivors of a lifelong-immunity disease join the seasoned share of the adults.
    const adultsNow = startCounts.adultsM + startCounts.adultsF;
    if (seasoned && adultsNow > 0) p.seasonedShare = clamp01((p.seasonedShare * adultsNow + survivorsAdults.v) / adultsNow);
    if (!ep.batches.length && day + 1 >= courseDays) p.epidemic = null;
  }

  // Ageing between cohorts.
  const rate = ageingRates();
  const toAdults = startCounts.children * rate.toAdults;
  const toElders = (startCounts.adultsM + startCounts.adultsF) * rate.toElders;
  const toM = toAdults * rates.childMaleShare, toF = toAdults - toM;
  const eldersFromM = startCounts.adultsM * rate.toElders, eldersFromF = startCounts.adultsF * rate.toElders;

  // Migration.
  const settlers = o.prosperity !== undefined && o.reputation !== undefined ? settlersPerDay(o.prosperity, o.reputation) : 0;
  const settlerM = settlers * (o.settlerMaleShare ?? 0.5), settlerF = settlers - settlerM;
  const leaveM = Math.min(o.leaversM ?? 0, startCounts.adultsM), leaveF = Math.min(o.leaversF ?? 0, startCounts.adultsF);
  const transientLeaving = Math.min(o.transientLeaving ?? 0, p.transient);
  const arrivals = (o.arrivals ?? 0) + settlers;
  const departures = leaveM + leaveF + transientLeaving;

  const dead = (c: CohortName) => background[c] + epidemicDeaths[c];
  p.children = startCounts.children + births - dead("children") - toAdults;
  p.adultsM = startCounts.adultsM + toM - eldersFromM - dead("adultsM") + settlerM - leaveM;
  p.adultsF = startCounts.adultsF + toF - eldersFromF - dead("adultsF") + settlerF - leaveF;
  p.elders = startCounts.elders + toElders - dead("elders");
  p.transient += (o.arrivals ?? 0) - transientLeaving;
  if (famine) p.health = clamp01(p.health - famineRow.healthLoss);
  p.day += 1;

  // Ledger and trace.
  const deathsBack = COHORTS.reduce((a, c) => a + background[c], 0);
  const deathsEpi = COHORTS.reduce((a, c) => a + epidemicDeaths[c], 0);
  p.ledger.births += births;
  p.ledger.arrivals += arrivals;
  p.ledger.departures += departures;
  p.ledger.deaths.background = (p.ledger.deaths.background ?? 0) + deathsBack;
  if (ep && deathsEpi > 0) p.ledger.deaths[`epidemic:${ep.disease}`] = (p.ledger.deaths[`epidemic:${ep.disease}`] ?? 0) + deathsEpi;
  rec("births", "children", births);
  rec("arrivals", "transient", o.arrivals ?? 0);
  rec("settlement", "adults", settlers, "settlers");
  for (const c of COHORTS) { rec(c, "deaths:background", background[c]); if (ep) rec(c, `deaths:epidemic:${ep.disease}`, epidemicDeaths[c]); }
  rec("adultsM", "departures", leaveM); rec("adultsF", "departures", leaveF); rec("transient", "departures", transientLeaving);
  rec("children", "adults", toAdults, "ageing");
  rec("adults", "elders", toElders, "ageing");
  trace?.check(t, "people", start + births + arrivals - deathsBack - deathsEpi - departures, total(p), 1e-9 * Math.max(1, start));
  return { births, backgroundDeaths: background, epidemicDeaths, newCases, aged: { toAdults, toElders }, arrivals, departures, famine };
}

/** Outputs by library id. Labour = adults x health x (1 - sick share); the sick are the cases in the running
 * outbreak's batches (not yet reduced by the deaths among them). */
export function populationOutputs(p: Population) {
  const sick = p.epidemic ? p.epidemic.batches.reduce((a, b) => a + COHORTS.reduce((s, c) => s + b.n[c], 0), 0) : 0;
  const pool = p.children + p.adultsM + p.adultsF + p.elders;
  const sickShare = pool > 0 ? Math.min(1, sick / pool) : 0;
  return {
    "population.cohorts.children": p.children,
    "population.cohorts.adults-m-adults-f": adults(p),
    "population.cohorts.elders": p.elders,
    "population.cohorts.seasoned-share": p.seasonedShare,
    "population.cohorts.transient": p.transient,
    "population.cohorts.health": p.health,
    "population.cohorts.food-days": p.foodDays,
    "population.cohorts.epidemic": p.epidemic ? { disease: p.epidemic.disease, day: p.day - p.epidemic.startDay } : null,
    "population.cohorts.labour": adults(p) * p.health * (1 - sickShare),
  };
}
