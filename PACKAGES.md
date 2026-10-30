# Package boundaries, interfaces and the id scheme (settlement keeper, 2026-10-29; proposed)

Everything here is **proposed** unless marked **(Rex)**. The decisions it builds on are listed in
`DEPENDENCIES.md` s4; the questions it cannot settle are in `QUESTIONS.md`.

## 1. Four packages, one direction of imports

| Package | Home | Holds | Imports |
|---|---|---|---|
| **`@rex/settlement`** (this folder, design only) | `Toolchain/settlement/` | land, districts, parcels; buildings, condition, layouts; titles, leases, the ledger; construction and renovation projects; businesses, posts, schedules, wages; the production constraint; public works; offices and permissions; a reducer and a daily tick | **nothing** from any game or any other engine |
| **`@rex/realism`** (exists) | `Toolchain/realism/` | physics, chemistry, the body, population dynamics, the trace | nothing |
| **`@rex/economy`** (Rex, 2026-10-28: a Toolchain package; not built; PLAN unit 37) | `Toolchain/economy/` | goods, recipes, knowledge, skill bands, stock, demand, prices, transport, organisations | nothing |
| **The pirate adapter** | `Games/RPG's/pirate-ship/web/src/settlement/` + `data/pirate-ship/settlement/` | the bindings `port.*` to engine ids; the 1650 to 1730 rules as data (which trades, which legal forms, wages, customs of inheritance, who may hold office); the characters as persons; factions; alignment and endings; everything "pirate" | all three packages' public APIs, by id |

