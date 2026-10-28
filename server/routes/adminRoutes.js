const express = require('express');
const { authMiddleware, requireRole } = require('../middleware/auth');

module.exports = (simulator, aiEngine, io) => {
  const router = express.Router();
  const controller = require('../controllers/adminController')(simulator, aiEngine, io);

  // Bus Management
  router.post('/buses', authMiddleware, requireRole(['admin']), controller.createBus);
  router.put('/buses/:id', authMiddleware, requireRole(['admin']), controller.updateBus);
  router.delete('/buses/:id', authMiddleware, requireRole(['admin']), controller.deleteBus);

  // User Management
  router.get('/users', authMiddleware, requireRole(['admin']), controller.getAllUsers);
  router.post('/assign-student', authMiddleware, requireRole(['admin']), controller.assignStudent);

  // Announcements
  router.post('/announcements', authMiddleware, requireRole(['admin']), controller.sendAnnouncement);

  // Analytics & Reports
  router.get('/analytics', authMiddleware, requireRole(['admin']), controller.getAnalytics);
  router.get('/export-csv', controller.exportReportCSV);

  // Student Pass Subscriptions Management (Accept / Reject)
  router.get('/subscriptions', controller.getAllSubscriptions);
  router.post('/subscriptions/:id/accept', controller.acceptSubscription);
  router.post('/subscriptions/:id/reject', controller.rejectSubscription);

  return router;
};
