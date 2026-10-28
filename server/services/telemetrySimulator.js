/**
 * CampusPulse Real-Time Telemetry & GPS Physics Simulator
 * Simulates bus motion along curved route waypoints, passenger exchange at stops,
 * dynamic occupancy, and telematics streaming over WebSocket.
 */

const campusData = require('../seed/campusData');

class TelemetrySimulator {
  constructor(io) {
    this.io = io;
    this.buses = JSON.parse(JSON.stringify(campusData.buses));
    this.routes = JSON.parse(JSON.stringify(campusData.routes));
    this.stops = JSON.parse(JSON.stringify(campusData.stops));
    this.timetableSurges = JSON.parse(JSON.stringify(campusData.timetableSurges));
    this.users = JSON.parse(JSON.stringify(campusData.users || []));
    this.notifications = JSON.parse(JSON.stringify(campusData.notifications || []));
    this.complaints = JSON.parse(JSON.stringify(campusData.complaints || []));
    this.busSchedules = JSON.parse(JSON.stringify(campusData.busSchedules || []));
    this.activeTrips = {};
    this.timer = null;
    this.originalRoutes = JSON.parse(JSON.stringify(campusData.routes));
    this.electivesCatalog = campusData.semesterElectivesCatalog;
    this.subscriptions = [
      {
        id: 'sub-seed-001',
        studentId: 'usr-student-002',
        studentRollNumber: 'NUV24CS002',
        studentName: 'Diya Shah',
        planType: 'MONTHLY',
        planName: 'Monthly Commuter Pass',
        amountInr: 1499,
        durationDays: 30,
        paymentMethod: 'UPI',
        transactionRef: 'UPI-NUV-7821039',
        requestedAt: new Date(Date.now() - 3600000 * 2).toISOString(),
        status: 'PENDING_APPROVAL',
        reviewedAt: null,
        reviewedBy: null,
        rejectionReason: null,
        validFrom: null,
        validUntil: null,
        passCode: null
      },
      {
        id: 'sub-seed-002',
        studentId: 'usr-student-005',
        studentRollNumber: 'NUV24CS005',
        studentName: 'Devansh Joshi',
        planType: 'YEARLY',
        planName: 'Yearly Annual Campus Pass',
        amountInr: 14999,
        durationDays: 365,
        paymentMethod: 'NET_BANKING',
        transactionRef: 'HDFC-NUV-992384',
        requestedAt: new Date(Date.now() - 3600000 * 5).toISOString(),
        status: 'PENDING_APPROVAL',
        reviewedAt: null,
        reviewedBy: null,
        rejectionReason: null,
        validFrom: null,
        validUntil: null,
        passCode: null
      },
      {
        id: 'sub-seed-003',
        studentId: 'usr-student-003',
        studentRollNumber: 'NUV24CS003',
        studentName: 'Rohan Mehta',
        planType: 'MONTHLY',
        planName: 'Monthly Commuter Pass',
        amountInr: 1499,
        durationDays: 30,
        paymentMethod: 'UPI',
        transactionRef: 'UPI-NUV-551923',
        requestedAt: new Date(Date.now() - 86400000 * 2).toISOString(),
        status: 'ACTIVE',
        reviewedAt: new Date(Date.now() - 86400000 * 2 + 1800000).toISOString(),
        reviewedBy: 'Dr. Vikram Sarabhai (Admin)',
        rejectionReason: null,
        validFrom: new Date(Date.now() - 86400000 * 2).toISOString(),
        validUntil: new Date(Date.now() + 86400000 * 28).toISOString(),
        passCode: 'NUV-PASS-M3019'
      },
      {
        id: 'sub-seed-004',
        studentId: 'usr-student-004',
        studentRollNumber: 'NUV24CS004',
        studentName: 'Ananya Desai',
        planType: 'YEARLY',
        planName: 'Yearly Annual Campus Pass',
        amountInr: 14999,
        durationDays: 365,
        paymentMethod: 'CAMPUS_CHALLAN',
        transactionRef: 'CHALLAN-2026-NUV-088',
        requestedAt: new Date(Date.now() - 86400000 * 10).toISOString(),
        status: 'ACTIVE',
        reviewedAt: new Date(Date.now() - 86400000 * 10 + 3600000).toISOString(),
        reviewedBy: 'Dr. Rajesh Mehta (Admin)',
        rejectionReason: null,
        validFrom: new Date(Date.now() - 86400000 * 10).toISOString(),
        validUntil: new Date(Date.now() + 86400000 * 355).toISOString(),
        passCode: 'NUV-PASS-Y7710'
      },
      {
        id: 'sub-seed-005',
        studentId: 'usr-student-006',
        studentRollNumber: 'NUV24CS006',
        studentName: 'Pooja Parikh',
        planType: 'MONTHLY',
        planName: 'Monthly Commuter Pass',
        amountInr: 1499,
        durationDays: 30,
        paymentMethod: 'UPI',
        transactionRef: 'UPI-NUV-001293',
        requestedAt: new Date(Date.now() - 86400000 * 1).toISOString(),
        status: 'REJECTED',
        reviewedAt: new Date(Date.now() - 86400000 * 1 + 1800000).toISOString(),
        reviewedBy: 'Dr. Vikram Sarabhai (Admin)',
        rejectionReason: 'Fee dues pending with university accounts office.',
        validFrom: null,
        validUntil: null,
        passCode: null
      }
    ];

    // Link seed subscriptions to users
    this.subscriptions.forEach(sub => {
      const u = this.users.find(user => user.id === sub.studentId || user.rollNumber === sub.studentRollNumber);
      if (u) u.subscription = sub;
    });

    this.initCoordinates();
  }

