#!/usr/bin/env python3
"""Split the pirate game's body/data/*.json into the engine's scientific data library (MIGRATION.md, phase 2).

Reads the game's 18 data files ({table: {title, kind, conf, source, columns, rows}} plus an `_about` string), and for
every table marked E or L in MIGRATION.md section 3 writes its universal columns to data/library/<domain>.json with
the same columns/rows schema, plus a stable `id` column and a `source` column of source keys.

  id      the table's own Id column where it has one (prefixed `<domain>.<table>.` only if it collides with an Id in
          another table); otherwise `<domain>.<table>.<slug of the first column>`.
  source  the source keys (KEY-NNN style, e.g. PHY-MET) the game cites for the row: in the row's own cells, on the
          matching doc's table line that starts with the row's first cell, or (long first cells only) on a prose line
          that contains the first cell. Only keys in the library's sources.json count; `open` when none.

Game columns (the per-table lists in SPLIT) are not copied. Rows keyed `Mark` stay in both places: the library's Mark
is the review state of the universal columns, the adapter's Mark that of the game columns.

Where the engine's own data files already hold a row (data/substances.json, data/reactions.json), the library keeps
only the columns the engine file does not hold and writes null for the rest: a number has one home.

Idempotent: it rewrites data/library/*.json from the game's files and the engine's data each run.
--write-game also writes the adapter versions (id plus game columns; tables that moved whole are omitted) as
<file>.adapter.json next to the originals, or into --game-out DIR. It never changes the originals.
"""
import argparse
import json
import re
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
GAME = Path("E:/AI Programs/Games/RPG's/pirate-ship/files/pirate-ship")
LIBRARY_KINDS = ("science", "reference")

