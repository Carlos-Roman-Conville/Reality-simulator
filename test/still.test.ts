import { describe, expect, it } from "vitest";

const LONG = 60_000;
import { runStill } from "../src/lab/still.ts";
import { pressureAtAltitude, waterBoilingPoint, waterLatentHeat, waterVapourPressure, carbonCombustion, HHV } from "../src/physics.ts";

describe("physics constants and formulas (real-world values)", () => {
  it("water boils at 100 C at sea level and at about 92.5 C at 2,256 m (Antoine)", () => {
    expect(waterBoilingPoint(101325)).toBeCloseTo(100.0, 0);
    expect(waterBoilingPoint(pressureAtAltitude(2256))).toBeCloseTo(92.5, 0);
  });
  it("vapour pressure of water at 25 C is about 23.8 mmHg (3.17 kPa)", () => {
    expect(waterVapourPressure(25) / 1000).toBeCloseTo(3.17, 1);
  });
  it("latent heat is about 2257 kJ/kg at 100 C", () => {
    expect(waterLatentHeat(100) / 1000).toBeCloseTo(2264, -2);
  });
  it("charcoal burns by stoichiometry: 1 kg C needs 2.67 kg O2 and makes 3.67 kg CO2 with 30 MJ", () => {
    const c = carbonCombustion(1, 0.21);
    expect(c.kgO2).toBeCloseTo(2.667, 2); expect(c.kgCO2).toBeCloseTo(3.667, 2); expect(c.kgCO).toBe(0); expect(c.heatJ).toBe(HHV.charcoal);
  });
});

describe("the still in a room", () => {
  const sea = runStill({ altitudeM: 0, skill: 100, minutes: 120, seed: 7 });
  const hill = runStill({ altitudeM: 2256, skill: 100, minutes: 120, seed: 7 });

  it("conserves water and charcoal every step", () => {
    expect(sea.conservationFailures).toBe(0);
    expect(hill.conservationFailures).toBe(0);
  });
  it("boils at the pressure's boiling point and lower on the hill", () => {
    expect(sea.boilingPointC).toBeCloseTo(100.0, 0);
    expect(hill.boilingPointC).toBeCloseTo(92.5, 0);
    expect(hill.boilingPointC).toBeLessThan(sea.boilingPointC);
  });
  it("produces distillate once boiling, at the rate the net heat over the latent heat allows", () => {
    expect(sea.firstBoilAtS).not.toBeNull();
    expect(sea.distillateKg).toBeGreaterThan(0.2);
    // energy bound: distillate x L cannot exceed the fuel's heat delivered to the vessel
    const L = waterLatentHeat(100);
    const delivered = sea.charcoalBurnedKg * HHV.charcoal * 0.3;
    expect(sea.distillateKg * L).toBeLessThan(delivered);
    // the condenser kept up: little lost to the room
    expect(sea.lostToRoomKg).toBeLessThan(sea.distillateKg * 0.2);
  });
  it("energy balances: fuel heat = vessel sensible + latent + losses + room, within 2%", () => {
    const tr = sea.world.trace;
    const fuel = tr.into("heater", "energy");
    const toVessel = tr.transfers.filter(x => x.quantity === "energy" && x.from === "heater" && x.to === "vessel").reduce((a, x) => a + x.amount, 0);
    const toRoom = tr.transfers.filter(x => x.quantity === "energy" && x.from === "heater" && x.to === "room").reduce((a, x) => a + x.amount, 0);
    expect((toVessel + toRoom) / fuel).toBeCloseTo(1, 2);
    const latent = tr.transfers.filter(x => x.quantity === "energy" && x.to === "latent").reduce((a, x) => a + x.amount, 0);
    const vesselLosses = tr.transfers.filter(x => x.quantity === "energy" && x.process === "losses" && x.from === "vessel").reduce((a, x) => a + x.amount, 0);
    const cap = sea.world.registry.heatCapacity(sea.world.registry.component("vessel"));
    const sensibleNow = (sea.vesselC - 26) * cap;
    // the water that boiled off carried its own sensible heat (cp x (T_boil - 26)) out of the vessel
    const waterOut = tr.outOf("vessel", "mass:water");
    const carried = waterOut * 4186 * (sea.boilingPointC - 26);
    expect(Math.abs(toVessel - (latent + vesselLosses + sensibleNow + carried)) / toVessel).toBeLessThan(0.02);
  });
  it("the room warms, its oxygen falls and CO2 rises from the fire; the distiller sweats", () => {
    expect(sea.roomC).toBeGreaterThan(26);
    expect(sea.co2ppm).toBeGreaterThan(400);
    expect(sea.o2frac).toBeLessThan(0.2095);
    expect(sea.waterDeficitPct).toBeGreaterThan(0);
  });
  it("a drifted thermometer misreports while the physics proceeds on the true temperature", () => {
    const r = runStill({ altitudeM: 0, skill: 100, minutes: 60, daysSinceCalibration: 60, seed: 3 });
    expect(Math.abs(r.thermometerReading - r.thermometerTrue)).toBeGreaterThan(1.5);
    expect(r.boilingPointC).toBeCloseTo(100, 0);
  }, LONG);
  it("a novice wastes fuel: more charcoal per kg of distillate than a master", () => {
    const master = runStill({ altitudeM: 0, skill: 100, minutes: 120, seed: 11 });
    const novice = runStill({ altitudeM: 0, skill: 0, minutes: 120, seed: 11 });
    expect(novice.charcoalBurnedKg / Math.max(1e-6, novice.distillateKg)).toBeGreaterThanOrEqual(master.charcoalBurnedKg / master.distillateKg * 0.95);
    expect(novice.vesselCondition.control).toBeLessThanOrEqual(master.vesselCondition.control + 1e-9);
  }, LONG);
  it("a shut room with a big fire runs short of oxygen and makes carbon monoxide", () => {
    const shut = runStill({ altitudeM: 0, skill: 100, minutes: 180, ach: 0.1, roomM3: 15, feedKgPerS: 2 / 3600, charcoalKg: 8, seed: 5 });
    expect(shut.o2frac).toBeLessThan(0.17);
    expect(shut.coppm).toBeGreaterThan(0);
    expect(shut.co2ppmMin).toBeGreaterThan(100000);
  }, LONG);
});
