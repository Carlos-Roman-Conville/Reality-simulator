// The command union and handlers (step 2): the catalogue, inventories, markets, stock moves, production, the tick.
// Every handler checks only this engine's invariants and throws without touching the caller's state.

import { adjust, finite, good, integer, inventory, market, marketGood, must, newId, nonempty, recipe, stockOf, type Ctx } from './context.ts'
import { availableUnits, consumeInputs } from './material.ts'
import type { Good, MarketMode, Recipe } from './state.ts'
import { tick } from './tick/index.ts'

export type Command =
  | { type: 'defineGood'; good: Good }
  | { type: 'defineRecipe'; recipe: Recipe }
  | { type: 'openInventory'; holder: string; market: string }
  | { type: 'openMarket'; id: string; mode: MarketMode }
  | { type: 'setMarketGood'; market: string; good: string; consumptionPerDay?: number | null; targetReserve?: number | null; productionPerDay?: number | null; basePrice?: number | null; perCapitaPerDay?: number | null }
  | { type: 'addStock'; inventory: string; good: string; units: number }      // the host seeds or imports stock
  | { type: 'removeStock'; inventory: string; good: string; units: number }   // the host's exit (a quest, a wreck); refused beyond stock
  | { type: 'moveStock'; from: string; to: string; good: string; units: number }
  | { type: 'produce'; inventory: string; recipe: string; units: number }     // Settlement's MaterialProvider.produce
  | { type: 'take'; inventory: string; good: string; units: number }         // Settlement's MaterialProvider.take
  | { type: 'tick' }

export function apply(ctx: Ctx, command: Command): void {
  switch (command.type) {
    case 'defineGood': return defineGood(ctx, command.good)
    case 'defineRecipe': return defineRecipe(ctx, command.recipe)
    case 'openInventory': return openInventory(ctx, command.holder, command.market)
    case 'openMarket': return openMarket(ctx, command.id, command.mode)
    case 'setMarketGood': return setMarketGood(ctx, command)
    case 'addStock': return addStock(ctx, command.inventory, command.good, command.units)
    case 'removeStock': return removeStock(ctx, command.inventory, command.good, command.units)
    case 'moveStock': return moveStock(ctx, command.from, command.to, command.good, command.units)
    case 'produce': return produce(ctx, command.inventory, command.recipe, command.units)
    case 'take': return take(ctx, command.inventory, command.good, command.units)
    case 'tick': return tick(ctx)
    default: throw new Error(`unknown command: ${(command as { type: string }).type}`)
  }
}

function defineGood(ctx: Ctx, def: Good): void {
  nonempty(def.id, 'good.id')
  if (Object.hasOwn(ctx.state.goods, def.id)) throw new Error(`good already defined: ${def.id}`)
  if (def.weight !== null) finite(def.weight, 'good.weight', 0)
  if (def.spoilagePerDay !== null) { finite(def.spoilagePerDay, 'good.spoilagePerDay', 0); if (def.spoilagePerDay > 1) throw new Error('good.spoilagePerDay must be <= 1') }
  ctx.state.goods[def.id] = { ...def }
  ctx.events.push({ type: 'goodDefined', good: def.id })
}

function defineRecipe(ctx: Ctx, def: Recipe): void {
  nonempty(def.id, 'recipe.id')
  if (Object.hasOwn(ctx.state.recipes, def.id)) throw new Error(`recipe already defined: ${def.id}`)
  if (def.output !== null) good(ctx, def.output)
  finite(def.yield, 'recipe.yield', 0)
  if (def.output !== null && def.yield <= 0) throw new Error('recipe.yield must be > 0 when the recipe has an output')
  for (const q of def.inputs) { good(ctx, q.good); finite(q.units, `input ${q.good} units`, 0) }
  for (const group of def.inputsAny) {
    if (!group.options.length) throw new Error('inputsAny group needs at least one option')
    for (const id of group.options) good(ctx, id)
    finite(group.units, 'inputsAny units', 0)
  }
  for (const q of def.byproducts) { good(ctx, q.good); finite(q.units, `byproduct ${q.good} units`, 0) }
  finite(def.rates.unitsPerFixtureDay, 'rates.unitsPerFixtureDay', 0)
  finite(def.rates.labourPerUnit, 'rates.labourPerUnit', 0)
  if (def.minLevel !== null) finite(def.minLevel, 'recipe.minLevel', 0)
  ctx.state.recipes[def.id] = structuredClone(def)
  ctx.events.push({ type: 'recipeDefined', recipe: def.id })
}

