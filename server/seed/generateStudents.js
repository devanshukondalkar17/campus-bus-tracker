/**
 * 200 Realistic Navrachana University (NUV) Students Generator
 * Distributed across 4 bus corridors / Vadodara geographic areas:
 * - Bus 01 (Route 101): Central East (Sayajigunj, Station, Alkapuri, Akota) - 50 students
 * - Bus 02 (Route 202): North Hub (Fatehgunj, MSU Hostel, Nizampura, Gotri, Sevasi) - 50 students
 * - Bus 03 (Route 303): South Hub (Manjalpur, Makarpura, Tandalja, Sun Pharma) - 50 students
 * - Bus 04 (Route 404): West Corridor (Subhanpura, Gorwa, Old Padra Road, Vasna) - 50 students
 * 
 * Timetable breakdown:
 * - Regular classes: 10:00 AM - 5:00 PM
 * - Morning Elective: 8:00 AM - 10:00 AM (~45 students opted)
 * - Evening Elective: 5:00 PM - 7:00 PM (~38 students opted)
 * - Both Electives: ~12 students opted
 * - Midday Break (1:00 PM - 2:00 PM): On-demand early departures & afternoon arrivals booked
 */

const firstNames = [
  "Aarav", "Diya", "Rohan", "Ananya", "Devansh", "Pooja", "Harshil", "Sneha",
  "Karan", "Ishita", "Yash", "Riya", "Aditya", "Tanvi", "Pranav", "Khushi",
  "Dhruv", "Bhavya", "Siddharth", "Mitali", "Jay", "Nehal", "Nikhil", "Urvi",
  "Parth", "Drashti", "Chirag", "Jhanvi", "Hardik", "Avani", "Manan", "Hiral",
  "Deep", "Kruti", "Tirth", "Shreya", "Kavya", "Vraj", "Komal", "Aryan",
  "Simran", "Aakash", "Meera", "Varun", "Priyanka", "Samir", "Kinjal", "Rahul",
  "Disha", "Soham"
];

const lastNames = [
  "Patel", "Shah", "Mehta", "Desai", "Joshi", "Parikh", "Vora", "Dave",
  "Trivedi", "Solanki", "Parmar", "Panchal", "Bhatt", "Chauhan", "Modi", "Rathod",
  "Baria", "Vankar", "Gajjar", "Soni", "Doshi", "Gandhi", "Thakkar", "Pandya",
  "Kapadia", "Zaveri", "Kulkarni", "Iyer", "Nair", "Sharma"
];

