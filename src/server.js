require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const { getAllBusinesses } = require('./airtable/businesses');
const { getAllTiles } = require('./airtable/tiles');
const { buildFogGeoJSON } = require('./map/fogLayer');
const fogRoutes = require('./fog/fogRoutes');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, '../public')));

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', project: 'Craffft Fog Map', timestamp: new Date().toISOString() });
});

// Expose Mapbox token to frontend (server-side only, never committed)
app.get('/api/config', (req, res) => {
  res.json({ mapboxToken: process.env.MAPBOX_TOKEN || '' });
});

// Business nodes — read all, shaped for map
app.get('/api/businesses', async (req, res) => {
  try {
    const records = await getAllBusinesses();
    const businesses = records.map(r => ({
      id: r.id,
      name: r.fields['Name'],
      industryType: r.fields['Industry Type'],
      lat: r.fields['Latitude'],
      lng: r.fields['Longitude'],
      region: r.fields['Region'],
      size: r.fields['Size'],
      tags: r.fields['Tags'] || [],
      engagementLevel: r.fields['Engagement Level'] || 'hidden',
    }));
    res.json({ businesses });
  } catch (err) {
    console.error('/api/businesses error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

// Fog tile GeoJSON for the visual overlay
app.get('/api/tiles', async (req, res) => {
  try {
    const records = await getAllTiles();
    const tileStates = {};
    for (const r of records) {
      const geohash = r.fields['Geohash'];
      const state   = r.fields['Fog State'] || 'hidden';
      if (geohash) tileStates[geohash] = state;
    }
    res.json(buildFogGeoJSON(tileStates));
  } catch (err) {
    console.error('/api/tiles error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

// Fog state transitions
app.use('/api/fog', fogRoutes);

app.listen(PORT, () => {
  console.log(`Craffft Fog Map server running on http://localhost:${PORT}`);
  console.log(`Map: http://localhost:${PORT}/`);
});

module.exports = app;
