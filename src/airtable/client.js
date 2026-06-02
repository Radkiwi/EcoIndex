require('dotenv').config();
const Airtable = require('airtable');

let _base = null;

function getBase() {
  if (!_base) {
    if (!process.env.AIRTABLE_API_KEY) {
      throw new Error('AIRTABLE_API_KEY is not set in .env');
    }
    _base = new Airtable({ apiKey: process.env.AIRTABLE_API_KEY })
      .base(process.env.AIRTABLE_BASE_ID);
  }
  return _base;
}

// Proxy so callers can still write `base('Table Name')`
module.exports = (tableName) => getBase()(tableName);
