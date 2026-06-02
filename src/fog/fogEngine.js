require('dotenv').config();
const base = require('../airtable/client');
const { coordsToTile, tileNeighbours } = require('../map/tileEngine');

const TABLE_BUSINESSES = process.env.AIRTABLE_TABLE_BUSINESS_NODES;
const TABLE_TILES      = process.env.AIRTABLE_TABLE_MAP_TILES;

// ─── helpers ──────────────────────────────────────────────────────────────────

async function getAll(table, formula) {
  const records = [];
  const opts = formula ? { filterByFormula: formula } : {};
  await base(table).select(opts).eachPage((page, next) => {
    records.push(...page);
    next();
  });
  return records;
}

async function updateBusiness(id, fields) {
  return base(TABLE_BUSINESSES).update(id, fields);
}

async function updateTile(id, fields) {
  return base(TABLE_TILES).update(id, fields);
}

async function upsertTile(geohash, fogState) {
  const existing = await getAll(TABLE_TILES, `{Geohash} = "${geohash}"`);
  if (existing.length > 0) {
    if (existing[0].fields['Fog State'] === 'hidden') {
      await updateTile(existing[0].id, { 'Fog State': fogState });
    }
  } else {
    await base(TABLE_TILES).create({
      'Tile ID': `tile_${geohash}`,
      'Geohash': geohash,
      'Fog State': fogState,
      'Business Count': 0,
    });
  }
}

// ─── fog actions ──────────────────────────────────────────────────────────────

/**
 * Reveal all businesses within radiusKm of a lat/lng.
 * Uses geohash proximity rather than exact distance for performance.
 */
async function revealByProximity(studentLat, studentLng, radiusKm = 50) {
  const centreHash = coordsToTile(studentLat, studentLng, 4); // ~40km cells
  const nearby = [centreHash, ...tileNeighbours(centreHash)];

  const allBusinesses = await getAll(TABLE_BUSINESSES, `{Engagement Level} = "hidden"`);
  const revealed = [];

  for (const biz of allBusinesses) {
    const lat = biz.fields['Latitude'];
    const lng = biz.fields['Longitude'];
    if (lat == null || lng == null) continue;

    const bizHash = coordsToTile(lat, lng, 4);
    if (nearby.includes(bizHash)) {
      await updateBusiness(biz.id, { 'Engagement Level': 'visible' });
      revealed.push({ id: biz.id, name: biz.fields['Name'] });
    }
  }

  // Upsert tile fog states (create if not yet in Airtable)
  for (const hash of nearby) {
    await upsertTile(hash, 'visible');
  }

  return revealed;
}

/**
 * Reveal businesses whose Tags overlap with the given interest tags.
 */
async function revealByInterest(interestTags = []) {
  if (!interestTags.length) return [];

  const allBusinesses = await getAll(TABLE_BUSINESSES, `{Engagement Level} = "hidden"`);
  const revealed = [];

  for (const biz of allBusinesses) {
    const tags = biz.fields['Tags'] || [];
    const match = tags.some(t => interestTags.map(i => i.toLowerCase()).includes(t.toLowerCase()));
    if (match) {
      await updateBusiness(biz.id, { 'Engagement Level': 'visible' });
      revealed.push({ id: biz.id, name: biz.fields['Name'], tags });
      // Reveal the business tile + neighbours
      const lat = biz.fields['Latitude'];
      const lng = biz.fields['Longitude'];
      if (lat != null && lng != null) {
        const { coordsToTile, tileNeighbours: neighbours } = require('../map/tileEngine');
        const hash = coordsToTile(lat, lng, 4);
        for (const h of [hash, ...neighbours(hash)]) {
          await upsertTile(h, 'visible');
        }
      }
    }
  }

  return revealed;
}

/**
 * Transition: visible → discovered
 */
async function discoverBusiness(businessId) {
  const record = await base(TABLE_BUSINESSES).find(businessId);
  if (record.fields['Engagement Level'] !== 'visible') {
    throw new Error(`Business must be "visible" to discover (current: ${record.fields['Engagement Level']})`);
  }
  return updateBusiness(businessId, { 'Engagement Level': 'discovered' });
}

/**
 * Transition: discovered → engaged
 */
async function startQuest(businessId) {
  const record = await base(TABLE_BUSINESSES).find(businessId);
  if (record.fields['Engagement Level'] !== 'discovered') {
    throw new Error(`Business must be "discovered" to start a quest (current: ${record.fields['Engagement Level']})`);
  }
  return updateBusiness(businessId, { 'Engagement Level': 'engaged' });
}

/**
 * Transition: engaged → mastered
 */
async function completeQuest(businessId) {
  const record = await base(TABLE_BUSINESSES).find(businessId);
  if (record.fields['Engagement Level'] !== 'engaged') {
    throw new Error(`Business must be "engaged" to complete quest (current: ${record.fields['Engagement Level']})`);
  }
  return updateBusiness(businessId, { 'Engagement Level': 'mastered' });
}

module.exports = { revealByProximity, revealByInterest, discoverBusiness, startQuest, completeQuest };
