# settlement

## What this is

The settlement engine: a reusable backend for simulated towns (land, property, buildings, businesses, workforce,
production, authority). Design only as of 2026-10-29; the pirate game's town is its first client.

## What's under it

| Folder | What | State |
|---|---|---|
| (this folder) | README, dependency map, package boundaries, migration plan, test specs, Rex's questions. | idea (design only) |

## Read first

- [README.md](README.md): what it is and the reading order.
- [QUESTIONS.md](QUESTIONS.md): what is waiting on Rex before any code.

## Skim

- [PACKAGES.md](PACKAGES.md) when wiring a game to it; [MIGRATION.md](MIGRATION.md) for the pirate town.

## Ignore

- None yet (no `node_modules`, no generated output).

## Rules that apply here

Inherited from [HQ/PRINCIPLES.md](../../HQ/PRINCIPLES.md) and [Toolchain/SCOPE.md](../SCOPE.md), plus:

- The engine imports nothing from any game or other engine; cross-engine needs are provider interfaces.
- No game rule is invented here: every number is proposed until Rex sets it; `port.*` and `sec.*` ids are the
  pirate game's and never appear in engine state.
- Design docs change only with Rex's decisions recorded by mark; code starts only after he approves `MIGRATION.md`.

## Current state

- 2026-10-29: folder created with the design set. Waiting on Rex: approve the plan; Q1, Q2, Q6 before steps 3,
  6 and 4. Next: step 1 (the package skeleton) on the belt once approved.
