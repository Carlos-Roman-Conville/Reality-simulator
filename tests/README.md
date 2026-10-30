# Cross-package tests

Each package keeps its own unit tests in `packages/<name>/test/`. This folder is for tests that cross packages:
the Settlement ↔ Economy contract (`CONTRACTS.md`, identical in both packages), the thirty-day settlement
benchmark once it runs here rather than in the pirate adapter, and the historical-reconstruction benchmark of
`docs/PLATFORM.md` §5 when it exists. Nothing here yet.
