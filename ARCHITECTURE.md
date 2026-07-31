# ARCHITECTURE

## Overview

The Player Journey Visualization Tool converts raw LILA BLACK gameplay telemetry into an interactive browser app for Level Designers. Production Parquet files are preprocessed into compact JSON; the React frontend loads those static assets and renders journeys, events, heatmaps, and timeline playback — no backend required.

---

## Technology Stack

| Component | Technology | Why |
| --- | --- | --- |
| Frontend | React + Vite + TypeScript | Fast DX, typed UI, excellent static deploy story |
| Mapping | React Leaflet (`CRS.Simple`) | Zoom/pan, image overlays, layered markers without reinventing a canvas map |
| Heatmaps | leaflet.heat | Lightweight density overlays on Leaflet |
| Playback | RequestAnimationFrame timeline | Smooth scrubbing at 1x / 2x / 5x without a heavy animation dependency in the hot path |
| Data processing | Python + PyArrow + Pillow | Efficient Parquet ingest and minimap compression |
| Deployment | Vercel (static) | CDN-backed hosting; `public/processed` ships with the build |

---

## System Architecture

```
          Player Telemetry (.nakama-0 Parquet)
                        │
                        ▼
               Python ETL (scripts/convert_parquet.py)
          Parse → decode events → normalize time → pixel-map → export
                        │
                        ▼
              Optimized JSON in public/processed/
           index.json  +  matches/{safeId}.json  +  maps/*.jpg
                        │
                        ▼
                 React Visualization App
        ┌──────────┬───────────┬─────────────┬────────────┐
        │ Filters  │ Timeline  │  Heatmaps   │ Event layer│
        └──────────┴─────┬─────┴─────────────┴────────────┘
                         ▼
                  Interactive minimap
```

Preprocessing avoids browser-side Parquet parsing, shrinks payloads (paths are downsampled; minimaps recompressed to ~100KB JPEGs), and keeps the client focused on interaction.

---

## Data Flow

1. Read all day folders of `.nakama-0` Parquet player-journey files.
2. Decode `event` bytes to UTF-8; detect bots via numeric `user_id` vs UUID.
3. Treat `ts` as unix **seconds** stored incorrectly as `timestamp[ms]` (see Assumptions); normalize per match to `t = ts - t0`.
4. Map world `(x, z)` → pixel `(px, py)` using per-map origin/scale.
5. Emit `index.json` (filter catalog + summaries) and one JSON file per match (players, paths, events, stats).
6. Frontend loads the index, then lazy-fetches the selected match file and renders layers.

---

## Coordinate Mapping

Gameplay positions are 3D world coordinates. Minimap images are 1024×1024 top-down views. **Elevation (`y`) is ignored** for 2D plotting; we use **`x` / `z`**.

Each map ships with `scale`, `originX`, and `originZ` (from the dataset README):

| Map | Scale | Origin X | Origin Z |
| --- | --- | --- | --- |
| AmbroseValley | 900 | -370 | -473 |
| GrandRift | 581 | -290 | -290 |
| Lockdown | 1000 | -500 | -500 |

```
World (x, z)
     │
     ▼  normalize to UV
 u = (x - originX) / scale
 v = (z - originZ) / scale
     │
     ▼  scale + flip Y
 pixelX = u × 1024
 pixelY = (1 - v) × 1024
     │
     ▼
 Leaflet CRS.Simple  (lat = pixelY, lng = pixelX)
```

Y is flipped because image space originates at the **top-left**, while world Z increases “up” the map. The ETL bakes `px`/`py` into JSON so the client and docs share one source of truth; `src/utils/coordinateMapper.ts` documents the same formula for clarity.

---

## Frontend Design

- **MapViewer** — minimap overlay, trails, live player dots, event markers
- **Timeline** — scrub + play/pause + speed
- **Filters** — map / date / match, heatmap mode, human/bot, event toggles, player search
- **HeatmapLayer** — traffic / kills / deaths density
- **Sidebar + Legend** — match stats and designer-facing chrome

Modules keep rendering, playback, and filtering independent so new layers can be added without rewriting the pipeline.

---

## Assumptions

- Dataset map bounds (`origin` + `scale`) are accurate for each minimap.
- Timestamps within a `match_id` are comparable; we only need relative ordering/duration for playback.
- `ts` values are unix seconds mis-typed as millisecond timestamps (they display as ~1970-01-21 if read naively). We convert via the underlying integer and subtract the match minimum.
- UUID `user_id` ⇒ human; numeric `user_id` ⇒ bot (per dataset README).
- Incomplete/unreadable files are skipped during ETL.
- February 14 is a partial day (noted in source README).

---

## Trade-offs

| Considered | Decision | Reason |
| --- | --- | --- |
| Browser-side Parquet parsing | ❌ No | Slower first paint, larger client surface area |
| Backend API | ❌ No | Static match JSON is enough for this corpus |
| Static JSON preprocessing | ✅ Yes | Fast loads, simple Vercel deploy, easy caching |
| One giant events.json | ❌ No | Per-match files keep filter switches light |
| Canvas-only renderer | ❌ No | Leaflet gives zoom, layers, and interaction for free |
| Keep original 3–11MB minimaps | ❌ No | Re-encode to ~100KB JPEG at 1024² for web |
