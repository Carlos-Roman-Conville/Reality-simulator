// One day, in the configured order (CONTRACTS.md §9: the host runs settlement.tick, then economy.tick(N)).
// Step 2 has two steps: `production` rolls today's observed production into producedLast; `advance` ends the day.
// Steps 3-5 add spoilage, consumption, prices and shipments, each a module here.

import type { Ctx } from '../context.ts'

type Step = (ctx: Ctx) => void

export function production(ctx: Ctx): void {
  for (const mkt of Object.values(ctx.state.markets)) {
    for (const entry of Object.values(mkt.goods)) { entry.producedLast = entry.producedToday; entry.producedToday = 0 }
  }
}

export function advance(ctx: Ctx): void {
  ctx.events.push({ type: 'dayEnded', day: ctx.state.day })
  ctx.state.day += 1
}

export const STEPS: Record<string, Step> = { production, advance }

export function tick(ctx: Ctx): void {
  ctx.state.tickTrace = []
  for (const name of ctx.config.tickOrder) {
    const step = STEPS[name]
    if (!step) throw new Error(`unknown tick step: ${name}`)
    step(ctx)
    ctx.state.tickTrace.push(name)
  }
}
