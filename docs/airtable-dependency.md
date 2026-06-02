# Airtable Dependency Guide
## Craffft Fog of Opportunity Map

---

## What Airtable does in this app

Airtable acts as the live database. Every business node, fog state, and quest lives in Airtable — the map reads from it on load and writes back to it every time fog is revealed or a quest state changes.

There are **3 tables**, each with a distinct role.

---

## Table 1 — Business Nodes

**What it stores:** The 5 NZ food & fibre companies that appear as markers on the map.

| Field | Purpose |
|---|---|
| Name | Displayed in marker popup and sidebar |
| Industry Type | Used for "reveal by interest" filtering |
| Latitude / Longitude | Where the marker is placed on the map |
| Region | Displayed in sidebar |
| Size | SME / enterprise / research / community |
| Tags | Used for interest-based fog reveals (e.g. "horticulture") |
| Engagement Level | **The fog state** — hidden → visible → discovered → engaged → mastered |
| Quest IDs | Links to quests (Phase 2) |

**Read by:** `GET /api/businesses` — called every time the map loads or refreshes  
**Written by:** Every fog action (reveal, discover, start-quest, complete-quest)

**Current records: 5** (well within any Airtable plan)

---

## Table 2 — Map Tiles

**What it stores:** The fog state of each ~40km geohash tile across NZ. Only tiles that have been interacted with are stored here — the rest default to `hidden`.

| Field | Purpose |
|---|---|
| Tile ID | Unique identifier (`tile_<geohash>`) |
| Geohash | The geohash string (e.g. `rbds`) |
| Region | Region name if known |
| Fog State | `hidden` / `visible` / `explored` — drives the fog fill layer opacity |
| Business Count | How many businesses are in this tile |

**Read by:** `GET /api/tiles` — builds the full NZ GeoJSON fog grid on every map load  
**Written by:** `revealByProximity` and `revealByInterest` — upserts tile records when fog lifts

**Current records: ~9** (grows as more areas are revealed)

---

## Table 3 — Quests

**What it stores:** Learning quests linked to businesses. Not yet active in Phase 1 — set up and ready for Phase 2.

| Field | Purpose |
|---|---|
| Title | Quest name |
| Difficulty | beginner / intermediate / advanced |
| Format | minecraft / field / hybrid |
| Curriculum Alignment | NZ curriculum links |
| Estimated Time | Minutes |
| Outcomes | What students learn |
| Business Node | Link to the Business Nodes table |

**Read by:** Not yet wired up  
**Written by:** Not yet wired up  
**Current records: 0**

---

## What breaks without Airtable

| Feature | Impact |
|---|---|
| Map markers | ❌ No businesses load — map shows fog only |
| Fog reveal buttons | ❌ API returns 500 errors |
| Business sidebar list | ❌ Shows empty |
| Fog tile layer | ❌ Defaults all tiles to hidden (map still renders, fog just never lifts) |

The Mapbox map itself still loads — it just has no data in it.

---

## Do you need a paid Airtable plan?

**No.** The free tier is sufficient for this entire MVP and well into Phase 2.

| Airtable Free Tier | This app's usage |
|---|---|
| 1,000 records per base | ~14 records currently, ~200 at full pilot scale |
| Unlimited bases | Using 1 base (MRK Flo 2026) |
| Full API access | Required — used for all reads and writes |
| 100 automation runs/month | Not using automations |

**Recommendation:** Stay on Airtable free. You only need a paid plan if you exceed 1,000 records or need advanced features like revision history or admin controls.

---

## Alternatives to Airtable (if needed later)

| Option | Effort to migrate | Notes |
|---|---|---|
| **Supabase** (Postgres) | Medium | Free tier, open source, great API |
| **PlanetScale** (MySQL) | Medium | Free tier, scales well |
| **MongoDB Atlas** | Medium | Free tier, flexible schema |
| **JSON files on Railway** | Low | Only viable for static/demo data — no persistence across deploys |

A migration would involve replacing the 3 files in `src/airtable/` with equivalents for the new database. The rest of the app (fog engine, routes, map) would be unchanged.

---

## Quick fix checklist if the map stops working

1. Check `fog.rad.kiwi/health` — if it returns `{"status":"ok"}`, the server is fine
2. Check `fog.rad.kiwi/api/businesses` — if it returns an error, Airtable is the issue
3. Log into airtable.com → confirm the **MRK Flo 2026** base still exists
4. Confirm the personal access token (`patsF6GqjGvvfWGjp...`) hasn't expired (tokens don't expire unless you delete them)
5. Check Railway → Variables tab — confirm all 3 env vars are set
