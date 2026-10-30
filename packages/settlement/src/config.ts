// Tunables. Every number here is a placeholder marked proposed; a host overrides them from its own data.

export interface ConditionBand { name: string; min: number; decayPerDay: number; outputFactor: number }

export interface SettlementConfig {
  bands: ConditionBand[]          // descending by min
  freeLayout: boolean             // may a title holder setLayout without a project (Q8; default no)
  hoursPerDay: number             // a full post's day, for labour arithmetic
  tickOrder: readonly string[]
}

export const TICK_ORDER = ['decay', 'projects', 'staffing', 'production', 'wages', 'publicWorks', 'expiry'] as const

export function defaultConfig(): SettlementConfig {
  return {
    bands: [
      { name: 'fine', min: 0.8, decayPerDay: 0.0005, outputFactor: 1 },
      { name: 'sound', min: 0.5, decayPerDay: 0.001, outputFactor: 0.9 },
      { name: 'poor', min: 0.2, decayPerDay: 0.002, outputFactor: 0.6 },
      { name: 'ruined', min: 0, decayPerDay: 0, outputFactor: 0 },
    ],
    freeLayout: false,
    hoursPerDay: 10,
    tickOrder: TICK_ORDER,
  }
}

export function bandOf(config: SettlementConfig, condition: number): ConditionBand {
  const band = config.bands.find((entry) => condition >= entry.min)
  if (!band) throw new Error(`no condition band for ${condition}`)
  return band
}
