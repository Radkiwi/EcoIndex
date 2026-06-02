const ngeohash = require('ngeohash');

// NZ bounding box — covers North + South Island + Stewart Island
const NZ_BOUNDS = { minLat: -47.5, minLng: 165.5, maxLat: -34.0, maxLng: 178.6 };

// Precision 4 = ~39km × 20km cells — good resolution at NZ national zoom
const FOG_PRECISION = 4;

/**
 * Convert a geohash to a GeoJSON Polygon feature.
 */
function geohashToFeature(hash, fogState = 'hidden') {
  const [minLat, minLng, maxLat, maxLng] = ngeohash.decode_bbox(hash);
  return {
    type: 'Feature',
    properties: { geohash: hash, fogState },
    geometry: {
      type: 'Polygon',
      coordinates: [[
        [minLng, minLat],
        [maxLng, minLat],
        [maxLng, maxLat],
        [minLng, maxLat],
        [minLng, minLat],
      ]],
    },
  };
}

/**
 * Build a GeoJSON FeatureCollection of all NZ fog tiles.
 * tileStates: { [geohash]: 'hidden' | 'visible' | 'explored' }
 */
function buildFogGeoJSON(tileStates = {}) {
  const hashes = ngeohash.bboxes(
    NZ_BOUNDS.minLat, NZ_BOUNDS.minLng,
    NZ_BOUNDS.maxLat, NZ_BOUNDS.maxLng,
    FOG_PRECISION
  );

  const features = hashes.map(hash =>
    geohashToFeature(hash, tileStates[hash] || 'hidden')
  );

  return { type: 'FeatureCollection', features };
}

module.exports = { buildFogGeoJSON, FOG_PRECISION };