  initCoordinates() {
    // Set initial lat/lng based on current waypoint
    this.buses.forEach(bus => {
      if (bus.routeId) {
        const route = this.routes.find(r => r.id === bus.routeId);
        if (route && route.waypoints && route.waypoints[bus.currentWaypointIndex]) {
          bus.lat = route.waypoints[bus.currentWaypointIndex].lat;
          bus.lng = route.waypoints[bus.currentWaypointIndex].lng;
        }
      } else if (!bus.lat) {
        bus.lat = 22.2845; // Navrachana University Campus, Bhayli, Vadodara
        bus.lng = 73.1335;
      }
    });
  }

  start() {
    if (this.timer) clearInterval(this.timer);
    console.log('[Telemetry Engine] Real-time 1Hz GPS simulation loop started.');
    
    this.timer = setInterval(() => {
      this.tick();
    }, 2000);
  }

  stop() {
    if (this.timer) clearInterval(this.timer);
    this.timer = null;
  }

  tick() {
    this.buses.forEach(bus => {
      if (bus.status !== 'EN_ROUTE') return;

      const route = this.routes.find(r => r.id === bus.routeId);
      if (!route || !route.waypoints || route.waypoints.length === 0) return;

      const waypoints = route.waypoints;
      let nextIndex = bus.currentWaypointIndex + (bus.direction || 1);

      // Rebound or loop if reaching the terminal
      if (nextIndex >= waypoints.length) {
        bus.direction = -1;
        nextIndex = waypoints.length - 2;
      } else if (nextIndex < 0) {
        bus.direction = 1;
        nextIndex = 1;
      }

      const currentWp = waypoints[bus.currentWaypointIndex] || waypoints[0];
      const targetWp = waypoints[nextIndex] || waypoints[0];

      // Smooth step towards target waypoint
      const stepFactor = 0.35;
      bus.lat = Number((bus.lat + (targetWp.lat - bus.lat) * stepFactor).toFixed(6));
      bus.lng = Number((bus.lng + (targetWp.lng - bus.lng) * stepFactor).toFixed(6));

      // Calculate approximate heading angle
      const dLng = targetWp.lng - bus.lng;
      const dLat = targetWp.lat - bus.lat;
      const angle = Math.round(Math.atan2(dLng, dLat) * (180 / Math.PI));
      bus.headingDeg = (angle + 360) % 360;

      // Distance check to snap to waypoint
      const dist = Math.hypot(targetWp.lat - bus.lat, targetWp.lng - bus.lng);
      if (dist < 0.0004) {
        bus.currentWaypointIndex = nextIndex;

        // Passenger boarding / alighting dynamics at stop
        const isNearStop = this.stops.find(s => 
          Math.hypot(s.lat - bus.lat, s.lng - bus.lng) < 0.001
        );

        if (isNearStop) {
          bus.nextStopId = isNearStop.id;
          bus.etaMinutesNextStop = 1;
          
          // Random passenger exchange
          const alight = Math.floor(Math.random() * 5);
          const board = Math.floor(Math.random() * 7);
          bus.currentOccupancy = Math.max(2, Math.min(bus.capacity, bus.currentOccupancy - alight + board));

          if (this.io) {
            this.io.emit('bus_stop_event', {
              busId: bus.id,
              stopName: isNearStop.name,
              occupancy: bus.currentOccupancy,
              capacity: bus.capacity
            });
          }
        } else {
          bus.etaMinutesNextStop = Math.max(1, Math.round(Math.random() * 4 + 2));
        }
      }

      // Simulate gentle speed variance
      bus.speedKmH = Math.min(48, Math.max(18, Math.round(bus.speedKmH + (Math.random() * 6 - 3))));
      
      // Update telematics timestamp
      bus.telematics.lastTelemetryTimestamp = Date.now();
    });

    // Broadcast live telemetry packet to all connected clients
    if (this.io) {
      this.io.emit('telemetry_tick', {
        timestamp: Date.now(),
        buses: this.buses,
        routes: this.routes,
        stops: this.stops
      });
    }
  }

