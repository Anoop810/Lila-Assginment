# INSIGHTS

Three findings from the Feb 10–14, 2026 LILA BLACK telemetry, explored in this tool.  
Each insight answers: **what happened → why it likely happens → what a Level Designer should do**.

---

## Insight 1 — Loot is the magnet; combat is the consequence

### What you see
On Ambrose Valley, kill heatmaps and loot markers light up in the **same** pockets. Combat does not look random across the map.

### Why (the explainable part)
Players need loot to survive and extract. High-value pockets pull multiple players into the same small space at overlapping times, so fights are a **downstream effect of economy placement**, not an independent “combat layer.”

That story shows up in the numbers:

| Signal | Value | What it means |
| --- | --- | --- |
| Kills within ~80px of a loot event (same match) | **90.6%** (2,190 / 2,418) | Almost every fight is spatially tied to looting |
| Top kill cell `(8,8)` | 143 kills · 420 loot | Hottest fight zone is also a loot sink |
| Cell `(8,12)` | 88 kills · 533 loot | Even richer loot, still contested |
| Top 10% of kill-cells | **~41%** of Ambrose kills | A few POIs dominate the PvP surface |
| Loot timing | 36% early / 38% mid / 26% late | Looting front-loads the match |
| Kill timing | 24% early / 40% mid / 36% late | Fights peak **after** early loot |
| Death timing | **69% late** | Players die after the map has funneled them |

**Causal chain:** early loot pull → mid-match contest on the same cells → late deaths near those economies.

### Why a Level Designer should care
If a POI feels “too spicy,” tuning guns or AI may not fix it. The root lever is often **how much loot (and how unique it is) sits in that footprint**.

### Actionable next steps
1. Tag the top 5 loot/kill cells as named POIs and track **kills per loot pickup** weekly.
2. Split or duplicate the richest caches (e.g. cell `(9,6)` has **8.2 loot/kill** — high bait, still contested).
3. Add a second approach / soft cover so contested loot is not a single chokepoint.
4. **Verify in tool:** Ambrose Valley → Heatmap **Kills** → toggle **Loot** on → scrub timeline on a long match (`duration` 10+ min). Watch loot markers appear first, then kills stack on the same pixels.

---

## Insight 2 — Storm only punishes long survivors (endgame filter, not mid-game pressure)

### What you see
Storm deaths are rare on the map — and when they appear, they show up at the **end** of long matches.

### Why (the explainable part)
The storm is not acting like a continuous “keep moving” pressure across the whole lobby. It behaves like a **late filter**: only players who already survived combat/loot long enough ever die to it.

| Signal | Value | What it means |
| --- | --- | --- |
| Storm deaths | **39** across **796** matches (~5%) | Most matches never show a storm kill |
| Storm timing | **100%** in the final third of the match | Zero early/mid storm kills in this sample |
| Avg match length **with** a storm death | **~752s** | |
| Avg match length **without** | **~391s** | Storm victims played ~**2×** longer |
| Vs player kills | 39 storm vs **2,418** kills | Combat removes far more players than storm |

**Causal chain:** short matches end via combat/extract before storm matters → only long runs reach lethal storm → storm death rate looks tiny even if storm damage is “correct” for endgame.

So the design question is not only “is storm too weak?” but **“is storm supposed to reshape mid-match rotation, or only clean up endgame campers?”** This data matches the second job much more than the first.

### Why a Level Designer should care
If the fantasy is “the wall forces everyone to rotate by mid-game,” this week’s telemetry says that fantasy is not landing. Players are mostly deleted by other players first.

### Actionable next steps
1. Decide the intended job of storm: **mid-game rotation driver** vs **endgame sweeper**.
2. If rotation driver: pull storm damage/timing earlier; measure `% of players who relocate before 50% match time`.
3. If endgame sweeper: keep current timing, but add readable telegraphs so the rare storm death feels fair (those players invested ~12 minutes).
4. Separately QA telemetry: 39 events is small — confirm `KilledByStorm` is fully instrumented.
5. **Verify in tool:** Events → **Storm** only → sort to longer matches → timeline at the end. Compare with **Kills** heatmap density.

---

## Insight 3 — The map plays like a few busy corridors, not a full battlefield

### What you see
Traffic heatmaps show bright veins and large dark regions. Large parts of each minimap barely appear in position samples.

### Why (the explainable part)
Players do not explore evenly. They follow **reward + safety paths** (loot routes, cover lines, extract approaches). Once those routes are known, the rest of the art space becomes scenery.

| Map | Cells with any traffic | Share of map grid | Traffic in busiest 10% of used cells |
| --- | --- | --- | --- |
| Ambrose Valley | 440 / 1024 | **43%** | **40%** of all traffic |
| Grand Rift | 376 / 1024 | **37%** | **34%** |
| Lockdown | 329 / 1024 | **32%** | **36%** |

Combined with Insight 1: the busy corridors are the same places loot and kills concentrate. Empty space is not “mysterious wilderness players choose” — it is **space without a reason to enter**.

Median human path length on the minimap is ~902px (bots ~727px) on a 1024px map — players traverse a lot of distance, but repeatedly through the same channels rather than filling the grid.

**Causal chain:** loot/extract placement defines routes → routes get learned → traffic + kills reinforce those routes → cold zones stay cold.

### Why a Level Designer should care
You are paying for collision, art, and lighting on ground that almost never hosts a decision. Either give that ground a job, or reclaim the budget.

### Actionable next steps
1. Overlay Traffic + Loot: any cold quadrant with **zero loot and zero extract** is a candidate for a secondary objective.
2. Move 10–20% of low-tier loot from the hottest cells into cold flanks; remeasure occupied-cell % and top-10% traffic share.
3. Success criteria example: Ambrose occupied cells **43% → 55%+** without increasing kill concentration in the old top cells.
4. **Verify in tool:** Heatmap **Traffic** at full duration on each map; then toggle loot/kills. Cold zones with no markers are the redesign targets.

---

## How these three fit together

```
Loot placement
    ↓
Attracts paths (traffic corridors)
    ↓
Creates contested POIs (kills)
    ↓
Combat ends most matches early
    ↓
Storm only touches the long survivors
```

That is one coherent system story for LDs: **economy shapes movement; movement shapes fights; fights starve the storm of victims; large map areas never enter the loop.**

Use the viewer to show that loop live — not just the summary table above.
