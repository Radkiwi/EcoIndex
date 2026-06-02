const express = require('express');
const router = express.Router();
const { revealByProximity, revealByInterest, discoverBusiness, startQuest, completeQuest } = require('./fogEngine');

function handle(fn) {
  return async (req, res) => {
    try {
      const result = await fn(req, res);
      res.json({ ok: true, ...result });
    } catch (err) {
      console.error(err.message);
      res.status(400).json({ ok: false, error: err.message });
    }
  };
}

// POST /api/fog/reveal-proximity  { lat, lng, radius }
router.post('/reveal-proximity', handle(async (req) => {
  const { lat, lng, radius = 50 } = req.body;
  if (lat == null || lng == null) throw new Error('lat and lng required');
  const revealed = await revealByProximity(parseFloat(lat), parseFloat(lng), parseFloat(radius));
  return { revealed, count: revealed.length };
}));

// POST /api/fog/reveal-interest  { tags: ["horticulture", ...] }
router.post('/reveal-interest', handle(async (req) => {
  const { tags = [] } = req.body;
  const revealed = await revealByInterest(tags);
  return { revealed, count: revealed.length };
}));

// POST /api/fog/discover  { businessId }
router.post('/discover', handle(async (req) => {
  const { businessId } = req.body;
  if (!businessId) throw new Error('businessId required');
  const record = await discoverBusiness(businessId);
  return { businessId, engagementLevel: record.fields['Engagement Level'] };
}));

// POST /api/fog/start-quest  { businessId }
router.post('/start-quest', handle(async (req) => {
  const { businessId } = req.body;
  if (!businessId) throw new Error('businessId required');
  const record = await startQuest(businessId);
  return { businessId, engagementLevel: record.fields['Engagement Level'] };
}));

// POST /api/fog/complete-quest  { businessId }
router.post('/complete-quest', handle(async (req) => {
  const { businessId } = req.body;
  if (!businessId) throw new Error('businessId required');
  const record = await completeQuest(businessId);
  return { businessId, engagementLevel: record.fields['Engagement Level'] };
}));

module.exports = router;
