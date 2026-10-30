/** The world: a registry, a graph, a trace, the clock, and the conservation ledger the trace checks each step. */
import { Registry } from "./registry.ts";
import { Graph } from "./graph.ts";
import { Trace } from "./trace.ts";

export class World {
  t = 0; // seconds
  registry: Registry;
  graph = new Graph();
  trace = new Trace();
  /** Quantities whose total across named components must stay constant (plus recorded flows out of the system). */
  conserved: { quantity: string; substance?: string; components: string[]; initial: number; tolerance: number; entered: number; left: number }[] = [];
  private cursor = 0; // the first transfer not yet folded into the conserved tallies
  env: Record<string, number> = {};
  constructor(registry: Registry) { this.registry = registry; }

  /** Total mass of a substance (all phases) across components. */
  massOf(substance: string, components: string[]): number {
    let m = 0;
    for (const id of components) for (const x of this.registry.component(id).contents) if (x.substance === substance) m += x.mass;
    return m;
  }
  conserve(substance: string, components: string[], tolerance = 1e-6) {
    this.conserved.push({ quantity: `mass:${substance}`, substance, components, initial: this.massOf(substance, components), tolerance, entered: 0, left: 0 });
  }
  /** The conservation check: current total + what the trace says left the set of components = initial + what entered. */
  afterStep() {
    const ts = this.trace.transfers;
    for (; this.cursor < ts.length; this.cursor++) {
      const x = ts[this.cursor];
      for (const c of this.conserved) {
        if (x.quantity !== c.quantity) continue;
        const f = c.components.includes(x.from), g = c.components.includes(x.to);
        if (f && !g) c.left += x.amount; else if (!f && g) c.entered += x.amount;
      }
    }
    for (const c of this.conserved) this.trace.check(this.t, c.quantity, c.initial + c.entered - c.left, this.massOf(c.substance!, c.components), c.tolerance);
  }
}
