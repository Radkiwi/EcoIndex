/**
 * Run once to assign all seeded businesses to their geohash tiles.
 * Usage: node scripts/assignTiles.js
 */
require('dotenv').config();
const { getAllBusinesses } = require('../src/airtable/businesses');
const { assignBusinessToTile } = require('../src/map/tileEngine');

async function run() {
  console.log('Assigning businesses to map tiles...\n');
  const businesses = await getAllBusinesses();
  console.log(`Found ${businesses.length} businesses\n`);

  for (const biz of businesses) {
    await assignBusinessToTile({ fields: biz.fields });
  }

  console.log('\nDone. Check your Airtable "Map Tiles" table.');
}

run().catch(err => { console.error(err); process.exit(1); });
