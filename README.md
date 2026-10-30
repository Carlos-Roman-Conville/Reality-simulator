# @rex/realism: the realism engine (first operational build, 2026-10-29)

The shared simulation engine the games build on: a **registry** of substances, materials and components; a typed
**connection graph**; a **conservation and process engine** that moves mass and energy by real formulas and records
every transfer; a **scheduler** with fast and slow steps; and a **trace** that checks conservation every step so an
experiment can be read back. Design: `Games/RPG's/pirate-ship/files/pirate-ship/science/ENGINE.md` (Rex's rules:
build it; real formulas with real numbers; no made-up rules to make things work).

## Run

    npm install --offline      # vitest and typescript from the cache
    npm test                   # the still-in-a-room scenario and the physics checks
    npm run lab -- 0 60        # altitude 0 m, skill 60: prints the result and the trace summary
    npm run lab -- 2256 100    # the Blue Mountain peak: boils at 92.5 C

## What the first build proves

A character, a charcoal heater, a copper vessel of water, a worm condenser in a tub, pipes and a collector, in a
room that is a box of air. From the formulas in `src/physics.ts` (Antoine, latent heat, specific heats, heats of
combustion, stoichiometry, convection, the ideal gas, the box model) and nothing else: boiling at the pressure's
boiling point (100 C at sea level, 92.5 at 2,256 m), distillate at the net heat over the latent heat, the room's
oxygen falling and CO2 rising from the fire (CO when starved), the distiller sweating by PHYSIOLOGY.md's rate, a
drifted thermometer misreporting while the physics runs on the true temperature, a novice wasting fuel, wear on the
vessel, and water and charcoal conserved every step with the trace saying where every gram and joule went.

## Shape

    src/physics.ts     the formulas and constants, each with its source key (ENG-*)
    src/registry.ts    substances (properties only), materials, components with ports, the default set
    src/graph.ts       typed edges
    src/process.ts     combustion, losses, boiling, condensation, the room box, the body, the thermometer, wear, control
    src/scheduler.ts   fast and slow steps in a declared order
    src/world.ts       the world, the conserved ledger and the per-step check
    src/trace.ts       transfers, checks, notes, summary
    src/lab/still.ts   the scenario
    test/              vitest

Simplifications are named in the doc comments (lumped temperatures, explicit steps, no evaporation below boiling,
instantaneous vapour transport, a room with no walls to soak up heat, so it runs hot: 60 C after two hours of an
open charcoal fire with the door open). None is a game rule; each can be replaced by fuller physics without changing the
services. Plain TypeScript, no DOM, so it runs in Node and in a browser alike.

## Next (the belt)

Wire the equipment catalogue and the substance database (`body/data/*.json`) into the registry; the reaction solver
over the reaction records; the grid transport; the body as organ components on the graph; the dashboard's
Simulation Laboratory driving this package; the pirate game importing it.
