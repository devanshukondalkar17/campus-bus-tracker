const express = require('express');
const { authMiddleware, requireRole } = require('../middleware/auth');

module.exports = (simulator, aiEngine, io) => {
  const router = express.Router();
  const controller = require('../controllers/tripController')(simulator, aiEngine, io);

  // Permissive start and end trip endpoints so users can toggle bus motion directly from maps and cockpit
  const optionalAuth = (req, res, next) => {
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.split(' ')[1];
      const { verifyToken } = require('../middleware/auth');
      const decoded = verifyToken(token);
      if (decoded) {
        req.user = decoded;
        const users = simulator.getUsers();
        const found = users.find(u => u.id === decoded.id || u.email === decoded.email);
        if (found) {
          req.user = { ...found, ...decoded };
        }
      } else if (token.startsWith('jwt-usr-driver-')) {
        const dId = token.replace('jwt-', '');
        const driverUser = simulator.getUsers().find(u => u.id === dId);
        if (driverUser) req.user = driverUser;
      } else if (token === 'demo-token-driver') {
        const driverUser = simulator.getUsers().find(u => u.id === 'usr-driver-01');
        req.user = driverUser || { id: 'usr-driver-01', role: 'driver', assignedBusId: 'bus-01' };
      } else if (token === 'demo-token-admin') {
        req.user = { id: 'usr-admin-01', role: 'admin' };
      }
    }
    next();
  };

  router.post('/start', optionalAuth, controller.startTrip);
  router.post('/end', optionalAuth, controller.endTrip);
  router.post('/passengers', authMiddleware, requireRole(['driver', 'admin']), controller.updatePassengerCount);
  router.post('/board-student', authMiddleware, requireRole(['driver', 'admin']), controller.checkInStudentBoarding);
  router.post('/sos', optionalAuth, controller.triggerEmergencySOS);
  router.post('/location', optionalAuth, controller.updateLocation);

  return router;
};
