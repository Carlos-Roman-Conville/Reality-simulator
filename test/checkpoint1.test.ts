import { describe, expect, it } from 'vitest';
import { runHumanWeek, FIXTURE, MEALS, DOOR } from '../examples/human-week.ts';
import { libraryRow, libraryTable } from '../src/library.ts';
import { World } from '../src/world.ts';
import { Scheduler } from '../src/scheduler.ts';
import { defaultRegistry, type Component } from '../src/registry.ts';
import { airContents, breathingProcess, roomAirProcess, roomGasFraction, litresToMoles } from '../src/atmosphere.ts';
import { metOf } from '../src/physiology.ts';
import { P_SEA_LEVEL } from '../src/physics.ts';

const row = (file: string, table: string, slug: string) => libraryRow(file, table, `${file}.${table}.${slug}`);
const numberIn = (text: unknown, rx: RegExp, index = 1) => Number(rx.exec(String(text))![index]!.replaceAll(',', ''));

describe('checkpoint 1: an integrated human week', () => {
  it('closes seven complete days from food rows, water transfers, composition and sleep tables within 20 s', () => {
    const run = runHumanWeek();
    expect(run.elapsedMs).toBeLessThan(20_000);
    expect(run.w.t).toBe(7 * 86400);
    expect(run.days).toHaveLength(7);
    expect(run.body.props.days_closed).toBe(7);
    expect(run.body.props.nut_days).toBe(7);
    expect(run.w.trace.failed()).toEqual([]);
    expect(run.w.trace.checks.some(c => c.quantity === 'element:C')).toBe(true);
    const kcal = Object.values(MEALS).flat().reduce((s, item) => s + Number(libraryRow('nutrition', 'foods', item.food).kcal) * item.kg * 10, 0);
    const foodWater = Object.values(MEALS).flat().reduce((s, item) => s + Number(libraryRow('nutrition', 'foods', item.food)['Water g']) * item.kg / 100, 0);
    const fatDensity = numberIn(row('nutrition', 'body_composition', 'fat-mass').Rule, /balance \/ ([\d,]+)/);
    const reserve = String(libraryRow('nutrition', 'nutrients', 'energy')['Body reserve (full)']);
    const initialGlycogen = numberIn(reserve, /glycogen about ([\d,]+) g/);
    const glyEnergy = numberIn(reserve, /glycogen about [\d,]+ g = ([\d,]+) kcal/) / initialGlycogen;
    const need = numberIn(row('physiology', 'recovery', 'sleep-debt')['Overnight rule'], /debt \+= max\(0, ([\d.]+)/);
    const circadian = Number(row('physiology', 'circadian', '02-00-to-06-00').Factor);
    let water = FIXTURE.waterKg as number, balance = 0, debt = 0;
    for (const d of run.days) {
      expect(d.kcalIn).toBeCloseTo(kcal, 9);
      expect(Math.abs(d.kcalIn - d.kcalOut - d.storedKcal)).toBeLessThan(d.kcalOut * 0.01);
      expect(d.outputs.energy_unplaced_kcal).toBeCloseTo(0, 6);
      expect(d.waterInKg - d.metabolicWaterKg).toBeCloseTo(foodWater + 6 * FIXTURE.drinkKg, 9); // metabolic water: physiology (2540)
      water += d.waterInKg - d.waterOutKg;
      expect(d.waterKg).toBeCloseTo(water, 8);
      expect(d.waterDeficitKg).toBeCloseTo(FIXTURE.waterKg - water, 8);
      balance += d.kcalIn - d.kcalOut;
      expect(d.massKg - FIXTURE.massKg).toBeCloseTo((balance - (Number(d.outputs.glycogen_g) - initialGlycogen) * glyEnergy) / fatDensity, 8);
      debt += need - ((FIXTURE.watchDays as readonly number[]).includes(d.day) ? 4 : 6);
      expect(d.outputs.sleep_debt).toBeCloseTo(debt, 9);
      const band = libraryTable('physiology', 'sleep_debt').find(r => {
        const label = String(r['Cumulative debt (hours below 8 h)']);
        const bounds = label.match(/[\d.]+/g)!.map(Number);
        return debt >= bounds[0]! && (bounds.length === 1 || debt < bounds[1]!);
      })!;
      expect(d.outputs.sleep_debt_row).toBe(band.id);
      expect(d.outputs.alertness).toBeCloseTo(Number(band['Alertness multiplier']) * circadian, 12);
      expect(d.circuits['neurology.circuits.attention']).toBeTypeOf('number');
      expect(d.outputs.deficiency_sodium).toBe(1); // this fixture exposes the sweat/sodium model's limit
      for (const v of Object.values(d.outputs)) if (typeof v === 'number') expect(Number.isFinite(v)).toBe(true);
    }
    expect(run.body.mass).toBeLessThan(FIXTURE.massKg);
    expect(run.w.trace.transfers.every(t => Number.isFinite(t.amount))).toBe(true);
  }, 20_000);

  it('matches the shut-door box-model peak for one sleeper in the same 40 m3 room', () => {
    // Controlled isothermal replay isolates the analytic box solution from changing heat and sweat.
    const w = new World(defaultRegistry()), sch = new Scheduler(), temperatureC = FIXTURE.minC;
    const comp = (id: string, kind: string): Component => ({ id, kind, material: kind === 'body' ? 'flesh' : 'air_mass',
      mass: FIXTURE.massKg, temperatureC, contents: [], ports: [], props: {}, condition: { capability: 1, control: 1, accuracy: 1 } });
    const room = comp('room', 'room'), body = comp('body', 'body');
    room.props = { volume_m3: FIXTURE.volumeM3, ach: DOOR.shut, pressurePa: P_SEA_LEVEL };
    room.contents = airContents(FIXTURE.volumeM3, P_SEA_LEVEL, temperatureC);
    w.registry.addComponent(room); w.registry.addComponent(body);
    for (const gas of ['water', 'o2', 'co2', 'n2']) w.conserve(gas, ['room'], 1e-9);
    const n0 = room.contents.reduce((s, x) => s + x.mass / w.registry.substance(x.substance).molarMass, 0);
    const c0 = w.registry.contentMass(room, 'co2') / w.registry.substance('co2').molarMass;
    const vo2Factor = numberIn(row('physiology', 'ventilation', 'oxygen-demand')['Formula or value'], /VO2 = ([\d.]+)/);
    const rq = numberIn(row('gasdynamics', 'box_model', 'oxygen-and-carbon-dioxide-move-together').Formula, /produced \/ ([\d.]+)/);
    const consumption = litresToMoles(vo2Factor * metOf('sleeping') * FIXTURE.massKg / 1000, P_SEA_LEVEL, temperatureC);
    const production = consumption * rq, minutes = 6 * 60, k = DOOR.shut / 60;
    const integral = (1 - Math.exp(-k * minutes)) / k;
    const expectedPpm = (c0 + production * integral) / (n0 + (production - consumption) * integral) * 1e6;
    sch.add(roomAirProcess('room')); sch.add(breathingProcess('body', 'room', { met: metOf('sleeping'), every: 1 }));
    let peak = 0;
    sch.add({ name: 'peak', every: 1, step() { peak = Math.max(peak, roomGasFraction(w, room, 'co2') * 1e6); } });
    sch.run(w, minutes * 60, FIXTURE.stepS);
    expect(Math.abs(peak - expectedPpm) / expectedPpm).toBeLessThan(0.01); // minute Euler integration vs continuous solution
    expect(w.trace.failed()).toEqual([]);
  });
});
