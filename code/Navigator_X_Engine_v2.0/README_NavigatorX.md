# Eco‑index Navigator X – End‑to‑End Setup Guide

This README documents the **exact steps and commands** to build and publish a working Navigator X map for any area — from raw GeoJSON to a single HTML file you can paste into a **Squarespace Code Block**.

It’s designed to be copy‑paste friendly for **macOS/Linux (bash)** and **Windows (PowerShell)**, with notes on Docker, Mapbox tokens, tippecanoe, tileset IDs, local testing, and the “single‑file” inliner used for Squarespace.

---

## 0) Prereqs & one‑time setup

### A. Install Docker
- **macOS**: Install Docker Desktop.
- **Windows**: Install Docker Desktop, enable WSL2.
- **Linux**: Install `docker` from your distro and add your user to the `docker` group (log out/in).

> We’ll run `tippecanoe` via a Docker image so you don’t have to install it locally.

### B. Get a Mapbox access token
- Go to the Eco-index Mapbox account (contact admin as the login details are available on Bitwarden) and use the existing **token** with Tilesets + Styles read permissions.
- In code, you’ll see the token already in the app.js file:  
  ```js
  mapboxgl.accessToken = "YOUR_MAPBOX_ACCESS_TOKEN";
  ```
  (You’ll see this in `app.js` / final HTML.)

### C. Project structure (suggested)
```
project/
  data/
    navigator/                      # input GeoJSON for the navigator all prioritisation
    reference_layers/               # input GeoJSON for boundaries, catchments, eco_proj, land_snap etc.
  tilesets/
    Navigator_Layers_<Area>.mbtiles
    Reference_Layers_<Area>.mbtiles
  web/
    index.html
    app.js
    styles.css
    squarespace_files/              # output folder for single-file HTML
```
You can use your own layouts; just adjust paths in commands.

---

## 1) Build MBTiles with tippecanoe (Docker)

Below are the exact Docker commands you used plus matching PowerShell. They will produce `.mbtiles` files ready to upload to Mapbox.

> **Tip**: For large input files, mount the project root to `/data` inside the container so paths are short and predictable.

### A. Navigator (prioritisation surface)

- **bash (macOS/Linux):**
  ```bash
  docker run --rm --entrypoint /bin/sh \
    -v "${PWD}:/data" \
    morlov/tippecanoe:latest \
    -c "tippecanoe -z12 -Z0 -S10 -pS \
        -o /data/tilesets/Navigator_Layers_Waikato.mbtiles \
        /data/data/navigator/A00_Navigator_All_Priotisation_Options_waikato.geojson \
        --force"
  ```

- **PowerShell (Windows):**
  ```powershell
  docker run --rm --entrypoint /bin/sh `
    -v "${PWD}:/data" `
    morlov/tippecanoe:latest `
    -c "tippecanoe -z12 -Z0 -S10 -pS -o /data/tilesets/Navigator_Layers_Waikato.mbtiles /data/data/navigator/A00_Navigator_All_Priotisation_Options_waikato.geojson --force"
  ```

### B. Reference layers (contextual info)

If your reference layers are multiple GeoJSONs (e.g., boundary, catchments, land cover, ecosystem projector), tippecanoe can merge them into a single tileset by keeping attribute names consistent across files. A good starting command (inspired by the comments present in your `app.js` file) is:

- **bash (macOS/Linux):**
  ```bash
  docker run --rm --entrypoint /bin/sh \
    -v "${PWD}:/data" \
    morlov/tippecanoe:latest \
    -c "tippecanoe -z12 -Z0 -S10 -pS \
        -o /data/tilesets/Reference_Layers_Waikato.mbtiles \
        /data/data/reference_layers/*.geojson \
        --force"
  ```

- **PowerShell (Windows):**
  ```powershell
  docker run --rm --entrypoint /bin/sh `
    -v "${PWD}:/data" `
    morlov/tippecanoe:latest `
    -c "tippecanoe -z12 -Z0 -S10 -pS -o /data/tilesets/Reference_Layers_Waikato.mbtiles /data/data/reference_layers/*.geojson --force"
  ```

> If you need to **promote IDs** for hover/feature‑state effects, ensure your source GeoJSON has a stable `ID` field. You can also limit properties with `-y` flags, e.g. `-y ExpectedEcosystemType -y ID` etc.

---

## 2) Upload MBTiles to Mapbox

You have two main options:

Mapbox Studio (GUI)
1. Open **Mapbox Studio → Tilesets → New tileset → Upload**.
2. Upload `Navigator_Layers_<Area>.mbtiles` and `Reference_Layers_<Area>.mbtiles`.
3. Once processed, note your **tileset URLs**, e.g.:
   - `mapbox://YOURACCOUNT.<navigator_tileset_id>`
   - `mapbox://YOURACCOUNT.<reference_tileset_id>`

---

## 3) Wire up your tileset IDs in the web app

In your `app.js` (or the final single file), set these variables to the **tileset URLs** from step 2:

