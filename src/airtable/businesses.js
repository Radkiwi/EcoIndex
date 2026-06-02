require('dotenv').config();
const base = require('./client');

const TABLE = process.env.AIRTABLE_TABLE_BUSINESS_NODES;

async function getAllBusinesses() {
  const records = [];
  await base(TABLE).select().eachPage((page, next) => {
    records.push(...page);
    next();
  });
  return records;
}

async function getBusinessById(id) {
  return base(TABLE).find(id);
}

async function updateBusiness(id, fields) {
  return base(TABLE).update(id, fields);
}

module.exports = { getAllBusinesses, getBusinessById, updateBusiness };
