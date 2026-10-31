"""Build state.json for the platform dashboard (2026-10-30). No tokens: it only reads files.

    python build.py            # write state.json once
    python build.py --watch    # rewrite every 60 s

Sources: the belt lanes (Games/Card Games/_agent/queue/<lane>/), the keepers' handoffs (HQ/handoffs/*/HANDOFF.md),
the registry (Toolchain/registry/*.json), the overlap batches (Toolchain/OVERLAPS-BATCH-*.md), ROADMAP.md, and the
pirate STARTING_TOWN.md. Everything is read-only; a missing source leaves its section empty rather than failing.
"""
import json
import re
import sys
import time
from datetime import datetime, date
from pathlib import Path

HERE = Path(__file__).resolve().parent
TOOLCHAIN = HERE.parent
ROOT = TOOLCHAIN.parent
QUEUE = ROOT / "Games" / "Card Games" / "_agent" / "queue"
HANDOFFS = ROOT / "HQ" / "handoffs"
STARTING_TOWN = ROOT / "Games" / "RPG's" / "pirate-ship" / "files" / "pirate-ship" / "STARTING_TOWN.md"
LANES = ["kernel", "realism", "settlement", "economy", "cognition", "pirate-ship"]
UNIT = re.compile(r"^(\d{2,5})-")


def read(p: Path) -> str:
    try:
        return p.read_text(encoding="utf-8", errors="replace")
    except OSError:
        return ""


def jload(p: Path, default):
    try:
        return json.loads(p.read_text(encoding="utf-8"))
    except (OSError, ValueError):
        return default


def lanes() -> list[dict]:
    today = date.today().isoformat()
    out = []
    for lane in LANES:
        d = QUEUE / lane
        if not d.is_dir():
            continue
        queued = sorted(f.name[:-3] for f in d.iterdir() if f.suffix == ".md" and UNIT.match(f.name))
        done = sorted(f.name[:-3] for f in (d / "done").glob("*.md") if UNIT.match(f.name))
        failed = sorted(f.name[:-3] for f in (d / "failed").glob("*.md") if UNIT.match(f.name))
        status = jload(d / "logs" / "status.json", {})
        results = []
        for line in read(d / "logs" / "results.jsonl").splitlines():
            try:
                results.append(json.loads(line))
            except ValueError:
                pass
        today_rows = [r for r in results if str(r.get("at", "")).startswith(today)]
        last = []
        for r in results[-8:]:
            last.append({"at": str(r.get("at", ""))[11:16], "name": r.get("name"), "ok": bool(r.get("ok")),
                         "reason": (r.get("reason") or "")[:110], "model": r.get("model"), "cost": r.get("cost")})
        out.append({
            "lane": lane,
            "queued": len(queued), "queued_names": queued[:12],
            "done": len(done), "failed": len(failed), "failed_names": failed[-6:],
            "running": status.get("running"), "since": status.get("since"),
            "today_passed": sum(1 for r in today_rows if r.get("ok")),
            "today_failed": sum(1 for r in today_rows if not r.get("ok")),
            "today_cost": round(sum(r.get("cost") or 0 for r in today_rows), 2),
            "last": last[::-1],
        })
    return out


def section(md: str, heading_prefix: str) -> str:
    """Text of the '## N. <heading_prefix>...' section, up to the next '## '."""
    m = re.search(r"^## [0-9]+\. " + re.escape(heading_prefix) + r".*?$", md, re.M)
    if not m:
        return ""
    rest = md[m.end():]
    n = re.search(r"^## ", rest, re.M)
    return (rest[: n.start()] if n else rest).strip()


def keepers() -> list[dict]:
    out = []
    if not HANDOFFS.is_dir():
        return out
    for d in sorted(HANDOFFS.iterdir()):
        h = d / "HANDOFF.md"
        if not d.is_dir() or not h.exists():
            continue
        md = read(h)
        issues = read(d / "ISSUES.md")
        open_issues = len(re.findall(r"^\| [A-Z]+-\d+ \|.*\| open", issues, re.M))
        total_issues = len(re.findall(r"^\| [A-Z]+-\d+ \|", issues, re.M))
        out.append({
            "name": d.name,
            "updated": datetime.fromtimestamp(h.stat().st_mtime).strftime("%m-%d %H:%M"),
            "responsibility": section(md, "Responsibility")[:300],
            "blocked": section(md, "Blocked on Rex")[:900],
            "next": section(md, "Next proposed task")[:400],
            "issues_open": open_issues, "issues_total": total_issues,
        })
    return out


