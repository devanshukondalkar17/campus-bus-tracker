import React, { useState, useEffect } from 'react';
import Navbar from './components/Navbar';
import LiveMap from './components/LiveMap';
import AdminOpsDashboard from './components/AdminOpsDashboard';
import StudentPortal from './components/StudentPortal';
import DriverSimulator from './components/DriverSimulator';
import AiCopilotModal from './components/AiCopilotModal';
import AuthModal from './components/AuthModal';
import SeatMapModal from './components/SeatMapModal';
import ScheduleModal from './components/ScheduleModal';
import ComplaintModal from './components/ComplaintModal';
import NotificationCenter from './components/NotificationCenter';
import AdminManageModal from './components/AdminManageModal';
import NeobrutalistLoginGate from './components/NeobrutalistLoginGate';
import ErrorBoundary from './components/ErrorBoundary';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';
import socket from './services/socket';
import { playAlertChime } from './utils/geoHelpers';

const API_BASE = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
  ? 'http://localhost:5000/api'
  : '/api';

function MainAppShell() {
  const { isAuthModalOpen, setIsAuthModalOpen, currentUser } = useAuth();
  
  const [activeTab, setActiveTab] = useState('student'); // 'student' | 'driver' | 'admin'
  const [isCopilotOpen, setIsCopilotOpen] = useState(false);
  const [isSeatMapOpen, setIsSeatMapOpen] = useState(false);
  const [isScheduleOpen, setIsScheduleOpen] = useState(false);
  const [isComplaintOpen, setIsComplaintOpen] = useState(false);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const [isAdminManageOpen, setIsAdminManageOpen] = useState(false);
  const [seatMapBus, setSeatMapBus] = useState(null);

  const [isConnected, setIsConnected] = useState(false);
  const [buses, setBuses] = useState([]);
  const [routes, setRoutes] = useState([]);
  const [stops, setStops] = useState([]);
  const [alerts, setAlerts] = useState([]);
  const [timetableSurges, setTimetableSurges] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [schedules, setSchedules] = useState([]);
  const [selectedBusId, setSelectedBusId] = useState(null);

  // Auto-switch to user's role when user logs in
  useEffect(() => {
    if (currentUser && currentUser.role) {
      setActiveTab(currentUser.role);
    }
  }, [currentUser]);

  // Initial Data Fetch
  const fetchData = async () => {
    try {
      const res = await fetch(`${API_BASE}/fleet/overview`);
      const data = await res.json();
      if (data.success) {
        setBuses(data.buses || []);
        setRoutes(data.routes || []);
        setStops(data.stops || []);
        setAlerts(data.alerts || []);
      }

      const surgesRes = await fetch(`${API_BASE}/ai/timetable-surges`);
      const surgesData = await surgesRes.json();
      if (surgesData.success) {
        setTimetableSurges(surgesData.surges || []);
      }

      const notifRes = await fetch(`${API_BASE}/notifications`);
      const notifData = await notifRes.json();
      if (notifData.success) {
        setNotifications(notifData.notifications || []);
      }

      const schedRes = await fetch(`${API_BASE}/fleet/schedules`);
      const schedData = await schedRes.json();
      if (schedData.success) {
        setSchedules(schedData.schedules || []);
      }
    } catch (err) {
      console.warn('Initial REST fetch fallback to WebSocket stream:', err.message);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Socket.io Real-Time Streaming Subscriptions
  useEffect(() => {
    socket.on('connect', () => {
      setIsConnected(true);
    });

    socket.on('disconnect', () => {
      setIsConnected(false);
    });

    socket.on('initial_state', (payload) => {
      if (payload.buses) setBuses(payload.buses);
      if (payload.routes) setRoutes(payload.routes);
      if (payload.stops) setStops(payload.stops);
      if (payload.alerts) setAlerts(payload.alerts);
      if (payload.timetableSurges) setTimetableSurges(payload.timetableSurges);
    });

    // 1Hz Real-Time Telemetry Stream
    socket.on('telemetry_tick', (payload) => {
      if (payload.buses) setBuses(payload.buses);
    });

    // Incident / Alert broadcasts
    socket.on('incident_updated', (payload) => {
      if (payload.alerts) setAlerts(payload.alerts);
      if (payload.bus) {
        setBuses(prev => prev.map(b => b.id === payload.bus.id ? payload.bus : b));
      }
    });

    socket.on('copilot_command_executed', (payload) => {
      if (payload.buses) setBuses(payload.buses);
      if (payload.alerts) setAlerts(payload.alerts);
    });

    socket.on('stop_checkin_updated', (payload) => {
      setStops(prev => prev.map(s => s.id === payload.stopId ? { ...s, currentWaitingCount: payload.currentWaitingCount } : s));
    });

    socket.on('new_notification_broadcast', (notif) => {
      setNotifications(prev => [notif, ...prev]);
      playAlertChime('INFO');
    });

    socket.on('emergency_sos_broadcast', (payload) => {
      if (payload.alert) setAlerts(prev => [payload.alert, ...prev]);
      if (payload.notif) setNotifications(prev => [payload.notif, ...prev]);
      playAlertChime('CRITICAL');
    });

    socket.on('seat_reserved_broadcast', (payload) => {
      setBuses(prev => prev.map(b => b.id === payload.busId ? { ...b, reservedSeats: payload.reservedSeats } : b));
    });

    socket.on('route_rerouted_event', (payload) => {
      if (payload.routes) setRoutes(payload.routes);
      if (payload.stops) setStops(payload.stops);
      if (payload.buses) setBuses(payload.buses);
      if (payload.notification) {
        setNotifications(prev => [payload.notification, ...prev]);
        playAlertChime('INFO');
      }
    });

    socket.on('fleet_updated', (payload) => {
      if (payload.buses) setBuses(payload.buses);
    });

    socket.on('trip_status_changed', (payload) => {
      if (payload.bus) {
        setBuses(prev => prev.map(b => b.id === payload.bus.id ? payload.bus : b));
      }
    });

    socket.on('student_boarded_event', (payload) => {
      if (payload.stops) setStops(payload.stops);
      if (payload.currentOccupancy && payload.busId) {
        setBuses(prev => prev.map(b => b.id === payload.busId ? { ...b, currentOccupancy: payload.currentOccupancy } : b));
      }
    });

    return () => {
      socket.off('connect');
      socket.off('disconnect');
      socket.off('initial_state');
      socket.off('telemetry_tick');
      socket.off('incident_updated');
      socket.off('copilot_command_executed');
      socket.off('stop_checkin_updated');
      socket.off('new_notification_broadcast');
      socket.off('emergency_sos_broadcast');
      socket.off('seat_reserved_broadcast');
      socket.off('fleet_updated');
      socket.off('trip_status_changed');
    };
  }, []);

  // Actions
  const handleTriggerIncident = async (busId, action, delayMins = 8) => {
    try {
      const res = await fetch(`${API_BASE}/fleet/incident`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ busId, action, delayMins })
      });
      const data = await res.json();
      if (data.activeAlerts) setAlerts(data.activeAlerts);
      if (data.bus) {
        setBuses(prev => prev.map(b => b.id === busId ? data.bus : b));
      }
    } catch (err) {
      console.error('Incident trigger failed:', err);
    }
  };

  const handleResolveAlert = async (alertId) => {
    try {
      const res = await fetch(`${API_BASE}/ai/alerts/${alertId}`, { method: 'DELETE' });
      const data = await res.json();
      if (data.activeAlerts) setAlerts(data.activeAlerts);
      else setAlerts(prev => prev.filter(a => a.id !== alertId));
    } catch (err) {
      setAlerts(prev => prev.filter(a => a.id !== alertId));
    }
  };

  const handleExecuteCopilotCommand = async (prompt) => {
    const res = await fetch(`${API_BASE}/ai/copilot`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ prompt })
    });
    return await res.json();
  };

  const handleCheckInAtStop = async (stopId, studentCount = 1) => {
    try {
      const res = await fetch(`${API_BASE}/student/checkin`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ stopId, studentCount })
      });
      const data = await res.json();
      setStops(prev => prev.map(s => s.id === stopId ? { ...s, currentWaitingCount: data.currentWaitingCount } : s));
    } catch (err) {
      console.error('Check-in failed:', err);
    }
  };

  const handleSubmitReaction = async (reactionData) => {
    try {
      await fetch(`${API_BASE}/student/reaction`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(reactionData)
      });
    } catch (err) {
      console.error('Reaction submission failed:', err);
    }
  };

  const handleMarkAsRead = async (notifId) => {
    setNotifications(prev => prev.map(n => n.id === notifId ? { ...n, isRead: true } : n));
    try {
      await fetch(`${API_BASE}/notifications/${notifId}/read`, { method: 'POST' });
    } catch (e) {}
  };

  const handleMarkAllAsRead = async () => {
    setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
    try {
      await fetch(`${API_BASE}/notifications/read-all`, { method: 'POST' });
    } catch (e) {}
  };

  const handleTripToggle = (busId, start) => {
    // Strict driver authority guard: driver cannot trigger optimistic trip status for unassigned buses
    if (currentUser?.role === 'driver' && currentUser?.assignedBusId && currentUser.assignedBusId !== busId) {
      return;
    }

    setBuses(prev => prev.map(b => {
      if (b.id === busId) {
        return {
          ...b,
          tripActive: start,
          status: start ? 'EN_ROUTE' : 'STANDBY',
          speedKmH: start ? (b.speedKmH && b.speedKmH > 0 ? b.speedKmH : 34) : 0
        };
      }
      return b;
    }));
  };

  const unreadCount = notifications.filter(n => !n.isRead).length;

  // ---------------------------------------------------------------
  // 1. IF NOT LOGGED IN: SHOW NEOBRUTALIST BENTO LOGIN GATEWAY
  // ---------------------------------------------------------------
  if (!currentUser) {
    return (
      <NeobrutalistLoginGate
        onSelectRoleDirect={(role) => setActiveTab(role)}
      />
    );
  }

  const userRole = currentUser ? currentUser.role : 'student';
  const currentView = userRole === 'student' ? 'student' : userRole === 'driver' ? 'driver' : activeTab;

  // ---------------------------------------------------------------
  // 2. IF LOGGED IN: RENDER RESPECTIVE NEOBRUTALIST BENTO DASHBOARD
  // ---------------------------------------------------------------
  return (
    <div className="neo-app-wrapper">
      {/* Top Neobrutalist Navbar */}
      <Navbar
        activeTab={currentView}
        setActiveTab={setActiveTab}
        onOpenCopilot={() => setIsCopilotOpen(true)}
        onOpenNotifications={() => setIsNotificationsOpen(true)}
        unreadNotifCount={unreadCount}
        alertCount={alerts.length}
        isConnected={isConnected}
      />

      {/* Main Bento Workspace */}
      <main className="neo-main-content">
        <div className="neo-bento-layout">
          {/* Bento Tile 1: Live Interactive Vadodara Map (Hero Visual) */}
          <div className="neo-bento-tile neo-tile-map">
            <div className="neo-tile-header">
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span className="neo-tag neo-tag-emerald" style={{ fontSize: '0.68rem', padding: '2px 8px' }}>
                  Live Telemetry 1Hz
                </span>
                <span style={{ fontSize: '0.82rem', color: '#ffffff', fontWeight: 600 }}>
                  Vadodara Metropolitan Transit Corridor • To Bhayli Campus
                </span>
              </div>
              <span style={{ fontSize: '0.72rem', color: '#94a3b8' }}>
                Navrachana Fleet Engine
              </span>
            </div>
            <LiveMap
              buses={buses}
              routes={routes}
              stops={stops}
              selectedBusId={selectedBusId}
              onSelectBus={id => setSelectedBusId(id)}
              currentRole={currentView}
              currentUser={currentUser}
              onTripToggle={handleTripToggle}
            />
          </div>

          {/* Bento Tile 2: Dynamic Role Operations Control Center (Strictly Role-Gated) */}
          <div className="neo-bento-tile neo-tile-panel">
            {currentView === 'student' && (
              <StudentPortal
                buses={buses}
                routes={routes}
                stops={stops}
                schedules={schedules}
                onCheckInAtStop={handleCheckInAtStop}
                onSubmitReaction={handleSubmitReaction}
                onOpenSeatMap={(bus) => {
                  setSeatMapBus(bus || buses[0]);
                  setIsSeatMapOpen(true);
                }}
                onOpenSchedule={() => setIsScheduleOpen(true)}
                onOpenComplaint={() => setIsComplaintOpen(true)}
              />
            )}

            {currentView === 'driver' && (
              <DriverSimulator
                buses={buses}
                routes={routes}
                stops={stops}
                currentUser={currentUser}
                onTriggerIncident={handleTriggerIncident}
              />
            )}

            {currentView === 'admin' && (
              <AdminOpsDashboard
                buses={buses}
                routes={routes}
                stops={stops}
                alerts={alerts}
                timetableSurges={timetableSurges}
                onTriggerIncident={handleTriggerIncident}
                onResolveAlert={handleResolveAlert}
                onOpenCopilot={() => setIsCopilotOpen(true)}
                onOpenManageModal={() => setIsAdminManageOpen(true)}
                selectedBusId={selectedBusId}
                onSelectBus={id => setSelectedBusId(id)}
              />
            )}
          </div>
        </div>
      </main>

      {/* Modals & Overlays (Strictly Role-Gated) */}
      {currentUser && currentUser.role === 'admin' && (
        <AiCopilotModal
          isOpen={isCopilotOpen}
          onClose={() => setIsCopilotOpen(false)}
          onExecuteCommand={handleExecuteCopilotCommand}
        />
      )}

      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
      />

      <SeatMapModal
        isOpen={isSeatMapOpen}
        onClose={() => setIsSeatMapOpen(false)}
        bus={seatMapBus || buses[0]}
        onSeatUpdated={fetchData}
      />

      <ScheduleModal
        isOpen={isScheduleOpen}
        onClose={() => setIsScheduleOpen(false)}
        schedules={schedules}
        onOpenBooking={() => {
          setActiveTab('student');
        }}
      />

      <ComplaintModal
        isOpen={isComplaintOpen}
        onClose={() => setIsComplaintOpen(false)}
        buses={buses}
      />

      <NotificationCenter
        isOpen={isNotificationsOpen}
        onClose={() => setIsNotificationsOpen(false)}
        notifications={notifications}
        onMarkAsRead={handleMarkAsRead}
        onMarkAllAsRead={handleMarkAllAsRead}
      />

      {currentUser && currentUser.role === 'admin' && (
        <AdminManageModal
          isOpen={isAdminManageOpen}
          onClose={() => setIsAdminManageOpen(false)}
          buses={buses}
          routes={routes}
          stops={stops}
          onFleetUpdated={fetchData}
        />
      )}
    </div>
  );
}

export default function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider>
        <AuthProvider>
          <MainAppShell />
        </AuthProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}