  getBuses() { return this.buses; }
  getRoutes() { return this.routes; }
  getStops() { return this.stops; }
  getTimetableSurges() { return this.timetableSurges; }
  getUsers() { return this.users; }
  getUserById(id) { return this.users.find(u => u.id === id); }
  getNotifications() { return this.notifications; }
  getComplaints() { return this.complaints; }
  getSchedules() { return this.busSchedules; }

  setActiveTrip(busId, trip) { this.activeTrips[busId] = trip; }
  endActiveTrip(busId) { delete this.activeTrips[busId]; }
  getActiveTrip(busId) { return this.activeTrips[busId] || null; }
  addBoardingRecord(busId, record) {
    if (this.activeTrips[busId]) {
      if (!this.activeTrips[busId].boardingList) this.activeTrips[busId].boardingList = [];
      this.activeTrips[busId].boardingList.push(record);
    }
  }

  getBusById(id) { return this.buses.find(b => b.id === id); }
  getStopById(id) { return this.stops.find(s => s.id === id); }
  getBusesByRoute(routeId) { return this.buses.filter(b => b.routeId === routeId && b.status === 'EN_ROUTE'); }

  // Manual Trigger Methods for Interactive Demo
  triggerBreakdown(busId) {
    const bus = this.getBusById(busId);
    if (!bus) return null;

    bus.status = 'BREAKDOWN';
    bus.speedKmH = 0;
    return bus;
  }

  triggerDelay(busId, delayMins = 8) {
    const bus = this.getBusById(busId);
    if (!bus) return null;

    bus.status = 'DELAYED';
    bus.etaMinutesNextStop += delayMins;
    bus.speedKmH = 12;
    return bus;
  }

  triggerHarshBrake(busId) {
    const bus = this.getBusById(busId);
    if (!bus) return null;

    bus.telematics.harshBrakingToday = (bus.telematics.harshBrakingToday || 0) + 1;
    bus.telematics.safetyScore = Math.max(60, bus.telematics.safetyScore - 4);
    return bus;
  }

  restoreBus(busId) {
    const bus = this.getBusById(busId);
    if (!bus) return null;

    bus.status = 'EN_ROUTE';
    bus.speedKmH = 28;
    return bus;
  }

  getElectivesCatalog() {
    return this.electivesCatalog;
  }

