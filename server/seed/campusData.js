// Realistic Navrachana University (NUV) Transit Seed Data
// City: Vadodara (Baroda), Gujarat
// Campus: Navrachana University, Vasna-Bhayli Main Road, Vadodara
// Fleet: 4 Buses, 55-Seat Capacity Each, Serving 200 Enrolled Students

const { generate200Students } = require('./generateStudents');

const campusCenter = { lat: 22.2845, lng: 73.1335 }; // Navrachana University Campus, Bhayli

const stops = [
  {
    id: "stop-01",
    name: "Vadodara Central Railway Station (Sayajigunj)",
    code: "BRC-STN",
    lat: 22.3110,
    lng: 73.1825,
    campusZone: "Central Transit Hub",
    historicalDemand: 98,
    amenities: ["Shelter", "NFC Validator", "Live Transit Display", "City Bus Interchange"],
    currentWaitingCount: 38
  },
  {
    id: "stop-02",
    name: "Alkapuri (RC Dutt Road / Inox)",
    code: "ALK-RCD",
    lat: 22.3080,
    lng: 73.1780,
    campusZone: "West Vadodara Hub",
    historicalDemand: 85,
    amenities: ["Shelter", "Digital Signage"],
    currentWaitingCount: 26
  },
  {
    id: "stop-03",
    name: "Akota Stadium & Garden Char Rasta",
    code: "AKT-CR",
    lat: 22.2990,
    lng: 73.1750,
    campusZone: "Residential Sector",
    historicalDemand: 72,
    amenities: ["Covered Stand", "SOS Beacon"],
    currentWaitingCount: 18
  },
  {
    id: "stop-04",
    name: "Old Padra Road (Bird Circle / Tube Co)",
    code: "OPR-BC",
    lat: 22.2940,
    lng: 73.1650,
    campusZone: "Commercial Corridor",
    historicalDemand: 88,
    amenities: ["Live Display", "Shelter", "Bicycle Lockers"],
    currentWaitingCount: 24
  },
  {
    id: "stop-05",
    name: "Vasna Road (D-Mart / Ashwamegh)",
    code: "VSN-DM",
    lat: 22.2885,
    lng: 73.1510,
    campusZone: "South-West Residential",
    historicalDemand: 92,
    amenities: ["Shelter", "WiFi Beacon"],
    currentWaitingCount: 22
  },
  {
    id: "stop-06",
    name: "Fatehgunj (Near MSU / Narhari Circle)",
    code: "FTG-MSU",
    lat: 22.3200,
    lng: 73.1870,
    campusZone: "North Student Hub",
    historicalDemand: 90,
    amenities: ["Shelter", "Hostel Pickup Bay"],
    currentWaitingCount: 34
  },
  {
    id: "stop-07",
    name: "Gotri Medical College & Hospital",
    code: "GTR-GMERS",
    lat: 22.3130,
    lng: 73.1420,
    campusZone: "North-West Health Hub",
    historicalDemand: 68,
    amenities: ["EV Charging", "Emergency Staging", "Shelter"],
    currentWaitingCount: 19
  },
  {
    id: "stop-08",
    name: "Sevasi Canal Char Rasta",
    code: "SVS-CNL",
    lat: 22.2980,
    lng: 73.1250,
    campusZone: "Sevasi Corridor",
    historicalDemand: 55,
    amenities: ["Shelter", "Night Lights"],
    currentWaitingCount: 14
  },
  {
    id: "stop-09",
    name: "Manjalpur (Shreyas School Char Rasta)",
    code: "MNJ-SHR",
    lat: 22.2680,
    lng: 73.1930,
    campusZone: "South Vadodara Hub",
    historicalDemand: 82,
    amenities: ["Shelter", "Validator Beacon"],
    currentWaitingCount: 28
  },
  {
    id: "stop-10",
    name: "Sun Pharma Road (Tandalja Junction)",
    code: "SP-TDL",
    lat: 22.2780,
    lng: 73.1610,
    campusZone: "South-West Corridor",
    historicalDemand: 76,
    amenities: ["Shelter"],
    currentWaitingCount: 20
  },
  {
    id: "stop-11",
    name: "Navrachana University Main Campus (Bhayli)",
    code: "NUV-CAMPUS",
    lat: 22.2845,
    lng: 73.1335,
    campusZone: "NUV University Terminal",
    historicalDemand: 100,
    amenities: ["Central Bus Depot", "Driver Lounge", "EV Fast Charging", "NFC Validator Bay", "Cafeteria Break Terminal"],
    currentWaitingCount: 45
  },
  {
    id: "stop-12",
    name: "Nizampura / Karelibaug Circle",
    code: "NZP-KBG",
    lat: 22.3270,
    lng: 73.1810,
    campusZone: "North-East Corridor",
    historicalDemand: 74,
    amenities: ["Shelter", "NFC Validator"],
    currentWaitingCount: 16
  },
  {
    id: "stop-13",
    name: "Makarpura GIDC Bus Depot",
    code: "MKP-DEPOT",
    lat: 22.2540,
    lng: 73.1910,
    campusZone: "South Industrial Sector",
    historicalDemand: 78,
    amenities: ["Covered Bay", "SOS Beacon"],
    currentWaitingCount: 18
  },
  {
    id: "stop-14",
    name: "Subhanpura (High Tension Road / Atithi)",
    code: "SBP-HTR",
    lat: 22.3160,
    lng: 73.1620,
    campusZone: "North-West Residential",
    historicalDemand: 80,
    amenities: ["Shelter", "Live Transit Display"],
    currentWaitingCount: 21
  },
  {
    id: "stop-15",
    name: "Gorwa BIDC & Panchvati Circle",
    code: "GRW-BIDC",
    lat: 22.3210,
    lng: 73.1510,
    campusZone: "West Industrial Hub",
    historicalDemand: 70,
    amenities: ["Shelter", "Night Lights"],
    currentWaitingCount: 15
  },
  {
    id: "stop-16",
    name: "Bhayli Village Junction",
    code: "BHY-JNC",
    lat: 22.2880,
    lng: 73.1390,
    campusZone: "Campus Perimeter",
    historicalDemand: 65,
    amenities: ["Shelter", "Bicycle Lockers"],
    currentWaitingCount: 12
  }
];

