// Step 7: leases and permissions past their end close.
import { endLease } from '../commands.ts'
import type { Ctx } from '../context.ts'

export function expiry(ctx: Ctx): void {
  const day = ctx.state.settlement.day
  for (const lease of Object.values(ctx.state.leases)) {
    if (lease.status === 'active' && lease.end !== null && lease.end <= day) endLease(ctx, { type: 'endLease', lease: lease.id })
  }
  for (const permission of Object.values(ctx.state.permissions)) {
    if (permission.status === 'active' && permission.expires !== null && permission.expires <= day) {
      permission.status = 'expired'
      ctx.events.push({ type: 'permissionChanged', permission: permission.id, status: 'expired' })
    }
  }
}
