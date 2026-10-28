const express = require('express');

module.exports = (simulator, aiEngine, io) => {
  const router = express.Router();
  const controller = require('../controllers/fleetController')(simulator, aiEngine, io);

  router.get('/overview', controller.getFleetOverview);
  router.get('/routes', controller.getRoutes);
  router.get('/stops', controller.getStops);
  router.get('/schedules', controller.getSchedules);
  router.get('/buses/:id', controller.getBusById);
  router.post('/incident', controller.triggerIncident);

  return router;
};
