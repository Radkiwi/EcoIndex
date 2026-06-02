require('dotenv').config();
const base = require('./client');

const TABLE = process.env.AIRTABLE_TABLE_MAP_TILES;

async function getAllTiles() {
  const records = [];
  await base(TABLE).select().eachPage((page, next) => {
    records.push(...page);
    next();
  });
  return records;
}

module.exports = { getAllTiles };
