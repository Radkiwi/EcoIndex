#!/usr/bin/env bash
# Downloads all 17 Eco-index GIS layers from Koordinates as GeoPackage (.gpkg)
# Requires a free Koordinates API key: https://koordinates.com/tokens/create/
#
# Usage:
#   export KOORDINATES_API_KEY=your_key_here
#   bash scripts/download-gis-layers.sh

set -e

BASE_URL="https://eco-index.koordinates.com"
FORMAT="application/x-ogc-gpkg"
OUT_DIR="$(dirname "$0")/../data"

if [ -z "$KOORDINATES_API_KEY" ]; then
  echo "ERROR: Set KOORDINATES_API_KEY before running."
  echo "  Get a free key at: https://koordinates.com/tokens/create/"
  echo "  Then: export KOORDINATES_API_KEY=your_key_here"
  exit 1
fi

declare -A LAYERS=(
  # Core layers
  ["catchments/eco-index-catchments-nz.gpkg"]="115002"
  ["land-cover/eco-index-land-cover-snapshot-nz.gpkg"]="122933"
  ["ecosystem-projector/eco-index-ecosystem-projector-nz.gpkg"]="120435"

  # Ecosystem Services Valuer (two versions)
  ["ecosystem-services-valuer/esv-existing-areas.gpkg"]="124005"
  ["ecosystem-services-valuer/esv-reconstruction-areas.gpkg"]="124006"

  # Costings
  ["costings/reconstruction-costings-nz.gpkg"]="122940"
  ["costings/maintenance-costings-nz.gpkg"]="122939"

  # Navigator scoring layers (A01–A10)
  ["navigator-layers/A01-threatened-environment.gpkg"]="123995"
  ["navigator-layers/A02-connectivity.gpkg"]="123996"
  ["navigator-layers/A03-native-vegetation-proximity.gpkg"]="123997"
  ["navigator-layers/A04-legal-protection.gpkg"]="123998"
  ["navigator-layers/A05-relative-affordability.gpkg"]="123999"
  ["navigator-layers/A06-riparian-benefit.gpkg"]="124001"
  ["navigator-layers/A07-native-vegetation-shape.gpkg"]="124002"
  ["navigator-layers/A08-protective-buffer.gpkg"]="124003"
  ["navigator-layers/A09-land-stability.gpkg"]="124004"
  ["navigator-layers/A10-ecosystem-15pct-cover-goal.gpkg"]="122938"
)

echo "Downloading ${#LAYERS[@]} layers to $OUT_DIR ..."
echo ""

SUCCESS=0
SKIP=0
FAIL=0

for OUTPATH in "${!LAYERS[@]}"; do
  LAYER_ID="${LAYERS[$OUTPATH]}"
  DEST="$OUT_DIR/$OUTPATH"
  DIR="$(dirname "$DEST")"
  mkdir -p "$DIR"

  if [ -f "$DEST" ]; then
    echo "  [skip] $OUTPATH (already exists)"
    ((SKIP++)) || true
    continue
  fi

  echo -n "  [fetch] Layer $LAYER_ID → $OUTPATH ... "

  # Request an export
  EXPORT_RESPONSE=$(curl -s -X POST \
    -H "Authorization: key $KOORDINATES_API_KEY" \
    -H "Content-Type: application/json" \
    -d "{\"items\":[{\"item\":\"$BASE_URL/services/api/v1/layers/$LAYER_ID/\"}],\"formats\":{\"vector\":\"$FORMAT\"},\"crs\":\"EPSG:4326\"}" \
    "$BASE_URL/services/api/v1/exports/")

  DOWNLOAD_URL=$(echo "$EXPORT_RESPONSE" | python3 -c "import sys,json; d=json.load(sys.stdin); print(d.get('download_url',''))" 2>/dev/null)

  if [ -z "$DOWNLOAD_URL" ]; then
    # Export may be async — poll for completion
    EXPORT_URL=$(echo "$EXPORT_RESPONSE" | python3 -c "import sys,json; d=json.load(sys.stdin); print(d.get('url',''))" 2>/dev/null)
    if [ -z "$EXPORT_URL" ]; then
      echo "FAILED (could not create export)"
      ((FAIL++)) || true
      continue
    fi

    for i in $(seq 1 20); do
      sleep 3
      POLL=$(curl -s -H "Authorization: key $KOORDINATES_API_KEY" "$EXPORT_URL")
      STATE=$(echo "$POLL" | python3 -c "import sys,json; d=json.load(sys.stdin); print(d.get('state',''))" 2>/dev/null)
      DOWNLOAD_URL=$(echo "$POLL" | python3 -c "import sys,json; d=json.load(sys.stdin); print(d.get('download_url',''))" 2>/dev/null)
      if [ "$STATE" = "complete" ] && [ -n "$DOWNLOAD_URL" ]; then break; fi
      if [ "$STATE" = "failed" ]; then break; fi
    done
  fi

  if [ -z "$DOWNLOAD_URL" ]; then
    echo "FAILED (export timed out or errored)"
    ((FAIL++)) || true
    continue
  fi

  curl -s -L -H "Authorization: key $KOORDINATES_API_KEY" -o "$DEST" "$DOWNLOAD_URL"
  SIZE=$(du -sh "$DEST" 2>/dev/null | cut -f1)
  echo "done ($SIZE)"
  ((SUCCESS++)) || true
done

echo ""
echo "Complete: $SUCCESS downloaded, $SKIP skipped, $FAIL failed"
echo "Data saved to: $OUT_DIR"
