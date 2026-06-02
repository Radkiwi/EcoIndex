require('dotenv').config();
const ngeohash = require('ngeohash');
const base = require('../airtable/client');

const TABLE_MAP_TILES = process.env.AIRTABLE_TABLE_MAP_TILES;

// NZ region bounding boxes [minLat, minLng, maxLat, maxLng]
const REGION_BOUNDS = {
  northland: [-36.0, 173.0, -34.4, 174.8],
  gisborne:  [-39.2, 177.0, -37.5, 178.7],
};

/**
 * Convert lat/lng to a geohash tile ID.
 */
function coordsToTile(lat, lng, precision = 5) {
  return ngeohash.encode(lat, lng, precision);
}

/**
 * Return the 8 neighbouring geohash tiles for a given hash.
 */
function tileNeighbours(geohash) {
  return ngeohash.neighbors(geohash);
}

/**
 * Return all geohash tile IDs covering a named NZ region (precision 4 — ~40km cells).
 */
function tilesForRegion(regionName) {
  const bounds = REGION_BOUNDS[regionName.toLowerCase()];
  if (!bounds) throw new Error(`Unknown region: ${regionName}. Available: ${Object.keys(REGION_BOUNDS).join(', ')}`);
  const [minLat, minLng, maxLat, maxLng] = bounds;
  return ngeohash.bboxes(minLat, minLng, maxLat, maxLng, 4);
}

/**
 * Upsert a Map Tile record for a Business Node.
 * Checks for existing tile before creating.
 */
async function assignBusinessToTile(business) {
  const lat = business.fields['Latitude'] ?? business.fields['fldFcvnEoHpJGsGVz'];
  const lng = business.fields['Longitude'] ?? business.fields['fldsihCXK5sVjgS07'];
  const name = business.fields['Name'] ?? business.fields['fldfcuWEdRkt7pl82'];
  const region = business.fields['Region'] ?? business.fields['fldNpRlm1TTvis7ta'];

  if (lat == null || lng == null) throw new Error(`Business "${name}" missing coordinates`);

  const geohash = coordsToTile(lat, lng);
  const tileId = `tile_${geohash}`;

  // Check if tile already exists
  const existing = await base(TABLE_MAP_TILES)
    .select({ filterByFormula: `{Tile ID} = "${tileId}"`, maxRecords: 1 })
    .firstPage();

  if (existing.length > 0) {
    // Increment business count
    const current = existing[0].fields['Business Count'] || 0;
    await base(TABLE_MAP_TILES).update(existing[0].id, { 'Business Count': current + 1 });
    console.log(`  ↑ Updated tile ${tileId} (count: ${current + 1}) for "${name}"`);
    return existing[0];
  }

  // Create new tile
  const record = await base(TABLE_MAP_TILES).create({
    'Tile ID': tileId,
    'Geohash': geohash,
    'Region': region || '',
    'Fog State': 'hidden',
    'Business Count': 1,
  });

  console.log(`  + Created tile ${tileId} (geohash: ${geohash}) for "${name}"`);
  return record;
}

module.exports = { coordsToTile, tileNeighbours, tilesForRegion, assignBusinessToTile };