  // Cancel student's ride and dynamically reroute bus to bypass their stop if student cancels
  cancelStudentRide(userId) {
    const user = this.getUserById(userId);
    if (!user) return { success: false, message: 'User not found' };

    user.isTravellingToday = false;
    user.rideCancelled = true;

    // Release booked seat on their bus
    if (user.assignedBusId && user.bookedSeatNumber) {
      const bus = this.getBusById(user.assignedBusId);
      if (bus && bus.reservedSeats) {
        bus.reservedSeats = bus.reservedSeats.filter(s => s !== user.bookedSeatNumber);
      }
    }

    const stopId = user.pickupStopId;
    const stop = this.getStopById(stopId);
    const bus = this.getBusById(user.assignedBusId);
    const route = this.routes.find(r => r.id === user.assignedRouteId);

    // Count other active students at this stop
    const otherActiveStudentsAtStop = this.users.filter(u => 
      u.role === 'student' &&
      u.id !== user.id &&
      u.assignedBusId === user.assignedBusId &&
      u.pickupStopId === stopId &&
      u.isTravellingToday === true
    );

    let bypassed = true;

    // Dynamically reroute bus: bypass this student's home stop on the map and route path!
    if (route && stop) {
      if (!route.bypassedStopIds) route.bypassedStopIds = [];
      if (!route.bypassedStopIds.includes(stopId)) {
        route.bypassedStopIds.push(stopId);
      }

      // Mark stop state
      stop.isBypassed = true;
      stop.bypassedNotice = `Bypassed for ${bus ? bus.callsign : 'bus'}: passenger cancelled ride from home`;

      // Update active stops list on the route
      route.activeStops = route.stops.filter(sId => !route.bypassedStopIds.includes(sId));

      // Recompute waypoints: remove waypoints close to this bypassed stop to create direct bypass path
      const origRoute = this.originalRoutes.find(r => r.id === route.id);
      if (origRoute) {
        route.waypoints = origRoute.waypoints.filter(wp => {
          const dist = Math.hypot(wp.lat - stop.lat, wp.lng - stop.lng);
          return dist > 0.003; // remove points within ~350m of bypassed stop
        });
      }

      // If bus was currently targeting this stop, advance to next
      if (bus && bus.nextStopId === stopId) {
        const remainingStops = route.activeStops;
        const currentIdx = remainingStops.indexOf(stopId);
        bus.nextStopId = remainingStops[currentIdx >= 0 ? currentIdx + 1 : 0] || 'stop-11';
        bus.etaMinutesNextStop = Math.max(1, (bus.etaMinutesNextStop || 4) - 2);
      }

      // Adjust bus waypoint index to prevent out-of-bounds
      if (bus && bus.currentWaypointIndex >= route.waypoints.length) {
        bus.currentWaypointIndex = Math.max(0, route.waypoints.length - 1);
      }

      // Log official notification
      const notif = {
        id: `notif-${Date.now()}`,
        title: `⚡ Dynamic Route Update: ${stop.name} Bypassed`,
        message: `${bus ? bus.callsign : 'Bus'} path updated: ${stop.name} removed from active route as passenger cancelled ride today. Estimated ~5 mins saved.`,
        type: 'ROUTE_UPDATE',
        targetType: 'ROUTE',
        targetId: route.id,
        readBy: [],
        timestamp: new Date().toISOString()
      };
      this.notifications.unshift(notif);

      if (this.io) {
        this.io.emit('route_rerouted_event', {
          routeId: route.id,
          busId: user.assignedBusId,
          bypassedStopId: stopId,
          stopName: stop.name,
          routes: this.routes,
          stops: this.stops,
          buses: this.buses,
          notification: notif
        });
      }
    }

    if (this.io) {
      this.io.emit('student_travel_status_updated', {
        userId: user.id,
        name: user.name,
        rollNumber: user.rollNumber,
        isTravellingToday: false,
        rideCancelled: true,
        assignedBusId: user.assignedBusId
      });
    }

    return {
      success: true,
      user,
      bypassed,
      stopName: stop ? stop.name : 'Pickup Stop',
      busCallsign: bus ? bus.callsign : 'NUV Bus',
      remainingStudentsAtStop: otherActiveStudentsAtStop.length
    };
  }