function openInventory(ctx: Ctx, holder: string, marketId: string): void {
  nonempty(holder, 'holder')
  market(ctx, marketId)
  const id = newId(ctx, 'inv')
  ctx.state.inventories[id] = { id, holder, market: marketId, stock: {} }
  ctx.minted = id
  ctx.events.push({ type: 'inventoryOpened', inventory: id, holder, market: marketId })
}

function openMarket(ctx: Ctx, id: string, mode: MarketMode): void {
  nonempty(id, 'market.id')
  if (Object.hasOwn(ctx.state.markets, id)) throw new Error(`market already open: ${id}`)
  if (mode !== 'settlement' && mode !== 'abstract') throw new Error(`market mode must be settlement or abstract`)
  const inv = newId(ctx, 'inv')
  ctx.state.markets[id] = { id, mode, inventory: inv, goods: {} }
  ctx.state.inventories[inv] = { id: inv, holder: id, market: id, stock: {} }
  ctx.minted = id
  ctx.events.push({ type: 'marketOpened', market: id, mode, inventory: inv })
}

function setMarketGood(ctx: Ctx, cmd: Extract<Command, { type: 'setMarketGood' }>): void {
  const mkt = market(ctx, cmd.market)
  good(ctx, cmd.good)
  const entry = marketGood(mkt, cmd.good)
  for (const key of ['consumptionPerDay', 'targetReserve', 'productionPerDay', 'basePrice', 'perCapitaPerDay'] as const) {
    if (!(key in cmd)) continue
    const value = cmd[key]
    if (value === undefined) continue
    if (value !== null) finite(value, key, 0)
    entry[key] = value
  }
  ctx.events.push({ type: 'marketGoodSet', market: cmd.market, good: cmd.good })
}

function addStock(ctx: Ctx, invId: string, goodId: string, units: number): void {
  const inv = inventory(ctx, invId); good(ctx, goodId); finite(units, 'units', 0)
  adjust(ctx, inv, goodId, units, 'add')
}

function removeStock(ctx: Ctx, invId: string, goodId: string, units: number): void {
  const inv = inventory(ctx, invId); good(ctx, goodId); finite(units, 'units', 0)
  if (units > stockOf(inv, goodId)) throw new Error(`cannot remove ${units} ${goodId} from ${invId}: have ${stockOf(inv, goodId)}`)
  adjust(ctx, inv, goodId, -units, 'remove')
}

function moveStock(ctx: Ctx, fromId: string, toId: string, goodId: string, units: number): void {
  const from = inventory(ctx, fromId); const to = inventory(ctx, toId); good(ctx, goodId); finite(units, 'units', 0)
  if (fromId === toId) throw new Error('moveStock needs two different inventories')
  if (units > stockOf(from, goodId)) throw new Error(`cannot move ${units} ${goodId} from ${fromId}: have ${stockOf(from, goodId)}`)
  adjust(ctx, from, goodId, -units, `move>${toId}`)
  adjust(ctx, to, goodId, units, `move<${fromId}`)
}

/** CONTRACTS.md §4a: units is an integer >= 1, at most floor(available); inputs consumed, output and by-products added,
 *  the day's production recorded on the inventory's market. */
function produce(ctx: Ctx, invId: string, recipeId: string, units: number): void {
  const inv = inventory(ctx, invId)
  const def = recipe(ctx, recipeId)
  integer(units, 'units', 1)
  const can = availableUnits(ctx.state, invId, recipeId)
  if (units > Math.floor(can)) throw new Error(`cannot produce ${units} of ${recipeId} in ${invId}: inputs allow ${Math.floor(can)}`)
  consumeInputs(ctx, inv, def, units)
  let outputUnits = 0
  if (def.output !== null) {
    outputUnits = def.yield * units
    adjust(ctx, inv, def.output, outputUnits, `produce:${recipeId}`)
    marketGood(must(ctx.state.markets, inv.market, 'market'), def.output).producedToday += outputUnits
  }
  for (const q of def.byproducts) {
    if (q.units <= 0) continue
    adjust(ctx, inv, q.good, q.units * units, `byproduct:${recipeId}`)
    marketGood(must(ctx.state.markets, inv.market, 'market'), q.good).producedToday += q.units * units
  }
  ctx.events.push({ type: 'produced', inventory: invId, recipe: recipeId, units, output: def.output, outputUnits })
}

/** CONTRACTS.md §4a: take up to `units`, at most the stock; what was taken is in the result. */
function take(ctx: Ctx, invId: string, goodId: string, units: number): void {
  const inv = inventory(ctx, invId); good(ctx, goodId); finite(units, 'units', 0)
  const taken = Math.min(units, stockOf(inv, goodId))
  if (taken > 0) adjust(ctx, inv, goodId, -taken, 'take')
  ctx.taken = taken
}
