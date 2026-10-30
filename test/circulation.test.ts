import { describe, it, expect } from "vitest";
import { defaultRegistry } from "../src/registry.ts";
import { World } from "../src/world.ts";
import { bodyOutputs } from "../src/physiology.ts";
import { saturation, cohbAfter } from "../src/atmosphere.ts";
import { bleed, bleedingClass, bleedingEffects, circulationProcess, circulationRules, hazard, initialiseCirculation, loseBlood, normalBloodVolume, oxygenDelivery, regulationLoops } from "../src/circulation.ts";

function fixture() {
  const w = new World(defaultRegistry());
  w.registry.addComponent({ id: "body", kind: "body", material: "flesh", mass: 70, temperatureC: 37,
    contents: [], ports: [], condition: { capability: 1, control: 1, accuracy: 1 }, props: { male: 1 } });
  const b = w.registry.component("body"), out = bodyOutputs(b);
  out.sao2 = saturation(95); out.cohb = cohbAfter(0, 0, 6, 1);
  initialiseCirculation(w, "body");
  return { w, b, out };
}

describe("circulation library and transfers", () => {
  it("reads normals, all six tables and qualitative regulation clocks", () => {
    expect(normalBloodVolume(70, true)).toBe(4900);
    expect(normalBloodVolume(70, false)).toBe(4550);
    for (const table of ["quantities", "bleeding", "delivery_failures", "homeostasis", "events", "blood_gas"] as const)
      expect(Object.keys(circulationRules(table)).every(id => id.startsWith(`circulation.${table}.`))).toBe(true);
    expect(regulationLoops()["circulation.homeostasis.volume-and-salt-kidney"]).toMatchObject({ tauSeconds: null, timeConstant: "hours to days" });
  });
  it("every regulation loop has failsWhen text and a null tau (the slot is unsourced)", () => {
    const loops = Object.values(regulationLoops());
    expect(loops.length).toBe(7);
    for (const l of loops) {
      expect(typeof l.failsWhen).toBe("string");
      expect((l.failsWhen as string).trim().length).toBeGreaterThan(0);
      expect(l.tauSeconds).toBeNull();
    }
  });
  it("1500 mL in a 70 kg man is III: table pressure/perfusion and DO2 fall", () => {
    const { w, out, b } = fixture();
    // Explicit fixed-resistance experiment, not an engine compensation law.
    const process = circulationProcess("body", { resistance: 90 / 5, maximalCardiacOutputLMin: 20 });
    process.step(w, 0);
    const before = out["circulation.quantities.oxygen-delivery-do2"] as number;
    expect(out.aerobic_today).toBeCloseTo(oxygenDelivery(20, 15, saturation(95)), 9);
    loseBlood(w, "body", 1500); process.step(w, 60);
    expect(bleedingClass(1500, 4900).Class).toBe("III");
    expect(out["circulation.bleeding.iii"]).toBe(1);
    expect(out["circulation.quantities.mean-arterial-pressure"]).toBe(65);
    expect(out["circulation.quantities.perfusion-per-organ.brain"]).toBe(0.8);
    expect(out["circulation.quantities.perfusion-per-organ.kidneys"]).toBe(0.5);
    expect(out["circulation.quantities.perfusion-per-organ.gut"]).toBe(0.3);
    expect(out["circulation.quantities.oxygen-delivery-do2"]).toBeLessThan(before);
    expect(out["circulation.quantities.haemoglobin"]).toBeCloseTo(15, 12);
    expect(b.props.blood_volume_ml + w.trace.outOf("body", "volume:blood")).toBe(4900);
    expect(w.trace.failed()).toEqual([]);
  });
  it("clotting scales wounds, binding stops loss and loss cannot overdraw", () => {
    const { w, b } = fixture();
    expect(bleed(w, "body", 100, 60, 0.5)).toBe(150);
    expect(bleed(w, "body", 100, 60, 0.5, true)).toBe(0);
    expect(loseBlood(w, "body", 10000)).toBe(4750);
    expect(b.props.blood_volume_ml).toBe(0);
    expect(b.props.blood_hb_g).toBeCloseTo(0, 12);
    expect(w.trace.outOf("body", "volume:blood")).toBe(4900);
    expect(w.trace.failed()).toEqual([]);
    expect(() => loseBlood(w, "body", -1)).toThrow();
  });
  it("recovers by the host's experimental tau with finite fluid and Hb dilution", () => {
    const { w, b, out } = fixture();
    loseBlood(w, "body", 1500); b.props.circulation_fluid_ml = 1500;
    // The library's tau is null (no cited source, flags/circulation.md), so this stays a named host override.
    expect(regulationLoops()["circulation.homeostasis.volume-and-salt-kidney"].tauSeconds).toBeNull();
    const tau = 86400;
    const process = circulationProcess("body", { volumeTauSeconds: tau, kidneyWorking: true });
    process.step(w, tau / 2); process.step(w, tau / 2);
    expect(b.props.blood_volume_ml).toBeCloseTo(4900 - 1500 / Math.E, 9);
    expect(b.props.blood_volume_ml + b.props.circulation_fluid_ml).toBeCloseTo(4900, 9);
    expect(out["circulation.quantities.haemoglobin"]).toBeLessThan(15);
    expect(w.trace.into("body", "volume:blood")).toBeCloseTo(1500 * (1 - 1 / Math.E), 9);
    expect(w.trace.failed()).toEqual([]);
    b.props.circulation_fluid_ml = 0; const volume = b.props.blood_volume_ml;
    process.step(w, tau); expect(b.props.blood_volume_ml).toBe(volume);
  });
  it("disables missing kinetics, gases and class IV exact pressure", () => {
    const { w, b, out } = fixture(); loseBlood(w, "body", 1500);
    b.props.circulation_fluid_ml = 1500; delete out.sao2;
    circulationProcess("body").step(w, 86400);
    expect(b.props.blood_volume_ml).toBe(3400);
    expect(out.aerobic_today).toBeNull();
    expect(circulationRules("quantities")["circulation.quantities.maximal-cardiac-output"]["Normal (70 kg man)"]).toBeNull();
    expect(out["circulation.quantities.oxygen-delivery-do2"]).toBeNull();
    expect(bleedingEffects(2100, 4900)).toMatchObject({ pressure: null, pressureUpperBound: 50 });
    expect(bleedingClass(0.4 * 4900, 4900).Class).toBe("III");
  });
  it("uses atmospheric saturation and CO binding in delivery", () => {
    const base = oxygenDelivery(5, 15, saturation(95));
    expect(oxygenDelivery(5, 15, saturation(95), 0.2)).toBeCloseTo(base * 0.8, 10);
    expect(oxygenDelivery(5, 8, saturation(95))).toBeLessThan(base);
    expect(() => oxygenDelivery(5, 15, 2)).toThrow();
  });
});

