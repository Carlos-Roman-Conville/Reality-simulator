# @rex/settlement: the settlement engine (design only, 2026-10-29)

A reusable backend for a simulated settlement: land and parcels, buildings with persistent layouts, property
titles, leases and a ledger, construction and renovation, businesses, workforce and wages, production as a
constraint, public works, offices and permissions. A game supplies its history, locales, people, factions and
story through an adapter; the engine never imports a game. Modelled on `../realism` (Rex: a reusable backend
like Toolchain/realism, not an extension of the pirate town's slot system).

**Status: design and plan only. No code. Nothing in any game changed.** Implementation waits on Rex approving
`MIGRATION.md` and answering the questions it names.

## Read in this order

1. [DEPENDENCIES.md](DEPENDENCIES.md): what the pirate game's town, alignment, economy and map code and data are
   today, how they depend on each other, and the fixed points the engine must not move.
2. [PACKAGES.md](PACKAGES.md): the four packages (settlement, realism, economy, the pirate adapter), the
   records, commands, tick, queries, events, the provider interfaces and the id scheme.
3. [MIGRATION.md](MIGRATION.md): twelve steps that keep the slot model and `port.align` working at every step,
   with the map-derivation worked example.
4. [TESTS.md](TESTS.md): package and adapter test specs, ending in the acceptance test A1.
5. [QUESTIONS.md](QUESTIONS.md): what only Rex can answer, and what is assumed meanwhile.

## Marks

**(Rex)** his decision; **(Rex, via paste)** a ChatGPT resolution he pasted without comment on 2026-10-29, held
as his until he corrects it; **(proposed)** this keeper's or ChatGPT's starting point; **(open)** nothing decided.
Every number in these files is proposed.

## The decisions these files honour (Rex, 2026-10-29)

Ownership is not control: property ownership, business operation and management are separate; one legal owner,
many tenants. Physical development and economic activity are tracked independently. Residence, employment,
management and crew membership are separate, non-exclusive assignments. The mayor is an office inside the
existing town hall; the `sec.townhall` contest stays. One continuous, expandable town map with districts and
subdividable parcels; no fixed counts; dimensions derived from the existing locales, housing, roads, harbour and
undeveloped land. A brewery is an optional constructible facility. An institution's alignment never changes
because its owner or manager changes; the story-driven transformation system stays. `port.*` and `sec.*` remain
story and institution references; parcels, buildings, businesses and titles get their own ids. Property and
economy stay independent of the ghost and death question.

## Planned shape (when built)

    package.json        @rex/settlement, TypeScript, vitest, no dependencies (as realism)
    src/ids.ts          prefixes, counters, retirement
    src/state.ts        the records, JSON-safe, versioned
    src/reduce.ts       the command union, one entry point
    src/tick/           decay, projects, staffing, production, wages, public works, expiry
    src/queries.ts      holderOf, assignmentsOf, hasFixture, physical, economic, production, mapLayer
    src/providers.ts    LabourProvider, MaterialProvider, UtilityProvider, PriceProvider + stubs
    scripts/derive_map.py   requirements -> dimensions, districts, first parcels (no typed counts)
    examples/           a hamlet with no game data: the reuse proof
    test/               one test per rule (TESTS.md U1 to U12)
