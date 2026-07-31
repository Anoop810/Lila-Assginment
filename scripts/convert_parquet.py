#!/usr/bin/env python3
"""Convert LILA player parquet telemetry into optimized JSON for the React app."""

from __future__ import annotations

import json
import math
import os
import re
import sys
from collections import defaultdict
from pathlib import Path

import pyarrow.parquet as pq
from PIL import Image

# ---------------------------------------------------------------------------
# Paths
# ---------------------------------------------------------------------------
ROOT = Path(__file__).resolve().parents[1]
DEFAULT_DATA = Path(__file__).resolve().parents[1] / "sample"
DATA_DIR = Path(sys.argv[1]) if len(sys.argv) > 1 else DEFAULT_DATA
OUT_DIR = ROOT / "public" / "processed"
MATCH_DIR = OUT_DIR / "matches"
MAPS_OUT = ROOT / "public" / "maps"

MAP_CONFIG = {
    "AmbroseValley": {"scale": 900, "originX": -370, "originZ": -473, "size": 1024},
    "GrandRift": {"scale": 581, "originX": -290, "originZ": -290, "size": 1024},
    "Lockdown": {"scale": 1000, "originX": -500, "originZ": -500, "size": 1024},
}

MAP_IMAGES = {
    "AmbroseValley": "AmbroseValley_Minimap.png",
    "GrandRift": "GrandRift_Minimap.png",
    "Lockdown": "Lockdown_Minimap.jpg",
}

UUID_RE = re.compile(
    r"^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$",
    re.I,
)

POSITION_EVENTS = {"Position", "BotPosition"}
KILL_EVENTS = {"Kill", "BotKill"}
DEATH_EVENTS = {"Killed", "BotKilled"}
STORM_EVENTS = {"KilledByStorm"}
LOOT_EVENTS = {"Loot"}

# Max path points kept per player (after distance-based downsample)
MAX_PATH_POINTS = 80
MIN_PATH_DIST = 8.0  # world units


def is_bot(user_id: str) -> bool:
    return not bool(UUID_RE.match(str(user_id)))


def decode_event(value) -> str:
    if isinstance(value, (bytes, bytearray)):
        return value.decode("utf-8")
    if hasattr(value, "as_py"):
        value = value.as_py()
        if isinstance(value, (bytes, bytearray)):
            return value.decode("utf-8")
    return str(value)