const routes = [
  {
    id: "route-101",
    name: "Route 101 - Central East & Sayajigunj Express",
    code: "101-BLUE",
    color: "#3b82f6",
    activeBuses: ["bus-01"],
    coverageAreas: "Sayajigunj, Vadodara Railway Station, Alkapuri, Akota",
    assignedStudentCount: 50,
    stops: ["stop-01", "stop-02", "stop-03", "stop-11"],
    waypoints: [
      { lat: 22.3110, lng: 73.1825 }, // Sayajigunj / Station
      { lat: 22.3080, lng: 73.1780 }, // Alkapuri
      { lat: 22.3030, lng: 73.1760 },
      { lat: 22.2990, lng: 73.1750 }, // Akota
      { lat: 22.2940, lng: 73.1600 },
      { lat: 22.2890, lng: 73.1460 },
      { lat: 22.2845, lng: 73.1335 }  // Navrachana University
    ],
    scheduleIntervalMins: 15,
    status: "ON_TIME"
  },
  {
    id: "route-202",
    name: "Route 202 - North Student & Health Corridor",
    code: "202-EMRL",
    color: "#10b981",
    activeBuses: ["bus-02"],
    coverageAreas: "Fatehgunj, MSU Hostels, Nizampura, Gotri GMERS, Sevasi",
    assignedStudentCount: 50,
    stops: ["stop-06", "stop-12", "stop-07", "stop-08", "stop-11"],
    waypoints: [
      { lat: 22.3200, lng: 73.1870 }, // Fatehgunj
      { lat: 22.3270, lng: 73.1810 }, // Nizampura
      { lat: 22.3210, lng: 73.1600 },
      { lat: 22.3130, lng: 73.1420 }, // Gotri GMERS
      { lat: 22.3060, lng: 73.1320 },
      { lat: 22.2980, lng: 73.1250 }, // Sevasi Canal
      { lat: 22.2900, lng: 73.1280 },
      { lat: 22.2845, lng: 73.1335 }  // Navrachana University
    ],
    scheduleIntervalMins: 15,
    status: "ON_TIME"
  },
  {
    id: "route-303",
    name: "Route 303 - South Hub & Industrial Shuttle",
    code: "303-CRIM",
    color: "#f43f5e",
    activeBuses: ["bus-03"],
    coverageAreas: "Manjalpur, Makarpura GIDC, Tandalja, Sun Pharma Road, Vasna",
    assignedStudentCount: 50,
    stops: ["stop-09", "stop-13", "stop-10", "stop-05", "stop-11"],
    waypoints: [
      { lat: 22.2680, lng: 73.1930 }, // Manjalpur
      { lat: 22.2540, lng: 73.1910 }, // Makarpura GIDC
      { lat: 22.2650, lng: 73.1750 },
      { lat: 22.2780, lng: 73.1610 }, // Sun Pharma Road
      { lat: 22.2830, lng: 73.1550 },
      { lat: 22.2885, lng: 73.1510 }, // Vasna Road
      { lat: 22.2865, lng: 73.1420 },
      { lat: 22.2845, lng: 73.1335 }  // Navrachana University
    ],
    scheduleIntervalMins: 15,
    status: "ON_TIME"
  },
  {
    id: "route-404",
    name: "Route 404 - Subhanpura, Gorwa & West Connector",
    code: "404-AMBR",
    color: "#f59e0b",
    activeBuses: ["bus-04"],
    coverageAreas: "Subhanpura, Gorwa BIDC, Ellora Park, Old Padra Road, Bhayli Junction",
    assignedStudentCount: 50,
    stops: ["stop-14", "stop-15", "stop-04", "stop-16", "stop-11"],
    waypoints: [
      { lat: 22.3160, lng: 73.1620 }, // Subhanpura
      { lat: 22.3210, lng: 73.1510 }, // Gorwa BIDC
      { lat: 22.3080, lng: 73.1580 },
      { lat: 22.2940, lng: 73.1650 }, // Old Padra Road
      { lat: 22.2910, lng: 73.1520 },
      { lat: 22.2880, lng: 73.1390 }, // Bhayli Village Junction
      { lat: 22.2845, lng: 73.1335 }  // Navrachana University
    ],
    scheduleIntervalMins: 15,
    status: "ON_TIME"
  }
];