describe("conditional unmeasured hazards", () => {
  it("never rolls or enables crises in a healthy state", () => {
    for (const id of Object.keys(circulationRules("events"))) {
      const h = hazard(id); expect(h.unmeasured).toBe(true);
      expect(h.precondition.length).toBeGreaterThan(0);
      if (!id.endsWith("atherosclerosis-the-index")) expect(h.rate).toBe(0);
    }
  });
  it("reads native chance units and enforces prerequisites", () => {
    expect(hazard("angina", { index: 0.6, demandExceedsSupply: true })).toMatchObject({ rate: 0.12, unit: "event", eligible: true });
    expect(hazard("myocardial-infarction", { index: 0.5, triggerDay: true }).rate).toBeCloseTo(0.00125, 12);
    expect(hazard("arrhythmia", { potassium: 7.1 })).toMatchObject({ rate: 0.05, unit: "hour" });
    expect(hazard("arrhythmia", { sao2: 0.7 }).rate).toBeNull();
    expect(hazard("arrhythmia", { potassium: 7.1, drugs: true }).rate).toBeNull();
    expect(hazard("stroke", { index: 0.6 }).rate).toBeCloseTo(0.00018, 12);
    expect(hazard("thrombosis-and-embolism", { immobile: true }).rate).toBe(0.005);
    expect(hazard("thrombosis-and-embolism", { sepsis: true }).rate).toBeNull();
    expect(hazard("heart-failure", { heartDamage: 0.6 })).toMatchObject({ rate: null, unit: "state", eligible: true });
    expect(hazard("shock-circulatory", { classIIIPlus: true }).eligible).toBe(true);
  });
});