def ts_to_seconds(ts) -> int:
    """Parquet stores unix-seconds incorrectly typed as timestamp[ms].

    PyArrow exposes that integer via TimestampScalar.value (already in ms units
    of the column — do NOT scale again). Pandas Timestamp.value is nanoseconds.
    """
    # PyArrow scalar first (has both .as_py and .value in ms)
    type_name = type(ts).__name__
    if "Scalar" in type_name or hasattr(ts, "as_py"):
        try:
            raw = ts.value
            if raw is not None:
                return int(raw)
        except Exception:
            pass
        py = ts.as_py() if hasattr(ts, "as_py") else ts
        if hasattr(py, "timestamp"):
            # Fake datetime ~1970-01-21 → seconds * 1000 recovers the stored int
            return int(round(py.timestamp() * 1000))
        return int(py)
    # Pandas Timestamp: .value is ns
    if hasattr(ts, "value"):
        return int(ts.value // 1_000_000)
    return int(ts)


def world_to_pixel(x: float, z: float, map_id: str) -> tuple[float, float]:
    cfg = MAP_CONFIG[map_id]
    u = (x - cfg["originX"]) / cfg["scale"]
    v = (z - cfg["originZ"]) / cfg["scale"]
    px = u * cfg["size"]
    py = (1.0 - v) * cfg["size"]
    return round(px, 1), round(py, 1)


def downsample_path(points: list[dict]) -> list[dict]:
    if len(points) <= MAX_PATH_POINTS:
        return points
    kept = [points[0]]
    last = points[0]
    # distance threshold adaptive to length
    target = MAX_PATH_POINTS - 1
    step = max(1, len(points) // target)
    for i in range(step, len(points) - 1, step):
        p = points[i]
        dx = p["x"] - last["x"]
        dz = p["z"] - last["z"]
        if math.hypot(dx, dz) >= MIN_PATH_DIST or i % (step * 2) == 0:
            kept.append(p)
            last = p
    if kept[-1] is not points[-1]:
        kept.append(points[-1])
    return kept[:MAX_PATH_POINTS]


def compress_maps() -> None:
    MAPS_OUT.mkdir(parents=True, exist_ok=True)
    src_dir = DATA_DIR / "minimaps"
    for map_id, filename in MAP_IMAGES.items():
        src = src_dir / filename
        if not src.exists():
            print(f"  WARN: missing minimap {src}")
            continue
        img = Image.open(src).convert("RGB")
        img = img.resize((1024, 1024), Image.Resampling.LANCZOS)
        out_name = {
            "AmbroseValley": "ambrosevalley.jpg",
            "GrandRift": "grandrift.jpg",
            "Lockdown": "lockdown.jpg",
        }[map_id]
        out = MAPS_OUT / out_name
        img.save(out, "JPEG", quality=82, optimize=True)
        print(f"  map {out_name}: {out.stat().st_size // 1024} KB")


def load_all_files() -> list[dict]:
    """Load every player-journey file into a list of row dicts with date."""
    rows: list[dict] = []
    day_dirs = sorted(
        [p for p in DATA_DIR.iterdir() if p.is_dir() and p.name.startswith("February_")]
    )
    for day in day_dirs:
        files = [f for f in day.iterdir() if f.name.endswith(".nakama-0")]
        print(f"  {day.name}: {len(files)} files")
        for fp in files:
            try:
                table = pq.read_table(fp)
            except Exception as exc:  # noqa: BLE001
                print(f"  skip {fp.name}: {exc}")
                continue
            cols = {name: table.column(name) for name in table.column_names}
            n = table.num_rows
            for i in range(n):
                user_id = cols["user_id"][i].as_py()
                match_id = cols["match_id"][i].as_py()
                map_id = cols["map_id"][i].as_py()
                event = decode_event(cols["event"][i])
                x = float(cols["x"][i].as_py())
                z = float(cols["z"][i].as_py())
                ts = ts_to_seconds(cols["ts"][i])
                rows.append(
                    {
                        "date": day.name,
                        "user_id": str(user_id),
                        "match_id": str(match_id),
                        "map_id": str(map_id),
                        "event": event,
                        "x": x,
                        "z": z,
                        "ts": ts,
                        "is_bot": is_bot(str(user_id)),
                    }
                )
    return rows


def build_matches(rows: list[dict]) -> tuple[list[dict], dict]:
    by_match: dict[str, list[dict]] = defaultdict(list)
    for r in rows:
        by_match[r["match_id"]].append(r)

    index: list[dict] = []
    insights_acc = {
        "kills_by_region": defaultdict(int),
        "storm_by_region": defaultdict(int),
        "traffic_cells": defaultdict(int),
        "total_kills": 0,
        "total_storm": 0,
        "total_loot": 0,
        "map_counts": defaultdict(int),
        "edge_storm": 0,
        "center_storm": 0,
        "low_traffic_cells": 0,
    }

    MATCH_DIR.mkdir(parents=True, exist_ok=True)

    for match_id, events in by_match.items():
        events.sort(key=lambda e: e["ts"])
        map_id = events[0]["map_id"]
        date = events[0]["date"]
        if map_id not in MAP_CONFIG:
            continue

        t0 = events[0]["ts"]
        t1 = events[-1]["ts"]
        duration = max(0, t1 - t0)

        players: dict[str, dict] = {}
        discrete: list[dict] = []

        for e in events:
            uid = e["user_id"]
            t_rel = e["ts"] - t0
            px, py = world_to_pixel(e["x"], e["z"], map_id)

            if uid not in players:
                players[uid] = {
                    "id": uid,
                    "isBot": e["is_bot"],
                    "path": [],
                    "kills": 0,
                    "deaths": 0,
                    "loot": 0,
                    "stormDeath": False,
                }

            p = players[uid]
            ev = e["event"]

            if ev in POSITION_EVENTS:
                p["path"].append({"t": t_rel, "x": round(e["x"], 2), "z": round(e["z"], 2), "px": px, "py": py})
                # traffic grid 32x32
                cell = f"{int(px // 32)}_{int(py // 32)}"
                insights_acc["traffic_cells"][(map_id, cell)] += 1
            elif ev in KILL_EVENTS:
                p["kills"] += 1
                discrete.append({"t": t_rel, "type": "kill", "px": px, "py": py, "userId": uid, "isBot": e["is_bot"]})
                insights_acc["total_kills"] += 1
                insights_acc["kills_by_region"][(map_id, int(px // 64), int(py // 64))] += 1
            elif ev in DEATH_EVENTS:
                p["deaths"] += 1
                discrete.append({"t": t_rel, "type": "death", "px": px, "py": py, "userId": uid, "isBot": e["is_bot"]})
            elif ev in STORM_EVENTS:
                p["stormDeath"] = True
                p["deaths"] += 1
                discrete.append({"t": t_rel, "type": "storm", "px": px, "py": py, "userId": uid, "isBot": e["is_bot"]})
                insights_acc["total_storm"] += 1
                # edge vs center (outer 20% = edge)
                nx, ny = px / 1024, py / 1024
                if nx < 0.2 or nx > 0.8 or ny < 0.2 or ny > 0.8:
                    insights_acc["edge_storm"] += 1
                else:
                    insights_acc["center_storm"] += 1
            elif ev in LOOT_EVENTS:
                p["loot"] += 1
                discrete.append({"t": t_rel, "type": "loot", "px": px, "py": py, "userId": uid, "isBot": e["is_bot"]})
                insights_acc["total_loot"] += 1

        player_list = []
        for p in players.values():
            p["path"] = downsample_path(p["path"])
            player_list.append(p)

        humans = sum(1 for p in player_list if not p["isBot"])
        bots = sum(1 for p in player_list if p["isBot"])
        kills = sum(1 for d in discrete if d["type"] == "kill")
        deaths = sum(1 for d in discrete if d["type"] == "death")
        loot = sum(1 for d in discrete if d["type"] == "loot")
        storm = sum(1 for d in discrete if d["type"] == "storm")

        safe_id = match_id.replace(".nakama-0", "")
        match_payload = {
            "id": match_id,
            "safeId": safe_id,
            "map": map_id,
            "date": date,
            "duration": duration,
            "players": player_list,
            "events": discrete,
            "stats": {
                "humans": humans,
                "bots": bots,
                "kills": kills,
                "deaths": deaths,
                "loot": loot,
                "stormDeaths": storm,
            },
        }

        out_path = MATCH_DIR / f"{safe_id}.json"
        with out_path.open("w", encoding="utf-8") as f:
            json.dump(match_payload, f, separators=(",", ":"))

        index.append(
            {
                "id": match_id,
                "safeId": safe_id,
                "map": map_id,
                "date": date,
                "duration": duration,
                "humans": humans,
                "bots": bots,
                "kills": kills,
                "deaths": deaths,
                "loot": loot,
                "stormDeaths": storm,
            }
        )
        insights_acc["map_counts"][map_id] += 1

    index.sort(key=lambda m: (m["date"], m["map"], -m["humans"], -m["kills"]))
    return index, insights_acc


def write_index(index: list[dict]) -> None:
    OUT_DIR.mkdir(parents=True, exist_ok=True)
    dates = sorted({m["date"] for m in index})
    maps = sorted({m["map"] for m in index})
    payload = {
        "generatedAt": __import__("datetime").datetime.utcnow().isoformat() + "Z",
        "maps": maps,
        "dates": dates,
        "mapConfig": MAP_CONFIG,
        "mapImages": {
            "AmbroseValley": "/maps/ambrosevalley.jpg",
            "GrandRift": "/maps/grandrift.jpg",
            "Lockdown": "/maps/lockdown.jpg",
        },
        "matchCount": len(index),
        "matches": index,
    }
    with (OUT_DIR / "index.json").open("w", encoding="utf-8") as f:
        json.dump(payload, f, separators=(",", ":"))
    print(f"  index: {len(index)} matches")


def write_insight_stats(acc: dict) -> None:
    # Top kill hotspots
    top_kills = sorted(acc["kills_by_region"].items(), key=lambda x: -x[1])[:15]
    traffic_vals = list(acc["traffic_cells"].values())
    if traffic_vals:
        median = sorted(traffic_vals)[len(traffic_vals) // 2]
        zeroish = sum(1 for v in traffic_vals if v <= 2)
        total_cells_possible = 3 * 32 * 32
        occupied = len(traffic_vals)
    else:
        median = 0
        zeroish = 0
        total_cells_possible = 0
        occupied = 0

    stats = {
        "totalKills": acc["total_kills"],
        "totalStorm": acc["total_storm"],
        "totalLoot": acc["total_loot"],
        "mapCounts": dict(acc["map_counts"]),
        "edgeStorm": acc["edge_storm"],
        "centerStorm": acc["center_storm"],
        "edgeStormPct": round(100 * acc["edge_storm"] / max(1, acc["total_storm"]), 1),
        "topKillHotspots": [
            {"map": k[0], "cellX": k[1], "cellY": k[2], "count": v} for k, v in top_kills
        ],
        "trafficOccupiedCells": occupied,
        "trafficPossibleCells": total_cells_possible,
        "trafficSparseCells": zeroish,
        "trafficMedian": median,
    }
    with (OUT_DIR / "insight_stats.json").open("w", encoding="utf-8") as f:
        json.dump(stats, f, indent=2)
    print("  insight_stats.json written")
    print(json.dumps(stats, indent=2))


def main() -> None:
    print(f"Data: {DATA_DIR}")
    print(f"Out:  {OUT_DIR}")
    if not DATA_DIR.exists():
        sys.exit(f"Data directory not found: {DATA_DIR}")

    print("Compressing minimaps...")
    compress_maps()

    print("Loading parquet files...")
    rows = load_all_files()
    print(f"  total rows: {len(rows)}")

    print("Building match JSON...")
    index, insights = build_matches(rows)
    write_index(index)
    write_insight_stats(insights)
    print("Done.")


if __name__ == "__main__":
    main()
