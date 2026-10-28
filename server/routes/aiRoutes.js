const express = require('express');

module.exports = (simulator, aiEngine, io) => {
  const router = express.Router();
  const controller = require('../controllers/aiController')(simulator, aiEngine, io);

  router.get('/health', controller.getFleetHealth);
  router.post('/copilot', controller.executeCopilotCommand);
  router.get('/seat-probability', controller.getSeatProbability);
  router.get('/leave-now', controller.getLeaveNowAdvice);
  router.get('/timetable-surges', controller.getTimetableSurges);
  router.delete('/alerts/:id', controller.resolveAlert);

  return router;
};
