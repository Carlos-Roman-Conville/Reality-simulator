// reduce(state, command, config, providers) -> { state, events, minted, taken }: pure; a failed command throws and
// the caller's state is untouched. The Runner keeps a state and a command log so a run replays (E3).

import { apply, type Command } from './commands.ts'
import { defaultConfig, type EconomyConfig } from './config.ts'
import type { Ctx } from './context.ts'
import type { EconomyEvent } from './events.ts'
import { stubProviders, type Providers } from './providers.ts'
import { initialState, type EconomyState } from './state.ts'

export interface ReduceResult { state: EconomyState; events: EconomyEvent[]; minted: string | null; taken: number | null }

export function reduce(state: EconomyState, command: Command, config: EconomyConfig = defaultConfig(), providers: Providers = stubProviders()): ReduceResult {
  const ctx: Ctx = { state: structuredClone(state), config, providers, events: [], minted: null, taken: null }
  apply(ctx, command)
  return { state: ctx.state, events: ctx.events, minted: ctx.minted, taken: ctx.taken }
}

export class Runner {
  state: EconomyState
  config: EconomyConfig
  providers: Providers
  log: Command[] = []
  events: EconomyEvent[] = []
  constructor(state: EconomyState = initialState(), config: EconomyConfig = defaultConfig(), providers: Providers = stubProviders()) {
    this.state = state; this.config = config; this.providers = providers
  }
  run(command: Command): ReduceResult {
    const result = reduce(this.state, command, this.config, this.providers)
    this.state = result.state
    this.log.push(structuredClone(command))
    this.events.push(...result.events)
    return result
  }
  /** Fold a command log over a fresh state with the same config and providers: the same state must come out. */
  static replay(log: Command[], config: EconomyConfig = defaultConfig(), providers: Providers = stubProviders(), from: EconomyState = initialState()): Runner {
    const runner = new Runner(structuredClone(from), config, providers)
    for (const command of log) runner.run(command)
    return runner
  }
}
