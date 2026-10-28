const express = require('express');
const { authMiddleware } = require('../middleware/auth');

module.exports = (simulator) => {
  const router = express.Router();
  const controller = require('../controllers/notificationController')(simulator);

  // Notifications endpoint allows optional auth (or falls back to general)
  router.get('/', (req, res, next) => {
    // If bearer provided, verify it, otherwise pass through
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      return authMiddleware(req, res, next);
    }
    next();
  }, controller.getNotifications);

  router.post('/:id/read', controller.markAsRead);
  router.post('/read-all', controller.markAllAsRead);

  return router;
};