def registry() -> dict:
    m = jload(TOOLCHAIN / "registry" / "mechanisms.json", {})
    rows = m.get("mechanisms", []) if isinstance(m, dict) else []
    mech = [r for r in rows if r.get("kind") == "mechanism"]
    by_status, by_engine, vv = {}, {}, {"implemented": 0, "integrated": 0, "validated": 0}
    for r in mech:
        by_status[r.get("status", "?")] = by_status.get(r.get("status", "?"), 0) + 1
        e = r.get("owning_engine", "?")
        by_engine.setdefault(e, {"built": 0, "documented-only": 0, "planned": 0})
        by_engine[e][r.get("status", "planned")] = by_engine[e].get(r.get("status", "planned"), 0) + 1
        v = r.get("vv") or {}
        if isinstance(v, str):
            try:
                v = json.loads(v.replace("'", '"').replace("False", "false").replace("True", "true"))
            except ValueError:
                v = {}
        for k in vv:
            val = v.get(k)
            if val is True or (isinstance(val, str) and val.lower() in ("yes", "true", "full", "partial")):
                vv[k] += 1
    g = jload(TOOLCHAIN / "registry" / "graph.json", {})
    groups = g.get("overlap_groups", []) if isinstance(g, dict) else []
    gstate = {}
    for grp in groups if isinstance(groups, list) else groups.values():
        s = (grp.get("state") or grp.get("status") or "open") if isinstance(grp, dict) else "open"
        gstate[s] = gstate.get(s, 0) + 1
    return {"mechanisms": len(mech), "restatements": len(rows) - len(mech), "by_status": by_status,
            "by_engine": by_engine, "vv": vv, "overlap_groups": len(groups), "overlap_state": gstate,
            "integration_gaps": len(g.get("integration_gaps", [])) if isinstance(g, dict) else 0}


def batches() -> list[dict]:
    out = []
    for p in sorted(TOOLCHAIN.glob("OVERLAPS-BATCH-*.md")):
        md = read(p)
        status = re.search(r"\*\*Status: ([^.*]+)", md)
        rows = []
        track = re.search(r"^## Tracking.*?(?=^## )", md, re.M | re.S)
        if track:
            for line in track.group(0).splitlines():
                if line.startswith("| ") and not line.startswith("| #") and not line.startswith("|---"):
                    cells = [c.strip() for c in line.strip("|").split("|")]
                    if len(cells) >= 3:
                        rows.append({"n": cells[0], "group": cells[1][:60], "state": cells[2][:40],
                                     "closed": cells[6][:30] if len(cells) > 6 else ""})
        out.append({"file": p.name, "status": status.group(1).strip() if status else "?", "groups": rows})
    return out


def roadmap() -> list[dict]:
    md = read(TOOLCHAIN / "ROADMAP.md")
    out = []
    for line in md.splitlines():
        m = re.match(r"^\| \*\*(P\d+[a-z]?|PL) ([^*]+)\*\* \| ([^|]+)\|", line)
        if m:
            out.append({"phase": m.group(1), "title": m.group(2).strip(), "owner": m.group(3).strip()[:60]})
    return out


def starting_town() -> dict:
    md = read(STARTING_TOWN)
    total = answered = 0
    for line in md.splitlines():
        if line.startswith("| ") and not line.startswith("| Id") and not line.startswith("|---"):
            cells = [c.strip() for c in line.strip().strip("|").split("|")]
            if len(cells) >= 5:
                total += 1
                if cells[-1]:
                    answered += 1
    return {"rows": total, "answered": answered}


def build() -> dict:
    ks = keepers()
    blocked = [{"keeper": k["name"], "text": k["blocked"]} for k in ks if k["blocked"] and "none" not in k["blocked"][:40].lower()]
    return {
        "built_at": datetime.now().strftime("%Y-%m-%d %H:%M:%S"),
        "lanes": lanes(), "keepers": ks, "registry": registry(), "batches": batches(),
        "roadmap": roadmap(), "starting_town": starting_town(), "blocked_on_rex": blocked,
    }


def main(argv):
    out = HERE / "state.json"
    while True:
        out.write_text(json.dumps(build(), indent=1), encoding="utf-8")
        if "--watch" not in argv:
            print("wrote", out)
            return 0
        time.sleep(60)


if __name__ == "__main__":
    sys.exit(main(sys.argv[1:]))
