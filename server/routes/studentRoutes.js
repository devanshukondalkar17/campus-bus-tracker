const express = require('express');
const { authMiddleware } = require('../middleware/auth');

module.exports = (simulator, aiEngine, io) => {
  const router = express.Router();
  const controller = require('../controllers/studentController')(simulator, aiEngine, io);

  router.post('/checkin', controller.checkInAtStop);
  router.post('/reaction', controller.submitCrowdReaction);
  
  // Midday Break (1:00 PM - 2:00 PM) Flexible Transit Booking
  router.post('/book-midday-break', controller.bookMiddayBreak);
  router.post('/cancel-midday-break', controller.cancelMiddayBreak);

  // Student Bus Schedule Booking (Arrival: 7 AM, 9 AM, 1 PM | Departure: 7 PM)
  router.post('/commute-schedule', controller.updateCommuteSchedule);
  router.get('/commute-schedule', controller.getCommuteSchedule);

  // Elective Timetable Preferences & Semester Electives Catalog
  router.post('/timetable-preferences', controller.updateTimetablePreferences);
  router.get('/semester-electives', controller.getSemesterElectives);
  router.post('/semester-electives', controller.saveSemesterElectives);

  // Dynamic Route Bypass: Cancel Ride & Reroute Bus
  router.post('/cancel-ride', controller.cancelRide);
  router.post('/resume-ride', controller.resumeRide);

  // Student Enters / Boards Bus
  router.post('/board-bus', controller.boardBus);
  router.post('/deboard-bus', controller.deboardBus);

  // 200 Student Roster & Shift Breakdown
  router.get('/roster', controller.getRoster);

  // Student Commute Pass Subscriptions (Monthly & Yearly in INR)
  router.get('/subscription/current', controller.getCurrentSubscription);
  router.post('/subscription/request', controller.requestSubscription);

  return router;
};
