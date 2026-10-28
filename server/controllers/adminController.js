module.exports = (simulator, aiEngine, io) => {
  return {
    // ------------------------------------
    // BUS CRUD MANAGEMENT
    // ------------------------------------
    createBus: (req, res) => {
      const { numberPlate, callsign, routeId, capacity, seatedCapacity, standingCapacity, driver } = req.body;
      if (!numberPlate || !callsign) {
        return res.status(400).json({ success: false, message: 'Number plate and callsign are required.' });
      }

      const newBus = {
        id: `bus-${Date.now()}`,
        numberPlate: numberPlate.trim().toUpperCase(),
        callsign: callsign.trim(),
        routeId: routeId || null,
        status: routeId ? 'EN_ROUTE' : 'STANDBY',
        tripActive: false,
        capacity: Number(capacity) || 55,
        currentOccupancy: 0,
        seatedCapacity: Number(seatedCapacity) || 40,
        standingCapacity: Number(standingCapacity) || 15,
        speedKmH: 0,
        headingDeg: 0,
        driver: driver || { name: 'Unassigned', phone: '', rating: 5.0, shiftHours: 0 },
        telematics: {
          batteryOrFuel: 100,
          harshBrakingToday: 0,
          engineIdleMins: 0,
          safetyScore: 100,
          lastTelemetryTimestamp: Date.now()
        },
        currentWaypointIndex: 0,
        lat: 22.2845,
        lng: 73.1335,
        nextStopId: null,
        etaMinutesNextStop: 0,
        direction: 1,
        reservedSeats: []
      };

      simulator.getBuses().push(newBus);

      if (io) {
        io.emit('fleet_updated', { buses: simulator.getBuses() });
      }

      res.status(201).json({ success: true, message: `Bus ${callsign} added successfully!`, bus: newBus });
    },

    updateBus: (req, res) => {
      const { id } = req.params;
      const bus = simulator.getBusById(id);
      if (!bus) return res.status(404).json({ success: false, message: 'Bus not found.' });

      const { numberPlate, callsign, routeId, status, capacity, seatedCapacity, standingCapacity, driver } = req.body;
      if (numberPlate) bus.numberPlate = numberPlate;
      if (callsign) bus.callsign = callsign;
      if (routeId !== undefined) bus.routeId = routeId;
      if (status) bus.status = status;
      if (capacity) bus.capacity = Number(capacity);
      if (seatedCapacity) bus.seatedCapacity = Number(seatedCapacity);
      if (standingCapacity) bus.standingCapacity = Number(standingCapacity);
      if (driver) bus.driver = { ...bus.driver, ...driver };

      if (io) {
        io.emit('fleet_updated', { buses: simulator.getBuses() });
      }

      res.json({ success: true, message: `Bus ${bus.callsign} updated.`, bus });
    },

    deleteBus: (req, res) => {
      const { id } = req.params;
      const buses = simulator.getBuses();
      const idx = buses.findIndex(b => b.id === id);
      if (idx === -1) return res.status(404).json({ success: false, message: 'Bus not found.' });

      const removed = buses.splice(idx, 1);
      if (io) io.emit('fleet_updated', { buses: simulator.getBuses() });

      res.json({ success: true, message: `Bus ${removed[0].callsign} decommissioned.`, id });
    },

    // ------------------------------------
    // USER MANAGEMENT & ASSIGNMENT
    // ------------------------------------
    getAllUsers: (req, res) => {
      const users = simulator.getUsers().map(({ password, ...u }) => u);
      res.json({ success: true, users });
    },

    assignStudent: (req, res) => {
      const { userId, assignedRouteId, assignedBusId, pickupStopId } = req.body;
      const user = simulator.getUserById(userId);
      if (!user) return res.status(404).json({ success: false, message: 'User not found.' });

      if (assignedRouteId !== undefined) user.assignedRouteId = assignedRouteId;
      if (assignedBusId !== undefined) user.assignedBusId = assignedBusId;
      if (pickupStopId !== undefined) user.pickupStopId = pickupStopId;

      res.json({ success: true, message: `Updated transit assignment for ${user.name}.`, user });
    },

    // ------------------------------------
    // ANNOUNCEMENTS
    // ------------------------------------
    sendAnnouncement: (req, res) => {
      const { title, message, targetType = 'ALL', targetId = null } = req.body;
      if (!title || !message) {
        return res.status(400).json({ success: false, message: 'Title and message are required.' });
      }

      const notif = {
        id: `notif-${Date.now()}`,
        title: title.trim(),
        message: message.trim(),
        type: 'ANNOUNCEMENT',
        targetType,
        targetId,
        readBy: [],
        timestamp: new Date().toISOString()
      };

      simulator.getNotifications().unshift(notif);

      // Also create an AI operations alert
      aiEngine.addAlert({
        title: `ANNOUNCEMENT: ${title}`,
        message: `${message} (Target: ${targetType})`,
        severity: 'INFO',
        source: 'Admin Operations Dispatch'
      });

      if (io) {
        io.emit('new_notification_broadcast', notif);
      }

      res.status(201).json({ success: true, message: 'Announcement broadcasted successfully!', notification: notif });
    },

    // ------------------------------------
    // ANALYTICS & CSV EXPORT
    // ------------------------------------
    getAnalytics: (req, res) => {
      const buses = simulator.getBuses();
      const routes = simulator.getRoutes();
      const stops = simulator.getStops();
      const users = simulator.getUsers();

      const totalStudents = users.filter(u => u.role === 'student').length;
      const activeTravellingToday = users.filter(u => u.role === 'student' && u.isTravellingToday).length;
      const totalCapacity = buses.reduce((acc, b) => acc + b.capacity, 0);
      const totalCurrentLoad = buses.reduce((acc, b) => acc + b.currentOccupancy, 0);

      const popularStops = stops.slice(0, 5).map(s => ({
        name: s.name,
        code: s.code,
        waitingStudents: s.currentWaitingCount || 0,
        historicalDemandScore: s.historicalDemand
      }));

      res.json({
        success: true,
        metrics: {
          totalTripsToday: 24,
          onTimePercentage: 94.2,
          averageFleetOccupancyRate: Math.round((totalCurrentLoad / (totalCapacity || 1)) * 100),
          totalEnrolledStudents: totalStudents,
          activeCommutingToday: activeTravellingToday,
          fleetSafetyScore: 96,
          activeCorridorsCount: routes.length
        },
        popularStops,
        activeAlertsCount: aiEngine.getActiveAlerts().length
      });
    },

    exportReportCSV: (req, res) => {
      const buses = simulator.getBuses();
      let csv = 'Bus Callsign,Number Plate,Route ID,Status,Occupancy,Capacity,Speed (km/h),Safety Score,Driver Name\n';

      buses.forEach(b => {
        csv += `"${b.callsign}","${b.numberPlate}","${b.routeId || 'Depot'}","${b.status}",${b.currentOccupancy},${b.capacity},${b.speedKmH},${b.telematics ? b.telematics.safetyScore : 95},"${b.driver ? b.driver.name : 'Unassigned'}"\n`;
      });

      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', 'attachment; filename="navrachana_transit_report.csv"');
      res.status(200).send(csv);
    },

    // ----------------------------------------------------
    // STUDENT COMMUTER SUBSCRIPTION APPROVAL ENGINE
    // ----------------------------------------------------
    getAllSubscriptions: (req, res) => {
      const { status } = req.query;
      const subscriptions = simulator.getSubscriptions(status);

      res.json({
        success: true,
        subscriptions,
        stats: {
          total: simulator.getSubscriptions().length,
          pending: simulator.getSubscriptions('PENDING_APPROVAL').length,
          active: simulator.getSubscriptions('ACTIVE').length,
          rejected: simulator.getSubscriptions('REJECTED').length
        }
      });
    },

    acceptSubscription: (req, res) => {
      const { id } = req.params;
      const result = simulator.acceptSubscription(id, req.user);

      if (!result.success) {
        return res.status(404).json(result);
      }

      res.json(result);
    },

    rejectSubscription: (req, res) => {
      const { id } = req.params;
      const { reason } = req.body;
      const result = simulator.rejectSubscription(id, reason, req.user);

      if (!result.success) {
        return res.status(404).json(result);
      }

      res.json(result);
    }
  };
};