// Exactly 4 primary buses with 55 seat capacity each, dedicated to the 4 corridors
const buses = [
  {
    id: "bus-01",
    numberPlate: "GJ-06-AZ-1092",
    callsign: "NUV-Titan-101 (Bus 1)",
    routeId: "route-101",
    status: "EN_ROUTE",
    tripActive: true,
    capacity: 55,
    seatedCapacity: 55,
    standingCapacity: 0,
    currentOccupancy: 36,
    speedKmH: 34,
    headingDeg: 240,
    driver: {
      id: "driver-01",
      name: "Ramesh Patel",
      phone: "+91 98250 41209",
      rating: 4.9,
      shiftHours: 3.5
    },
    telematics: {
      batteryOrFuel: 84,
      harshBrakingToday: 1,
      engineIdleMins: 7,
      safetyScore: 95,
      lastTelemetryTimestamp: Date.now()
    },
    currentWaypointIndex: 2,
    nextStopId: "stop-03",
    etaMinutesNextStop: 3,
    direction: 1,
    reservedSeats: ["1A", "1B", "2A", "3B", "4A", "4B", "5A", "6C"]
  },
  {
    id: "bus-02",
    numberPlate: "GJ-06-AZ-1098",
    callsign: "NUV-Emerald-202 (Bus 2)",
    routeId: "route-202",
    status: "EN_ROUTE",
    tripActive: true,
    capacity: 55,
    seatedCapacity: 55,
    standingCapacity: 0,
    currentOccupancy: 34,
    speedKmH: 32,
    headingDeg: 215,
    driver: {
      id: "driver-02",
      name: "Jignesh Solanki",
      phone: "+91 97129 88301",
      rating: 4.85,
      shiftHours: 4.0
    },
    telematics: {
      batteryOrFuel: 78,
      harshBrakingToday: 0,
      engineIdleMins: 5,
      safetyScore: 98,
      lastTelemetryTimestamp: Date.now()
    },
    currentWaypointIndex: 3,
    nextStopId: "stop-07",
    etaMinutesNextStop: 4,
    direction: 1,
    reservedSeats: ["1A", "2B", "3C", "4D", "7A", "8B"]
  },
  {
    id: "bus-03",
    numberPlate: "GJ-06-BZ-2044",
    callsign: "NUV-Crimson-303 (Bus 3)",
    routeId: "route-303",
    status: "EN_ROUTE",
    tripActive: true,
    capacity: 55,
    seatedCapacity: 55,
    standingCapacity: 0,
    currentOccupancy: 38,
    speedKmH: 30,
    headingDeg: 280,
    driver: {
      id: "driver-03",
      name: "Mukesh Vankar",
      phone: "+91 94280 19342",
      rating: 4.95,
      shiftHours: 2.2
    },
    telematics: {
      batteryOrFuel: 92,
      harshBrakingToday: 0,
      engineIdleMins: 4,
      safetyScore: 99,
      lastTelemetryTimestamp: Date.now()
    },
    currentWaypointIndex: 3,
    nextStopId: "stop-10",
    etaMinutesNextStop: 4,
    direction: 1,
    reservedSeats: ["1C", "2C", "3A", "5D", "9A", "10B"]
  },
  {
    id: "bus-04",
    numberPlate: "GJ-06-CZ-3019",
    callsign: "NUV-Solaris-404 (Bus 4)",
    routeId: "route-404",
    status: "EN_ROUTE",
    tripActive: true,
    capacity: 55,
    seatedCapacity: 55,
    standingCapacity: 0,
    currentOccupancy: 35,
    speedKmH: 36,
    headingDeg: 195,
    driver: {
      id: "driver-04",
      name: "Hareshbhai Parmar",
      phone: "+91 98980 55410",
      rating: 4.75,
      shiftHours: 3.1
    },
    telematics: {
      batteryOrFuel: 88,
      harshBrakingToday: 1,
      engineIdleMins: 6,
      safetyScore: 94,
      lastTelemetryTimestamp: Date.now()
    },
    currentWaypointIndex: 2,
    nextStopId: "stop-04",
    etaMinutesNextStop: 3,
    direction: 1,
    reservedSeats: ["1D", "2A", "3B", "4C", "6A", "7B"]
  },
  {
    id: "bus-standby-01",
    numberPlate: "GJ-06-AZ-9901",
    callsign: "NUV-Vanguard-Reserve (Standby Backup)",
    routeId: null,
    status: "STANDBY",
    tripActive: false,
    capacity: 55,
    seatedCapacity: 55,
    standingCapacity: 0,
    currentOccupancy: 0,
    speedKmH: 0,
    headingDeg: 0,
    driver: {
      id: "driver-standby",
      name: "Pravin Baria (On-Call Standby)",
      phone: "+91 99040 11200",
      rating: 5.0,
      shiftHours: 0.5
    },
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
  }
];