Test of the boundary (the realism precedent): the settlement engine can simulate a hamlet of three parcels with
none of pirate-ship on disk; the game can be deleted without breaking a settlement test. **No engine imports
another engine.** Where the settlement engine needs a number another engine computes (a recipe's inputs, a
facility's heat, the labour pool), it declares a small **provider interface** and the adapter implements it from
the other engine. That keeps three independently testable packages and puts every cross-engine decision in the
one place Rex can read: the adapter.

Why the settlement engine does not own the economy's recipes: Rex placed goods, recipes and prices in
`Toolchain/economy` (ALIGNMENT s10). The settlement engine's production step asks "how much can this business
make today" and gets its answer from four providers; it never knows what pease or rum are.

Why the settlement engine does not own alignment: alignment is a pirate-game story mechanic
(`web/src/alignment/`), keyed on `port.*` and character slugs. The engine emits events; the adapter decides
whether any of them becomes an alignment command (today: none; `DEPENDENCIES.md` s2 item 3).

## 2. The settlement engine: records

Every record has a stable id (s5), is plain JSON (saves, replay), and carries no game meaning. "Opaque" means
the engine stores and compares the string and never interprets it.

| Record | Fields | Notes |
|---|---|---|
| `Settlement` | `id`, `name`, `map: MapRef`, `districts[]`, `day`, `treasury: AccountId` | one per town; the treasury is an account like any other (`port.cash` binds to it, if Rex says) |
| `District` | `id`, `settlement`, `name`, `kind` (opaque: harbour, square, housing, farmland, edge ...), `bounds` (tile rectangle or polygon) | districts are expandable: a new district appends; bounds may grow |
| `Parcel` | `id`, `district`, `footprint` (tile polygon), `access[]` (road, harbour, path: opaque), `zoning` (opaque), `buildings[]`, `vacant`, `splitFrom`, `mergedInto` | **subdividable**: `split(parcel, line)` mints children and retires the parent (never reused); `merge` likewise. A parcel is land, never renamed |
| `Building` | `id`, `parcel`, `footprint`, `storeys`, `condition` (0 to 1, with named bands as data: ruined / poor / sound / fine, proposed), `layout: Layout`, `fixtures[]` (equipment ids, opaque: `forge`, `brewhouse` ...), `builtOn`, `demolishedOn` | the **physical** axis. `fixtures` is where the 25 `facilities.list` ids live |
| `Layout` | `rooms[]` {`id`, `name`, `tiles[]`, `use` (opaque)}, `placements[]` {`fixture`, `room`, `at`}, `version` | **persistent**: saved with the building; renovation projects write new versions; the scene renders from it |
| `Title` | `id`, `subject` (`parcel.*` or `bldg.*`), `holder` (opaque: a slug, `player`, `town`, `none`), `class` (opaque: private / player / public / vacant, proposed), `encumbrances[]` (lease ids), `since: txn` | the **legal** axis. One holder per title; a parcel title and a building title may differ (ground landlord vs house owner: 1650 to 1730 leasehold practice is the adapter's to source) |
| `Lease` | `id`, `title`, `tenant` (opaque), `scope` (whole / rooms[]), `rent` {amount, per: day}, `start`, `end`, `terms` (opaque data), `status` | many per title |
| `Transaction` | `id`, `day`, `kind` (sale / lease / lease-end / inherit / transfer / seizure / grant / permit / wage / rent / purchase), `from`, `to`, `subject`, `amount`, `authority` (office id or null), `note` | the **ledger**: append-only; every ownership change is one row; wages and rents are rows too so the treasury reconciles |
| `Account` | `id`, `holder`, `balance` | money is conserved across accounts (a `sale` debits one and credits another) |
| `Business` | `id`, `kind` (opaque: butcher, brewery, clinic, church, town-hall ...), `premises[]` {`bldg`, `rooms[]`}, `operator` (opaque), `manager` (opaque or null), `posts[]`, `schedule`, `inventory: InventoryRef`, `account`, `status` (dormant / staffed / producing, derived), `publicWorks: boolean` | the **economic** axis. Operator = who runs it; manager = who directs it day to day; the title holder of the premises is a third party. Several businesses per building, a business across several buildings |
| `Post` | `id`, `biz`, `role` (opaque: an occupation id), `requires` (opaque skill requirement the labour provider evaluates), `wage` {amount, per: day}, `holder` (a person id, a pool id, or null), `hours[]` | staffing scales with the facility: posts are added by the host, never a fixed count per kind |
| `Assignment` | `id`, `person` (opaque), `kind` (**residence / employment / management / membership**), `target` (bldg, post, biz, or an opaque crew id), `since`, `until` | **non-exclusive (Rex)**: a person may hold any number, of any kinds, at once |
| `Project` | `id`, `kind` (construct / renovate / repair / demolish / split / merge / public-work), `target` (parcel or bldg), `plan` (a `Layout` delta, a footprint, or a fixture list), `needs` {materials[], labourDays, permit}, `progress`, `permit` (txn id or null), `status` | construction and renovation; `advance` consumes materials and labour through the providers |
| `Office` | `id`, `settlement`, `name` (opaque: mayor, council, harbour-master ...), `holder` (opaque or null), `powers[]` (opaque: permit, public-title, tax, seize ...), `seat` (bldg id) | authority. **The mayor is an office seated in the town hall building (Rex, via paste)**; how an office is won is the host's (the `sec.townhall` contest stays the story's) |
| `Permission` | `id`, `kind`, `subject`, `grantedBy` (office), `txn`, `expires` | municipal permissions, as ledger-backed records |

Physical and economic development are **separate readings**, never one flag: `physical(bldg) = condition band`,
`economic(biz) = status`. A grand but empty brewery is physically developed and economically dormant.

## 3. The settlement engine: commands, tick, queries, events

The entry point is the realism / alignment pattern: `reduce(state, command, config) -> { state, events }`, pure,
JSON state, failed commands throw without changing state. One daily `tick` command advances everything.

**Commands** (the host issues them; the engine checks only its own invariants):

| Group | Commands |
|---|---|
| land | `addDistrict`, `growDistrict`, `addParcel`, `splitParcel`, `mergeParcels`, `zone` |
| property | `grantTitle` (from `none` or `town`, by an office), `sell` (title, buyer, price, authority?), `transfer` (no price; gift, inheritance, seizure, with `kind`), **`inherit(title, heir)`** (the heir is named by the host; the engine has no law of succession), `lease`, `endLease`, `setRent` |
| building | `startProject`, `advanceProject(days or amount)`, `cancelProject`, `setLayout` (only through a completed renovate project, or freely when `config.freeLayout` is on for the player's own buildings: Rex's call), `addFixture`, `removeFixture`, `setCondition` (decay and repair come through tick and projects; this is the host's override) |
| business | `openBusiness`, `closeBusiness`, `setOperator`, `setManager`, `addPost`, `removePost`, `setSchedule`, `setPublicWorks` |
| people | `assign`, `unassign` (residence / employment / management / membership), `hire(post, person or pool)`, `dismiss(post)` |
| authority | `appoint(office, holder)`, `vacate(office)`, `grantPermission`, `revokePermission` |
| money | `credit`, `debit` (host-side flows such as a quest reward), everything else moves money by itself |
| time | `tick` |

**Tick (one day)**, in a declared order, each step a function in its own module:

1. **Decay**: every building's condition falls by its band's daily rate (data; proposed) unless a repair project
   or maintenance post holds it.
2. **Projects**: each active project draws materials (`MaterialProvider`), labour (`LabourProvider`) and money,
   advances, completes: writes the layout version, fixtures, footprint; mints buildings; retires parcels.
3. **Staffing**: each post resolves its holder for the day (a named person on an employment assignment, or a pool
   draw from `LabourProvider`); a business is `staffed` when its required posts are filled, `dormant` otherwise.
4. **Production**: for each staffed business and each production line it runs (a line is `{recipe (opaque),
   rate}` from the host), `Q = min(Q_equipment, Q_labour, Q_materials, Q_utilities)` (**the brief's first
   approximation**), where
   - `Q_equipment` = the premises' matching fixtures x the fixture's rate (data) x condition factor (data),
   - `Q_labour` = sum over filled posts of hours x `LabourProvider.productivity(holder, role)` (the adapter maps
     skill bands to a factor; the engine takes a number),
   - `Q_materials` = `MaterialProvider.available(inventory, recipe inputs)` in output units,
   - `Q_utilities` = `UtilityProvider.capacity(bldg, recipe)` (1 until realism supplies fuel, water, heat).
   The result is handed to `MaterialProvider.produce`; the business is `producing` when `Q > 0`.
   Refinements the proposal names (cycles, fatigue, breakdowns, scheduling) are later steps, each its own module,
   none assumed here.
5. **Wages and rents**: posts pay their holders (named persons' accounts, or the pool's account that the adapter
   routes to the population model); leases pay rent; every payment is a ledger row.
6. **Public works**: businesses flagged `publicWorks` are paid from the treasury by the same step; an office's
   `tax` power, if the host grants it, runs here as data.
7. **Expiry**: leases and permissions past `end` close; events emitted.

**Queries** (pure functions over state): `holderOf(title)`, `titlesOf(holder)`, `tenantsOf(title)`,
`assignmentsOf(person)`, `whereLives(person)`, `whereWorks(person)`, `businessesIn(bldg)`, `hasFixture(settlement
or bldg, fixtureId, {activeOnly})`, `physical(bldg)`, `economic(biz)`, `production(biz, day)`, `ledger(filter)`,
`mapLayer(settlement)` (districts and parcels as tile masks for the scene).

**Events** (returned from `reduce`, never pushed): `titleChanged`, `leaseChanged`, `operatorChanged`,
`managerChanged`, `businessStatusChanged`, `projectCompleted`, `fixtureChanged`, `wagePaid`, `rentPaid`,
`officeChanged`, `permissionChanged`, `parcelSplit`, `parcelMerged`. The adapter folds them into whatever it
likes; the alignment engine is **not** among the listeners unless Rex names an event that should move a story
flag (`QUESTIONS.md` Q3, Q4).

## 4. Provider interfaces (the adapter implements; the engine declares)

```ts
interface LabourProvider {           // the population model, or named characters
  draw(role, requires, hours, day): PoolDraw | null      // unnamed workers from a district pool
  productivity(holder, role): number                     // 0..n; the adapter maps skill bands to this
}
interface MaterialProvider {         // @rex/economy, or a JSON inventory stub until it exists
  available(inventory, recipe): number                   // output units the inputs on hand allow
  consume(inventory, recipe, units): void
  produce(inventory, recipe, units): void
}
interface UtilityProvider {          // @rex/realism later; a constant 1 first
  capacity(building, recipe): number
}
interface PriceProvider {            // @rex/economy; the stub returns the data file's number
  valueOf(subject: title | bldg | parcel, day): number   // for sales the host does not price itself
}
```

Nothing in `@rex/settlement` imports the packages behind these; tests use in-memory stubs.

## 5. The id scheme

| Prefix | Minted by | Example | Never |
|---|---|---|---|
| `stl.<slug>` | host | `stl.port` | renamed |
| `dist.<n>` | engine | `dist.0003` | reused |
| `parcel.<n>` | engine | `parcel.0041` | renamed; split children are new ids, the parent keeps its id, retired |
| `bldg.<n>` | engine | `bldg.0012` | reused after demolition |
| `title.<n>` | engine | `title.0012` | moved between subjects |
| `lease.<n>`, `txn.<n>`, `acct.<n>`, `biz.<n>`, `post.<n>`, `asg.<n>`, `proj.<n>`, `office.<n>`, `perm.<n>` | engine | | |
| person ids | **host** | `intp-m`, `player`, `town`, `pool.dist.0003` | minted by the engine: it never invents people |
| fixture ids | **host** | `forge`, `brewhouse` (today's 25 from `recipes.json`) | interpreted by the engine |
| role ids | **host** | `cooper`, `planter` (today's 43 occupations) | interpreted |
| recipe ids | **host** | `farming-pease` | interpreted |

`<n>` is a zero-padded counter per settlement, allocated by the reducer so replays mint the same ids. Ids are
strings everywhere; nothing is positional.

**`port.*` and `sec.*` stay story and institution references (Rex).** They never appear inside engine state. The
join is one adapter file:

```json
// data/pirate-ship/settlement/bindings.json  (shape proposed)
{
  "port.bakery":    { "parcels": ["parcel.0007"], "buildings": ["bldg.0007"], "businesses": ["biz.0003"] },
  "port.townhall":  { "parcels": ["parcel.0011"], "buildings": ["bldg.0011"], "businesses": ["biz.0009"], "offices": ["office.0001"] },
  "port.farm":      { "parcels": ["parcel.0020", "parcel.0021"], "buildings": ["bldg.0020"], "businesses": ["biz.0010"] }
}
```

A place may bind to several parcels, buildings and businesses; a parcel may bind to no place (vacant land,
ordinary housing); the art keeper keeps keying on `port.*`; the alignment engine keeps keying on `port.*` and
slugs; the scene asks the adapter `placeAt(tile)` and `tilesOf('port.bakery')`.

## 6. What the pirate adapter owns (and the engine never sees)

- **Historical rules as data** (`data/pirate-ship/settlement/rules.json`, every row sourced or marked proposed):
  which legal forms exist (freehold, lease, mortgage?), customs of inheritance (the farm to the daughter, the
  butcher shop to the son: Rex's precedents, as explicit `inherit` commands the story issues, not a law), who
  may hold which office, what a mayor may do, wage levels per trade, rent levels, construction costs per
  fixture. The engine runs on whatever numbers this file gives; every number starts **proposed**.
- **Locales**: the bindings above; the starting state of every `port.*` place (title holder, business operator,
  posts, condition), from TOWNS.md, every value **proposed** until Rex says who owns what (`QUESTIONS.md` Q6).
- **Factions, characters, alignment, endings**: untouched modules; the adapter may translate engine events into
  story events only where Rex names one.
- **The 25 facility ids**: the adapter derives the economy's "a settlement has or lacks each" from
  `hasFixture(settlement, id, {activeOnly})` so `recipes.json` and `GOODS.md` s3h do not change.
- **The population model**: `LabourProvider.draw` reads POPULATION.md's `labour` and `occupations` pool per
  district; wages paid to pool ids flow back as household income. The fence holds: the engine names no one.
- **Ghosts, death, transformation**: not represented. A dead holder is a string the host replaces by `inherit`
  or `transfer`; a ghost running a shop is an operator string. Whatever Rex decides there changes no record.

## 7. What is deliberately not in the engine

- No alignment, no story forms, no `developed` flag: the host keeps those.
- No law of inheritance, no election, no tax rate, no wage table: all host data or host commands.
- No pathfinding or rendering: the engine gives tile masks; the scene draws them.
- No prices or recipes: providers.
- No fixed district or parcel count: the map is derived (`MIGRATION.md` step 3) and grows by command.
