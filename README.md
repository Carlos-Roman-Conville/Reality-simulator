# Reality-simulator

A universal reality, life and civilisation simulation platform. It simulates Earth-like physics, organisms, human
behaviour, societies, civilisations, technology and history through interconnected causal and mathematical
mechanisms, with no game, graphics, narrative or player required. A game is an interface and a set of objectives
layered over the simulated reality; the first is [Pirate-game](https://github.com/Carlos-Roman-Conville/Pirate-game).

Read `docs/PLATFORM.md` first (the mission and the directive), then `docs/ENGINES.md` (the engines, their owners
and boundaries). The mechanism registry (`docs/REGISTRY.md`) and the roadmap (`docs/ROADMAP.md`) follow once the
audit is done.

## Packages

| Package | What | Tests |
|---|---|---|
| `packages/realism` | Reality & Species: thermodynamics, gases, chemistry, the body (anatomy, circulation, neurology, muscle, nutrition, medicine), environment, ecology, population | `npm test -w packages/realism` |
| `packages/settlement` | land, property titles, leases, buildings, businesses, posts, workforce assignments, offices, the daily tick | `npm test -w packages/settlement` |
| `packages/economy` | production, consumption, spoilage, prices, trade, shipments, accounting, labour quotes; the three-port sim | `npm test -w packages/economy` |

Each package is independent: it imports nothing from another package or from any game. Packages talk through
documented provider interfaces (`packages/settlement/CONTRACTS.md` = `packages/economy/CONTRACTS.md`).

## Install and test

    npm install
    npm test

Node 20+. Each package is TypeScript with vitest.

## Rules

- One authoritative owner per mechanism; search `docs/REGISTRY.md` before adding one.
- Historical or real-world data fills a value first; every value is labelled researched, estimate or fiction.
- Nothing is a fixed property that a mechanism could produce.
- The catalogue tags things by period and provenance; it never unlocks anything because a date arrived.

## History and the working copies

The three packages were imported from separate repositories with their full history (`git subtree`); see
`docs/MIGRATION.md` for how this repository relates to the local working copies while the agent workflow moves
over.
