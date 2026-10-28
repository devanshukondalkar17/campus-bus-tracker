const mongoose = require('mongoose');

const RouteSchema = new mongoose.Schema({
  id: { type: String, required: true, unique: true },
  name: { type: String, required: true },
  code: { type: String, required: true },
  color: { type: String, default: '#3b82f6' },
  activeBuses: [{ type: String }],
  stops: [{ type: String }],
  waypoints: [
    {
      lat: { type: Number, required: true },
      lng: { type: Number, required: true }
    }
  ],
  scheduleIntervalMins: { type: Number, default: 15 },
  status: {
    type: String,
    enum: ['ON_TIME', 'MINOR_DELAYS', 'CONGESTION', 'REROUTED'],
    default: 'ON_TIME'
  }
}, {
  timestamps: true
});

module.exports = mongoose.models.Route || mongoose.model('Route', RouteSchema);
