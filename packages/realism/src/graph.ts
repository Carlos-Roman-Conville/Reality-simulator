/**
 * Service 2: the connection graph. Typed edges between component ports; a process moves a quantity along an edge only
 * if the edge's kind permits it. An edge carries the physics of the connection (a pipe's resistance, a wall's U A).
 */
import type { PortKind } from "./registry.ts";

export interface Edge {
  id: string;
  kind: PortKind;
  from: string;   // component id
  fromPort: string;
  to: string;
  toPort: string;
  props: Record<string, number>; // heat: UA (W/K); gas, fluid: conductance (kg/s per Pa), capacity (kg/s)
}

export class Graph {
  edges: Edge[] = [];
  connect(e: Edge) { this.edges.push(e); return e; }
  from(component: string, kind?: PortKind) { return this.edges.filter(e => e.from === component && (!kind || e.kind === kind)); }
  to(component: string, kind?: PortKind) { return this.edges.filter(e => e.to === component && (!kind || e.kind === kind)); }
  between(a: string, b: string, kind?: PortKind) { return this.edges.filter(e => ((e.from === a && e.to === b) || (e.from === b && e.to === a)) && (!kind || e.kind === kind)); }
}
