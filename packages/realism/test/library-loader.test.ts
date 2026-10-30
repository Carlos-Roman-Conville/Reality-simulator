import { describe, expect, it } from "vitest";
import { libraryColumns, libraryFiles, libraryMeta, libraryRow, libraryTable, libraryTables } from "../src/library.ts";

describe("the library loader", () => {
  it("loads every table of every file, each row with an id and a source", () => {
    const files = libraryFiles();
    expect(files).toContain("physiology");
    expect(files).toContain("sources");
    let tables = 0, rows = 0;
    for (const f of files) {
      for (const t of libraryTables(f)) {
        tables++;
        const cols = libraryColumns(f, t);
        const data = libraryTable(f, t);
        expect(data.length, `${f}.${t} has rows`).toBeGreaterThan(0);
        expect(libraryMeta(f, t).title.length).toBeGreaterThan(0);
        if (f === "sources") { expect(cols[0]).toBe("Key"); continue; }
        expect(cols[0], `${f}.${t} first column`).toBe("id");
        expect(cols[cols.length - 1], `${f}.${t} last column`).toBe("source");
        for (const r of data) {
          rows++;
          expect(typeof r.id, `${f}.${t} id`).toBe("string");
          expect(typeof r.source, `${f}.${t} ${String(r.id)} source`).toBe("string");
          expect(Object.keys(r)).toEqual(cols);
        }
      }
    }
    expect(tables).toBeGreaterThan(50);
    expect(rows).toBeGreaterThan(1000);
  });

  it("keys rows by column name, caches, and finds a row by id", () => {
    const met = libraryTable("physiology", "met");
    expect(libraryTable("physiology", "met")).toBe(met);
    expect(libraryRow("physiology", "met", "physiology.met.sleeping").MET).toBe(0.95);
    expect(() => libraryRow("physiology", "met", "nope")).toThrow();
    expect(() => libraryTable("physiology", "nope")).toThrow();
    expect(() => libraryTable("nope", "met")).toThrow();
    expect(() => libraryTable("physiology", "_about")).toThrow();
  });
});