# game file stem -> {table: [game columns: stay in the game; everything else moves to the library]}.
# Tables not listed (G in MIGRATION.md section 3) are not read for the library and pass through to the adapter.
# Game columns beyond those MIGRATION.md names, decided by its section 1 rule (a face, a STATS or COMBAT or GOODS
# link, a period treatment or a game place is the game's): physiology.cold_water 'Caribbean relevance',
# atmosphere.baseline 'Tracked in play?', atmosphere.altitude 'Where in the game', medicine.pain 'Sim effect' and
# 'Relief', medicine.bleeding 'Sim: Endurance pool and Constitution', medicine.immunity 'Constitution effect (model)',
# medicine.diseases 'Symptoms (the visible face)', equipment.wear 'Visible face', science.classifications 'Examples',
# environment.exposure the three hazard columns, muscular.limb_strength 'Limb stat', muscular.activations 'Action'.
SPLIT = {
    "physiology": {
        "met": ["Activity (duty or action)"], "pal": [], "sleep_debt": ["Visible face"], "circadian": [],
        "wbgt_limits": [], "core_temp": ["Visible face"], "cold_water": ["Caribbean relevance"],
        "hydration": ["Visible face"], "banister": [], "ageing": [], "acclimatisation": [], "recovery": [],
        "ventilation": [],
    },
    "nutrition": {
        "nutrients": [], "absorption": [], "body_composition": [],
        "depletion": ["Stage 1 face", "Stage 2 face", "Stage 3 face"],
        "foods": ["Good (GOODS.md row)", "Keeps (days at sea)"], "foods_more": ["Good"],
    },
    "anatomy": {
        "organs": ["Period diseases and injuries (MEDICINE)", "Visible face"], "tissues": ["Owner of the effect"],
        "damage_function": [], "timescales": [], "species": ["A fish-person (Rex's form, open)"], "respiratory": [],
    },
    "circulation": {
        "quantities": [], "bleeding": [], "delivery_failures": ["Face"], "homeostasis": [], "blood_gas": [],
        "events": ["Visible face"],
    },
    "medicine": {
        "diseases": ["Disease [period name]", "How the sim catches it", "Symptoms (the visible face)",
                     "Period treatment (what the surgeon does)"],
        "wounds": ["What it dips while open (per COMBAT 4a hit-location rule)", "Period treatment", "Visible face"],
        "bleeding": ["Sim: Endurance pool and Constitution"],
        "pain": ["Sim effect", "Relief", "Visible face"],
        "treatments": ["Treatment", "Used for", "Skill needed (STATS Surgery)", "Supplies (GOODS.md)", "Sim effect",
                       "Risk"],
        "healing": [], "immunity": ["Constitution effect (model)"],
        "exposure": ["Condition [period name]", "Period treatment", "Visible face"],
    },
    "muscular": {
        "groups": ["Feeds limb stat"], "values": [], "fatigue_rates": [], "endurance_time": [],
        "activations": ["Action", "Source doc"], "training": [], "adaptation": [], "patterns": ["Example actions"],
        "tendons": [], "injuries": ["Visible face"], "limb_strength": ["Limb stat"],
    },
    "neurology": {
        "systems": ["What a tone over 1 reads as", "What a tone under 1 reads as"], "baseline": [],
        "pk": ["Period status"], "receptor": [], "circuits": ["Visible face"], "interactions": [],
    },
    "atmosphere": {"baseline": ["Tracked in play?"], "altitude": ["Where in the game"], "modifiers": []},
    "gasdynamics": {"units": ["Who writes", "Who reads"], "box_model": [], "sources_sinks": [], "grid": []},
    "chemistry": {
        "schema": [], "substances": ["Period source in the game"], "reactions": ["Where"],
        "domains": ["Period example (1650 to 1730)", "Anomaly example (reachable with period equipment)"],
        "reaction_fields": [],
    },
    "equipment": {
        "roles": [], "assembly": [], "wear": ["Visible face"], "confidence": [],
        "catalogue": ["Skill (GOODS 3c)", "1650 to 1730 availability"],
    },
    "science": {
        "separations": ["Example (oxygen in 1700)"], "states": [], "classifications": ["Examples"], "entry": [],
    },
    "environment": {
        "exposure": ["Place / terrain", "Mosquito exposure", "Foul-water exposure", "Fall or accident hazard"],
    },
    "ecology": {"depletion_rules": ["Visible face"], "soil": ["Visible face"]},
    "population": {"cohorts": [], "tick": []},
}

# MIGRATION.md section 3: the catalogue's world-history columns go to the library as a sub-record the game reads.
HISTORY = {("equipment", "catalogue"): ["Date (usual)", "Credited to", "Predecessor", "conf_history"]}

# Columns the engine's own data files already hold, by id: {(domain, table): (file, array key, columns)}.
ENGINE_OWNED = {
    ("chemistry", "substances"): ("substances.json", "rows",["Formula", "Molar mass"]),
    ("chemistry", "reactions"): ("reactions.json", "reactions",
                                 ["Reactants", "Products", "Conditions", "Rate (placeholder)", "Heat"]),
}

# The doc(s) whose tables and prose cite a domain's rows.
DOCS = {
    "physiology": ["body/PHYSIOLOGY.md"], "nutrition": ["body/NUTRITION.md"], "anatomy": ["body/ANATOMY.md"],
    "circulation": ["body/CIRCULATION.md"], "medicine": ["body/MEDICINE.md"], "muscular": ["body/MUSCULAR.md"],
    "neurology": ["body/NEUROLOGY.md"], "atmosphere": ["world/ATMOSPHERE.md"],
    "gasdynamics": ["world/GAS_DYNAMICS.md"], "chemistry": ["science/CHEMISTRY.md"],
    "equipment": ["science/SCIENTIFIC_EQUIPMENT.md"], "science": ["science/DISCOVERY.md", "science/JOURNAL.md"],
    "environment": ["world/ENVIRONMENT.md"], "ecology": ["world/ECOLOGY.md"], "population": ["world/POPULATION.md"],
}

