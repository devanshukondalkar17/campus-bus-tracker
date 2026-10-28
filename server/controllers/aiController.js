module.exports = (simulator, aiEngine, io) => {
  return {
    getFleetHealth: (req, res) => {
      const evaluation = aiEngine.evaluateFleetHealth();
      res.json({ success: true, evaluation });
    },

    executeCopilotCommand: async (req, res) => {
      const { prompt } = req.body;
      if (!prompt) {
        return res.status(400).json({ success: false, message: 'Command prompt required' });
      }

      const result = await aiEngine.processCopilotCommand(prompt);

      if (io) {
        io.emit('copilot_command_executed', {
          prompt,
          result,
          buses: simulator.getBuses(),
          alerts: aiEngine.getActiveAlerts()
        });
      }

      res.json({ success: true, ...result });
    },

    getSeatProbability: (req, res) => {
      const { busId, stopId } = req.query;
      if (!busId || !stopId) {
        return res.status(400).json({ success: false, message: 'busId and stopId query parameters required' });
      }

      const result = aiEngine.calculateSeatProbability(busId, stopId);
      res.json({ success: true, ...result });
    },

    getLeaveNowAdvice: (req, res) => {
      const { stopId, routeId } = req.query;
      if (!stopId || !routeId) {
        return res.status(400).json({ success: false, message: 'stopId and routeId query parameters required' });
      }

      const advice = aiEngine.calculateLeaveNowAdvice(null, stopId, routeId);
      res.json({ success: true, advice });
    },

    getTimetableSurges: (req, res) => {
      res.json({
        success: true,
        surges: simulator.getTimetableSurges()
      });
    },

    resolveAlert: (req, res) => {
      const { id } = req.params;
      aiEngine.resolveAlert(id);
      if (io) {
        io.emit('alert_resolved', { id, alerts: aiEngine.getActiveAlerts() });
      }
      res.json({ success: true, activeAlerts: aiEngine.getActiveAlerts() });
    }
  };
};
