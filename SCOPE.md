# settlement

## What this is

The settlement engine: a reusable backend for simulated towns (land, property, buildings, businesses, workforce,
production, authority). Design only as of 2026-10-29; the pirate game's town is its first client.

## What's under it

| Folder | What | State |
|---|---|---|
| [src/](src/), [test/](test/), [examples/](examples/) | The engine (step 1 built 2026-10-29: records, ledger, assignments, projects, businesses, tick), its tests and the hamlet. | active |
| (design docs) | README, dependency map, package boundaries, migration plan, test specs, Rex's questions. | active |

## Read first

- [README.md](README.md): what it is and the reading order.
- [QUESTIONS.md](QUESTIONS.md): what is waiting on Rex before any code.

## Skim

- [PACKAGES.md](PACKAGES.md) when wiring a game to it; [MIGRATION.md](MIGRATION.md) for the pirate town.

## Ignore

- `node_modules/`.

## Rules that apply here

Inherited from [HQ/PRINCIPLES.md](../../HQ/PRINCIPLES.md) and [Toolchain/SCOPE.md](../SCOPE.md), plus:

- The engine imports nothing from any game or other engine; cross-engine needs are provider interfaces.
- No game rule is invented here: every number is proposed until Rex sets it; `port.*` and `sec.*` ids are the
  pirate game's and never appear in engine state.
- Design docs change only with Rex's decisions recorded by mark; code starts only after he approves `MIGRATION.md`.

## Current state

- 2026-10-29: folder created with the design set; Rex approved the architecture and step 1 (agreeing with
  ChatGPT's review) and answered Q2; Q1 and Q6 answered in part. Step 1 built: `npm test` 16 green, typecheck
  clean. Next: step 2 (the pirate adapter shell and the T0 guard) once Rex sets the starting titles (Q6).
