module.exports = (simulator, aiEngine, io) => {
  // Helper to enforce driver bus ownership
  const verifyBusOwnership = (req, busId) => {
    if (!req.user) {
      return {
        allowed: false,
        status: 401,
        message: 'Authentication required. Please log in as an authorized driver or administrator.'
      };
    }
    if (req.user.role === 'admin') return { allowed: true }; // Admin can dispatch/manage any bus
    if (req.user.role === 'student') {
      return {
        allowed: false,
        status: 403,
        message: 'Access Denied: Students are not authorized to start or end bus trips.'
      };
    }
    if (req.user.role === 'driver') {
      const assignedBusId = req.user.assignedBusId;
      if (assignedBusId && assignedBusId !== busId) {
        return {
          allowed: false,
          status: 403,
          message: `Access Denied: You are assigned to vehicle ${assignedBusId.toUpperCase()}. You are only permitted to start and end trips for your assigned bus.`
        };
      }
    }
    return { allowed: true };
  };

  return {
    // Start Trip (Initiates active GPS broadcast & fires notifications to assigned students)
    startTrip: (req, res) => {
      const { busId } = req.body;
      const bus = simulator.getBusById(busId);
      if (!bus) return res.status(404).json({ success: false, message: 'Bus not found.' });

      const authCheck = verifyBusOwnership(req, busId);
      if (!authCheck.allowed) {
        return res.status(authCheck.status).json({ success: false, message: authCheck.message });
      }

      bus.tripActive = true;
      bus.status = 'EN_ROUTE';
      bus.speedKmH = bus.speedKmH && bus.speedKmH > 0 ? bus.speedKmH : 34;

      // Create trip record in memory
      const trip = {
        id: `trip-${Date.now()}`,
        busId: bus.id,
        driverId: req.user ? req.user.id : (bus.driver ? bus.driver.id : 'driver-01'),
        driverName: bus.driver ? bus.driver.name : 'Driver',
        routeId: bus.routeId,
        status: 'IN_PROGRESS',
        startTime: new Date().toISOString(),
        passengerCount: bus.currentOccupancy,
        boardingList: []
      };

      simulator.setActiveTrip(bus.id, trip);

      // Create notification for route students
      const notif = {
        id: `notif-${Date.now()}`,
        title: `Trip Started: ${bus.callsign}`,
        message: `${bus.callsign} has started its scheduled trip on ${bus.routeId || 'Corridor'}. Check live location on map.`,
        type: 'TRIP_STARTED',
        targetType: 'ROUTE',
        targetId: bus.routeId,
        readBy: [],
        timestamp: new Date().toISOString()
      };
      simulator.getNotifications().unshift(notif);

      aiEngine.addAlert({
        title: `Trip Active: ${bus.callsign}`,
        message: `${bus.callsign} live GPS tracking active. En-route to NUV Bhayli Campus.`,
        severity: 'INFO',
        source: 'Driver Trip Terminal'
      });

      if (io) {
        io.emit('trip_status_changed', { busId: bus.id, tripActive: true, bus });
        io.emit('new_notification_broadcast', notif);
      }

      res.json({
        success: true,
        message: `Trip started for ${bus.callsign}. Live GPS is broadcasting to students.`,
        bus,
        trip
      });
    },

    // End Trip
    endTrip: (req, res) => {
      const { busId } = req.body;
      const bus = simulator.getBusById(busId);
      if (!bus) return res.status(404).json({ success: false, message: 'Bus not found.' });

      const authCheck = verifyBusOwnership(req, busId);
      if (!authCheck.allowed) {
        return res.status(authCheck.status).json({ success: false, message: authCheck.message });
      }

      bus.tripActive = false;
      bus.speedKmH = 0;
      bus.status = 'STANDBY';
      bus.currentOccupancy = 0;

      simulator.endActiveTrip(bus.id);

      const notif = {
        id: `notif-${Date.now()}`,
        title: `Trip Completed: ${bus.callsign}`,
        message: `${bus.callsign} has completed its route and arrived safely at Navrachana University Depot.`,
        type: 'GENERAL',
        targetType: 'ROUTE',
        targetId: bus.routeId,
        readBy: [],
        timestamp: new Date().toISOString()
      };
      simulator.getNotifications().unshift(notif);

      if (io) {
        io.emit('trip_status_changed', { busId: bus.id, tripActive: false, bus });
        io.emit('new_notification_broadcast', notif);
      }

      res.json({
        success: true,
        message: `Trip safely concluded for ${bus.callsign}.`,
        bus
      });
    },

    // Passenger Count Manual +/- Adjustments
    updatePassengerCount: (req, res) => {
      const { busId, count, delta } = req.body;
      const bus = simulator.getBusById(busId);
      if (!bus) return res.status(404).json({ success: false, message: 'Bus not found.' });

      const authCheck = verifyBusOwnership(req, busId);
      if (!authCheck.allowed) {
        return res.status(authCheck.status).json({ success: false, message: authCheck.message });
      }

      if (count !== undefined) {
        bus.currentOccupancy = Math.max(0, Math.min(bus.capacity, Number(count)));
      } else if (delta !== undefined) {
        bus.currentOccupancy = Math.max(0, Math.min(bus.capacity, bus.currentOccupancy + Number(delta)));
      }

      if (io) {
        io.emit('passenger_count_updated', {
          busId: bus.id,
          currentOccupancy: bus.currentOccupancy,
          capacity: bus.capacity
        });
      }

      res.json({
        success: true,
        currentOccupancy: bus.currentOccupancy,
        capacity: bus.capacity,
        openSeats: Math.max(0, bus.seatedCapacity - bus.currentOccupancy)
      });
    },

    // Student Boarding Check-in (QR Scan or Roll Number Verification)
    checkInStudentBoarding: (req, res) => {
      const { busId, rollNumber, studentId, verificationMode = 'QR_SCAN' } = req.body;
      const bus = simulator.getBusById(busId);
      if (!bus) return res.status(404).json({ success: false, message: 'Bus not found.' });

      const authCheck = verifyBusOwnership(req, busId);
      if (!authCheck.allowed) {
        return res.status(authCheck.status).json({ success: false, message: authCheck.message });
      }

      const users = simulator.getUsers();
      const student = users.find(u => 
        (rollNumber && u.rollNumber && u.rollNumber.toUpperCase() === rollNumber.toUpperCase()) ||
        (studentId && u.id === studentId)
      );

      if (!student) {
        return res.status(404).json({
          success: false,
          message: `No registered Navrachana student found with roll number: ${rollNumber || studentId}`
        });
      }

      // Increment occupancy
      bus.currentOccupancy = Math.min(bus.capacity, bus.currentOccupancy + 1);

      const boardingRecord = {
        studentId: student.id,
        name: student.name,
        rollNumber: student.rollNumber,
        stopId: student.pickupStopId,
        boardedAt: new Date().toISOString(),
        verificationMode
      };

      simulator.addBoardingRecord(bus.id, boardingRecord);

      if (io) {
        io.emit('student_boarded_event', {
          busId: bus.id,
          student: boardingRecord,
          currentOccupancy: bus.currentOccupancy
        });
      }

      res.json({
        success: true,
        message: `Boarding Verified! ${student.name} (${student.rollNumber}) checked in via ${verificationMode}.`,
        record: boardingRecord,
        currentOccupancy: bus.currentOccupancy
      });
    },

    // Driver Emergency / SOS Button
    triggerEmergencySOS: (req, res) => {
      const { busId, reason = 'Driver Activated Emergency SOS' } = req.body;
      const bus = simulator.getBusById(busId);

      const authCheck = verifyBusOwnership(req, busId);
      if (!authCheck.allowed) {
        return res.status(authCheck.status).json({ success: false, message: authCheck.message });
      }

      const alert = {
        title: `🚨 EMERGENCY SOS: ${bus ? bus.callsign : busId}`,
        message: `CRITICAL ALARM triggered by vehicle driver! Location: [${bus ? bus.lat : 'Bhayli'}, ${bus ? bus.lng : 'Vadodara'}]. Security & Ops alerted.`,
        severity: 'CRITICAL',
        source: 'Driver In-Cabin SOS Beacon',
        relatedBusId: busId
      };

      aiEngine.addAlert(alert);

      const notif = {
        id: `notif-${Date.now()}`,
        title: `EMERGENCY ALERT: ${bus ? bus.callsign : 'NUV Transit'}`,
        message: `Emergency signal dispatched. Campus emergency response unit dispatched.`,
        type: 'SOS',
        targetType: 'ALL',
        targetId: null,
        readBy: [],
        timestamp: new Date().toISOString()
      };
      simulator.getNotifications().unshift(notif);

      if (io) {
        io.emit('emergency_sos_broadcast', { busId, alert, notif });
      }

      res.json({
        success: true,
        message: 'EMERGENCY SOS TRANSMITTED to Campus Security and Operations Control!',
        alert
      });
    },

    // Live Location Update from Driver Device GPS
    updateLocation: (req, res) => {
      const { busId, lat, lng, speedKmH, headingDeg } = req.body;
      const bus = simulator.getBusById(busId);
      if (!bus) return res.status(404).json({ success: false, message: 'Bus not found.' });

      if (lat !== undefined && lng !== undefined) {
        bus.lat = Number(lat);
        bus.lng = Number(lng);
      }
      if (speedKmH !== undefined) bus.speedKmH = Number(speedKmH);
      if (headingDeg !== undefined) bus.headingDeg = Number(headingDeg);
      bus.status = 'EN_ROUTE';
      bus.tripActive = true;
      bus.telematics.lastTelemetryTimestamp = Date.now();

      if (io) {
        io.emit('telemetry_tick', {
          timestamp: Date.now(),
          buses: simulator.getBuses(),
          routes: simulator.getRoutes(),
          stops: simulator.getStops()
        });
      }

      res.json({ success: true, bus });
    }
  };
};
