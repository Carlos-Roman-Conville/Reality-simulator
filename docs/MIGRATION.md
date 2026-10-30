# Migration: from three local repos to this monorepo (2026-10-30)

**State:** this repository is the canonical GitHub destination for the platform. Development still happens in the
three local repositories it was imported from (`Toolchain/realism`, `Toolchain/settlement`, `Toolchain/economy`
on Rex's machine), because the keeper sessions, the conveyor-belt lanes (`realism`, `settlement`, `economy`) and
the pirate game's `file:` dependencies all point there. Nothing in that workflow was changed by this import.

**How it was built:** `git subtree add --prefix packages/<name> <local repo> master`, so every commit of each
engine is in this history under its package path.

**Syncing until the workflow moves:** the controller pulls each package's new commits with
`git subtree pull --prefix packages/<name> <local repo> master` and pushes; `docs/PLATFORM.md` and
`docs/ENGINES.md` are copied from the Toolchain root (their working copies) at the same time. Commits flow one way,
local → here, until the cut-over.

**Cut-over (not scheduled; needs Rex's go):**
1. Point the belt's `lanes.py` `REPO_DIRS` at `Reality-simulator/packages/<name>` and `repos.txt` likewise; reinstall hooks.
2. Point the keeper sessions' briefs at the new paths.
3. Change the pirate game's `web/package.json` `file:` dependencies to the new paths (or to pinned git
   dependencies once a publishing method is chosen).
4. Make `docs/` here the only copy of the platform docs; remove the Toolchain root copies.
5. Retire the three local repos (keep them read-only for a while).

**Open:** a reproducible install for the pirate game that doesn't depend on a sibling checkout path (npm cannot
install a package from a subdirectory of a git URL; options: publish the packages, use pnpm/yarn `#path:`, or
keep the documented sibling-clone layout).
