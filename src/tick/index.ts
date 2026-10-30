// One day, in the declared order. The trace lists the steps so a test can assert the order.
import type { Ctx } from '../context.ts'
import { decay } from './decay.ts'
import { projects } from './projects.ts'
import { staffing } from './staffing.ts'
import { production } from './production.ts'
import { publicWorks, wages } from './wages.ts'
import { expiry } from './expiry.ts'

const STEPS: Record<string, (ctx: Ctx) => void> = { decay, projects, staffing, production, wages, publicWorks, expiry }

export function tick(ctx: Ctx): void {
  ctx.state.tickTrace = []
  for (const name of ctx.config.tickOrder) {
    const step = STEPS[name]
    if (!step) throw new Error(`unknown tick step: ${name}`)
    step(ctx)
    ctx.state.tickTrace.push(name)
  }
  ctx.state.settlement.day += 1
}