  // Resume student's ride and restore original route
  resumeStudentRide(userId) {
    const user = this.getUserById(userId);
    if (!user) return { success: false, message: 'User not found' };

    user.isTravellingToday = true;
    user.rideCancelled = false;

    const stopId = user.pickupStopId;
    const stop = this.getStopById(stopId);
    const bus = this.getBusById(user.assignedBusId);
    const route = this.routes.find(r => r.id === user.assignedRouteId);

    let restored = false;
    if (route && stop && route.bypassedStopIds && route.bypassedStopIds.includes(stopId)) {
      restored = true;
      route.bypassedStopIds = route.bypassedStopIds.filter(id => id !== stopId);
      stop.isBypassed = false;
      stop.bypassedNotice = null;

      // Restore original stops and waypoints
      const origRoute = this.originalRoutes.find(r => r.id === route.id);
      if (origRoute) {
        route.stops = JSON.parse(JSON.stringify(origRoute.stops));
        route.activeStops = route.stops.filter(sId => !(route.bypassedStopIds || []).includes(sId));
        route.waypoints = JSON.parse(JSON.stringify(origRoute.waypoints));
      }

      if (this.io) {
        this.io.emit('route_rerouted_event', {
          routeId: route.id,
          busId: user.assignedBusId,
          restoredStopId: stopId,
          stopName: stop.name,
          routes: this.routes,
          stops: this.stops,
          buses: this.buses
        });
      }
    }

    if (this.io) {
      this.io.emit('student_travel_status_updated', {
        userId: user.id,
        name: user.name,
        rollNumber: user.rollNumber,
        isTravellingToday: true,
        rideCancelled: false,
        assignedBusId: user.assignedBusId
      });
    }

    return {
      success: true,
      user,
      restored,
      stopName: stop ? stop.name : 'Pickup Stop'
    };
  }

  // Student enters / boards bus
  boardStudentOnBus(userId, busId) {
    const user = this.getUserById(userId);
    if (!user) return { success: false, message: 'Student not found in roster' };

    const bus = this.getBusById(busId || user.assignedBusId || 'bus-01');
    if (!bus) return { success: false, message: 'Bus not found' };

    user.isBoarded = true;
    user.boardedAtTime = new Date().toLocaleTimeString();
    user.boardedBusId = bus.id;

    // Increment bus occupancy
    bus.currentOccupancy = Math.min(bus.capacity, (bus.currentOccupancy || 0) + 1);

    // Decrement waiting queue at student's home stop
    if (user.pickupStopId) {
      const stop = this.getStopById(user.pickupStopId);
      if (stop && stop.currentWaitingCount > 0) {
        stop.currentWaitingCount = Math.max(0, stop.currentWaitingCount - 1);
      }
    }

    const record = {
      studentId: user.id,
      name: user.name,
      rollNumber: user.rollNumber,
      stopId: user.pickupStopId,
      boardedAt: new Date().toISOString(),
      busId: bus.id,
      busCallsign: bus.callsign
    };

    if (this.addBoardingRecord) {
      this.addBoardingRecord(bus.id, record);
    }

    if (this.io) {
      this.io.emit('student_boarded_event', {
        busId: bus.id,
        student: user,
        currentOccupancy: bus.currentOccupancy,
        stops: this.stops
      });
      this.io.emit('fleet_updated', { buses: this.buses });
    }

    return {
      success: true,
      message: `Boarding confirmed! You are now inside ${bus.callsign} heading to Navrachana University Campus.`,
      user,
      bus
    };
  }

  // Student deboards at Navrachana University Campus
  deboardStudentFromBus(userId) {
    const user = this.getUserById(userId);
    if (!user) return { success: false, message: 'Student not found' };

    const bus = this.getBusById(user.boardedBusId || user.assignedBusId || 'bus-01');
    user.isBoarded = false;
    user.boardedBusId = null;

    if (bus && bus.currentOccupancy > 0) {
      bus.currentOccupancy = Math.max(0, bus.currentOccupancy - 1);
    }

    if (this.io) {
      this.io.emit('student_deboarded_event', {
        busId: bus ? bus.id : null,
        student: user,
        currentOccupancy: bus ? bus.currentOccupancy : 0
      });
      this.io.emit('fleet_updated', { buses: this.buses });
    }

    return {
      success: true,
      message: `Deboarded safely at Navrachana University Campus. Have a great day!`,
      user,
      bus
    };
  }