// Staff & Admin users
const adminAndDrivers = [
  {
    id: "usr-admin-01",
    name: "Prof. Arvind Trivedi",
    email: "admin@nuv.ac.in",
    rollNumber: null,
    password: "admin123",
    role: "admin",
    phone: "+91 98250 00001",
    assignedBusId: null,
    assignedRouteId: null,
    pickupStopId: null,
    isTravellingToday: true,
    bookedSeatNumber: null
  },
  {
    id: "usr-admin-02",
    name: "Dr. Rajesh Mehta",
    email: "admin2@nuv.ac.in",
    rollNumber: null,
    password: "admin123",
    role: "admin",
    phone: "+91 98250 00002",
    assignedBusId: null,
    assignedRouteId: null,
    pickupStopId: null,
    isTravellingToday: true,
    bookedSeatNumber: null
  },
  {
    id: "usr-driver-01",
    name: "Ramesh Patel",
    email: "driver.ramesh@nuv.ac.in",
    rollNumber: null,
    password: "driver123",
    role: "driver",
    phone: "+91 98250 41209",
    assignedBusId: "bus-01",
    assignedRouteId: "route-101",
    pickupStopId: null,
    isTravellingToday: true,
    bookedSeatNumber: null
  },
  {
    id: "usr-driver-02",
    name: "Jignesh Solanki",
    email: "driver.jignesh@nuv.ac.in",
    rollNumber: null,
    password: "driver123",
    role: "driver",
    phone: "+91 97129 88301",
    assignedBusId: "bus-02",
    assignedRouteId: "route-202",
    pickupStopId: null,
    isTravellingToday: true,
    bookedSeatNumber: null
  },
  {
    id: "usr-driver-03",
    name: "Mukesh Vankar",
    email: "driver.mukesh@nuv.ac.in",
    rollNumber: null,
    password: "driver123",
    role: "driver",
    phone: "+91 94280 19342",
    assignedBusId: "bus-03",
    assignedRouteId: "route-303",
    pickupStopId: null,
    isTravellingToday: true,
    bookedSeatNumber: null
  },
  {
    id: "usr-driver-04",
    name: "Hareshbhai Parmar",
    email: "driver.haresh@nuv.ac.in",
    rollNumber: null,
    password: "driver123",
    role: "driver",
    phone: "+91 98980 55410",
    assignedBusId: "bus-04",
    assignedRouteId: "route-404",
    pickupStopId: null,
    isTravellingToday: true,
    bookedSeatNumber: null
  }
];

// Generate 200 realistic students
const studentRoster = generate200Students();

// Combined users: Admin + 4 Drivers + 200 Students
const users = [...adminAndDrivers, ...studentRoster];

// Comprehensive Multi-Shift Timetable:
// 1. Morning Electives Shift: 07:15 AM - 07:55 AM (for 8:00 AM - 10:00 AM Electives)
// 2. Regular Morning Shift: 09:00 AM - 09:50 AM (for 10:00 AM - 05:00 PM Regular Classes)
// 3. Midday Break Early Exit Shift: 01:05 PM - 01:45 PM (during 1:00 PM - 2:00 PM break, on-demand booking)
// 4. Midday Break Afternoon Arrival Shift: 01:15 PM - 01:55 PM (for afternoon sessions, on-demand booking)
// 5. Regular Evening Dispersal: 05:15 PM - 06:00 PM (after 05:00 PM classes end)
// 6. Evening Electives Dispersal: 07:15 PM - 08:00 PM (after 07:00 PM electives end)

