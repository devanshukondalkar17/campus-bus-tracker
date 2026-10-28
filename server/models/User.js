const mongoose = require('mongoose');

const UserSchema = new mongoose.Schema({
  id: { type: String, required: true, unique: true },
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true, lowercase: true, trim: true },
  rollNumber: { type: String, default: null, trim: true }, // e.g. NUV23CS101
  password: { type: String, required: true },
  role: {
    type: String,
    enum: ['student', 'driver', 'admin'],
    default: 'student'
  },
  phone: { type: String, default: '' },
  assignedBusId: { type: String, default: null },
  assignedRouteId: { type: String, default: null },
  pickupStopId: { type: String, default: null },
  isTravellingToday: { type: Boolean, default: true },
  bookedSeatNumber: { type: String, default: null }, // e.g. "4A"
  favouriteStopId: { type: String, default: null },
  favouriteRouteId: { type: String, default: null },
  notificationPreferences: {
    busStarted: { type: Boolean, default: true },
    fiveMinAway: { type: Boolean, default: true },
    delays: { type: Boolean, default: true },
    announcements: { type: Boolean, default: true }
  }
}, {
  timestamps: true
});

module.exports = mongoose.models.User || mongoose.model('User', UserSchema);