KEY_RE = re.compile(r"[A-Z][A-Z0-9]*(?:-[A-Z0-9]+)+")


def slug(text):
    s = re.sub(r"\s*\(\d+\)\s*$", "", str(text)).lower().replace("'", "").replace("\u2019", "")
    s = re.sub(r"[^a-z0-9]+", "-", s).strip("-")
    if len(s) > 60:
        s = s[:60].rsplit("-", 1)[0] if "-" in s[:60] else s[:60]
    return s or "row"


def load(path):
    return json.loads(Path(path).read_text(encoding="utf-8"))


def is_table(k, v):
    return not k.startswith("_") and isinstance(v, dict) and "columns" in v and "rows" in v


def dump_file(path, doc):
    """One table header per block, one row per line: diffs stay readable."""
    out = ["{"]
    items = list(doc.items())
    for n, (k, v) in enumerate(items):
        comma = "," if n < len(items) - 1 else ""
        if not is_table(k, v):
            out.append(f"  {json.dumps(k)}: {json.dumps(v, ensure_ascii=False)}{comma}")
            continue
        out.append(f"  {json.dumps(k)}: {{")
        for mk, mv in v.items():
            if mk in ("columns", "rows"):
                continue
            out.append(f"    {json.dumps(mk)}: {json.dumps(mv, ensure_ascii=False)},")
        out.append(f"    \"columns\": {json.dumps(v['columns'], ensure_ascii=False)},")
        out.append("    \"rows\": [")
        rows = [json.dumps(r, ensure_ascii=False) for r in v["rows"]]
        out.append(",\n".join("      " + r for r in rows))
        out.append("    ]")
        out.append(f"  }}{comma}")
    out.append("}")
    Path(path).parent.mkdir(parents=True, exist_ok=True)
    Path(path).write_text("\n".join(out) + "\n", encoding="utf-8")


class DocIndex:
    """Per domain: table lines by first cell, and prose lines, for the source-key search."""

    def __init__(self, game, domain):
        self.table = {}
        self.prose = []
        for rel in DOCS[domain]:
            p = game / rel
            if not p.exists():
                continue
            for line in p.read_text(encoding="utf-8").split("\n"):
                if line.startswith("|"):
                    cells = [c.strip().replace("\\|", "|") for c in re.split(r"(?<!\\)\|", line)[1:-1]]
                    if cells:
                        self.table.setdefault(cells[0], []).append(line)
                else:
                    self.prose.append(line)

    def lines_for(self, row):
        first = str(row[0]).strip()
        found = []
        others = [str(c) for c in row[1:-1] if isinstance(c, str) and len(c) >= 3]
        for line in self.table.get(first, []):
            if not others or any(o in line for o in others):
                found.append(line)
        if not found and len(first) >= 12 and " " in first:
            low = first.lower()
            found = [ln for ln in self.prose if low in ln.lower()]
        return found


def row_keys(row, index, known):
    text = [" ".join(str(c) for c in row)] + index.lines_for(row)
    found = set()
    for t in text:
        found.update(k for k in KEY_RE.findall(t) if k in known)
    return found