const busSchedules = [
  {
    routeId: "route-101",
    routeName: "Route 101 - Central East & Sayajigunj Express (Bus 1)",
    busCallsign: "NUV-Titan-101",
    coverageAreas: "Sayajigunj, Vadodara Railway Station, Alkapuri, Akota",
    busCapacity: 55,
    assignedStudents: 50,
    shifts: {
      morningElectiveInbound: {
        name: "Morning Elective Inbound (08:00 - 10:00 Batch)",
        slot: "07:15 AM - 07:50 AM",
        purpose: "Pick up students having 8-10 AM electives",
        campusArrival: "07:50 AM"
      },
      regularMorningInbound: {
        name: "Regular Class Inbound (10:00 - 17:00 Batch)",
        slot: "09:00 AM - 09:45 AM",
        purpose: "Pick up standard 10 AM regular class students",
        campusArrival: "09:45 AM"
      },
      middayBreakEarlyExit: {
        name: "Midday Break Early Exit (Lunch Break 1:00 - 2:00 PM)",
        slot: "01:05 PM - 01:40 PM",
        purpose: "Students leaving early during lunch break back to city",
        campusDeparture: "01:05 PM",
        bookingRequired: true
      },
      middayBreakAfternoonArrival: {
        name: "Midday Break Afternoon Inbound (Lunch Break 1:00 - 2:00 PM)",
        slot: "01:15 PM - 01:55 PM",
        purpose: "Students arriving from city for afternoon labs / 2 PM sessions",
        campusArrival: "01:55 PM",
        bookingRequired: true
      },
      regularEveningOutbound: {
        name: "Regular Evening Dispersal (17:00 Class End)",
        slot: "05:15 PM - 05:55 PM",
        purpose: "Campus exit for 5:00 PM class dismissal",
        campusDeparture: "05:15 PM"
      },
      lateElectiveOutbound: {
        name: "Late Evening Elective Dispersal (17:00 - 19:00 Elective End)",
        slot: "07:15 PM - 07:55 PM",
        purpose: "Campus exit for students finishing 7:00 PM electives",
        campusDeparture: "07:15 PM"
      }
    },
    stopsSchedule: [
      {
        stopName: "Vadodara Central Station (Sayajigunj)",
        earlyMorningEta: "07:15 AM",
        regularMorningEta: "09:00 AM",
        middayArrivalEta: "01:15 PM",
        middayExitDropEta: "01:40 PM",
        regularEveningEta: "05:55 PM",
        lateEveningEta: "07:55 PM"
      },
      {
        stopName: "Alkapuri (RC Dutt Road / Inox)",
        earlyMorningEta: "07:25 AM",
        regularMorningEta: "09:12 AM",
        middayArrivalEta: "01:25 PM",
        middayExitDropEta: "01:30 PM",
        regularEveningEta: "05:42 PM",
        lateEveningEta: "07:42 PM"
      },
      {
        stopName: "Akota Stadium & Char Rasta",
        earlyMorningEta: "07:35 AM",
        regularMorningEta: "09:25 AM",
        middayArrivalEta: "01:35 PM",
        middayExitDropEta: "01:20 PM",
        regularEveningEta: "05:32 PM",
        lateEveningEta: "07:32 PM"
      },
      {
        stopName: "Navrachana University (Bhayli Campus)",
        earlyMorningEta: "07:50 AM",
        regularMorningEta: "09:45 AM",
        middayArrivalEta: "01:55 PM",
        middayExitDropEta: "01:05 PM (Dep)",
        regularEveningEta: "05:15 PM (Dep)",
        lateEveningEta: "07:15 PM (Dep)"
      }
    ]
  },
  {
    routeId: "route-202",
    routeName: "Route 202 - North Student & Health Corridor (Bus 2)",
    busCallsign: "NUV-Emerald-202",
    coverageAreas: "Fatehgunj, MSU Hostels, Nizampura, Gotri GMERS, Sevasi",
    busCapacity: 55,
    assignedStudents: 50,
    shifts: {
      morningElectiveInbound: {
        name: "Morning Elective Inbound (08:00 - 10:00 Batch)",
        slot: "07:15 AM - 07:52 AM",
        purpose: "Pick up students having 8-10 AM electives",
        campusArrival: "07:52 AM"
      },
      regularMorningInbound: {
        name: "Regular Class Inbound (10:00 - 17:00 Batch)",
        slot: "09:05 AM - 09:48 AM",
        purpose: "Pick up standard 10 AM regular class students",
        campusArrival: "09:48 AM"
      },
      middayBreakEarlyExit: {
        name: "Midday Break Early Exit (Lunch Break 1:00 - 2:00 PM)",
        slot: "01:05 PM - 01:42 PM",
        purpose: "Students leaving early during lunch break back to north areas",
        campusDeparture: "01:05 PM",
        bookingRequired: true
      },
      middayBreakAfternoonArrival: {
        name: "Midday Break Afternoon Inbound (Lunch Break 1:00 - 2:00 PM)",
        slot: "01:15 PM - 01:55 PM",
        purpose: "Students arriving from north hubs for afternoon labs / 2 PM sessions",
        campusArrival: "01:55 PM",
        bookingRequired: true
      },
      regularEveningOutbound: {
        name: "Regular Evening Dispersal (17:00 Class End)",
        slot: "05:15 PM - 05:58 PM",
        purpose: "Campus exit for 5:00 PM class dismissal",
        campusDeparture: "05:15 PM"
      },
      lateElectiveOutbound: {
        name: "Late Evening Elective Dispersal (17:00 - 19:00 Elective End)",
        slot: "07:15 PM - 07:58 PM",
        purpose: "Campus exit for students finishing 7:00 PM electives",
        campusDeparture: "07:15 PM"
      }
    },
    stopsSchedule: [
      {
        stopName: "Fatehgunj (Near MSU / Hostel Bay)",
        earlyMorningEta: "07:15 AM",
        regularMorningEta: "09:05 AM",
        middayArrivalEta: "01:15 PM",
        middayExitDropEta: "01:42 PM",
        regularEveningEta: "05:58 PM",
        lateEveningEta: "07:58 PM"
      },
      {
        stopName: "Nizampura / Karelibaug Circle",
        earlyMorningEta: "07:24 AM",
        regularMorningEta: "09:15 AM",
        middayArrivalEta: "01:24 PM",
        middayExitDropEta: "01:34 PM",
        regularEveningEta: "05:48 PM",
        lateEveningEta: "07:48 PM"
      },
      {
        stopName: "Gotri Medical College & Hospital",
        earlyMorningEta: "07:36 AM",
        regularMorningEta: "09:28 AM",
        middayArrivalEta: "01:36 PM",
        middayExitDropEta: "01:22 PM",
        regularEveningEta: "05:35 PM",
        lateEveningEta: "07:35 PM"
      },
      {
        stopName: "Sevasi Canal Char Rasta",
        earlyMorningEta: "07:44 AM",
        regularMorningEta: "09:38 AM",
        middayArrivalEta: "01:45 PM",
        middayExitDropEta: "01:14 PM",
        regularEveningEta: "05:25 PM",
        lateEveningEta: "07:25 PM"
      },
      {
        stopName: "Navrachana University (Bhayli Campus)",
        earlyMorningEta: "07:52 AM",
        regularMorningEta: "09:48 AM",
        middayArrivalEta: "01:55 PM",
        middayExitDropEta: "01:05 PM (Dep)",
        regularEveningEta: "05:15 PM (Dep)",
        lateEveningEta: "07:15 PM (Dep)"
      }
    ]
  },
  {
    routeId: "route-303",
    routeName: "Route 303 - South Hub & Industrial Shuttle (Bus 3)",
    busCallsign: "NUV-Crimson-303",
    coverageAreas: "Manjalpur, Makarpura GIDC, Tandalja, Sun Pharma Road, Vasna",
    busCapacity: 55,
    assignedStudents: 50,
    shifts: {
      morningElectiveInbound: {
        name: "Morning Elective Inbound (08:00 - 10:00 Batch)",
        slot: "07:15 AM - 07:50 AM",
        purpose: "Pick up students having 8-10 AM electives",
        campusArrival: "07:50 AM"
      },
      regularMorningInbound: {
        name: "Regular Class Inbound (10:00 - 17:00 Batch)",
        slot: "09:00 AM - 09:45 AM",
        purpose: "Pick up standard 10 AM regular class students",
        campusArrival: "09:45 AM"
      },
      middayBreakEarlyExit: {
        name: "Midday Break Early Exit (Lunch Break 1:00 - 2:00 PM)",
        slot: "01:05 PM - 01:42 PM",
        purpose: "Students leaving early during lunch break back to south areas",
        campusDeparture: "01:05 PM",
        bookingRequired: true
      },
      middayBreakAfternoonArrival: {
        name: "Midday Break Afternoon Inbound (Lunch Break 1:00 - 2:00 PM)",
        slot: "01:15 PM - 01:55 PM",
        purpose: "Students arriving from south areas for afternoon labs / 2 PM sessions",
        campusArrival: "01:55 PM",
        bookingRequired: true
      },
      regularEveningOutbound: {
        name: "Regular Evening Dispersal (17:00 Class End)",
        slot: "05:15 PM - 05:58 PM",
        purpose: "Campus exit for 5:00 PM class dismissal",
        campusDeparture: "05:15 PM"
      },
      lateElectiveOutbound: {
        name: "Late Evening Elective Dispersal (17:00 - 19:00 Elective End)",
        slot: "07:15 PM - 07:58 PM",
        purpose: "Campus exit for students finishing 7:00 PM electives",
        campusDeparture: "07:15 PM"
      }
    },
    stopsSchedule: [
      {
        stopName: "Manjalpur (Shreyas School Char Rasta)",
        earlyMorningEta: "07:15 AM",
        regularMorningEta: "09:00 AM",
        middayArrivalEta: "01:15 PM",
        middayExitDropEta: "01:42 PM",
        regularEveningEta: "05:58 PM",
        lateEveningEta: "07:58 PM"
      },
      {
        stopName: "Makarpura GIDC Bus Depot",
        earlyMorningEta: "07:22 AM",
        regularMorningEta: "09:10 AM",
        middayArrivalEta: "01:22 PM",
        middayExitDropEta: "01:34 PM",
        regularEveningEta: "05:48 PM",
        lateEveningEta: "07:48 PM"
      },
      {
        stopName: "Sun Pharma Road (Tandalja Junction)",
        earlyMorningEta: "07:33 AM",
        regularMorningEta: "09:22 AM",
        middayArrivalEta: "01:34 PM",
        middayExitDropEta: "01:22 PM",
        regularEveningEta: "05:36 PM",
        lateEveningEta: "07:36 PM"
      },
      {
        stopName: "Vasna Road (D-Mart / Ashwamegh)",
        earlyMorningEta: "07:42 AM",
        regularMorningEta: "09:34 AM",
        middayArrivalEta: "01:44 PM",
        middayExitDropEta: "01:14 PM",
        regularEveningEta: "05:25 PM",
        lateEveningEta: "07:25 PM"
      },
      {
        stopName: "Navrachana University (Bhayli Campus)",
        earlyMorningEta: "07:50 AM",
        regularMorningEta: "09:45 AM",
        middayArrivalEta: "01:55 PM",
        middayExitDropEta: "01:05 PM (Dep)",
        regularEveningEta: "05:15 PM (Dep)",
        lateEveningEta: "07:15 PM (Dep)"
      }
    ]
  },
  {
    routeId: "route-404",
    routeName: "Route 404 - Subhanpura, Gorwa & West Connector (Bus 4)",
    busCallsign: "NUV-Solaris-404",
    coverageAreas: "Subhanpura, Gorwa BIDC, Ellora Park, Old Padra Road, Bhayli Junction",
    busCapacity: 55,
    assignedStudents: 50,
    shifts: {
      morningElectiveInbound: {
        name: "Morning Elective Inbound (08:00 - 10:00 Batch)",
        slot: "07:18 AM - 07:52 AM",
        purpose: "Pick up students having 8-10 AM electives",
        campusArrival: "07:52 AM"
      },
      regularMorningInbound: {
        name: "Regular Class Inbound (10:00 - 17:00 Batch)",
        slot: "09:05 AM - 09:46 AM",
        purpose: "Pick up standard 10 AM regular class students",
        campusArrival: "09:46 AM"
      },
      middayBreakEarlyExit: {
        name: "Midday Break Early Exit (Lunch Break 1:00 - 2:00 PM)",
        slot: "01:05 PM - 01:42 PM",
        purpose: "Students leaving early during lunch break back to west areas",
        campusDeparture: "01:05 PM",
        bookingRequired: true
      },
      middayBreakAfternoonArrival: {
        name: "Midday Break Afternoon Inbound (Lunch Break 1:00 - 2:00 PM)",
        slot: "01:15 PM - 01:55 PM",
        purpose: "Students arriving from west areas for afternoon labs / 2 PM sessions",
        campusArrival: "01:55 PM",
        bookingRequired: true
      },
      regularEveningOutbound: {
        name: "Regular Evening Dispersal (17:00 Class End)",
        slot: "05:15 PM - 05:56 PM",
        purpose: "Campus exit for 5:00 PM class dismissal",
        campusDeparture: "05:15 PM"
      },
      lateElectiveOutbound: {
        name: "Late Evening Elective Dispersal (17:00 - 19:00 Elective End)",
        slot: "07:15 PM - 07:56 PM",
        purpose: "Campus exit for students finishing 7:00 PM electives",
        campusDeparture: "07:15 PM"
      }
    },
    stopsSchedule: [
      {
        stopName: "Subhanpura (High Tension Road / Atithi)",
        earlyMorningEta: "07:18 AM",
        regularMorningEta: "09:05 AM",
        middayArrivalEta: "01:15 PM",
        middayExitDropEta: "01:40 PM",
        regularEveningEta: "05:56 PM",
        lateEveningEta: "07:56 PM"
      },
      {
        stopName: "Gorwa BIDC & Panchvati Circle",
        earlyMorningEta: "07:27 AM",
        regularMorningEta: "09:14 AM",
        middayArrivalEta: "01:24 PM",
        middayExitDropEta: "01:31 PM",
        regularEveningEta: "05:46 PM",
        lateEveningEta: "07:46 PM"
      },
      {
        stopName: "Old Padra Road (Bird Circle / Tube Co)",
        earlyMorningEta: "07:37 AM",
        regularMorningEta: "09:26 AM",
        middayArrivalEta: "01:35 PM",
        middayExitDropEta: "01:21 PM",
        regularEveningEta: "05:34 PM",
        lateEveningEta: "07:34 PM"
      },
      {
        stopName: "Bhayli Village Junction",
        earlyMorningEta: "07:46 AM",
        regularMorningEta: "09:38 AM",
        middayArrivalEta: "01:46 PM",
        middayExitDropEta: "01:12 PM",
        regularEveningEta: "05:22 PM",
        lateEveningEta: "07:22 PM"
      },
      {
        stopName: "Navrachana University (Bhayli Campus)",
        earlyMorningEta: "07:52 AM",
        regularMorningEta: "09:46 AM",
        middayArrivalEta: "01:55 PM",
        middayExitDropEta: "01:05 PM (Dep)",
        regularEveningEta: "05:15 PM (Dep)",
        lateEveningEta: "07:15 PM (Dep)"
      }
    ]
  }
];