  // Update semester electives selection (Morning and Evening)
  updateSemesterElectives(userId, morningCode, eveningCode) {
    const user = this.getUserById(userId);
    if (!user) return { success: false, message: 'User not found' };

    user.semesterElectives = {
      morningElective: morningCode || 'NONE',
      eveningElective: eveningCode || 'NONE'
    };

    user.hasMorningElective = Boolean(morningCode && morningCode !== 'NONE');
    user.hasEveningElective = Boolean(eveningCode && eveningCode !== 'NONE');

    user.timetableType = (user.hasMorningElective && user.hasEveningElective)
      ? 'FULL_ELECTIVE'
      : user.hasMorningElective
      ? 'MORNING_ELECTIVE'
      : user.hasEveningElective
      ? 'EVENING_ELECTIVE'
      : 'REGULAR';

    user.morningShift = user.hasMorningElective ? 'EARLY_8AM' : 'REGULAR_10AM';
    user.returnShift = user.hasEveningElective ? 'LATE_7PM' : 'REGULAR_5PM';

    if (this.io) {
      this.io.emit('student_electives_updated', {
        userId: user.id,
        semesterElectives: user.semesterElectives,
        hasMorningElective: user.hasMorningElective,
        hasEveningElective: user.hasEveningElective,
        morningShift: user.morningShift,
        returnShift: user.returnShift
      });
    }

    return { success: true, user };
  }

  // ----------------------------------------------------
  // STUDENT COMMUTER SUBSCRIPTIONS (MONTHLY & YEARLY IN INR)
  // ----------------------------------------------------
  getSubscriptions(statusFilter) {
    if (!statusFilter || statusFilter === 'ALL') {
      return this.subscriptions;
    }
    return this.subscriptions.filter(s => s.status === statusFilter);
  }

  getStudentSubscription(studentId) {
    const user = this.getUserById(studentId);
    if (user && user.subscription) return user.subscription;
    return this.subscriptions.find(s => s.studentId === studentId || (user && s.studentRollNumber === user.rollNumber)) || null;
  }

  requestSubscription(studentId, planType = 'MONTHLY', paymentMethod = 'UPI', transactionRef) {
    const user = this.getUserById(studentId);
    if (!user) return { success: false, message: 'Student record not found.' };

    const isYearly = planType === 'YEARLY';
    const amountInr = isYearly ? 14999 : 1499;
    const durationDays = isYearly ? 365 : 30;
    const planName = isYearly ? 'Yearly Annual Campus Pass' : 'Monthly Commuter Pass';

    const newSubscription = {
      id: `sub-${Date.now()}-${Math.floor(100 + Math.random() * 900)}`,
      studentId: user.id,
      studentRollNumber: user.rollNumber || 'NUV-STUDENT',
      studentName: user.name,
      planType: isYearly ? 'YEARLY' : 'MONTHLY',
      planName,
      amountInr,
      durationDays,
      paymentMethod: paymentMethod || 'UPI',
      transactionRef: transactionRef || `TXN-NUV-${Date.now().toString().slice(-6)}`,
      requestedAt: new Date().toISOString(),
      status: 'PENDING_APPROVAL',
      reviewedAt: null,
      reviewedBy: null,
      rejectionReason: null,
      validFrom: null,
      validUntil: null,
      passCode: null
    };

    // Replace previous or add new
    const existingIdx = this.subscriptions.findIndex(s => s.studentId === user.id || s.studentRollNumber === user.rollNumber);
    if (existingIdx !== -1) {
      this.subscriptions[existingIdx] = newSubscription;
    } else {
      this.subscriptions.unshift(newSubscription);
    }

    user.subscription = newSubscription;

    // Notify admins
    const notif = {
      id: `notif-${Date.now()}`,
      title: `New Commute Pass Subscription (${newSubscription.planName})`,
      message: `${user.name} (${user.rollNumber}) applied for ${newSubscription.planName} (₹${amountInr.toLocaleString('en-IN')}). Approval required.`,
      type: 'SUBSCRIPTION_REQUEST',
      targetType: 'ADMIN',
      targetId: 'admin',
      readBy: [],
      timestamp: new Date().toISOString()
    };
    this.notifications.unshift(notif);

    if (this.io) {
      this.io.emit('subscription_updated', {
        studentId: user.id,
        subscription: newSubscription,
        subscriptions: this.subscriptions
      });
      this.io.emit('new_notification_broadcast', notif);
    }

    return {
      success: true,
      message: `Your ${planName} request (₹${amountInr.toLocaleString('en-IN')}) has been submitted for Admin approval.`,
      subscription: newSubscription
    };
  }

