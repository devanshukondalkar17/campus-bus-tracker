module.exports = (simulator, aiEngine, io) => {
  return {
    checkInAtStop: (req, res) => {
      const { stopId, studentCount = 1 } = req.body;
      const stop = simulator.getStopById(stopId);

      if (!stop) {
        return res.status(404).json({ success: false, message: 'Stop not found' });
      }

      stop.currentWaitingCount = (stop.currentWaitingCount || 0) + Number(studentCount);

      // Check if threshold exceeded for auto surge alert
      if (stop.currentWaitingCount > 50) {
        aiEngine.addAlert({
          title: `Stop Congestion Surge: ${stop.name}`,
          message: `${stop.currentWaitingCount} students queued. High probability of boarding delays.`,
          severity: 'WARNING',
          relatedRouteId: null
        });
      }

      if (io) {
        io.emit('stop_checkin_updated', {
          stopId: stop.id,
          name: stop.name,
          currentWaitingCount: stop.currentWaitingCount
        });
      }

      res.json({
        success: true,
        message: `Checked in at ${stop.name}`,
        currentWaitingCount: stop.currentWaitingCount
      });
    },

    submitCrowdReaction: (req, res) => {
      const { type, busId, stopId, note } = req.body;
      
      const alert = {
        title: `Student Report: ${type}`,
        message: note || `Crowdsourced student alert logged for vehicle ${busId || 'N/A'}.`,
        severity: type === 'EMERGENCY' ? 'CRITICAL' : 'INFO',
        relatedBusId: busId,
        source: 'Crowdsourced Passenger Beacon'
      };

      aiEngine.addAlert(alert);

      if (io) {
        io.emit('student_reaction_broadcast', {
          type,
          busId,
          stopId,
          note,
          alerts: aiEngine.getActiveAlerts()
        });
      }

      res.json({
        success: true,
        message: 'Reaction received. Thank you for campus safety participation!'
      });
    },

    // Book Midday Break Shuttle (1:00 PM - 2:00 PM window)
    // Allows leaving early during lunch break (1:05 PM) or arriving for afternoon classes (1:15 PM)
    bookMiddayBreak: (req, res) => {
      const { studentId, bookingType, busId, stopId, seatNumber } = req.body;
      // studentId can come from auth token if authenticated
      const targetId = (req.user && req.user.id) || studentId || 'usr-student-001';
      const student = simulator.getUserById(targetId);

      if (!student) {
        return res.status(404).json({ success: false, message: 'Student not found in roster.' });
      }

      const bus = simulator.getBusById(busId || student.assignedBusId || 'bus-01');
      const stop = simulator.getStopById(stopId || student.pickupStopId || 'stop-01');

      const isExit = bookingType === 'EARLY_EXIT';
      const refCode = `MD-${isExit ? 'EXIT' : 'ARR'}-${Math.floor(1000 + Math.random() * 9000)}`;

      student.middayBooking = {
        type: isExit ? 'EARLY_EXIT' : 'AFTERNOON_ARRIVAL',
        label: isExit
          ? 'Early Exit in Break (1:05 PM Departure from Bhayli Campus)'
          : 'Afternoon Arrival in Break (1:15 PM Pickup -> 1:55 PM Campus)',
        departureTime: isExit ? '01:05 PM' : '01:15 PM',
        busId: bus ? bus.id : student.assignedBusId,
        busCallsign: bus ? bus.callsign : 'NUV Transit Bus',
        dropStopId: isExit ? (stop ? stop.id : 'stop-01') : null,
        dropStopName: isExit ? (stop ? stop.name : 'Home Area Stop') : null,
        pickupStopId: !isExit ? (stop ? stop.id : 'stop-01') : null,
        pickupStopName: !isExit ? (stop ? stop.name : 'Home Area Stop') : null,
        seatNumber: seatNumber || `${Math.floor(Math.random() * 12) + 1}B`,
        status: 'CONFIRMED',
        bookingRef: refCode,
        bookedAt: new Date().toISOString()
      };

      if (isExit) {
        student.returnShift = 'MIDDAY_BREAK_1PM';
      } else {
        student.morningShift = 'AFTERNOON_2PM';
      }

      if (io) {
        io.emit('midday_booking_broadcast', {
          studentId: student.id,
          studentName: student.name,
          busId: student.middayBooking.busId,
          middayBooking: student.middayBooking
        });
      }

      res.json({
        success: true,
        message: isExit
          ? `Confirmed! Your 1:05 PM Midday Early Exit shuttle is booked on ${bus ? bus.callsign : 'bus'}.`
          : `Confirmed! Your 1:15 PM Afternoon Arrival shuttle is booked on ${bus ? bus.callsign : 'bus'}.`,
        middayBooking: student.middayBooking,
        user: student
      });
    },

    // Cancel Midday Break Booking
    cancelMiddayBreak: (req, res) => {
      const targetId = (req.user && req.user.id) || req.body.studentId || 'usr-student-001';
      const student = simulator.getUserById(targetId);

      if (!student) {
        return res.status(404).json({ success: false, message: 'Student not found in roster.' });
      }

      student.middayBooking = null;
      student.morningShift = student.hasMorningElective ? 'EARLY_8AM' : 'REGULAR_10AM';
      student.returnShift = student.hasEveningElective ? 'LATE_7PM' : 'REGULAR_5PM';

      if (io) {
        io.emit('midday_booking_broadcast', {
          studentId: student.id,
          studentName: student.name,
          middayBooking: null
        });
      }

      res.json({
        success: true,
        message: 'Midday break shuttle booking released successfully.',
        middayBooking: null,
        user: student
      });
    },

    // Update Student Academic Timetable Preferences
    updateTimetablePreferences: (req, res) => {
      const { studentId, hasMorningElective, hasEveningElective, arrivalTime } = req.body;
      const targetId = (req.user && req.user.id) || studentId || 'usr-student-001';
      const student = simulator.getUserById(targetId);

      if (!student) {
        return res.status(404).json({ success: false, message: 'Student not found.' });
      }

      if (arrivalTime) {
        student.commuteSchedule = {
          arrivalTime,
          departureTime: '07:00 PM',
          status: 'CONFIRMED',
          bookedAt: new Date().toISOString()
        };
      }

      if (io) {
        io.emit('student_timetable_updated', {
          studentId: student.id,
          commuteSchedule: student.commuteSchedule,
          morningShift: student.morningShift,
          returnShift: student.returnShift
        });
      }

      res.json({
        success: true,
        message: 'Bus commute schedule confirmed successfully.',
        user: student
      });
    },

    // Book Student Bus Schedule: Inbound Arrival (7 AM, 9 AM, 1 PM) and Departure (7 PM)
    updateCommuteSchedule: (req, res) => {
      const { studentId, arrivalTime, departureTime = '07:00 PM' } = req.body;
      const targetId = (req.user && req.user.id) || studentId || 'usr-student-001';
      const student = simulator.getUserById(targetId);

      if (!student) {
        return res.status(404).json({ success: false, message: 'Student not found in roster.' });
      }

      const validArrivals = ['07:00 AM', '09:00 AM', '01:00 PM', '7:00 AM', '9:00 AM', '1:00 PM'];
      let normalizedArrival = '09:00 AM';
      if (arrivalTime && (arrivalTime.includes('7') || arrivalTime.includes('07'))) normalizedArrival = '07:00 AM';
      else if (arrivalTime && (arrivalTime.includes('1') || arrivalTime.includes('01'))) normalizedArrival = '01:00 PM';
      else if (arrivalTime && (arrivalTime.includes('9') || arrivalTime.includes('09'))) normalizedArrival = '09:00 AM';

      student.commuteSchedule = {
        arrivalTime: normalizedArrival,
        departureTime: '07:00 PM',
        status: 'CONFIRMED',
        bookedAt: new Date().toISOString()
      };

      if (normalizedArrival === '07:00 AM') {
        student.morningShift = 'EARLY_7AM';
      } else if (normalizedArrival === '01:00 PM') {
        student.morningShift = 'AFTERNOON_1PM';
      } else {
        student.morningShift = 'REGULAR_9AM';
      }
      student.returnShift = 'EVENING_7PM';

      if (io) {
        io.emit('student_commute_schedule_updated', {
          studentId: student.id,
          commuteSchedule: student.commuteSchedule,
          morningShift: student.morningShift,
          returnShift: student.returnShift
        });
      }

      res.json({
        success: true,
        message: `Bus schedule confirmed! Inbound Arrival: ${normalizedArrival} | Campus Departure: 07:00 PM`,
        commuteSchedule: student.commuteSchedule,
        user: student
      });
    },

    getCommuteSchedule: (req, res) => {
      const targetId = (req.user && req.user.id) || req.query.studentId || 'usr-student-001';
      const student = simulator.getUserById(targetId);

      if (!student) {
        return res.status(404).json({ success: false, message: 'Student not found.' });
      }

      const schedule = student.commuteSchedule || {
        arrivalTime: '09:00 AM',
        departureTime: '07:00 PM',
        status: 'CONFIRMED'
      };

      res.json({
        success: true,
        commuteSchedule: schedule
      });
    },

    // Full 200 Students Roster with Shift & Area Breakdown
    getRoster: (req, res) => {
      const { busId, area, shift, electiveOnly } = req.query;
      let allStudents = simulator.getUsers().filter(u => u.role === 'student');

      if (busId) {
        allStudents = allStudents.filter(s => s.assignedBusId === busId);
      }
      if (area) {
        allStudents = allStudents.filter(s => s.areaName && s.areaName.toLowerCase().includes(area.toLowerCase()));
      }
      if (shift) {
        if (shift === 'EARLY_8AM') allStudents = allStudents.filter(s => s.morningShift === 'EARLY_8AM');
        else if (shift === 'REGULAR_10AM') allStudents = allStudents.filter(s => s.morningShift === 'REGULAR_10AM');
        else if (shift === 'MIDDAY_BREAK_1PM') allStudents = allStudents.filter(s => s.returnShift === 'MIDDAY_BREAK_1PM');
        else if (shift === 'AFTERNOON_2PM') allStudents = allStudents.filter(s => s.morningShift === 'AFTERNOON_2PM');
        else if (shift === 'REGULAR_5PM') allStudents = allStudents.filter(s => s.returnShift === 'REGULAR_5PM');
        else if (shift === 'LATE_7PM') allStudents = allStudents.filter(s => s.returnShift === 'LATE_7PM');
      }
      if (electiveOnly === 'true') {
        allStudents = allStudents.filter(s => s.hasMorningElective || s.hasEveningElective);
      }

      const shiftSummary = {
        totalStudents: 200,
        morningElective8AM: simulator.getUsers().filter(u => u.role === 'student' && u.morningShift === 'EARLY_8AM').length,
        regularClass10AM: simulator.getUsers().filter(u => u.role === 'student' && u.morningShift === 'REGULAR_10AM').length,
        middayBreakEarlyExit: simulator.getUsers().filter(u => u.role === 'student' && u.returnShift === 'MIDDAY_BREAK_1PM').length,
        middayAfternoonInbound: simulator.getUsers().filter(u => u.role === 'student' && u.morningShift === 'AFTERNOON_2PM').length,
        regularEvening5PM: simulator.getUsers().filter(u => u.role === 'student' && u.returnShift === 'REGULAR_5PM').length,
        eveningElective7PM: simulator.getUsers().filter(u => u.role === 'student' && u.returnShift === 'LATE_7PM').length,
        bus1Pax: simulator.getUsers().filter(u => u.role === 'student' && u.assignedBusId === 'bus-01').length,
        bus2Pax: simulator.getUsers().filter(u => u.role === 'student' && u.assignedBusId === 'bus-02').length,
        bus3Pax: simulator.getUsers().filter(u => u.role === 'student' && u.assignedBusId === 'bus-03').length,
        bus4Pax: simulator.getUsers().filter(u => u.role === 'student' && u.assignedBusId === 'bus-04').length
      };

      res.json({
        success: true,
        count: allStudents.length,
        summary: shiftSummary,
        students: allStudents
      });
    },

    // Cancel Today's Ride and Dynamically Reroute Bus to Bypass Stop
    cancelRide: (req, res) => {
      const targetId = (req.user && req.user.id) || req.body.studentId || 'usr-student-001';
      const result = simulator.cancelStudentRide(targetId);

      if (!result.success) {
        return res.status(400).json(result);
      }

      res.json({
        success: true,
        message: result.bypassed
          ? `Ride cancelled. ${result.busCallsign} has been dynamically rerouted to BYPASS your stop (${result.stopName}) today.`
          : `Ride cancelled. Your seat has been released (${result.remainingStudentsAtStop} other students boarding at ${result.stopName}).`,
        bypassed: result.bypassed,
        stopName: result.stopName,
        busCallsign: result.busCallsign,
        user: result.user
      });
    },

    // Resume Commute and Restore Stop to Active Bus Route
    resumeRide: (req, res) => {
      const targetId = (req.user && req.user.id) || req.body.studentId || 'usr-student-001';
      const result = simulator.resumeStudentRide(targetId);

      if (!result.success) {
        return res.status(400).json(result);
      }

      res.json({
        success: true,
        message: result.restored
          ? `Ride restored! Your stop (${result.stopName}) has been re-added to the bus route sequence.`
          : `Ride restored! You are marked as travelling today.`,
        restored: result.restored,
        stopName: result.stopName,
        user: result.user
      });
    },

    // Get Official Semester Electives Catalog
    getSemesterElectives: (req, res) => {
      const catalog = simulator.getElectivesCatalog();
      const targetId = (req.user && req.user.id) || req.query.studentId || 'usr-student-001';
      const student = simulator.getUserById(targetId);

      res.json({
        success: true,
        catalog,
        currentElectives: student ? (student.semesterElectives || { morningElective: 'NONE', eveningElective: 'NONE' }) : null
      });
    },

    // Save Semester Elective Selection (Morning and Evening)
    saveSemesterElectives: (req, res) => {
      const { studentId, morningElective, eveningElective } = req.body;
      const targetId = (req.user && req.user.id) || studentId || 'usr-student-001';
      const result = simulator.updateSemesterElectives(targetId, morningElective, eveningElective);

      if (!result.success) {
        return res.status(400).json(result);
      }

      res.json({
        success: true,
        message: 'Semester electives confirmed and bus shifts synchronized!',
        user: result.user
      });
    },

    // Student enters/boards the bus
    boardBus: (req, res) => {
      const targetId = (req.user && req.user.id) || req.body.studentId || 'usr-student-001';
      const { busId } = req.body;
      const result = simulator.boardStudentOnBus(targetId, busId);

      if (!result.success) {
        return res.status(400).json(result);
      }

      res.json(result);
    },

    // Student deboards at Navrachana University Campus
    deboardBus: (req, res) => {
      const targetId = (req.user && req.user.id) || req.body.studentId || 'usr-student-001';
      const result = simulator.deboardStudentFromBus(targetId);

      if (!result.success) {
        return res.status(400).json(result);
      }

      res.json(result);
    },

    // ----------------------------------------------------
    // STUDENT COMMUTER SUBSCRIPTIONS (MONTHLY & YEARLY IN INR)
    // ----------------------------------------------------
    getCurrentSubscription: (req, res) => {
      const targetId = (req.user && req.user.id) || req.query.studentId || 'usr-student-001';
      const subscription = simulator.getStudentSubscription(targetId);

      res.json({
        success: true,
        subscription,
        plans: [
          {
            id: 'MONTHLY',
            name: 'Monthly Commuter Pass',
            amountInr: 1499,
            billingPeriod: 'Per Month (30 Days)',
            discountBadge: null,
            features: [
              'Unlimited Daily Commute on Assigned Route',
              'Guaranteed Reserved Seat Allocation',
              'Real-Time 1Hz GPS Bus Tracking & Arrival Alerts',
              'Valid for 07:00 AM, 09:00 AM, 01:00 PM & 07:00 PM Shifts',
              'Instant Digital Bus Pass QR Code for Driver Verification'
            ]
          },
          {
            id: 'YEARLY',
            name: 'Yearly Annual Campus Pass',
            amountInr: 14999,
            billingPeriod: 'Per Academic Year (365 Days)',
            discountBadge: 'Save 17% (₹3,000 Off)',
            popular: true,
            features: [
              'Full 2 Semesters + Exam Shuttle Express Coverage',
              'Priority Boarding & Express Campus Corridor',
              'Zero Fare Hikes for Entire Academic Year',
              'Complimentary Midday Break Shuttle Access',
              'Annual Official Commuter Certificate from NUV'
            ]
          }
        ]
      });
    },

    requestSubscription: (req, res) => {
      const targetId = (req.user && req.user.id) || req.body.studentId || 'usr-student-001';
      const { planType, paymentMethod, transactionRef } = req.body;

      const result = simulator.requestSubscription(targetId, planType, paymentMethod, transactionRef);

      if (!result.success) {
        return res.status(400).json(result);
      }

      res.json(result);
    }
  };
};