def main():
    ap = argparse.ArgumentParser(description=__doc__.split("\n")[0])
    ap.add_argument("--game", default=str(GAME), help="the pirate game's files/pirate-ship folder")
    ap.add_argument("--lib", default=str(ROOT / "data" / "library"), help="library output folder")
    ap.add_argument("--write-game", action="store_true", help="also emit <file>.adapter.json for the game's files")
    ap.add_argument("--game-out", help="with --write-game: write the adapters here instead of next to the originals")
    args = ap.parse_args()
    game, lib = Path(args.game), Path(args.lib)
    data = game / "body" / "data"

    # sources: library = science and reference; the rest stays with the game
    src = load(data / "sources.json")
    stab = src["sources"]
    kind_i = stab["columns"].index("Kind")
    lib_sources = [r for r in stab["rows"] if r[kind_i] in LIBRARY_KINDS]
    game_sources = [r for r in stab["rows"] if r[kind_i] not in LIBRARY_KINDS]
    order = {r[0]: i for i, r in enumerate(stab["rows"])}
    known = set(order)
    lib_keys = {r[0] for r in lib_sources}

    engine = {}
    for (dom, tab), (fname, arr, cols) in ENGINE_OWNED.items():
        engine[(dom, tab)] = {e["id"] for e in load(ROOT / "data" / fname)[arr]}

    files = {p.stem: load(p) for p in sorted(data.glob("*.json"))}

    # first pass: raw Ids, to namespace the ones that collide across tables
    seen = {}
    for dom, tables in SPLIT.items():
        for tab in tables:
            t = files[dom][tab]
            if "Id" in t["columns"]:
                for r in t["rows"]:
                    seen.setdefault(r[t["columns"].index("Id")], set()).add((dom, tab))
    collide = {i for i, where in seen.items() if len(where) > 1}

    report, dropped = [], {"history keys": 0, "rows open": 0, "rows keyed": 0}
    lib_docs, adapters = {}, {}
    used_ids = {}
    for dom, tables in SPLIT.items():
        index = DocIndex(game, dom)
        game_doc = files[dom]
        lib_doc = {"_about": (
            f"Scientific data library, domain {dom}: the universal columns of the game's body/data/{dom}.json "
            "tables, written by scripts/split_data.py. Same columns/rows schema as the game's tables. `id` is stable "
            "(see README); `source` holds source keys from sources.json ('; ' separated) or 'open'. Mark is the "
            "review state of these columns. A null in a column the engine's data/*.json holds by the same id means "
            "the engine file is the home of that value.")}
        adapter_doc = {"_about": game_doc["_about"]}
        moved_whole = []
        for tab, vv in game_doc.items():
            if not is_table(tab, vv):
                continue
            if tab not in tables:
                adapter_doc[tab] = vv  # G table: unchanged
                continue
            gcols = tables[tab]
            cols = vv["columns"]
            for c in gcols:
                assert c in cols, f"{dom}.{tab}: no column {c!r}"
            mark_i = next((i for i, c in enumerate(cols) if c.lower() == "mark"), None)
            id_i = cols.index("Id") if "Id" in cols else None
            hist = HISTORY.get((dom, tab), [])
            ucols = [c for c in cols if c not in gcols and c not in hist and c != "Id" and c.lower() != "mark"]
            owned = ENGINE_OWNED.get((dom, tab))
            lrows, hrows, arows, slugs = [], [], [], {}
            for r in vv["rows"]:
                if id_i is not None:
                    raw = r[id_i]
                    rid = f"{dom}.{tab}.{raw}" if raw in collide else raw
                    hid = f"{dom}.{tab}_history.{raw}"
                else:
                    s = slug(r[0])
                    slugs[s] = slugs.get(s, 0) + 1
                    if slugs[s] > 1:
                        s = f"{s}-{slugs[s]}"
                    rid = f"{dom}.{tab}.{s}"
                    hid = f"{dom}.{tab}_history.{s}"
                if rid in used_ids:
                    sys.exit(f"duplicate id {rid!r}: {used_ids[rid]} and {dom}.{tab}")
                used_ids[rid] = f"{dom}.{tab}"
                keys = row_keys(r, index, known)
                kept = sorted((k for k in keys if k in lib_keys), key=order.get)
                dropped["history keys"] += len(keys) - len(kept)
                rsrc = "; ".join(kept) if kept else "open"
                dropped["rows keyed" if kept else "rows open"] += 1
                new = [rid]
                for c in ucols:
                    v = r[cols.index(c)]
                    if owned and c in owned[2] and r[id_i] in engine[(dom, tab)]:
                        v = None
                    new.append(v)
                if mark_i is not None:
                    new.append(r[mark_i])
                new.append(rsrc)
                lrows.append(new)
                if hist:
                    hkeys = sorted((k for k in keys if k in lib_keys), key=order.get)
                    hrows.append([hid] + [r[cols.index(c)] for c in hist] + ["; ".join(hkeys) if hkeys else "open"])
                if gcols:
                    arow = [rid] + [r[cols.index(c)] for c in gcols]
                    if mark_i is not None:
                        arow.append(r[mark_i])
                    arows.append(arow)
            meta = {k: v for k, v in vv.items() if k not in ("columns", "rows")}
            lib_doc[tab] = {**meta, "columns": ["id"] + ucols + (["Mark"] if mark_i is not None else []) + ["source"],
                            "rows": lrows}
            if hist:
                hmeta = dict(meta)
                hmeta["title"] = f"{meta.get('title', tab)} (history)"
                hmeta["kind"] = "history"
                lib_doc[f"{tab}_history"] = {**hmeta, "columns": ["id"] + hist + ["source"], "rows": hrows}
            if gcols:
                adapter_doc[tab] = {**meta, "columns": ["id"] + gcols + (["Mark"] if mark_i is not None else []),
                                    "rows": arows}
            else:
                moved_whole.append(tab)
            report.append((f"{dom}.json", tab, len(vv["rows"]), len(lrows), len(ucols) + len(hist), len(gcols)))
            if hist:
                report.append((f"{dom}.json", f"{tab}_history", len(vv["rows"]), len(hrows), 0, 0))
        if moved_whole:
            adapter_doc["_about"] += (f" Tables moved whole to data/library/{dom}.json (no game columns): "
                                      f"{', '.join(moved_whole)}.")
        lib_docs[dom] = lib_doc
        adapters[dom] = adapter_doc

    lib_docs["sources"] = {
        "_about": ("Sources behind the library's rows: the game's body/data/sources.json rows whose Kind is "
                   "science or reference. The game keeps the rest (history, museum, primary text)."),
        "sources": {k: v for k, v in stab.items() if k != "rows"} | {"rows": lib_sources},
    }
    adapters["sources"] = {
        "_about": src["_about"],
        "sources": {k: v for k, v in stab.items() if k != "rows"} | {"rows": game_sources},
    }
    report.append(("sources.json", "sources", len(stab["rows"]), len(lib_sources), len(stab["columns"]), 0))

    for name, doc in lib_docs.items():
        dump_file(lib / f"{name}.json", doc)

    if args.write_game:
        out = Path(args.game_out) if args.game_out else data
        for name, doc in adapters.items():
            dump_file(out / f"{name}.adapter.json", doc)

    w = max(len(f"{f[:-5]}.{t}") for f, t, *_ in report)
    print(f"{'file.table':<{w}}  {'read':>5} {'written':>7} {'moved':>5} {'left':>5}")
    tot = [0, 0, 0, 0]
    for f, t, rd, wr, mv, lf in report:
        print(f"{f[:-5] + '.' + t:<{w}}  {rd:>5} {wr:>7} {mv:>5} {lf:>5}")
        for i, n in enumerate((rd, wr, mv, lf)):
            tot[i] += n
    print(f"{'total':<{w}}  {tot[0]:>5} {tot[1]:>7} {tot[2]:>5} {tot[3]:>5}")
    print(f"sources: {len(lib_sources)} library rows (science, reference), {len(game_sources)} stay with the game")
    print(f"row sources: {dropped['rows keyed']} rows cite library keys, {dropped['rows open']} are open; "
          f"{dropped['history keys']} history-kind key citations stay with the game")
    in_scope = sum(len(t) for t in SPLIT.values())
    print(f"tables: {in_scope} split of {sum(sum(1 for k, v in d.items() if is_table(k, v)) for k, d in files.items())}"
          f" in the game's files; {len(lib_docs)} library files written to {lib}")


if __name__ == "__main__":
    main()
