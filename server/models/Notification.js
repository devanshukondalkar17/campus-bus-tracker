const mongoose = require('mongoose');

const NotificationSchema = new mongoose.Schema({
  id: { type: String, required: true },
  title: { type: String, required: true },
  message: { type: String, required: true },
  type: {
    type: String,
    enum: ['TRIP_STARTED', 'BUS_NEARBY', 'DELAY', 'CANCELLED', 'ANNOUNCEMENT', 'SOS', 'GENERAL'],
    default: 'GENERAL'
  },
  targetType: {
    type: String,
    enum: ['ALL', 'ROUTE', 'BUS', 'USER'],
    default: 'ALL'
  },
  targetId: { type: String, default: null }, // routeId, busId, or userId
  readBy: [{ type: String }], // userIds who have marked as read
  timestamp: { type: Date, default: Date.now }
}, {
  timestamps: true
});

module.exports = mongoose.models.Notification || mongoose.model('Notification', NotificationSchema);
