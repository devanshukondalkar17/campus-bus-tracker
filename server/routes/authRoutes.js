const express = require('express');
const { authMiddleware } = require('../middleware/auth');

module.exports = (simulator, io) => {
  const router = express.Router();
  const controller = require('../controllers/authController')(simulator, io);

  router.post('/login', controller.login);
  router.post('/register', controller.register);
  router.get('/me', authMiddleware, controller.getProfile);
  router.post('/travel-status', authMiddleware, controller.toggleTravelStatus);
  router.post('/reserve-seat', authMiddleware, controller.reserveSeat);
  router.post('/cancel-seat', authMiddleware, controller.cancelSeat);
  router.post('/preferences', authMiddleware, controller.updatePreferences);

  return router;
};
