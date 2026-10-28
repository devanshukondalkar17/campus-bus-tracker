# ⚡ Navrachana University (NUV) Transit AI
### Real-Time AI Dispatch & Autonomous Fleet Operations Engine (Vadodara)

> An enterprise-grade, real-time college bus operations and passenger intelligence system customized for **Navrachana University (Vasna-Bhayli Road, Vadodara)** to connect student commuter corridors across Vadodara using predictive AI dispatching, crowd forecasting, and live telematics.

---

## 🔑 Demo Access Credentials (1-Click Login Available in UI)

You can click the user avatar in the navbar for **1-Click Instant Demo Login**, or use the credentials below:

| Role | Email / Roll Number | Password | Assigned Route / Bus |
| :--- | :--- | :--- | :--- |
| **Student** | `student.aarav@nuv.ac.in` (Roll: `NUV23CS101`) | `student123` | Route 101 (Sayajigunj) / `NUV-Titan-101` |
| **Driver** | `driver.ramesh@nuv.ac.in` | `driver123` | `GJ-06-AZ-1092` (`NUV-Titan-101`) |
| **Admin** | `admin@nuv.ac.in` | `admin123` | All Vadodara Fleet Corridors |

---

## 🌟 Implemented Features

### 1. 🎓 Student Features
* **Authentication**: Register & Login with college email (`@nuv.ac.in`) or University Roll Number (`NUV23CS101`).
* **Student Dashboard**: Shows assigned bus (`NUV-Titan-101`), pickup stop (Sayajigunj / Vadodara Station), and live ETA countdown.
* **Live GPS on Vadodara Map**: 1Hz real-time vehicle movement towards Bhayli campus.
* **Seat Availability Indicator**: Real-time counter (e.g. *18 seats remaining*) with dynamic color status (🟢 Plenty, 🟡 Filling, 🔴 Full).
* **Interactive 2x2 Bus Seat Map**: Visual cabin interior (Rows 1-10, columns A, B, C, D) with atomic reservation and double-booking prevention.
* **"Travelling Today" Toggle**: Attendance switch (*"I'm travelling today / Not travelling"*) so drivers know whether to stop for you.
* **Bus Timetable & Schedule**: Morning arrival timings from Vadodara hubs and evening campus return slots.
* **"Leave-Now" Walking Buffer**: Personalized walk advisory based on current walking distance vs. incoming vehicle speed.
* **Report an Issue / Complaint**: Ticket submission for late bus, driver rash driving, or AC failure.
* **Crowdsourced Passenger Beacon**: Quick feedback chips (*"Seats Open"*, *"Extremely Packed"*, *"Traffic Jam"*).

### 2. 🚌 Driver Features
* **Vehicle Login & Assignment**: Select assigned bus from fleet roster.
* **Trip Controls**: Big **"Start Trip" / "End Trip"** toggle. Starting trip turns on automatic 1Hz GPS sharing and fires push notifications to students.
* **Passenger Counter**: Fast `+` / `-` incremental buttons updating vehicle load in real-time.
* **Student Boarding Check-In**: Boarding roster supporting Roll Number check or simulated QR scan (`/api/trip/board-student`).
* **Incident Reports**: 1-tap buttons for *Traffic Jam (+8m delay)*, *Mechanical Breakdown*, and *Road Diversions*.
* **Emergency SOS Beacon**: High-priority flashing red SOS button with siren alert sent directly to Admin dashboard.

### 3. ⚡ Admin & Operations Features
* **All Buses Live on Vadodara Map**: Centralized bird's-eye view of all active and standby buses.
* **Fleet CRUD Management**: Modal to commission new buses (Vadodara `GJ-06` plates, callsign, capacity, driver).
* **Student & Driver Management**: Assign routes, buses, and pickup stops to students.
* **Announcements Broadcast**: Compose and send push notifications targeted to *All Students*, *Route 101*, or *Drivers*.
* **Analytics & Reports**: Trips per day, fleet on-time percentage (94.2%), average occupancy, and **Export CSV Report** button (`/api/admin/export-csv`).
* **Natural Language AI Dispatcher Copilot**: Terminal prompt interface to reroute buses or mobilize standby shuttles.

### 4. 🔔 Notification System
* **In-App Notification Center**: Bell icon in navbar with real-time unread badge.
* **Event Triggers**: Alerts fired on *Trip Started*, *Bus 5 mins away from your stop*, *Delays*, *Cancellations*, and *Official Announcements*.
* **Read / Unread State**: Mark individual notification as read or "Mark All Read".

---

## 🏗️ System Architecture

```
                       ┌───────────────────────────────┐
                       │     Browser Client (React)    │
                       │  • Leaflet Interactive Map    │
                       │  • Student Portal & Seat Map  │
                       │  • Driver Cockpit & Boarding  │
                       │  • Admin Ops & Fleet CRUD     │
                       └──────────────┬────────────────┘
                                      │
                   REST APIs & Bi-Directional WebSocket (1Hz)
                                      │
                       ┌──────────────▼────────────────┐
                       │    Node.js / Express Server   │
                       │  • JWT Auth & Role Middleware │
                       │  • Telemetry Physics Engine   │
                       │  • Socket.io Event Bus        │
                       └──────────────┬────────────────┘
                                      │
            ┌─────────────────────────┴────────────────────────┐
            ▼                                                  ▼
┌───────────────────────────────┐              ┌───────────────────────────────┐
│     AI Dispatch Kernel        │              │  MongoDB / Memory Fallback    │
│  • Crowd Surge Forecasting    │              │  • Users, Roles & Passwords   │
│  • Natural Language Copilot   │              │  • Reserved Seat Manifest     │
│  • Anomaly & Delay Detection  │              │  • Notifications & Complaints │
└───────────────────────────────┘              └───────────────────────────────┘
```

---

## 🚀 How to Run the App

```bash
# 1. Install all dependencies (root, server, and client):
npm run install:all

# 2. Start both the Backend Server (port 5000) and Frontend (port 5173):
npm run dev
```

Open your browser at **`http://localhost:5173`**.

---

## 🧪 Quick Evaluator Walkthrough

1. **Test Student Seat Booking & Attendance**:
   - Stay on the **Student Portal** (logged in as `Aarav Sharma - NUV23CS101`).
   - Click **"Select Seat on Map"** ➔ pick an available green seat (e.g., `4C`) ➔ click **"Confirm Seat"**.
   - Toggle **"Travelling Today"** to see your attendance state update.
   - Click **"Bus Schedule"** to review morning & evening arrival times across Vadodara.
2. **Test Driver Trip & Student Boarding**:
   - Switch to the **"Driver Cockpit"** tab.
   - Click **"Start Trip"** to broadcast GPS live.
   - Use the `+` / `-` buttons to adjust passengers.
   - Enter `NUV23CS102` in the boarding input and click **"Verify"** to simulate checking in a student!
   - Click **"🚨 Emergency SOS"** to hear the alert chime and broadcast the alarm.
3. **Test Admin Fleet CRUD & Announcements**:
   - Switch to the **"AI Ops Center"** tab.
   - Click **"Fleet CRUD & Announcements"** ➔ go to **"Broadcast Announcement"** ➔ post an announcement.
   - Click the **Bell Icon** in the top navbar to see your new notification appear with an unread badge!
   - Click **"Export CSV"** to download the live fleet analytics sheet.