// Seeded In-App Notifications
const notifications = [
  {
    id: "notif-01",
    title: "⚡ Fleet Roster Synchronized: 4 Buses Active",
    message: "4 primary buses (55 seats each) active across Sayajigunj, Fatehgunj, Manjalpur, and Subhanpura corridors.",
    type: "ANNOUNCEMENT",
    targetType: "ALL",
    targetId: null,
    readBy: [],
    timestamp: new Date(Date.now() - 10 * 60 * 1000).toISOString()
  },
  {
    id: "notif-02",
    title: "🥪 Midday Break Shuttles (1:00 PM - 2:00 PM)",
    message: "Midday shuttles available for early break exits (1:05 PM) & afternoon arrivals (1:55 PM). Book your seat in the Student Portal.",
    type: "ANNOUNCEMENT",
    targetType: "ALL",
    targetId: null,
    readBy: [],
    timestamp: new Date(Date.now() - 25 * 60 * 1000).toISOString()
  },
  {
    id: "notif-03",
    title: "📚 Morning & Evening Electives Transit Ready",
    message: "Early buses reach campus at 07:50 AM for 8-10 AM electives. Late evening dispersal departs at 07:15 PM for 5-7 PM electives.",
    type: "ANNOUNCEMENT",
    targetType: "ALL",
    targetId: null,
    readBy: [],
    timestamp: new Date(Date.now() - 40 * 60 * 1000).toISOString()
  }
];