```js
// Mapbox token
mapboxgl.accessToken = 'YOUR_MAPBOX_ACCESS_TOKEN';

// Reference tileset (contextual layers, polygons/lines for toggles)
var refTilesetSourceUrl = 'mapbox://YOURACCOUNT.<reference_tileset_id>';

// Navigator tileset (the prioritisation surface / heatmap polygons)
var mangaroaTilesetUrl   = 'mapbox://YOURACCOUNT.<navigator_tileset_id>';
```

Make sure your **layer names** (source‑layer) in code match the **layer names** inside your tilesets (e.g., `A00_Navigator_All_Priotisation_Options_waikato`, `Waikato_Catchments`, `Waikato_Ecosystem_Projector`, `Waikato_Land_Cover_Snapshot`, `WRC_Boundary`).

---

## 4) Local preview during development

You’ve got a tiny Flask server for quick local preview. From the `web/` folder (containing `index.html`, `app.js`, `styles.css`):

```bash
python server.py
```
Then visit `http://127.0.0.1:5000`. (This is optional — you can also open `index.html` directly.)

---

## 5) Create a single self‑contained HTML for Squarespace

Your “inliner” script reads `index.html`, **embeds** `styles.css` and a **minified** `app.js`, and writes a **single HTML** file into `web/squarespace_files/` that you can paste directly into a Squarespace Code Block.

### A. Install Python deps (once)
```bash
pip install chardet rjsmin
```

### B. Run the inliner
From the `web/` folder:
```bash
python generate_single_html_file.py
```
This writes one of:
- `squarespace_files/waikato_regional_council_navx_styled.html`

Open the output HTML, copy everything, and paste into a **Squarespace → Code** block.

> If your project name/area changes, just adjust the output filename inside the script or duplicate the line to create multiple outputs.

---

## 6) Squarespace embedding tips

- Use a **Code Block** (not Markdown) and paste the **entire** inlined HTML.
- If your page uses Squarespace selectors for layout width, keep (or adjust) the CSS rule that targets the page’s block class (e.g., `.fe-6731909e1a3d593bb7e729a2 { max-width: calc(100% - 60px); margin: 0 auto; }`).
- The map UI already includes:
  - **Prioritisation Options** tab with checkbox toggles for each component score
  - **Contextual Info** tab with reference layer toggles
  - **Reconstruction Opportunity Scale** legend
  - **Land Cover Snapshot** legend (auto‑shown when that layer is toggled)
  - Full‑screen button, draggable/minimisable legends, hover popups for Ecosystem Projector and Catchments
  - A simple **disclaimer** modal that the user must accept

---










## 7) Common pitfalls & fixes

- **Wrong tileset IDs** → Check `refTilesetSourceUrl` and `mangaroaTilesetUrl` values exactly.
- **No features on hover** → Ensure the reference tileset has `promoteId: 'ID'` (and your GeoJSON has an `ID` value).
- **Colors/scale look off** → Verify your `interpolate` color stops and that each component attribute is present (e.g., `PixelScore_*` fields). Missing fields are coalesced to 0.
- **Squarepace stripping resources** → Always use the **single‑file** HTML. External JS/CSS links may be blocked.
- **Projection mismatch** → Make sure all input GeoJSON is **EPSG:4326** before tippecanoe.

---

## 8) Copy‑paste snippets (ready to adapt)

### env‑style variables used in `app.js`
```js
mapboxgl.accessToken = 'YOUR_MAPBOX_ACCESS_TOKEN';
var refTilesetSourceUrl = 'mapbox://YOURACCOUNT.<reference_tileset_id>';
var mangaroaTilesetUrl  = 'mapbox://YOURACCOUNT.<navigator_tileset_id>';
```

### tippecanoe (Navigator) – bash
```bash
docker run --rm --entrypoint /bin/sh \
  -v "${PWD}:/data" \
  morlov/tippecanoe:latest \
  -c "tippecanoe -z12 -Z0 -S10 -pS \
      -o /data/tilesets/Navigator_Layers_<Area>.mbtiles \
      /data/data/navigator/<your_navigator>.geojson \
      --force"
```

### tippecanoe (Reference) – bash
```bash
docker run --rm --entrypoint /bin/sh \
  -v "${PWD}:/data" \
  morlov/tippecanoe:latest \
  -c "tippecanoe -z12 -Z0 -S10 -pS \
      -o /data/tilesets/Reference_Layers_<Area>.mbtiles \
      /data/data/reference_layers/*.geojson \
      --force"
```

### Flask local dev
```bash
python server.py
```

---

## 9) Where each thing lives (quick map)

- **UI & behavior**: `index.html`, `styles.css`, `app.js`
- **Mapbox token**: in `app.js` (or final single HTML)
- **Tileset IDs**: in `app.js` as `refTilesetSourceUrl` & `mangaroaTilesetUrl`
- **Local preview**: `server.py`
- **Single‑file maker**: `generate_single_html_file.py`
- **Squarespace target**: output HTML in `web/squarespace_files/`

---

## 10) Credits & notes

- The codebase includes pre‑wired legends, disclaimers, draggable panels, and hover popups for reference layers.
- The app expects component attributes like `PixelScore_threatenv`, `PixelScore_connect`, `PixelScore_vegprox`, etc., and renders an interpolated color ramp over their sum (with `coalesce` to 0 when absent).

Happy mapping!
