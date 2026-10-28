const mongoose = require('mongoose');

const TripSchema = new mongoose.Schema({
  id: { type: String, required: true },
  busId: { type: String, required: true },
  driverId: { type: String, required: true },
  driverName: { type: String, default: '' },
  routeId: { type: String, required: true },
  routeName: { type: String, default: '' },
  status: {
    type: String,
    enum: ['SCHEDULED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED'],
    default: 'IN_PROGRESS'
  },
  startTime: { type: Date, default: Date.now },
  endTime: { type: Date, default: null },
  passengerCount: { type: Number, default: 0 },
  boardingList: [
    {
      studentId: { type: String },
      rollNumber: { type: String },
      name: { type: String },
      stopId: { type: String },
      boardedAt: { type: Date, default: Date.now },
      verifiedBy: { type: String, default: 'QR_SCAN' } // QR_SCAN or MANUAL
    }
  ],
  delayMinutes: { type: Number, default: 0 },
  notes: { type: String, default: '' }
}, {
  timestamps: true
});

module.exports = mongoose.models.Trip || mongoose.model('Trip', TripSchema);