function generate200Students() {
  const students = [];

  const routeConfigs = [
    {
      busId: "bus-01",
      routeId: "route-101",
      routeName: "Route 101 - Sayajigunj & Alkapuri Express",
      areas: [
        { name: "Vadodara Central Station (Sayajigunj)", stopId: "stop-01" },
        { name: "Alkapuri (RC Dutt Road / Inox)", stopId: "stop-02" },
        { name: "Akota Stadium & Char Rasta", stopId: "stop-03" }
      ]
    },
    {
      busId: "bus-02",
      routeId: "route-202",
      routeName: "Route 202 - Fatehgunj, Gotri & Sevasi Loop",
      areas: [
        { name: "Fatehgunj (Near MSU / Hostel Hub)", stopId: "stop-06" },
        { name: "Nizampura / Karelibaug Circle", stopId: "stop-12" },
        { name: "Gotri Medical College & Hospital", stopId: "stop-07" },
        { name: "Sevasi Canal Char Rasta", stopId: "stop-08" }
      ]
    },
    {
      busId: "bus-03",
      routeId: "route-303",
      routeName: "Route 303 - Manjalpur & Sun Pharma South Shuttle",
      areas: [
        { name: "Manjalpur (Shreyas School Char Rasta)", stopId: "stop-09" },
        { name: "Makarpura GIDC Bus Depot", stopId: "stop-13" },
        { name: "Sun Pharma Road (Tandalja Junction)", stopId: "stop-10" },
        { name: "Vasna Road (D-Mart / Ashwamegh)", stopId: "stop-05" }
      ]
    },
    {
      busId: "bus-04",
      routeId: "route-404",
      routeName: "Route 404 - Subhanpura, Gorwa & West Connector",
      areas: [
        { name: "Subhanpura (High Tension Road / Atithi)", stopId: "stop-14" },
        { name: "Gorwa BIDC & Panchvati Circle", stopId: "stop-15" },
        { name: "Old Padra Road (Bird Circle / Tube Co)", stopId: "stop-04" },
        { name: "Bhayli Village Junction", stopId: "stop-16" }
      ]
    }
  ];

  let studentCount = 0;

  routeConfigs.forEach((config, rIdx) => {
    // 50 students per route/bus = 200 total
    for (let i = 0; i < 50; i++) {
      studentCount++;
      const idNum = String(studentCount).padStart(3, "0");
      const firstName = firstNames[(studentCount * 3 + rIdx * 7) % firstNames.length];
      const lastName = lastNames[(studentCount * 5 + rIdx * 11) % lastNames.length];
      const name = `${firstName} ${lastName}`;
      const rollNumber = `NUV24CS${idNum}`;
      const email = `student.${firstName.toLowerCase()}.${idNum}@nuv.ac.in`;

      // Area assignment along the route
      const areaObj = config.areas[i % config.areas.length];

      // Electives distribution:
      // ~22% have morning elective (8 AM - 10 AM)
      // ~18% have evening elective (5 PM - 7 PM)
      // ~6% have both
      const hasMorningElective = (studentCount % 4 === 1) || (studentCount % 9 === 0);
      const hasEveningElective = (studentCount % 5 === 2) || (studentCount % 11 === 0);

      // Midday Break Travel Options:
      // Some students book to leave earlier at break (1:05 PM) or arrive for afternoon session (1:15 PM)
      let middayBooking = null;
      if (studentCount % 14 === 3) {
        middayBooking = {
          type: "EARLY_EXIT",
          label: "Early Exit in Break (1:05 PM Departure from Bhayli Campus)",
          departureTime: "01:05 PM",
          busId: config.busId,
          dropStopId: areaObj.stopId,
          dropStopName: areaObj.name,
          seatNumber: `${(i % 13) + 1}${['A', 'B', 'C', 'D'][i % 4]}`,
          status: "CONFIRMED",
          bookingRef: `MD-EXIT-${idNum}`
        };
      } else if (studentCount % 14 === 7) {
        middayBooking = {
          type: "AFTERNOON_ARRIVAL",
          label: "Afternoon Arrival in Break (1:15 PM Pickup -> 1:55 PM Campus)",
          pickupTime: "01:15 PM",
          busId: config.busId,
          pickupStopId: areaObj.stopId,
          pickupStopName: areaObj.name,
          seatNumber: `${(i % 13) + 1}${['A', 'B', 'C', 'D'][(i + 1) % 4]}`,
          status: "CONFIRMED",
          bookingRef: `MD-ARR-${idNum}`
        };
      }

      const row = (i % 13) + 1;
      const col = ['A', 'B', 'C', 'D'][i % 4];
      const bookedSeatNumber = `${row}${col}`;

      students.push({
        id: `usr-student-${idNum}`,
        name,
        email,
        rollNumber,
        password: "student123",
        role: "student",
        phone: `+91 98${(studentCount * 37 + 10000000).toString().slice(0, 8)}`,
        assignedBusId: config.busId,
        assignedRouteId: config.routeId,
        areaName: areaObj.name,
        pickupStopId: areaObj.stopId,
        isTravellingToday: (studentCount % 12 !== 0), // ~92% travelling today
        bookedSeatNumber: (studentCount % 12 !== 0) ? bookedSeatNumber : null,
        favouriteStopId: areaObj.stopId,
        favouriteRouteId: config.routeId,
        hasMorningElective,
        hasEveningElective,
        timetableType: hasMorningElective && hasEveningElective
          ? "FULL_ELECTIVE"
          : hasMorningElective
          ? "MORNING_ELECTIVE"
          : hasEveningElective
          ? "EVENING_ELECTIVE"
          : "REGULAR",
        morningShift: hasMorningElective
          ? "EARLY_8AM"
          : (middayBooking && middayBooking.type === "AFTERNOON_ARRIVAL" ? "AFTERNOON_2PM" : "REGULAR_10AM"),
        returnShift: "EVENING_7PM",
        commuteSchedule: {
          arrivalTime: (studentCount % 4 === 1) ? "07:00 AM" : (studentCount % 5 === 2) ? "01:00 PM" : "09:00 AM",
          departureTime: "07:00 PM",
          status: "CONFIRMED"
        },
        middayBooking
      });
    }
  });

  return students;
}

module.exports = {
  generate200Students
};
