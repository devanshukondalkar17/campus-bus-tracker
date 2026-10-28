const express = require('express');
const { authMiddleware, requireRole } = require('../middleware/auth');

module.exports = (simulator, aiEngine, io) => {
  const router = express.Router();
  const controller = require('../controllers/complaintController')(simulator, aiEngine, io);

  router.post('/', (req, res, next) => {
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      return authMiddleware(req, res, next);
    }
    next();
  }, controller.submitComplaint);

  router.get('/', (req, res, next) => {
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      return authMiddleware(req, res, next);
    }
    next();
  }, controller.getComplaints);

  router.put('/:id', authMiddleware, requireRole(['admin']), controller.resolveComplaint);

  return router;
};
