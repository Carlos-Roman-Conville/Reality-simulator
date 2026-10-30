/**
 * Service 5: validation and observability. Every transfer is recorded (source, sink, quantity, the process that did it);
 * every step checks conservation of each tracked quantity against the recorded flows, so an experiment can be read back
 * to see why it failed.
 */
export interface Transfer { t: number; process: string; quantity: string; from: string; to: string; amount: number; note?: string; chemicalChange?: boolean }

export interface Check { t: number; quantity: string; expected: number; actual: number; tolerance: number; ok: boolean }

export class Trace {
  transfers: Transfer[] = [];
  checks: Check[] = [];
  notes: { t: number; text: string }[] = [];
  record(x: Transfer) { this.transfers.push(x); }
  note(t: number, text: string) { this.notes.push({ t, text }); }
  check(t: number, quantity: string, expected: number, actual: number, tolerance: number) {
    const ok = Math.abs(expected - actual) <= tolerance;
    this.checks.push({ t, quantity, expected, actual, tolerance, ok });
    if (!ok) this.note(t, `CONSERVATION FAILED ${quantity}: expected ${expected} got ${actual} (tolerance ${tolerance})`);
    return ok;
  }
  failed() { return this.checks.filter(c => !c.ok); }
  /** Sum of a quantity moved into a component by all processes. */
  into(component: string, quantity: string) { return this.transfers.filter(x => x.to === component && x.quantity === quantity).reduce((a, x) => a + x.amount, 0); }
  outOf(component: string, quantity: string) { return this.transfers.filter(x => x.from === component && x.quantity === quantity).reduce((a, x) => a + x.amount, 0); }
  summary(): string {
    const byProcess = new Map<string, number>();
    for (const x of this.transfers) byProcess.set(`${x.process}:${x.quantity}`, (byProcess.get(`${x.process}:${x.quantity}`) ?? 0) + x.amount);
    const lines = [...byProcess].map(([k, v]) => `${k.padEnd(40)} ${v.toExponential(4)}`);
    return `${this.transfers.length} transfers, ${this.checks.length} checks, ${this.failed().length} failed\n` + lines.join("\n");
  }
}