// Seeded Complaints & Issue Tickets
const complaints = [
  {
    id: "cmp-01",
    studentId: "usr-student-001",
    studentName: "Aarav Sharma",
    studentRoll: "NUV24CS001",
    busId: "bus-01",
    category: "LATE_BUS",
    subject: "Traffic bottleneck at Old Padra Road",
    description: "Bus was delayed by 10 mins yesterday due to road paving near Bird Circle.",
    status: "RESOLVED",
    adminNotes: "Driver notified to use alternate Dandia Bazaar bypass during morning rush."
  }
];

const timetableSurges = [
  {
    timeSlot: "07:15 - 08:00",
    label: "Early Morning Elective Wave (8:00 - 10:00 AM)",
    projectedDemandMultiplier: 1.25,
    highSurgeStops: ["stop-01", "stop-06", "stop-09", "stop-14"],
    recommendedExtraBuses: 0,
    reason: "Students opting for early electives (Architecture, Design, Advanced Robotics) reaching by 07:50 AM"
  },
  {
    timeSlot: "09:00 - 09:50",
    label: "Main Campus Inbound Rush (10:00 AM Regular Classes)",
    projectedDemandMultiplier: 2.1,
    highSurgeStops: ["stop-01", "stop-02", "stop-06", "stop-09"],
    recommendedExtraBuses: 0,
    reason: "Bulk of the 200 enrolled students arriving for 10:00 AM core lectures across all 4 corridors (55 seats each)"
  },
  {
    timeSlot: "13:00 - 14:00",
    label: "Lunch Break Window (1:00 - 2:00 PM Flexible Transit)",
    projectedDemandMultiplier: 1.35,
    highSurgeStops: ["stop-11", "stop-01", "stop-06"],
    recommendedExtraBuses: 1,
    reason: "Midday break split: Half-day students exiting at 1:05 PM, afternoon students arriving by 1:55 PM"
  },
  {
    timeSlot: "17:00 - 17:45",
    label: "Core Evening Dispersal (5:00 PM Class Dismissal)",
    projectedDemandMultiplier: 2.2,
    highSurgeStops: ["stop-11", "stop-02", "stop-01"],
    recommendedExtraBuses: 0,
    reason: "All 4 buses departing Bhayli campus at 05:15 PM returning students to their home corridors"
  },
  {
    timeSlot: "19:00 - 19:45",
    label: "Late Evening Elective Dispersal (5:00 - 7:00 PM Batch)",
    projectedDemandMultiplier: 1.15,
    highSurgeStops: ["stop-11", "stop-06", "stop-09"],
    recommendedExtraBuses: 0,
    reason: "Elective laboratory and seminar attendees departing Bhayli campus at 07:15 PM"
  }
];

