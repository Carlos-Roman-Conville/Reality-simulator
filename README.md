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
room with brick walls and a box of air. From the formulas in `src/physics.ts` (Antoine, latent heat, specific heats, heats of
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
    src/reactions.ts   data-driven vessel reactions, limiting reagents, reaction heat and gas release
    src/elements.ts    chemical formula parser and atomic masses for the element ledger
    data/reactions.json four sourced reaction records with stoichiometry, conditions and rate models
    src/scheduler.ts   fast and slow steps in a declared order
    src/world.ts       the world, the conserved ledger and the per-step check
    src/trace.ts       transfers, checks, notes, summary
    src/lab/still.ts   the scenario
    test/              vitest

The vessel now evaporates below boiling from its free surface: ASHRAE's still-air pool form
`m_dot = (0.089 * 0.5 / L) A (p_sat - p_partial)`. The trace records water entering the room,
latent cooling and carried sensible enthalpy. Its free surface is inferred from the unchanged exterior
area by assuming a cylinder whose height equals its diameter (exterior bottom + sides = five free surfaces).

Four brick walls surround an assumed cubic room of the unchanged volume. They store heat at
1920 kg/m3 and 790 J/(kg K), with 228 mm thickness and a tabulated assembly U of 2.11 W/(m2 K).
Air exchanges heat with them through h A dT. The outside branch removes the indoor film resistance
from the table's U to avoid counting that film twice. Both directions and wall storage appear in the trace.
The two-hour temperature regression uses an analytical upper envelope from heat input, wall capacity,
and indoor conductance (below 36 C for the default case); this is a derived bound, not a measured-room claim.

The counterflow condenser uses effectiveness-NTU with the correct isothermal-condensation limit,
`Cr = 0`, `epsilon = 1 - exp(-UA/Ccold)`, `Ccold = m_dot_coolant cp`. Its U comes from the
Churchill-Chu water-side natural-convection correlation, varying with temperature difference.
New explicit condenser assumptions are a 90 mm tube diameter (F-Chart example) and 1 kg/min
coolant recirculation (~1 L/min, Euro 30 operating range). The same tub supplies and receives that
water, so it still warms; this assumes circulation, not an external supply of cold water.
Condensate leaves saturated and mixes thermally with the collector; there is no subcooling section.

Remaining named simplifications: lumped temperatures (including wall mass and body), explicit one-second
steps, instantaneous vapour transport, cubic room geometry without roof/floor heat exchange, walls: four sides only, no roof or floor, negligible
plaster thermal mass, pool-correlation extrapolation toward boiling, fixed water transport properties
at 40 C, negligible copper/condensate-film thermal resistance and forced-convection enhancement,
and the existing h, combustion oxygen threshold, body, wear and control approximations.
These are models, not game rules. The five services remain unchanged in shape. Plain TypeScript,
no DOM, so it runs in Node and in a browser alike. Per-step conservation checks remain for water and
charcoal; energy is verified by focused balance tests, not a new whole-world energy ledger.

`reactionProcess(vessel, reactions = defaultReactions)` runs the reaction records in order. Reagents and an
optional catalyst must be in the vessel; gas products follow its first outgoing gas edge (connect that edge to
the room for an open vessel), or remain inside if there is no edge. Reaction enthalpy and gas sensible enthalpy
are separate traced transfers. Calcination absorbs 178 kJ/mol and slaking releases 65 kJ/mol, rounded from the
formation enthalpies recorded in the data. Endothermic conversion stops when available sensible heat reaches
the record's minimum temperature and can resume after reheating.

Call `world.conserveElements()` after assembling the world and before running the scheduler to check element
mass every step. An optional component list tracks a smaller boundary, provided it includes every participant
in any reaction crossing that boundary. Chemical conversion traces do not count as external element supplies;
actual gas transport and other boundary transfers do. The ledger uses formula atom counts (including parentheses),
registered molar masses and CIAAW atomic weights. It covers contents; equipment shells remain inert. New hydrogen
and lime molar masses follow the existing rounded H/C/O masses, keeping total mass additive in the seeded reactions.

Reaction simplifications: irreversible, perfectly mixed reactions; constant heat capacities and standard reaction
enthalpies referenced to 25 C; threshold ignition; no pressure-dependent equilibrium, dissolution, or automatic
phase-change coupling; instantaneous gas transport. All four seed records explicitly use the requested **[model]
complete-within-step** fallback because their cited thermochemical sources do not provide applicable bulk kinetic
parameters. Records with sourced first-order Arrhenius parameters use `k = k0 exp(-Ea/RT)` and consume the fraction
`1-exp(-k dt)` of the limiting reagent at the step's initial temperature. No measured kinetic parameters are invented.
The existing still heater retains its oxygen-starvation and charcoal heating-value model; the new carbon record
represents complete combustion of standard-state carbon and therefore uses its standard formation enthalpy.

## Sources

The original formulas retain their ENG-* source keys from the pirate engine design. Sources added here:

- [ASHRAE HVAC Applications, chapter 6](https://handbook.ashrae.org/Handbooks/A23/SI/A23_Ch06/a23_ch06_si.aspx): equation 2, still-air coefficient 0.089 and table 1 unoccupied factor 0.5; latent evaporation load.
- [LBNL Buildings material library](https://simulationresearch.lbl.gov/modelica/releases/v1.1_build0_rc2/help/Buildings_HeatTransfer_Data_Solids.html): brick density and specific heat.
- [CIBSE Domestic Heating Design Guide, table 6.1 via MCS](https://mcscertified.com/wp-content/uploads/2020/04/Guidance-on-U-Values-from-Domestic-Heating-Design-Guide.pdf): 228 mm solid brick with dense plaster, U=2.11.
- [F-Chart effectiveness-NTU](https://fchartsoftware.com/ees/heat_transfer_library/heat_exchangers/hs1000.htm): counterflow capacity rates, NTU and phase-change limit.
- [F-Chart Churchill-Chu correlation](https://www.fchartsoftware.com/ees/heat_transfer_library/free_convection/hs3045.htm) and [NREL SAM technical manual](https://nrel.gov/docs/fy11osti/51825.pdf): horizontal-cylinder Nusselt correlation.
- [F-Chart water-cylinder example](https://fchart.com/ees/heat_transfer_library/free_convection/hs3040.htm): 90 mm diameter and gravitational acceleration.
- [University of Washington water properties](https://staff.washington.edu/calebktw/water_properties.html): liquid transport properties used at 40 C.
- [Spirits Unlimited Euro 30 instructions](https://www.spiritsunlimited.co.nz/upload/euro30_instructions.pdf): 0.5-1 L/min cooling-water operating range; here recirculated from the tub.
- [NIST Chemistry WebBook](https://webbook.nist.gov/chemistry/): molar mass, c_p, melting and boiling points per substance row in `data/substances.json` (each row links its own entry).
- [Engineering ToolBox specific heat](https://www.engineeringtoolbox.com/specific-heat-metals-d_152.html) (also [solids](https://www.engineeringtoolbox.com/specific-heat-solids-d_154.html), [air](https://www.engineeringtoolbox.com/air-specific-heat-capacity-d_705.html)) and the [IT'IS tissue database](https://itis.swiss/virtual-population/tissue-properties/database/heat-capacity/): material c_p in `data/materials.json`.
- [IUPAC CIAAW atomic weights](https://ciaaw.org/atomic-weights.htm): the formula check in `test/registry.test.ts`.
- [IUPAC Arrhenius equation](https://goldbook.iupac.org/terms/view/A00446): rate coefficient; integration assumes first-order limiting-reagent decay at fixed step temperature.
- [NBS thermodynamic tables, Wagman et al. (1982)](https://srd.nist.gov/JPCRD/jpcrdS2Vol11.pdf): calcite formation enthalpy and heat capacity, standard-state reference and Hess's law data. [NIST CaO](https://webbook.nist.gov/cgi/cbook.cgi?ID=C1305788&Mask=2), [Ca(OH)2](https://webbook.nist.gov/cgi/cbook.cgi?ID=C1305620&Mask=2), [CO2](https://webbook.nist.gov/cgi/cbook.cgi?ID=C124389&Mask=1), [liquid water](https://webbook.nist.gov/cgi/cbook.cgi?ID=C7732185&Mask=2), [steam](https://webbook.nist.gov/cgi/cbook.cgi?ID=C7732185&Mask=1), and [hydrogen](https://webbook.nist.gov/cgi/cbook.cgi?ID=C1333740&Mask=1): formation enthalpies and heat capacities used in the reaction records and added substances.
- [NOAA calcium carbonate](https://cameochemicals.noaa.gov/report?key=CH25005): 825 C decomposition threshold. [National Research Council laboratory chemical safety summaries](https://www.ncbi.nlm.nih.gov/sites/books/NBK55861/bin/10-LaboratoryChemicalSafetySummaries.pdf): hydrogen autoignition range, whose lower end supplies the modeled 500 C threshold. Carbon's modeled 400 C threshold retains the pirate reaction table's condition.

Substances and materials live in `data/substances.json` and `data/materials.json` (loaded by `defaultRegistry()`); a null
field means no standard value was found. The pirate table's `smoke` row (soot and tars, not one substance) and its
tagged-substance template are not carried over.

## Next (the belt)

Wire the equipment catalogue and further substance records (`body/data/*.json`) into the registry; expand reaction
coverage and measured kinetics; the grid transport; the body as organ components on the graph; the dashboard's
Simulation Laboratory driving this package; the pirate game importing it.
