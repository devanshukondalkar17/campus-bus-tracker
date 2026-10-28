const mongoose = require('mongoose');

const ComplaintSchema = new mongoose.Schema({
  id: { type: String, required: true },
  studentId: { type: String, required: true },
  studentName: { type: String, required: true },
  studentRoll: { type: String, default: '' },
  busId: { type: String, default: null },
  category: {
    type: String,
    enum: ['LATE_BUS', 'DRIVER_BEHAVIOUR', 'OVERCROWDING', 'AIR_CONDITIONING', 'LOST_ITEM', 'OTHER'],
    default: 'OTHER'
  },
  subject: { type: String, required: true },
  description: { type: String, required: true },
  status: {
    type: String,
    enum: ['PENDING', 'INVESTIGATING', 'RESOLVED'],
    default: 'PENDING'
  },
  adminNotes: { type: String, default: '' }
}, {
  timestamps: true
});

module.exports = mongoose.models.Complaint || mongoose.model('Complaint', ComplaintSchema);