  acceptSubscription(subscriptionId, adminUser) {
    const sub = this.subscriptions.find(s => s.id === subscriptionId);
    if (!sub) return { success: false, message: 'Subscription request not found.' };

    const validFrom = new Date();
    const validUntil = new Date(Date.now() + sub.durationDays * 86400000);
    const passCode = `NUV-PASS-${Date.now().toString().slice(-5)}`;

    sub.status = 'ACTIVE';
    sub.reviewedAt = new Date().toISOString();
    sub.reviewedBy = (adminUser && adminUser.name) ? adminUser.name : 'University Transit Admin';
    sub.rejectionReason = null;
    sub.validFrom = validFrom.toISOString();
    sub.validUntil = validUntil.toISOString();
    sub.passCode = passCode;

    // Sync with student user
    const user = this.getUserById(sub.studentId) || this.users.find(u => u.rollNumber === sub.studentRollNumber);
    if (user) {
      user.subscription = sub;
      user.isTravellingToday = true;
    }

    // Student notification
    const notif = {
      id: `notif-${Date.now()}`,
      title: `Commute Pass Activated! 🎟️`,
      message: `Your ${sub.planName} (₹${sub.amountInr.toLocaleString('en-IN')}) has been approved! Digital Pass: ${passCode}. Show to driver upon boarding.`,
      type: 'SUBSCRIPTION_APPROVED',
      targetType: 'STUDENT',
      targetId: sub.studentId,
      readBy: [],
      timestamp: new Date().toISOString()
    };
    this.notifications.unshift(notif);

    if (this.io) {
      this.io.emit('subscription_status_changed', {
        subscription: sub,
        studentId: sub.studentId,
        subscriptions: this.subscriptions
      });
      this.io.emit('new_notification_broadcast', notif);
    }

    return {
      success: true,
      message: `Pass for ${sub.studentName} (${sub.studentRollNumber}) approved and activated! Pass Code: ${passCode}`,
      subscription: sub
    };
  }

  rejectSubscription(subscriptionId, reason, adminUser) {
    const sub = this.subscriptions.find(s => s.id === subscriptionId);
    if (!sub) return { success: false, message: 'Subscription request not found.' };

    sub.status = 'REJECTED';
    sub.reviewedAt = new Date().toISOString();
    sub.reviewedBy = (adminUser && adminUser.name) ? adminUser.name : 'University Transit Admin';
    sub.rejectionReason = reason || 'Payment unverified or fee clearance required from accounts office.';

    const user = this.getUserById(sub.studentId) || this.users.find(u => u.rollNumber === sub.studentRollNumber);
    if (user) {
      user.subscription = sub;
    }

    // Student notification
    const notif = {
      id: `notif-${Date.now()}`,
      title: `Commute Pass Request Rejected ⚠️`,
      message: `Your ${sub.planName} request was not approved: "${sub.rejectionReason}". Please update details or reapply.`,
      type: 'SUBSCRIPTION_REJECTED',
      targetType: 'STUDENT',
      targetId: sub.studentId,
      readBy: [],
      timestamp: new Date().toISOString()
    };
    this.notifications.unshift(notif);

    if (this.io) {
      this.io.emit('subscription_status_changed', {
        subscription: sub,
        studentId: sub.studentId,
        subscriptions: this.subscriptions
      });
      this.io.emit('new_notification_broadcast', notif);
    }

    return {
      success: true,
      message: `Pass request for ${sub.studentName} has been rejected.`,
      subscription: sub
    };
  }
}

module.exports = TelemetrySimulator;
