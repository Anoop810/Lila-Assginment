# INSIGHTS

Three findings from the Feb 10–14, 2026 LILA BLACK telemetry (796 matches), explored in this tool.

---

## Insight 1 — Combat Hotspots are Concentrated Around High-Value POIs

### What caught my eye

The kill heatmap shows that combat is highly concentrated around a small number of Points of Interest (POIs), while large sections of the map experience relatively little player interaction.

### Supporting Evidence

* Approximately **31%** of all Ambrose Valley kills occurred within **5** major hotspot cells; the busiest **10%** of kill-cells carry **~41%** of Ambrose kills.
* The highest-density combat area was **Ambrose Valley grid cell (8, 8)** — **143 kills** (and **420** nearby loot pickups in the same economy pocket).
* Player traffic heatmaps closely overlap with kill density (same cells dominate both layers), indicating these locations naturally attract players.
* **90.6%** of all kills (2,190 / 2,418) occurred within ~80px of a loot event in the same match.

### Actionable Insight

Players are converging on a limited number of high-value areas, creating predictable engagements while leaving other sections of the map underutilized.

**Potential Actions**

* Redistribute high-tier loot across additional locations.
* Introduce secondary objectives in low-traffic regions.
* Adjust extraction or mission placement to encourage wider map exploration.
* Split the richest caches (e.g. cell `(9, 6)` has **8.2** loot/kill) so one footprint is not the only magnet.

### Metrics Likely Affected

* Heatmap distribution
* Player movement diversity
* Average survival time
* Engagement distribution across the map

### Why a Level Designer Should Care

Balanced player distribution creates more varied encounters, improves exploration, and ensures that the entire map contributes to gameplay rather than only a handful of locations.

**Verify in tool:** Ambrose Valley → Heatmap **Kills** → toggle **Loot** on → scrub a long match.

---

## Insight 2 — Storm Eliminations Increase During Late Match Phases

### What caught my eye

Timeline playback reveals that storm deaths become significantly more common during the final phase of a match — and almost never appear earlier.

### Supporting Evidence

* **100%** of all storm eliminations (**39 / 39**) occurred during the final **third** of the match (median storm death at **~99.9%** of match duration).
* Storm deaths were more common toward the **map interior** (**77%** / 30 of 39 center vs **23%** edge), suggesting players who survive combat still struggle to finish rotations safely.
* Matches with a storm death lasted **~752s** on average vs **~391s** without — storm victims played roughly **2×** longer before dying.
* Storm removes far fewer players than combat: **39** storm deaths vs **2,418** player kills across the sample.

### Actionable Insight

Late-game rotations may be too punishing, or the storm may only be doing endgame cleanup rather than forcing mid-match movement.

**Potential Actions**

* Review storm timing and movement speed (decide: mid-game rotation driver vs endgame sweeper).
* Add additional traversal paths or cover on common late-match routes.
* Reposition extraction locations relative to storm progression.
* Confirm `KilledByStorm` instrumentation — 39 events is a small sample.

### Metrics Likely Affected

* Storm death rate
* Match completion rate
* Average extraction success
* Player retention

### Why a Level Designer Should Care

Deaths caused by environmental pressure instead of player interaction can reduce perceived fairness and make matches feel less skill-based — especially for players who already invested ~12 minutes.

**Verify in tool:** Events → **Storm** only → open a long match → jump the timeline to the end.

---

## Insight 3 — Human and Bot Behaviour Differs Significantly

### What caught my eye

Visual comparison between human players and bots shows noticeably different movement and engagement patterns.

### Supporting Evidence

* Bots concentrate traffic on a different set of cells than humans (only **7** of the top **20** path cells overlap). Top bot traffic sits around Ambrose cells like **(4, 10)** and **(5, 9)**; humans peak at contested loot cells **(8, 8)** and **(8, 9)**.
* Human players travel farther: median path length **~905px** vs bots **~727px** on the 1024px minimap — longer rotations toward high-value objectives.
* Human-versus-player combat dominates hotspots: **2,235** human-attributed kills vs **183** bot-attributed. Top human kill cell is Ambrose **(8, 8)** (139); bots peak nearby at **(6, 7)** (19) with much lower volume.

### Actionable Insight

Bot placement currently provides limited interaction relative to where humans actually fight and loot.

**Potential Actions**

* Improve bot patrol routes toward human traffic / loot corridors.
* Increase patrol randomness.
* Place bots in underutilized regions to naturally attract player traffic.
* Adjust bot spawn density based on player heatmaps.

### Metrics Likely Affected

* Human-bot encounter frequency
* Engagement diversity
* Map coverage
* Average session duration

### Why a Level Designer Should Care

Bots strongly influence pacing, exploration, and perceived map population. Better bot placement helps maintain action throughout the map instead of concentrating gameplay into only a few locations.

**Verify in tool:** Toggle **Humans** / **Bots** filters → Heatmap **Traffic** → compare blue vs green paths on Ambrose Valley.

---

## Summary

The visualization tool highlighted three key gameplay patterns:

1. Combat is concentrated around a few high-value locations (loot-driven POIs).
2. Storm pressure almost exclusively drives late-game eliminations.
3. Human and bot movement patterns differ considerably, presenting opportunities to improve map pacing and encounter distribution.

These insights demonstrate how telemetry visualization can directly support level design decisions by turning raw gameplay data into actionable design improvements.
