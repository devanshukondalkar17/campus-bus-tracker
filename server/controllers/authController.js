const { signToken, comparePassword, hashPassword } = require('../middleware/auth');

module.exports = (simulator, io) => {
  return {
    // Login with either College Email OR Roll Number
    login: async (req, res) => {
      const { identifier, password } = req.body; // identifier can be email or rollNumber
      if (!identifier || !password) {
        return res.status(400).json({ success: false, message: 'Please provide Email/Roll Number and Password.' });
      }

      const cleanId = identifier.trim().toLowerCase();
      const users = simulator.getUsers();

      // Find user by email, rollNumber, user ID, or role alias
      const user = users.find(u => {
        const uEmail = (u.email || '').toLowerCase();
        const uRoll = (u.rollNumber || '').toLowerCase();
        const uId = (u.id || '').toLowerCase();
        const uBus = (u.assignedBusId || '').toLowerCase();

        // Direct matches
        if (uEmail === cleanId || uRoll === cleanId || uId === cleanId) return true;

        // Admin aliases
        if ((cleanId === 'admin' || cleanId === 'admin1' || cleanId === 'admin1@nuv.ac.in') && u.id === 'usr-admin-01') return true;
        if ((cleanId === 'admin2' || cleanId === 'admin2@nuv.ac.in') && u.id === 'usr-admin-02') return true;

        // Driver aliases
        if ((cleanId === 'driver1' || cleanId === 'driver-01' || cleanId === 'driver.ramesh@nuv.ac.in') && u.id === 'usr-driver-01') return true;
        if ((cleanId === 'driver2' || cleanId === 'driver-02' || cleanId === 'driver.jignesh@nuv.ac.in') && u.id === 'usr-driver-02') return true;
        if ((cleanId === 'driver3' || cleanId === 'driver-03' || cleanId === 'driver.mukesh@nuv.ac.in') && u.id === 'usr-driver-03') return true;
        if ((cleanId === 'driver4' || cleanId === 'driver-04' || cleanId === 'driver.haresh@nuv.ac.in') && u.id === 'usr-driver-04') return true;
        if (u.role === 'driver' && uBus === cleanId) return true;

        // Student roll number shorthand e.g. "001" -> "NUV24CS001" or "student001" / "student1"
        if (u.role === 'student') {
          const numMatch = cleanId.replace(/[^0-9]/g, '');
          if (numMatch && numMatch.length <= 3) {
            const formattedRoll = `nuv24cs${numMatch.padStart(3, '0')}`;
            if (uRoll === formattedRoll) return true;
          }
        }

        return false;
      });

      if (!user) {
        return res.status(401).json({ success: false, message: 'Invalid credentials. User ID, Roll Number or Email not found.' });
      }

      const isMatch = comparePassword(password, user.password);
      if (!isMatch) {
        return res.status(401).json({ success: false, message: 'Invalid credentials. Password mismatch.' });
      }

      // Generate JWT
      const token = signToken({
        id: user.id,
        email: user.email,
        role: user.role,
        name: user.name,
        rollNumber: user.rollNumber,
        assignedBusId: user.assignedBusId,
        assignedRouteId: user.assignedRouteId
      });

      // Exclude password from response
      const { password: _, ...userSafe } = user;

      res.json({
        success: true,
        message: `Welcome back, ${user.name}!`,
        token,
        user: userSafe
      });
    },

    // Register a new Student or Driver
    register: async (req, res) => {
      const { name, email, rollNumber, password, role = 'student', phone, assignedRouteId, pickupStopId } = req.body;

      if (!name || !email || !password) {
        return res.status(400).json({ success: false, message: 'Name, email and password are required.' });
      }

      const users = simulator.getUsers();
      const existing = users.find(u => u.email.toLowerCase() === email.trim().toLowerCase());
      if (existing) {
        return res.status(400).json({ success: false, message: 'An account with this email already exists.' });
      }

      const newUser = {
        id: `usr-${role}-${Date.now()}`,
        name: name.trim(),
        email: email.trim().toLowerCase(),
        rollNumber: rollNumber ? rollNumber.trim().toUpperCase() : null,
        password: hashPassword(password),
        role,
        phone: phone || '',
        assignedBusId: assignedRouteId ? (simulator.getBusesByRoute(assignedRouteId)[0] || {}).id : null,
        assignedRouteId: assignedRouteId || 'route-101',
        pickupStopId: pickupStopId || 'stop-01',
        isTravellingToday: true,
        bookedSeatNumber: null,
        favouriteStopId: pickupStopId || 'stop-01',
        favouriteRouteId: assignedRouteId || 'route-101'
      };

      users.push(newUser);

      const token = signToken({
        id: newUser.id,
        email: newUser.email,
        role: newUser.role,
        name: newUser.name,
        rollNumber: newUser.rollNumber
      });

      const { password: _, ...userSafe } = newUser;

      res.status(201).json({
        success: true,
        message: 'Account registered successfully!',
        token,
        user: userSafe
      });
    },

    // Get Logged-in Profile
    getProfile: (req, res) => {
      const user = simulator.getUserById(req.user.id);
      if (!user) {
        return res.status(404).json({ success: false, message: 'User not found.' });
      }
      const { password: _, ...userSafe } = user;
      res.json({ success: true, user: userSafe });
    },

    // "I'm Travelling Today" / "Not Travelling" Toggle
    toggleTravelStatus: (req, res) => {
      const { isTravellingToday } = req.body;
      const user = simulator.getUserById(req.user.id);
      if (!user) return res.status(404).json({ success: false, message: 'User not found.' });

      user.isTravellingToday = Boolean(isTravellingToday);

      if (io) {
        io.emit('student_travel_status_updated', {
          userId: user.id,
          name: user.name,
          rollNumber: user.rollNumber,
          isTravellingToday: user.isTravellingToday,
          assignedBusId: user.assignedBusId
        });
      }

      res.json({
        success: true,
        message: user.isTravellingToday ? "Marked as travelling today! Safe commute." : "Marked as NOT travelling today. Driver notified.",
        isTravellingToday: user.isTravellingToday
      });
    },

    // Seat Booking with Double-Booking Prevention (Atomic check)
    reserveSeat: (req, res) => {
      const { seatNumber, busId } = req.body;
      const user = simulator.getUserById(req.user.id);
      if (!user) return res.status(404).json({ success: false, message: 'User not found.' });

      const targetBusId = busId || user.assignedBusId || 'bus-01';
      const bus = simulator.getBusById(targetBusId);
      if (!bus) return res.status(404).json({ success: false, message: 'Bus not found.' });

      if (!bus.reservedSeats) bus.reservedSeats = [];

      // Check if already taken
      if (bus.reservedSeats.includes(seatNumber)) {
        return res.status(409).json({
          success: false,
          message: `Seat ${seatNumber} has already been reserved by another student! Please select an available seat.`
        });
      }

      // If user already had a seat on this bus, release it first
      if (user.bookedSeatNumber) {
        bus.reservedSeats = bus.reservedSeats.filter(s => s !== user.bookedSeatNumber);
      }

      // Atomically book new seat
      bus.reservedSeats.push(seatNumber);
      user.bookedSeatNumber = seatNumber;
      user.assignedBusId = targetBusId;

      if (io) {
        io.emit('seat_reserved_broadcast', {
          busId: targetBusId,
          seatNumber,
          reservedSeats: bus.reservedSeats
        });
      }

      res.json({
        success: true,
        message: `Seat ${seatNumber} successfully confirmed on ${bus.callsign}!`,
        bookedSeatNumber: seatNumber,
        reservedSeats: bus.reservedSeats
      });
    },

    // Cancel Seat Reservation
    cancelSeat: (req, res) => {
      const user = simulator.getUserById(req.user.id);
      if (!user) return res.status(404).json({ success: false, message: 'User not found.' });

      if (user.assignedBusId && user.bookedSeatNumber) {
        const bus = simulator.getBusById(user.assignedBusId);
        if (bus && bus.reservedSeats) {
          bus.reservedSeats = bus.reservedSeats.filter(s => s !== user.bookedSeatNumber);
          if (io) {
            io.emit('seat_reserved_broadcast', {
              busId: user.assignedBusId,
              seatNumber: user.bookedSeatNumber,
              reservedSeats: bus.reservedSeats
            });
          }
        }
      }

      user.bookedSeatNumber = null;

      res.json({
        success: true,
        message: 'Seat reservation cancelled.',
        bookedSeatNumber: null
      });
    },

    // Update Favourites & Notifications Preferences
    updatePreferences: (req, res) => {
      const { favouriteStopId, favouriteRouteId, notificationPreferences, pickupStopId } = req.body;
      const user = simulator.getUserById(req.user.id);
      if (!user) return res.status(404).json({ success: false, message: 'User not found.' });

      if (favouriteStopId) user.favouriteStopId = favouriteStopId;
      if (favouriteRouteId) user.favouriteRouteId = favouriteRouteId;
      if (pickupStopId) user.pickupStopId = pickupStopId;
      if (notificationPreferences) user.notificationPreferences = { ...user.notificationPreferences, ...notificationPreferences };

      res.json({ success: true, message: 'Preferences updated successfully!', user });
    }
  };
};
