/**
 * Real-world formulas and constants (SI). Every function cites its source key (files/pirate-ship/SOURCES.md, ENG-*).
 * Nothing here is a game rule: these are the physics the engine runs on. Simplifications are named in the doc comment.
 */

export const R_GAS = 8.314; // J/(mol K)  ENG-GAS
export const MMHG_PER_PA = 760 / 101325;
export const P_SEA_LEVEL = 101325; // Pa

/** Barometric formula for the lower atmosphere under standard conditions (ATM-STD). h in metres, returns Pa. */
export function pressureAtAltitude(h: number): number {
  return P_SEA_LEVEL * Math.pow(1 - 0.0065 * h / 288.15, 5.256);
}

/** Antoine equation for water, 1 to 100 C: log10 p(mmHg) = A - B/(C + T). Returns Pa. ENG-ANT (NIST). */
export function waterVapourPressure(tC: number): number {
  const A = 8.07131, B = 1730.63, C = 233.426;
  const mmHg = Math.pow(10, A - B / (C + tC));
  return mmHg / MMHG_PER_PA;
}

/** Inverse of the Antoine equation: the boiling point (C) of water at pressure p (Pa). ENG-ANT. */
export function waterBoilingPoint(pPa: number): number {
  const A = 8.07131, B = 1730.63, C = 233.426;
  const mmHg = pPa * MMHG_PER_PA;
  return B / (A - Math.log10(mmHg)) - C;
}

/** Latent heat of vaporisation of water, J/kg: about 2501 - 2.37 T kJ/kg for T in C (2257 kJ/kg at 100 C). ENG-LAT. */
export function waterLatentHeat(tC: number): number {
  return (2501 - 2.37 * tC) * 1000;
}

/** Specific heats, J/(kg K). ENG-CP. */
export const CP = { water: 4186, air: 1005, copper: 385, glass: 840, iron: 450, charcoal: 1000, waterVapour: 1996 } as const;

/** Higher heating values, J/kg. ENG-HHV (NIST, Engineering ToolBox). */
export const HHV = { charcoal: 30.0e6, wood_dry: 16.0e6, ethanol: 26.8e6 } as const;

/** Molar masses, kg/mol. ENG-STOICH. */
export const M = { C: 0.012, O2: 0.032, CO2: 0.044, CO: 0.028, H2O: 0.018, N2: 0.028, air: 0.029 } as const;

/**
 * Charcoal (as carbon) burning: complete, C + O2 -> CO2 (1 kg C: 2.667 kg O2 -> 3.667 kg CO2);
 * starved, 2C + O2 -> 2CO (1 kg C: 1.333 kg O2 -> 2.333 kg CO). The share that goes to CO rises as the air's oxygen
 * fraction falls under 0.15 (a simplification of the real dependence on temperature and mixing; GAS-BOX, CHM-BP).
 */
export function carbonCombustion(kgC: number, o2Fraction: number) {
  const coShare = o2Fraction >= 0.15 ? 0 : Math.min(1, (0.15 - o2Fraction) / 0.10);
  const kgCO2 = kgC * (1 - coShare) * (M.CO2 / M.C);
  const kgCO = kgC * coShare * (M.CO / M.C);
  const kgO2 = kgC * (1 - coShare) * (M.O2 / M.C) + kgC * coShare * (0.5 * M.O2 / M.C);
  // CO carries away unreleased heat: CO's heat of combustion is about 10.1 MJ/kg of CO (ENG-HHV)
  const heat = kgC * HHV.charcoal - kgCO * 10.1e6;
  return { kgCO2, kgCO, kgO2, heatJ: heat };
}

/** Convective or overall heat flow, W = U A dT. ENG-HT. */
export function heatFlow(U: number, areaM2: number, dT: number): number {
  return U * areaM2 * dT;
}

/** Ideal gas: moles in a volume. ENG-GAS. */
export function molesInVolume(pPa: number, volumeM3: number, tK: number): number {
  return pPa * volumeM3 / (R_GAS * tK);
}

/** Density of air at p, T (kg/m3), ideal gas. */
export function airDensity(pPa: number, tK: number): number {
  return pPa * M.air / (R_GAS * tK);
}

/** Metabolic heat of a body, W: MET x 3.5 mL O2/kg/min x 20.1 kJ/L (PHY-MET, PHY-FAO). */
export function metabolicHeat(met: number, massKg: number): number {
  const litresO2PerMin = met * 3.5 * massKg / 1000;
  return litresO2PerMin * 20100 / 60;
}

/** Latent heat of sweat evaporation, J/kg (about 2.43 MJ/kg at skin temperature). ENG-LAT. */
export const SWEAT_LATENT = 2.43e6;

export const C_TO_K = 273.15;
