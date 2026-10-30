// The one entry point: reduce(state, command, config, providers) -> { state, events }. The state is copied
// first, so a failed command throws and leaves the caller's state untouched. Providers may hold their own
// mutable stores (inventories): a throw after a provider call is the host's to roll back, which is why every
// command validates before it calls a provider.

import * as handlers from './commands.ts'
import type { Command } from './commands.ts'
import { defaultConfig, type SettlementConfig } from './config.ts'
import type { Ctx } from './context.ts'
import type { SettlementEvent } from './events.ts'
import { stubProviders, type Providers } from './providers.ts'
import type { SettlementState } from './state.ts'
import { tick } from './tick/index.ts'

export interface ReduceResult { state: SettlementState; events: SettlementEvent[]; result: unknown }

export function reduce(state: SettlementState, command: Command, config: SettlementConfig = defaultConfig(),
  providers: Providers = stubProviders()): ReduceResult {
  if (!command || typeof command !== 'object' || typeof (command as { type?: unknown }).type !== 'string') throw new Error('invalid command')
  const ctx: Ctx = { state: structuredClone(state), config, providers, events: [] }
  let result: unknown = undefined
  switch (command.type) {
    case 'addDistrict': result = handlers.addDistrict(ctx, command); break
    case 'growDistrict': handlers.growDistrict(ctx, command); break
    case 'addParcel': result = handlers.addParcel(ctx, command); break
    case 'splitParcel': result = handlers.splitParcel(ctx, command); break
    case 'mergeParcels': result = handlers.mergeParcels(ctx, command); break
    case 'zone': handlers.zone(ctx, command); break
    case 'grantTitle': result = handlers.grantTitle(ctx, command); break
    case 'sell': result = handlers.sell(ctx, command); break
    case 'transfer': result = handlers.transfer(ctx, command); break
    case 'inherit': result = handlers.inherit(ctx, command); break
    case 'setTransferable': handlers.setTransferable(ctx, command); break
    case 'lease': result = handlers.leaseTitle(ctx, command); break
    case 'endLease': handlers.endLease(ctx, command); break
    case 'setRent': handlers.setRent(ctx, command); break
    case 'addBuilding': result = handlers.addBuilding(ctx, command); break
    case 'startProject': result = handlers.startProject(ctx, command); break
    case 'advanceProject': handlers.advanceProject(ctx, command); break
    case 'cancelProject': handlers.cancelProject(ctx, command); break
    case 'setLayout': handlers.setLayout(ctx, command); break
    case 'addFixture': handlers.addFixture(ctx, command); break
    case 'removeFixture': handlers.removeFixture(ctx, command); break
    case 'setCondition': handlers.setCondition(ctx, command); break
    case 'openBusiness': result = handlers.openBusiness(ctx, command); break
    case 'closeBusiness': handlers.closeBusiness(ctx, command); break
    case 'setOperator': handlers.setOperator(ctx, command); break
    case 'setManager': handlers.setManager(ctx, command); break
    case 'setLines': handlers.setLines(ctx, command); break
    case 'setPublicWorks': handlers.setPublicWorks(ctx, command); break
    case 'addPost': result = handlers.addPost(ctx, command); break
    case 'removePost': handlers.removePost(ctx, command); break
    case 'assign': result = handlers.assign(ctx, command); break
    case 'unassign': handlers.unassign(ctx, command); break
    case 'hire': handlers.hire(ctx, command); break
    case 'dismiss': handlers.dismiss(ctx, command); break
    case 'createOffice': result = handlers.createOffice(ctx, command); break
    case 'appoint': handlers.appoint(ctx, command); break
    case 'vacate': handlers.vacate(ctx, command); break
    case 'grantPermission': result = handlers.grantPermission(ctx, command); break
    case 'revokePermission': handlers.revokePermission(ctx, command); break
    case 'credit': handlers.credit(ctx, command); break
    case 'debit': handlers.debit(ctx, command); break
    case 'pay': result = handlers.payCommand(ctx, command); break
    case 'setWage': handlers.setWage(ctx, command); break
    case 'tick': tick(ctx); break
    default: throw new Error(`unknown settlement command: ${String((command as { type: string }).type)}`)
  }
  return { state: ctx.state, events: ctx.events, result }
}

/** A small driver for scripts and tests: keeps the state, returns each command's result, collects events. */
export class Runner {
  events: SettlementEvent[] = []
  log: Command[] = []
  state: SettlementState
  config: SettlementConfig
  providers: Providers
  constructor(state: SettlementState, config: SettlementConfig = defaultConfig(), providers: Providers = stubProviders()) {
    this.state = state
    this.config = config
    this.providers = providers
  }
  run<T = unknown>(command: Command): T {
    const out = reduce(this.state, command, this.config, this.providers)
    this.state = out.state
    this.events.push(...out.events)
    this.log.push(structuredClone(command))
    return out.result as T
  }
  tick(days = 1): void { for (let i = 0; i < days; i++) this.run({ type: 'tick' }) }
}
