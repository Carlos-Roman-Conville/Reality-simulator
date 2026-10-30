import { describe, expect, it } from "vitest";
import { Trace } from "../src/trace.ts";
import { diseaseCourse } from "../src/medicine.ts";
import { ageingRates, createPopulation, elderDeathFactor, famineRule, populationOutputs, settlersPerDay, startEpidemic, tick, total } from "../src/population.ts";

const rates = { birthRate: 0.2, deathRate: 0.03, childMaleShare: 0.5 };
const base = () => createPopulation({ children: 300, adultsM: 400, adultsF: 420, elders: 80, transient: 50, foodDays: 100 });

describe("the cohort tick", () => {
  it("reproduces the natural change of a host rate row", () => {
    const p = base();
    const r = tick(p, rates);
    const births = 420 * 0.2 / 365;
    const age = ageingRates();
    expect(age.toAdults).toBeCloseTo(1 / 5475, 15);
    expect(age.toElders).toBeCloseTo(1 / 12775, 15);
    expect(r.births).toBeCloseTo(births, 12);
    expect(p.children).toBeCloseTo(300 + births - 300 * 0.03 / 365 - 300 / 5475, 10);
    expect(p.elders).toBeCloseTo(80 + 820 / 12775 - 80 * 0.03 / 365 * 2, 10);
    expect(elderDeathFactor()).toBe(2);
    expect(p.adultsF).toBeCloseTo(420 + 150 / 5475 - 420 / 12775 - 420 * 0.03 / 365, 10);
    expect(p.foodDays).toBe(99);
  });

  it("health scales births and deaths: births x health, deaths x (2 - health)", () => {
    const sick = createPopulation({ children: 0, adultsM: 0, adultsF: 1000, elders: 0, health: 0.5, foodDays: 10 });
    const r = tick(sick, rates);
    expect(r.births).toBeCloseTo(1000 * 0.2 / 365 * 0.5, 12);
    expect(r.backgroundDeaths.adultsF).toBeCloseTo(1000 * 0.03 / 365 * 1.5, 12);
  });

  it("conserves people over a year: every leaving person is a death, a departure or an ageing move", () => {
    const p = base();
    const trace = new Trace();
    const start = total(p);
    for (let d = 0; d < 365; d++) tick(p, rates, { trace, arrivals: 2, transientLeaving: 1, leaversM: 0.1, leaversF: 0.05, prosperity: 0.8, reputation: 0.5 });
    expect(trace.failed()).toEqual([]);
    const deaths = Object.values(p.ledger.deaths).reduce((a, b) => a + b, 0);
    expect(total(p)).toBeCloseTo(start + p.ledger.births + p.ledger.arrivals - deaths - p.ledger.departures, 6);
    expect(settlersPerDay(0.8, 0.5)).toBeCloseTo(0.0004, 12);
    // Ageing is internal: the traced moves between cohorts net to zero in the total.
    const aged = trace.transfers.filter(x => x.note === "ageing").reduce((a, x) => a + x.amount, 0);
    expect(aged).toBeGreaterThan(0);
    const out = trace.transfers.filter(x => x.from === "adultsM" || x.from === "adultsF" || x.from === "children" || x.from === "elders").filter(x => x.note !== "ageing");
    expect(out.every(x => x.to.startsWith("deaths:") || x.to === "departures")).toBe(true);
  });

  it("applies the famine row once the stores are under zero", () => {
    const f = famineRule();
    expect(f).toEqual({ healthLoss: 0.02, birthsFactor: 0.5, deathsFactor: 1.5 });
    const p = createPopulation({ adultsF: 1000, foodDays: 0 });
    const r = tick(p, rates);
    expect(r.famine).toBe(true);
    expect(r.births).toBeCloseTo(1000 * 0.2 / 365 * 0.5, 12);
    expect(r.backgroundDeaths.adultsF).toBeCloseTo(1000 * 0.03 / 365 * 1.5, 12);
    expect(p.health).toBeCloseTo(0.98, 12);
  });
});

describe("an epidemic through the disease course", () => {
  it("raises deaths by the course's risk over the course days and seasons the survivors", () => {
    const d = diseaseCourse("smallpox");
    const risk = (d.risk!.lo + d.risk!.hi) / 2;
    const courseDays = Math.round((d.course!.lo + d.course!.hi) / 2);
    const make = () => createPopulation({ children: 200, adultsM: 400, adultsF: 400, elders: 0, foodDays: 1000 });
    const calm = make(), ill = make();
    startEpidemic(ill, "smallpox", 0.01);
    const trace = new Trace();
    // The last batch falls ill on day courseDays - 1 and its deaths run a further courseDays.
    let cases = 0;
    for (let day = 0; day < 2 * courseDays + 2; day++) { tick(calm, { ...rates, birthRate: 0 }); cases += tick(ill, { ...rates, birthRate: 0 }, { trace }).newCases; }
    // 1% of the pool a day for the course days, none seasoned yet and none repeating, each case at the risk.
    expect(cases).toBeGreaterThan(0.01 * 900 * courseDays);
    const extra = ill.ledger.deaths["epidemic:smallpox"];
    expect(extra).toBeCloseTo(cases * risk, 6);
    expect(calm.ledger.deaths["epidemic:smallpox"]).toBeUndefined();
    expect(ill.epidemic).toBeNull();
    expect(trace.failed()).toEqual([]);
    expect(ill.seasonedShare).toBeGreaterThan(0);
    expect(total(ill)).toBeLessThan(total(calm));
  });

  it("refuses a disease without a course and sets no deaths where the risk is not a number", () => {
    const p = createPopulation({ adultsF: 100 });
    expect(() => startEpidemic(p, "scurvy", 0.01)).toThrow();
    expect(() => startEpidemic(p, "pellagra", 0.01)).toThrow();
    startEpidemic(p, "gonorrhoea", 0.01);
    for (let i = 0; i < 50; i++) tick(p, rates);
    expect(p.ledger.deaths["epidemic:gonorrhoea"]).toBeUndefined();
    expect(p.epidemic).toBeNull();
  });

  it("outputs labour by library id", () => {
    const p = base();
    const o = populationOutputs(p);
    expect(o["population.cohorts.labour"]).toBeCloseTo(820);
    expect(o["population.cohorts.children"]).toBe(300);
  });
});
