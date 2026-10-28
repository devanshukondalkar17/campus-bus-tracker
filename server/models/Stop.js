const mongoose = require('mongoose');

const StopSchema = new mongoose.Schema({
  id: { type: String, required: true, unique: true },
  name: { type: String, required: true },
  code: { type: String, required: true },
  lat: { type: Number, required: true },
  lng: { type: Number, required: true },
  campusZone: { type: String, default: 'General' },
  historicalDemand: { type: Number, default: 50 },
  amenities: [{ type: String }],
  currentWaitingCount: { type: Number, default: 0 }
}, {
  timestamps: true
});

module.exports = mongoose.models.Stop || mongoose.model('Stop', StopSchema);
