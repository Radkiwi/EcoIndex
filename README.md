# Craffft — Fog of Opportunity Map

A live, game-inspired map that reveals New Zealand's food and fibre sector to students as they learn. Built for the Craffft education platform.

---

## What it does

Students start with a dark map of New Zealand — every business hidden behind fog. As they explore interests, complete quests, and engage with real NZ companies, the fog lifts tile by tile to reveal the industry landscape beneath.

Each business moves through five fog states:

| State | Colour | Meaning |
|---|---|---|
| `hidden` | Dark navy | Not yet discovered |
| `visible` | Dim blue | Revealed by proximity or interest |
| `discovered` | Teal | Student has engaged |
| `engaged` | Bright teal (pulse) | Quest in progress |
| `mastered` | Gold | Quest complete |

The fog is rendered as a geohash tile grid (~40km cells) using Mapbox GL JS. When a reveal happens, the tiles around that business animate from dark to clear in real time — backed live by Airtable.

---

## Tech stack

| Layer | Tool |
|---|---|
| Server | Node.js + Express |
| Map | Mapbox GL JS v3 |
| Database | Airtable (Business Nodes, Quests, Map Tiles) |
| Geohashing | ngeohash |
| Config | dotenv |

---

## Project structure

```
craffft-fog-map/
├── src/
│   ├── airtable/
│   │   ├── client.js          # Lazy-loaded Airtable base connection
│   │   ├── businesses.js      # Read/update Business Nodes table
│   │   └── tiles.js           # Read Map Tiles table
│   ├── map/
│   │   ├── tileEngine.js      # coordsToTile, tileNeighbours, tilesForRegion
│   │   └── fogLayer.js        # Builds full NZ GeoJSON tile grid
│   ├── fog/
│   │   ├── fogEngine.js       # Fog state transitions (reveal, discover, quest)
│   │   └── fogRoutes.js       # Express routes for /api/fog/*
│   └── server.js              # Main Express server
├── public/
│   └── index.html             # Mapbox map + fog controls + sidebar
├── scripts/
│   └── assignTiles.js         # One-off: geohash all businesses into Map Tiles
├── .env.example               # Environment variable template
└── package.json
```

---

## Setup

### 1. Clone and install

```bash
git clone https://github.com/Radkiwi/fog_of_war.git
cd fog_of_war
npm install
```

### 2. Configure environment

Copy `.env.example` to `.env` and fill in your keys:

```bash
cp .env.example .env
```

```env
AIRTABLE_API_KEY=      # Personal access token from airtable.com/create/tokens
AIRTABLE_BASE_ID=      # Your base ID (starts with "app")
MAPBOX_TOKEN=          # Public token from account.mapbox.com
```

The Airtable table IDs are already populated in `.env.example` if you're using the Craffft base.

### 3. Run

```bash
npm run dev       # Development (auto-restarts on file changes)
npm start         # Production
```

Open **http://localhost:3000**

### 4. Assign tiles (first run only)

Run once to geohash all seeded businesses into the Map Tiles table:

```bash
node scripts/assignTiles.js
```

---

## API

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/health` | Server status |
| `GET` | `/api/businesses` | All business nodes |
| `GET` | `/api/tiles` | Full NZ fog grid as GeoJSON |
| `POST` | `/api/fog/reveal-proximity` | Reveal tiles near `{ lat, lng, radius }` |
| `POST` | `/api/fog/reveal-interest` | Reveal by `{ tags: ["horticulture"] }` |
| `POST` | `/api/fog/discover` | `visible → discovered` for `{ businessId }` |
| `POST` | `/api/fog/start-quest` | `discovered → engaged` |
| `POST` | `/api/fog/complete-quest` | `engaged → mastered` |

---

## Airtable schema

**Business Nodes** — the core map entities  
Fields: Name, Industry Type, Latitude, Longitude, Region, Size, Tags, Engagement Level, Quest IDs

**Quests** — learning activities linked to businesses  
Fields: Title, Difficulty, Format, Curriculum Alignment, Estimated Time, Outcomes, Business Node

**Map Tiles** — geohash tile fog states  
Fields: Tile ID, Geohash, Region, Fog State, Business Count

---

## Pilot businesses (Phase 1 seed data)

| Business | Type | Region |
|---|---|---|
| Northland Dairy Co-op | Dairy | Northland |
| Gisborne Garlic & Citrus Growers | Horticulture | Gisborne |
| Tāmaki Food Processing Ltd | Food processing | Auckland |
| AgriBot NZ | Robotics | Auckland |
| Plant & Food Research — Ruakura | Research | Waikato |

---

## Roadmap

- **Phase 2** — Quest builder: link Minecraft/field quests to business nodes
- **Phase 3** — Student profiles: fog state persists per student/class
- **Phase 4** — Teacher dashboard: class fog view, reveal triggers, quest tracking
- **Phase 5** — Mobile: student location triggers proximity reveals in the field