// Official Semester Electives Catalog for Navrachana University
const semesterElectivesCatalog = {
  semester: "Current Semester (Academic Year 2026)",
  morningElectives: [
    { code: "ROB-401", title: "Robotics & Autonomous Drone Systems", faculty: "Prof. Siddharth Mehta", timeSlot: "08:00 AM - 10:00 AM", hall: "Lab Block B-204" },
    { code: "ARC-302", title: "Sustainable Architecture & Green Urbanism", faculty: "Ar. Arvind Trivedi", timeSlot: "08:00 AM - 10:00 AM", hall: "Design Studio D-101" },
    { code: "CS-403", title: "Advanced Cloud Computing & Kubernetes", faculty: "Dr. Ramesh Patel", timeSlot: "08:00 AM - 10:00 AM", hall: "Computer Center CC-3" },
    { code: "BT-305", title: "Biotechnology & Genetic Engineering", faculty: "Dr. Ananya Joshi", timeSlot: "08:00 AM - 10:00 AM", hall: "BioTech Lab L-12" },
    { code: "MBA-201", title: "Corporate FinTech & Algorithmic Trading", faculty: "Prof. Jignesh Shah", timeSlot: "08:00 AM - 10:00 AM", hall: "Management Hall M-02" },
    { code: "NONE", title: "None (Regular 10:00 AM Core Classes Only)", faculty: "—", timeSlot: "—", hall: "—" }
  ],
  eveningElectives: [
    { code: "CS-408", title: "Generative AI & Deep Learning Studio", faculty: "Prof. Jignesh Solanki", timeSlot: "05:00 PM - 07:00 PM", hall: "AI Research Lab AI-01" },
    { code: "MBA-209", title: "Business Analytics & Predictive Modeling", faculty: "Dr. Pooja Desai", timeSlot: "05:00 PM - 07:00 PM", hall: "Seminar Hall S-10" },
    { code: "DES-304", title: "Ergonomic Industrial Design & 3D Prototyping", faculty: "Prof. Hardik Panchal", timeSlot: "05:00 PM - 07:00 PM", hall: "FabLab Workshop F-05" },
    { code: "EE-302", title: "Renewable Energy Grids & EV Powertrains", faculty: "Dr. Mukesh Parmar", timeSlot: "05:00 PM - 07:00 PM", hall: "Energy Lab E-08" },
    { code: "CS-406", title: "Offensive Cybersecurity & Ethical Hacking", faculty: "Prof. Pravin Baria", timeSlot: "05:00 PM - 07:00 PM", hall: "Cyber Range CR-02" },
    { code: "NONE", title: "None (Regular 05:00 PM Campus Dispersal)", faculty: "—", timeSlot: "—", hall: "—" }
  ]
};

module.exports = {
  campusCenter,
  stops,
  routes,
  buses,
  users,
  busSchedules,
  notifications,
  complaints,
  timetableSurges,
  semesterElectivesCatalog
};
