const mongoose = require('mongoose');

const AlertSchema = new mongoose.Schema({
  id: { type: String, required: true },
  title: { type: String, required: true },
  message: { type: String, required: true },
  severity: {
    type: String,
    enum: ['INFO', 'WARNING', 'CRITICAL', 'AI_DISPATCH'],
    default: 'INFO'
  },
  source: { type: String, default: 'AI Operations Engine' },
  relatedBusId: { type: String, default: null },
  relatedRouteId: { type: String, default: null },
  resolved: { type: Boolean, default: false },
  timestamp: { type: Date, default: Date.now }
}, {
  timestamps: true
});

module.exports = mongoose.models.Alert || mongoose.model('Alert', AlertSchema);
