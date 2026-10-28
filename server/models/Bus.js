const mongoose = require('mongoose');

const BusSchema = new mongoose.Schema({
  id: { type: String, required: true, unique: true },
  numberPlate: { type: String, required: true },
  callsign: { type: String, required: true },
  routeId: { type: String, default: null },
  status: {
    type: String,
    enum: ['EN_ROUTE', 'DELAYED', 'STANDBY', 'BREAKDOWN', 'OUT_OF_SERVICE'],
    default: 'STANDBY'
  },
  capacity: { type: Number, default: 55 },
  currentOccupancy: { type: Number, default: 0 },
  seatedCapacity: { type: Number, default: 40 },
  standingCapacity: { type: Number, default: 15 },
  speedKmH: { type: Number, default: 0 },
  headingDeg: { type: Number, default: 0 },
  driver: {
    name: { type: String, default: 'Unassigned' },
    phone: { type: String, default: '' },
    rating: { type: Number, default: 5.0 },
    shiftHours: { type: Number, default: 0 }
  },
  telematics: {
    batteryOrFuel: { type: Number, default: 100 },
    harshBrakingToday: { type: Number, default: 0 },
    engineIdleMins: { type: Number, default: 0 },
    safetyScore: { type: Number, default: 98 },
    lastTelemetryTimestamp: { type: Date, default: Date.now }
  },
  currentWaypointIndex: { type: Number, default: 0 },
  nextStopId: { type: String, default: null },
  etaMinutesNextStop: { type: Number, default: 0 },
  direction: { type: Number, default: 1 },
  lat: { type: Number },
  lng: { type: Number }
}, {
  timestamps: true
});

module.exports = mongoose.models.Bus || mongoose.model('Bus', BusSchema);
