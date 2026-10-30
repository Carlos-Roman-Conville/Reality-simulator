// Step 1: every standing building's condition falls by its band's daily rate unless a repair project holds it.
import { bandOf } from '../config.ts'
import type { Ctx } from '../context.ts'

export function decay(ctx: Ctx): void {
  const repairing = new Set(Object.values(ctx.state.projects)
    .filter((entry) => entry.status === 'active' && entry.kind === 'repair').map((entry) => entry.target))
  for (const bldg of Object.values(ctx.state.buildings)) {
    if (bldg.demolishedOn !== null || repairing.has(bldg.id)) continue
    const band = bandOf(ctx.config, bldg.condition)
    bldg.condition = Math.max(0, bldg.condition - band.decayPerDay)
  }
}
