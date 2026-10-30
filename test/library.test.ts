import { describe, expect, it } from "vitest";
import anatomy from "../data/library/anatomy.json" with { type: "json" };
import atmosphere from "../data/library/atmosphere.json" with { type: "json" };
import chemistry from "../data/library/chemistry.json" with { type: "json" };
import circulation from "../data/library/circulation.json" with { type: "json" };
import ecology from "../data/library/ecology.json" with { type: "json" };
import environment from "../data/library/environment.json" with { type: "json" };
import equipment from "../data/library/equipment.json" with { type: "json" };
import gasdynamics from "../data/library/gasdynamics.json" with { type: "json" };
import medicine from "../data/library/medicine.json" with { type: "json" };
import muscular from "../data/library/muscular.json" with { type: "json" };
import neurology from "../data/library/neurology.json" with { type: "json" };
import nutrition from "../data/library/nutrition.json" with { type: "json" };
import physiology from "../data/library/physiology.json" with { type: "json" };
import population from "../data/library/population.json" with { type: "json" };
import science from "../data/library/science.json" with { type: "json" };
import sources from "../data/library/sources.json" with { type: "json" };

type Table = { columns: string[]; rows: unknown[][] };
type Doc = Record<string, Table | string>;
const LIBRARY: Record<string, Doc> = { anatomy, atmosphere, chemistry, circulation, ecology, environment, equipment, gasdynamics, medicine, muscular, neurology, nutrition, physiology, population, science, sources } as unknown as Record<string, Doc>;
const tables = (doc: Doc) => Object.entries(doc).filter((e): e is [string, Table] => !e[0].startsWith("_") && typeof e[1] === "object");

describe("the scientific data library", () => {
  const files = Object.keys(LIBRARY);
  const keys = new Set(tables(LIBRARY.sources!)[0]![1].rows.map((r) => r[0]));

  it("has a file per domain beside sources.json", () => {
    expect(files).toContain("sources");
    expect(files.length).toBeGreaterThanOrEqual(10);
  });

  it("gives every row of every table a unique id and a source that is open or a known key", () => {
    const ids = new Set<unknown>();
    for (const f of files.filter((f) => f !== "sources")) {
      for (const [name, t] of tables(LIBRARY[f]!)) {
        const id = t.columns.indexOf("id");
        const src = t.columns.indexOf("source");
        expect(id, `${f}.${name} id column`).toBeGreaterThanOrEqual(0);
        expect(src, `${f}.${name} source column`).toBeGreaterThanOrEqual(0);
        for (const r of t.rows) {
          expect(r.length, `${f}.${name} ${String(r[id])}`).toBe(t.columns.length);
          expect(ids.has(r[id]), `duplicate id ${String(r[id])}`).toBe(false);
          ids.add(r[id]);
          if (r[src] !== "open") for (const k of String(r[src]).split("; ")) expect(keys.has(k), `${r[id]} cites ${k}`).toBe(true);
        }
      }
    }
  });
});
