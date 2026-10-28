module.exports = (simulator, aiEngine, io) => {
  return {
    getFleetOverview: (req, res) => {
      res.json({
        success: true,
        buses: simulator.getBuses(),
        routes: simulator.getRoutes(),
        stops: simulator.getStops(),
        alerts: aiEngine.getActiveAlerts()
      });
    },

    getBusById: (req, res) => {
      const bus = simulator.getBusById(req.params.id);
      if (!bus) return res.status(404).json({ success: false, message: 'Bus not found' });
      res.json({ success: true, bus });
    },

    getRoutes: (req, res) => {
      res.json({ success: true, routes: simulator.getRoutes() });
    },

    getStops: (req, res) => {
      res.json({ success: true, stops: simulator.getStops() });
    },

    getSchedules: (req, res) => {
      res.json({ success: true, schedules: simulator.getSchedules() });
    },

    triggerIncident: (req, res) => {
      const { busId, action, delayMins } = req.body;
      let bus = null;

      if (action === 'BREAKDOWN') {
        bus = simulator.triggerBreakdown(busId);
        aiEngine.addAlert({
          title: `CRITICAL: ${bus ? bus.callsign : busId} Breakdown Alert`,
          message: `Mechanical failure reported. Ops copilot calculating nearest relief shuttle.`,
          severity: 'CRITICAL',
          relatedBusId: busId
        });
      } else if (action === 'DELAY') {
        bus = simulator.triggerDelay(busId, delayMins || 10);
        aiEngine.addAlert({
          title: `WARNING: ${bus ? bus.callsign : busId} Severe Delay Detected`,
          message: `Vehicle stuck in intersection congestion (+${delayMins || 10} mins).`,
          severity: 'WARNING',
          relatedBusId: busId
        });
      } else if (action === 'HARSH_BRAKE') {
        bus = simulator.triggerHarshBrake(busId);
        aiEngine.addAlert({
          title: `SAFETY: Harsh Braking Telematics Logged`,
          message: `${bus ? bus.callsign : busId} logged deceleration > 0.45G.`,
          severity: 'INFO',
          relatedBusId: busId
        });
      } else if (action === 'RESTORE') {
        bus = simulator.restoreBus(busId);
        aiEngine.addAlert({
          title: `INFO: ${bus ? bus.callsign : busId} Restored to Active Duty`,
          message: `Vehicle telemetry normalized and resumed regular route transit.`,
          severity: 'INFO',
          relatedBusId: busId
        });
      }

      if (io) {
        io.emit('incident_updated', { busId, action, bus, alerts: aiEngine.getActiveAlerts() });
      }

      res.json({
        success: true,
        action,
        bus,
        activeAlerts: aiEngine.getActiveAlerts()
      });
    }
  };
};
