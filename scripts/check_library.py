#!/usr/bin/env python3
"""Check data/library/*.json (MIGRATION.md, phase 2). Exits 0 when:
  - every library file parses and every table has columns and rows of matching width;
  - every table has `id` and `source` columns, and no two rows share an id (across all files);
  - every `source` value is `open` or '; '-separated keys present in data/library/sources.json;
  - sources.json holds unique keys of Kind science or reference only.
"""
import json
import sys
from pathlib import Path

LIB = Path(sys.argv[1]) if len(sys.argv) > 1 else Path(__file__).resolve().parent.parent / "data" / "library"
KINDS = ("science", "reference")


def tables(doc):
    return {k: v for k, v in doc.items() if not k.startswith("_") and isinstance(v, dict)}


def main():
    problems = []
    files = sorted(LIB.glob("*.json"))
    if not (LIB / "sources.json").exists():
        problems.append("sources.json is missing")
    docs = {}
    for p in files:
        try:
            docs[p.stem] = json.loads(p.read_text(encoding="utf-8"))
        except ValueError as e:
            problems.append(f"{p.name}: does not parse ({e})")
    keys = set()
    if "sources" in docs:
        t = docs["sources"].get("sources")
        if not t or "Key" not in t.get("columns", []) or "Kind" not in t["columns"]:
            problems.append("sources.json: needs a `sources` table with Key and Kind columns")
        else:
            ki, kd = t["columns"].index("Key"), t["columns"].index("Kind")
            for r in t["rows"]:
                if r[ki] in keys:
                    problems.append(f"sources.json: duplicate key {r[ki]}")
                keys.add(r[ki])
                if r[kd] not in KINDS:
                    problems.append(f"sources.json: {r[ki]} has Kind {r[kd]!r}, not science or reference")
    ids, nrows, ntables = {}, 0, 0
    for name, doc in docs.items():
        if name == "sources":
            continue
        for tab, t in tables(doc).items():
            where = f"{name}.{tab}"
            ntables += 1
            cols = t.get("columns")
            if not cols or "rows" not in t:
                problems.append(f"{where}: needs columns and rows")
                continue
            if "id" not in cols or "source" not in cols:
                problems.append(f"{where}: needs `id` and `source` columns")
                continue
            ii, si = cols.index("id"), cols.index("source")
            for r in t["rows"]:
                nrows += 1
                if len(r) != len(cols):
                    problems.append(f"{where}: row {r[ii]!r} has {len(r)} cells for {len(cols)} columns")
                    continue
                if r[ii] in ids:
                    problems.append(f"{where}: id {r[ii]!r} also in {ids[r[ii]]}")
                ids[r[ii]] = where
                if r[si] != "open":
                    for k in str(r[si]).split("; "):
                        if k not in keys:
                            problems.append(f"{where}: {r[ii]} cites {k!r}, not in sources.json")
    for p in problems[:50]:
        print(p, file=sys.stderr)
    if len(problems) > 50:
        print(f"... and {len(problems) - 50} more", file=sys.stderr)
    if problems:
        print(f"library: {len(problems)} problems", file=sys.stderr)
        return 1
    print(f"library ok: {len(docs)} files, {ntables} tables, {nrows} rows, {len(keys)} sources")
    return 0


if __name__ == "__main__":
    sys.exit(main())
